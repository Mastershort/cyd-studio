"""Constants for CYD Studio."""

from __future__ import annotations

from typing import Final

from .generator import ESPHOME_MIN_VERSION, GENERATOR_VERSION

DOMAIN: Final = "cyd_studio"
VERSION: Final = "1.0.1"

__all__ = ["ESPHOME_MIN_VERSION", "GENERATOR_VERSION"]

PANEL_URL_PATH: Final = "cyd-studio"
PANEL_COMPONENT: Final = "cyd-studio-panel"
PANEL_MODULE: Final = "cyd-studio-panel.js"
STATIC_URL: Final = "/cyd_studio_static"
ICONS_URL: Final = f"{STATIC_URL}/mdi_codepoints.json"

STORAGE_KEY: Final = "cyd_studio"
STORAGE_VERSION: Final = 1
HISTORY_LIMIT: Final = 10
HISTORY_MIN_INTERVAL_S: Final = 300

CONF_REQUIRE_ADMIN: Final = "require_admin"
CONF_SIDEBAR_TITLE: Final = "sidebar_title"
CONF_SIDEBAR_ICON: Final = "sidebar_icon"
CONF_HARDWARE_HINTS: Final = "hardware_hints"
CONF_ESPHOME_PATH: Final = "esphome_path"
CONF_DEFAULT_THEME: Final = "default_theme"
CONF_PREVIEW_REAL_ACTIONS: Final = "preview_real_actions"

DEFAULT_OPTIONS: Final = {
    CONF_REQUIRE_ADMIN: True,
    CONF_SIDEBAR_TITLE: "CYD Studio",
    CONF_SIDEBAR_ICON: "mdi:tablet-dashboard",
    CONF_HARDWARE_HINTS: True,
    CONF_ESPHOME_PATH: "esphome",
    CONF_DEFAULT_THEME: "mastershort_dark",
    CONF_PREVIEW_REAL_ACTIONS: False,
}

HARDWARE_INFO_URL: Final = "https://mastershort.de/cyd-studio/hardware?src=cyd-studio"
# donation page (PayPal etc. live on the website, so they can change without a release)
SUPPORT_URL: Final = "https://mastershort.de/cyd-studio/unterstuetzen?src=cyd-studio"
