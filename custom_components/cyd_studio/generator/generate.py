"""Project -> ESPHome YAML."""

from __future__ import annotations

import base64
import gzip
import hashlib
import json
from dataclasses import dataclass, field
from typing import Any

from .board import resolve_board
from .context import Context, cpp_str
from .emit import Comment, Lambda, Raw, Secret, dump
from .layout import HEADER_PAD_X, header_elements, nav_pages, page_layout, tab_elements
from .memory import MemoryEstimate, estimate
from .model import Issue, normalize, safe_id, validate
from .theme import resolve_theme
from .widgets import EMITTERS
from .widgets.basic import TIME_FORMATS, time_lambda
from .widgets.common import page_show

GENERATOR_VERSION = "0.1.0"
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
    mem = estimate(
        ctx.objects, len(project["pages"]), ctx.fonts.flash_estimate(), int(board.get("memory_budget", 100000))
    )
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

    doc["font"] = ctx.fonts.emit()
    doc["script"] = _scripts(ctx, pages)
    doc["lvgl"] = _lvgl(ctx, pages, lvgl_pages, top_layer)
    return doc


def _scripts(ctx: Context, pages: list[dict[str, Any]]) -> list[Any]:
    scripts: list[Any] = []
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
    t = ctx.theme
    radius = int(t.get("radius", 8))
    border = int(t.get("border_width", 0))
    conf: dict[str, Any] = {
        "displays": ["cyd_display"],
        "touchscreens": [{"touchscreen_id": "cyd_touch"}],
        "rotation": ctx.board["rotation"],
        "page_wrap": bool(p["navigation"].get("wrap_around", False)),
        "theme": {
            "button": {
                "bg_color": ctx.color("tile"),
                "bg_opa": "COVER",
                "radius": radius,
                "border_width": border,
                "border_color": ctx.color("border"),
                "shadow_width": 0,
                "pad_all": ctx.tile_pad,
                "text_color": ctx.color("text"),
                "pressed": {"bg_color": ctx.color("tile_on")},
                "checked": {"bg_color": ctx.color("tile_on"), "border_color": ctx.color("accent")},
                "disabled": {"bg_opa": "50%"},
            },
        },
        "style_definitions": [
            {
                "id": "cyd_tile",
                "bg_color": ctx.color("tile"),
                "bg_opa": "COVER",
                "radius": radius,
                "border_width": border,
                "border_color": ctx.color("border"),
                "pad_all": ctx.tile_pad,
                "shadow_width": 0,
            },
            {
                "id": "cyd_plain",
                "bg_opa": "TRANSP",
                "border_width": 0,
                "radius": 0,
                "pad_all": ctx.tile_pad + border if border else ctx.tile_pad,
                "shadow_width": 0,
            },
            {
                "id": "cyd_bar",
                "bg_color": ctx.color("header_bg"),
                "bg_opa": "COVER",
                "border_width": 0,
                "radius": 0,
                "pad_all": 0,
                "shadow_width": 0,
            },
            {
                "id": "cyd_navbar",
                "bg_color": ctx.color("nav_bg"),
                "bg_opa": "COVER",
                "border_width": 0,
                "radius": 0,
                "pad_all": 0,
                "shadow_width": 0,
            },
            {"id": "cyd_tab", "bg_opa": "TRANSP", "border_width": 0, "radius": 0, "pad_all": 0, "shadow_width": 0},
        ],
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
    conf.update({"bg_color": ctx.color("background"), "bg_opa": "COVER", "pad_all": 0})
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
        widgets.extend(emitter(ctx, page, widget, layout["widgets"][widget["id"]]))
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
    ctx.page_actions = actions
    return widgets


__all__ = ["Comment", "GenerateResult", "Raw", "decode_project", "generate_yaml", "split_generated"]
