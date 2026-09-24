"""Write configurations into the ESPHome Device Builder directory (blocking – run in the executor).

Rules (docs/cyd-studio-prompt.md, section 9):
- a file that was not written by CYD Studio is only replaced after confirmation, with a backup
- a CYD Studio file that was edited by hand (checksum mismatch) shows a diff first, then backup
- secrets.yaml: only wifi_ssid / wifi_password are added or replaced, nothing else is touched
"""

from __future__ import annotations

import difflib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from .generator.generate import CHECKSUM_PREFIX, body_checksum, split_generated

SECRET_KEYS = ("wifi_ssid", "wifi_password")
MAX_DIFF_LINES = 400


def config_path(esphome_dir: str, device_name: str) -> Path:
    """Path of the device configuration."""
    return Path(esphome_dir) / f"{device_name}.yaml"


def inspect_existing(esphome_dir: str, device_name: str, new_yaml: str) -> dict[str, Any]:
    """State of the target file: none / ours / modified (with diff) / foreign."""
    path = config_path(esphome_dir, device_name)
    if not path.is_file():
        return {"state": "none", "path": str(path)}
    old = path.read_text(encoding="utf-8", errors="replace")
    if CHECKSUM_PREFIX not in old:
        return {"state": "foreign", "path": str(path)}
    body, checksum = split_generated(old)
    if checksum == body_checksum(body):
        return {"state": "ours", "path": str(path)}
    new_body, _ = split_generated(new_yaml)
    diff = list(
        difflib.unified_diff(
            new_body.splitlines(), body.splitlines(), "CYD Studio", "ESPHome (manuell geändert)", lineterm=""
        )
    )
    return {"state": "modified", "path": str(path), "diff": "\n".join(diff[:MAX_DIFF_LINES])}


def write_config(esphome_dir: str, device_name: str, yaml_text: str, backup: bool) -> str | None:
    """Write the configuration; optionally keep a timestamped backup. Returns the backup path."""
    path = config_path(esphome_dir, device_name)
    backup_path = None
    if backup and path.is_file():
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_path = path.with_name(f"{path.name}.bak-{stamp}")
        backup_path.write_bytes(path.read_bytes())
    path.write_text(yaml_text, encoding="utf-8", newline="\n")
    return str(backup_path) if backup_path else None


def missing_secrets(esphome_dir: str) -> list[str]:
    """Which of wifi_ssid / wifi_password are missing in secrets.yaml."""
    path = Path(esphome_dir) / "secrets.yaml"
    text = path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""
    return [key for key in SECRET_KEYS if not re.search(rf"^{key}\s*:", text, re.MULTILINE)]


def set_secrets(esphome_dir: str, values: dict[str, str]) -> None:
    """Add or replace only the given WiFi keys in secrets.yaml, keeping everything else as it is."""
    path = Path(esphome_dir) / "secrets.yaml"
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    lines = text.splitlines()
    for key in SECRET_KEYS:
        if key not in values:
            continue
        line = f"{key}: {json.dumps(values[key], ensure_ascii=False)}"
        for i, existing in enumerate(lines):
            if re.match(rf"^{key}\s*:", existing):
                lines[i] = line
                break
        else:
            lines.append(line)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
