"""YAML emitter: quoting, tags, comments."""

from __future__ import annotations

import yaml
from generator.emit import Comment, Lambda, Raw, Secret, dump, quote, scalar


def test_plain_and_quoted_scalars() -> None:
    assert scalar("GPIO14") == "GPIO14"
    assert scalar("10MHz") == "10MHz"
    assert scalar("2026.9.0") == "2026.9.0"
    assert scalar("light.wohnzimmer") == "light.wohnzimmer"
    for value in ("on", "off", "yes", "no", "true", "null", "10", "1.5", "0x10", "1e3", "", " x", "a: b", "#x", "${x}"):
        text = scalar(value)
        assert yaml.safe_load(f"k: {text}")["k"] == value, (value, text)


def test_quote_escapes() -> None:
    for value in ('Er sagte "Hallo"', "Back\\slash", "Zeile\nNeu", "Ümläute ß", "Tab\there"):
        assert yaml.safe_load(f"k: {quote(value)}")["k"] == value
    # icon glyphs in the private use area stay ASCII-escaped
    assert quote("\U000f02dc") == '"\\U000F02DC"'


def test_tags_and_comments() -> None:
    doc = {
        Comment("head"): None,
        "wifi": {"ssid": Secret("wifi_ssid")},
        "color": Raw("0x22D3EE"),
        "list": [{"a": 1, "b": Lambda("return 1;\nreturn 2;")}, Comment("note"), "x"],
        "empty": None,
    }
    out = dump(doc)
    assert "ssid: !secret wifi_ssid" in out
    assert "color: 0x22D3EE" in out
    assert "  - a: 1\n    b: !lambda |-\n      return 1;\n      return 2;" in out
    assert "  # note" in out
    assert out.endswith("empty:\n")
