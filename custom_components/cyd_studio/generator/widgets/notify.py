"""notification_area: shows the last message sent by Home Assistant (action show_message)."""

from __future__ import annotations

from typing import Any

from ..context import Context
from ..layout import Rect
from .common import box, elements, widget_id


def notification_area(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Last message: title and text (updated by the cyd_show_message script)."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    style = ctx.widget_style(widget)
    ctx.helpers.add("messages")
    empty = str(props.get("empty_text") or ("Keine Meldungen" if ctx.lang == "de" else "No messages"))
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "icon":
            children.append(ctx.element(el, None, props.get("icon") or "mdi:bell-outline", style, None))
        elif el["role"] == "label":
            children.append(ctx.element(el, f"{wid}_title", empty, style))
        elif el["role"] == "state":
            children.append(ctx.element(el, f"{wid}_text", "", style))
    ctx.notification_labels.append((f"{wid}_title", f"{wid}_text"))
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]
