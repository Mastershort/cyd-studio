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


async def test_actions_not_allowed_issue_and_fix(
    hass: HomeAssistant, setup_studio: MockConfigEntry, hass_ws_client: Any
) -> None:
    """A project whose ESPHome device may not perform actions gets a fixable repair issue."""
    from homeassistant.helpers import issue_registry as ir

    from custom_components.cyd_studio.repairs import async_create_fix_flow

    esphome = MockConfigEntry(
        domain="esphome", title="Wohnzimmer", data={"device_name": "cyd-wohnzimmer"},
        options={"allow_service_calls": False},
    )  # fmt: skip
    esphome.add_to_hass(hass)
    client = await hass_ws_client(hass)

    async def call(type_: str, **data: Any) -> Any:
        await client.send_json_auto_id({"type": f"cyd_studio/{type_}", **data})
        msg = await client.receive_json()
        assert msg["success"], msg
        return msg["result"]

    project = json.loads((GOLDEN / "multipage.json").read_text(encoding="utf-8"))
    project["id"] = ""
    saved = await call("projects/save", project=project)
    status = (await call("esphome/devices"))[saved["id"]]
    assert status["found"] and not status["actions_allowed"]

    issue_id = f"actions_not_allowed_{esphome.entry_id}"
    issue = ir.async_get(hass).async_get_issue(DOMAIN, issue_id)
    assert issue is not None and issue.is_fixable

    # repair flow: confirm -> option set
    flow = await async_create_fix_flow(hass, issue_id, issue.data)
    flow.hass = hass
    result = await flow.async_step_init()
    assert result["type"] is FlowResultType.FORM
    result = await flow.async_step_confirm({})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert esphome.options["allow_service_calls"] is True
    await hass.async_block_till_done()
    assert ir.async_get(hass).async_get_issue(DOMAIN, issue_id) is None

    # panel button path
    hass.config_entries.async_update_entry(esphome, options={"allow_service_calls": False})
    await hass.async_block_till_done()
    assert ir.async_get(hass).async_get_issue(DOMAIN, issue_id) is not None
    status = await call("esphome/allow_actions", project_id=saved["id"])
    assert status["actions_allowed"] is True
    assert ir.async_get(hass).async_get_issue(DOMAIN, issue_id) is None


async def test_device_without_option_counts_as_allowed(hass: HomeAssistant, setup_studio: MockConfigEntry) -> None:
    """Older ESPHome entries without the option key: HA treats them as allowed."""
    from custom_components.cyd_studio.esphome_bridge import device_status

    MockConfigEntry(domain="esphome", title="Alt", data={"device_name": "cyd-alt"}).add_to_hass(hass)
    assert device_status(hass, "cyd-alt")["actions_allowed"] is True
    assert device_status(hass, "unbekannt")["found"] is False


async def test_assets_and_save_to_esphome(
    hass: HomeAssistant, setup_studio: MockConfigEntry, hass_ws_client: Any, tmp_path: Path
) -> None:
    """Upload a background, save to ESPHome (new, hand-edited, foreign file) and set WiFi secrets."""
    import base64
    import io

    from PIL import Image

    hass.config.config_dir = str(tmp_path)
    esphome_dir = tmp_path / "esphome"
    esphome_dir.mkdir()
    hass.data[DOMAIN].options["esphome_path"] = str(esphome_dir)
    client = await hass_ws_client(hass)

    async def call(type_: str, **data: Any) -> Any:
        await client.send_json_auto_id({"type": f"cyd_studio/{type_}", **data})
        msg = await client.receive_json()
        assert msg["success"], msg
        return msg["result"]

    project = json.loads((GOLDEN / "multipage.json").read_text(encoding="utf-8"))
    project["id"] = ""
    saved = await call("projects/save", project=project)

    # image: any size in, display size out, content addressed id
    buf = io.BytesIO()
    Image.new("RGB", (800, 600), (10, 120, 200)).save(buf, format="JPEG")
    upload = await call(
        "assets/upload", project_id=saved["id"], data=base64.b64encode(buf.getvalue()).decode(), width=320, height=240
    )
    asset_id = upload["asset_id"]
    assert len(asset_id) == 12
    got = await call("assets/get", project_id=saved["id"], asset_id=asset_id)
    assert got["data_url"].startswith("data:image/png;base64,")
    saved["background"] = {"image": asset_id}
    saved = await call("projects/save", project=saved)

    # first save: new file, image copied, secrets missing
    result = await call("esphome/save", project_id=saved["id"])
    assert result["status"] == "saved"
    target = esphome_dir / "cyd-wohnzimmer.yaml"
    assert target.is_file()
    assert (esphome_dir / "cyd_studio" / "cyd-wohnzimmer" / f"{asset_id}.png").is_file()
    assert result["secrets_missing"] == ["wifi_ssid", "wifi_password"]

    # saving again over our own unchanged file: no conflict
    assert (await call("esphome/save", project_id=saved["id"]))["status"] == "saved"

    # hand edit -> conflict with diff, overwrite keeps a backup
    target.write_text(
        target.read_text(encoding="utf-8").replace("friendly_name:", "friendly_name: x #"), encoding="utf-8"
    )
    result = await call("esphome/save", project_id=saved["id"])
    assert result["status"] == "conflict" and result["state"] == "modified" and result["diff"]
    result = await call("esphome/save", project_id=saved["id"], overwrite=True)
    assert result["status"] == "saved" and result["backup"]

    # foreign file
    target.write_text("esphome:\n  name: fremd\n", encoding="utf-8")
    result = await call("esphome/save", project_id=saved["id"])
    assert result["status"] == "conflict" and result["state"] == "foreign"

    # secrets: only the two keys are written, other content stays
    (esphome_dir / "secrets.yaml").write_text("other_key: keep\n", encoding="utf-8")
    await call("esphome/secrets_set", wifi_ssid="Mein WLAN", wifi_password='p"w')
    secrets = (esphome_dir / "secrets.yaml").read_text(encoding="utf-8")
    assert "other_key: keep" in secrets
    assert 'wifi_ssid: "Mein WLAN"' in secrets
    assert 'wifi_password: "p\\"w"' in secrets


async def test_apply_design_duplicate_and_embedded_images(
    hass: HomeAssistant, setup_studio: MockConfigEntry, hass_ws_client: Any, tmp_path: Path
) -> None:
    """Design from a project or a file (with images) replaces pages and theme; identity stays; undo via history."""
    import base64
    import io

    from PIL import Image

    hass.config.config_dir = str(tmp_path)
    client = await hass_ws_client(hass)

    async def call(type_: str, **data: Any) -> Any:
        await client.send_json_auto_id({"type": f"cyd_studio/{type_}", **data})
        msg = await client.receive_json()
        assert msg["success"], msg
        return msg["result"]

    source = json.loads((GOLDEN / "styled.json").read_text(encoding="utf-8"))
    source["id"] = ""
    source = await call("projects/save", project=source)
    buf = io.BytesIO()
    Image.new("RGB", (320, 240), (200, 40, 90)).save(buf, format="PNG")
    png = base64.b64encode(buf.getvalue()).decode()
    asset_id = (await call("assets/upload", project_id=source["id"], data=png, width=320, height=240))["asset_id"]
    source["background"] = {"image": asset_id}
    source = await call("projects/save", project=source)

    target = json.loads((GOLDEN / "multipage.json").read_text(encoding="utf-8"))
    target["id"] = ""
    target = await call("projects/save", project=target)

    applied = await call("projects/apply_design", project_id=target["id"], source_project_id=source["id"])
    for key in ("id", "name", "device_name", "board"):
        assert applied[key] == target[key]
    assert applied["settings"]["api_key"] == target["settings"]["api_key"]

    def widgets(project: dict[str, Any]) -> list[tuple[str, list[str]]]:
        return [(p["id"], [w["id"] for w in p["widgets"]]) for p in project["pages"]]

    assert widgets(applied) == widgets(source) and applied["theme"] == source["theme"]
    assert (await call("assets/get", project_id=target["id"], asset_id=asset_id))["data_url"]

    # undo: the state before is the newest history entry
    latest = (await call("projects/history", project_id=target["id"]))[0]
    restored = await call("projects/restore", project_id=target["id"], index=latest["index"])
    assert widgets(restored) == widgets(target)

    # from a file: images embedded as data URLs
    data_url = (await call("assets/get", project_id=source["id"], asset_id=asset_id))["data_url"]
    file_project = {k: v for k, v in source.items() if k != "id"}
    await call("projects/apply_design", project_id=target["id"], project=file_project, assets={asset_id: data_url})
    assert (await call("projects/get", project_id=target["id"]))["background"] == {"image": asset_id}

    # duplicate and import carry the images too
    dup = await call("projects/duplicate", project_id=source["id"])
    assert (await call("assets/get", project_id=dup["id"], asset_id=asset_id))["data_url"]
    imported = await call("projects/import", project=file_project, assets={asset_id: data_url})
    assert (await call("assets/get", project_id=imported["id"], asset_id=asset_id))["data_url"]

    # a project cannot take its own design, unknown sources are rejected
    await client.send_json_auto_id(
        {"type": "cyd_studio/projects/apply_design", "project_id": target["id"], "source_project_id": target["id"]}
    )
    assert not (await client.receive_json())["success"]
