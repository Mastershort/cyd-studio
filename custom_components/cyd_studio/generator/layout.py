"""Shared layout rules: grid cells -> pixels, and widget inner elements.

This module is mirrored 1:1 by ``frontend/src/layout.ts``. Both must produce
identical results for ``tests/layout_cases.json``. Only integer arithmetic with
floor division is used so that Python and TypeScript agree exactly.
Spec: docs/ARCHITECTURE.md, section "Layout".
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# Fixed chrome sizes (px)
TABBAR_H_LABELS = 40
TABBAR_H_ICONS = 32
TABBAR_W_LEFT = 48
HEADER_PAD_X = 6
TILE_PAD = 6
CIRCLE_PAD = 5
ELEMENT_GAP = 6

# Font metrics of Montserrat as rendered by ESPHome (freetype, ascender 968 / descender 251 per 1000 em)
ASCENT_PER_MILLE = 968
LINE_HEIGHT_PER_MILLE = 1219

# Size tokens shared with themes (overridable per theme, these are defaults)
DEFAULT_FONT_SIZES = {"xs": 12, "s": 14, "m": 16, "l": 20, "xl": 28, "xxl": 40}
DEFAULT_ICON_SIZES = {"s": 20, "m": 28, "l": 40}


@dataclass(frozen=True)
class Rect:
    """Pixel rectangle."""

    x: int
    y: int
    w: int
    h: int

    def as_list(self) -> list[int]:
        """Return [x, y, w, h]."""
        return [self.x, self.y, self.w, self.h]


def line_height(size: int) -> int:
    """Line height of a text font of the given pixel size."""
    return -(-size * LINE_HEIGHT_PER_MILLE // 1000)  # ceil


def screen_size(native_w: int, native_h: int, rotation: int) -> tuple[int, int]:
    """Logical screen size after LVGL rotation."""
    if rotation in (90, 270):
        return native_h, native_w
    return native_w, native_h


def _edges(start: int, length: int, count: int, gap: int, index: int) -> tuple[int, int]:
    """Start and exclusive end of cell ``index`` when splitting ``length`` into ``count`` cells."""
    first = start + index * (length + gap) // count
    last = start + (index + 1) * (length + gap) // count - gap
    return first, last


def split(start: int, length: int, count: int, gap: int, index: int, span: int = 1) -> tuple[int, int]:
    """Return (position, size) of a span of cells."""
    first, _ = _edges(start, length, count, gap, index)
    _, last = _edges(start, length, count, gap, index + span - 1)
    return first, last - first


def chrome(project: dict[str, Any], page: dict[str, Any], width: int, height: int) -> dict[str, Rect | None]:
    """Compute header, navigation bar and content rectangles for a page."""
    header_cfg = project.get("global", {}).get("header", {})
    nav = project.get("navigation", {})
    header: Rect | None = None
    tabbar: Rect | None = None
    top = 0
    left = 0
    bottom = height
    if header_cfg.get("enabled") and page.get("show_header", True):
        hh = int(header_cfg.get("height", 28))
        header = Rect(0, 0, width, hh)
        top = hh
    if nav.get("style") == "tabbar" and nav_pages(project):
        position = nav.get("tabbar_position", "bottom")
        bar_h = TABBAR_H_LABELS if nav.get("show_labels", True) else TABBAR_H_ICONS
        if position == "top":
            tabbar = Rect(0, top, width, bar_h)
            top += bar_h
        elif position == "left":
            tabbar = Rect(0, top, TABBAR_W_LEFT, height - top)
            left = TABBAR_W_LEFT
        else:
            tabbar = Rect(0, height - bar_h, width, bar_h)
            bottom = height - bar_h
    content = Rect(left, top, width - left, bottom - top)
    return {"header": header, "tabbar": tabbar, "content": content}


def nav_pages(project: dict[str, Any]) -> list[dict[str, Any]]:
    """Top level pages shown in the navigation, in order."""
    return [p for p in project.get("pages", []) if not p.get("parent") and p.get("in_navigation", True)]


def tab_rects(project: dict[str, Any], tabbar: Rect) -> list[Rect]:
    """Rectangles of the individual tabs inside the tab bar."""
    pages = nav_pages(project)
    count = len(pages)
    rects = []
    vertical = project.get("navigation", {}).get("tabbar_position", "bottom") == "left"
    for i in range(count):
        if vertical:
            y, h = split(tabbar.y, tabbar.h, count, 0, i)
            rects.append(Rect(tabbar.x, y, tabbar.w, h))
        else:
            x, w = split(tabbar.x, tabbar.w, count, 0, i)
            rects.append(Rect(x, tabbar.y, w, tabbar.h))
    return rects


def page_grid(project: dict[str, Any], page: dict[str, Any]) -> dict[str, int]:
    """Effective grid of a page."""
    grid = dict(project.get("grid", {}))
    if page.get("grid_override"):
        grid.update(page["grid_override"])
    return {
        "cols": int(grid.get("cols", 4)),
        "rows": int(grid.get("rows", 3)),
        "gap": int(grid.get("gap", 8)),
        "padding": int(grid.get("padding", 8)),
    }


def widget_rect(content: Rect, grid: dict[str, int], widget: dict[str, Any], free: bool = False) -> Rect:
    """Pixel rectangle of a widget placed on the grid (or in free layout)."""
    if free:
        return Rect(content.x + int(widget["x"]), content.y + int(widget["y"]), int(widget["w"]), int(widget["h"]))
    pad = grid["padding"]
    inner_w = content.w - 2 * pad
    inner_h = content.h - 2 * pad
    x, w = split(content.x + pad, inner_w, grid["cols"], grid["gap"], int(widget["x"]), int(widget["w"]))
    y, h = split(content.y + pad, inner_h, grid["rows"], grid["gap"], int(widget["y"]), int(widget["h"]))
    return Rect(x, y, w, h)


def page_layout(project: dict[str, Any], page: dict[str, Any], width: int, height: int) -> dict[str, Any]:
    """Full pixel layout of a page: chrome plus every widget rectangle."""
    parts = chrome(project, page, width, height)
    content = parts["content"]
    assert content is not None
    grid = page_grid(project, page)
    free = page.get("layout") == "free"
    widgets = {w["id"]: widget_rect(content, grid, w, free) for w in page.get("widgets", [])}
    tabs = tab_rects(project, parts["tabbar"]) if parts["tabbar"] else []
    return {**parts, "grid": grid, "widgets": widgets, "tabs": tabs}


# ---------------------------------------------------------------------------
# Inner elements of widgets
# ---------------------------------------------------------------------------
# An element is a dict:
#   kind:  "icon" | "text"
#   role:  semantic name ("icon", "label", "state", "value", "time", "date", ...)
#   align: LVGL alignment relative to the parent's content box
#   x, y:  offsets for that alignment
#   width: fixed width (text is truncated with an ellipsis) or None
#   size:  pixel size of the font
#   color: theme color role
#   text_align: "left" | "center" | "right" (only for fixed width text)


def _el(
    kind: str,
    role: str,
    align: str,
    x: int,
    y: int,
    size: int,
    color: str,
    width: int | None = None,
    text_align: str = "left",
) -> dict[str, Any]:
    return {
        "kind": kind,
        "role": role,
        "align": align,
        "x": x,
        "y": y,
        "width": width,
        "size": size,
        "color": color,
        "text_align": text_align,
    }


def widget_elements(
    wtype: str,
    w: int,
    h: int,
    props: dict[str, Any],
    font_sizes: dict[str, int] | None = None,
    icon_sizes: dict[str, int] | None = None,
) -> list[dict[str, Any]]:
    """Inner elements of a widget of size ``w`` x ``h`` (outer box, incl. padding)."""
    fs = {**DEFAULT_FONT_SIZES, **(font_sizes or {})}
    ics = {**DEFAULT_ICON_SIZES, **(icon_sizes or {})}
    cw = max(w - 2 * TILE_PAD, 1)
    ch = max(h - 2 * TILE_PAD, 1)
    els: list[dict[str, Any]] = []

    circle = bool(props.get("icon_circle"))

    def ib(size: int) -> int:
        """Box of an icon: the glyph, or the round background around it."""
        return size + 2 * CIRCLE_PAD if circle else size

    def icon(role: str, align: str, x: int, y: int, size: int, color: str) -> dict[str, Any]:
        el = _el("icon", role, align, x, y, size, color)
        if circle:
            el["circle"] = ib(size)
        return el

    if wtype in ("toggle_tile", "binary_indicator", "sensor_value"):
        main_size = fs["l"] if wtype == "sensor_value" else fs.get(str(props.get("text_size", "s")), fs["s"])
        sub_size = fs["xs"]
        tall = ch >= ib(ics["m"]) + line_height(main_size) + line_height(sub_size)
        has_icon = bool(props.get("icon"))
        if tall:
            if wtype == "sensor_value":
                big = fs["xl"] if ch >= ib(ics["s"]) + line_height(fs["xl"]) else fs["l"]
                label_w = cw - (ib(ics["s"]) + ELEMENT_GAP if has_icon else 0)
                els.append(_el("text", "label", "TOP_LEFT", 0, 0, sub_size, "text_muted", label_w))
                if has_icon:
                    els.append(icon("icon", "TOP_RIGHT", 0, 0, ics["s"], "accent"))
                els.append(_el("text", "value", "BOTTOM_LEFT", 0, 0, big, "text", cw))
            else:
                # icon on top, name and state stacked at the bottom (home app style)
                if has_icon:
                    els.append(icon("icon", "TOP_LEFT", 0, 0, ics["m"], "state_icon"))
                if (wtype == "toggle_tile" and props.get("show_state", True)) or wtype == "binary_indicator":
                    els.append(_el("text", "label", "BOTTOM_LEFT", 0, -line_height(sub_size), main_size, "text", cw))
                    els.append(_el("text", "state", "BOTTOM_LEFT", 0, 0, sub_size, "text_muted", cw))
                else:
                    els.append(_el("text", "label", "BOTTOM_LEFT", 0, 0, main_size, "text", cw))
        else:
            icon_size = ics["m"] if ch >= ib(ics["m"]) and cw >= 3 * ib(ics["m"]) else ics["s"]
            tx = ib(icon_size) + ELEMENT_GAP if has_icon else 0
            tw = max(cw - tx, 1)
            if has_icon:
                els.append(
                    icon("icon", "LEFT_MID", 0, 0, icon_size, "accent" if wtype == "sensor_value" else "state_icon")
                )
            if wtype == "sensor_value":
                els.append(_el("text", "value", "TOP_LEFT", tx, 0, main_size, "text", tw))
                els.append(_el("text", "label", "BOTTOM_LEFT", tx, 0, sub_size, "text_muted", tw))
            else:
                show_state = wtype == "binary_indicator" or props.get("show_state", True)
                if show_state and ch >= line_height(main_size) + line_height(sub_size):
                    els.append(_el("text", "label", "TOP_LEFT", tx, 0, main_size, "text", tw))
                    els.append(_el("text", "state", "BOTTOM_LEFT", tx, 0, sub_size, "text_muted", tw))
                else:
                    els.append(_el("text", "label", "LEFT_MID", tx, 0, main_size, "text", tw))
        return els

    if wtype == "clock":
        size = fs.get(props.get("size", "xl"), fs["xl"])
        if props.get("show_date", True):
            date_size = fs["xs"] if size <= fs["l"] else fs["s"]
            if line_height(size) + line_height(date_size) > ch:
                size = fs["l"]
                date_size = fs["xs"]
            lh_t = line_height(size)
            lh_d = line_height(date_size)
            els.append(_el("text", "time", "CENTER", 0, -(lh_d // 2), size, "text", cw, "center"))
            els.append(_el("text", "date", "CENTER", 0, lh_t // 2, date_size, "text_muted", cw, "center"))
        else:
            els.append(_el("text", "time", "CENTER", 0, 0, size, "text", cw, "center"))
        return els

    if wtype == "label":
        size = fs.get(props.get("size", "m"), fs["m"])
        align = props.get("align", "center")
        lv_align = {"left": "LEFT_MID", "right": "RIGHT_MID"}.get(align, "CENTER")
        els.append(_el("text", "text", lv_align, 0, 0, size, "text_muted" if props.get("muted") else "text", cw, align))
        return els

    if wtype in ("scene_button", "page_button"):
        has_icon = bool(props.get("icon"))
        size = fs.get(str(props.get("text_size", "s")), fs["s"])
        lh = line_height(size)
        if has_icon and ch >= ib(ics["m"]) + lh + 2:
            els.append(icon("icon", "CENTER", 0, -(lh // 2) - 1, ics["m"], "accent"))
            els.append(_el("text", "label", "CENTER", 0, ib(ics["m"]) // 2 + 1, size, "text", cw, "center"))
        elif has_icon:
            icon_size = ics["m"] if ch >= ib(ics["m"]) else ics["s"]
            tx = ib(icon_size) + ELEMENT_GAP
            els.append(icon("icon", "LEFT_MID", 0, 0, icon_size, "accent"))
            els.append(_el("text", "label", "LEFT_MID", tx, 0, size, "text", max(cw - tx, 1)))
        else:
            els.append(_el("text", "label", "CENTER", 0, 0, size, "text", cw, "center"))
        return els

    if wtype == "page_title":
        size = fs.get(props.get("size", "m"), fs["m"])
        if props.get("_has_back"):
            icon_size = ics["s"]
            els.append(_el("icon", "back", "LEFT_MID", 0, 0, icon_size, "accent"))
            els.append(
                _el(
                    "text",
                    "title",
                    "LEFT_MID",
                    icon_size + ELEMENT_GAP,
                    0,
                    size,
                    "text",
                    max(cw - icon_size - ELEMENT_GAP, 1),
                )
            )
        else:
            els.append(_el("text", "title", "LEFT_MID", 0, 0, size, "text", cw))
        return els

    return els


def header_elements(
    project: dict[str, Any],
    header: Rect,
    font_sizes: dict[str, int] | None = None,
    icon_sizes: dict[str, int] | None = None,
) -> list[dict[str, Any]]:
    """Elements of the global header bar (placed in the header's content box, padding HEADER_PAD_X)."""
    fs = {**DEFAULT_FONT_SIZES, **(font_sizes or {})}
    ics = {**DEFAULT_ICON_SIZES, **(icon_sizes or {})}
    items = project.get("global", {}).get("header", {}).get("widgets", [])
    els: list[dict[str, Any]] = []
    for item in items:
        align = item.get("align", "left")
        lv_align = {"left": "LEFT_MID", "right": "RIGHT_MID"}.get(align, "CENTER")
        t = item.get("type")
        if t == "page_title":
            # The back arrow is only shown on sub pages; reserve its space when sub pages exist.
            has_sub = any(p.get("parent") for p in project.get("pages", []))
            offset = 0
            if has_sub:
                els.append(_el("icon", "back", "LEFT_MID", 0, 0, ics["s"], "accent"))
                offset = ics["s"] + ELEMENT_GAP if align == "left" else 0
            els.append(_el("text", "title", lv_align, offset, 0, fs["s"], "text", None, align))
        elif t == "clock":
            els.append(_el("text", "time", lv_align, 0, 0, fs["s"], "text", None, align))
        elif t == "label":
            els.append(_el("text", "text", lv_align, 0, 0, fs["s"], "text_muted", None, align))
    return els


def tab_elements(
    show_icons: bool,
    show_labels: bool,
    tab: Rect,
    font_sizes: dict[str, int] | None = None,
    icon_sizes: dict[str, int] | None = None,
) -> list[dict[str, Any]]:
    """Elements inside one tab button (tabs have zero padding)."""
    fs = {**DEFAULT_FONT_SIZES, **(font_sizes or {})}
    ics = {**DEFAULT_ICON_SIZES, **(icon_sizes or {})}
    els: list[dict[str, Any]] = []
    if show_icons and show_labels and tab.h >= ics["s"] + line_height(fs["xs"]):
        els.append(_el("icon", "icon", "TOP_MID", 0, 2, ics["s"], "nav"))
        els.append(_el("text", "label", "BOTTOM_MID", 0, -1, fs["xs"], "nav", tab.w - 2, "center"))
    elif show_icons:
        els.append(_el("icon", "icon", "CENTER", 0, 0, ics["s"], "nav"))
    else:
        els.append(_el("text", "label", "CENTER", 0, 0, fs["xs"], "nav", tab.w - 2, "center"))
    return els


# ---------------------------------------------------------------------------
# Value overlay (long press on a tile: brightness / position / fan speed)
# ---------------------------------------------------------------------------
OVERLAY_MAX_W = 240
OVERLAY_MAX_H = 150
OVERLAY_MARGIN = 16
SLIDER_H = 18


def overlay_layout(
    width: int, height: int, font_sizes: dict[str, int] | None = None, icon_sizes: dict[str, int] | None = None
) -> dict[str, Any]:
    """Panel rectangle and inner elements of the value overlay (content box = panel inset TILE_PAD)."""
    fs = {**DEFAULT_FONT_SIZES, **(font_sizes or {})}
    ics = {**DEFAULT_ICON_SIZES, **(icon_sizes or {})}
    pw = min(width - 2 * OVERLAY_MARGIN, OVERLAY_MAX_W)
    ph = min(height - 2 * OVERLAY_MARGIN, OVERLAY_MAX_H)
    panel = Rect((width - pw) // 2, (height - ph) // 2, pw, ph)
    cw = pw - 2 * TILE_PAD
    elements = [
        _el("text", "title", "TOP_LEFT", 0, 0, fs["m"], "text", max(cw - ics["s"] - ELEMENT_GAP, 1)),
        _el("icon", "close", "TOP_RIGHT", 0, 0, ics["s"], "text_muted"),
        _el("text", "value", "CENTER", 0, -(SLIDER_H // 2), fs["xl"], "text", cw, "center"),
        {
            **_el("slider", "slider", "BOTTOM_MID", 0, -(SLIDER_H // 2), 0, "accent", cw - 2 * SLIDER_H),
            "height": SLIDER_H,
        },
    ]
    return {"panel": panel, "elements": elements}
