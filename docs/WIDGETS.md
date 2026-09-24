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
| `toggle_tile` | light, switch, input_boolean, fan, cover | `button`, `checked` bei an/offen, `disabled` bei nicht verfügbar; Tippen → `homeassistant.toggle`; **lange drücken → Regler** (Licht: Helligkeit, Rollladen: Position, Lüfter: Stufe) | Icon grün/grau; Zustandstext An/Aus/…, bei Licht/Rollladen/Lüfter wahlweise der Wert in % |
| `sensor_value` | sensor, input_number, number | `obj` mit Wert (Nachkommastellen, Einheit); optional Tippen → Seite | `--` bei unbekannt/nicht verfügbar (NaN) |
| `binary_indicator` | binary_sensor u. a. | `obj`, Icon rot (Warnung) bzw. Akzent wenn an, grün wenn aus | eigene Texte für an/aus |
| `clock` | – | Uhrzeit (HH:mm, HH:mm:ss, h:mm a) + Datum (DE/EN), Zeit von HA | `--:--` bis zur Zeitsynchronisierung |
| `label` | – | freier Text, Größe, Ausrichtung, optional Kachelhintergrund | – |
| `scene_button` | scene, script, button, input_button, automation | `button`; Tippen → `homeassistant.action` mit `action` + `data` | – |
| `page_button` | – | `button`; Tippen → Seite (Animation) | – |
| `page_title` | – | Seitenname, auf Unterseiten mit Zurück-Pfeil | – |

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
| `text_size` | `s`, `m`, `l` für den Namen |

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
