"""Shared fixtures. The generator is pure Python and imported without Home Assistant."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import pytest

try:  # Home Assistant test harness (optional; tests/ha is skipped without it)
    import pytest_homeassistant_custom_component  # noqa: F401

    pytest_plugins = ["pytest_homeassistant_custom_component"]
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
PACKAGE = ROOT / "custom_components" / "cyd_studio"
sys.path.insert(0, str(PACKAGE))

from generator.board import load_boards  # noqa: E402
from generator.theme import load_themes  # noqa: E402


def load_widget_defs() -> dict[str, dict[str, Any]]:
    """Widget definitions from the integration."""
    defs = {}
    for path in sorted((PACKAGE / "widgets").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        defs[data["type"]] = data
    return defs


@pytest.fixture(scope="session")
def studio_data() -> dict[str, Any]:
    """Boards, themes and widget definitions."""
    return {"boards": load_boards(), "themes": load_themes(), "widgets": load_widget_defs()}
