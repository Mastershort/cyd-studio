"""Entity tiles: toggle_tile, sensor_value, binary_indicator."""

from __future__ import annotations

from typing import Any

from ..context import Context, cpp_str
from ..emit import Lambda
from ..layout import Rect
from .common import box, color_array, elements, fallback_label, page_show, widget_id

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


class _Parts:
    """LVGL ids of the parts of a tile that change with the state (None = not present)."""

    def __init__(self) -> None:
        self.tile: str | None = None
        self.icon: str | None = None
        self.title: str | None = None
        self.state: str | None = None
        self.circle: str | None = None


def _state_call(parts: _Parts, x: str, value: str, kind: int, text_on: str | None, text_off: str | None,
                colors: str) -> dict[str, Any]:  # fmt: skip
    """One call of the shared helper ``cyd_tile_state`` (see generate._helper_globals)."""

    def ptr(obj_id: str | None) -> str:
        return f"id({obj_id})" if obj_id else "nullptr"

    def text(value: str | None) -> str:
        return cpp_str(value) if value else "nullptr"

    args = [ptr(parts.tile), ptr(parts.icon), ptr(parts.title), ptr(parts.state), ptr(parts.circle),
            x, value, str(kind), text(text_on), text(text_off), "c"]  # fmt: skip
    return {"lambda": Lambda(f"static const uint32_t c[] = {{{colors}}};\nid(cyd_tile_state)({', '.join(args)});")}


def _wire_state(ctx: Context, entity: str, parts: _Parts, kind: int, attribute: str | None,
                text_on: str | None, text_off: str | None, colors: str, wid: str | None = None,
                ) -> tuple[str, str | None]:  # fmt: skip
    """Mirror the entity (and optionally its value attribute) and update the tile on every change."""
    ctx.helpers.add("state")
    src = ctx.source("text", entity)
    attr = ctx.source("number", entity, attribute) if attribute else None
    if wid:
        # used by state rules to restore the normal on/off colors before applying a rule
        replay = _state_call(parts, f"id({src.id}).state", f"id({attr.id}).state" if attr else "NAN", kind,
                             text_on, text_off, colors)  # fmt: skip
        ctx.state_replays[wid] = replay["lambda"].code
        ctx.state_sources[wid] = [src.id, *([attr.id] if attr else [])]
    value_now = f"id({attr.id}).state" if attr else "NAN"
    src.actions.append(_state_call(parts, "x", value_now, kind, text_on, text_off, colors))
    if attr:
        attr.actions.append(_state_call(parts, f"id({src.id}).state", "x", kind, text_on, text_off, colors))
    return src.id, attr.id if attr else None


def _tile_children(ctx: Context, widget: dict[str, Any], rect: Rect, style: dict[str, Any], wid: str,
                   label_text: str, state_texts: tuple[str, ...] = ()) -> tuple[list[Any], _Parts]:  # fmt: skip
    props = widget.get("props", {})
    parts = _Parts()
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "icon":
            icon = ctx.element(el, f"{wid}_icon", props.get("icon", ""), style, f"{wid}_circle")
            if icon:
                parts.icon = f"{wid}_icon"
                parts.circle = f"{wid}_circle" if el.get("circle") else None
            children.append(icon)
        elif el["role"] == "label":
            children.append(ctx.element(el, f"{wid}_label", label_text, style))
            parts.title = f"{wid}_label"
        elif el["role"] == "state":
            _register_state_texts(ctx, el["size"], *state_texts)
            children.append(ctx.element(el, f"{wid}_state", ctx.strings["unknown"], style))
            parts.state = f"{wid}_state"
    return children, parts


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
    style = ctx.widget_style(widget)
    children, parts = _tile_children(ctx, widget, rect, style, wid, label_text)
    parts.tile = wid
    pairs = [("icon_on", "icon"), ("text_on", "text"), ("sub_on", "sub"), ("circle_bg_on", "circle_bg")]
    colors = color_array(ctx, [(style[on], style[off]) for on, off in pairs])
    src_id, attr_id = _wire_state(ctx, entity, parts, kind if show_value else 0,
                                  attribute if (show_value or slider) else None, None, None, colors, wid)  # fmt: skip

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
    return [box(ctx, "button", wid, rect, children, clickable=True, style=None, tile_style=style, **extra)]


def sensor_value(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Large sensor value with unit."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    label_text = props.get("label") or fallback_label(entity)
    unit = props.get("unit") or ""
    decimals = max(0, min(int(props.get("decimals", 1)), 3))
    numeric = props.get("numeric", True)
    style = ctx.widget_style(widget)
    children = []
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "icon":
            children.append(ctx.element(el, None, props.get("icon", ""), style))
        elif el["role"] == "label":
            children.append(ctx.element(el, None, label_text, style))
        elif el["role"] == "value":
            ctx.fonts.text_font(el["size"], unit)
            children.append(ctx.element(el, f"{wid}_value", "--", style))

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
    return [box(ctx, "obj", wid, rect, children, clickable=clickable, tile_style=style, **extra)]


def binary_indicator(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Icon + text colored by an on/off state (on = alert red or accent, off = green)."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    label_text = props.get("label") or fallback_label(entity)
    text_on = props.get("text_on") or ctx.strings["on"]
    text_off = props.get("text_off") or ctx.strings["off"]
    style = ctx.widget_style(widget)
    children, parts = _tile_children(ctx, widget, rect, style, wid, label_text, (text_on, text_off))
    parts.title = None  # the title color does not change with the state
    colors_map = ctx.theme["colors"]
    alert = colors_map["error"] if props.get("alert_on", True) else colors_map["accent"]
    colors = color_array(ctx, [(alert, colors_map["on"]), (style["text"], style["text"]),
                               (style["sub"], style["sub"]), (style["circle_bg"], style["circle_bg"])])  # fmt: skip
    _wire_state(ctx, entity, parts, 0, None, text_on, text_off, colors, wid)
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]
