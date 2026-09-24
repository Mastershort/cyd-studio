"""Conditions (visible_if) and state rules (style_rules) of widgets.

Condition: {"entity": "sensor.x", "op": "eq|ne|on|off|gt|lt", "value": "25"}
- visible_if: list of conditions, all must hold, otherwise the widget is hidden
- style_rules: list of conditions with color overrides (bg, border, text, icon);
  the first matching rule wins, without a match the widget shows its normal colors
The preview mirrors this in frontend/src/logic.ts.
"""

from __future__ import annotations

from typing import Any

from .context import ON_STATES, Context, cpp_str
from .emit import Lambda
from .model import conditions_of, rules_of
from .theme import hex_color

RULE_COLOR_KEYS = ("bg", "border", "text", "icon")
ANY = "LV_PART_MAIN | LV_STATE_ANY"  # rule colors apply in every state (on, pressed, …)


def cpp_condition(ctx: Context, cond: dict[str, Any]) -> tuple[str, str]:
    """C++ expression for a condition and the id of the text source it reads."""
    src = ctx.source("text", cond["entity"])
    s = f"id({src.id}).state"
    op = cond["op"]
    if op in ("on", "off"):
        expr = "(" + " || ".join(f'{s} == "{st}"' for st in ON_STATES) + ")"
        return (expr if op == "on" else f"!{expr}"), src.id
    if op in ("gt", "lt"):
        number = float(cond["value"])
        cmp = ">" if op == "gt" else "<"
        return f"(!{s}.empty() && atof({s}.c_str()) {cmp} {number!r}f)", src.id
    value = cpp_str(str(cond.get("value", "")))
    return (f"({s} == {value})" if op == "eq" else f"({s} != {value})"), src.id


def collect_ids(tree: Any) -> set[str]:
    """All LVGL ids inside an emitted widget tree."""
    ids: set[str] = set()
    if isinstance(tree, dict):
        if isinstance(tree.get("id"), str):
            ids.add(tree["id"])
        for value in tree.values():
            ids |= collect_ids(value)
    elif isinstance(tree, list):
        for item in tree:
            ids |= collect_ids(item)
    return ids


def apply_logic(ctx: Context, wid: str, widget: dict[str, Any], emitted: list[dict[str, Any]]) -> None:
    """Attach visibility and style-rule updates to every source the conditions depend on."""
    if not emitted:
        return
    ids = collect_ids(emitted)
    conds = conditions_of(widget)
    if conds:
        parts = [cpp_condition(ctx, c) for c in conds]
        expr = " && ".join(p for p, _ in parts)
        code = (f"if ({expr}) lv_obj_remove_flag(id({wid}), LV_OBJ_FLAG_HIDDEN);\n"
                f"else lv_obj_add_flag(id({wid}), LV_OBJ_FLAG_HIDDEN);")  # fmt: skip
        for source_id in dict.fromkeys(sid for _, sid in parts):
            _source_by_id(ctx, source_id).actions.append({"lambda": Lambda(code)})

    rules = rules_of(widget)
    if not rules:
        return
    replay = ctx.state_replays.get(wid, "")
    suffixes = ("label", "state", "value", "title", "text", "temp")
    text_ids = [f"{wid}_{sfx}" for sfx in suffixes if f"{wid}_{sfx}" in ids]
    icon_id = f"{wid}_icon" if f"{wid}_icon" in ids else None
    lines = ["// state rules: the first matching rule wins"]
    if replay:
        lines.append(replay)
    branches = []
    for rule in rules:
        expr, _ = cpp_condition(ctx, rule)
        body = []
        if rule.get("bg"):
            body.append(f"lv_obj_set_style_bg_color(id({wid}), lv_color_hex({hex_color(rule['bg'])}), {ANY});")
        if rule.get("border"):
            color = hex_color(rule["border"])
            body.append(f"lv_obj_set_style_border_color(id({wid}), lv_color_hex({color}), {ANY});")
        if rule.get("text"):
            body += [f"lv_obj_set_style_text_color(id({t}), lv_color_hex({hex_color(rule['text'])}), LV_PART_MAIN);"
                     for t in text_ids]  # fmt: skip
        if rule.get("icon") and icon_id:
            body.append(
                f"lv_obj_set_style_text_color(id({icon_id}), lv_color_hex({hex_color(rule['icon'])}), LV_PART_MAIN);"
            )
        branches.append((expr, body))
    restore = [
        f"lv_obj_remove_local_style_prop(id({wid}), LV_STYLE_BG_COLOR, LV_PART_MAIN | LV_STATE_ANY);",
        f"lv_obj_remove_local_style_prop(id({wid}), LV_STYLE_BORDER_COLOR, LV_PART_MAIN | LV_STATE_ANY);",
    ]
    if not replay:  # static colors come from the label styles again
        restore += [f"lv_obj_remove_local_style_prop(id({t}), LV_STYLE_TEXT_COLOR, LV_PART_MAIN);"
                    for t in [*text_ids, *([icon_id] if icon_id else [])]]  # fmt: skip
    for i, (expr, body) in enumerate(branches):
        lines.append(("if" if i == 0 else "} else if") + f" ({expr}) {{")
        lines += [f"  {b}" for b in body]
    lines.append("} else {")
    lines += [f"  {r}" for r in restore]
    lines.append("}")
    code = "\n".join(lines)
    sources = {cpp_condition(ctx, r)[1] for r in rules}
    sources |= set(ctx.state_sources.get(wid, ()))
    for source_id in sorted(sources):
        _source_by_id(ctx, source_id).actions.append({"lambda": Lambda(code)})


def _source_by_id(ctx: Context, source_id: str) -> Any:
    for src in ctx.sources.values():
        if src.id == source_id:
            return src
    raise KeyError(source_id)
