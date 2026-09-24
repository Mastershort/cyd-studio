"""Repair flows: allow an ESPHome display to perform Home Assistant actions."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult

from .esphome_bridge import async_allow_actions


class AllowActionsRepairFlow(RepairsFlow):
    """Confirm, then set the ESPHome option (via the config entry options API)."""

    def __init__(self, esphome_entry_id: str, project: str) -> None:
        """Remember which ESPHome device to fix."""
        self._entry_id = esphome_entry_id
        self._project = project

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """First step: go to confirmation."""
        return await self.async_step_confirm()

    async def async_step_confirm(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Ask for confirmation and apply."""
        entry = self.hass.config_entries.async_get_entry(self._entry_id)
        if entry is None:
            return self.async_abort(reason="device_removed")
        if user_input is not None:
            async_allow_actions(self.hass, entry)
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="confirm",
            data_schema=vol.Schema({}),
            description_placeholders={"device": entry.title, "project": self._project},
        )


async def async_create_fix_flow(
    hass: HomeAssistant, issue_id: str, data: dict[str, str | int | float | None] | None
) -> RepairsFlow:
    """Create the fix flow for an issue created by esphome_bridge.async_update_issues."""
    data = data or {}
    return AllowActionsRepairFlow(str(data.get("esphome_entry_id", "")), str(data.get("project", "")))
