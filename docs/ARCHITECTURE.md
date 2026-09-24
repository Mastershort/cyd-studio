# Architektur

```
Home Assistant
├─ custom_components/cyd_studio          Python-Backend
│  ├─ __init__.py        Setup: Store, statische Dateien, Panel, Services
│  ├─ config_flow.py     Einrichtung (Einzelinstanz) + Optionen
│  ├─ websocket_api.py   cyd_studio/* Befehle für das Panel
│  ├─ store.py           Projekte, Verlauf, Export-Status (helpers.storage.Store)
│  ├─ data.py            lädt boards/, widgets/, themes/, templates/, schema/
│  ├─ diagnostics.py
│  ├─ generator/         reines Python, keine HA-Abhängigkeit
│  │  ├─ model.py        Defaults + semantische Validierung (Issues DE/EN)
│  │  ├─ layout.py       Raster → Pixel, Kachel-Innenelemente   ⇄ frontend/src/layout.ts
│  │  ├─ board.py        Profile + Varianten + Ausrichtung auflösen
│  │  ├─ theme.py        Themes + Farb-Overrides
│  │  ├─ fonts.py        benötigte Schriftgrößen/Glyphen, Montserrat-Abdeckung
│  │  ├─ context.py      Zustand eines Generatorlaufs (Quellen, Schriften, IDs)
│  │  ├─ widgets/        je Widget-Typ ein Emitter
│  │  ├─ emit.py         deterministischer YAML-Emitter (!secret, !lambda, Kommentare)
│  │  ├─ memory.py       Speicherschätzung
│  │  └─ generate.py     Gesamtdatei, Prüfsumme, Round-Trip-Block
│  └─ frontend/dist/     gebautes Panel (im Repo, weil HACS nicht baut)
└─ frontend/src          TypeScript + Lit, Vite
   ├─ panel.ts           <cyd-studio-panel> (Routing Liste / Assistent / Editor)
   ├─ views/             Projektliste, Assistent „Neues Projekt“
   ├─ editor/            Editor (Palette, Seitenbaum, Eigenschaften, Undo), Picker
   ├─ preview/           Canvas-Renderer, <cyd-screen>, Schriften, Icons
   ├─ export/            Export-Dialog
   ├─ layout.ts          identisch zu generator/layout.py
   └─ model.ts           Defaults, Varianten, Hilfsfunktionen
```

## Datenfluss

1. Das Panel lädt Boards, Widgets, Themes, Vorlagen über WebSocket.
2. Der Editor hält **ein Projekt-JSON** (einzige Quelle der Wahrheit). Jede Änderung →
   Undo-Snapshot → entprelltes `projects/save` → entprelltes `generate/yaml` (liefert Issues).
3. Die Vorschau rendert das Projekt mit `layout.ts` und denselben Schriften auf ein Canvas in
   nativer Auflösung und skaliert es mit `image-rendering: pixelated`.
4. „Code erzeugen“ ruft `generate/yaml` mit `mark_exported: true` auf.

## Layout-Spezifikation

- Bildschirm = native Auflösung, bei Rotation 90/270 vertauscht.
- Kopfzeile oben (`global.header.height`), Tab-Leiste unten/oben (40 px mit, 32 px ohne
  Beschriftung) oder links (48 px breit). Rest = Inhaltsbereich.
- Raster: Innenbereich = Inhaltsbereich − 2 × `padding`. Zelle *i* von *n* bei Länge *L*,
  Abstand *g*: Start = ⌊i·(L+g)/n⌋, Ende = ⌊(i+1)·(L+g)/n⌋ − g. Ein Widget über Zellen
  *x…x+w−1* reicht vom Start der ersten bis zum Ende der letzten Zelle. Nur Ganzzahlen.
- Kachel-Innenelemente: Inhaltsbox = Außenmaß − 6 px (Padding inkl. Rahmen). Elemente haben
  LVGL-`align` + Offset, Textbreite fest (mit `long_mode: DOT`) oder Inhaltsbreite.
  Kompakt- vs. Hochformat-Anordnung hängt von der Kachelhöhe ab (siehe `widget_elements`).
- Schriftmetrik Montserrat: Zeilenhöhe ⌈1,219·s⌉, Grundlinie bei 0,968·s; Icons: Höhe = s.

## Generierte Datei

Kopfkommentar → `substitutions` → `esphome`/`esp32`/`logger`/`api`/`ota`/`wifi` → `globals`
(`cyd_page`) → `time` → `spi`/`display`/`touchscreen` → `output`/`light` → `sensor`/
`text_sensor` (HA-Spiegel mit `on_value` → LVGL-Updates) → `button` → `font` → `script`
(`cyd_update_time`, `cyd_on_page`) → `lvgl` (Theme, Styles, `on_idle`, `top_layer`, `pages`) →
Prüfsumme → Round-Trip-Block (`# cyd_studio_project:` base64(gzip(JSON))).

Navigation: Seiten in LVGL-Reihenfolge Navigationsseiten → weitere Hauptseiten → Unterseiten
(`skip: true` für alles außerhalb der Navigation, damit Wischen nur Hauptseiten durchläuft).
Jede Seite ruft in `on_load` das Skript `cyd_on_page(page, root)` auf, das Titel, Zurück-Pfeil
und aktiven Tab aktualisiert.
