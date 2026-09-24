"""Generate tests/layout_cases.json from the Python layout implementation.

The file is the shared contract: pytest checks Python still produces it,
vitest checks the TypeScript port produces exactly the same numbers.
Run after an intentional layout change:  python tools/gen_layout_cases.py
"""

from __future__ import annotations

import itertools
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "custom_components" / "cyd_studio"))

from generator.layout import (  # noqa: E402
    header_elements,
    overlay_layout,
    page_layout,
    tab_elements,
    widget_elements,
)

SCREENS = [(320, 240), (240, 320), (480, 320), (800, 480)]
GRIDS = [
    {"cols": 4, "rows": 3, "gap": 8, "padding": 8},
    {"cols": 3, "rows": 3, "gap": 6, "padding": 6},
    {"cols": 2, "rows": 2, "gap": 0, "padding": 0},
    {"cols": 6, "rows": 4, "gap": 4, "padding": 4},
]
NAVS = [
    {"style": "tabbar", "tabbar_position": "bottom", "show_labels": True},
    {"style": "tabbar", "tabbar_position": "top", "show_labels": False},
    {"style": "tabbar", "tabbar_position": "left", "show_labels": True},
    {"style": "none"},
]
WIDGET_TYPES = [
    "toggle_tile",
    "sensor_value",
    "binary_indicator",
    "clock",
    "label",
    "scene_button",
    "page_button",
    "page_title",
    "cover_control",
    "climate",
    "slider",
    "gauge",
    "weather",
    "multi_value",
]
PROPS = [
    {"icon": "mdi:lightbulb", "show_state": True, "show_date": True, "size": "xl", "align": "center"},
    {"icon": "", "show_state": False, "show_date": False, "size": "m", "align": "left"},
    {"icon": "mdi:home", "_has_back": True, "size": "l", "align": "right", "muted": True},
    {"icon": "mdi:lightbulb", "icon_circle": True, "text_size": "m", "show_state": True},
    {"icon": "mdi:fan", "icon_circle": True, "text_size": "l", "show_date": False},
    {"icon": "mdi:weather-sunny", "_count": 2, "text_size": "m"},
    {"icon": "", "_count": 3, "icon_circle": True},
]
SIZES = [(30, 30), (60, 48), (147, 52), (147, 112), (304, 48), (100, 160), (200, 200)]


def rect(r):
    return None if r is None else r.as_list()


def main() -> None:
    layouts = []
    for (w, h), grid, nav, header, npages in itertools.product(SCREENS, GRIDS, NAVS, (True, False), (1, 3, 5)):
        pages = [
            {"id": f"p{i}", "name": f"P{i}", "parent": None, "in_navigation": True, "widgets": []}
            for i in range(npages)
        ]
        if npages > 1:
            pages.append({"id": "sub", "name": "Sub", "parent": "p0", "widgets": []})
        widgets = []
        for i, (x, y) in enumerate(itertools.product(range(grid["cols"]), range(grid["rows"]))):
            if i % 3 == 0:
                widgets.append({"id": f"w{i}", "x": x, "y": y, "w": min(2, grid["cols"] - x), "h": 1})
        pages[0]["widgets"] = widgets
        project = {
            "grid": grid,
            "navigation": nav,
            "global": {
                "header": {
                    "enabled": header,
                    "height": 28,
                    "widgets": [{"type": "page_title", "align": "left"}, {"type": "clock", "align": "right"}],
                }
            },
            "pages": pages,
        }
        lay = page_layout(project, pages[0], w, h)
        header_rect = lay["header"]
        layouts.append(
            {
                "input": {"project": project, "width": w, "height": h},
                "expected": {
                    "header": rect(lay["header"]),
                    "tabbar": rect(lay["tabbar"]),
                    "content": rect(lay["content"]),
                    "widgets": {k: v.as_list() for k, v in lay["widgets"].items()},
                    "tabs": [t.as_list() for t in lay["tabs"]],
                    "header_elements": header_elements(project, header_rect) if header_rect else [],
                },
            }
        )
    elements = []
    for wtype, props, (w, h) in itertools.product(WIDGET_TYPES, PROPS, SIZES):
        elements.append(
            {"input": {"type": wtype, "w": w, "h": h, "props": props}, "expected": widget_elements(wtype, w, h, props)}
        )
    tabs = []
    for icons, labels, (w, h) in itertools.product((True, False), (True, False), [(80, 40), (160, 32), (48, 60)]):
        from generator.layout import Rect

        tabs.append(
            {
                "input": {"icons": icons, "labels": labels, "tab": [0, 0, w, h]},
                "expected": tab_elements(icons, labels, Rect(0, 0, w, h)),
            }
        )
    overlays = []
    for w, h in [*SCREENS, (200, 150)]:
        lay = overlay_layout(w, h)
        overlays.append(
            {"input": {"w": w, "h": h}, "expected": {"panel": lay["panel"].as_list(), "elements": lay["elements"]}}
        )
    from generator.style import load_presets, resolve_tile_style
    from generator.theme import load_themes

    styles = []
    overrides = [
        {},
        {"preset": "solid"},
        {"preset": "glass", "bg": "#123456", "bg_opa": 40, "radius": 20},
        {"preset": "outline", "icon_on": "warning", "text_size": "l", "circle": True},
        {"preset": "nope", "border_width": 3, "text_on": "#ABCDEF"},
    ]
    for theme in load_themes().values():
        for ov in overrides:
            styles.append({"input": {"theme": theme, "style": ov}, "expected": resolve_tile_style(theme, ov)})
    out = {"layouts": layouts, "elements": elements, "tabs": tabs, "overlays": overlays, "styles": styles}
    assert load_presets()
    path = ROOT / "tests" / "layout_cases.json"
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {len(layouts)} layouts, {len(elements)} element cases, {len(tabs)} tab cases to {path}")


if __name__ == "__main__":
    main()
