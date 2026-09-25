"""Project images (backgrounds): validated with Pillow, stored under .storage, copied to ESPHome.

All functions are blocking and must run in the executor.
"""

from __future__ import annotations

import base64
import hashlib
import io
import re
import shutil
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps  # Pillow is a Home Assistant core dependency

MAX_UPLOAD_BYTES = 4 * 1024 * 1024
ASSET_ID_RE = re.compile(r"^[0-9a-f]{12}$")


def asset_dir(config_dir: str, project_id: str) -> Path:
    """Where the images of a project live (part of HA backups, not visible in the config folder)."""
    return Path(config_dir) / ".storage" / "cyd_studio_assets" / re.sub(r"[^A-Za-z0-9_-]", "_", project_id)


def store_image(config_dir: str, project_id: str, data_b64: str, width: int, height: int) -> str:
    """Decode, fit (cover + center crop) to width x height, save as PNG; returns the asset id."""
    raw = base64.b64decode(data_b64.split(",", 1)[-1], validate=False)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError("image too large")
    with Image.open(io.BytesIO(raw)) as source:
        rgb = ImageOps.exif_transpose(source).convert("RGB")
        fitted = ImageOps.fit(rgb, (width, height), method=Image.Resampling.LANCZOS)
    out = io.BytesIO()
    fitted.save(out, format="PNG", optimize=True)
    png = out.getvalue()
    asset_id = hashlib.sha256(png).hexdigest()[:12]
    target = asset_dir(config_dir, project_id)
    target.mkdir(parents=True, exist_ok=True)
    (target / f"{asset_id}.png").write_bytes(png)
    return asset_id


def read_image(config_dir: str, project_id: str, asset_id: str) -> str | None:
    """PNG as data URL (for the preview), or None."""
    if not ASSET_ID_RE.match(asset_id):
        return None
    path = asset_dir(config_dir, project_id) / f"{asset_id}.png"
    if not path.is_file():
        return None
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def used_assets(project: dict[str, Any]) -> list[str]:
    """Asset ids referenced by the project (project and page backgrounds), stable order."""
    ids: list[str] = []
    for bg in [project.get("background"), *(p.get("background") for p in project.get("pages", []))]:
        if isinstance(bg, dict) and isinstance(bg.get("image"), str) and bg["image"] not in ids:
            ids.append(bg["image"])
    return ids


def copy_assets(config_dir: str, source_id: str, target_id: str, asset_ids: list[str]) -> list[str]:
    """Copy images between projects (same ids); returns the ids missing at the source."""
    missing = []
    for asset_id in asset_ids:
        src = asset_dir(config_dir, source_id) / f"{asset_id}.png"
        if not ASSET_ID_RE.match(asset_id) or not src.is_file():
            missing.append(asset_id)
            continue
        target = asset_dir(config_dir, target_id)
        target.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target / f"{asset_id}.png")
    return missing


def store_embedded(config_dir: str, project_id: str, images: dict[str, str]) -> None:
    """Store images embedded in a project file (id -> PNG data URL) under their ids."""
    for asset_id, data_url in images.items():
        if not ASSET_ID_RE.match(asset_id) or not isinstance(data_url, str):
            continue
        raw = base64.b64decode(data_url.split(",", 1)[-1], validate=False)
        if len(raw) > MAX_UPLOAD_BYTES:
            continue
        try:
            with Image.open(io.BytesIO(raw)) as img:
                img.verify()  # a real image, not arbitrary bytes
        except (OSError, ValueError):
            continue
        target = asset_dir(config_dir, project_id)
        target.mkdir(parents=True, exist_ok=True)
        (target / f"{asset_id}.png").write_bytes(raw)


def copy_assets_to_esphome(config_dir: str, esphome_dir: str, project: dict[str, Any]) -> list[str]:
    """Copy the images a project uses to <esphome>/cyd_studio/<device_name>/; returns missing ids."""
    target = Path(esphome_dir) / "cyd_studio" / project["device_name"]
    missing = []
    for asset_id in used_assets(project):
        src = asset_dir(config_dir, project["id"]) / f"{asset_id}.png"
        if not src.is_file():
            missing.append(asset_id)
            continue
        target.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target / f"{asset_id}.png")
    return missing
