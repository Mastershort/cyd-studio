"""Action builder: what tap, long press and double tap do on a widget.

A trigger is ``widget[trigger] = {"actions": [step, ...]}``; missing/null keeps the widget's
built-in behavior, an empty list disables it. Steps:

- ``{"type": "toggle", "entity": "light.x"}``            (entity empty = the widget's entity)
- ``{"type": "service", "service": "light.turn_on", "target": "light.x", "data": {...}}``
- ``{"type": "page", "page": "<page id>"}`` / ``{"type": "back"}`` / ``{"type": "home"}``
- ``{"type": "popup"}``   the widget's own popup (long press slider / light popup of toggle tiles)
- ``{"type": "delay", "ms": 500}``

The preview mirrors this in frontend/src/actions.ts.
"""

from __future__ import annotations

from typing import Any

from .context import Context
from .model import TRIGGERS, step_problem, trigger_steps
from .widgets.common import ha_action, page_show

# LVGL events; with a double tap the tap waits for "single click" so it does not fire twice
EVENTS = {"tap": "on_short_click", "long_press": "on_long_press", "double_tap": "on_double_click"}
MAX_DELAY_MS = 60000


def compile_steps(ctx: Context, page: dict[str, Any], widget: dict[str, Any], steps: list[dict[str, Any]],
                  popup: list[Any] | None) -> list[Any]:  # fmt: skip
    """ESPHome actions for a step list (invalid steps are skipped, the model warns about them)."""
    project = ctx.project
    home = project["navigation"]["home_page"]
    out: list[Any] = []
    for step in steps:
        if step_problem(project, widget, step):
            continue
        kind = step["type"]
        if kind == "toggle":
            out.append(ha_action(ctx, "homeassistant.toggle", step.get("entity") or widget["entity"], None))
        elif kind == "service":
            out.append(ha_action(ctx, step["service"], step.get("target"), step.get("data")))
        elif kind == "page":
            out.append(page_show(ctx, step["page"], "MOVE_LEFT"))
        elif kind == "back":
            out.append(page_show(ctx, page.get("parent") or home, "MOVE_RIGHT"))
        elif kind == "home":
            out.append(page_show(ctx, home, "MOVE_RIGHT"))
        elif kind == "popup" and popup:
            out.extend(popup)
        elif kind == "delay":
            ms = max(0, min(int(step.get("ms") or 0), MAX_DELAY_MS))
            if ms:
                out.append({"delay": f"{ms}ms"})
    return out


def apply_actions(ctx: Context, page: dict[str, Any], widget: dict[str, Any], emitted: list[dict[str, Any]]) -> None:
    """Replace the built-in events of the widget's outer object with the configured steps."""
    if not emitted:
        return
    configured = {t: trigger_steps(widget, t) for t in TRIGGERS}
    if all(v is None for v in configured.values()):
        return
    conf = next(iter(emitted[0].values()))
    popup = conf.get("on_long_press")
    for trigger, steps in configured.items():
        if steps is None:
            continue
        event = EVENTS[trigger]
        actions = compile_steps(ctx, page, widget, steps, popup)
        if actions:
            conf[event] = actions
        else:
            conf.pop(event, None)
    if configured["double_tap"] and "on_short_click" in conf:
        conf["on_single_click"] = conf.pop("on_short_click")
    if any(k in conf for k in ("on_short_click", "on_single_click", "on_long_press", "on_double_click")):
        conf.pop("clickable", None)  # clickable is the LVGL default
    # keep the key order stable: events before the children
    if "widgets" in conf:
        conf["widgets"] = conf.pop("widgets")
