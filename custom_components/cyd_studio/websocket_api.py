"""WebSocket API used by the panel."""

from __future__ import annotations

import json
import os
from collections.abc import Callable, Coroutine
from functools import wraps
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import Unauthorized

from . import assets, esphome_files
from .const import CONF_ESPHOME_PATH, CONF_REQUIRE_ADMIN, DOMAIN
from .esphome_bridge import async_allow_actions, async_update_issues, device_status, find_device_entry
from .generator import generate_yaml
from .generator.generate import decode_project, split_generated
from .runtime import StudioRuntime

Handler = Callable[[HomeAssistant, ActiveConnection, dict[str, Any], StudioRuntime], Coroutine[Any, Any, None]]


def _runtime(hass: HomeAssistant) -> StudioRuntime:
    runtime: StudioRuntime = hass.data[DOMAIN]
    return runtime


def _guarded(func: Handler) -> Callable[[HomeAssistant, ActiveConnection, dict[str, Any]], Coroutine[Any, Any, None]]:
    """Check admin rights (if configured) and that the integration is set up."""

    @wraps(func)
    async def wrapper(hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]) -> None:
        runtime = hass.data.get(DOMAIN)
        if runtime is None:
            connection.send_error(msg["id"], "not_loaded", "CYD Studio is not set up")
            return
        if runtime.options.get(CONF_REQUIRE_ADMIN, True) and not connection.user.is_admin:
            raise Unauthorized
        await func(hass, connection, msg, runtime)

    return wrapper


@callback
def async_register(hass: HomeAssistant) -> None:
    """Register all commands."""
    for handler in (
        ws_boards_list,
        ws_widgets_list,
        ws_themes_list,
        ws_templates_list,
        ws_schema_get,
        ws_projects_list,
        ws_projects_get,
        ws_projects_save,
        ws_projects_delete,
        ws_projects_duplicate,
        ws_projects_apply_design,
        ws_projects_history,
        ws_projects_restore,
        ws_projects_import,
        ws_generate_yaml,
        ws_esphome_status,
        ws_info,
        ws_esphome_devices,
        ws_esphome_allow_actions,
        ws_assets_upload,
        ws_assets_get,
        ws_esphome_save,
        ws_esphome_secrets_set,
    ):
        websocket_api.async_register_command(hass, handler)


# -- static data --------------------------------------------------------------


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/info"})
@websocket_api.async_response
@_guarded
async def ws_info(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Versions and options the panel needs."""
    connection.send_result(msg["id"], runtime.info())


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/boards/list"})
@websocket_api.async_response
@_guarded
async def ws_boards_list(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Board profiles."""
    connection.send_result(msg["id"], list(runtime.data.boards.values()))


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/widgets/list"})
@websocket_api.async_response
@_guarded
async def ws_widgets_list(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Widget definitions."""
    connection.send_result(msg["id"], list(runtime.data.widgets.values()))


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/themes/list"})
@websocket_api.async_response
@_guarded
async def ws_themes_list(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Themes."""
    connection.send_result(msg["id"], list(runtime.data.themes.values()))


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/templates/list"})
@websocket_api.async_response
@_guarded
async def ws_templates_list(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Starter templates."""
    connection.send_result(msg["id"], list(runtime.data.templates.values()))


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/schema/get"})
@websocket_api.async_response
@_guarded
async def ws_schema_get(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Project JSON schema."""
    connection.send_result(msg["id"], runtime.data.schema)


# -- projects -----------------------------------------------------------------


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/projects/list"})
@websocket_api.async_response
@_guarded
async def ws_projects_list(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Project summaries."""
    connection.send_result(msg["id"], runtime.store.summaries())


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/projects/get", vol.Required("project_id"): str})
@websocket_api.async_response
@_guarded
async def ws_projects_get(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """A single project."""
    project = runtime.store.get(msg["project_id"])
    if project is None:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
    connection.send_result(msg["id"], project)


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/projects/save", vol.Required("project"): dict})
@websocket_api.async_response
@_guarded
async def ws_projects_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Create or update a project."""
    try:
        project = await runtime.store.async_save(msg["project"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"], project)


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/projects/delete", vol.Required("project_id"): str})
@websocket_api.async_response
@_guarded
async def ws_projects_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Delete a project (ESPHome files are never touched)."""
    await runtime.store.async_delete(msg["project_id"])
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "cyd_studio/projects/duplicate", vol.Required("project_id"): str}
)
@websocket_api.async_response
@_guarded
async def ws_projects_duplicate(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Duplicate a project (with its images)."""
    try:
        project = await runtime.store.async_duplicate(msg["project_id"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
    await hass.async_add_executor_job(
        assets.copy_assets, hass.config.config_dir, msg["project_id"], project["id"], assets.used_assets(project)
    )
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"], project)


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/projects/history", vol.Required("project_id"): str})
@websocket_api.async_response
@_guarded
async def ws_projects_history(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """History of a project."""
    connection.send_result(msg["id"], runtime.store.history(msg["project_id"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "cyd_studio/projects/restore", vol.Required("project_id"): str, vol.Required("index"): int}
)
@websocket_api.async_response
@_guarded
async def ws_projects_restore(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Restore a history entry."""
    try:
        project = await runtime.store.async_restore(msg["project_id"], msg["index"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "History entry not found")
        return
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"], project)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/projects/apply_design",
        vol.Required("project_id"): str,
        vol.Exclusive("source_project_id", "source"): str,
        vol.Exclusive("project", "source"): dict,
        vol.Optional("assets"): {str: str},
    }
)
@websocket_api.async_response
@_guarded
async def ws_projects_apply_design(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Take pages, widgets, theme and styles from another project or a project file; the identity stays."""
    source = msg.get("project")
    if msg.get("source_project_id"):
        source = runtime.store.get(msg["source_project_id"])
    if source is None or msg.get("source_project_id") == msg["project_id"]:
        connection.send_error(msg["id"], "not_found", "Source project not found")
        return
    try:
        stored = await runtime.store.async_apply_design(msg["project_id"], source)
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    if msg.get("source_project_id"):
        await hass.async_add_executor_job(
            assets.copy_assets, hass.config.config_dir, msg["source_project_id"], stored["id"],
            assets.used_assets(stored),
        )  # fmt: skip
    elif msg.get("assets"):
        await hass.async_add_executor_job(assets.store_embedded, hass.config.config_dir, stored["id"], msg["assets"])
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"], stored)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/projects/import",
        vol.Exclusive("project", "source"): dict,
        vol.Exclusive("yaml", "source"): str,
        vol.Optional("assets"): {str: str},
    }
)
@websocket_api.async_response
@_guarded
async def ws_projects_import(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Import a project file or a generated YAML (round-trip block)."""
    project: dict[str, Any] | None = msg.get("project")
    if project is None and msg.get("yaml"):
        try:
            project = decode_project(msg["yaml"])
        except (ValueError, OSError, json.JSONDecodeError):
            project = None
    if project is None:
        connection.send_error(msg["id"], "invalid", "No CYD Studio project found")
        return
    try:
        stored = await runtime.store.async_import(project)
    except ValueError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    if msg.get("assets"):
        await hass.async_add_executor_job(assets.store_embedded, hass.config.config_dir, stored["id"], msg["assets"])
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"], stored)


# -- generator ----------------------------------------------------------------


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/generate/yaml",
        vol.Exclusive("project_id", "source"): str,
        vol.Exclusive("project", "source"): dict,
        vol.Optional("mark_exported", default=False): bool,
    }
)
@websocket_api.async_response
@_guarded
async def ws_generate_yaml(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Generate ESPHome YAML (plus warnings and a memory estimate)."""
    project = msg.get("project") or (runtime.store.get(msg["project_id"]) if msg.get("project_id") else None)
    if project is None:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
    known = set(hass.states.async_entity_ids())
    data = runtime.data
    result = await hass.async_add_executor_job(generate_yaml, project, data.boards, data.themes, data.widgets, known)
    payload = result.as_dict()
    if result.ok and msg["mark_exported"] and project.get("id"):
        _, checksum = split_generated(result.yaml)
        await runtime.store.async_mark_exported(project["id"], checksum or "")
        esphome_dir = _esphome_dir(hass, runtime)
        dir_exists: bool = await hass.async_add_executor_job(os.path.isdir, esphome_dir)
        if dir_exists and assets.used_assets(project):
            await hass.async_add_executor_job(
                assets.copy_assets_to_esphome, hass.config.config_dir, esphome_dir, project
            )
    runtime.last_issues = payload["issues"]
    connection.send_result(msg["id"], payload)


# -- ESPHome ------------------------------------------------------------------


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/esphome/status"})
@websocket_api.async_response
@_guarded
async def ws_esphome_status(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Report whether the ESPHome Device Builder directory is available."""
    path = hass.config.path(runtime.options.get(CONF_ESPHOME_PATH, "esphome"))
    exists = await hass.async_add_executor_job(os.path.isdir, path)
    connection.send_result(
        msg["id"],
        {
            "directory": path,
            "directory_exists": exists,
            "esphome_integration_loaded": "esphome" in hass.config.components,
        },
    )


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/esphome/devices"})
@websocket_api.async_response
@_guarded
async def ws_esphome_devices(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """ESPHome device status per project (found in HA, loaded, actions allowed)."""
    result = {p["id"]: device_status(hass, p.get("device_name", "")) for p in runtime.store.all()}
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): "cyd_studio/esphome/allow_actions", vol.Required("project_id"): str}
)
@websocket_api.async_response
@_guarded
async def ws_esphome_allow_actions(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Enable "allow actions" on the ESPHome device of a project (the panel asks for confirmation)."""
    project = runtime.store.get(msg["project_id"])
    entry = find_device_entry(hass, project.get("device_name", "")) if project else None
    if entry is None:
        connection.send_error(msg["id"], "not_found", "ESPHome device not found")
        return
    async_allow_actions(hass, entry)
    async_update_issues(hass, runtime.store.all())
    connection.send_result(msg["id"], device_status(hass, entry.data.get("device_name", "")))


def _esphome_dir(hass: HomeAssistant, runtime: StudioRuntime) -> str:
    return hass.config.path(runtime.options.get(CONF_ESPHOME_PATH, "esphome"))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/assets/upload",
        vol.Required("project_id"): str,
        vol.Required("data"): str,
        vol.Required("width"): vol.All(int, vol.Range(min=16, max=1024)),
        vol.Required("height"): vol.All(int, vol.Range(min=16, max=1024)),
    }
)
@websocket_api.async_response
@_guarded
async def ws_assets_upload(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Store an image (e.g. background) fitted to the display size; returns its asset id."""
    if runtime.store.get(msg["project_id"]) is None:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
    try:
        asset_id = await hass.async_add_executor_job(
            assets.store_image, hass.config.config_dir, msg["project_id"], msg["data"], msg["width"], msg["height"]
        )
    except (ValueError, OSError) as err:
        connection.send_error(msg["id"], "invalid_image", str(err))
        return
    connection.send_result(msg["id"], {"asset_id": asset_id})


@websocket_api.websocket_command(
    {vol.Required("type"): "cyd_studio/assets/get", vol.Required("project_id"): str, vol.Required("asset_id"): str}
)
@websocket_api.async_response
@_guarded
async def ws_assets_get(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Image as data URL for the preview."""
    data = await hass.async_add_executor_job(
        assets.read_image, hass.config.config_dir, msg["project_id"], msg["asset_id"]
    )
    if data is None:
        connection.send_error(msg["id"], "not_found", "Image not found")
        return
    connection.send_result(msg["id"], {"data_url": data})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/esphome/save",
        vol.Required("project_id"): str,
        vol.Optional("overwrite", default=False): bool,
    }
)
@websocket_api.async_response
@_guarded
async def ws_esphome_save(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Write <device_name>.yaml (and images) into the ESPHome directory.

    Returns ``{"status": "conflict", ...}`` instead of overwriting a foreign or hand-edited file
    unless ``overwrite`` is set (a backup is kept in that case).
    """
    project = runtime.store.get(msg["project_id"])
    if project is None:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
    esphome_dir = _esphome_dir(hass, runtime)
    if not await hass.async_add_executor_job(os.path.isdir, esphome_dir):
        connection.send_error(msg["id"], "no_esphome_dir", f"ESPHome directory not found: {esphome_dir}")
        return
    data = runtime.data
    known = set(hass.states.async_entity_ids())
    result = await hass.async_add_executor_job(generate_yaml, project, data.boards, data.themes, data.widgets, known)
    if not result.ok:
        connection.send_result(msg["id"], {"status": "invalid", "issues": result.as_dict()["issues"]})
        return
    existing = await hass.async_add_executor_job(
        esphome_files.inspect_existing, esphome_dir, project["device_name"], result.yaml
    )
    if existing["state"] in ("foreign", "modified") and not msg["overwrite"]:
        connection.send_result(msg["id"], {"status": "conflict", **existing})
        return
    backup = await hass.async_add_executor_job(
        esphome_files.write_config,
        esphome_dir,
        project["device_name"],
        result.yaml,
        existing["state"] in ("foreign", "modified"),
    )
    missing_images = await hass.async_add_executor_job(
        assets.copy_assets_to_esphome, hass.config.config_dir, esphome_dir, project
    )
    _, checksum = split_generated(result.yaml)
    await runtime.store.async_mark_exported(project["id"], checksum or "")
    secrets = await hass.async_add_executor_job(esphome_files.missing_secrets, esphome_dir)
    connection.send_result(
        msg["id"],
        {
            "status": "saved",
            "path": existing["path"],
            "backup": backup,
            "secrets_missing": secrets,
            "missing_images": missing_images,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/esphome/secrets_set",
        vol.Required("wifi_ssid"): vol.All(str, vol.Length(min=1, max=64)),
        vol.Required("wifi_password"): vol.All(str, vol.Length(max=128)),
    }
)
@websocket_api.async_response
@_guarded
async def ws_esphome_secrets_set(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Write wifi_ssid / wifi_password into the ESPHome secrets.yaml (nothing else is changed)."""
    esphome_dir = _esphome_dir(hass, runtime)
    if not await hass.async_add_executor_job(os.path.isdir, esphome_dir):
        connection.send_error(msg["id"], "no_esphome_dir", f"ESPHome directory not found: {esphome_dir}")
        return
    values = {"wifi_ssid": msg["wifi_ssid"], "wifi_password": msg["wifi_password"]}
    await hass.async_add_executor_job(esphome_files.set_secrets, esphome_dir, values)
    connection.send_result(msg["id"], {"secrets_missing": []})
