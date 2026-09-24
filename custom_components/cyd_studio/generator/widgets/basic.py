"""Static widgets: clock, label, page_title."""

from __future__ import annotations

from typing import Any

from ..context import Context, cpp_str
from ..emit import Lambda
from ..layout import Rect
from .common import box, elements, page_show, widget_id

TIME_FORMATS = {"HH:mm": "%H:%M", "HH:mm:ss": "%H:%M:%S", "h:mm a": "%I:%M %p"}


def time_lambda(fmt: str) -> Lambda:
    """C++ that renders the current time."""
    placeholder = "--:--:--" if "%S" in fmt else "--:--"
    return Lambda(
        "\n".join(
            [
                "auto now = id(ha_time).now();",
                f'if (!now.is_valid()) return std::string("{placeholder}");',
                f'return now.strftime("{fmt}");',
            ]
        )
    )


def date_lambda(ctx: Context) -> Lambda:
    """C++ that renders the localized date."""
    s = ctx.strings
    days = ", ".join(cpp_str(d) for d in s["days"])
    months = ", ".join(cpp_str(m) for m in s["months"])
    if ctx.lang == "de":
        fmt, args = '"%s, %d. %s"', "days[now.day_of_week - 1], now.day_of_month, months[now.month - 1]"
    else:
        fmt, args = '"%s, %s %d"', "days[now.day_of_week - 1], months[now.month - 1], now.day_of_month"
    return Lambda(
        "\n".join(
            [
                f"static const char *const days[] = {{{days}}};",
                f"static const char *const months[] = {{{months}}};",
                "auto now = id(ha_time).now();",
                'if (!now.is_valid()) return std::string("");',
                "char buf[48];",
                f"snprintf(buf, sizeof(buf), {fmt}, {args});",
                "return std::string(buf);",
            ]
        )
    )


def register_date_glyphs(ctx: Context, size: int) -> None:
    """Make sure all weekday/month characters exist in the font."""
    ctx.fonts.text_font(size, "".join(ctx.strings["days"]) + "".join(ctx.strings["months"]))


def clock(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Time (and date) label."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    fmt = TIME_FORMATS.get(props.get("format", "HH:mm"), "%H:%M")
    if "%S" in fmt:
        ctx.needs_seconds = True
    children = []
    style = ctx.widget_style(widget)
    for el in elements(ctx, widget, rect, style=style):
        if el["role"] == "time":
            children.append(ctx.element(el, f"{wid}_time", "--:--", style))
            ctx.time_updates.append({"lvgl.label.update": {"id": f"{wid}_time", "text": time_lambda(fmt)}})
        elif el["role"] == "date":
            register_date_glyphs(ctx, el["size"])
            children.append(ctx.element(el, f"{wid}_date", "", style))
            ctx.time_updates.append({"lvgl.label.update": {"id": f"{wid}_date", "text": date_lambda(ctx)}})
    return [box(ctx, "obj", wid, rect, children, clickable=False, style="cyd_plain")]


def label(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Free text."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    style = ctx.widget_style(widget)
    text = str(props.get("text", ""))
    children = [ctx.element(el, None, text, style) for el in elements(ctx, widget, rect, style=style)]
    if props.get("background"):
        return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]
    return [box(ctx, "obj", wid, rect, children, clickable=False, style="cyd_plain")]


def page_title(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Title of the page this widget sits on, with back arrow on sub pages."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    parent = page.get("parent")
    has_back = bool(parent and props.get("show_back", True) and parent in ctx.page_ids)
    children = []
    style = ctx.widget_style(widget)
    for el in elements(ctx, widget, rect, {"_has_back": has_back}, style=style):
        if el["role"] == "back":
            children.append(ctx.element(el, None, "mdi:chevron-left", style))
        else:
            children.append(ctx.element(el, None, page.get("name", ""), style))
    extra: dict[str, Any] = {}
    if has_back and parent:
        extra["on_short_click"] = [page_show(ctx, parent, "MOVE_RIGHT")]
    return [box(ctx, "obj", wid, rect, children, clickable=has_back, style="cyd_plain", **extra)]
