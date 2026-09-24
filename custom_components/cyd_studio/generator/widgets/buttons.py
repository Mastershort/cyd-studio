"""Buttons: scene_button (runs an action), page_button (navigates)."""

from __future__ import annotations

from typing import Any

from ..context import Context
from ..layout import Rect
from .common import box, elements, fallback_label, ha_action, page_show, widget_id


def _button(
    ctx: Context, wid: str, widget: dict[str, Any], rect: Rect, text: str, icon: str, on_click: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    children = []
    style = ctx.widget_style(widget)
    for el in elements(ctx, widget, rect, {"icon": icon}, style=style):
        if el["role"] == "icon":
            children.append(ctx.element(el, None, icon, style))
        else:
            children.append(ctx.element(el, None, text, style))
    return [
        box(ctx, "button", wid, rect, children, clickable=True, style=None, tile_style=style, on_short_click=on_click)
    ]


def scene_button(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Button that runs a Home Assistant action."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    action = widget.get("action") or {}
    service = action.get("service", "")
    target = action.get("target")
    text = props.get("label") or fallback_label(target) or service
    call = ha_action(ctx, service, target, action.get("data"))
    return _button(ctx, wid, widget, rect, text, props.get("icon", ""), [call])


def page_button(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Button that opens another page."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    target_id = props.get("target")
    target = next((p for p in ctx.project["pages"] if p["id"] == target_id), None)
    if target is None:
        return []
    text = props.get("label") or target.get("name", "")
    icon = props.get("icon") or target.get("icon", "")
    return _button(ctx, wid, widget, rect, text, icon, [page_show(ctx, target_id, "MOVE_LEFT")])
