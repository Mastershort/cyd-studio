"""Generation context shared by all widget emitters."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .emit import Raw
from .fonts import FontCollector
from .layout import TILE_PAD
from .model import Issue, safe_id
from .theme import hex_color

LV_TEXT_ALIGN = {"left": "LEFT", "center": "CENTER", "right": "RIGHT"}

STRINGS: dict[str, dict[str, Any]] = {
    "de": {
        "on": "An",
        "off": "Aus",
        "open": "Offen",
        "closed": "Geschlossen",
        "opening": "Öffnet",
        "closing": "Schließt",
        "unavailable": "Nicht verfügbar",
        "unknown": "–",
        "locked": "Verriegelt",
        "unlocked": "Entriegelt",
        "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
        "months": [
            "Januar",
            "Februar",
            "März",
            "April",
            "Mai",
            "Juni",
            "Juli",
            "August",
            "September",
            "Oktober",
            "November",
            "Dezember",
        ],
        "date_format": "{weekday}, {day}. {month}",
    },
    "en": {
        "on": "On",
        "off": "Off",
        "open": "Open",
        "closed": "Closed",
        "opening": "Opening",
        "closing": "Closing",
        "unavailable": "Unavailable",
        "unknown": "–",
        "locked": "Locked",
        "unlocked": "Unlocked",
        "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "months": [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ],
        "date_format": "{weekday}, {month} {day}",
    },
}

ON_STATES = ("on", "open", "opening", "unlocked", "home", "playing")


def cpp_str(text: str) -> str:
    """C++ string literal (UTF-8 kept as is)."""
    out = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    return f'"{out}"'


@dataclass
class Source:
    """A Home Assistant entity mirrored into ESPHome (exactly one per entity/attribute/kind)."""

    id: str
    kind: str  # "text" | "number"
    entity: str
    attribute: str | None
    actions: list[Any] = field(default_factory=list)


class Context:
    """Mutable state while generating one configuration."""

    def __init__(
        self,
        project: dict[str, Any],
        board: dict[str, Any],
        theme: dict[str, Any],
        widget_defs: dict[str, dict[str, Any]],
    ) -> None:
        self.project = project
        self.board = board
        self.theme = theme
        self.widget_defs = widget_defs
        self.fonts = FontCollector()
        self.sources: dict[tuple[str, str, str | None], Source] = {}
        self.time_updates: list[Any] = []
        self.needs_seconds = False
        self.objects = 0
        self.issues: list[Issue] = []
        lang = project["settings"].get("language", "de")
        self.lang = lang if lang in STRINGS else "de"
        self.strings = STRINGS[self.lang]
        self.page_ids = {p["id"]: f"page_{safe_id(p['id'])}" for p in project["pages"]}
        self.entities: dict[str, str] = {}
        self.page_actions: list[Any] = []

    def ent(self, entity: str) -> str:
        """Reference an entity through a substitution (lets experts edit ids in one place)."""
        if entity not in self.entities:
            key = "ent_" + safe_id(entity)
            while key in self.entities.values():
                key += "_"
            self.entities[entity] = key
        return "${" + self.entities[entity] + "}"

    # -- theme -------------------------------------------------------------
    def color(self, role: str) -> Raw:
        """Theme color by role as LVGL literal."""
        colors = self.theme["colors"]
        mapping = {"state_icon": "off", "nav": "nav_inactive"}
        return Raw(hex_color(colors.get(role) or colors[mapping.get(role, "text")]))

    def color_hex(self, role: str) -> str:
        """Theme color as '0xRRGGBB' string."""
        return self.color(role).text

    @property
    def font_sizes(self) -> dict[str, int]:
        """Theme font size tokens."""
        return dict(self.theme.get("font_sizes", {}))

    @property
    def icon_sizes(self) -> dict[str, int]:
        """Theme icon size tokens."""
        return dict(self.theme.get("icon_sizes", {}))

    @property
    def tile_pad(self) -> int:
        """LVGL pad so that the content box is inset by TILE_PAD incl. border."""
        return max(TILE_PAD - int(self.theme.get("border_width", 0)), 0)

    # -- sources -----------------------------------------------------------
    def source(self, kind: str, entity: str, attribute: str | None = None) -> Source:
        """Get or create the single mirror of an entity."""
        key = (kind, entity, attribute)
        self.ent(entity)
        if key not in self.sources:
            base = "ha_" + safe_id(entity)
            if attribute:
                base += "_" + safe_id(attribute)
            if kind == "number":
                base += "_num"
            self.sources[key] = Source(base, kind, entity, attribute)
        return self.sources[key]

    # -- elements ----------------------------------------------------------
    def warn(self, code: str, de: str, en: str, page: str | None = None, widget: str | None = None) -> None:
        """Add a generator warning."""
        self.issues.append(Issue("warning", code, de, en, page, widget))

    def label(
        self, el: dict[str, Any], obj_id: str | None, text: str, color: Raw | None = None
    ) -> dict[str, Any] | None:
        """Turn a layout element into an LVGL label widget."""
        self.objects += 1
        conf: dict[str, Any] = {}
        if obj_id:
            conf["id"] = obj_id
        conf["align"] = el["align"]
        conf["x"] = el["x"]
        conf["y"] = el["y"]
        if el["kind"] == "icon":
            found = self.fonts.icon_font(el["size"], text)
            if found is None:
                self.objects -= 1
                self.warn("icon_unknown", f"Unbekanntes Icon: {text}", f"Unknown icon: {text}")
                return None
            font_id, glyph = found
            conf["text_font"] = font_id
            conf["text"] = glyph
        else:
            conf["text_font"] = self.fonts.text_font(el["size"], text)
            if el.get("width"):
                conf["width"] = el["width"]
                conf["long_mode"] = "DOT"
                conf["text_align"] = LV_TEXT_ALIGN.get(el.get("text_align", "left"), "LEFT")
            conf["text"] = text
        conf["text_color"] = color or self.color(el["color"])
        return {"label": conf}
