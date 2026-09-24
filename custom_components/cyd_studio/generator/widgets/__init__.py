"""Widget emitters: one function per widget type, registered in EMITTERS."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from ..context import Context
from ..layout import Rect
from . import basic, buttons, controls, more, tiles

Emitter = Callable[[Context, dict[str, Any], dict[str, Any], Rect], list[dict[str, Any]]]

EMITTERS: dict[str, Emitter] = {
    "toggle_tile": tiles.toggle_tile,
    "sensor_value": tiles.sensor_value,
    "binary_indicator": tiles.binary_indicator,
    "clock": basic.clock,
    "label": basic.label,
    "page_title": basic.page_title,
    "scene_button": buttons.scene_button,
    "page_button": buttons.page_button,
    "cover_control": controls.cover_control,
    "climate": controls.climate,
    "slider": controls.slider,
    "gauge": controls.gauge,
    "weather": controls.weather,
    "multi_value": controls.multi_value,
    "number_stepper": more.number_stepper,
    "select": more.select,
    "countdown": more.countdown,
    "person_presence": more.person_presence,
    "qr_code": more.qr_code,
    "divider": more.divider,
    "spacer": more.spacer,
    "button_grid": more.button_grid,
}
