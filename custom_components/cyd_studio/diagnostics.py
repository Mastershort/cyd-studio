"""Diagnostics (no WiFi data, no API keys)."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN, GENERATOR_VERSION, VERSION
from .runtime import StudioRuntime


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    """Return diagnostics for the config entry."""
    runtime: StudioRuntime | None = hass.data.get(DOMAIN)
    if runtime is None:
        return {"loaded": False}
    return {
        "version": VERSION,
        "generator_version": GENERATOR_VERSION,
        "options": dict(entry.options),
        "boards": sorted(runtime.data.boards),
        "projects": [
            {k: p[k] for k in ("name", "board", "orientation", "page_count", "widget_count", "updated")}
            for p in runtime.store.list()
        ],
        "last_generator_issues": runtime.last_issues,
    }
