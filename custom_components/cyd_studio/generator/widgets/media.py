"""media_player: title, artist, previous / play-pause / next and an optional volume slider."""

from __future__ import annotations

from typing import Any

from ..context import Context, cpp_str
from ..emit import Lambda
from ..fonts import icon_char
from ..layout import Rect
from .common import box, elements, fallback_label, widget_id
from .controls import _action, _map_lambda, _small_button, state_texts

BUTTONS = {
    "prev": ("mdi:skip-previous", "media_player.media_previous_track"),
    "play": ("mdi:play", "media_player.media_play_pause"),
    "next": ("mdi:skip-next", "media_player.media_next_track"),
}


def media_player(ctx: Context, page: dict[str, Any], widget: dict[str, Any], rect: Rect) -> list[dict[str, Any]]:
    """Now playing with transport buttons; the play button shows pause while playing."""
    wid = widget_id(page, widget)
    props = widget.get("props", {})
    entity = widget["entity"]
    style = ctx.widget_style(widget)
    label = props.get("label") or fallback_label(entity)
    src = ctx.source("text", entity)
    texts = {k: v[ctx.lang] for k, v in state_texts()["media"].items()}
    empty = 'x.empty() || x == "unknown" || x == "unavailable"'
    children: list[Any] = []
    for el in elements(ctx, widget, rect, style=style):
        role = el["role"]
        if role == "title":
            ctx.fonts.text_font(el["size"], label, bool(el.get("bold")))
            children.append(ctx.element(el, f"{wid}_title", label, style))
            title = ctx.source("text", entity, "media_title")
            title.actions.append({"lvgl.label.update": {"id": f"{wid}_title", "text": Lambda(
                f"if ({empty}) return std::string({cpp_str(label)});\nreturn x;")}})  # fmt: skip
        elif role == "artist":
            ctx.fonts.text_font(el["size"], "".join(texts.values()))
            children.append(ctx.element(el, f"{wid}_artist", texts["unavailable"], style))
            artist = ctx.source("text", entity, "media_artist")
            # artist while something plays, otherwise the player state
            code = "\n".join([
                f"const std::string a = id({artist.id}).state;",
                'if (!a.empty() && a != "unknown" && a != "unavailable") return a;',
                f"const std::string st = id({src.id}).state;",
                _map_lambda("st", texts, texts["unavailable"]),
            ])  # fmt: skip
            update = {"lvgl.label.update": {"id": f"{wid}_artist", "text": Lambda(code)}}
            artist.actions.append(update)
            src.actions.append(update)
        elif role in BUTTONS:
            icon, action = BUTTONS[role]
            icon_id = f"{wid}_play_icon" if role == "play" else None
            children.append(_small_button(ctx, el, icon, style, [_action(action, entity, ctx)], icon_id))
            if role == "play" and children[-1] is not None and ctx.fonts.icon_font(el["size"], "mdi:pause"):
                play, pause = icon_char("mdi:play") or "", icon_char("mdi:pause") or ""
                src.actions.append({"lvgl.label.update": {"id": icon_id, "text": Lambda(
                    f'return std::string(x == "playing" ? {cpp_str(pause)} : {cpp_str(play)});')}})  # fmt: skip
        elif role == "volume":
            ctx.objects += 1
            vol = ctx.source("number", entity, "volume_level")
            conf: dict[str, Any] = {"id": f"{wid}_volume", "align": el["align"]}
            if el["y"]:
                conf["y"] = el["y"]
            conf.update({
                "width": el["width"], "height": el["height"], "min_value": 0, "max_value": 100, "value": 0,
                "bg_color": ctx.hex(style["circle_bg"]), "bg_opa": "COVER",
                "indicator": {"bg_color": ctx.hex(style["icon_on"]), "bg_opa": "COVER"},
                "knob": {"bg_color": ctx.hex(style["text"]), "bg_opa": "COVER", "pad_all": 3},
                "on_release": [_action("media_player.volume_set", entity, ctx, volume_level=Lambda(
                    'char buf[8];\nsnprintf(buf, sizeof(buf), "%.2f", x / 100.0f);\nreturn std::string(buf);'))],
            })  # fmt: skip
            children.append({"slider": conf})
            vol.actions.append({"lvgl.slider.update": {"id": f"{wid}_volume", "value": Lambda(
                "return std::isnan(x) ? 0.0f : x * 100.0f;")}})  # fmt: skip
    return [box(ctx, "obj", wid, rect, children, clickable=False, tile_style=style)]
