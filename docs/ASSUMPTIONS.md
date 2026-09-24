# Annahmen & Abweichungen / Assumptions

Dieses Dokument hält fest, wo die Umsetzung von der Projektbeschreibung (`docs/cyd-studio-prompt.md`)
abweicht, was verifiziert wurde und welche Entscheidungen ohne Rückmeldung des Projekt-Owners
getroffen wurden. **Bitte vor Phase 2 durchsehen.**

## Zielversion ESPHome

- `ESPHOME_MIN_VERSION = 2026.9.0` (`generator/generate.py`, erscheint als `esphome: min_version`).
- Verifiziert mit **ESPHome 2026.9.0** (pip): alle Golden Files bestehen `esphome config`;
  `multipage`, `edge_cases`, `portrait_st7789_en` und `reference_buttons` wurden zusätzlich mit
  `esphome compile` gebaut (ESP-IDF 5.5.5, LVGL 9.5.0). Beispiel `multipage`: RAM 29,6 %, Flash 67,1 %.
- Syntax wurde direkt im ESPHome-Quellcode geprüft, nicht aus dem Gedächtnis:
  - Display `mipi_spi` mit `model: ILI9341` / `ST7789V` / `ILI9342`, `color_order`, `data_rate`,
    `cs_pin`/`dc_pin` mit `ignore_strapping_warning` (GPIO15/GPIO2 sind Strapping-Pins).
  - Rotation über `lvgl: rotation:` (LVGL dreht Display **und** Touch, seit 2026.4); kein
    `transform` am Display. Touch-`transform` nur als Rohachsen-Korrektur.
  - Seiten: `skip`, `on_load`, `page_wrap`, `lvgl.page.next/previous/show` mit `animation`/`time`.
  - Gesten: `on_swipe_left/right/up/down` auf Widgets und Seiten.
  - `on_idle` mit `timeout` (mehrere Einträge erlaubt), `top_layer`.
  - `disp_bg_color` ist in 2026.9 veraltet (Warnung „use bottom_layer“) → wird nicht verwendet;
    jede Seite hat eine deckende Hintergrundfarbe.
  - `homeassistant.action`: `data`-Werte **müssen Strings sein** (Zahlen werden abgelehnt) –
    der Generator wandelt sie um. Gefunden durch den Golden-Test `portrait_st7789_en`.
  - `font.glyphs`: ESPHome lehnt Glyphen ab, die die Schrift nicht enthält. Der Generator kennt
    die Abdeckung von Montserrat (`data/montserrat_coverage.json`, erzeugt mit
    `tools/build_font_coverage.py` aus der von ESPHome geladenen TTF) und lässt fehlende
    Zeichen mit Warnung weg. Gefunden durch den Golden-Test `edge_cases` („✓“).
- `ota: encryption:` ohne Wert übernimmt den API-Schlüssel (Hinweis aus ESPHome 2026.9, siehe
  Referenz-Repo).

## Hardware (ESP32-2432S028R)

- Basis: Referenz-Repo *akuehlewind/ESPHome-touch-display-mount* (`home-like.yaml`, auf 2026.9
  geprüft). Pins, Kalibrierung und Rotationen 1:1 übernommen, Quelle in `docs/BOARDS.md`.
- ILI9341: `color_order: BGR`, `data_rate: 10MHz` (wie Referenz; ESPHomes eingebautes
  CYD-Modell `ESP32-2432S028` nutzt 40 MHz – bewusst konservativ).
- **ST7789-Variante: nicht auf Hardware geprüft.** Werte aus ESPHomes eingebautem Modell
  `ESP32-2432S028-7789` (ST7789V, 40 MHz, `invert_colors: false`). `color_order` bleibt beim
  Standard des Treibers.
- **ILI9342-Variante** zusätzlich aufgenommen (im Referenz-Repo von Nutzern getestet):
  eigene Rotation, `swap_xy`-Touch-Transform und vertauschte Kalibrierung.
- **Hardware-Abnahme (Foto/Video in `docs/hardware-check/`) steht noch aus** – kann nur mit
  echtem Board erfolgen. Bis dahin gilt Phase 1 als „kompiliert, nicht geflasht“.

## Schriften & Icons

- Text: `gfonts://Montserrat@500` in den Größen der Theme-Stufen (12/14/16/20/28/40 px),
  nur tatsächlich genutzte Größen, `bpp: 4`. Glyphen: druckbares ASCII + `ÄÖÜäöüß°µ²³€–·`
  + alle zusätzlich in statischen Texten verwendeten Zeichen.
  *Abweichung:* Die in LVGL eingebauten `montserrat_*`-Schriften enthalten keine Umlaute,
  deshalb wird Montserrat über Google Fonts eingebunden (gleiche Schrift, Gewicht 500 wie LVGL).
- Icons: Material Design Icons **7.4.47**, als TTF direkt von GitHub (`raw.githubusercontent.com`,
  Tag gepinnt, wie im Referenz-Repo) – ESPHome lädt die Datei beim Kompilieren selbst,
  es müssen keine Dateien nach `/config/esphome/` kopiert werden. Nur verwendete Glyphen.
- Vorschau: dieselben Schriften (`@fontsource/montserrat` 500, `@mdi/font` 7.4.47) im Bundle.
- Zeilenhöhe: ESPHome setzt `line_height` = Freetype-Höhe (Montserrat: 1,219 × Größe,
  Ascender 0,968). Diese Werte stehen als Konstanten in `layout.py`/`layout.ts`.

## Layout

- Ein Layout-Algorithmus in `generator/layout.py`, 1:1 portiert nach `frontend/src/layout.ts`.
  Vertrag: `tests/layout_cases.json` (564 Fälle, aus Python erzeugt, von pytest **und** vitest
  geprüft).
- Auch die *inneren* Elemente jeder Kachel (Icon, Beschriftung, Wert, Zustand – mit LVGL-`align`
  und Offsets) kommen aus derselben Funktion `widget_elements()`; Generator und Vorschau
  rendern also dieselben Positionen. LVGL-`align` wird in der Vorschau nachgebildet
  (Inhaltsbox = Außenmaß − Padding − Rahmen, C-Ganzzahldivision).
- Kopfzeile und Tab-Leiste liegen im LVGL-`top_layer` und werden einmal (anhand der Startseite)
  angelegt. `page.show_header` wird deshalb in Phase 1 nicht im UI angeboten.

## ESPHome-Gerät & „Aktionen erlauben“ (ab 0.2.1)

- Geprüft im HA-Quellcode (`homeassistant/components/esphome`): Gerätename in
  `entry.data["device_name"]`, Freigabe in `entry.options["allow_service_calls"]`. Neue Geräte
  bekommen ausdrücklich `False`, ein fehlender Schlüssel gilt als `True`. Der Wert wird bei jeder
  Aktion gelesen – Setzen über `async_update_entry` wirkt sofort, ohne Neustart oder Neu-Flashen.
- Zuordnung Projekt → Gerät über den ESPHome-Gerätenamen (`device_name` im Projekt).
- Geprüft wird beim Start, bei jeder Änderung an ESPHome-Einträgen (`SIGNAL_CONFIG_ENTRY_CHANGED`)
  und nach dem Speichern/Löschen/Importieren von Projekten. Fehlt die Freigabe: behebbarer
  Reparaturhinweis (Einstellungen → Reparaturen) und Hinweis mit Knopf im Panel. Gesetzt wird die
  Option nur nach Bestätigung.

## Hintergrundbilder & „In ESPHome speichern“ (ab 0.4)

- ESPHome 2026.9: `image:` mit `file` (relativ zum ESPHome-Ordner), `type: RGB565`, `resize: BxH`;
  auf der LVGL-Seite `bg_image_src`. Geprüft mit `esphome config` und `compile` (Golden `styled`).
- Das Panel schneidet das Bild im Browser auf die Display-Auflösung zu (cover, mittig). Das Backend
  prüft es mit Pillow (Teil von HA) und speichert es als PNG unter
  `.storage/cyd_studio_assets/<projekt>/<hash>.png` (in HA-Backups enthalten). Die Asset-ID ist ein
  Inhalts-Hash, damit die Ausgabe deterministisch bleibt.
- Beim Export (Kopieren/Speichern) werden die Bilder nach `<esphome>/cyd_studio/<gerätename>/`
  kopiert. Ohne ESPHome-Ordner müssen sie von Hand dorthin – Hinweis im Export.
- Flash: ca. B×H×2 Bytes pro Bild (320×240 → 150 KB); ab 3 Bildern warnt der Generator.
- Mit Projekt-Hintergrundbild ist die Kopfzeile durchsichtig und die Tab-Leiste zu 80 % deckend.
- Speichern: Zieldatei `<esphome>/<gerätename>.yaml`. Fremde Datei (ohne CYD-Studio-Prüfsumme) oder
  von Hand geänderte Datei (Prüfsumme passt nicht) → Rückfrage, bei „geändert“ mit Diff; beim
  Überschreiben bleibt `…yaml.bak-<zeit>`. `secrets.yaml`: nur `wifi_ssid`/`wifi_password` werden
  ergänzt oder ersetzt, alles andere bleibt unverändert.
- Link „ESPHome öffnen“: `/hassio/ingress/5c53de3b_esphome` (offizielles Add-on). Bei anderen
  Installationen führt er ins Leere – dann ESPHome wie gewohnt öffnen.

## Gemeinsame Gerätelogik (ab 0.2)

- LVGL-Widget-IDs sind in ESPHome-Lambdas `lv_obj_t *` (nicht zusammengesetzte Widgets,
  `esphome/components/lvgl/widgets/__init__.py`). Die Zustandslogik steht daher einmal als
  `std::function` in `globals` (`cyd_tile_state`, `cyd_percent`) und nutzt die LVGL-C-API
  (`lv_obj_set_state`, `lv_obj_set_style_text_color`, `lv_label_set_text`). Mit ESPHome 2026.9 /
  LVGL 9.5 kompiliert (`reference_home_like`, `multipage`).
- `homeassistant.action`: `action` und `data` sind templatebar – der Regler schickt Entität und Wert
  aus `globals` (`cyd_ov_entity`, `cyd_ov_kind`).
- Slider-Trigger (`on_value`, `on_release`) liefern den Wert als `float x`.

## Entitäten im Gerät

- Schalter-/Status-Kacheln spiegeln die Entität als `text_sensor` (Plattform `homeassistant`),
  damit `on/off/open/closed/unavailable/unknown` unterschieden werden können.
  Messwerte als `sensor` (numerisch, mit Nachkommastellen) oder `text_sensor` (Text).
- Genau **eine** Quelle je (Art, Entität, Attribut); alle Widgets hängen ihre Updates an deren
  `on_value` an.
- Entitäts-IDs stehen als `substitutions` (`ent_…`) oben in der Datei.
- Umschalten per `homeassistant.action: homeassistant.toggle` (funktioniert für light, switch,
  input_boolean, fan, cover).

## Frontend / Home Assistant

- **Eigener Entitäts- und Icon-Picker** statt `ha-entity-picker`/`ha-icon-picker`: Die HA-Elemente
  werden vom HA-Frontend nur bei Bedarf (lazy) geladen und sind in einem Custom Panel nicht
  zuverlässig verfügbar. Der eigene Picker zeigt Name, Entitäts-ID, Bereich (über
  `hass.entities`/`hass.devices`/`hass.areas`) und aktuellen Zustand.
- Die MDI-Namensliste (`data/mdi_codepoints.json`, 13 659 Namen inkl. Aliase) wird als statische
  Datei ausgeliefert und von Generator und Vorschau gemeinsam genutzt.
- Live-Validierung im Editor ruft den Backend-Generator (entprellt) auf – eine einzige Quelle der
  Wahrheit statt einer zweiten Validierung in TypeScript.
- Autosave entprellt (800 ms); Versionsverlauf: höchstens ein Eintrag je 5 Minuten, 10 je Projekt
  (UI für den Verlauf: Phase 4, API existiert schon).
- Jedes Projekt bekommt beim ersten Speichern einen zufälligen ESPHome-API-Schlüssel
  (`settings.api_key`), der in die YAML geschrieben wird. Beim Datei-Export (`.cydstudio.json`)
  wird er entfernt.
- Fallback-Hotspot ohne Passwort (nur aktiv, wenn WLAN fehlt). So braucht `secrets.yaml` nur
  `wifi_ssid` und `wifi_password`.

## Offene Fragen aus Abschnitt 17 – vorläufige Entscheidungen

| # | Frage | Vorläufig umgesetzt |
|---|---|---|
| 1 | Name / Repo | „CYD Studio“, Domain `cyd_studio`, Repository `github.com/Mastershort/cyd-studio` (öffentlich) |
| 2 | Lizenz | MIT |
| 3 | Test-Hardware | unbekannt → Standard ILI9341; Varianten ST7789 und ILI9342 wählbar |
| 4 | URL Board & Gehäuse | Platzhalter `https://mastershort.de/cyd-studio/hardware?src=cyd-studio` (`const.py`) |
| 5 | Standard-Raster | 4×3 im Querformat |
| 6 | Standard-Navigation | Tab-Leiste unten **plus** Wischen |
| 7 | „Aktionen wirklich ausführen“ | angeboten, aber doppelt abgesichert: Option im Options-Flow (Standard aus) **und** Schalter ⚡ in der Vorschau |
| 8 | Gehäuse-Grafiken | Phase 3 – noch nichts umgesetzt |

## Umfang Phase 1 – was (noch) fehlt

- Hardware-Abnahme auf echtem Gerät (siehe oben).
- Die Home-Assistant-Tests (`tests/ha/`, pytest-homeassistant-custom-component) sind geschrieben,
  konnten lokal aber nicht laufen: unter Windows lässt sich die Abhängigkeit `lru-dict` ohne
  C-Compiler nicht bauen. Sie laufen in der Linux-CI (`tests.yml`) – **dort erstmals prüfen**.
- Playwright: `e2e/preview.spec.ts` (Snapshots aller Golden-Seiten, `dev/preview.html`) und
  `e2e/panel.spec.ts` (Panel mit simuliertem HA, `dev/mock-hass.ts`) laufen lokal grün.
  Die Snapshots entstanden unter Windows/Chromium; in der CI (Linux) können Schriftglättung
  abweichen → dort ggf. einmal mit `--update-snapshots` neu erzeugen.
- `esphome compile` ist lokal ausgeführt worden; in der CI läuft `esphome config` bei jedem Push,
  `compile` nächtlich (`.github/workflows/esphome.yml`).
- `hassfest`/HACS-Validierung laufen nur in der CI (GitHub Actions).
