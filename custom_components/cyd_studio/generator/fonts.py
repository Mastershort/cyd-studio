"""Collect the fonts and glyphs a project needs (keeps flash usage small)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

MDI_VERSION = "7.4.47"
MDI_FONT_URL = (
    "https://raw.githubusercontent.com/Templarian/MaterialDesign-Webfont/"
    f"v{MDI_VERSION}/fonts/materialdesignicons-webfont.ttf"
)
TEXT_FONT = "gfonts://Montserrat@500"
BOLD_FONT = "gfonts://Montserrat@700"
CODEPOINTS_FILE = Path(__file__).parent.parent / "data" / "mdi_codepoints.json"
COVERAGE_FILE = Path(__file__).parent.parent / "data" / "montserrat_coverage.json"

# Characters every text font contains: printable ASCII plus common German/unit characters.
BASE_GLYPHS = "".join(chr(c) for c in range(0x20, 0x7F)) + "ÄÖÜäöüß°µ²³€–·"


@lru_cache(maxsize=1)
def mdi_codepoints() -> dict[str, int]:
    """Icon name (without ``mdi:``) -> codepoint."""
    data: dict[str, str] = json.loads(CODEPOINTS_FILE.read_text(encoding="utf-8"))
    return {name: int(cp, 16) for name, cp in data.items()}


@lru_cache(maxsize=1)
def text_coverage() -> frozenset[int]:
    """Codepoints available in the text font (ESPHome rejects glyphs the font lacks)."""
    data = json.loads(COVERAGE_FILE.read_text(encoding="utf-8"))
    return frozenset(cp for lo, hi in data["ranges"] for cp in range(lo, hi + 1))


def icon_char(icon: str | None) -> str | None:
    """'mdi:home' -> the glyph character, or None if unknown."""
    if not icon or not icon.startswith("mdi:"):
        return None
    cp = mdi_codepoints().get(icon[4:])
    return chr(cp) if cp is not None else None


class FontCollector:
    """Tracks font sizes and glyphs while the generator walks the project."""

    def __init__(self) -> None:
        self.text: dict[int, set[str]] = {}
        self.bold: set[int] = set()  # sizes that also need the bold font
        self.icons: dict[int, set[str]] = {}
        self.missing: set[str] = set()

    def text_font(self, size: int, text: str = "", bold: bool = False) -> str:
        """Register text of a given size; returns the font id.

        A bold font of a size carries every glyph registered for that size, so glyphs added
        for dynamic texts (values, states) are always present in both weights.
        """
        glyphs = self.text.setdefault(size, set())
        coverage = text_coverage()
        for ch in text:
            if ch in BASE_GLYPHS or not ch.isprintable():
                continue
            if ord(ch) in coverage:
                glyphs.add(ch)
            else:
                self.missing.add(ch)
        if bold:
            self.bold.add(size)
            return f"font_{size}_b"
        return f"font_{size}"

    def icon_font(self, size: int, icon: str) -> tuple[str, str] | None:
        """Register an icon glyph; returns (font id, glyph) or None if unknown."""
        char = icon_char(icon)
        if char is None:
            return None
        self.icons.setdefault(size, set()).add(char)
        return f"icons_{size}", char

    def emit(self) -> list[dict[str, object]]:
        """ESPHome ``font:`` entries, deterministic order."""
        fonts: list[dict[str, object]] = []
        for size in sorted(self.text):
            extra = "".join(sorted(self.text[size]))
            fonts.append(
                {
                    "file": TEXT_FONT,
                    "id": f"font_{size}",
                    "size": size,
                    "bpp": 4,
                    "glyphs": [BASE_GLYPHS + extra],
                }
            )
            if size in self.bold:
                fonts.append(
                    {
                        "file": BOLD_FONT,
                        "id": f"font_{size}_b",
                        "size": size,
                        "bpp": 4,
                        "glyphs": [BASE_GLYPHS + extra],
                    }
                )
        for size in sorted(self.icons):
            fonts.append(
                {
                    "file": MDI_FONT_URL,
                    "id": f"icons_{size}",
                    "size": size,
                    "bpp": 4,
                    "glyphs": ["".join(sorted(self.icons[size]))],
                }
            )
        return fonts

    def flash_estimate(self) -> int:
        """Rough flash size of all fonts in bytes."""
        total = 0
        for size, extra in self.text.items():
            count = len(BASE_GLYPHS) + len(extra)
            total += count * (size * size * 4 // 8 * 6 // 10 + 16) * (2 if size in self.bold else 1)
        for size, glyphs in self.icons.items():
            total += len(glyphs) * (size * size * 4 // 8 + 16)
        return total
