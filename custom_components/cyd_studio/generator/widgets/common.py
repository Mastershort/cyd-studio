"""Helpers shared by widget emitters."""

from __future__ import annotations

from typing import Any

from ..context import Context
from ..layout import Rect, widget_elements
from ..model import safe_id


def widget_id(page: dict[str, Any], widget: dict[str, Any]) -> str:
    """Stable LVGL id of a widget."""
    return f"w_{safe_id(page['id'])}_{safe_id(widget['id'])}"


def fallback_label(entity: str | None) -> str:
    """Readable label from an entity id (the editor normally fills the friendly name)."""
    if not entity:
        return ""
    return entity.split(".", 1)[-1].replace("_", " ").capitalize()


def elements(
    ctx: Context, widget: dict[str, Any], rect: Rect, extra: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    """Layout elements of a widget (same function as the preview)."""
    props = {**widget.get("props", {}), **(extra or {})}
    return widget_elements(widget["type"], rect.w, rect.h, props, ctx.font_sizes, ctx.icon_sizes)


def box(
    ctx: Context,
    kind: str,
    obj_id: str,
    rect: Rect,
    children: list[dict[str, Any] | None],
    clickable: bool,
    style: str | None = "cyd_tile",
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
    conf["scrollable"] = False
    if not clickable:
        conf["clickable"] = False
    conf.update(extra)
    conf["widgets"] = [c for c in children if c]
    return {kind: conf}


def page_show(ctx: Context, target: str, animation: str = "NONE") -> dict[str, Any]:
    """``lvgl.page.show`` action for a project page id."""
    if animation == "NONE" or ctx.project["navigation"].get("transition") == "none":
        return {"lvgl.page.show": ctx.page_ids[target]}
    return {"lvgl.page.show": {"id": ctx.page_ids[target], "animation": animation, "time": "200ms"}}
