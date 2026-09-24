"""Runtime state of the integration (stored in ``hass.data[DOMAIN]``)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .const import (
    CONF_DEFAULT_THEME,
    CONF_HARDWARE_HINTS,
    CONF_PREVIEW_REAL_ACTIONS,
    ESPHOME_MIN_VERSION,
    GENERATOR_VERSION,
    HARDWARE_INFO_URL,
    ICONS_URL,
    STATIC_URL,
    VERSION,
)
from .data import StudioData
from .store import ProjectStore


@dataclass
class StudioRuntime:
    """Shared state."""

    store: ProjectStore
    data: StudioData
    options: dict[str, Any]
    last_issues: list[dict[str, Any]] = field(default_factory=list)
    panel_registered: bool = False

    def info(self) -> dict[str, Any]:
        """Versions and options exposed to the panel."""
        return {
            "version": VERSION,
            "generator_version": GENERATOR_VERSION,
            "esphome_min_version": ESPHOME_MIN_VERSION,
            "icons_url": f"{ICONS_URL}?v={VERSION}",
            "static_url": STATIC_URL,
            "hardware_hints": self.options.get(CONF_HARDWARE_HINTS, True),
            "hardware_info_url": HARDWARE_INFO_URL,
            "default_theme": self.options.get(CONF_DEFAULT_THEME, "mastershort_dark"),
            "preview_real_actions": self.options.get(CONF_PREVIEW_REAL_ACTIONS, False),
        }
