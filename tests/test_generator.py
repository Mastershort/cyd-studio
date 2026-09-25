"""Generator: golden files, determinism, validation, round-trip."""

from __future__ import annotations

import copy
import json
import os
from pathlib import Path
from typing import Any

import pytest
import yaml
from generator import generate_yaml
from generator.generate import body_checksum, decode_project, split_generated

GOLDEN = Path(__file__).parent / "golden"
PROJECTS = sorted(GOLDEN.glob("*.json"))
UPDATE = os.environ.get("UPDATE_GOLDEN") == "1"


class _Loader(yaml.SafeLoader):
    """Understands ESPHome tags just enough to parse the output."""


_Loader.add_constructor("!secret", lambda loader, node: f"!secret {loader.construct_scalar(node)}")
_Loader.add_constructor("!lambda", lambda loader, node: f"!lambda {loader.construct_scalar(node)}")


def load(text: str) -> Any:
    return yaml.load(text, Loader=_Loader)


def golden(name: str) -> dict[str, Any]:
    return json.loads((GOLDEN / f"{name}.json").read_text(encoding="utf-8"))


def generate(project: dict[str, Any], data: dict[str, Any], known: set[str] | None = None):
    return generate_yaml(project, data["boards"], data["themes"], data["widgets"], known)


@pytest.mark.parametrize("path", PROJECTS, ids=[p.stem for p in PROJECTS])
def test_golden(path: Path, studio_data: dict[str, Any]) -> None:
    """Every golden project produces exactly the committed YAML (UPDATE_GOLDEN=1 rewrites)."""
    project = json.loads(path.read_text(encoding="utf-8"))
    result = generate(project, studio_data)
    assert result.ok, [i.message_en for i in result.issues if i.level == "error"]
    expected_path = path.with_suffix(".yaml")
    if UPDATE or not expected_path.exists():
        expected_path.write_text(result.yaml, encoding="utf-8", newline="\n")
    assert result.yaml == expected_path.read_text(encoding="utf-8")


@pytest.mark.parametrize("path", PROJECTS, ids=[p.stem for p in PROJECTS])
def test_output_is_valid_yaml(path: Path, studio_data: dict[str, Any]) -> None:
    """Output parses, uses 2-space indentation and no tabs."""
    result = generate(json.loads(path.read_text(encoding="utf-8")), studio_data)
    doc = load(result.yaml)
    for key in ("esphome", "esp32", "api", "wifi", "display", "touchscreen", "lvgl", "font"):
        assert key in doc
    assert "\t" not in result.yaml
    for line in result.yaml.splitlines():
        indent = len(line) - len(line.lstrip(" "))
        assert indent % 2 == 0, line


def test_deterministic(studio_data: dict[str, Any]) -> None:
    project = golden("multipage")
    assert generate(copy.deepcopy(project), studio_data).yaml == generate(copy.deepcopy(project), studio_data).yaml


def test_round_trip(studio_data: dict[str, Any]) -> None:
    project = golden("edge_cases")
    result = generate(project, studio_data)
    restored = decode_project(result.yaml)
    assert restored is not None
    assert restored["name"] == project["name"]
    assert [p["id"] for p in restored["pages"]] == [p["id"] for p in project["pages"]]
    # regenerating from the restored project gives the same file
    assert generate(restored, studio_data).yaml == result.yaml


def test_checksum_detects_manual_edit(studio_data: dict[str, Any]) -> None:
    result = generate(golden("multipage"), studio_data)
    body, checksum = split_generated(result.yaml)
    assert checksum == body_checksum(body)
    edited = result.yaml.replace("friendly_name: Wohnzimmer", "friendly_name: Flur")
    assert edited != result.yaml
    body2, checksum2 = split_generated(edited)
    assert checksum2 != body_checksum(body2)


def test_one_source_per_entity(studio_data: dict[str, Any]) -> None:
    """The same entity in several widgets is mirrored only once per kind."""
    doc = load(generate(golden("edge_cases"), studio_data).yaml)
    ids = [s["id"] for s in doc.get("text_sensor", [])]
    assert ids.count("ha_light_kueche") == 1
    assert len(ids) == len(set(ids))


def _project(**changes: Any) -> dict[str, Any]:
    project = golden("multipage")
    project.update(changes)
    return project


@pytest.mark.parametrize(
    ("changes", "code"),
    [
        ({"device_name": "Mein Gerät"}, "device_name"),
        ({"board": "nope"}, "board"),
        ({"theme": "nope"}, "theme"),
        ({"pages": []}, "no_pages"),
    ],
)
def test_validation_errors_block_export(changes: dict[str, Any], code: str, studio_data: dict[str, Any]) -> None:
    result = generate(_project(**changes), studio_data)
    assert not result.ok
    assert result.yaml == ""
    assert code in {i.code for i in result.issues}


def test_widget_errors(studio_data: dict[str, Any]) -> None:
    project = _project()
    home = project["pages"][0]
    home["widgets"][2]["entity"] = None  # toggle without entity
    home["widgets"][5]["props"]["target"] = "missing"  # page button to nowhere
    home["widgets"][0]["x"] = 3  # clock w=2 at x=3 -> outside a 4-column grid
    codes = {i.code for i in generate(project, studio_data).issues}
    assert {"entity_missing", "page_target", "out_of_grid"} <= codes


def test_unknown_entity_warning(studio_data: dict[str, Any]) -> None:
    result = generate(_project(), studio_data, known={"light.wohnzimmer"})
    assert result.ok
    unknown = [i for i in result.issues if i.code == "entity_unknown"]
    assert unknown and all(i.level == "warning" for i in unknown)


def test_missing_glyph_warning(studio_data: dict[str, Any]) -> None:
    result = generate(golden("edge_cases"), studio_data)
    assert "glyph_missing" in {i.code for i in result.issues}
    fonts = result.yaml.split("\nfont:")[1].split("\nscript:")[0]
    assert "✓" not in fonts


def test_action_data_are_strings(studio_data: dict[str, Any]) -> None:
    text = json.dumps(load(generate(golden("portrait_st7789_en"), studio_data).yaml))
    assert '"transition": "2"' in text


def test_home_page_shown_on_boot(studio_data: dict[str, Any]) -> None:
    """edge_cases uses a home page that is not the first page."""
    doc = load(generate(golden("edge_cases"), studio_data).yaml)
    assert {"lvgl.page.show": "page_zwei"} in doc["esphome"]["on_boot"]["then"]


def test_templates_generate(studio_data: dict[str, Any]) -> None:
    """Every shipped template (filled with example entities) produces valid output."""
    templates = Path(__file__).parent.parent / "custom_components" / "cyd_studio" / "templates"
    for path in sorted(templates.glob("*.json")):
        tpl = json.loads(path.read_text(encoding="utf-8"))
        text = json.dumps(tpl["project"])
        for ph in tpl["placeholders"]:
            text = text.replace("{{" + ph["key"] + "}}", f"{ph['domains'][0]}.example_{ph['key']}")
        project = {
            "schema": 1,
            "name": tpl["name"],
            "device_name": "cyd-template",
            "board": "esp32-2432s028r",
            "theme": "mastershort_dark",
            **json.loads(text),
        }
        result = generate(project, studio_data)
        assert result.ok, (path.name, [i.message_en for i in result.issues])


def test_action_builder(studio_data: dict[str, Any]) -> None:
    """logic.json: own steps replace the built-in events; a double tap turns the tap into a single click."""
    result = generate(golden("logic"), studio_data)
    invalid = [i for i in result.issues if i.code == "action_step_invalid"]
    assert len(invalid) == 1 and invalid[0].widget == "a"  # page "gibtsnicht"
    doc = load(result.yaml)
    home = next(p for p in doc["lvgl"]["pages"] if p["id"] == "page_home")
    tiles = {next(iter(w.values()))["id"]: next(iter(w.values())) for w in home["widgets"]}
    light = tiles["w_home_l"]
    assert "on_single_click" in light and "on_short_click" not in light
    assert light["on_double_click"][0]["homeassistant.action"]["action"] == "scene.turn_on"
    sensor = tiles["w_home_t"]
    assert [next(iter(a)) for a in sensor["on_short_click"]] == ["homeassistant.action", "delay", "lvgl.page.show"]
    assert "clickable" not in sensor


def test_part_and_indicator_colors(studio_data: dict[str, Any]) -> None:
    """Slider track/fill/knob and binary indicator icon colors come from the widget style when set."""
    project = golden("controls")
    slider = next(w for p in project["pages"] for w in p["widgets"] if w["type"] == "slider")
    slider["style"] = {"track": "#112233", "fill": "#445566", "knob": "#778899"}
    text = generate(project, studio_data).yaml
    assert all(c in text for c in ("0x112233", "0x445566", "0x778899"))

    project = golden("styled")
    indicator = next(w for p in project["pages"] for w in p["widgets"] if w["type"] == "binary_indicator")
    plain = generate(project, studio_data).yaml
    assert "0xAB0000" not in plain and "0x00CD00" not in plain
    indicator["style"] = {**(indicator.get("style") or {}), "icon_on": "#ab0000", "icon": "#00cd00"}
    text = generate(project, studio_data).yaml
    assert "0xAB0000" in text and "0x00CD00" in text


def test_hidden_label(studio_data: dict[str, Any]) -> None:
    """show_label false drops the name label of a tile; icon and state stay."""
    project = golden("styled")
    assert "id: w_home_l1_label" in generate(project, studio_data).yaml
    tile = next(w for p in project["pages"] for w in p["widgets"] if w["id"] == "l1")
    tile["style"] = {**(tile.get("style") or {}), "show_label": False}
    text = generate(project, studio_data).yaml
    assert "id: w_home_l1_label" not in text and "id: w_home_l1_icon" in text
