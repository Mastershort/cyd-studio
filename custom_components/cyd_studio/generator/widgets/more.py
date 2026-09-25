"""More widgets: number_stepper, select, countdown, person_presence, qr_code, divider, spacer, button_grid."""

from __future__ import annotations

from typing import Any

from ..context import Context, cpp_str
from ..emit import Lambda
from ..layout import Rect
from .common import box, color_array, elements, fallback_label, widget_id
from .controls import _action, _small_button
from .tiles import _tile_children, _wire_state

# action per target domain for buttons without an explicit action
DEFAULT_ACTIONS = {
    "scene": "scene.turn_on", "script": "script.turn_on", "button": "button.press",
    "input_button": "input_button.press", "automation": "automation.trigger",
}  # fmt: skip


def cpp_float(value: float) -> str:
    """C++ float literal (always with a decimal point: 10 -> 10.0f)."""
    return f"{float(value)!r}f"


def number_stepper(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """− / value / + for input_number, number and counter."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    domain = entity.split(".", 1)[0]
    style = ctx.widget_style(widget)
    step = float(props.get("step", "1"))
    vmin, vmax = float(props.get("min", 0)), float(props.get("max", 100))
    decimals = max(0, min(int(props.get("decimals", 0)), 2))
    unit = str(props.get("unit") or "")
    suffix = f" {unit}" if unit else ""
    src = ctx.source("number", entity)
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        role = el["role"]
        if role == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
        elif role == "state":
            continue
        elif role == "value":
            ctx.fonts.text_font(el["size"], "0123456789.,-" + suffix)
            children.append(ctx.element(el, f"{wid}_value", "--", style))
            src.actions.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
                'if (std::isnan(x)) return std::string("--");\n'
                f'char buf[24];\nsnprintf(buf, sizeof(buf), "%.{decimals}f", x);\n'
                + (f"return std::string(buf) + {cpp_str(suffix)};" if suffix else "return std::string(buf);")
            )}})  # fmt: skip
        else:
            plus = role == "plus"
            if domain == "counter":
                call = _action("counter.increment" if plus else "counter.decrement", entity, ctx)
            else:
                value = Lambda(
                    f"float v = id({src.id}).state;\nif (std::isnan(v)) v = {cpp_float(vmin)};\n"
                    f"v = std::min({cpp_float(vmax)}, std::max({cpp_float(vmin)}, "
                    f"v + ({cpp_float(step if plus else -step)})));\n"
                    f'char buf[16];\nsnprintf(buf, sizeof(buf), "%.{max(decimals, 1)}f", v);\nreturn std::string(buf);'
                )
                call = _action(f"{domain}.set_value", entity, ctx, value=value)
            children.append(_small_button(ctx, el, "mdi:plus" if plus else "mdi:minus", style, [call]))
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def select(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Current option with ‹ previous / next ›."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    domain = entity.split(".", 1)[0]
    style = ctx.widget_style(widget)
    src = ctx.source("text", entity)
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        role = el["role"]
        if role == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
        elif role == "state":
            continue
        elif role == "value":
            # option texts are dynamic: register common Latin characters
            ctx.fonts.text_font(el["size"], "")
            children.append(ctx.element(el, f"{wid}_value", "--", style))
            src.actions.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
                'if (x.empty() || x == "unknown" || x == "unavailable") return std::string("--");\nreturn x;'
            )}})  # fmt: skip
        else:
            action = f"{domain}.select_next" if role == "plus" else f"{domain}.select_previous"
            icon = "mdi:chevron-right" if role == "plus" else "mdi:chevron-left"
            children.append(_small_button(ctx, el, icon, style, [_action(action, entity, ctx)]))
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def countdown(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Remaining time of a timer (progress bar) or until a timestamp; refreshed every second."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    is_timer = entity.split(".", 1)[0] == "timer"
    style = ctx.widget_style(widget)
    ctx.helpers.add("time_parse")
    ctx.needs_seconds = True
    src = ctx.source("text", entity)
    if is_timer:
        fin = ctx.source("text", entity, "finishes_at")
        rem = ctx.source("text", entity, "remaining")
        dur = ctx.source("text", entity, "duration")
        remaining = (
            f"const std::string st = id({src.id}).state;\nlong rem = -2;\n"
            f'if (st == "active") {{\n  const long end = id(cyd_parse_time)(id({fin.id}).state);\n'
            "  if (end > 0) rem = std::max(0L, end - (long) now.timestamp);\n}\n"
            f'else if (st == "paused") rem = id(cyd_parse_duration)(id({rem.id}).state);\n'
        )
        total = f"const long total = id(cyd_parse_duration)(id({dur.id}).state);\n"
    else:
        remaining = (
            f"long rem = -2;\nconst long end = id(cyd_parse_time)(id({src.id}).state);\n"
            "if (end > 0) rem = std::max(0L, end - (long) now.timestamp);\n"
        )
        total = "const long total = -1;\n"
    head = "auto now = id(ha_time).now();\nif (!now.is_valid()) return {bad};\n" + remaining
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        role = el["role"]
        if role == "label":
            children.append(ctx.element(el, None, props.get("label") or fallback_label(entity), style))
        elif role == "value":
            ctx.fonts.text_font(el["size"], "0123456789:–")
            children.append(ctx.element(el, f"{wid}_value", "–", style))
            ctx.time_updates.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(
                head.replace("{bad}", 'std::string("–")')
                + 'if (rem < 0) return std::string("–");\n'
                "char buf[16];\n"
                "if (rem >= 3600)\n"
                '  snprintf(buf, sizeof(buf), "%ld:%02ld:%02ld", rem / 3600, (rem / 60) % 60, rem % 60);\n'
                'else snprintf(buf, sizeof(buf), "%02ld:%02ld", rem / 60, rem % 60);\n'
                "return std::string(buf);"
            )}})  # fmt: skip
        elif role == "bar":
            ctx.objects += 1
            conf: dict[str, Any] = {
                "id": f"{wid}_bar",
                "align": el["align"],
                "width": el["width"],
                "height": el["height"],
                "min_value": 0,
                "max_value": 100,
                "value": 0,
                "bg_color": ctx.hex(style["track"]),
                "bg_opa": "COVER",
                "indicator": {"bg_color": ctx.hex(style["fill"]), "bg_opa": "COVER"},
            }
            children.append({"bar": conf})
            ctx.time_updates.append({"lvgl.bar.update": {"id": f"{wid}_bar", "value": Lambda(
                head.replace("{bad}", "0") + total
                + "if (rem < 0 || total <= 0) return 0;\n"
                "return (int) std::min(100L, std::max(0L, (total - rem) * 100 / total));"
            )}})  # fmt: skip
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def person_presence(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Person at home (on) or away (off)."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    label_text = props.get("label") or fallback_label(entity)
    text_on = props.get("text_on") or ("Zuhause" if ctx.lang == "de" else "Home")
    text_off = props.get("text_off") or ("Unterwegs" if ctx.lang == "de" else "Away")
    style = ctx.widget_style(widget)
    children, parts = _tile_children(ctx, widget, rect, style, wid, label_text, (text_on, text_off))
    parts.title = None
    pairs = [("icon_on", "icon"), ("text", "text"), ("sub", "sub"), ("circle_bg_on", "circle_bg")]
    _wire_state(ctx, entity, parts, 0, None, text_on, text_off,
                color_array(ctx, [(style[on], style[off]) for on, off in pairs]), wid)  # fmt: skip
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]


def qr_code(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """QR code from static text or an entity's state."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget.get("entity")
    style = ctx.widget_style(widget)
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "qr":
            ctx.objects += 1
            conf: dict[str, Any] = {"id": f"{wid}_qr", "align": el["align"], "size": el["width"],
                                    "dark_color": ctx.hex("#000000"), "light_color": ctx.hex("#ffffff"),
                                    "text": str(props.get("text") or " ")}  # fmt: skip
            children.append({"qrcode": conf})
            if entity:
                ctx.source("text", entity).actions.append(
                    {
                        "lvgl.qrcode.update": {
                            "id": f"{wid}_qr",
                            "text": Lambda('return x.empty() ? std::string(" ") : x;'),
                        }
                    }
                )
        elif el["role"] == "label":
            children.append(ctx.element(el, None, str(props.get("label") or ""), style))
    return [box(ctx, "obj", wid, rect, children, clickable=False, style="cyd_plain")]


def divider(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Horizontal line."""
    wid = widget_id(page, widget)
    style = ctx.widget_style(widget)
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        ctx.objects += 1
        children.append({"obj": {"align": el["align"], "width": el["width"], "height": el["height"],
                                 "bg_color": ctx.hex(style["sub"]), "bg_opa": "50%", "border_width": 0,
                                 "radius": 1, "scrollable": False, "clickable": False}})  # fmt: skip
    return [box(ctx, "obj", wid, rect, children, clickable=False, style="cyd_plain")]


def spacer(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Empty space: nothing on the device."""
    return []


def grid_buttons(widget: dict[str, Any]) -> list[dict[str, str]]:
    """Configured buttons of a button_grid (label, icon, target, service)."""
    props = widget.get("props", {})
    count = max(1, min(int(props.get("count", 4)), 6))
    out = []
    for i in range(1, count + 1):
        target = str(props.get(f"target_{i}") or "")
        service = str(props.get(f"service_{i}") or "") or DEFAULT_ACTIONS.get(target.split(".", 1)[0], "")
        if target and not service:
            service = "homeassistant.toggle"
        out.append({"label": str(props.get(f"label_{i}") or ""), "icon": str(props.get(f"icon_{i}") or ""),
                    "target": target, "service": service})  # fmt: skip
    return out


def button_grid(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Up to six action buttons with icon and text."""
    wid = widget_id(page, widget)
    style = ctx.widget_style(widget)
    buttons = grid_buttons(widget)
    children: list[Any] = []
    for el in elements(ctx, widget, rect, {"_count": len(buttons)}, style=style):
        b = buttons[int(el["role"][3:])]
        call: dict[str, Any] = {"action": b["service"] or "homeassistant.toggle"}
        if b["target"]:
            call["data"] = {"entity_id": ctx.ent(b["target"])}
        on_click = [{"homeassistant.action": call}] if b["service"] or b["target"] else []
        label_size = int(el.get("label_size") or 0)
        if not label_size:
            children.append(_small_button(ctx, el, b["icon"] or "mdi:gesture-tap", style, on_click))
            continue
        # icon above, text at the bottom inside the button (same rule as the preview)
        lh = -(-label_size * 1219 // 1000)
        icon_el = {**el, "kind": "icon", "align": "CENTER", "x": 0, "y": -(lh // 2), "width": None}
        text_el = {"kind": "text", "role": "text", "align": "BOTTOM_MID", "x": 0, "y": -2, "size": label_size,
                   "color": "text", "width": max(el["width"] - 4, 1), "text_align": "center"}  # fmt: skip
        inner = [
            ctx.label(icon_el, None, b["icon"] or "mdi:gesture-tap", ctx.hex(style["icon_on"])),
            ctx.label(text_el, None, b["label"] or fallback_label(b["target"]), ctx.hex(style["text"])),
        ]
        ctx.helpers.add("small_button")
        ctx.objects += 1
        conf: dict[str, Any] = {"align": el["align"], "x": el["x"], "y": el["y"], "width": el["width"],
                                "height": el["height"], "styles": "cyd_small_btn"}  # fmt: skip
        if not conf["x"]:
            del conf["x"]
        if not conf["y"]:
            del conf["y"]
        if style["circle_bg"] != ctx.default_style["circle_bg"]:
            conf["bg_color"] = ctx.hex(style["circle_bg"])
        if on_click:
            conf["on_short_click"] = on_click
        conf["widgets"] = [c for c in inner if c]
        children.append({"button": conf})
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]
