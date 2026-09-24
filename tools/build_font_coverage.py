"""Write data/montserrat_coverage.json: the codepoints Montserrat (gfonts, weight 500) provides.

ESPHome rejects glyphs that the font file does not contain, so the generator
must know the coverage without downloading the font. Needs freetype-py (part
of an ESPHome install):  python tools/build_font_coverage.py <path/to/Montserrat.ttf>
The TTF is what ESPHome caches as .esphome/font/Montserrat@500@False@v1.ttf.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import freetype

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    face = freetype.Face(sys.argv[1])
    points = sorted(code for code, _ in face.get_chars())
    ranges: list[list[int]] = []
    for cp in points:
        if ranges and cp == ranges[-1][1] + 1:
            ranges[-1][1] = cp
        else:
            ranges.append([cp, cp])
    out = ROOT / "custom_components" / "cyd_studio" / "data" / "montserrat_coverage.json"
    out.write_text(json.dumps({"family": "Montserrat", "weight": 500, "ranges": ranges}) + "\n", encoding="utf-8")
    print(f"{len(points)} codepoints in {len(ranges)} ranges -> {out}")


if __name__ == "__main__":
    main()
