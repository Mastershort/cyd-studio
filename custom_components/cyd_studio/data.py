"""Static data shipped with the integration: boards, widgets, themes, templates."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .generator.board import load_boards
from .generator.theme import load_themes

BASE = Path(__file__).parent
FRONTEND_DIST = BASE / "frontend" / "dist"


def _load_json_dir(directory: Path, key: str) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for path in sorted(directory.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        out[data[key]] = data
    return out


@dataclass
class StudioData:
    """Everything loaded from disk at setup."""

    boards: dict[str, dict[str, Any]]
    widgets: dict[str, dict[str, Any]]
    themes: dict[str, dict[str, Any]]
    templates: dict[str, dict[str, Any]]
    schema: dict[str, Any]
    frontend_hash: str


def load_studio_data() -> StudioData:
    """Load all data files (blocking – call in the executor)."""
    module = FRONTEND_DIST / "cyd-studio-panel.js"
    frontend_hash = hashlib.sha256(module.read_bytes()).hexdigest()[:10] if module.exists() else "dev"
    return StudioData(
        boards=load_boards(),
        widgets=_load_json_dir(BASE / "widgets", "type"),
        themes=load_themes(),
        templates=_load_json_dir(BASE / "templates", "id"),
        schema=json.loads((BASE / "schema" / "project.schema.json").read_text(encoding="utf-8")),
        frontend_hash=frontend_hash,
    )
