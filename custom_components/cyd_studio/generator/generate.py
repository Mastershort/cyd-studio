"""Project -> ESPHome YAML."""

from __future__ import annotations

import base64
import gzip
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any

from .board import resolve_board
from .context import ON_STATES, Context, cpp_str
from .emit import Block, Comment, Lambda, Raw, Secret, dump
from .layout import (
    HEADER_PAD_X,
    LIGHT_ROWS,
    TILE_PAD,
    header_elements,
    light_overlay_layout,
    message_layout,
    nav_pages,
    overlay_layout,
    page_layout,
    tab_elements,
)
from .logic import apply_logic
from .memory import MemoryEstimate, estimate
from .model import Issue, normalize, safe_id, validate
from .theme import hex_color, resolve_theme
from .widgets import EMITTERS
from .widgets.basic import TIME_FORMATS, time_lambda
from .widgets.common import opa, page_show, widget_id

GENERATOR_VERSION = "0.8.0"
ESPHOME_MIN_VERSION = "2026.9.0"
ROUNDTRIP_PREFIX = "# cyd_studio_project: "
CHECKSUM_PREFIX = "# cyd_studio_checksum: "
REFERENCE_CREDIT = (
    "Hardware-Grundkonfiguration nach github.com/akuehlewind/ESPHome-touch-display-mount "
    "(MIT, (c) 2023 Adrian Kuehlewind)"
)


@dataclass
class GenerateResult:
    """Result of a generator run."""

    yaml: str
    issues: list[Issue] = field(default_factory=list)
    memory: MemoryEstimate | None = None

    @property
    def ok(self) -> bool:
        """True if no error blocks the export."""
        return not any(i.level == "error" for i in self.issues)

    def as_dict(self) -> dict[str, Any]:
        """Serialize for the WebSocket API."""
        return {
            "ok": self.ok,
            "yaml": self.yaml,
            "issues": [i.as_dict() for i in self.issues],
            "memory": self.memory.as_dict() if self.memory else None,
        }


def ordered_pages(project: dict[str, Any]) -> list[dict[str, Any]]:
    """LVGL page order: navigation pages, other main pages, then sub pages."""
    nav = nav_pages(project)
    nav_ids = {p["id"] for p in nav}
    main = [p for p in project["pages"] if not p.get("parent") and p["id"] not in nav_ids]
    sub = [p for p in project["pages"] if p.get("parent")]
    return nav + main + sub


def root_of(project: dict[str, Any], page: dict[str, Any]) -> dict[str, Any]:
    """Top level ancestor of a page."""
    by_id = {p["id"]: p for p in project["pages"]}
    seen = set()
    while page.get("parent") and page["parent"] in by_id and page["id"] not in seen:
        seen.add(page["id"])
        page = by_id[page["parent"]]
    return page


def encode_project(project: dict[str, Any]) -> str:
    """Deterministic base64(gzip(json)) of the project for the round-trip block."""
    raw = json.dumps(project, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return base64.b64encode(gzip.compress(raw, compresslevel=9, mtime=0)).decode("ascii")


def decode_project(text: str) -> dict[str, Any] | None:
    """Extract the project from a generated YAML file (round-trip import)."""
    chunks: list[str] = []
    collecting = False
    for line in text.splitlines():
        if line.startswith(ROUNDTRIP_PREFIX):
            collecting = True
            chunks.append(line[len(ROUNDTRIP_PREFIX) :].strip())
        elif collecting and line.startswith("#   "):
            chunks.append(line[4:].strip())
        elif collecting:
            break
    if not chunks:
        return None
    data: dict[str, Any] = json.loads(gzip.decompress(base64.b64decode("".join(chunks))).decode("utf-8"))
    return data


def body_checksum(body: str) -> str:
    """Checksum of the generated part (detects manual edits)."""
    return hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]


def split_generated(text: str) -> tuple[str, str | None]:
    """Split a generated file into body and stored checksum."""
    marker = text.find("\n" + CHECKSUM_PREFIX)
    if marker < 0:
        return text, None
    body = text[: marker + 1]
    rest = text[marker + 1 + len(CHECKSUM_PREFIX) :]
    return body, rest.split("\n", 1)[0].strip()


def generate_yaml(
    project: dict[str, Any],
    boards: dict[str, dict[str, Any]],
    themes: dict[str, dict[str, Any]],
    widget_defs: dict[str, dict[str, Any]],
    known_entities: set[str] | None = None,
) -> GenerateResult:
    """Generate the ESPHome configuration for a project."""
    project = normalize(project)
    issues = validate(project, widget_defs, boards, themes, known_entities)
    if any(i.level == "error" for i in issues):
        return GenerateResult("", issues)

    board = resolve_board(boards[project["board"]], project.get("board_variant"), project["orientation"])
    theme = resolve_theme(themes[project["theme"]], project.get("theme_overrides"))
    ctx = Context(project, board, theme, widget_defs)
    doc = _document(ctx)
    body = _header_comment(ctx) + dump(doc)
    footer = CHECKSUM_PREFIX + body_checksum(body) + "\n"
    encoded = encode_project(project)
    lines = [encoded[i : i + 76] for i in range(0, len(encoded), 76)]
    footer += "\n# Projektdaten für den Import in CYD Studio (nicht bearbeiten)\n"
    footer += ROUNDTRIP_PREFIX + lines[0] + "\n" + "".join(f"#   {chunk}\n" for chunk in lines[1:])

    issues.extend(ctx.issues)
    if ctx.fonts.missing:
        chars = " ".join(sorted(ctx.fonts.missing))
        issues.append(
            Issue(
                "warning",
                "glyph_missing",
                f"Diese Zeichen kann das Display nicht darstellen und werden ausgelassen: {chars}",
                f"The display cannot show these characters, they are left out: {chars}",
            )
        )
    image_flash = len(ctx.images) * board["screen"]["width"] * board["screen"]["height"] * 2
    mem = estimate(
        ctx.objects,
        len(project["pages"]),
        ctx.fonts.flash_estimate() + image_flash,
        int(board.get("memory_budget", 100000)),
    )
    if len(ctx.images) > 2:
        issues.append(Issue(
            "warning", "images_flash",
            f"{len(ctx.images)} Hintergrundbilder belegen ca. {image_flash // 1024} KB Flash – "
            "bei zu vielen Bildern passt die Firmware nicht mehr aufs Board.",
            f"{len(ctx.images)} background images use about {image_flash // 1024} KB of flash – "
            "with too many images the firmware no longer fits the board.",
        ))  # fmt: skip
    if mem.ratio > 1:
        issues.append(
            Issue(
                "warning",
                "memory",
                f"Zu viele Widgets für den Speicher dieses Boards (ca. {mem.objects} Objekte, "
                f"{mem.ratio:.0%} des Budgets) – Seiten oder Widgets reduzieren.",
                f"Too many widgets for this board's memory (about {mem.objects} objects, "
                f"{mem.ratio:.0%} of the budget) – reduce pages or widgets.",
            )
        )
    return GenerateResult(body + footer, issues, mem)


# ---------------------------------------------------------------------------


def _header_comment(ctx: Context) -> str:
    p = ctx.project
    board = ctx.board
    updated = p.get("meta", {}).get("updated", "")
    lines = [
        "=" * 70,
        f"Erzeugt von CYD Studio (Generator {GENERATOR_VERSION}) – ESPHome >= {ESPHOME_MIN_VERSION}",
        f"Projekt: {p['name']} · Board: {board['name']}",
    ]
    if updated:
        lines.append(f"Stand: {updated}")
    lines += [
        "",
        "Änderungen bitte in CYD Studio vornehmen – sonst werden sie beim",
        "nächsten Export überschrieben.",
        "",
        "WLAN-Zugangsdaten kommen aus secrets.yaml (wifi_ssid, wifi_password).",
        "In Home Assistant beim ESPHome-Gerät „Dem Gerät erlauben,",
        "Home-Assistant-Aktionen auszuführen“ aktivieren – sonst reagieren",
        "die Schalter nicht.",
        "",
        REFERENCE_CREDIT,
        "=" * 70,
    ]
    return "".join(f"# {line}".rstrip() + "\n" for line in lines) + "\n"


def _document(ctx: Context) -> dict[Any, Any]:
    p = ctx.project
    s = p["settings"]
    board = ctx.board
    de = ctx.lang == "de"
    pages = ordered_pages(p)
    width, height = board["screen"]["width"], board["screen"]["height"]

    lvgl_pages = [_page(ctx, page, index, pages, width, height) for index, page in enumerate(pages)]
    top_layer = _top_layer(ctx, pages, width, height)

    doc: dict[Any, Any] = {}
    doc["substitutions"] = {
        "device_name": p["device_name"],
        "friendly_name": p["name"],
    }
    for entity, key in sorted(ctx.entities.items(), key=lambda kv: kv[1]):
        doc["substitutions"][key] = entity

    brightness_day = max(1, min(int(s.get("brightness_day", 100)), 100))
    on_boot: list[Any] = [{"light.turn_on": {"id": "backlight", "brightness": f"{brightness_day}%"}}]
    if ctx.time_updates:
        on_boot.append({"script.execute": "cyd_update_time"})
    home_index = next(i for i, pg in enumerate(pages) if pg["id"] == p["navigation"]["home_page"])
    if home_index != 0:
        on_boot.append({"lvgl.page.show": ctx.page_ids[p["navigation"]["home_page"]]})
    doc["esphome"] = {
        "name": "${device_name}",
        "friendly_name": "${friendly_name}",
        "min_version": ESPHOME_MIN_VERSION,
        "on_boot": {"priority": -100, "then": on_boot},
    }
    doc["esp32"] = {"board": board["board"], "framework": {"type": board.get("framework", "arduino")}}
    doc["logger"] = None

    api: dict[str, Any] = {}
    api_key = s.get("api_key")
    if api_key:
        api["encryption"] = {"key": api_key}
    if s.get("device_actions", True):
        api["actions"] = _device_actions(ctx, pages, brightness_day)
    doc["api"] = api or None
    ota: dict[str, Any] = {"platform": "esphome", "id": "cyd_ota"}
    if api_key:
        ota["encryption"] = None
    doc["ota"] = [ota]
    wifi: dict[str, Any] = {"ssid": Secret("wifi_ssid"), "password": Secret("wifi_password")}
    if s.get("wifi", {}).get("ap_fallback", True):
        wifi["ap"] = {"ssid": (p["name"][:20] + " Fallback").strip()}
    doc["wifi"] = wifi
    if s.get("wifi", {}).get("ap_fallback", True):
        doc["captive_portal"] = None

    # globals
    glob: list[Any] = [
        {"id": "cyd_page", "type": "int", "restore_value": False, "initial_value": "0"},
    ]
    screensaver = s.get("screensaver", {})
    if screensaver.get("enabled"):
        glob.append({"id": "cyd_dimmed", "type": "bool", "restore_value": False, "initial_value": "false"})
    glob.extend(_helper_globals(ctx))
    doc["globals"] = glob

    # time
    time_conf: dict[str, Any] = {"platform": "homeassistant", "id": "ha_time"}
    if ctx.time_updates:
        time_conf["on_time_sync"] = {"then": [{"script.execute": "cyd_update_time"}]}
        every = {"seconds": "/1"} if ctx.needs_seconds else {"seconds": 0, "minutes": "/1"}
        time_conf["on_time"] = [{**every, "then": [{"script.execute": "cyd_update_time"}]}]
    doc["time"] = [time_conf]

    # hardware
    disp = board["display"]
    touch = board["touch"]
    doc["spi"] = [
        {
            "id": "spi_display",
            "clk_pin": disp["spi"]["clk"],
            "mosi_pin": disp["spi"]["mosi"],
            **({"miso_pin": disp["spi"]["miso"]} if disp["spi"].get("miso") else {}),
        },
        {
            "id": "spi_touch",
            "clk_pin": touch["spi"]["clk"],
            "mosi_pin": touch["spi"]["mosi"],
            "miso_pin": touch["spi"]["miso"],
        },
    ]
    strapping = set(disp.get("strapping_pins", []))

    def pin(number: int) -> Any:
        if number in strapping:
            return {"number": number, "ignore_strapping_warning": True}
        return number

    display: dict[str, Any] = {
        "platform": disp["platform"],
        "id": "cyd_display",
        "spi_id": "spi_display",
        "model": disp["model"],
    }
    if disp.get("color_order"):
        display["color_order"] = disp["color_order"]
    if disp.get("data_rate"):
        display["data_rate"] = disp["data_rate"]
    display.update(
        {
            "cs_pin": pin(disp["cs"]),
            "dc_pin": pin(disp["dc"]),
            "invert_colors": bool(disp.get("invert_colors", False)),
            "update_interval": "never",
            "auto_clear_enabled": False,
        }
    )
    doc["display"] = [display]

    touch_conf: dict[str, Any] = {
        "platform": touch["platform"],
        "id": "cyd_touch",
        "spi_id": "spi_touch",
        "cs_pin": touch["cs"],
        "interrupt_pin": touch["irq"],
        "update_interval": touch.get("update_interval", "50ms"),
        "threshold": touch.get("threshold", 400),
        "calibration": dict(touch["calibration"]),
        "transform": dict(touch["transform"]),
    }
    if screensaver.get("enabled"):
        touch_conf["on_touch"] = [
            {
                "if": {
                    "condition": {"lambda": Lambda("return id(cyd_dimmed);")},
                    "then": [
                        {"lambda": Lambda("id(cyd_dimmed) = false;")},
                        {"light.turn_on": {"id": "backlight", "brightness": f"{brightness_day}%"}},
                    ],
                }
            }
        ]
    doc["touchscreen"] = [touch_conf]

    outputs: list[Any] = [{"platform": "ledc", "pin": board["backlight"]["pin"], "id": "backlight_pwm"}]
    lights: list[Any] = [
        {
            "platform": "monochromatic",
            "output": "backlight_pwm",
            "name": "Display-Beleuchtung" if de else "Display backlight",
            "id": "backlight",
            "restore_mode": "ALWAYS_ON",
        }
    ]
    led = board.get("extras", {}).get("rgb_led")
    if led and s.get("rgb_led", {}).get("enabled"):
        for color, key in (("red", "r"), ("green", "g"), ("blue", "b")):
            outputs.append(
                {"platform": "ledc", "id": f"led_{color}", "pin": led[key], "inverted": bool(led.get("inverted"))}
            )
        lights.append(
            {
                "platform": "rgb",
                "name": "Status-LED" if de else "Status LED",
                "id": "status_led",
                "red": "led_red",
                "green": "led_green",
                "blue": "led_blue",
                "restore_mode": "ALWAYS_OFF",
            }
        )
    doc["output"] = outputs
    doc["light"] = lights

    # Home Assistant mirrors + diagnostics
    sensors: list[Any] = [
        {
            "platform": "wifi_signal",
            "name": "WLAN-Signal" if de else "WiFi signal",
            "update_interval": "60s",
            "entity_category": "diagnostic",
        },
        {
            "platform": "uptime",
            "name": "Laufzeit" if de else "Uptime",
            "update_interval": "60s",
            "entity_category": "diagnostic",
        },
    ]
    text_sensors: list[Any] = []
    for src in ctx.sources.values():
        conf: dict[str, Any] = {"platform": "homeassistant", "id": src.id, "entity_id": ctx.ent(src.entity)}
        if src.attribute:
            conf["attribute"] = src.attribute
        conf["on_value"] = {"then": src.actions}
        (sensors if src.kind == "number" else text_sensors).append(conf)
    doc["sensor"] = sensors
    if text_sensors:
        doc["text_sensor"] = text_sensors
    doc["button"] = [{"platform": "restart", "name": "Neustart" if de else "Restart", "entity_category": "diagnostic"}]

    if ctx.images:
        w, h = board["screen"]["width"], board["screen"]["height"]
        doc["image"] = [
            {"file": f"cyd_studio/{p['device_name']}/{asset}.png", "id": f"img_{asset}", "type": "RGB565",
             "resize": f"{w}x{h}"}
            for asset in ctx.images
        ]  # fmt: skip
    doc["font"] = ctx.fonts.emit()
    doc["script"] = _scripts(ctx, pages)
    doc["lvgl"] = _lvgl(ctx, pages, lvgl_pages, top_layer)
    return doc


STATE_HELPER_TYPE = (
    "std::function<void(lv_obj_t *, lv_obj_t *, lv_obj_t *, lv_obj_t *, lv_obj_t *, const std::string &, float, int, "
    "const char *, const char *, const uint32_t *)>"
)
PERCENT_TEXT = 'char buf[12];\nsnprintf(buf, sizeof(buf), "%d %%", (int) lroundf({v}));\nreturn std::string(buf);'


def _helper_globals(ctx: Context) -> list[Any]:
    """Shared C++ helpers, so each tile needs one line of code instead of its own copy of the logic."""
    out: list[Any] = []
    if "state" in ctx.helpers:
        s = ctx.strings
        names = [(k, s[k]) for k in ("on", "off", "open", "closed", "locked", "unlocked")]
        mapping = "\n".join(f'  else if (x == "{k}") text = {cpp_str(v)};' for k, v in names)
        on_expr = " || ".join(f'x == "{st}"' for st in ON_STATES)
        code = "\n".join(
            [
                "[](lv_obj_t *tile, lv_obj_t *icon, lv_obj_t *title, lv_obj_t *label, lv_obj_t *circle,",
                "    const std::string &x, float value, int kind, const char *text_on, const char *text_off,",
                "    const uint32_t *c) {",
                "  // Tile state: checked when on/open, disabled when unavailable; colors c[] = on/off pairs of",
                "  // icon, title, state text, icon circle. kind: 1 = brightness 0..255, 2/3 = percent, 0 = text only",
                f"  const bool on = {on_expr};",
                "  const int k = on ? 0 : 1;",
                "  if (tile != nullptr) {",
                "    lv_obj_set_state(tile, LV_STATE_CHECKED, on);",
                '    lv_obj_set_state(tile, LV_STATE_DISABLED, x == "unavailable");',
                "  }",
                "  if (icon != nullptr) lv_obj_set_style_text_color(icon, lv_color_hex(c[k]), LV_PART_MAIN);",
                "  if (title != nullptr) lv_obj_set_style_text_color(title, lv_color_hex(c[2 + k]), LV_PART_MAIN);",
                "  if (circle != nullptr) lv_obj_set_style_bg_color(circle, lv_color_hex(c[6 + k]), LV_PART_MAIN);",
                "  if (label == nullptr) return;",
                "  lv_obj_set_style_text_color(label, lv_color_hex(c[4 + k]), LV_PART_MAIN);",
                "  std::string text;",
                "  if (on && kind > 0 && !std::isnan(value)) {",
                "    char buf[12];",
                '    snprintf(buf, sizeof(buf), "%d %%", (int) lroundf(kind == 1 ? value * 100.0f / 255.0f : value));',
                "    text = buf;",
                "  }",
                f'  else if (x == "unavailable") text = {cpp_str(s["unavailable"])};',
                f'  else if (x.empty() || x == "unknown") text = {cpp_str(s["unknown"])};',
                f'  else if (x == "opening") text = {cpp_str(s["opening"])};',
                f'  else if (x == "closing") text = {cpp_str(s["closing"])};',
                "  else if (on && text_on != nullptr) text = text_on;",
                "  else if (!on && text_off != nullptr) text = text_off;",
                mapping,
                "  else text = x;",
                "  lv_label_set_text(label, text.c_str());",
                "}",
            ]
        )
        out.append(
            {"id": "cyd_tile_state", "type": STATE_HELPER_TYPE, "restore_value": False, "initial_value": Block(code)}
        )
    if "overlay" in ctx.helpers:
        percent = "\n".join(
            [
                "[](const std::string &state, float value, int kind) -> float {",
                "  // Start value of the slider in percent (lights and fans: 0 when off)",
                "  if (std::isnan(value)) return 0.0f;",
                '  if (kind != 2 && state != "on") return 0.0f;',
                "  return kind == 1 ? value * 100.0f / 255.0f : value;",
                "}",
            ]
        )
        out.append(
            {
                "id": "cyd_percent",
                "type": "std::function<float(const std::string &, float, int)>",
                "restore_value": False,
                "initial_value": Block(percent),
            }
        )
        out.append({"id": "cyd_ov_entity", "type": "std::string", "restore_value": False})
        out.append({"id": "cyd_ov_kind", "type": "int", "restore_value": False, "initial_value": "0"})
    if "light_overlay" in ctx.helpers:
        out.append({"id": "cyd_li_sat", "type": "float", "restore_value": False, "initial_value": "100.0f"})
    if "time_parse" in ctx.helpers:
        parse_time = "\n".join(
            [
                "[](const std::string &s) -> long {",
                "  // ISO date/time from Home Assistant -> UTC epoch seconds (-1 if not parseable)",
                "  int y, mo, d, h, mi, se;",
                "  char sep;",
                '  if (sscanf(s.c_str(), "%d-%d-%d%c%d:%d:%d", &y, &mo, &d, &sep, &h, &mi, &se) != 7) return -1;',
                "  y -= mo <= 2;",
                "  const long era = (y >= 0 ? y : y - 399) / 400;",
                "  const long yoe = y - era * 400;",
                "  const long doy = (153 * (mo + (mo > 2 ? -3 : 9)) + 2) / 5 + d - 1;",
                "  const long doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;",
                "  const long t = (era * 146097 + doe - 719468) * 86400L + h * 3600L + mi * 60L + se;",
                '  const size_t p = s.find_first_of("+-Z", 19);',
                "  if (p == std::string::npos) return t - ESPTime::timezone_offset();  // local time",
                "  if (s[p] == 'Z') return t;",
                "  int oh = 0, om = 0;",
                '  sscanf(s.c_str() + p + 1, "%d:%d", &oh, &om);',
                "  const long off = oh * 3600L + om * 60L;",
                "  return s[p] == '+' ? t - off : t + off;",
                "}",
            ]
        )
        parse_duration = "\n".join(
            [
                "[](const std::string &s) -> long {",
                '  // "H:MM:SS" -> seconds (-1 if not parseable)',
                "  int h, m, sec;",
                '  if (sscanf(s.c_str(), "%d:%d:%d", &h, &m, &sec) != 3) return -1;',
                "  return h * 3600L + m * 60L + sec;",
                "}",
            ]
        )
        out.append({"id": "cyd_parse_time", "type": "std::function<long(const std::string &)>",
                    "restore_value": False, "initial_value": Block(parse_time)})  # fmt: skip
        out.append({"id": "cyd_parse_duration", "type": "std::function<long(const std::string &)>",
                    "restore_value": False, "initial_value": Block(parse_duration)})  # fmt: skip
    return out


def _overlay_script() -> dict[str, Any]:
    """Fill and show the value overlay for the tile that was long pressed."""
    return {
        "id": "cyd_overlay_open",
        "mode": "restart",
        "parameters": {"entity": "string", "title": "string", "kind": "int", "value": "float"},
        "then": [
            {"lambda": Lambda("id(cyd_ov_entity) = entity;\nid(cyd_ov_kind) = kind;")},
            {"lvgl.label.update": {"id": "cyd_ov_title", "text": Lambda("return title;")}},
            {"lvgl.slider.update": {"id": "cyd_ov_slider", "value": Lambda("return value;")}},
            {"lvgl.label.update": {"id": "cyd_ov_value", "text": Lambda(PERCENT_TEXT.format(v="value"))}},
            {"lvgl.widget.show": "cyd_overlay"},
        ],
    }


SLIDER_ACTIONS = (
    (1, "light.turn_on", "brightness_pct"),
    (2, "cover.set_cover_position", "position"),
    (3, "fan.set_percentage", "percentage"),
)


def _overlay_widget(ctx: Context, width: int, height: int) -> dict[str, Any]:
    """Shared value overlay (hidden) in the top layer; a long press on a tile opens it."""
    lay = overlay_layout(width, height, ctx.font_sizes, ctx.icon_sizes)
    panel = lay["panel"]
    hide = [{"lvgl.widget.hide": "cyd_overlay"}]
    children: list[Any] = []
    for el in lay["elements"]:
        if el["role"] == "title":
            children.append(ctx.label(el, "cyd_ov_title", ""))
        elif el["role"] == "close":
            close = ctx.label(el, "cyd_ov_close", "mdi:close")
            if close:
                close["label"]["on_short_click"] = hide
                children.append(close)
        elif el["role"] == "value":
            ctx.fonts.text_font(el["size"], "0123456789 %")
            children.append(ctx.label(el, "cyd_ov_value", ""))
        elif el["role"] == "slider":
            ctx.objects += 1
            send = [
                {
                    "if": {
                        "condition": {"lambda": Lambda(f"return id(cyd_ov_kind) == {kind};")},
                        "then": [
                            {
                                "homeassistant.action": {
                                    "action": action,
                                    "data": {
                                        "entity_id": Lambda("return id(cyd_ov_entity);"),
                                        key: Lambda("return to_string((int) lroundf(x));"),
                                    },
                                }
                            }
                        ],
                    }
                }
                for kind, action, key in SLIDER_ACTIONS
            ]
            children.append(
                {
                    "slider": {
                        "id": "cyd_ov_slider",
                        "align": el["align"],
                        "x": el["x"],
                        "y": el["y"],
                        "width": el["width"],
                        "height": el["height"],
                        "min_value": 0,
                        "max_value": 100,
                        "value": 0,
                        "bg_color": ctx.color("border"),
                        "bg_opa": "COVER",
                        "indicator": {"bg_color": ctx.color("accent"), "bg_opa": "COVER"},
                        "knob": {"bg_color": ctx.color("text"), "bg_opa": "COVER", "pad_all": 4},
                        "on_value": [
                            {"lvgl.label.update": {"id": "cyd_ov_value", "text": Lambda(PERCENT_TEXT.format(v="x"))}}
                        ],
                        "on_release": send,
                    }
                }
            )
    ctx.objects += 2
    return {
        "obj": {
            "id": "cyd_overlay",
            "x": 0,
            "y": 0,
            "width": width,
            "height": height,
            "bg_color": Raw("0x000000"),
            "bg_opa": "60%",
            "border_width": 0,
            "radius": 0,
            "pad_all": 0,
            "hidden": True,
            "scrollable": False,
            "on_short_click": hide,
            "widgets": [
                {
                    "obj": {
                        "id": "cyd_ov_panel",
                        "x": panel.x,
                        "y": panel.y,
                        "width": panel.w,
                        "height": panel.h,
                        "styles": "cyd_tile",
                        "scrollable": False,
                        "widgets": [c for c in children if c],
                    }
                }
            ],
        }
    }


# Light overlay rows: slider range, value format and the light.turn_on data it sends on release
LIGHT_SLIDERS: dict[str, tuple[int, int, str]] = {
    "brightness": (0, 100, "%d %%"),
    "ct": (2000, 6500, "%d K"),
    "hue": (0, 359, "%d°"),
}
CT_STOPS = ("#ff9329", "#ffd6aa", "#cbe1ff")  # warm white -> cold white
HUE_STOPS = ("#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000")


def _light_gradients() -> list[dict[str, Any]]:
    def stops(colors: tuple[str, ...]) -> list[dict[str, Any]]:
        last = len(colors) - 1
        return [{"color": Raw(hex_color(c)), "position": f"{i * 100 // last}%"} for i, c in enumerate(colors)]

    return [
        {"id": "cyd_grad_ct", "direction": "HOR", "stops": stops(CT_STOPS)},
        {"id": "cyd_grad_hue", "direction": "HOR", "stops": stops(HUE_STOPS)},
    ]


def _value_text(fmt: str, v: str) -> str:
    return f'char buf[12];\nsnprintf(buf, sizeof(buf), "{fmt}", (int) lroundf({v}));\nreturn std::string(buf);'


def _light_script(rows: dict[str, list[str]]) -> dict[str, Any]:
    """Fill and show the light overlay; rows the lamp does not support are hidden."""

    def toggle(role: str, flag: str) -> list[str]:
        ids = rows.get(role, [])
        if not ids:
            return []
        objs = ", ".join(f"id({i})" for i in ids)
        return [
            f"for (lv_obj_t *o : {{{objs}}}) {{",
            f"  if ({flag}) lv_obj_remove_flag(o, LV_OBJ_FLAG_HIDDEN);",
            "  else lv_obj_add_flag(o, LV_OBJ_FLAG_HIDDEN);",
            "}",
        ]

    code = [
        "id(cyd_ov_entity) = entity;",
        'const bool has_ct = modes.find("color_temp") != std::string::npos;',
        'const bool has_hs = modes.find("hs") != std::string::npos || modes.find("rgb") != std::string::npos ||',
        '                    modes.find("xy") != std::string::npos;',
        '// hs_color arrives as text, e.g. "(30.0, 100.0)"',
        "float hue = 0.0f, sat = 100.0f;",
        'const size_t p = hs.find_first_of("0123456789");',
        'if (p != std::string::npos) sscanf(hs.c_str() + p, "%f, %f", &hue, &sat);',
        "id(cyd_li_sat) = sat < 10.0f ? 100.0f : sat;",
        "const float k = std::isnan(ct) ? 4000.0f : ct;",
        "lv_label_set_text(id(cyd_li_title), title.c_str());",
        "char buf[12];",
    ]
    for role, v in (("brightness", "value"), ("ct", "k"), ("hue", "hue")):
        fmt = LIGHT_SLIDERS[role][2]
        code += [
            f"lv_slider_set_value(id(cyd_li_{role}), (int32_t) lroundf({v}), LV_ANIM_OFF);",
            f'snprintf(buf, sizeof(buf), "{fmt}", (int) lroundf({v}));',
            f"lv_label_set_text(id(cyd_li_{role}_value), buf);",
        ]
    code += toggle("ct", "has_ct") + toggle("hue", "has_hs")
    return {
        "id": "cyd_light_open",
        "mode": "restart",
        "parameters": {
            "entity": "string",
            "title": "string",
            "value": "float",
            "modes": "string",
            "ct": "float",
            "hs": "string",
        },
        "then": [{"lambda": Lambda("\n".join(code))}, {"lvgl.widget.show": "cyd_light"}],
    }


def _light_send(role: str) -> dict[str, Any]:
    entity = Lambda("return id(cyd_ov_entity);")
    if role == "hue":
        return {
            "homeassistant.action": {
                "action": "light.turn_on",
                "data": {"entity_id": entity},
                "data_template": {"hs_color": "{{ [h | float, s | float] }}"},
                "variables": {
                    "h": Lambda("return to_string((int) lroundf(x));"),
                    "s": Lambda("return to_string((int) lroundf(id(cyd_li_sat)));"),
                },
            }
        }
    key = "brightness_pct" if role == "brightness" else "color_temp_kelvin"
    return {
        "homeassistant.action": {
            "action": "light.turn_on",
            "data": {"entity_id": entity, key: Lambda("return to_string((int) lroundf(x));")},
        }
    }


def _light_widget(ctx: Context, width: int, height: int) -> tuple[dict[str, Any], dict[str, list[str]]]:
    """Light overlay (hidden) in the top layer: brightness, color temperature and color."""
    lay = light_overlay_layout(width, height, ctx.font_sizes, ctx.icon_sizes)
    panel = lay["panel"]
    hide = [{"lvgl.widget.hide": "cyd_light"}]
    icons = dict(LIGHT_ROWS)
    rows: dict[str, list[str]] = {}
    children: list[Any] = []
    for el in lay["elements"]:
        role = el["role"]
        if role == "title":
            children.append(ctx.label(el, "cyd_li_title", ""))
        elif role == "close":
            close = ctx.label(el, "cyd_li_close", "mdi:close")
            if close:
                close["label"]["on_short_click"] = hide
                children.append(close)
        elif role.endswith("_icon"):
            row = role[: -len("_icon")]
            icon = ctx.label(el, f"cyd_li_{role}", icons[row])
            if icon:
                rows.setdefault(row, []).append(f"cyd_li_{role}")
                children.append(icon)
        elif role.endswith("_value"):
            ctx.fonts.text_font(el["size"], "0123456789 %K°")
            rows.setdefault(role[: -len("_value")], []).append(f"cyd_li_{role}")
            children.append(ctx.label(el, f"cyd_li_{role}", ""))
        elif el["kind"] == "slider":
            ctx.objects += 1
            lo, hi, fmt = LIGHT_SLIDERS[role]
            rows.setdefault(role, []).append(f"cyd_li_{role}")
            slider: dict[str, Any] = {
                "id": f"cyd_li_{role}",
                "align": el["align"],
                "x": el["x"],
                "y": el["y"],
                "width": el["width"],
                "height": el["height"],
                "min_value": lo,
                "max_value": hi,
                "value": lo,
                "bg_color": ctx.color("border"),
                "bg_opa": "COVER",
                "indicator": {"bg_color": ctx.color("accent"), "bg_opa": "COVER"},
                "knob": {"bg_color": ctx.color("text"), "bg_opa": "COVER", "pad_all": 4},
                "on_value": [
                    {"lvgl.label.update": {"id": f"cyd_li_{role}_value", "text": Lambda(_value_text(fmt, "x"))}}
                ],
                "on_release": [_light_send(role)],
            }
            if role != "brightness":  # the gradient is the track, the indicator stays transparent
                slider["bg_grad"] = f"cyd_grad_{role}"
                slider["indicator"] = {"bg_opa": "TRANSP"}
            children.append({"slider": slider})
    ctx.objects += 2
    widget = {
        "obj": {
            "id": "cyd_light",
            "x": 0,
            "y": 0,
            "width": width,
            "height": height,
            "bg_color": Raw("0x000000"),
            "bg_opa": "60%",
            "border_width": 0,
            "radius": 0,
            "pad_all": 0,
            "hidden": True,
            "scrollable": False,
            "on_short_click": hide,
            "widgets": [
                {
                    "obj": {
                        "id": "cyd_li_panel",
                        "x": panel.x,
                        "y": panel.y,
                        "width": panel.w,
                        "height": panel.h,
                        "styles": "cyd_tile",
                        "scrollable": False,
                        "widgets": [c for c in children if c],
                    }
                }
            ],
        }
    }
    return widget, rows


def _device_actions(ctx: Context, pages: list[dict[str, Any]], brightness_day: int) -> list[Any]:
    """Actions Home Assistant can call on the display (esphome.<device>_<action>)."""
    s = ctx.project["settings"]
    night = max(1, min(int(s.get("brightness_night", 25)), 100))
    show_page = []
    for page in pages:
        names = sorted({page["id"], page.get("name", "")} - {""})
        cond = " || ".join(f"page == {cpp_str(n)}" for n in names)
        show_page.append(
            {"if": {"condition": {"lambda": Lambda(f"return {cond};")}, "then": [page_show(ctx, page["id"])]}}
        )
    wake = {"light.turn_on": {"id": "backlight", "brightness": f"{brightness_day}%"}}
    actions: list[Any] = [
        {"action": "show_page", "variables": {"page": "string"}, "then": [wake, *show_page]},
        {
            "action": "show_message",
            "variables": {"title": "string", "message": "string", "duration": "int"},
            "then": [{"script.execute": {
                "id": "cyd_show_message",
                "title": Lambda("return title.str();"),
                "message": Lambda("return message.str();"),
                "duration": Lambda("return duration;"),
            }}],
        },
        {"action": "wake", "then": [wake]},
        {"action": "dim", "then": [{"light.turn_on": {"id": "backlight", "brightness": f"{night}%"}}]},
        {
            "action": "set_brightness",
            "variables": {"brightness": "int"},
            "then": [{"light.turn_on": {"id": "backlight", "brightness": Lambda(
                "return std::max(1, std::min(100, (int) brightness)) / 100.0f;")}}],
        },
    ]  # fmt: skip
    led = ctx.board.get("extras", {}).get("rgb_led")
    if led and s.get("rgb_led", {}).get("enabled"):
        actions.append({
            "action": "set_led",
            "variables": {"red": "int", "green": "int", "blue": "int"},
            "then": [{"if": {
                "condition": {"lambda": Lambda("return (int) red <= 0 && (int) green <= 0 && (int) blue <= 0;")},
                "then": [{"light.turn_off": "status_led"}],
                "else": [{"light.turn_on": {
                    "id": "status_led", "brightness": "100%",
                    "red": Lambda("return std::min(255, std::max(0, (int) red)) / 255.0f;"),
                    "green": Lambda("return std::min(255, std::max(0, (int) green)) / 255.0f;"),
                    "blue": Lambda("return std::min(255, std::max(0, (int) blue)) / 255.0f;"),
                }}],
            }}],
        })  # fmt: skip
    return actions


def _message_widget(ctx: Context, width: int, height: int) -> dict[str, Any]:
    """Hidden message overlay in the top layer (tap closes it)."""
    lay = message_layout(width, height, ctx.font_sizes, ctx.icon_sizes)
    panel = lay["panel"]
    children: list[Any] = []
    for el in lay["elements"]:
        if el["role"] == "icon":
            children.append(ctx.label(el, None, "mdi:bell-ring-outline"))
        elif el["role"] == "title":
            children.append(ctx.label(el, "cyd_msg_title", ""))
        else:
            children.append(ctx.label(el, "cyd_msg_text", ""))
    ctx.objects += 2
    hide = [{"lvgl.widget.hide": "cyd_msg"}]
    return {"obj": {
        "id": "cyd_msg", "x": 0, "y": 0, "width": width, "height": height,
        "bg_color": Raw("0x000000"), "bg_opa": "50%", "border_width": 0, "radius": 0, "pad_all": 0,
        "hidden": True, "scrollable": False, "on_short_click": hide,
        "widgets": [{"obj": {
            "x": panel.x, "y": panel.y, "width": panel.w, "height": panel.h, "styles": "cyd_tile",
            "border_color": ctx.color("accent"), "border_width": 2, "pad_all": max(TILE_PAD - 2, 0),
            "scrollable": False, "clickable": False, "widgets": [c for c in children if c],
        }}],
    }}  # fmt: skip


def _message_script(ctx: Context, brightness_day: int) -> dict[str, Any]:
    """Show a message (overlay + notification areas), wake the display, hide after ``duration`` seconds."""
    then: list[Any] = [
        {"lvgl.label.update": {"id": "cyd_msg_title", "text": Lambda("return title;")}},
        {"lvgl.label.update": {"id": "cyd_msg_text", "text": Lambda("return message;")}},
    ]
    for title_id, text_id in ctx.notification_labels:
        then.append({"lvgl.label.update": {"id": title_id, "text": Lambda("return title;")}})
        then.append({"lvgl.label.update": {"id": text_id, "text": Lambda("return message;")}})
    then += [
        {"light.turn_on": {"id": "backlight", "brightness": f"{brightness_day}%"}},
        {"lvgl.widget.show": "cyd_msg"},
        {"if": {
            "condition": {"lambda": Lambda("return duration > 0;")},
            "then": [{"delay": Lambda("return (uint32_t) duration * 1000;")}, {"lvgl.widget.hide": "cyd_msg"}],
        }},
    ]  # fmt: skip
    return {"id": "cyd_show_message", "mode": "restart",
            "parameters": {"title": "string", "message": "string", "duration": "int"}, "then": then}  # fmt: skip


def _scripts(ctx: Context, pages: list[dict[str, Any]]) -> list[Any]:
    scripts: list[Any] = []
    if ctx.project["settings"].get("device_actions", True):
        day = max(1, min(int(ctx.project["settings"].get("brightness_day", 100)), 100))
        scripts.append(_message_script(ctx, day))
    if "overlay" in ctx.helpers:
        scripts.append(_overlay_script())
    if "light_overlay" in ctx.helpers:
        scripts.append(_light_script(ctx.light_rows))
    if ctx.time_updates:
        scripts.append({"id": "cyd_update_time", "mode": "restart", "then": ctx.time_updates})
    scripts.append(
        {
            "id": "cyd_on_page",
            "mode": "restart",
            "parameters": {"page": "int", "root": "int"},
            "then": ctx.page_actions,
        }
    )
    return scripts


def _lvgl(ctx: Context, pages: list[dict[str, Any]], lvgl_pages: list[Any], top_layer: list[Any]) -> dict[str, Any]:
    p = ctx.project
    s = p["settings"]
    d = ctx.default_style
    # with a project background image the header is transparent and the tab bar translucent
    has_bg_image = bool(isinstance(p.get("background"), dict) and p["background"].get("image"))
    conf: dict[str, Any] = {
        "displays": ["cyd_display"],
        "touchscreens": [{"touchscreen_id": "cyd_touch"}],
        "rotation": ctx.board["rotation"],
        "page_wrap": bool(p["navigation"].get("wrap_around", False)),
        "theme": {
            "button": {
                "bg_color": ctx.hex(d["bg"]),
                "bg_opa": opa(d["bg_opa"]),
                "radius": d["radius"],
                "border_width": d["border_width"],
                "border_color": ctx.hex(d["border"]),
                "shadow_width": 0,
                "pad_all": ctx.tile_pad,
                "text_color": ctx.hex(d["text"]),
                "pressed": {"bg_color": ctx.hex(d["bg_on"])},
                "checked": {
                    "bg_color": ctx.hex(d["bg_on"]),
                    "bg_opa": opa(d["bg_opa_on"]),
                    "border_color": ctx.hex(d["border_on"]),
                },
                "disabled": {"bg_opa": "50%"},
            },
        },
        "style_definitions": [
            {
                "id": "cyd_tile",
                "bg_color": ctx.hex(d["bg"]),
                "bg_opa": opa(d["bg_opa"]),
                "radius": d["radius"],
                "border_width": d["border_width"],
                "border_color": ctx.hex(d["border"]),
                "pad_all": ctx.tile_pad,
                "shadow_width": 0,
            },
            {
                "id": "cyd_plain",
                "bg_opa": "TRANSP",
                "border_width": 0,
                "radius": 0,
                "pad_all": TILE_PAD,
                "shadow_width": 0,
            },
            {
                "id": "cyd_bar",
                "bg_color": ctx.color("header_bg"),
                "bg_opa": "TRANSP" if has_bg_image else "COVER",
                "border_width": 0,
                "radius": 0,
                "pad_all": 0,
                "shadow_width": 0,
            },
            {
                "id": "cyd_navbar",
                "bg_color": ctx.color("nav_bg"),
                "bg_opa": "80%" if has_bg_image else "COVER",
                "border_width": 0,
                "radius": 0,
                "pad_all": 0,
                "shadow_width": 0,
            },
            {"id": "cyd_tab", "bg_opa": "TRANSP", "border_width": 0, "radius": 0, "pad_all": 0, "shadow_width": 0},
        ]
        + [
            {"id": sid, "text_font": font, "text_color": Raw(color), **({"text_align": align} if align else {})}
            for (font, color, align), sid in ctx.label_styles.items()
        ]
        + (
            [
                {
                    "id": "cyd_small_btn",
                    "bg_color": ctx.hex(d["circle_bg"]),
                    "bg_opa": "COVER",
                    "radius": min(d["radius"], 10),
                    "border_width": 0,
                    "pad_all": 0,
                    "shadow_width": 0,
                }
            ]
            if "small_button" in ctx.helpers
            else []
        ),
    }
    idle: list[Any] = []
    home = p["navigation"]["home_page"]
    index_of = {page["id"]: i for i, page in enumerate(pages)}
    own_timeout = [page for page in pages if page.get("timeout_s")]
    global_timeout = int(s.get("return_home_after_s") or 0)
    if global_timeout > 0:
        excluded = [index_of[home]] + [index_of[pg["id"]] for pg in own_timeout]
        cond = " && ".join(f"id(cyd_page) != {i}" for i in excluded)
        idle.append(
            {
                "timeout": f"{global_timeout}s",
                "then": [
                    {
                        "if": {
                            "condition": {"lambda": Lambda(f"return {cond};")},
                            "then": [page_show(ctx, home)],
                        }
                    }
                ],
            }
        )
    for page in own_timeout:
        if page["id"] == home:
            continue
        idle.append(
            {
                "timeout": f"{int(page['timeout_s'])}s",
                "then": [
                    {
                        "if": {
                            "condition": {"lambda": Lambda(f"return id(cyd_page) == {index_of[page['id']]};")},
                            "then": [page_show(ctx, home)],
                        }
                    }
                ],
            }
        )
    screensaver = s.get("screensaver", {})
    if screensaver.get("enabled"):
        night = max(0, min(int(s.get("brightness_night", 25)), 100))
        action: list[Any]
        if screensaver.get("action") == "off":
            action = [{"light.turn_off": "backlight"}]
        else:
            action = [{"light.turn_on": {"id": "backlight", "brightness": f"{max(night, 1)}%"}}]
        idle.append(
            {
                "timeout": f"{int(screensaver.get('after_s', 60))}s",
                "then": [{"lambda": Lambda("id(cyd_dimmed) = true;")}, *action],
            }
        )
    if idle:
        conf["on_idle"] = idle
    if "light_overlay" in ctx.helpers:
        conf["gradients"] = _light_gradients()
    if top_layer:
        conf["top_layer"] = {"widgets": top_layer}
    conf["pages"] = lvgl_pages
    return conf


def _page(
    ctx: Context, page: dict[str, Any], index: int, pages: list[dict[str, Any]], width: int, height: int
) -> dict[str, Any]:
    p = ctx.project
    layout = page_layout(p, page, width, height)
    nav = nav_pages(p)
    nav_ids = [n["id"] for n in nav]
    conf: dict[str, Any] = {"id": ctx.page_ids[page["id"]]}
    if page["id"] not in nav_ids:
        conf["skip"] = True
    bg = page.get("background") or p.get("background") or {}
    bg_color = ctx.hex(bg["color"]) if isinstance(bg, dict) and bg.get("color") else ctx.color("background")
    conf.update({"bg_color": bg_color, "bg_opa": "COVER", "pad_all": 0})
    if isinstance(bg, dict) and bg.get("image"):
        conf["bg_image_src"] = ctx.image(bg["image"])
    root = root_of(p, page)
    root_index = nav_ids.index(root["id"]) if root["id"] in nav_ids else -1
    conf["on_load"] = [{"script.execute": {"id": "cyd_on_page", "page": index, "root": root_index}}]
    transition = p["navigation"].get("transition", "slide")
    if p["navigation"].get("swipe", True):
        if page["id"] in nav_ids and len(nav_ids) > 1:
            anim_l = "NONE" if transition == "none" else "MOVE_LEFT"
            anim_r = "NONE" if transition == "none" else "MOVE_RIGHT"
            conf["on_swipe_left"] = [{"lvgl.page.next": {"animation": anim_l, "time": "200ms"}}]
            conf["on_swipe_right"] = [{"lvgl.page.previous": {"animation": anim_r, "time": "200ms"}}]
        elif page.get("parent"):
            conf["on_swipe_right"] = [page_show(ctx, page["parent"], "MOVE_RIGHT")]
    widgets: list[Any] = []
    for widget in sorted(page["widgets"], key=lambda w: int(w.get("z", 0))):
        emitter = EMITTERS.get(widget["type"])
        if emitter is None:
            continue
        emitted = emitter(ctx, page, widget, layout["widgets"][widget["id"]])
        apply_logic(ctx, widget_id(page, widget), widget, emitted)
        widgets.extend(emitted)
    if widgets:
        conf["widgets"] = widgets
    return conf


def _top_layer(ctx: Context, pages: list[dict[str, Any]], width: int, height: int) -> list[Any]:
    """Global header and tab bar (visible on every page) plus the page-change script."""
    p = ctx.project
    home = next((pg for pg in pages if pg["id"] == p["navigation"]["home_page"]), pages[0])
    layout = page_layout(p, home, width, height)
    header = layout["header"]
    tabbar = layout["tabbar"]
    nav = nav_pages(p)
    widgets: list[Any] = []
    actions: list[Any] = [{"lambda": Lambda("id(cyd_page) = page;")}]
    sub_indices = [i for i, pg in enumerate(pages) if pg.get("parent")]

    if header is not None:
        children: list[Any] = []
        for el in header_elements(p, header, ctx.font_sizes, ctx.icon_sizes):
            if el["role"] == "back":
                lbl = ctx.label(el, "cyd_back", "mdi:chevron-left")
                if lbl:
                    lbl["label"]["hidden"] = True
                    conds = []
                    for i in sub_indices:
                        parent = pages[i]["parent"]
                        conds.append(
                            {
                                "if": {
                                    "condition": {"lambda": Lambda(f"return id(cyd_page) == {i};")},
                                    "then": [page_show(ctx, parent, "MOVE_RIGHT")],
                                }
                            }
                        )
                    lbl["label"]["on_short_click"] = conds
                    children.append(lbl)
                    is_sub = " || ".join(f"page == {i}" for i in sub_indices)
                    actions.append(
                        {
                            "if": {
                                "condition": {"lambda": Lambda(f"return {is_sub};")},
                                "then": [{"lvgl.widget.show": "cyd_back"}],
                                "else": [{"lvgl.widget.hide": "cyd_back"}],
                            }
                        }
                    )
            elif el["role"] == "title":
                names = [pg.get("name", "") for pg in pages]
                ctx.fonts.text_font(el["size"], "".join(names))
                children.append(ctx.label(el, "cyd_title", home.get("name", "")))
                arr = ", ".join(cpp_str(n) for n in names)
                actions.append(
                    {
                        "lvgl.label.update": {
                            "id": "cyd_title",
                            "text": Lambda(
                                f"static const char *const names[] = {{{arr}}};\n"
                                f'if (page < 0 || page >= {len(names)}) return std::string("");\n'
                                "return std::string(names[page]);"
                            ),
                        }
                    }
                )
            elif el["role"] == "time":
                fmt = TIME_FORMATS["HH:mm"]
                children.append(ctx.label(el, "cyd_header_time", "--:--"))
                ctx.time_updates.append({"lvgl.label.update": {"id": "cyd_header_time", "text": time_lambda(fmt)}})
            elif el["role"] == "text":
                children.append(ctx.label(el, None, p["name"]))
        ctx.objects += 1
        widgets.append(
            {
                "obj": {
                    "id": "cyd_header",
                    "x": header.x,
                    "y": header.y,
                    "width": header.w,
                    "height": header.h,
                    "styles": "cyd_bar",
                    "pad_left": HEADER_PAD_X,
                    "pad_right": HEADER_PAD_X,
                    "scrollable": False,
                    "clickable": False,
                    "widgets": [c for c in children if c],
                }
            }
        )

    if tabbar is not None:
        show_icons = p["navigation"].get("show_icons", True)
        show_labels = p["navigation"].get("show_labels", True)
        tabs: list[Any] = []
        for i, (page, rect) in enumerate(zip(nav, layout["tabs"], strict=True)):
            tid = f"cyd_tab_{safe_id(page['id'])}"
            kids: list[Any] = []
            for el in tab_elements(show_icons, show_labels, rect, ctx.font_sizes, ctx.icon_sizes):
                if el["kind"] == "icon":
                    kids.append(
                        ctx.label(
                            el, f"{tid}_icon", page.get("icon", ""), ctx.color("nav_active") if page is home else None
                        )
                    )
                else:
                    kids.append(
                        ctx.label(
                            el, f"{tid}_label", page.get("name", ""), ctx.color("nav_active") if page is home else None
                        )
                    )
            ctx.objects += 1
            tabs.append(
                {
                    "button": {
                        "id": tid,
                        "x": rect.x - tabbar.x,
                        "y": rect.y - tabbar.y,
                        "width": rect.w,
                        "height": rect.h,
                        "styles": "cyd_tab",
                        "scrollable": False,
                        "on_short_click": [page_show(ctx, page["id"])],
                        "widgets": [k for k in kids if k],
                    }
                }
            )
            ids = [k["label"]["id"] for k in kids if k]
            actions.append(
                {
                    "if": {
                        "condition": {"lambda": Lambda(f"return root == {i};")},
                        "then": [{"lvgl.label.update": {"id": x, "text_color": ctx.color("nav_active")}} for x in ids],
                        "else": [
                            {"lvgl.label.update": {"id": x, "text_color": ctx.color("nav_inactive")}} for x in ids
                        ],
                    }
                }
            )
        ctx.objects += 1
        widgets.append(
            {
                "obj": {
                    "id": "cyd_tabbar",
                    "x": tabbar.x,
                    "y": tabbar.y,
                    "width": tabbar.w,
                    "height": tabbar.h,
                    "styles": "cyd_navbar",
                    "scrollable": False,
                    "clickable": False,
                    "widgets": tabs,
                }
            }
        )
    if "overlay" in ctx.helpers:
        widgets.append(_overlay_widget(ctx, width, height))
    if "light_overlay" in ctx.helpers:
        light, ctx.light_rows = _light_widget(ctx, width, height)
        widgets.append(light)
    if p["settings"].get("device_actions", True):
        widgets.append(_message_widget(ctx, width, height))
    ctx.page_actions = actions
    return widgets


__all__ = ["Comment", "GenerateResult", "Raw", "decode_project", "generate_yaml", "split_generated"]
