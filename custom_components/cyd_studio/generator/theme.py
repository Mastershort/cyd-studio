"""Themes (data in ``themes/*.json``)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

THEMES_DIR = Path(__file__).parent.parent / "themes"


def load_themes(directory: Path = THEMES_DIR) -> dict[str, dict[str, Any]]:
    """Load all themes, keyed by id (blocking, run in executor)."""
    themes: dict[str, dict[str, Any]] = {}
    for path in sorted(directory.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        themes[data["id"]] = data
    return themes


def resolve_theme(theme: dict[str, Any], overrides: dict[str, str] | None) -> dict[str, Any]:
    """Apply user color overrides to a theme."""
    colors = dict(theme["colors"])
    for key, value in (overrides or {}).items():
        if key in colors and isinstance(value, str):
            colors[key] = value
    return {**theme, "colors": colors}


def hex_color(value: str) -> str:
    """'#22d3ee' -> '0x22D3EE' (ESPHome/LVGL color literal)."""
    value = value.strip().lstrip("#")
    if len(value) == 3:
        value = "".join(c * 2 for c in value)
    if len(value) != 6 or any(c not in "0123456789abcdefABCDEF" for c in value):
        raise ValueError(f"Invalid color: {value}")
    return "0x" + value.upper()
