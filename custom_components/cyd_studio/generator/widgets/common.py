"""Helpers shared by widget emitters."""

from __future__ import annotations

from typing import Any

from ..context import Context
from ..layout import TILE_PAD, Rect, widget_elements
from ..model import safe_id
from ..style import layout_props
from ..theme import hex_color


def widget_id(page: dict[str, Any], widget: dict[str, Any]) -> str:
    """Stable LVGL id of a widget."""
    return f"w_{safe_id(page['id'])}_{safe_id(widget['id'])}"


def fallback_label(entity: str | None) -> str:
    """Readable label from an entity id (the editor normally fills the friendly name)."""
    if not entity:
        return ""
    return entity.split(".", 1)[-1].replace("_", " ").capitalize()


def elements(
    ctx: Context,
    widget: dict[str, Any],
    rect: Rect,
    extra: dict[str, Any] | None = None,
    style: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Layout elements of a widget (same function as the preview)."""
    props = {**widget.get("props", {}), **(extra or {})}
    if style is not None:
        props = layout_props(props, style)
    return widget_elements(widget["type"], rect.w, rect.h, props, ctx.font_sizes, ctx.icon_sizes)


def opa(value: int) -> str:
    """LVGL opacity literal."""
    if value >= 100:
        return "COVER"
    if value <= 0:
        return "TRANSP"
    return f"{value}%"


def tile_style_props(ctx: Context, style: dict[str, Any], states: bool) -> dict[str, Any]:
    """Local style properties where a widget differs from the project default (theme button / cyd_tile)."""
    d = ctx.default_style
    out: dict[str, Any] = {}
    if style["bg"] != d["bg"]:
        out["bg_color"] = ctx.hex(style["bg"])
    if style["bg_opa"] != d["bg_opa"]:
        out["bg_opa"] = opa(style["bg_opa"])
    if style["border"] != d["border"]:
        out["border_color"] = ctx.hex(style["border"])
    if style["border_width"] != d["border_width"]:
        out["border_width"] = style["border_width"]
        out["pad_all"] = max(TILE_PAD - style["border_width"], 0)  # keep the content box at TILE_PAD
    if style["radius"] != d["radius"]:
        out["radius"] = style["radius"]
    if states:
        checked: dict[str, Any] = {}
        if style["bg_on"] != d["bg_on"]:
            checked["bg_color"] = ctx.hex(style["bg_on"])
            out["pressed"] = {"bg_color": ctx.hex(style["bg_on"])}
        if style["bg_opa_on"] != d["bg_opa_on"]:
            checked["bg_opa"] = opa(style["bg_opa_on"])
        if style["border_on"] != d["border_on"]:
            checked["border_color"] = ctx.hex(style["border_on"])
        if checked:
            out["checked"] = checked
    return out


def box(
    ctx: Context,
    kind: str,
    obj_id: str,
    rect: Rect,
    children: list[dict[str, Any] | None],
    clickable: bool,
    style: str | None = "cyd_tile",
    tile_style: dict[str, Any] | None = None,
    **extra: Any,
) -> dict[str, Any]:
    """Outer container of a widget."""
    ctx.objects += 1
    conf: dict[str, Any] = {
        "id": obj_id,
        "x": rect.x,
        "y": rect.y,
        "width": rect.w,
        "height": rect.h,
    }
    if style:
        conf["styles"] = style
    if tile_style is not None:
        conf.update(tile_style_props(ctx, tile_style, states=kind == "button"))
    conf["scrollable"] = False
    if not clickable:
        conf["clickable"] = False
    conf.update(extra)
    conf["widgets"] = [c for c in children if c]
    return {kind: conf}


def color_array(ctx: Context, pairs: list[tuple[str, str]]) -> str:
    """C++ initializer of on/off color pairs for the state helper."""
    return ", ".join(f"{hex_color(on)}, {hex_color(off)}" for on, off in pairs)


def page_show(ctx: Context, target: str, animation: str = "NONE") -> dict[str, Any]:
    """``lvgl.page.show`` action for a project page id."""
    if animation == "NONE" or ctx.project["navigation"].get("transition") == "none":
        return {"lvgl.page.show": ctx.page_ids[target]}
    return {"lvgl.page.show": {"id": ctx.page_ids[target], "animation": animation, "time": "200ms"}}
