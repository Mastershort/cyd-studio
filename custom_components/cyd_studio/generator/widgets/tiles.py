"""Entity tiles: toggle_tile, sensor_value, binary_indicator."""

from __future__ import annotations

from typing import Any

from ..context import ON_STATES, Context, cpp_str
from ..emit import Lambda, Raw
from ..layout import Rect
from .common import box, elements, fallback_label, page_show, widget_id


def _is_on_expr() -> str:
    return " || ".join(f'x == "{s}"' for s in ON_STATES)


def _state_text_lambda(ctx: Context, text_on: str | None = None, text_off: str | None = None) -> Lambda:
    s = ctx.strings
    mapping = [
        ("on", text_on or s["on"]),
        ("off", text_off or s["off"]),
        ("open", text_on or s["open"]),
        ("closed", text_off or s["closed"]),
        ("opening", s["opening"]),
        ("closing", s["closing"]),
        ("locked", text_off or s["locked"]),
        ("unlocked", text_on or s["unlocked"]),
        ("unavailable", s["unavailable"]),
    ]
    lines = [f'if (x == "{state}") return std::string({cpp_str(text)});' for state, text in mapping]
    lines.append(f'if (x.empty() || x == "unknown") return std::string({cpp_str(s["unknown"])});')
    lines.append("return x;")
    return Lambda("\n".join(lines))


def _register_state_texts(ctx: Context, size: int, *texts: str) -> None:
    s = ctx.strings
    ctx.fonts.text_font(
        size,
        "".join(texts)
        + "".join(
            s[k] for k in ("on", "off", "open", "closed", "opening", "closing", "locked", "unlocked", "unavailable")
        ),
    )


def _icon_color_update(icon_id: str, on_color: str, off_color: str) -> dict[str, Any]:
    """Color the icon label by state."""
    return {
        "if": {
            "condition": {"lambda": Lambda(f"return {_is_on_expr()};")},
            "then": [{"lvgl.label.update": {"id": icon_id, "text_color": Raw(on_color)}}],
            "else": [{"lvgl.label.update": {"id": icon_id, "text_color": Raw(off_color)}}],
        }
    }


def toggle_tile(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Tile that toggles an entity."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    label_text = props.get("label") or fallback_label(entity)
    children = []
    has_icon = has_state = False
    for el in elements(ctx, widget, rect):
        if el["role"] == "icon":
            icon = ctx.label(el, f"{wid}_icon", props.get("icon", ""))
            has_icon = icon is not None
            children.append(icon)
        elif el["role"] == "label":
            children.append(ctx.label(el, f"{wid}_label", label_text))
        elif el["role"] == "state":
            _register_state_texts(ctx, el["size"])
            children.append(ctx.label(el, f"{wid}_state", ctx.strings["unknown"]))
            has_state = True

    src = ctx.source("text", entity)
    src.actions.append(
        {
            "lvgl.widget.update": {
                "id": wid,
                "state": {
                    "checked": Lambda(f"return {_is_on_expr()};"),
                    "disabled": Lambda('return x == "unavailable";'),
                },
            }
        }
    )
    if has_icon:
        src.actions.append(_icon_color_update(f"{wid}_icon", ctx.color_hex("on"), ctx.color_hex("off")))
    if has_state:
        src.actions.append({"lvgl.label.update": {"id": f"{wid}_state", "text": _state_text_lambda(ctx)}})

    on_click = [{"homeassistant.action": {"action": "homeassistant.toggle", "data": {"entity_id": ctx.ent(entity)}}}]
    return [box(ctx, "button", wid, rect, children, clickable=True, style=None, on_short_click=on_click)]


def sensor_value(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Large sensor value with unit."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    label_text = props.get("label") or fallback_label(entity)
    unit = props.get("unit") or ""
    decimals = max(0, min(int(props.get("decimals", 1)), 3))
    numeric = props.get("numeric", True)
    children = []
    for el in elements(ctx, widget, rect):
        if el["role"] == "icon":
            children.append(ctx.label(el, None, props.get("icon", "")))
        elif el["role"] == "label":
            children.append(ctx.label(el, None, label_text))
        elif el["role"] == "value":
            ctx.fonts.text_font(el["size"], unit)
            children.append(ctx.label(el, f"{wid}_value", "--"))

    suffix = f" {unit}" if unit else ""
    if numeric:
        src = ctx.source("number", entity)
        code = "\n".join(
            [
                'if (std::isnan(x)) return std::string("--");',
                "char buf[24];",
                f'snprintf(buf, sizeof(buf), "%.{decimals}f", x);',
                f"return std::string(buf) + {cpp_str(suffix)};" if suffix else "return std::string(buf);",
            ]
        )
    else:
        src = ctx.source("text", entity)
        code = "\n".join(
            [
                'if (x.empty() || x == "unknown" || x == "unavailable") return std::string("--");',
                f"return x + {cpp_str(suffix)};" if suffix else "return x;",
            ]
        )
    src.actions.append({"lvgl.label.update": {"id": f"{wid}_value", "text": Lambda(code)}})

    extra: dict[str, Any] = {}
    tap = props.get("tap_page")
    clickable = bool(tap and tap in ctx.page_ids)
    if clickable:
        extra["on_short_click"] = [page_show(ctx, tap, "MOVE_LEFT")]
    return [box(ctx, "obj", wid, rect, children, clickable=clickable, **extra)]


def binary_indicator(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Icon + text colored by an on/off state."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    label_text = props.get("label") or fallback_label(entity)
    text_on = props.get("text_on") or ctx.strings["on"]
    text_off = props.get("text_off") or ctx.strings["off"]
    children = []
    has_icon = False
    for el in elements(ctx, widget, rect):
        if el["role"] == "icon":
            icon = ctx.label(el, f"{wid}_icon", props.get("icon", ""))
            has_icon = icon is not None
            children.append(icon)
        elif el["role"] == "label":
            children.append(ctx.label(el, None, label_text))
        elif el["role"] == "state":
            _register_state_texts(ctx, el["size"], text_on, text_off)
            children.append(ctx.label(el, f"{wid}_state", ctx.strings["unknown"]))

    src = ctx.source("text", entity)
    on_color = ctx.color_hex("error") if props.get("alert_on", True) else ctx.color_hex("accent")
    if has_icon:
        src.actions.append(_icon_color_update(f"{wid}_icon", on_color, ctx.color_hex("on")))
    src.actions.append(
        {"lvgl.label.update": {"id": f"{wid}_state", "text": _state_text_lambda(ctx, text_on, text_off)}}
    )
    return [box(ctx, "obj", wid, rect, children, clickable=False)]
