"""Buttons: scene_button (runs an action), page_button (navigates)."""

from __future__ import annotations

from typing import Any

from ..context import Context
from ..layout import Rect
from .common import box, elements, fallback_label, page_show, widget_id


def _button(
    ctx: Context, wid: str, widget: dict[str, Any], rect: Rect, text: str, icon: str, on_click: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    children = []
    for el in elements(ctx, widget, rect, {"icon": icon}):
        if el["role"] == "icon":
            children.append(ctx.label(el, None, icon))
        else:
            children.append(ctx.label(el, None, text))
    return [box(ctx, "button", wid, rect, children, clickable=True, style=None, on_short_click=on_click)]


def scene_button(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Button that runs a Home Assistant action."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    action = widget.get("action") or {}
    service = action.get("service", "")
    target = action.get("target")
    data: dict[str, Any] = {}
    if target:
        data["entity_id"] = ctx.ent(target)
    for key in sorted((action.get("data") or {}).keys()):
        value = action["data"][key]
        # homeassistant.action only accepts strings as data values
        if isinstance(value, bool):
            value = "true" if value else "false"
        data[key] = str(value)
    call: dict[str, Any] = {"action": service}
    if data:
        call["data"] = data
    text = props.get("label") or fallback_label(target) or service
    return _button(ctx, wid, widget, rect, text, props.get("icon", ""), [{"homeassistant.action": call}])


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
