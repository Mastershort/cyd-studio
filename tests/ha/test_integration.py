"""Home Assistant side: config flow, options, WebSocket API, storage.

Requires pytest-homeassistant-custom-component (skipped otherwise).
"""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

pytest.importorskip("pytest_homeassistant_custom_component")

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.cyd_studio.const import DOMAIN

GOLDEN = Path(__file__).parent.parent / "golden"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: Any, hass: HomeAssistant) -> None:
    """Allow loading custom_components/; treat HA's frontend as loaded (hass_frontend is not installed in tests)."""
    hass.config.components.update({"frontend", "panel_custom"})


@pytest.fixture
async def setup_studio(hass: HomeAssistant) -> AsyncGenerator[MockConfigEntry]:
    """Set up the integration with the frontend parts mocked (hass_frontend is not installed in tests)."""
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="CYD Studio")
    entry.add_to_hass(hass)
    with (
        patch("custom_components.cyd_studio.panel_custom.async_register_panel", AsyncMock()) as register,
        patch("custom_components.cyd_studio._async_register_static_paths", AsyncMock()),
        patch("custom_components.cyd_studio.ha_frontend.async_remove_panel"),
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        assert register.await_count == 1
        yield entry


async def test_config_flow(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["step_id"] == "esphome"
    with patch("custom_components.cyd_studio.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    # single instance
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT


async def test_options_flow(hass: HomeAssistant, setup_studio: MockConfigEntry) -> None:
    result = await hass.config_entries.options.async_init(setup_studio.entry_id)
    assert result["type"] is FlowResultType.FORM
    with patch("custom_components.cyd_studio.panel_custom.async_register_panel", AsyncMock()):
        result = await hass.config_entries.options.async_configure(
            result["flow_id"],
            {
                "require_admin": False,
                "sidebar_title": "Displays",
                "sidebar_icon": "mdi:monitor",
                "hardware_hints": False,
                "esphome_path": "esphome",
                "default_theme": "mastershort_dark",
                "preview_real_actions": False,
            },
        )
        await hass.async_block_till_done()
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert setup_studio.options["sidebar_title"] == "Displays"


async def test_websocket_api(hass: HomeAssistant, setup_studio: MockConfigEntry, hass_ws_client: Any) -> None:
    client = await hass_ws_client(hass)

    async def call(type_: str, **data: Any) -> Any:
        await client.send_json_auto_id({"type": f"cyd_studio/{type_}", **data})
        msg = await client.receive_json()
        assert msg["success"], msg
        return msg["result"]

    boards = await call("boards/list")
    assert any(b["id"] == "esp32-2432s028r" for b in boards)
    assert {w["type"] for w in await call("widgets/list")} >= {"toggle_tile", "clock", "page_button"}
    assert await call("templates/list")
    assert (await call("info"))["generator_version"]

    project = json.loads((GOLDEN / "multipage.json").read_text(encoding="utf-8"))
    project["id"] = ""
    project["settings"].pop("api_key")
    saved = await call("projects/save", project=project)
    assert saved["id"]
    assert saved["settings"]["api_key"]  # generated on first save
    listed = await call("projects/list")
    assert listed[0]["id"] == saved["id"]
    assert listed[0]["widget_count"] == 13

    hass.states.async_set("light.wohnzimmer", "on")
    result = await call("generate/yaml", project_id=saved["id"], mark_exported=True)
    assert result["ok"]
    assert "esphome:" in result["yaml"]
    assert any(i["code"] == "entity_unknown" for i in result["issues"])
    assert (await call("projects/list"))[0]["exported"]

    dup = await call("projects/duplicate", project_id=saved["id"])
    assert dup["id"] != saved["id"]
    assert dup["settings"]["api_key"] != saved["settings"]["api_key"]

    imported = await call("projects/import", yaml=result["yaml"])
    assert imported["name"] == project["name"]

    await call("projects/delete", project_id=dup["id"])
    assert len(await call("projects/list")) == 2

    await client.send_json_auto_id({"type": "cyd_studio/projects/get", "project_id": "nope"})
    msg = await client.receive_json()
    assert not msg["success"]


async def test_non_admin_rejected(
    hass: HomeAssistant, setup_studio: MockConfigEntry, hass_ws_client: Any, hass_read_only_access_token: str
) -> None:
    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json_auto_id({"type": "cyd_studio/projects/list"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "unauthorized"


async def test_list_projects_service(hass: HomeAssistant, setup_studio: MockConfigEntry) -> None:
    response = await hass.services.async_call(DOMAIN, "list_projects", {}, blocking=True, return_response=True)
    assert response == {"projects": []}


async def test_unload_keeps_projects(hass: HomeAssistant, setup_studio: MockConfigEntry) -> None:
    runtime = hass.data[DOMAIN]
    await runtime.store.async_save(
        {
            "schema": 1,
            "name": "X",
            "device_name": "x",
            "board": "esp32-2432s028r",
            "theme": "mastershort_dark",
            "pages": [],
        }
    )
    with patch("custom_components.cyd_studio.ha_frontend.async_remove_panel") as remove:
        assert await hass.config_entries.async_unload(setup_studio.entry_id)
        assert remove.called
    assert DOMAIN not in hass.data
