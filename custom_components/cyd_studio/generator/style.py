"""Tile styles: preset + per-widget overrides -> concrete colors and sizes.

Mirrored 1:1 by ``frontend/src/style.ts`` (parity cases in ``tests/layout_cases.json``).
Presets are data (``styles/tile_presets.json``); color values are theme roles or ``#rrggbb``.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

PRESETS_FILE = Path(__file__).parent.parent / "styles" / "tile_presets.json"
COLOR_KEYS = ("bg", "bg_on", "border", "border_on", "text", "text_on", "sub", "sub_on",
              "icon", "icon_on", "circle_bg", "circle_bg_on")  # fmt: skip
NUMBER_KEYS = ("bg_opa", "bg_opa_on", "border_width", "radius")
TEXT_SIZES = ("xs", "s", "m", "l", "xl")
ICON_SIZES = ("auto", "none", "s", "m", "l")
WEIGHTS = ("normal", "bold")


@lru_cache(maxsize=1)
def load_presets() -> dict[str, Any]:
    """Preset definitions (blocking file read, cached)."""
    data: dict[str, Any] = json.loads(PRESETS_FILE.read_text(encoding="utf-8"))
    return data


def _color(value: Any, colors: dict[str, str], role_defaults: dict[str, str]) -> str:
    text = str(value)
    if text.startswith("#"):
        return text.lower()
    return str(colors.get(text) or role_defaults.get(text) or colors.get("text", "#ffffff")).lower()


def resolve_tile_style(
    theme: dict[str, Any], style: dict[str, Any] | None, presets: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Concrete style of a widget: theme default preset < chosen preset < overrides."""
    data = presets or load_presets()
    style = style or {}
    default_name = str(theme.get("default_tile_style", "card"))
    name = str(style.get("preset") or default_name)
    base = data["presets"].get(name) or data["presets"]["card"]
    merged = {**base, **{k: v for k, v in style.items() if v is not None and v != ""}}
    colors = theme.get("colors", {})
    role_defaults = data.get("role_defaults", {})
    out: dict[str, Any] = {"preset": name if name in data["presets"] else "card"}
    for key in COLOR_KEYS:
        out[key] = _color(merged[key], colors, role_defaults)
    for key in NUMBER_KEYS:
        value = merged[key]
        if value == "theme":
            value = theme.get(key if key != "border_width" else "border_width", 0)
        out[key] = max(0, int(value))
    out["bg_opa"] = min(out["bg_opa"], 100)
    out["bg_opa_on"] = min(out["bg_opa_on"], 100)
    out["circle"] = bool(merged.get("circle", False))
    size = str(merged.get("text_size", "s"))
    out["text_size"] = size if size in TEXT_SIZES else "s"
    value_size = str(merged.get("value_size", "auto"))
    out["value_size"] = value_size if value_size in TEXT_SIZES else "auto"
    icon_size = str(merged.get("icon_size", "auto"))
    out["icon_size"] = icon_size if icon_size in ICON_SIZES else "auto"
    weight = str(merged.get("text_weight", "normal"))
    out["text_weight"] = weight if weight in WEIGHTS else "normal"
    return out


def layout_props(props: dict[str, Any], style: dict[str, Any]) -> dict[str, Any]:
    """Props the layout needs from the resolved style (icon circle and size, text size and weight)."""
    return {
        **props,
        "icon_circle": style["circle"],
        "text_size": style["text_size"],
        "value_size": style["value_size"],
        "icon_size": style["icon_size"],
        "text_weight": style["text_weight"],
    }
