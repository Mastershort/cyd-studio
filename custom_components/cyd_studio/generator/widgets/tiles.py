"""Entity tiles: toggle_tile, sensor_value, binary_indicator."""

from __future__ import annotations

from typing import Any

from ..context import Context, cpp_str
from ..emit import Lambda
from ..layout import Rect
from .common import box, elements, fallback_label, page_show, widget_id

# Attribute that holds the tile's value, and how the device helper interprets it:
# 1 = light brightness 0..255, 2 = cover position 0..100, 3 = fan percentage 0..100
VALUE_ATTRIBUTES: dict[str, tuple[str, int]] = {
    "light": ("brightness", 1),
    "cover": ("current_position", 2),
    "fan": ("percentage", 3),
}


def _register_state_texts(ctx: Context, size: int, *texts: str) -> None:
    s = ctx.strings
    ctx.fonts.text_font(
        size,
        "".join(texts)
        + "0123456789 %"
        + "".join(
            s[k] for k in ("on", "off", "open", "closed", "opening", "closing", "locked", "unlocked", "unavailable")
        ),
    )


def _state_call(
    tile: str | None,
    icon: str | None,
    label: str | None,
    x: str,
    value: str,
    kind: int,
    text_on: str | None,
    text_off: str | None,
    color_on: str,
    color_off: str,
) -> dict[str, Any]:
    """One-line call of the shared helper ``cyd_tile_state`` (see generate._state_helper)."""

    def ptr(obj_id: str | None) -> str:
        return f"id({obj_id})" if obj_id else "nullptr"

    def text(value: str | None) -> str:
        return cpp_str(value) if value else "nullptr"

    args = [ptr(tile), ptr(icon), ptr(label), x, value, str(kind), text(text_on), text(text_off), color_on, color_off]
    return {"lambda": Lambda(f"id(cyd_tile_state)({', '.join(args)});")}


def _wire_state(
    ctx: Context,
    entity: str,
    tile: str | None,
    icon: str | None,
    label: str | None,
    kind: int,
    attribute: str | None,
    text_on: str | None,
    text_off: str | None,
    color_on: str,
    color_off: str,
) -> tuple[str, str | None]:
    """Mirror the entity (and optionally its value attribute) and update the tile on every change."""
    ctx.helpers.add("state")
    src = ctx.source("text", entity)
    attr = ctx.source("number", entity, attribute) if attribute else None
    value_now = f"id({attr.id}).state" if attr else "NAN"
    src.actions.append(_state_call(tile, icon, label, "x", value_now, kind, text_on, text_off, color_on, color_off))
    if attr:
        attr.actions.append(
            _state_call(tile, icon, label, f"id({src.id}).state", "x", kind, text_on, text_off, color_on, color_off)
        )
    return src.id, attr.id if attr else None


def toggle_tile(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Tile that toggles an entity; optional value line and long press slider."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    domain = entity.split(".", 1)[0]
    label_text = props.get("label") or fallback_label(entity)
    attribute, kind = VALUE_ATTRIBUTES.get(domain, (None, 0))
    slider = kind > 0 and props.get("long_press", "slider") == "slider"
    show_value = kind > 0 and props.get("show_value", True)
    children = []
    icon_id = state_id = None
    for el in elements(ctx, widget, rect):
        if el["role"] == "icon":
            icon = ctx.label(el, f"{wid}_icon", props.get("icon", ""))
            icon_id = f"{wid}_icon" if icon else None
            children.append(icon)
        elif el["role"] == "label":
            children.append(ctx.label(el, f"{wid}_label", label_text))
        elif el["role"] == "state":
            _register_state_texts(ctx, el["size"])
            children.append(ctx.label(el, f"{wid}_state", ctx.strings["unknown"]))
            state_id = f"{wid}_state"

    src_id, attr_id = _wire_state(
        ctx, entity, wid, icon_id, state_id, kind if show_value else 0,
        attribute if (show_value or slider) else None,
        None, None, ctx.color_hex("on"), ctx.color_hex("off"),
    )  # fmt: skip

    extra: dict[str, Any] = {
        "on_short_click": [
            {"homeassistant.action": {"action": "homeassistant.toggle", "data": {"entity_id": ctx.ent(entity)}}}
        ]
    }
    if slider and attr_id:
        ctx.helpers.add("overlay")
        ctx.fonts.text_font(ctx.font_sizes.get("m", 16), label_text)
        extra["on_long_press"] = [
            {
                "script.execute": {
                    "id": "cyd_overlay_open",
                    "entity": ctx.ent(entity),
                    "title": label_text,
                    "kind": kind,
                    "value": Lambda(f"return id(cyd_percent)(id({src_id}).state, id({attr_id}).state, {kind});"),
                }
            }
        ]
    return [box(ctx, "button", wid, rect, children, clickable=True, style=None, **extra)]


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
    icon_id = state_id = None
    for el in elements(ctx, widget, rect):
        if el["role"] == "icon":
            icon = ctx.label(el, f"{wid}_icon", props.get("icon", ""))
            icon_id = f"{wid}_icon" if icon else None
            children.append(icon)
        elif el["role"] == "label":
            children.append(ctx.label(el, None, label_text))
        elif el["role"] == "state":
            _register_state_texts(ctx, el["size"], text_on, text_off)
            children.append(ctx.label(el, f"{wid}_state", ctx.strings["unknown"]))
            state_id = f"{wid}_state"

    on_color = ctx.color_hex("error") if props.get("alert_on", True) else ctx.color_hex("accent")
    _wire_state(ctx, entity, None, icon_id, state_id, 0, None, text_on, text_off, on_color, ctx.color_hex("on"))
    return [box(ctx, "obj", wid, rect, children, clickable=False)]
