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
| `toggle_tile` | light, switch, input_boolean, fan, cover | `button`, `checked` bei an/offen, `disabled` bei nicht verfügbar; Tippen → `homeassistant.toggle` | Icon grün/grau, Zustandstext An/Aus/Offen/…/Nicht verfügbar |
| `sensor_value` | sensor, input_number, number | `obj` mit Wert (Nachkommastellen, Einheit); optional Tippen → Seite | `--` bei unbekannt/nicht verfügbar (NaN) |
| `binary_indicator` | binary_sensor u. a. | `obj`, Icon rot (Warnung) bzw. Akzent wenn an, grün wenn aus | eigene Texte für an/aus |
| `clock` | – | Uhrzeit (HH:mm, HH:mm:ss, h:mm a) + Datum (DE/EN), Zeit von HA | `--:--` bis zur Zeitsynchronisierung |
| `label` | – | freier Text, Größe, Ausrichtung, optional Kachelhintergrund | – |
| `scene_button` | scene, script, button, input_button, automation | `button`; Tippen → `homeassistant.action` mit `action` + `data` | – |
| `page_button` | – | `button`; Tippen → Seite (Animation) | – |
| `page_title` | – | Seitenname, auf Unterseiten mit Zurück-Pfeil | – |

Globale Elemente (im `top_layer`): Kopfzeile mit Seitentitel (+ Zurück-Pfeil auf Unterseiten),
Uhr, Text; Tab-Leiste mit Icon/Beschriftung je Hauptseite.

## Neues Widget hinzufügen

1. `widgets/<type>.json` anlegen.
2. In `layout.py` **und** `layout.ts` die Innenelemente in `widget_elements()` ergänzen,
   `python tools/gen_layout_cases.py` ausführen (Typ in `WIDGET_TYPES` aufnehmen).
3. Emitter schreiben und in `EMITTERS` registrieren.
4. Renderer-Fall in `renderWidget` ergänzen.
5. Golden-Projekt in `tests/golden/` ergänzen, `UPDATE_GOLDEN=1 pytest`, dann
   `tools/validate_esphome.sh` (muss „Configuration is valid!“ melden).
