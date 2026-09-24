# Widgets

Jedes Widget besteht aus drei Teilen:

1. **Definition** (Daten): `custom_components/cyd_studio/widgets/<type>.json` – Name (DE/EN),
   Icon, erlaubte Domains, Eigenschaften mit Typ/Standard, Standard-/Mindestgröße.
2. **Emitter** (Generator): `generator/widgets/*.py`, registriert in `generator/widgets/__init__.py`.
3. **Renderer** (Vorschau): `frontend/src/preview/renderer.ts` (`renderWidget`).

Emitter und Renderer holen die Positionen der Innenelemente aus `widget_elements()`
(`layout.py` / `layout.ts`).

## Phase 1

| Typ | Entität | Gerät | Zustände |
|---|---|---|---|
| `toggle_tile` | light, switch, input_boolean, fan, cover | `button`, `checked` bei an/offen, `disabled` bei nicht verfügbar; Tippen → `homeassistant.toggle`; **lange drücken → Regler** (Licht: Helligkeit – bei Lampen mit Farbtemperatur/Farbe laut `supported_color_modes` zusätzlich Regler für Farbtemperatur 2000–6500 K und Farbton, abschaltbar mit `color_controls`; Rollladen: Position, Lüfter: Stufe) | Icon grün/grau; Zustandstext An/Aus/…, bei Licht/Rollladen/Lüfter wahlweise der Wert in % |
| `sensor_value` | sensor, input_number, number | `obj` mit Wert (Nachkommastellen, Einheit); optional Tippen → Seite | `--` bei unbekannt/nicht verfügbar (NaN) |
| `binary_indicator` | binary_sensor u. a. | `obj`, Icon rot (Warnung) bzw. Akzent wenn an, grün wenn aus | eigene Texte für an/aus |
| `clock` | – | Uhrzeit (HH:mm, HH:mm:ss, h:mm a) + Datum (DE/EN), Zeit von HA | `--:--` bis zur Zeitsynchronisierung |
| `label` | – | freier Text, Größe, Ausrichtung, optional Kachelhintergrund | – |
| `scene_button` | scene, script, button, input_button, automation | `button`; Tippen → `homeassistant.action` mit `action` + `data` | – |
| `page_button` | – | `button`; Tippen → Seite (Animation) | – |
| `page_title` | – | Seitenname, auf Unterseiten mit Zurück-Pfeil | – |

## Phase 2 (ab 0.5)

| Typ | Entität | Gerät |
|---|---|---|
| `cover_control` | cover | ▲ ■ ▼ (`cover.open_cover` / `stop_cover` / `close_cover`), Position aus `current_position` |
| `climate` | climate | Soll aus `temperature`, − / + → `climate.set_temperature` (Schritt 0,5/1, Min/Max), Modus + Ist-Wert (`current_temperature`) |
| `slider` | light, cover, fan, media_player, input_number, number | LVGL-Slider, beim Loslassen `light.turn_on` (brightness_pct), `cover.set_cover_position`, `fan.set_percentage`, `media_player.volume_set`, `input_number/number.set_value` |
| `gauge` | sensor, input_number, number | LVGL-Arc 270° (Start 135°), Min/Max, Einheit, Nachkommastellen |
| `weather` | weather | Icon je Wetterlage, Temperatur, Beschreibung, optional Luftfeuchte (Texte/Icons: `data/state_texts.json`) |
| `multi_value` | sensor, input_number, number | bis zu 3 Werte nebeneinander (`entity`, `entity_2`, `entity_3`) |

| `number_stepper` | input_number, number, counter | − / Wert / + (`set_value` mit Schritt, Min/Max; Zähler: `increment`/`decrement`) |
| `select` | input_select, select | aktuelle Option mit ‹ › (`select_previous` / `select_next`) |
| `countdown` | timer, sensor (Zeitstempel), input_datetime | Restzeit jede Sekunde neu berechnet (`finishes_at`, `remaining`, `duration`), Fortschrittsbalken bei Timern |
| `person_presence` | person, device_tracker | zu Hause / unterwegs |
| `qr_code` | optional sensor, input_text, text | LVGL-QR-Code aus Text oder Entität (schwarz auf weiß) |
| `divider`, `spacer` | – | Linie bzw. leerer Platz (auf dem Gerät kein Objekt) |
| `button_grid` | – | 2–6 Tasten mit Icon/Text und eigener Aktion (leer = passend zum Ziel: Szene, Skript, Taste …) |
| `media_player` | media_player | Titel (`media_title`, sonst Beschriftung), Interpret (`media_artist`, sonst Zustand), ⏮ ⏯ ⏭ (`media_previous_track` / `media_play_pause` / `media_next_track`, das Icon wechselt bei Wiedergabe auf Pause), Lautstärke-Regler (`volume_set`) wenn Platz ist (ab 0.11) |

Zeitstempel wandelt die Hilfsfunktion `cyd_parse_time` (ISO 8601 inkl. Zeitzone, ohne Zone = Ortszeit)
in UTC-Sekunden um; `cyd_parse_duration` liest `H:MM:SS`.

| `notification_area` | – | letzte Meldung aus HA (Titel + Text) |

## Bedingungen & Zustandsregeln (ab 0.8)

Jedes Widget kann `visible_if` (alle Bedingungen müssen zutreffen, sonst ausgeblendet) und
`style_rules` (erste passende Regel färbt Hintergrund, Rahmen, Text, Icon) haben:

```json
{"entity": "sensor.temp", "op": "gt", "value": "25", "text": "#ef4444"}
```

`op`: `eq`/`ne` (Zustand gleich/ungleich), `on`/`off` (an/offen/zu Hause … bzw. alles andere), `gt`/`lt`
(Zahl über/unter; wie C `atof`). Fehlt `entity`, gilt die Entität des Widgets. Auf dem Gerät hängt der
Generator an jede beteiligte Quelle ein Lambda (`lv_obj_add/remove_flag(HIDDEN)` bzw.
`lv_obj_set_style_*` mit `LV_PART_MAIN | LV_STATE_ANY`); passt keine Regel, werden die lokalen Farben
entfernt und der normale An/Aus-Zustand neu gesetzt. Die Vorschau wertet dieselben Regeln aus
(`frontend/src/logic.ts`, Tests in `tests/logic.test.ts`).

## Vom Home Assistant ans Display (ab 0.7)

Wenn „Aus Home Assistant steuerbar“ aktiv ist (Standard), bekommt das Gerät `api: actions:`. In HA
heißen sie `esphome.<gerätename mit _>_<aktion>`:

| Aktion | Variablen | Wirkung |
|---|---|---|
| `show_page` | `page` (Seiten-ID oder Name) | Display wecken, Seite öffnen |
| `show_message` | `title`, `message`, `duration` (s, 0 = bis zum Antippen) | Meldung einblenden (Overlay), Meldungs-Widgets aktualisieren, Display wecken |
| `wake` / `dim` | – | Helligkeit Tag / gedimmt |
| `set_brightness` | `brightness` (1–100) | Hintergrundbeleuchtung |
| `set_led` | `red`, `green`, `blue` (0–255, alle 0 = aus) | RGB-LED (nur wenn aktiviert) |

`string`-Variablen sind in ESPHome 2026.9 `StringRef` (Vergleich mit `==` und `.str()`), `int`-Variablen
`int32_t` – deshalb die Casts in den Lambdas.

Kleine Tasten in Kacheln nutzen den Style `cyd_small_btn` (Farbe = Kreis-Hintergrund des Stils,
Icon = „Icon an“).

**Regler-Overlay** (ab 0.2): ein gemeinsames, verstecktes Overlay im `top_layer` (Layout aus
`overlay_layout()`), geöffnet vom Skript `cyd_overlay_open(entity, title, kind, value)`. Beim
Loslassen des Reglers sendet das Gerät `light.turn_on` (`brightness_pct`),
`cover.set_cover_position` (`position`) bzw. `fan.set_percentage` (`percentage`).
Nur Kacheln mit Regler oder Wertanzeige abonnieren das jeweilige Attribut (`brightness`,
`current_position`, `percentage`).

**Gemeinsame Gerätelogik:** Zustand, Farbe und Text aller Schalter- und Status-Kacheln setzt
eine einzige C++-Hilfsfunktion `cyd_tile_state` (in `globals`, als `std::function`), die jede
Kachel mit einer Zeile aufruft. Beschriftungen teilen sich LVGL-Styles (`cyd_text_N`).

Globale Elemente (im `top_layer`): Kopfzeile mit Seitentitel (+ Zurück-Pfeil auf Unterseiten),
Uhr, Text; Tab-Leiste mit Icon/Beschriftung je Hauptseite.

## Aktionen-Baukasten (ab 0.10)

Jedes Widget kann für `tap`, `long_press` und `double_tap` eigene Schritte bekommen:
`{"actions": [...]}`. Fehlt der Schlüssel (oder `null`), bleibt das eingebaute Verhalten
(z. B. Umschalten, Regler-Popup); eine leere Liste schaltet den Auslöser ab.

| Schritt | Wirkung auf dem Gerät |
|---|---|
| `{"type": "toggle", "entity": …}` | `homeassistant.toggle` (ohne Entität: die des Widgets) |
| `{"type": "service", "service": "light.turn_on", "target": …, "data": {…}}` | `homeassistant.action` (Daten als Text) |
| `{"type": "page", "page": "<id>"}`, `back`, `home` | Seitenwechsel (zurück = Eltern-Seite, sonst Startseite) |
| `{"type": "popup"}` | das eigene Popup des Widgets (Regler/Licht-Popup bei Schalter-Kacheln) |
| `{"type": "delay", "ms": 500}` | Pause (max. 60 s) |

LVGL-Ereignisse: Tippen `on_short_click`, lange drücken `on_long_press`, doppelt tippen
`on_double_click`. Ist Doppeltippen belegt, wird Tippen zu `on_single_click` – es wartet also kurz,
ob ein zweites Tippen folgt, und löst nicht doppelt aus. Ungültige Schritte (fehlende Entität,
falscher Dienst, gelöschte Seite) werden übersprungen und im Editor gewarnt. Die Vorschau führt die
Schritte ebenfalls aus (HA-Aktionen nur mit „Aktionen wirklich ausführen“).

## Aussehen (ab 0.3)

Jedes Widget hat ein optionales `style`-Objekt, das Projekt ein `tile_style`. Reihenfolge:
Theme-Standard (`default_tile_style`) < Projekt-Stil < Widget-Stil. Die Vorlagen liegen als Daten in
`styles/tile_presets.json` (Karte, Flach, Umriss, Glas, Kräftig); Farbwerte sind Theme-Rollen oder
`#rrggbb`.

| Schlüssel | Bedeutung |
|---|---|
| `preset` | Stil-Vorlage |
| `bg`, `bg_on`, `bg_opa`, `bg_opa_on` | Hintergrund aus/an und Deckkraft (0–100) |
| `border`, `border_on`, `border_width`, `radius` | Rahmenfarbe aus/an, Rahmenbreite, Ecken |
| `text`, `text_on`, `sub`, `sub_on` | Farbe von Name und Zustand/Beschriftung aus/an |
| `icon`, `icon_on` | Icon-Farbe aus/an |
| `circle`, `circle_bg`, `circle_bg_on` | Icon im runden Hintergrund und dessen Farben |
| `text_size` | `xs`, `s`, `m`, `l`, `xl` für den Namen (ab 0.10: auch `xs`/`xl`) |
| `value_size` | Sensor-Wert: `auto` oder `xs` … `xl` (ab 0.10) |
| `icon_size` | `auto`, `none` (Icon ausblenden), `s`, `m`, `l` (ab 0.10) |
| `text_weight` | `normal` oder `bold` – fett sind die Haupttexte (Farbrolle „text“), ab 0.10 |

`resolve_tile_style()` (Python) und `resolveTileStyle()` (TypeScript) liefern für alle Themes und
Beispiel-Überschreibungen identische Werte (`styles` in `tests/layout_cases.json`). Auf dem Gerät
schreibt der Generator nur die Abweichungen vom Projekt-Standard pro Widget; ändert sich die
Rahmenbreite, wird `pad_all` angepasst, damit die Inhaltsbox bei 6 px bleibt.

Themes: mastershort dark, Hell, Kontrast, OLED-Schwarz, Home (iOS-Stil, Standard „Kräftig“ mit Kreis-Icons).

## Neues Widget hinzufügen

1. `widgets/<type>.json` anlegen.
2. In `layout.py` **und** `layout.ts` die Innenelemente in `widget_elements()` ergänzen,
   `python tools/gen_layout_cases.py` ausführen (Typ in `WIDGET_TYPES` aufnehmen).
3. Emitter schreiben und in `EMITTERS` registrieren.
4. Renderer-Fall in `renderWidget` ergänzen.
5. Golden-Projekt in `tests/golden/` ergänzen, `UPDATE_GOLDEN=1 pytest`, dann
   `tools/validate_esphome.sh` (muss „Configuration is valid!“ melden).
