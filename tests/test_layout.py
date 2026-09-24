"""The Python layout still produces the shared contract tests/layout_cases.json (also checked by vitest)."""

from __future__ import annotations

import itertools
import json
from pathlib import Path

from generator.layout import (
    Rect,
    header_elements,
    message_layout,
    overlay_layout,
    page_layout,
    split,
    tab_elements,
    widget_elements,
)

CASES = json.loads((Path(__file__).parent / "layout_cases.json").read_text(encoding="utf-8"))


def _rect(r: Rect | None) -> list[int] | None:
    return None if r is None else r.as_list()


def test_page_layouts() -> None:
    for case in CASES["layouts"]:
        inp = case["input"]
        project = inp["project"]
        lay = page_layout(project, project["pages"][0], inp["width"], inp["height"])
        got = {
            "header": _rect(lay["header"]),
            "tabbar": _rect(lay["tabbar"]),
            "content": _rect(lay["content"]),
            "widgets": {k: v.as_list() for k, v in lay["widgets"].items()},
            "tabs": [t.as_list() for t in lay["tabs"]],
            "header_elements": header_elements(project, lay["header"]) if lay["header"] else [],
        }
        assert got == case["expected"]


def test_widget_elements() -> None:
    for case in CASES["elements"]:
        inp = case["input"]
        assert widget_elements(inp["type"], inp["w"], inp["h"], inp["props"]) == case["expected"]


def test_tab_elements() -> None:
    for case in CASES["tabs"]:
        inp = case["input"]
        assert tab_elements(inp["icons"], inp["labels"], Rect(*inp["tab"])) == case["expected"]


def test_grid_cells_do_not_overlap_and_fill_width() -> None:
    for length in (100, 283, 304, 777):
        for count in (1, 2, 3, 4, 7):
            for gap in (0, 4, 8):
                cells = [split(0, length, count, gap, i) for i in range(count)]
                assert cells[0][0] == 0
                last_x, last_w = cells[-1]
                assert last_x + last_w == length
                for (x1, w1), (x2, _) in itertools.pairwise(cells):
                    assert x1 + w1 + gap == x2


def test_overlays() -> None:
    for case in CASES["overlays"]:
        fn = message_layout if case["input"].get("kind") == "message" else overlay_layout
        lay = fn(case["input"]["w"], case["input"]["h"])
        assert {"panel": lay["panel"].as_list(), "elements": lay["elements"]} == case["expected"]


def test_styles() -> None:
    from generator.style import resolve_tile_style

    for case in CASES["styles"]:
        assert resolve_tile_style(case["input"]["theme"], case["input"]["style"]) == case["expected"]


def test_every_widget_type_has_parity_cases() -> None:
    """A new widget must be added to tools/gen_layout_cases.py (WIDGET_TYPES)."""
    widgets = Path(__file__).parent.parent / "custom_components" / "cyd_studio" / "widgets"
    defined = {json.loads(p.read_text(encoding="utf-8"))["type"] for p in widgets.glob("*.json")}
    covered = {case["input"]["type"] for case in CASES["elements"]}
    assert defined - {"spacer"} <= covered, sorted(defined - covered)
