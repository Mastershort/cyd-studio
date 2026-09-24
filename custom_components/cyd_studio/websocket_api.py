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

from .const import CONF_ESPHOME_PATH, CONF_REQUIRE_ADMIN, DOMAIN
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
        ws_projects_history,
        ws_projects_restore,
        ws_projects_import,
        ws_generate_yaml,
        ws_esphome_status,
        ws_info,
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
    connection.send_result(msg["id"], project)


@websocket_api.websocket_command({vol.Required("type"): "cyd_studio/projects/delete", vol.Required("project_id"): str})
@websocket_api.async_response
@_guarded
async def ws_projects_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Delete a project (ESPHome files are never touched)."""
    await runtime.store.async_delete(msg["project_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "cyd_studio/projects/duplicate", vol.Required("project_id"): str}
)
@websocket_api.async_response
@_guarded
async def ws_projects_duplicate(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], runtime: StudioRuntime
) -> None:
    """Duplicate a project."""
    try:
        project = await runtime.store.async_duplicate(msg["project_id"])
    except KeyError:
        connection.send_error(msg["id"], "not_found", "Project not found")
        return
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
    connection.send_result(msg["id"], project)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "cyd_studio/projects/import",
        vol.Exclusive("project", "source"): dict,
        vol.Exclusive("yaml", "source"): str,
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
