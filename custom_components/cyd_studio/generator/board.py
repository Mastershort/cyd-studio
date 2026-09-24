"""Board profiles (data in ``boards/*.yaml``)."""

from __future__ import annotations

import copy
from pathlib import Path
from typing import Any

import yaml

BOARDS_DIR = Path(__file__).parent.parent / "boards"


def _merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    out = copy.deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _merge(out[key], value)
        else:
            out[key] = copy.deepcopy(value)
    return out


def load_boards(directory: Path = BOARDS_DIR) -> dict[str, dict[str, Any]]:
    """Load all board profiles, keyed by id (blocking, run in executor)."""
    boards: dict[str, dict[str, Any]] = {}
    for path in sorted(directory.glob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        boards[data["id"]] = data
    return boards


def resolve_board(board: dict[str, Any], variant: str | None, orientation: str) -> dict[str, Any]:
    """Apply a variant and an orientation to a board profile.

    Returns the flattened profile with ``rotation``, ``touch.transform``,
    ``screen`` (logical size after rotation) resolved.
    """
    profile = {k: v for k, v in board.items() if k != "display"}
    profile["display"] = {k: v for k, v in board["display"].items() if k != "variants"}
    if variant:
        variants = {v["id"]: v for v in board["display"].get("variants", [])}
        if variant not in variants:
            raise ValueError(f"Unknown board variant: {variant}")
        override = {k: v for k, v in variants[variant].items() if k not in ("id", "label", "label_en")}
        profile = _merge(profile, override)
    if orientation not in profile["orientations"]:
        raise ValueError(f"Unsupported orientation: {orientation}")
    ori = profile["orientations"][orientation]
    rotation = int(ori["rotation"])
    if "touch_transform" in ori:
        profile["touch"] = _merge(profile["touch"], {"transform": ori["touch_transform"]})
    native = profile["native"]
    if rotation in (90, 270):
        screen = {"width": native["height"], "height": native["width"]}
    else:
        screen = {"width": native["width"], "height": native["height"]}
    profile["rotation"] = rotation
    profile["screen"] = screen
    return profile
