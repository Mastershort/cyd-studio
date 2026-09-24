"""Persistent storage of projects and their history."""

from __future__ import annotations

import base64
import copy
import secrets
import uuid
from datetime import datetime
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import HISTORY_LIMIT, HISTORY_MIN_INTERVAL_S, STORAGE_KEY, STORAGE_VERSION
from .generator.model import SCHEMA_VERSION, normalize


class _MigratingStore(Store[dict[str, Any]]):
    """Store with migrations between storage versions."""

    async def _async_migrate_func(
        self, old_major_version: int, old_minor_version: int, old_data: dict[str, Any]
    ) -> dict[str, Any]:
        # No migrations yet (storage version 1)
        return old_data


def new_api_key() -> str:
    """Random ESPHome API encryption key (32 bytes, base64)."""
    return base64.b64encode(secrets.token_bytes(32)).decode("ascii")


def migrate_project(project: dict[str, Any]) -> dict[str, Any]:
    """Bring a project (e.g. an imported file) to the current schema version."""
    version = int(project.get("schema", 1))
    if version > SCHEMA_VERSION:
        raise ValueError(f"Project schema {version} is newer than supported ({SCHEMA_VERSION})")
    project["schema"] = SCHEMA_VERSION
    return project


class ProjectStore:
    """Projects, history (last HISTORY_LIMIT states per project) and export status."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = _MigratingStore(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {"projects": {}, "history": {}, "exports": {}}

    async def async_load(self) -> None:
        """Load from disk."""
        data = await self._store.async_load()
        if data:
            self._data = {"projects": {}, "history": {}, "exports": {}, **data}

    async def _async_save(self) -> None:
        await self._store.async_save(self._data)

    # -- queries -----------------------------------------------------------
    def list(self) -> list[dict[str, Any]]:
        """Summaries of all projects, newest first."""
        out = []
        for project in self._data["projects"].values():
            pages = project.get("pages", [])
            export = self._data["exports"].get(project["id"])
            out.append(
                {
                    "id": project["id"],
                    "name": project.get("name", ""),
                    "device_name": project.get("device_name", ""),
                    "board": project.get("board", ""),
                    "orientation": project.get("orientation", "landscape"),
                    "updated": project.get("meta", {}).get("updated"),
                    "page_count": len(pages),
                    "widget_count": sum(len(p.get("widgets", [])) for p in pages),
                    "exported": export,
                    "changed_since_export": bool(export)
                    and export.get("updated") != project.get("meta", {}).get("updated"),
                }
            )
        out.sort(key=lambda p: p["updated"] or "", reverse=True)
        return out

    def get(self, project_id: str) -> dict[str, Any] | None:
        """A project by id (copy)."""
        project = self._data["projects"].get(project_id)
        return copy.deepcopy(project) if project else None

    def all(self) -> list[dict[str, Any]]:
        """All projects (copies)."""
        return [copy.deepcopy(p) for p in self._data["projects"].values()]

    def history(self, project_id: str) -> list[dict[str, Any]]:
        """History entries (timestamp + name), newest first."""
        entries = self._data["history"].get(project_id, [])
        return [
            {"index": i, "saved": e["saved"], "name": e["project"].get("name", "")}
            for i, e in reversed(list(enumerate(entries)))
        ]

    # -- mutations ---------------------------------------------------------
    async def async_save(self, project: dict[str, Any]) -> dict[str, Any]:
        """Create or update a project; returns the stored project."""
        project = migrate_project(copy.deepcopy(project))
        now = dt_util.utcnow().isoformat(timespec="seconds")
        if not project.get("id"):
            project["id"] = uuid.uuid4().hex
        project.setdefault("meta", {})
        project["meta"].setdefault("created", now)
        project["meta"]["updated"] = now
        project.setdefault("settings", {})
        if not project["settings"].get("api_key"):
            project["settings"]["api_key"] = new_api_key()
        old = self._data["projects"].get(project["id"])
        if old is not None:
            self._push_history(project["id"], old)
        self._data["projects"][project["id"]] = project
        await self._async_save()
        return copy.deepcopy(project)

    def _push_history(self, project_id: str, old: dict[str, Any]) -> None:
        entries: list[dict[str, Any]] = self._data["history"].setdefault(project_id, [])
        now = dt_util.utcnow()
        if entries:
            last = datetime.fromisoformat(entries[-1]["saved"])
            if (now - last).total_seconds() < HISTORY_MIN_INTERVAL_S:
                return
        entries.append({"saved": now.isoformat(timespec="seconds"), "project": copy.deepcopy(old)})
        del entries[:-HISTORY_LIMIT]

    async def async_restore(self, project_id: str, index: int) -> dict[str, Any]:
        """Restore a history entry (the current state goes into the history)."""
        entries = self._data["history"].get(project_id, [])
        if not 0 <= index < len(entries):
            raise KeyError(index)
        restored = copy.deepcopy(entries[index]["project"])
        current = self._data["projects"].get(project_id)
        if current:
            entries.append({"saved": dt_util.utcnow().isoformat(timespec="seconds"), "project": copy.deepcopy(current)})
            del entries[:-HISTORY_LIMIT]
        restored["meta"]["updated"] = dt_util.utcnow().isoformat(timespec="seconds")
        self._data["projects"][project_id] = restored
        await self._async_save()
        return copy.deepcopy(restored)

    async def async_delete(self, project_id: str) -> None:
        """Delete a project and its history."""
        self._data["projects"].pop(project_id, None)
        self._data["history"].pop(project_id, None)
        self._data["exports"].pop(project_id, None)
        await self._async_save()

    async def async_duplicate(self, project_id: str) -> dict[str, Any]:
        """Copy a project under a new id, name and device name."""
        project = self.get(project_id)
        if project is None:
            raise KeyError(project_id)
        project["id"] = ""
        project["name"] = f"{project.get('name', '')} (Kopie)"
        project["device_name"] = f"{project.get('device_name', 'cyd')}-2"[:31]
        project["settings"]["api_key"] = None
        project["meta"] = {}
        return await self.async_save(project)

    async def async_import(self, project: dict[str, Any]) -> dict[str, Any]:
        """Import a project; keeps the id unless it already exists."""
        project = migrate_project(copy.deepcopy(project))
        if project.get("id") in self._data["projects"]:
            project["id"] = ""
        project = normalize(project) | {"id": project.get("id", "")}
        return await self.async_save(project)

    async def async_mark_exported(self, project_id: str, checksum: str) -> None:
        """Remember that the current state was exported."""
        project = self._data["projects"].get(project_id)
        if project is None:
            return
        self._data["exports"][project_id] = {
            "updated": project.get("meta", {}).get("updated"),
            "checksum": checksum,
            "at": dt_util.utcnow().isoformat(timespec="seconds"),
        }
        await self._async_save()

    async def async_remove_all(self) -> None:
        """Delete everything (used when the user removes projects on uninstall)."""
        await self._store.async_remove()
        self._data = {"projects": {}, "history": {}, "exports": {}}
