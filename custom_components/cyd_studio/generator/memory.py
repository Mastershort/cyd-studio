"""Rough memory estimate for the generated configuration."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

# Average RAM of one LVGL object including its styles (LVGL 9, 32 bit)
BYTES_PER_OBJECT = 180
BYTES_PER_PAGE = 600


@dataclass
class MemoryEstimate:
    """Estimated memory usage."""

    objects: int
    pages: int
    ram_bytes: int
    flash_fonts_bytes: int
    budget_bytes: int

    @property
    def ratio(self) -> float:
        """Share of the RAM budget in use."""
        return self.ram_bytes / self.budget_bytes if self.budget_bytes else 0.0

    def as_dict(self) -> dict[str, Any]:
        """Serialize."""
        return {**asdict(self), "ratio": round(self.ratio, 3)}


def estimate(objects: int, pages: int, flash_fonts: int, budget: int) -> MemoryEstimate:
    """Build an estimate."""
    ram = objects * BYTES_PER_OBJECT + pages * BYTES_PER_PAGE
    return MemoryEstimate(objects, pages, ram, flash_fonts, budget)
