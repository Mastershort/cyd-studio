# CYD Studio – Projektbeschreibung & Entwicklungs-Prompt

> Start-Prompt für die Entwicklung mit Claude Code in VS Code.
> Beschreibt vollständig, **was** die Integration können soll, **wie** Editor, Vorschau und Code-Generator zusammenspielen und **in welcher Reihenfolge** gebaut wird.
> Code, Bezeichner und Kommentare auf Englisch; Oberfläche zweisprachig (Deutsch zuerst, Englisch).

---

## 0. Anweisung an den Coding-Agenten

Du baust eine **Custom Integration für Home Assistant** (installierbar über HACS) mit dem Namen **CYD Studio** (Domain `cyd_studio`). Sie bringt einen **eigenen Menüpunkt (Panel) in Home Assistant** mit, in dem Nutzer ihr Touch-Display-Dashboard grafisch zusammenklicken, eine **pixelgenaue Vorschau** sehen und am Ende **fertigen ESPHome-Code** erhalten.

Arbeitsweise:
1. Lies dieses Dokument komplett, bevor du Code schreibst. Stelle Rückfragen bei Widersprüchen.
2. Arbeite **in den Phasen aus Abschnitt 15**. Jede Phase ist lauffähig, getestet und auf echter Hardware geprüft, bevor die nächste beginnt.
3. **Der erzeugte ESPHome-Code muss fehlerfrei kompilieren.** Das ist das wichtigste Qualitätsmerkmal des ganzen Projekts. Jede generierte Konfiguration wird in der CI mit dem offiziellen ESPHome-Docker-Image per `esphome config` (Phase 1) und `esphome compile` (ab Phase 2, für die Referenz-Layouts) geprüft.
4. **Erfinde keine ESPHome-Syntax.** Prüfe jede Komponente gegen die aktuelle ESPHome-Doku (Display: `mipi_spi`, UI: `lvgl`, Touch: `xpt2046`/`gt911`/`cst816`). ESPHome ändert sich monatlich – die Zielversion steht in `const.py` (`ESPHOME_MIN_VERSION`), Abweichungen in `docs/ASSUMPTIONS.md` dokumentieren.
5. Board-Definitionen, Widget-Definitionen und Themes sind **Daten (JSON/YAML), nicht Code** – neue Boards und Widgets sollen ohne Programmänderung hinzugefügt werden können.
6. Der Code-Generator ist **reines Python ohne HA-Abhängigkeit** und wird mit Golden-File-Tests abgesichert.
7. Aktuelle HA-Entwicklerstandards: async, keine blockierenden Aufrufe im Event-Loop (Dateizugriffe per `hass.async_add_executor_job`), Typisierung, `ruff`, `mypy`, Config Flow, Übersetzungen, Diagnostics.

---

## 1. Ziel & Nutzen

**Problem:** Das „Cheap Yellow Display“ (ESP32 mit 2,8″-Touchscreen, ~15–20 €) ist das ideale Wand-Panel für Home Assistant. Die Einrichtung scheitert aber für die meisten an der ESPHome-Konfiguration: Pins, Display-Treiber, Touch-Kalibrierung, LVGL-Layout, Schriften, Icons, Home-Assistant-Anbindung – hunderte Zeilen YAML, bei denen ein Einrückungsfehler alles kaputt macht.

**Lösung:** CYD Studio ist ein **visueller Designer direkt in Home Assistant**:
1. Board auswählen (z. B. „ESP32-2432S028R“).
2. Kacheln, Schalter, Anzeigen, Uhr usw. per Drag & Drop auf das Display ziehen – auf **beliebig vielen Seiten** mit Navigation (Wischen, Tab-Leiste, Menü, Unterseiten, Detail-Popups).
3. Jede Kachel mit einer Home-Assistant-Entität verbinden (Auswahl aus den echten Entitäten).
4. In der **Live-Vorschau** sehen, wie das Display später aussieht – mit echten, aktuellen Werten aus Home Assistant.
5. Auf „Code erzeugen“ klicken → fertige ESPHome-Konfiguration kopieren **oder** direkt in den ESPHome Device Builder speichern und dort installieren.

**Zielgruppe:** Home-Assistant-Nutzer ohne ESPHome-Erfahrung, die ein CYD gekauft haben (oft nach einem TikTok-Video oder Guide von mastershort.de).

**Nicht-Ziele:**
- Kein Ersatz für ESPHome selbst; das Kompilieren und Flashen übernimmt der ESPHome Device Builder.
- Kein allgemeiner LVGL-Editor für beliebige Hardware (Fokus: die gängigen Sunton/CYD-Boards).
- Keine Cloud, kein Konto, kein Tracking.

---

## 2. Gesamtarchitektur

```
Home Assistant
├─ custom_components/cyd_studio   (Python, Backend)
│  ├─ Config Flow (einmalig einrichten → Panel erscheint in der Seitenleiste)
│  ├─ WebSocket-API für das Panel (Projekte, Boards, Widgets, Code erzeugen, speichern)
│  ├─ Projekt-Speicher (Store)
│  ├─ Code-Generator (reines Python) → ESPHome-YAML
│  └─ ESPHome-Anbindung: YAML nach /config/esphome/ schreiben, ESPHome-Gerät erkennen
└─ Frontend-Panel (TypeScript + Lit, gebaut mit Vite)
   ├─ Editor (Leinwand mit Raster, Widget-Palette, Eigenschaften)
   ├─ Vorschau-Renderer (pixelgenau, native Auflösung, Live-Werte)
   └─ Export-Dialog (Code anzeigen/kopieren/herunterladen/speichern)
```

- **Panel:** Registrierung über `panel_custom` (`frontend.async_register_built_in_panel` bzw. `panel_custom.async_register_panel`), `embed_iframe: false`, `require_admin: true` (Option), Icon `mdi:tablet-dashboard`, Titel „CYD Studio“. Statische Dateien über `hass.http.async_register_static_paths` aus `custom_components/cyd_studio/frontend/dist/`.
- **Frontend-Zugriff auf HA:** Das Panel bekommt das `hass`-Objekt (Zustände, Entitäten-, Geräte- und Bereichs-Registry, Sprache, Theme). Für die Entitätsauswahl die HA-eigenen Elemente (`ha-entity-picker`, `ha-icon-picker`) nutzen, sofern zuverlässig ladbar – sonst eigener Picker mit Suche. (Ladeverhalten der HA-Elemente in `ASSUMPTIONS.md` festhalten.)
- **Build:** Das fertige JS-Bundle wird im Repository mit ausgeliefert (HACS lädt keinen Node-Build). CI prüft, dass `dist/` zum Quellcode passt.

---

## 3. Unterstützte Hardware (Board-Profile als Daten)

Datei je Board in `custom_components/cyd_studio/boards/<id>.yaml`. Jedes Profil enthält alles, was der Generator braucht:

```yaml
id: esp32-2432s028r
name: "ESP32-2432S028R (Cheap Yellow Display 2,8″)"
chip: esp32
board: esp32dev
framework: arduino          # oder esp-idf, je nach Stand der LVGL-Empfehlung
resolution: {width: 320, height: 240}   # Landscape
native: {width: 240, height: 320}       # Panel-Ausrichtung
display:
  platform: mipi_spi
  model: ILI9341
  spi: {clk: GPIO14, mosi: GPIO13}       # miso nur falls nötig
  cs: 15
  dc: 2
  invert_colors: false
  variants:                               # auswählbar im UI
    - {id: st7789, label: "Variante mit ST7789 (verzerrte Farben?)", model: ST7789V}
touch:
  platform: xpt2046
  spi: {clk: GPIO25, mosi: GPIO32, miso: GPIO39}
  cs: 33
  irq: 36
  calibration: {x_min: 280, x_max: 3860, y_min: 340, y_max: 3860}
  transform: {swap_xy: false, mirror_x: true, mirror_y: false}
backlight: {pin: GPIO21, pwm: true}
extras:
  ldr: {pin: GPIO34}          # Lichtsensor, Polarität je Revision unterschiedlich
  rgb_led: {r: GPIO4, g: GPIO16, b: GPIO17, inverted: true}
  sd: {cs: 5}
  speaker: {pin: GPIO26}
usb: ["micro-usb", "usb-c (neue Revision)"]
buy_links: []                  # optional, siehe Abschnitt 11
notes_de: "…"
```

**Phase 1:** ESP32-2432S028R (ILI9341, Variante ST7789).
**Phase 3:** ESP32-2432S028C (kapazitiv, CST820/GT911), ESP32-3248S035R/C (3,5″, ST7796), ESP32-S3 4,3″ (8048S043, RGB-Parallel-Display, GT911).
Pins und Treiber je Board **aus Datenblatt/Community verifizieren** und mit Quelle in `docs/BOARDS.md` dokumentieren. Kein Board wird freigegeben, bevor ein Referenz-Layout darauf erfolgreich geflasht und bedient wurde.

Ausrichtung im Projekt wählbar: **Querformat** (Standard, USB links/rechts) oder **Hochformat**, jeweils 0°/180°. Der Generator setzt Rotation und Touch-Transform passend.

---

## 4. Projekt-Datenmodell (das „Design“)

Ein Projekt ist ein JSON-Dokument, das vollständig beschreibt, was auf dem Display ist. Es ist die **einzige Quelle der Wahrheit**; Vorschau und Code-Generator lesen beide nur dieses Modell.

```jsonc
{
  "schema": 1,
  "id": "a7f3…",
  "name": "Wohnzimmer",
  "device_name": "cyd-wohnzimmer",          // ESPHome-Name, validiert: [a-z0-9-]
  "board": "esp32-2432s028r",
  "board_variant": null,
  "orientation": "landscape",               // landscape | portrait | landscape_flipped | portrait_flipped
  "grid": {"cols": 4, "rows": 3, "gap": 8, "padding": 8},
  "theme": "mastershort_dark",              // siehe Abschnitt 7
  "theme_overrides": {"accent": "#22d3ee"},
  "settings": {
    "brightness_day": 100, "brightness_night": 25,
    "night_mode": {"source": "ldr" /* | time | entity | off */, "threshold": 2.6, "invert": false,
                   "from": "22:00", "to": "06:30", "entity": null},
    "screensaver": {"enabled": true, "after_s": 60, "action": "dim" /* | off | clock */},
    "return_home_after_s": 30,
    "rgb_led": {"enabled": true, "show_status": true},
    "wifi": {"use_secrets": true, "ap_fallback": true},
    "language": "de"
  },
  "global": {                                // auf allen Seiten sichtbar (optional)
    "header": {"enabled": true, "height": 28, "widgets": [/* status_bar, clock, page_title */]},
    "footer": {"enabled": false, "height": 36, "widgets": []}
  },
  "pages": [
    {
      "id": "home", "name": "Start", "icon": "mdi:home",
      "parent": null,                        // Unterseite: id der Eltern-Seite (Zurück-Pfeil automatisch)
      "in_navigation": true,                 // in Tab-Leiste/Menü/Wischreihenfolge aufnehmen
      "background": null,                    // eigene Hintergrundfarbe/-bild je Seite
      "layout": "grid",                      // grid | free (pixelgenau, für Profis)
      "grid_override": null,                 // eigenes Raster je Seite
      "visible_if": null,                    // Bedingung, z. B. {"entity":"person.torsten","state":"home"}
      "auto_show": null,                     // Seite automatisch zeigen bei Ereignis, z. B. Klingel
      "timeout_s": null,                     // nach X s zurück zur Startseite (überschreibt global)
      "widgets": [
        {"id": "w1", "type": "clock", "x": 0, "y": 0, "w": 2, "h": 1, "props": {"format": "HH:mm", "show_date": true}},
        {"id": "w2", "type": "sensor_value", "x": 2, "y": 0, "w": 2, "h": 1,
         "entity": "sensor.wohnzimmer_temperatur", "props": {"label": "Wohnzimmer", "icon": "mdi:thermometer", "decimals": 1}},
        {"id": "w3", "type": "toggle_tile", "x": 0, "y": 1, "w": 2, "h": 1,
         "entity": "light.wohnzimmer", "props": {"label": "Licht", "icon": "mdi:lightbulb"}},
        {"id": "w4", "type": "slider", "x": 2, "y": 1, "w": 2, "h": 1,
         "entity": "light.wohnzimmer", "props": {"attribute": "brightness", "label": "Helligkeit"}},
        {"id": "w5", "type": "scene_button", "x": 0, "y": 2, "w": 4, "h": 1,
         "action": {"service": "script.turn_on", "target": "script.alles_aus"}, "props": {"label": "Alles aus", "icon": "mdi:power"}}
      ]
    }
  ],
  "navigation": {
    "style": "tabbar",                      // tabbar | swipe_and_dots | side_menu | buttons | none
    "tabbar_position": "bottom",            // bottom | top | left
    "show_labels": true, "show_icons": true,
    "swipe": true,                          // zusätzlich wischen zwischen Hauptseiten
    "wrap_around": false,
    "home_page": "home",
    "transition": "slide"                   // none | slide | fade (nur wenn ESPHome/LVGL unterstützt)
  },
  "popups": [                               // Overlays, von Widgets geöffnet (z. B. Detailsteuerung)
    {"id": "light_detail", "type": "entity_detail", "size": "large", "close_after_s": 15}
  ],
  "meta": {"created": "…", "updated": "…", "generator_version": "0.1.0"}
}
```

- **Jedes Widget** kann zusätzlich haben: `tap` / `long_press` / `double_tap`-Aktionen (Umschalten, Aktion ausführen, Seite öffnen, Popup öffnen, Zurück), `visible_if` (Bedingung), `style_rules` (Farbe/Icon/Text je Zustand oder Schwellwert, z. B. „rot wenn > 25 °C“), `badge` (kleiner Zusatzwert, z. B. Akku), `lock` (versehentliches Auslösen verhindern: erst tippen, dann bestätigen), `z` (Ebene).
- Positionen im **Raster** (Zellen), nicht in Pixeln – das macht Layouts robust über Board-Größen hinweg. Pixelwerte berechnet der Renderer/Generator aus Board-Auflösung, Raster, Abstand, Innenabstand.
- Validierung des Modells mit einem JSON-Schema (geteilt zwischen Frontend und Backend: `schema/project.schema.json`). Überlappungen, Rasterüberschreitungen, fehlende Entitäten werden im Editor als Warnung angezeigt und blockieren den Export, wenn sie zu ungültigem Code führen würden.
- **Round-Trip:** Der erzeugte YAML enthält am Ende einen Kommentarblock mit dem Projekt-JSON (`# cyd_studio_project: <base64 gzip>`). „Importieren“ liest diesen Block und stellt das Projekt wieder her (z. B. auf einer neuen HA-Installation).

---

## 5. Widget-Bibliothek

Widgets sind als Daten definiert (`widgets/<type>.json`: Name, Icon, erlaubte Entitäts-Domains, Eigenschaften mit Typ/Standard, Mindest-/Standardgröße) plus je ein Renderer im Frontend und ein Generator-Template im Backend.

**Phase 1 (Grundausstattung):**
| Typ | Beschreibung | Entitäten | Aktion bei Berührung |
|---|---|---|---|
| `toggle_tile` | Kachel mit Icon, Name, Zustand; eingefärbt wenn an | light, switch, input_boolean, fan, (cover) | toggle |
| `sensor_value` | Großer Wert + Einheit + Beschriftung + Icon | sensor, input_number | – (optional: Seite öffnen) |
| `binary_indicator` | Icon + Text, Farbe je Zustand (z. B. Fenster offen/zu) | binary_sensor | – |
| `clock` | Uhrzeit (Format wählbar), optional Datum/Wochentag | – (Zeit von HA) | – |
| `label` | Freier Text/Überschrift | – | – |
| `scene_button` | Schaltfläche, die eine Aktion ausführt | scene, script, button, automation, beliebige Aktion | Aktion |
| `page_button` | Wechselt zu einer anderen Seite | – | navigieren |

**Phase 2:**
| Typ | Beschreibung |
|---|---|
| `slider` | Helligkeit (light), Position (cover), Lautstärke (media_player), Wert (input_number/number) |
| `cover_control` | Auf / Stopp / Ab + Positionsanzeige |
| `climate` | Ist-/Soll-Temperatur, +/– , Modus |
| `gauge` | Bogen-Anzeige (z. B. PV-Leistung, Luftfeuchte) mit Min/Max/Farbbereichen |
| `weather` | Icon + Temperatur + Min/Max aus `weather.*` |
| `status_bar` | Kopfzeile: Uhrzeit, WLAN-Signal, HA-Verbindung |
| `multi_value` | 2–3 kleine Werte in einer Kachel (z. B. Temperatur/Feuchte/CO₂) |

**Phase 2b – Interaktion & Struktur (für mehrseitige Dashboards):**
| Typ | Beschreibung |
|---|---|
| `entity_detail` (Popup) | Detailsteuerung für die angetippte Entität, automatisch passend zum Typ: Licht (Helligkeit, Farbtemperatur, Farbe mit Tabs), Klima (Soll ±, Modi, Luftfeuchte), Rollladen (Position), Lüfter (Stufen), Mediaplayer (Lautstärke, Quelle). Öffnet per langem Druck oder Tippen. Vorbild: das Detail-Overlay im Layout „home-like“ des Referenz-Repos (Abschnitt 18). |
| `tabbar` / `side_menu` | Globale Navigation, automatisch aus den Seiten erzeugt, frei sortierbar, eigene Icons |
| `page_title` | Titel der aktuellen Seite, optional mit Zurück-Pfeil bei Unterseiten |
| `container` | Gruppiert Widgets mit gemeinsamem Rahmen/Hintergrund und Überschrift (z. B. „Erdgeschoss“) |
| `button_grid` | Mehrere kleine Schaltflächen in einem Widget (z. B. 6 Szenen), jede mit eigener Aktion |
| `select` | Auswahl für `input_select`/`select` (z. B. Heizmodus) als Liste oder Rolle |
| `number_stepper` | − / Wert / + für `input_number`, `number`, Klima-Soll |
| `notification_area` | Zeigt Meldungen, die per HA-Aktion an das Display geschickt werden (siehe 5.1) |
| `alarm_panel` | Scharf/Unscharf mit PIN-Tastatur für `alarm_control_panel` |
| `person_presence` | Personen mit Bild/Initialen, zu Hause/unterwegs |
| `countdown` | Restzeit aus Timer-/Zeitstempel-Entität (z. B. Waschmaschine, Spülmaschine) mit Fortschrittsbalken |
| `qr_code` | QR-Code (z. B. Gäste-WLAN) aus Text/Entität |
| `spacer` / `divider` | Gestaltung |

### 5.1 Vom Home Assistant ans Display
Der generierte Code stellt Aktionen am ESPHome-Gerät bereit (über `api: actions:`), damit Automationen das Display steuern können: `show_page` (Seite öffnen, z. B. Kamera-/Klingel-Seite), `show_message` (Titel, Text, Icon, Farbe, Dauer → Overlay oder `notification_area`), `wake` / `dim` / `set_brightness`, `set_led` (RGB-LED-Farbe/Blinken). Die Aktionen und Beispiel-Automationen werden im Export-Dialog angezeigt.

**Phase 4:** `media_control` (Titel, Play/Pause/Weiter), `energy_flow` (PV → Haus → Netz vereinfacht), `image_icon` (eigene Grafik), `chart_mini` (Sparkline der letzten Stunden – nur wenn technisch sinnvoll lösbar).

Für jedes Widget festlegen und testen: Darstellung bei Zuständen `on/off/unavailable/unknown`, Verhalten bei fehlender Entität, Mindestgröße, Textkürzung (Ellipse), Einheiten und Dezimalstellen.

---

## 6. Editor (Frontend)

**Aufbau (Desktop, 3 Spalten):**
1. **Links – Palette:** Widget-Typen mit Icon und Kurzbeschreibung; Seitenliste (hinzufügen, umbenennen, sortieren, löschen).
2. **Mitte – Leinwand:** Das Display in echter Proportion, vergrößert (100–300 %, Standard „passend“), Raster eingeblendet. Widgets per Drag & Drop platzieren, verschieben, an Ecken skalieren (rastet am Raster ein). Mehrfachauswahl, Kopieren/Einfügen, Rückgängig/Wiederholen (Strg+Z / Strg+Y), Entf-Taste.
3. **Rechts – Eigenschaften:** für das gewählte Widget: Entität (Picker mit Suche, gefiltert nach passenden Domains, zeigt Bereich und aktuellen Zustand), Beschriftung, Icon (MDI-Picker), Farben (aus Theme oder individuell), Aktion, widget-spezifische Einstellungen. Für nichts ausgewählt: Projekteinstellungen (Board, Ausrichtung, Raster, Theme, Nachtmodus, Bildschirmschoner).

**Seiten & Navigation (vollwertig, ab Phase 1):**
- Seitenleiste mit **Seitenbaum**: Hauptseiten und Unterseiten per Drag & Drop anordnen, verschachteln, duplizieren, als Vorlage speichern, ein-/ausblenden.
- **Navigations-Designer**: Stil wählen (Tab-Leiste unten/oben/links, Seitenmenü, Punkte + Wischen, eigene Buttons), Reihenfolge, Icons, Beschriftungen; Live-Vorschau der Navigation.
- **Globaler Kopf-/Fußbereich**: einmal gestalten (z. B. Uhr + WLAN + Seitentitel), gilt für alle Seiten; pro Seite abschaltbar.
- **Verknüpfungen sichtbar machen**: Übersicht „Seitenkarte“ zeigt als Diagramm, welche Buttons zu welchen Seiten/Popups führen; tote Verweise werden markiert.
- **Popups gestalten**: eigene Overlays (Detailsteuerung, Bestätigung, Info) im selben Editor, mit Hintergrund-Abdunklung und Schließen-Verhalten.
- **Bedingungen**: Widgets und Seiten nur anzeigen, wenn eine Bedingung erfüllt ist (Zustand, Uhrzeit, Anwesenheit) – im UI als verständlicher Regel-Baukasten („Zeige, wenn [Entität] [ist] [an]“).
- **Zustandsregeln**: Farbe, Icon, Text und Blinken abhängig vom Zustand/Schwellwert, mit Vorschau aller Zustände nebeneinander.
- **Aktionen-Baukasten**: für Tippen / lange drücken / doppelt tippen jeweils Aktion wählen (Umschalten, HA-Aktion mit Parametern aus dem HA-Aktionen-Katalog, Seite, Popup, Zurück); mehrere Aktionen nacheinander möglich.
- **Freies Layout** pro Seite zuschaltbar (pixelgenau statt Raster) für Fortgeschrittene, mit Hilfslinien, Ausrichten/Verteilen-Werkzeugen und Ebenen.
- **Stile wiederverwenden**: Kachel-Stile als Presets speichern und auf andere Widgets übertragen („Format übertragen“).

**Weitere Editor-Funktionen:**
- **Assistent „Neues Projekt“:** Board wählen (mit Foto und Kurzinfo) → Ausrichtung → Vorlage wählen (siehe 6.1) oder leer → Name.
- **Automatisch befüllen:** „Aus Bereich erstellen“ – Nutzer wählt einen HA-Bereich, CYD Studio legt passende Kacheln für dessen Lichter, Schalter, Temperatur, Fenster automatisch an.
- **Validierung live:** Hinweise unten („Kachel 3: Entität existiert nicht mehr“, „Seite 2 ist leer“, „Zu viele Widgets für den Speicher dieses Boards – Grenze ca. X“).
- **Mobile:** Panel auf dem Handy nutzbar (vereinfachte Ansicht: Leinwand oben, Eigenschaften als Bottom-Sheet). Hauptzielplattform bleibt Desktop.
- **Speichern:** automatisch (entprellt) im Backend; Versionsverlauf der letzten 10 Stände je Projekt, wiederherstellbar.
- **Projektübersicht:** Liste aller Projekte mit Miniatur-Vorschau, Board, letzter Änderung, Status („im ESPHome gespeichert“, „geändert seit letztem Export“), Duplizieren, Löschen, Export/Import als Datei (`.cydstudio.json`).

### 6.1 Vorlagen (Starter-Layouts)
Mitgeliefert, sofort anpassbar: **Raum-Panel** (Uhr, Temperatur, 2 Lichter, Szene), **Thermostat** (Klima groß + Fenster-Status), **Klima-Monitor** (Temperatur/Feuchte/CO₂ je Raum), **Eingangs-Panel** (Tür-/Fensterstatus, Alles-aus, Alarm), **Energie** (PV-Leistung, Hausverbrauch, Akku), **Nachttisch** (große Uhr, Wecker-Licht, gedimmt). Vorlagen enthalten Platzhalter-Entitäten, die der Assistent zuordnen lässt („Welche Lampe ist ‚Licht 1‘?“).

---

## 7. Vorschau („So sieht es auf dem Display aus“) – Kernfunktion

Die Vorschau muss dem echten Display **so nah wie möglich** kommen. Anforderungen:

1. **Native Auflösung:** Gerendert wird in exakt der Board-Auflösung (z. B. 320×240) auf ein `<canvas>`, dann ohne Glättung (`image-rendering: pixelated`) hochskaliert. Was auf dem Display abgeschnitten wäre, ist auch in der Vorschau abgeschnitten.
2. **Gleiche Schriften:** Die Vorschau verwendet dieselben Schriften und Größen wie der generierte Code (Montserrat in den LVGL-Standardgrößen, Material Design Icons als Schrift). Schriftdateien liegen im Frontend-Bundle.
3. **Gleiche Layout-Regeln:** Pixelpositionen werden im Frontend und im Generator **aus derselben Layout-Funktion** berechnet (gemeinsame Spezifikation + gemeinsame Testfälle: für jede Vorlage müssen Frontend- und Backend-Berechnung identische Rechtecke liefern).
4. **Live-Daten:** Standardmäßig zeigt die Vorschau die **aktuellen Zustände aus Home Assistant** (Temperatur, Licht an/aus). Umschalter „Beispieldaten“ für Screenshots, und pro Widget „Zustand simulieren“ (an/aus/nicht verfügbar).
5. **Interaktiv:** In der Vorschau kann man tippen, lange drücken und wischen: Seitenwechsel per Tab-Leiste/Wischen/Menü, Unterseiten mit Zurück, Popups öffnen und schließen, Bedingungen und Zustandsregeln greifen live, Schalter schalten optisch um (ohne echte Aktion; optionaler Schalter „Aktionen wirklich ausführen“ für Tests, standardmäßig aus).
6. **Zustände der Anzeige:** Umschalter für Tag/Nacht (Helligkeit simuliert per Abdunklung), Bildschirmschoner-Ansicht.
7. **Gerätehülle:** Optional das Board bzw. das 3D-gedruckte Gehäuse als Rahmen um die Vorschau (Grafik je Board: nackte Platine, Tischständer, Wandhalter, Unterputz) – macht Screenshots attraktiv und zeigt die Gehäuse-Varianten.
8. **Export als Bild:** „Vorschau als PNG speichern“ (in nativer Auflösung und als hübscher Screenshot mit Gerätehülle).
9. **Ehrlicher Hinweis** im UI: „Die Vorschau entspricht dem Display bis auf kleine Abweichungen bei Kantenglättung und Farben (Display-Panel).“

### 7.1 Themes
Themes sind Daten (`themes/<id>.json`): Hintergrund, Kachelfarbe, Rahmen, Textfarben, Akzent, Ein-/Aus-Farben, Eckenradius, Schriftgrößen-Stufen. Mitgeliefert: **mastershort dark** (Hintergrund #0a0e14, Kacheln #12171f, Akzent #22d3ee, Lime #a3e635), **Hell**, **Kontrast** (für schlechte Blickwinkel), **OLED-Schwarz**. Nutzer können Akzentfarbe und einzelne Farben überschreiben.

---

## 8. Code-Generator (Backend, reines Python)

Eingabe: validiertes Projekt + Board-Profil + Theme. Ausgabe: vollständige, lesbare ESPHome-YAML.

**Struktur der erzeugten Datei (mit erklärenden deutschen Kommentaren für Nutzer):**
1. Kopfkommentar: erzeugt von CYD Studio, Version, Datum, Hinweis „Änderungen bitte in CYD Studio vornehmen, sonst werden sie beim nächsten Export überschrieben“.
2. `substitutions` (Name, Friendly Name, Entitäts-IDs – so kann ein Profi später einzelne Werte ändern).
3. `esphome`, `esp32` (Board/Framework laut Profil), `logger`, `api`, `ota`, `wifi` (`!secret wifi_ssid/wifi_password`, Fallback-AP), `captive_portal`.
4. `time` (Plattform `homeassistant`).
5. `spi`-Busse, `display` (`mipi_spi`, `update_interval: never`, `auto_clear_enabled: false`), `touchscreen` (inkl. Kalibrierung/Transform aus Profil).
6. `output`/`light` für Hintergrundbeleuchtung (monochromatic, als Entität in HA verfügbar) und RGB-LED (falls aktiviert).
7. `sensor`/`binary_sensor`/`text_sensor` mit `platform: homeassistant` – **genau eine** Quelle je Entität/Attribut, auch wenn sie in mehreren Widgets vorkommt. Bei jedem Wert-Update `lvgl.*.update` der zugehörigen Widgets.
8. LDR-Sensor + Nachtmodus-Logik, Bildschirmschoner (`lvgl` `on_idle` bzw. Zeitsteuerung), Rückkehr zur Startseite.
9. `font`: nur die tatsächlich benötigten Schriftgrößen; **MDI-Icon-Schrift nur mit den verwendeten Glyphen** (Speicher!). Quelle der MDI-TTF-Datei festlegen (lokal mitliefern unter `/config/esphome/cyd_studio/fonts/` oder als Web-Quelle – verifizieren, was ESPHome aktuell unterstützt).
10. `lvgl`: `displays`, `touchscreens`, Rotation laut Ausrichtung, `theme` aus Projekt-Theme, `pages` mit allen Widgets (Pixelpositionen aus der gemeinsamen Layout-Funktion); globaler Kopf-/Fußbereich und Tab-Leiste über `top_layer` (auf allen Seiten sichtbar); Popups als ausgeblendete Objekte im `top_layer`, die per Aktion eingeblendet werden; Unterseiten mit Zurück-Logik (Seiten-Verlauf in `globals`); Bedingungen und Zustandsregeln als Update-Logik in den `on_value`-Handlern; Wisch-Gesten; Seiten-Timeout. Das Referenz-Layout „home-like“ (Abschnitt 18) zeigt bewährte Muster für Tap/Long-Press, Detail-Overlay mit dynamisch gefüllten Reglern (`globals` für die aktive Entität) und Dimmen bei Inaktivität – diese Muster übernehmen statt neu erfinden.
11. Geräte-Aktionen für HA (`api: actions:` – `show_page`, `show_message`, `wake`, `dim`, `set_brightness`, `set_led`), siehe 5.1.
12. Aktionen: `homeassistant.action` mit `action:` und `data:` (aktuelle Syntax), Toggle-Logik, Slider mit `on_release` (nicht bei jeder Bewegung senden).
13. Diagnose-Entitäten: WLAN-Signal, Laufzeit, Neustart-Button.
14. Abschluss-Kommentar mit Projekt-JSON für den Round-Trip.

**Anforderungen an den Generator:**
- **Deterministisch** (gleiches Projekt → byte-identische Ausgabe), stabile Reihenfolge, saubere Einrückung (2 Leerzeichen), keine typografischen Anführungszeichen, UTF-8.
- Escaping von Texten (Anführungszeichen, Doppelpunkte, Umlaute) korrekt; Entitäts-IDs validiert.
- Speicher-Schätzung (Schriften, Widgets, Seiten) und Warnung vor Überschreitung pro Board.
- **Golden-File-Tests:** jede Vorlage und eine Reihe Sonderfälle → erwartete YAML-Dateien im Repo; Änderungen am Generator zeigen sich als Diff.
- **CI-Validierung:** alle Golden Files mit `esphome config` (schnell, jede PR) und `esphome compile` (Referenz-Layouts, nächtlich/Release) im offiziellen ESPHome-Container. Rot = kein Release.
- Generator-Version in der Ausgabe; bei ESPHome-Syntaxänderungen neue Generator-Version statt stiller Änderungen.

---

## 9. Export & Installation

Im Export-Dialog drei Wege, nebeneinander erklärt:

1. **Code kopieren / herunterladen** – YAML mit Syntax-Hervorhebung, Button „Kopieren“, Download als `<device_name>.yaml`. Anleitung: „ESPHome öffnen → Gerät bearbeiten → alles ersetzen → Installieren“.
2. **In ESPHome speichern** (empfohlen, wenn der ESPHome Device Builder als Add-on läuft):
   - Schreibt die Datei nach `/config/esphome/<device_name>.yaml` (Verzeichnis prüfen; wenn nicht vorhanden → dieser Weg ausgegraut mit Erklärung).
   - Existiert die Datei und stammt **nicht** von CYD Studio → Warnung, Überschreiben nur nach Bestätigung, vorher Sicherung `<name>.yaml.bak-<datum>`.
   - Stammt sie von CYD Studio, aber wurde manuell geändert (Prüfsumme im Kopfkommentar weicht ab) → Warnung mit Diff-Ansicht.
   - Legt benötigte Hilfsdateien an (z. B. Icon-Schrift unter `/config/esphome/cyd_studio/`).
   - Prüft `/config/esphome/secrets.yaml` auf `wifi_ssid`/`wifi_password`; fehlen sie → Formular zum Eintragen (schreibt nur diese zwei Schlüssel, ändert sonst nichts).
   - Danach Button „ESPHome öffnen“ (Link auf das ESPHome-Panel) mit Kurzanleitung: „Beim ersten Mal per USB installieren (‚Plug into this computer‘), danach drahtlos.“
3. **Erstinstallation-Hilfe:** Schritt-für-Schritt-Karte inkl. Hinweis auf CH340-Treiber (Windows), Datenkabel, Browser Chrome/Edge.

**Nach der Installation:**
- CYD Studio erkennt das neue ESPHome-Gerät in HA (Config-Entry der ESPHome-Integration mit passendem Namen) und zeigt im Projekt „Verbunden ✓“.
- Prüft, ob in der ESPHome-Integration **„Dem Gerät erlauben, Home-Assistant-Aktionen auszuführen“** aktiv ist. Wenn nicht: deutlicher Hinweis + Reparatur-Eintrag (Issue Registry) mit Anleitung; Fix-Flow, der die Option nach Bestätigung setzt (sofern über die Options-API sauber möglich – sonst Anleitung).
- Bei Projektänderungen: Hinweis „Geändert seit letzter Installation – neu exportieren und in ESPHome installieren“.

(Optional, spätere Phase, nur wenn sauber möglich: Installation direkt aus CYD Studio über die Schnittstellen des ESPHome Device Builders. Kein Muss – der Weg über ESPHome ist robust und bekannt.)

---

## 10. Backend-API & Speicher

**WebSocket-Befehle** (`cyd_studio/…`, alle mit Admin-Prüfung je nach Option):
`boards/list`, `widgets/list`, `themes/list`, `templates/list`, `projects/list`, `projects/get`, `projects/save`, `projects/delete`, `projects/duplicate`, `projects/history`, `projects/restore`, `projects/import` (Datei oder YAML mit Round-Trip-Block), `generate/yaml` (liefert YAML + Warnungen + Speicherschätzung), `esphome/status` (Add-on/Verzeichnis vorhanden, Datei-Status, Gerät verbunden, Aktionen erlaubt), `esphome/save`, `esphome/secrets_check`, `esphome/secrets_set`, `areas/suggest` (Widgets aus Bereich).

**Speicher:** `homeassistant.helpers.storage.Store` (versioniert, Migrationen): Projekte, Versionsverlauf (10 je Projekt), Einstellungen. Projekt-Schema-Version im Modell; Migrationen auch im Frontend für importierte Dateien.

**Services** (für Automationen/Skripte, optional): `cyd_studio.export_project` (schreibt YAML nach ESPHome), `cyd_studio.list_projects` (SupportsResponse).

**Diagnostics:** Einstellungen, Projektliste (Namen, Boards, Anzahl Widgets), letzte Generator-Warnungen – keine WLAN-Daten.

---

## 11. Shop- und Affiliate-Bezug (dezent, transparent, abschaltbar)

Ziel ist Hilfe, keine Werbung. Umsetzung:
- Im **Board-Auswahldialog** je Board ein kleiner Link „Wo bekomme ich das Board?“ und „Passendes Gehäuse“ – führt auf eine **Übersichtsseite auf mastershort.de** (nicht direkt auf Affiliate-Links). URL-Basis konfigurierbar.
- In der **Gerätehülle der Vorschau** sind die Gehäusevarianten wählbar (Tisch, Wand, Unterputz) – mit Hinweis „3D-Druck-Datei/Gehäuse erhältlich“ als Link auf dieselbe Seite.
- **Options-Flow:** „Hinweise auf Hardware & Gehäuse anzeigen“ (Standard an), vollständig abschaltbar.
- README und Doku mit offener Kennzeichnung („Links führen zu mastershort.de, dort teils Affiliate-Links“).
- Keine Tracking-Parameter außer einem neutralen `?src=cyd-studio`.

---

## 12. Einrichtung (Config Flow & Optionen)

- **Config Flow:** Einzelinstanz (`single_config_entry`). Schritte: Willkommen/Erklärung → prüfen, ob ESPHome-Verzeichnis existiert (Info, kein Muss) → fertig. Danach erscheint „CYD Studio“ in der Seitenleiste.
- **Options Flow:** Panel nur für Admins (Standard ja) · Panel-Titel/Icon · Hardware-Hinweise an/aus · Speicherpfad ESPHome (Standard `/config/esphome`) · Standard-Theme · Vorschau „echte Aktionen“ erlauben (Standard nein).
- **Entfernen der Integration:** Panel verschwindet; Projekte bleiben im Store, bis der Nutzer sie im Dialog „auch Projekte löschen“ entfernt; ESPHome-Dateien werden **nie** automatisch gelöscht.

---

## 13. Projektstruktur

```
cyd-studio/
├─ custom_components/cyd_studio/
│  ├─ __init__.py              # Setup, Panel, WebSocket-API, Services
│  ├─ manifest.json            # domain, config_flow:true, dependencies:["frontend","http","websocket_api"],
│  │                           # after_dependencies:["esphome"], iot_class:"local_polling"? (→ "calculated"), integration_type:"service"
│  ├─ const.py                 # Versionen, Pfade, ESPHOME_MIN_VERSION
│  ├─ config_flow.py
│  ├─ websocket_api.py
│  ├─ store.py                 # Projekte, Verlauf, Migrationen
│  ├─ esphome_bridge.py        # Dateien schreiben/sichern, secrets, Geräteerkennung, Aktionen-Check
│  ├─ repairs.py               # Issues + Fix-Flows (Aktionen erlauben)
│  ├─ diagnostics.py
│  ├─ generator/               # reines Python
│  │  ├─ model.py              # dataclasses + Schema-Validierung
│  │  ├─ layout.py             # Raster → Pixel (gemeinsame Spezifikation mit Frontend)
│  │  ├─ board.py              # Board-Profile laden
│  │  ├─ theme.py
│  │  ├─ fonts.py              # benötigte Schriften/Glyphen ermitteln
│  │  ├─ widgets/              # je Widget ein Emitter
│  │  ├─ emit.py               # YAML-Ausgabe (deterministisch)
│  │  └─ memory.py             # Speicherschätzung
│  ├─ boards/*.yaml  widgets/*.json  themes/*.json  templates/*.json
│  ├─ schema/project.schema.json
│  ├─ frontend/dist/           # gebautes Panel (im Repo)
│  └─ translations/de.json en.json
├─ frontend/                   # Quellcode Panel (TypeScript, Lit, Vite)
│  ├─ src/panel.ts  editor/  preview/ (renderer.ts, fonts/, icons/)  export/  i18n/
│  ├─ src/layout.ts            # identische Layout-Regeln wie generator/layout.py
│  └─ tests/ (vitest)  e2e/ (playwright)
├─ tests/                      # pytest: generator (golden files), websocket, config flow, esphome_bridge
│  └─ golden/*.json → *.yaml
├─ tools/validate_esphome.sh   # esphome config/compile im Docker-Container
├─ docs/ ASSUMPTIONS.md BOARDS.md WIDGETS.md ARCHITECTURE.md
├─ hacs.json  README.md (DE+EN, GIFs der Bedienung)  LICENSE (MIT)
└─ .github/workflows/ validate.yml (hassfest, HACS), tests.yml (pytest, vitest, ruff, mypy), esphome.yml (config/compile)
```

---

## 14. Qualität & Tests

- **Generator:** Golden-File-Tests für alle Vorlagen, alle Widgets einzeln, beide Ausrichtungen, jedes Board; Sonderfälle (Umlaute, lange Namen, gleiche Entität mehrfach, leere Seite, maximale Widget-Zahl).
- **ESPHome-Validierung in CI** (siehe 8) – Pflicht.
- **Layout-Gleichheit:** geteilte Testfälle (`tests/layout_cases.json`), die Python- und TypeScript-Layout identisch bestehen müssen.
- **Vorschau-Snapshots:** Playwright rendert jede Vorlage und vergleicht mit Referenzbildern.
- **Hardware-Abnahme** je Phase: Referenz-Layouts auf echtem ESP32-2432S028R (beide Display-Varianten, falls verfügbar) flashen; Foto des Displays neben Vorschau-PNG ins Repo (`docs/hardware-check/`). Touch-Treffsicherheit an allen vier Ecken prüfen.
- Backend: pytest-homeassistant-custom-component für Config Flow, WebSocket-Befehle, Dateischreiben (mit temporärem Verzeichnis), Repairs.
- Linting: ruff, mypy (Python), eslint + tsc (Frontend).

---

## 15. Umsetzung in Phasen

**Phase 1 – Durchstich (MVP)**
- Projektgerüst, Panel in der Seitenleiste, Store, WebSocket-Grundbefehle.
- Board ESP32-2432S028R (ILI9341 + ST7789-Variante), Querformat.
- Widgets: `toggle_tile`, `sensor_value`, `binary_indicator`, `clock`, `label`, `scene_button`, `page_button`, `page_title`.
- **Mehrere Seiten von Anfang an:** Seitenbaum mit Unterseiten, Navigation (Tab-Leiste + Wischen), globaler Kopfbereich, Zurück-Logik, Seiten-Timeout.
- Editor: Raster, Drag & Drop, Eigenschaften mit Entitäts-Picker, Rückgängig.
- Vorschau: native Auflösung, Theme „mastershort dark“, Live-Werte.
- Generator + Golden Files + `esphome config` in CI.
- Export: kopieren/herunterladen. Hardware-Abnahme.

**Phase 2 – Alltagstauglich**
- Widgets `slider`, `cover_control`, `climate`, `gauge`, `weather`, `status_bar`, `multi_value`.
- **Interaktion:** lange drücken/doppelt tippen, Detail-Popups (`entity_detail`), Aktionen-Baukasten, Bedingungen, Zustandsregeln, weitere Navigationsstile (Seitenmenü, Punkte), Seitenkarte.
- Geräte-Aktionen für HA (`show_page`, `show_message`, …) inkl. Beispiel-Automationen.
- Widgets aus „Phase 2b“ (container, button_grid, select, number_stepper, notification_area, countdown, person_presence, alarm_panel, qr_code).
- Nachtmodus (LDR/Zeit/Entität), Bildschirmschoner, Rückkehr zur Startseite, RGB-LED-Status.
- „In ESPHome speichern“ inkl. secrets-Prüfung, Sicherung, Prüfsumme.
- Geräteerkennung + „Aktionen erlauben“-Check mit Reparatur.
- Hochformat, weitere Themes, Vorlagen, „Aus Bereich erstellen“.
- `esphome compile` in CI für Referenz-Layouts.

**Phase 3 – Mehr Hardware**
- Boards: 2432S028C (kapazitiv), 3248S035R/C, ESP32-S3 4,3″. Board-spezifische Speicherschätzung.
- Gerätehülle (Platine, Tisch, Wand, Unterputz) in der Vorschau, PNG-Export.

**Phase 4 – Komfort**
- Round-Trip-Import, Versionsverlauf-UI, Projekt-Export/Import als Datei.
- `media_control`, `energy_flow`, `image_icon`; eigene Icons/Bilder.
- Mobile Bedienung verfeinern.

**Phase 5 – Veröffentlichung**
- Brand-Assets (Icon/Logo) für `home-assistant/brands`, HACS-Standardliste, Release-Workflow mit Changelog, Doku-Seite + Video-Anleitung.

**Definition of Done je Phase:** Tests grün (pytest, vitest, Playwright), hassfest/HACS grün, **alle Golden Files von ESPHome akzeptiert**, Hardware-Abnahme dokumentiert, README aktualisiert.

---

## 16. Texte & Bedienphilosophie

- Für Einsteiger geschrieben: keine Begriffe wie „GPIO“, „SPI“, „LVGL“ im normalen UI (nur im Experten-Bereich „Code ansehen“).
- Jeder Schritt sagt, was als Nächstes kommt („Fertig gestaltet? → Code erzeugen“).
- Fehler immer mit Lösung („Die Entität light.kueche gibt es nicht mehr – andere wählen oder Kachel entfernen“).
- Deutsch zuerst, Englisch vollständig.

---

## 17. Offene Fragen an den Projekt-Owner (vor Phase 1 klären)

1. Endgültiger Name: „CYD Studio“ oder anders? Repository-Name und GitHub-Account.
2. Lizenz (Vorschlag: MIT).
3. Welche Board-Revisionen liegen zum Testen vor (Micro-USB / USB-C, ILI9341 / ST7789)?
4. URL der Übersichtsseite „Board & Gehäuse“ auf mastershort.de.
5. Standard-Raster: 4×3 im Querformat ok? (Alternative 3×3 mit größeren Kacheln.)
6. Standard-Navigation: Tab-Leiste unten (Vorschlag) oder Wischen mit Punkten?
7. Soll „Aktionen wirklich ausführen“ in der Vorschau überhaupt angeboten werden?
8. Gehäuse-Grafiken für die Gerätehülle: vorhanden (Renderings/Fotos) oder sollen einfache Vektorzeichnungen erstellt werden?

---

## 18. Referenz: bewährte ESPHome-Konfigurationen (GitHub)

**Referenz-Repository:** https://github.com/akuehlewind/ESPHome-touch-display-mount (MIT-Lizenz, © 2023 Adrian Kuehlewind)

Dieses Repository gehört zum CC0-Gehäuse „Home Assistant Desk Mount – Cheap Yellow Display“ und enthält zwei geprüfte, vollständige ESPHome-Konfigurationen für das ESP32-2432S028R:

| Datei | Umfang | Was wir daraus lernen |
|---|---|---|
| `esphome/buttons/cyd-2432s028/buttons.yaml` | ~600 Zeilen | Schlankes Button-Layout: Hardware-Grundkonfiguration (SPI-Busse, Display, Touch-Kalibrierung, Backlight), einfache Tap-Aktionen, Zustand aus HA |
| `esphome/home-like/cyd-2432s028/home-like.yaml` | ~4.300 Zeilen | Kachel-Layout im Stil des HA-Dashboards: 6 frei konfigurierbare Kacheln über `substitutions` (Entität, Titel, Icon, Tap-Aktion + Parameter), **Long-Press öffnet Detail-Overlay** mit dynamisch gefüllten Reglern (Helligkeit, Farbe/Farbtemperatur in Tabs, Klima mit Soll/Modi/Feuchte), `globals` für die „aktive Entität“, Dimmen nach Inaktivität, Orientierungs-Presets |

**Verwendung durch den Coding-Agenten:**
1. Repository zu Beginn klonen (`git clone` nach `reference/` – **nicht** ins Paket einbauen, in `.gitignore`) und beide Dateien vollständig lesen.
2. **Hardware-Teil** (Pins, SPI, Display, Touch-Transform, Backlight) als Grundlage des Board-Profils ESP32-2432S028R übernehmen – aber gegen die **aktuelle** ESPHome-Syntax prüfen (seit ESPHome 2026.4 `mipi_spi` statt `ili9xxx`; Abweichungen in `ASSUMPTIONS.md`).
3. **Interaktions-Muster** aus „home-like“ (Tap/Long-Press, Detail-Overlay, `globals` für die aktive Entität, Inaktivitäts-Dimmen, Klima-/Licht-Detailsteuerung) als Vorbild für den Generator nutzen – **generisch** umsetzen: CYD Studio erzeugt beliebig viele Kacheln auf beliebig vielen Seiten statt fester 6 Kacheln per Substitution.
4. **Funktionsumfang als Messlatte:** Alles, was „home-like“ kann, muss mit CYD Studio per Klick erreichbar sein – und darüber hinaus Mehrseitigkeit, Unterseiten, Navigation, Bedingungen, Zustandsregeln, weitere Widgets.
5. **Referenz-Tests:** Zwei Golden-Projekte in `tests/golden/` nachbauen – `reference_buttons` (entspricht funktional `buttons.yaml`) und `reference_home_like` (entspricht funktional `home-like.yaml`). Beide müssen von ESPHome kompiliert werden und auf der Hardware dasselbe Verhalten zeigen (Abnahme mit Foto/Video in `docs/hardware-check/`).
6. **Lizenz beachten:** Werden Code-Teile wörtlich übernommen, Copyright-Hinweis von Adrian Kuehlewind in `NOTICE` bzw. im Kopf der erzeugten YAML aufnehmen (MIT verlangt Namensnennung). Im README auf das Repository und das Gehäuse verlinken.

Zusätzlich dient die auf ESPHome 2026.6 geprüfte Konfiguration aus dem mastershort-Guide „Wand-Dashboard für 20 €“ als Kontrolle für die aktuelle Display-/Touch-Syntax.
