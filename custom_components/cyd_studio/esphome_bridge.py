"""Link projects to ESPHome devices in Home Assistant and check "allow actions".

Verified against homeassistant/components/esphome (const.py, manager.py):
- the device name is stored in ``entry.data["device_name"]``
- the permission is ``entry.options["allow_service_calls"]``; new devices get ``False``
  explicitly, a missing key means ``True``; it is read on every action, so changing it
  takes effect immediately.
"""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN

ESPHOME_DOMAIN = "esphome"
CONF_DEVICE_NAME = "device_name"
CONF_ALLOW_SERVICE_CALLS = "allow_service_calls"
DEFAULT_ALLOW_SERVICE_CALLS = True
ISSUE_PREFIX = "actions_not_allowed_"


@callback
def find_device_entry(hass: HomeAssistant, device_name: str) -> ConfigEntry | None:
    """ESPHome config entry of a device (by its ESPHome name)."""
    for entry in hass.config_entries.async_entries(ESPHOME_DOMAIN):
        if entry.data.get(CONF_DEVICE_NAME) == device_name:
            return entry
    return None


def actions_allowed(entry: ConfigEntry) -> bool:
    """Whether the device may perform Home Assistant actions."""
    return bool(entry.options.get(CONF_ALLOW_SERVICE_CALLS, DEFAULT_ALLOW_SERVICE_CALLS))


@callback
def device_status(hass: HomeAssistant, device_name: str) -> dict[str, Any]:
    """Status of the ESPHome device that belongs to a project."""
    entry = find_device_entry(hass, device_name)
    if entry is None:
        return {"found": False, "entry_id": None, "title": None, "loaded": False, "actions_allowed": False}
    return {
        "found": True,
        "entry_id": entry.entry_id,
        "title": entry.title,
        "loaded": entry.state is ConfigEntryState.LOADED,
        "actions_allowed": actions_allowed(entry),
    }


@callback
def async_allow_actions(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Enable "Allow the device to perform Home Assistant actions" for an ESPHome device."""
    hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_ALLOW_SERVICE_CALLS: True})


@callback
def async_update_issues(hass: HomeAssistant, projects: list[dict[str, Any]]) -> None:
    """Create a fixable repair issue for every project device that may not perform actions."""
    wanted: dict[str, tuple[ConfigEntry, dict[str, Any]]] = {}
    for project in projects:
        entry = find_device_entry(hass, project.get("device_name", ""))
        if entry is not None and not actions_allowed(entry):
            wanted[f"{ISSUE_PREFIX}{entry.entry_id}"] = (entry, project)

    registry = ir.async_get(hass)
    for issue in list(registry.issues.values()):
        if issue.domain == DOMAIN and issue.issue_id.startswith(ISSUE_PREFIX) and issue.issue_id not in wanted:
            ir.async_delete_issue(hass, DOMAIN, issue.issue_id)
    for issue_id, (entry, project) in wanted.items():
        ir.async_create_issue(
            hass,
            DOMAIN,
            issue_id,
            is_fixable=True,
            is_persistent=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key="actions_not_allowed",
            translation_placeholders={"device": entry.title, "project": project.get("name", "")},
            data={"esphome_entry_id": entry.entry_id, "project": project.get("name", "")},
        )
