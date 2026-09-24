"""Control widgets: cover_control, climate, slider, gauge, weather, multi_value."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..context import Context, cpp_str
from ..emit import Lambda
from ..layout import Rect
from .common import box, elements, fallback_label, widget_id

STATE_TEXTS_FILE = Path(__file__).parent.parent.parent / "data" / "state_texts.json"

# Slider per domain: (attribute or None = state, kind, action, data key)
#   kind 1 = 0..255 -> %, 2 = percent, 3 = 0..1 -> %, 4 = plain number
SLIDER_DOMAINS: dict[str, tuple[str | None, int, str, str]] = {
    "light": ("brightness", 1, "light.turn_on", "brightness_pct"),
    "cover": ("current_position", 2, "cover.set_cover_position", "position"),
    "fan": ("percentage", 2, "fan.set_percentage", "percentage"),
    "media_player": ("volume_level", 3, "media_player.volume_set", "volume_level"),
    "input_number": (None, 4, "input_number.set_value", "value"),
    "number": (None, 4, "number.set_value", "value"),
}


@lru_cache(maxsize=1)
def state_texts() -> dict[str, Any]:
    """Weather conditions and climate modes: icons and texts (data/state_texts.json)."""
    data: dict[str, Any] = json.loads(STATE_TEXTS_FILE.read_text(encoding="utf-8"))
    return data


def _map_lambda(var: str, mapping: dict[str, str], default: str) -> str:
    """C++ if-chain mapping a std::string state to a text."""
    lines = [f'if ({var} == "{k}") return std::string({cpp_str(v)});' for k, v in mapping.items()]
    lines.append(f"return std::string({cpp_str(default)});")
    return "\n".join(lines)


def _small_button(ctx: Context, el: dict[str, Any], icon: str, style: dict[str, Any],
                  on_click: list[Any]) -> dict[str, Any] | None:  # fmt: skip
    """Small button (styles cyd_small_btn) with a centered icon."""
    label = ctx.label({**el, "kind": "icon", "align": "CENTER", "x": 0, "y": 0, "width": None}, None, icon,
                      ctx.hex(style["icon_on"]))  # fmt: skip
    if label is None:
        return None
    ctx.helpers.add("small_button")
    ctx.objects += 1
    conf: dict[str, Any] = {"align": el["align"]}
    if el["x"]:
        conf["x"] = el["x"]
    if el["y"]:
        conf["y"] = el["y"]
    conf.update({"width": el["width"], "height": el["height"], "styles": "cyd_small_btn"})
    if style["circle_bg"] != ctx.default_style["circle_bg"]:
        conf["bg_color"] = ctx.hex(style["circle_bg"])
    if on_click:
        conf["on_short_click"] = on_click
    conf["widgets"] = [label]
    return {"button": conf}


def _action(action: str, entity: str, ctx: Context, **data: Any) -> dict[str, Any]:
    return {"homeassistant.action": {"action": action, "data": {"entity_id": ctx.ent(entity), **data}}}


def cover_control(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Open / stop / close buttons and the position."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    style = ctx.widget_style(widget)
    src = ctx.source("text", entity)
    pos = ctx.source("number", entity, "current_position")
    s = ctx.strings
    texts = {"open": s["open"], "closed": s["closed"], "opening": s["opening"], "closing": s["closing"],
             "unavailable": s["unavailable"]}  # fmt: skip
    icons = {"up": "mdi:arrow-up", "stop": "mdi:stop", "down": "mdi:arrow-down"}
    actions = {"up": "cover.open_cover", "stop": "cover.stop_cover", "down": "cover.close_cover"}
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
        elif el["role"] == "state":
            ctx.fonts.text_font(el["size"], "".join(texts.values()) + "0123456789 %–")
            children.append(ctx.element(el, f"{wid}_state", s["unknown"], style))
            text = Lambda(
                f"const float p = id({pos.id}).state;\n"
                "if (!std::isnan(p)) {\n  char buf[12];\n"
                '  snprintf(buf, sizeof(buf), "%d %%", (int) lroundf(p));\n  return std::string(buf);\n}\n'
                f"const std::string st = id({src.id}).state;\n" + _map_lambda("st", texts, s["unknown"])
            )
            update = {"lvgl.label.update": {"id": f"{wid}_state", "text": text}}
            src.actions.append(update)
            pos.actions.append(update)
        else:
            children.append(
                _small_button(ctx, el, icons[el["role"]], style, [_action(actions[el["role"]], entity, ctx)])
            )
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def climate(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Target temperature with − / +, mode and current temperature."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    style = ctx.widget_style(widget)
    step = 1.0 if str(props.get("step", "0.5")) == "1" else 0.5
    tmin = float(props.get("min", 5))
    tmax = float(props.get("max", 30))
    src = ctx.source("text", entity)
    target = ctx.source("number", entity, "temperature")
    current = ctx.source("number", entity, "current_temperature")
    modes = {k: v[ctx.lang] for k, v in state_texts()["climate"].items()}
    modes["unavailable"] = ctx.strings["unavailable"]
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        role = el["role"]
        if role == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
        elif role == "state":
            ctx.fonts.text_font(el["size"], "".join(modes.values()) + "0123456789.,° ·–")
            children.append(ctx.element(el, f"{wid}_state", ctx.strings["unknown"], style))
            text = Lambda(
                f"const std::string st = id({src.id}).state;\n"
                f"auto mode = [&]() -> std::string {{\n{_map_lambda('st', modes, ctx.strings['unknown'])}\n}}();\n"
                f"const float c = id({current.id}).state;\n"
                "if (std::isnan(c)) return mode;\n"
                "char buf[48];\n"
                'snprintf(buf, sizeof(buf), "%s · %.1f°", mode.c_str(), c);\n'
                "return std::string(buf);"
            )
            update = {"lvgl.label.update": {"id": f"{wid}_state", "text": text}}
            src.actions.append(update)
            current.actions.append(update)
        elif role == "value":
            ctx.fonts.text_font(el["size"], "0123456789.,°-")
            children.append(ctx.element(el, f"{wid}_value", "--", style))
            target.actions.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
                'if (std::isnan(x)) return std::string("--");\n'
                'char buf[12];\nsnprintf(buf, sizeof(buf), "%.1f°", x);\nreturn std::string(buf);'
            )}})  # fmt: skip
        else:
            delta = step if role == "plus" else -step
            value = Lambda(
                f"float t = id({target.id}).state;\nif (std::isnan(t)) t = {(tmin + tmax) / 2:.1f}f;\n"
                f"t = std::min({tmax:.1f}f, std::max({tmin:.1f}f, t + ({delta:.1f}f)));\n"
                'char buf[12];\nsnprintf(buf, sizeof(buf), "%.1f", t);\nreturn std::string(buf);'
            )
            icon = "mdi:plus" if role == "plus" else "mdi:minus"
            call = _action("climate.set_temperature", entity, ctx, temperature=value)
            children.append(_small_button(ctx, el, icon, style, [call]))
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def slider(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Horizontal slider for brightness, position, fan speed, volume or a number."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    domain = entity.split(".", 1)[0]
    attribute, kind, action, key = SLIDER_DOMAINS.get(domain, SLIDER_DOMAINS["input_number"])
    style = ctx.widget_style(widget)
    vmin, vmax = (0, 100) if kind != 4 else (int(props.get("min", 0)), int(props.get("max", 100)))
    unit = "%" if kind != 4 else str(props.get("unit") or "")
    suffix = f" {unit}" if unit else ""
    state = ctx.source("text", entity) if attribute else None
    value_src = ctx.source("number", entity, attribute)
    # current value in slider units
    scale = {1: "v * 100.0f / 255.0f", 2: "v", 3: "v * 100.0f", 4: "v"}[kind]
    off_zero = f'if (id({state.id}).state == "off") return 0.0f;\n' if state and kind in (1, 3) else ""
    current = f"float v = id({value_src.id}).state;\nif (std::isnan(v)) return 0.0f;\n{off_zero}return {scale};"
    children: list[Any] = []
    slider_id = f"{wid}_slider"
    value_text = 'char buf[16];\nsnprintf(buf, sizeof(buf), "%d{s}", (int) lroundf({v}));\nreturn std::string(buf);'
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
        elif el["role"] == "value":
            ctx.fonts.text_font(el["size"], "0123456789-" + suffix)
            children.append(ctx.element(el, f"{wid}_value", "--", style))
        elif el["role"] == "slider":
            ctx.objects += 1
            send_value = {
                1: 'return to_string((int) lroundf(x));',
                2: 'return to_string((int) lroundf(x));',
                3: 'char buf[8];\nsnprintf(buf, sizeof(buf), "%.2f", x / 100.0f);\nreturn std::string(buf);',
                4: 'return to_string((int) lroundf(x));',
            }[kind]  # fmt: skip
            conf: dict[str, Any] = {"id": slider_id, "align": el["align"]}
            if el["x"]:
                conf["x"] = el["x"]
            if el["y"]:
                conf["y"] = el["y"]
            conf.update({
                "width": el["width"], "height": el["height"], "min_value": vmin, "max_value": vmax, "value": vmin,
                "bg_color": ctx.hex(style["circle_bg"]), "bg_opa": "COVER",
                "indicator": {"bg_color": ctx.hex(style["icon_on"]), "bg_opa": "COVER"},
                "knob": {"bg_color": ctx.hex(style["text"]), "bg_opa": "COVER", "pad_all": 3},
                "on_release": [_action(action, entity, ctx, **{key: Lambda(send_value)})],
            })  # fmt: skip
            if any(c and "label" in c and c["label"].get("id") == f"{wid}_value" for c in children):
                conf["on_value"] = [{"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
                    value_text.replace("{s}", suffix.replace("%", "%%")).replace("{v}", "x"))}}]  # fmt: skip
            children.append({"slider": conf})
    # keep slider and value label in sync with Home Assistant
    updates: list[Any] = [{"lvgl.slider.update": {"id": slider_id, "value": Lambda(current)}}]
    if any(c and "label" in c and c["label"].get("id") == f"{wid}_value" for c in children):
        updates.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
            "const float cur = [&]() -> float {\n" + current + "\n}();\n"
            + value_text.replace("{s}", suffix.replace("%", "%%")).replace("{v}", "cur"))}})  # fmt: skip
    value_src.actions.extend(updates)
    if state:
        state.actions.extend(updates)
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def gauge(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Arc gauge (LVGL arc, 270°) with value and label."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    style = ctx.widget_style(widget)
    vmin, vmax = int(props.get("min", 0)), int(props.get("max", 100))
    if vmax <= vmin:
        vmax = vmin + 1
    unit = str(props.get("unit") or "")
    decimals = max(0, min(int(props.get("decimals", 0)), 2))
    src = ctx.source("number", entity)
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "arc":
            ctx.objects += 1
            conf: dict[str, Any] = {"id": f"{wid}_arc", "align": el["align"], "width": el["width"],
                                    "height": el["height"]}  # fmt: skip
            conf.update({
                "min_value": vmin, "max_value": vmax, "value": vmin, "start_angle": 135, "end_angle": 45,
                "adjustable": False, "clickable": False,
                "arc_width": el["size"], "arc_color": ctx.hex(style["circle_bg"]), "arc_rounded": True,
                "indicator": {"arc_width": el["size"], "arc_color": ctx.hex(style["icon_on"]), "arc_rounded": True},
                "knob": {"bg_opa": "TRANSP", "pad_all": 0},
            })  # fmt: skip
            children.append({"arc": conf})
            src.actions.append({"lvgl.arc.update": {"id": f"{wid}_arc", "value": Lambda(
                f"if (std::isnan(x)) return {vmin};\n"
                f"return (int) lroundf(std::min((float) {vmax}, std::max((float) {vmin}, x)));"
            )}})  # fmt: skip
        elif el["role"] == "value":
            suffix = f" {unit}" if unit else ""
            ctx.fonts.text_font(el["size"], "0123456789.,-" + suffix)
            children.append(ctx.element(el, f"{wid}_value", "--", style))
            src.actions.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
                'if (std::isnan(x)) return std::string("--");\n'
                f'char buf[24];\nsnprintf(buf, sizeof(buf), "%.{decimals}f", x);\n'
                + (f"return std::string(buf) + {cpp_str(suffix)};" if suffix else "return std::string(buf);")
            )}})  # fmt: skip
        elif el["role"] == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def weather(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Condition icon, temperature and description (weather.* entity)."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    style = ctx.widget_style(widget)
    data = state_texts()
    conditions = data["weather"]
    unknown = data["weather_unknown"]
    src = ctx.source("text", entity)
    temp = ctx.source("number", entity, "temperature")
    humidity = ctx.source("number", entity, "humidity") if props.get("show_humidity", True) else None
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        role = el["role"]
        if role == "icon":
            glyphs = {}
            for cond, info in [*conditions.items(), ("", unknown)]:
                found = ctx.fonts.icon_font(el["size"], info["icon"])
                if found:
                    glyphs[cond] = found[1]
            children.append(ctx.element(el, f"{wid}_icon", unknown["icon"], style, f"{wid}_circle"))
            mapping = {k: v for k, v in glyphs.items() if k}
            src.actions.append({"lvgl.label.update": {"id": f"{wid}_icon", "text": Lambda(
                _map_lambda("x", mapping, glyphs.get("", "?"))
            )}})  # fmt: skip
        elif role == "value":
            ctx.fonts.text_font(el["size"], "0123456789-°")
            children.append(ctx.element(el, f"{wid}_temp", "--", style))
            temp.actions.append({"lvgl.label.update": {"id": f"{wid}_temp", "text": Lambda(
                'if (std::isnan(x)) return std::string("--");\n'
                'char buf[12];\nsnprintf(buf, sizeof(buf), "%.0f°", x);\nreturn std::string(buf);'
            )}})  # fmt: skip
        elif role == "state":
            texts = {k: v[ctx.lang] for k, v in conditions.items()}
            ctx.fonts.text_font(el["size"], "".join(texts.values()) + "0123456789 %·")
            children.append(ctx.element(el, f"{wid}_state", unknown[ctx.lang], style))
            hum = (f"const float h = id({humidity.id}).state;\nif (std::isnan(h)) return t;\n"
                   'char buf[64];\nsnprintf(buf, sizeof(buf), "%s · %d %%", t.c_str(), (int) lroundf(h));\n'
                   "return std::string(buf);") if humidity else "return t;"  # fmt: skip
            text = Lambda(
                f"const std::string st = id({src.id}).state;\n"
                f"const std::string t = [&]() -> std::string {{\n{_map_lambda('st', texts, unknown[ctx.lang])}\n}}();\n"
                + hum
            )
            update = {"lvgl.label.update": {"id": f"{wid}_state", "text": text}}
            src.actions.append(update)
            if humidity:
                humidity.actions.append(update)
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def multi_entities(widget: dict[str, Any]) -> list[tuple[str, str, str]]:
    """(entity, label, unit) of a multi_value widget, in order, only set entities."""
    props = widget.get("props", {})
    out = []
    if widget.get("entity"):
        out.append((widget["entity"], str(props.get("label") or ""), str(props.get("unit") or "")))
    for n in (2, 3):
        if props.get(f"entity_{n}"):
            out.append((props[f"entity_{n}"], str(props.get(f"label_{n}") or ""), str(props.get(f"unit_{n}") or "")))
    return out


def multi_value(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Up to three values side by side."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    style = ctx.widget_style(widget)
    items = multi_entities(widget)
    decimals = max(0, min(int(props.get("decimals", 1)), 2))
    children: list[Any] = []
    for el in elements(ctx, widget, rect, {"_count": len(items)}, style=style):
        index = int(el["role"][-1])
        if index >= len(items):
            continue
        entity, label, unit = items[index]
        if el["role"].startswith("label"):
            children.append(ctx.element(el, None, label or fallback_label(entity), style))
        else:
            suffix = f" {unit}" if unit else ""
            ctx.fonts.text_font(el["size"], "0123456789.,-" + suffix)
            children.append(ctx.element(el, f"{wid}_v{index}", "--", style))
            ctx.source("number", entity).actions.append({"lvgl.label.update": {"id": f"{wid}_v{index}", "text": Lambda(
                'if (std::isnan(x)) return std::string("--");\n'
                f'char buf[24];\nsnprintf(buf, sizeof(buf), "%.{decimals}f", x);\n'
                + (f"return std::string(buf) + {cpp_str(suffix)};" if suffix else "return std::string(buf);")
            )}})  # fmt: skip
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]
