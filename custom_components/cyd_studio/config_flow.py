"""Config and options flow for CYD Studio."""

from __future__ import annotations

import os
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_DEFAULT_THEME,
    CONF_ESPHOME_PATH,
    CONF_HARDWARE_HINTS,
    CONF_PREVIEW_REAL_ACTIONS,
    CONF_REQUIRE_ADMIN,
    CONF_SIDEBAR_ICON,
    CONF_SIDEBAR_TITLE,
    DEFAULT_OPTIONS,
    DOMAIN,
)


class CydStudioConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single instance setup: welcome → ESPHome check → done."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Welcome step."""
        if user_input is not None:
            return await self.async_step_esphome()
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    async def async_step_esphome(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Inform whether the ESPHome Device Builder directory exists (not required)."""
        if user_input is not None:
            return self.async_create_entry(title="CYD Studio", data={})
        path = self.hass.config.path(str(DEFAULT_OPTIONS[CONF_ESPHOME_PATH]))
        exists = await self.hass.async_add_executor_job(os.path.isdir, path)
        return self.async_show_form(
            step_id="esphome",
            data_schema=vol.Schema({}),
            description_placeholders={"path": path, "status": "✓" if exists else "✗"},
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Options."""
        return CydStudioOptionsFlow()


class CydStudioOptionsFlow(OptionsFlow):
    """Panel and export options."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Single options form."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        current = {**DEFAULT_OPTIONS, **self.config_entry.options}
        schema = vol.Schema(
            {
                vol.Required(CONF_REQUIRE_ADMIN, default=current[CONF_REQUIRE_ADMIN]): bool,
                vol.Required(CONF_SIDEBAR_TITLE, default=current[CONF_SIDEBAR_TITLE]): str,
                vol.Required(CONF_SIDEBAR_ICON, default=current[CONF_SIDEBAR_ICON]): selector.IconSelector(),
                vol.Required(CONF_HARDWARE_HINTS, default=current[CONF_HARDWARE_HINTS]): bool,
                vol.Required(CONF_ESPHOME_PATH, default=current[CONF_ESPHOME_PATH]): str,
                vol.Required(CONF_DEFAULT_THEME, default=current[CONF_DEFAULT_THEME]): str,
                vol.Required(CONF_PREVIEW_REAL_ACTIONS, default=current[CONF_PREVIEW_REAL_ACTIONS]): bool,
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
