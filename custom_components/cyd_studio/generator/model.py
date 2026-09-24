"""Project model: normalization and semantic validation.

The JSON schema in ``schema/project.schema.json`` describes the structure
(used by the editor and the test-suite). This module performs the semantic
checks that decide whether valid ESPHome code can be generated.
"""

from __future__ import annotations

import copy
import re
from dataclasses import asdict, dataclass
from typing import Any

SCHEMA_VERSION = 1

DEVICE_NAME_RE = re.compile(r"^[a-z0-9]([a-z0-9-]{0,29}[a-z0-9])?$")
ENTITY_ID_RE = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
ACTION_RE = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
ORIENTATIONS = ("landscape", "portrait", "landscape_flipped", "portrait_flipped")
NAV_STYLES = ("tabbar", "swipe_and_dots", "side_menu", "buttons", "none")
PHASE1_NAV_STYLES = ("tabbar", "none")


@dataclass
class Issue:
    """A validation finding shown in the editor."""

    level: str  # "error" blocks the export, "warning" does not
    code: str
    message: str
    message_en: str
    page: str | None = None
    widget: str | None = None

    def as_dict(self) -> dict[str, Any]:
        """Serialize."""
        return asdict(self)


def default_project() -> dict[str, Any]:
    """Defaults for every optional top level field."""
    return {
        "schema": SCHEMA_VERSION,
        "id": "",
        "name": "CYD",
        "device_name": "cyd-display",
        "board": "esp32-2432s028r",
        "board_variant": None,
        "orientation": "landscape",
        "grid": {"cols": 4, "rows": 3, "gap": 8, "padding": 8},
        "theme": "mastershort_dark",
        "theme_overrides": {},
        "settings": {
            "brightness_day": 100,
            "brightness_night": 25,
            "night_mode": {
                "source": "off",
                "threshold": 2.6,
                "invert": False,
                "from": "22:00",
                "to": "06:30",
                "entity": None,
            },
            "screensaver": {"enabled": False, "after_s": 60, "action": "dim"},
            "return_home_after_s": 30,
            "rgb_led": {"enabled": False, "show_status": False},
            "wifi": {"use_secrets": True, "ap_fallback": True},
            "language": "de",
            "api_key": None,
        },
        "global": {
            "header": {
                "enabled": True,
                "height": 28,
                "widgets": [
                    {"type": "page_title", "align": "left"},
                    {"type": "clock", "align": "right"},
                ],
            },
            "footer": {"enabled": False, "height": 36, "widgets": []},
        },
        "pages": [],
        "navigation": {
            "style": "tabbar",
            "tabbar_position": "bottom",
            "show_labels": True,
            "show_icons": True,
            "swipe": True,
            "wrap_around": False,
            "home_page": None,
            "transition": "slide",
        },
        "popups": [],
        "meta": {},
    }


def _deep_defaults(value: Any, default: Any) -> Any:
    if isinstance(default, dict) and isinstance(value, dict):
        out = copy.deepcopy(default)
        for k, v in value.items():
            out[k] = _deep_defaults(v, default[k]) if k in default else copy.deepcopy(v)
        return out
    return copy.deepcopy(value)


def normalize(project: dict[str, Any]) -> dict[str, Any]:
    """Fill defaults so later stages can rely on every field being present."""
    out: dict[str, Any] = _deep_defaults(project, default_project())
    for page in out["pages"]:
        page.setdefault("parent", None)
        page.setdefault("in_navigation", page["parent"] is None)
        page.setdefault("icon", "mdi:checkbox-blank-outline")
        page.setdefault("layout", "grid")
        page.setdefault("grid_override", None)
        page.setdefault("timeout_s", None)
        page.setdefault("show_header", True)
        page.setdefault("widgets", [])
        for widget in page["widgets"]:
            widget.setdefault("props", {})
            widget.setdefault("entity", None)
    if not out["navigation"].get("home_page") and out["pages"]:
        out["navigation"]["home_page"] = out["pages"][0]["id"]
    return out


def safe_id(text: str) -> str:
    """Turn an arbitrary id into a C++/ESPHome identifier fragment."""
    s = re.sub(r"[^a-z0-9_]", "_", text.lower())
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "x"


def validate(
    project: dict[str, Any],
    widget_defs: dict[str, dict[str, Any]],
    boards: dict[str, dict[str, Any]],
    themes: dict[str, dict[str, Any]],
    known_entities: set[str] | None = None,
) -> list[Issue]:
    """Semantic validation. ``project`` must be normalized."""
    issues: list[Issue] = []

    def add(level: str, code: str, de: str, en: str, page: str | None = None, widget: str | None = None) -> None:
        issues.append(Issue(level, code, de, en, page, widget))

    if not DEVICE_NAME_RE.match(project["device_name"]):
        add(
            "error",
            "device_name",
            "Gerätename ungültig: nur Kleinbuchstaben, Ziffern und Bindestriche (max. 31 Zeichen).",
            "Invalid device name: lowercase letters, digits and dashes only (max. 31 characters).",
        )
    if project["board"] not in boards:
        add("error", "board", f"Unbekanntes Board: {project['board']}", f"Unknown board: {project['board']}")
    else:
        board = boards[project["board"]]
        variants = {v["id"] for v in board["display"].get("variants", [])}
        if project.get("board_variant") and project["board_variant"] not in variants:
            add("error", "board_variant", "Unbekannte Board-Variante.", "Unknown board variant.")
        if project["orientation"] not in board.get("orientations", {}):
            add(
                "error",
                "orientation",
                "Ausrichtung wird von diesem Board nicht unterstützt.",
                "Orientation is not supported by this board.",
            )
    if project["theme"] not in themes:
        add("error", "theme", f"Unbekanntes Theme: {project['theme']}", f"Unknown theme: {project['theme']}")
    if project["navigation"]["style"] not in PHASE1_NAV_STYLES:
        add(
            "warning",
            "nav_style",
            "Dieser Navigationsstil ist noch nicht verfügbar – es wird die Tab-Leiste verwendet.",
            "This navigation style is not available yet – the tab bar is used instead.",
        )

    for bg in [project.get("background"), *(pg.get("background") for pg in project["pages"])]:
        if isinstance(bg, dict) and bg.get("image") and not re.match(r"^[0-9a-f]{12}$", str(bg["image"])):
            add("error", "background", "Ungültiges Hintergrundbild.", "Invalid background image.")

    pages = project["pages"]
    if not pages:
        add("error", "no_pages", "Das Projekt hat keine Seite.", "The project has no page.")
        return issues

    page_ids = [p["id"] for p in pages]
    seen_safe: dict[str, str] = {}
    for pid in page_ids:
        sid = safe_id(pid)
        if sid in seen_safe:
            add("error", "page_id_dup", f"Seiten-ID doppelt: {pid}", f"Duplicate page id: {pid}", pid)
        seen_safe[sid] = pid
    by_id = {p["id"]: p for p in pages}
    if project["navigation"]["home_page"] not in by_id:
        add("error", "home_page", "Die Startseite existiert nicht.", "The home page does not exist.")

    for page in pages:
        pid = page["id"]
        # parent chain
        parent = page.get("parent")
        visited = {pid}
        while parent:
            if parent not in by_id:
                add(
                    "error",
                    "parent_missing",
                    f"Seite „{page.get('name', pid)}“: Eltern-Seite fehlt.",
                    f'Page "{page.get("name", pid)}": parent page is missing.',
                    pid,
                )
                break
            if parent in visited:
                add("error", "parent_cycle", "Seiten-Verschachtelung ist zirkulär.", "Page nesting is circular.", pid)
                break
            visited.add(parent)
            parent = by_id[parent].get("parent")

        if not page["widgets"]:
            add(
                "warning",
                "page_empty",
                f"Seite „{page.get('name', pid)}“ ist leer.",
                f'Page "{page.get("name", pid)}" is empty.',
                pid,
            )

        grid = dict(project["grid"])
        if page.get("grid_override"):
            grid.update(page["grid_override"])
        occupied: dict[tuple[int, int], str] = {}
        widget_ids: set[str] = set()
        for widget in page["widgets"]:
            wid = widget["id"]
            label = widget.get("props", {}).get("label") or wid
            if safe_id(wid) in widget_ids:
                add("error", "widget_id_dup", f"Widget-ID doppelt: {wid}", f"Duplicate widget id: {wid}", pid, wid)
            widget_ids.add(safe_id(wid))
            wdef = widget_defs.get(widget["type"])
            if wdef is None:
                add(
                    "error",
                    "widget_type",
                    f"Unbekannter Widget-Typ: {widget['type']}",
                    f"Unknown widget type: {widget['type']}",
                    pid,
                    wid,
                )
                continue
            if page.get("layout") != "free":
                x, y, w, h = (int(widget[k]) for k in ("x", "y", "w", "h"))
                if w < 1 or h < 1 or x < 0 or y < 0 or x + w > grid["cols"] or y + h > grid["rows"]:
                    add(
                        "error",
                        "out_of_grid",
                        f"„{label}“ ragt über das Raster hinaus.",
                        f'"{label}" exceeds the grid.',
                        pid,
                        wid,
                    )
                for cx in range(x, x + w):
                    for cy in range(y, y + h):
                        if (cx, cy) in occupied and occupied[(cx, cy)] != wid:
                            add(
                                "warning",
                                "overlap",
                                f"„{label}“ überlappt ein anderes Widget.",
                                f'"{label}" overlaps another widget.',
                                pid,
                                wid,
                            )
                            break
                        occupied[(cx, cy)] = wid
                    else:
                        continue
                    break

            entity = widget.get("entity")
            if wdef.get("entity") == "required":
                if not entity:
                    add(
                        "error",
                        "entity_missing",
                        f"„{label}“: Bitte eine Entität wählen.",
                        f'"{label}": please pick an entity.',
                        pid,
                        wid,
                    )
                elif not ENTITY_ID_RE.match(entity):
                    add(
                        "error",
                        "entity_invalid",
                        f"„{label}“: Entität „{entity}“ ist ungültig.",
                        f'"{label}": entity "{entity}" is invalid.',
                        pid,
                        wid,
                    )
                else:
                    domain = entity.split(".", 1)[0]
                    if wdef.get("domains") and domain not in wdef["domains"]:
                        add(
                            "warning",
                            "entity_domain",
                            f"„{label}“: {domain}-Entitäten passen nicht gut zu diesem Widget.",
                            f'"{label}": {domain} entities do not fit this widget well.',
                            pid,
                            wid,
                        )
                    if known_entities is not None and entity not in known_entities:
                        add(
                            "warning",
                            "entity_unknown",
                            f"Die Entität {entity} gibt es nicht (mehr) – andere wählen oder Kachel entfernen.",
                            f"Entity {entity} does not exist (anymore) – pick another or remove the tile.",
                            pid,
                            wid,
                        )
            for pdef in wdef.get("props", []):
                value = widget.get("props", {}).get(pdef["key"])
                if pdef.get("type") == "entity" and value and not ENTITY_ID_RE.match(str(value)):
                    add("error", "entity_invalid", f"„{label}“: Entität „{value}“ ist ungültig.",
                        f"\"{label}\": entity \"{value}\" is invalid.", pid, wid)  # fmt: skip
            if widget["type"] == "scene_button":
                action = widget.get("action") or {}
                service = action.get("service")
                if not service or not ACTION_RE.match(service):
                    add(
                        "error",
                        "action_missing",
                        f"„{label}“: Bitte eine Aktion wählen.",
                        f'"{label}": please pick an action.',
                        pid,
                        wid,
                    )
                target = action.get("target")
                if target and not ENTITY_ID_RE.match(target):
                    add(
                        "error",
                        "action_target",
                        f"„{label}“: Ziel „{target}“ ist ungültig.",
                        f'"{label}": target "{target}" is invalid.',
                        pid,
                        wid,
                    )
            if widget["type"] == "page_button":
                target = widget.get("props", {}).get("target")
                if not target or target not in by_id:
                    add(
                        "error",
                        "page_target",
                        f"„{label}“: Ziel-Seite fehlt.",
                        f'"{label}": target page is missing.',
                        pid,
                        wid,
                    )
            if widget["type"] == "sensor_value":
                tap = widget.get("props", {}).get("tap_page")
                if tap and tap not in by_id:
                    add(
                        "warning",
                        "page_target",
                        f"„{label}“: Ziel-Seite existiert nicht.",
                        f'"{label}": target page does not exist.',
                        pid,
                        wid,
                    )
    return issues
