"""CYD Studio – visual designer for ESPHome touch displays."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_REQUIRE_ADMIN,
    CONF_SIDEBAR_ICON,
    CONF_SIDEBAR_TITLE,
    DEFAULT_OPTIONS,
    DOMAIN,
    ICONS_URL,
    PANEL_COMPONENT,
    PANEL_MODULE,
    PANEL_URL_PATH,
    STATIC_URL,
)
from .data import FRONTEND_DIST, load_studio_data
from .runtime import StudioRuntime
from .store import ProjectStore
from .websocket_api import async_register as async_register_websocket

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
DATA_STATIC_REGISTERED = f"{DOMAIN}_static_registered"
DATA_WS_REGISTERED = f"{DOMAIN}_ws_registered"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the integration (services and WebSocket commands, once)."""
    if not hass.data.get(DATA_WS_REGISTERED):
        async_register_websocket(hass)
        hass.data[DATA_WS_REGISTERED] = True

    async def list_projects(call: ServiceCall) -> ServiceResponse:
        runtime: StudioRuntime | None = hass.data.get(DOMAIN)
        projects: list[Any] = runtime.store.list() if runtime else []
        return {"projects": projects}

    hass.services.async_register(DOMAIN, "list_projects", list_projects, supports_response=SupportsResponse.ONLY)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up CYD Studio from the config entry: storage, static files, panel."""
    options = {**DEFAULT_OPTIONS, **entry.options}
    data = await hass.async_add_executor_job(load_studio_data)
    store = ProjectStore(hass)
    await store.async_load()
    runtime = StudioRuntime(store=store, data=data, options=options)
    hass.data[DOMAIN] = runtime

    await _async_register_static_paths(hass)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title=options[CONF_SIDEBAR_TITLE],
        sidebar_icon=options[CONF_SIDEBAR_ICON],
        module_url=f"{STATIC_URL}/{PANEL_MODULE}?v={data.frontend_hash}",
        embed_iframe=False,
        require_admin=bool(options[CONF_REQUIRE_ADMIN]),
        config={"domain": DOMAIN},
    )
    runtime.panel_registered = True
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_register_static_paths(hass: HomeAssistant) -> None:
    """Serve the panel bundle and the icon table (once per Home Assistant run: paths cannot be removed)."""
    if hass.data.get(DATA_STATIC_REGISTERED):
        return
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(STATIC_URL, str(FRONTEND_DIST), cache_headers=False),
            StaticPathConfig(ICONS_URL, str(Path(__file__).parent / "data" / "mdi_codepoints.json"), True),
        ]
    )
    hass.data[DATA_STATIC_REGISTERED] = True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Re-register the panel with new title/icon/permissions."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the panel. Projects stay in storage."""
    runtime: StudioRuntime | None = hass.data.pop(DOMAIN, None)
    if runtime and runtime.panel_registered:
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Integration removed: projects are kept so a re-install finds them again.

    ESPHome files are never deleted automatically.
    """
    _LOGGER.info("CYD Studio removed; projects remain in .storage/%s", DOMAIN)
