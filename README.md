<p align="center"><img src="custom_components/cyd_studio/brand/logo@2x.png" alt="CYD Studio" height="96"></p>

# CYD Studio

[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
[![Release](https://img.shields.io/github/v/release/Mastershort/cyd-studio)](https://github.com/Mastershort/cyd-studio/releases)
[![Tests](https://github.com/Mastershort/cyd-studio/actions/workflows/tests.yml/badge.svg)](https://github.com/Mastershort/cyd-studio/actions/workflows/tests.yml)
[![Validate](https://github.com/Mastershort/cyd-studio/actions/workflows/validate.yml/badge.svg)](https://github.com/Mastershort/cyd-studio/actions/workflows/validate.yml)

**Dein Touch-Display-Dashboard für Home Assistant – zusammengeklickt statt programmiert.**
*[English below](#english)*

CYD Studio ist eine Custom Integration für Home Assistant (über HACS installierbar). Sie bringt einen
eigenen Menüpunkt mit, in dem du ein Dashboard für das „Cheap Yellow Display“ (ESP32-2432S028R,
2,8″-Touchscreen) grafisch gestaltest, eine **pixelgenaue Vorschau mit echten Werten** siehst und
am Ende **fertigen ESPHome-Code** bekommst.

1. Board wählen, Ausrichtung wählen, Vorlage wählen.
2. Kacheln per Klick oder Drag & Drop auf das Display legen – beliebig viele Seiten, Unterseiten,
   Tab-Leiste und Wischen.
3. Jede Kachel mit einer Entität verbinden (Suche mit Bereich und aktuellem Zustand).
4. In der Vorschau tippen und wischen wie auf dem Gerät.
5. **Code erzeugen** → **In ESPHome speichern** (oder kopieren/herunterladen) → in ESPHome installieren.

**Widgets:** Schalter-Kachel (mit Regler und Licht-Popup bei langem Druck), Messwert, Status-Anzeige,
Person, Mehrfachwert, Rollladen, Klima, Regler, Zahlen-Stepper, Auswahl, Media-Player, Szenen-Button,
Button-Raster, Uhr, Wetter, Gauge, Countdown, Nachrichtenbereich, QR-Code, Text, Seiten-Button,
Seitentitel, Trennlinie und Abstand.

**Gestaltung:** Themes (dunkel, hell, Kontrast, OLED, Home/iOS-Stil), Kachel-Stile (Karte, Flach,
Umriss, Glas, Kräftig), eigene Farben für an/aus, Deckkraft, Ecken, Icons im Kreis, Icon- und
Textgrößen, Beschriftung ausblenden, Slider-Farben und Hintergrundbilder pro Projekt oder Seite.

**Logik:** eigene Aktionen für Tippen, langes Drücken und Doppeltippen, Bedingungen (Widget nur
zeigen, wenn …), Zustandsregeln (z. B. rot über 25 °C), Nachtmodus, Bildschirmschoner und
Steuerung des Displays aus Home Assistant (Seite zeigen, Nachricht, Helligkeit, LED).

Der erzeugte Code wird bei jeder Änderung mit ESPHome 2026.9 validiert und kompiliert und läuft auf
dem ESP32-2432S028R. Alle Änderungen: [CHANGELOG.md](CHANGELOG.md).

## Installation

[![In HACS öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Mastershort&repository=cyd-studio&category=integration)

1. Auf den Knopf oben klicken – oder in HACS → ⋮ → *Benutzerdefinierte Repositories* →
   `https://github.com/Mastershort/cyd-studio` (Typ *Integration*) hinzufügen.
2. „CYD Studio“ herunterladen, Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → *Integration hinzufügen* → „CYD Studio“.
4. In der Seitenleiste erscheint **CYD Studio**.

**Updates** bietet HACS automatisch an, sobald ein neues Release erscheint. Nach dem Update
Home Assistant neu starten und das Panel einmal mit Strg+F5 neu laden. Projekte bleiben erhalten;
geänderte Displays zeigen in der Projektliste „geändert seit letztem Export“.

Voraussetzungen: Home Assistant 2026.x, für die Installation aufs Display der **ESPHome Device Builder**
(Add-on) oder eine andere ESPHome-Installation ≥ 2026.9.

## Code aufs Display bringen

1. Im Export-Dialog **Kopieren** (oder Herunterladen).
2. ESPHome öffnen → Gerät bearbeiten (oder *Neues Gerät*) → alles ersetzen → Speichern → *Installieren*.
3. In ESPHome unter *Secrets* müssen `wifi_ssid` und `wifi_password` stehen.
4. Beim ersten Mal per USB installieren („Plug into this computer“, Chrome/Edge, Datenkabel;
   unter Windows ggf. CH340-Treiber). Danach drahtlos.
5. **Wichtig:** In Home Assistant beim neuen ESPHome-Gerät *„Dem Gerät erlauben,
   Home-Assistant-Aktionen auszuführen“* aktivieren – sonst reagieren die Schalter nicht.

## Design auf ein anderes Display übertragen

In der Projektliste beim Ziel-Projekt **„Design übernehmen“** wählen und als Quelle ein anderes
Projekt oder eine exportierte `.cydstudio.json` angeben. Übernommen werden Seiten mit Widgets,
Popups, Kopfzeile, Navigation, Raster, Theme, Farben, Kachel-Stil, Hintergrundbilder sowie
Helligkeit, Nachtmodus und Bildschirmschoner. Name, Gerätename, API-Schlüssel, WLAN und Board des
Ziels bleiben – das Display muss in Home Assistant also nicht neu eingerichtet werden. Direkt danach
lässt sich der Schritt mit **„Rückgängig“** zurücknehmen. Exportierte Dateien enthalten die
Hintergrundbilder, aber nie den API-Schlüssel.

## Unterstützte Hardware

| Board | Status |
|---|---|
| ESP32-2432S028R (ILI9341, Varianten ST7789 / ILI9342) | unterstützt, auf Hardware getestet |
| ESP32-2432S028C, ESP32-3248S035R/C, ESP32-8048S043 | geplant (Phase 3) |

## Entwicklung

```bash
# Frontend (TypeScript + Lit + Vite) – das Bundle landet in custom_components/cyd_studio/frontend/dist
cd frontend && npm ci && npm run build && npm test

# Generator-Tests (reines Python) und Golden Files
pip install pytest pyyaml && pytest
UPDATE_GOLDEN=1 pytest            # Golden Files neu schreiben (Diff prüfen!)

# Home-Assistant-Tests
pip install pytest-homeassistant-custom-component && pytest tests/ha

# Erzeugten Code mit ESPHome prüfen (Docker oder lokales esphome)
tools/validate_esphome.sh          # esphome config für alle Golden Files
tools/validate_esphome.sh compile  # zusätzlich kompilieren
```

Architektur: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Widgets: [docs/WIDGETS.md](docs/WIDGETS.md) ·
Boards: [docs/BOARDS.md](docs/BOARDS.md) · Annahmen: [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md)

## Unterstützen

CYD Studio ist kostenlos und Open Source. Wenn es dir Zeit spart, freue ich mich über eine kleine
Spende: **[CYD Studio unterstützen](https://mastershort.de/cyd-studio/unterstuetzen)** – oder über einen Stern ⭐ auf GitHub, Feedback
und Screenshots deiner Dashboards in den [Issues](https://github.com/Mastershort/cyd-studio/issues).

Passende Displays und Gehäuse: [mastershort.de/cyd-studio/hardware](https://mastershort.de/cyd-studio/hardware)
(teils Affiliate-Links – für dich kostet es nichts extra, ich bekomme eine kleine Provision).

## Danke & Hinweise

- Hardware-Grundkonfiguration und Interaktionsmuster nach
  [akuehlewind/ESPHome-touch-display-mount](https://github.com/akuehlewind/ESPHome-touch-display-mount)
  (MIT, © 2023 Adrian Kuehlewind) – passend dazu das CC0-Gehäuse
  „Home Assistant Desk Mount – Cheap Yellow Display“. Siehe [NOTICE](NOTICE).
- Links zu Hardware und Gehäusen führen zu einer Übersichtsseite auf mastershort.de, dort teils
  Affiliate-Links. Die Hinweise lassen sich in den Optionen der Integration abschalten.
  Kein Tracking außer dem neutralen Parameter `?src=cyd-studio`.
- Schriften: Montserrat (SIL OFL 1.1), Material Design Icons (Apache 2.0).

Lizenz: MIT

---

## English

CYD Studio is a Home Assistant custom integration (installable via HACS) that adds a **visual
designer for the "Cheap Yellow Display"** (ESP32-2432S028R) to your sidebar: drag tiles onto the
display, connect them to your entities, see a **pixel-exact live preview** with real states,
and get **ready-to-flash ESPHome code**.

- Multiple pages, sub pages with back navigation, tab bar and swiping, global header, popups.
- 24 widgets: toggle tile (slider and light popup on long press), sensor value, binary indicator,
  person, multi value, cover, climate, slider, number stepper, select, media player, scene button,
  button grid, clock, weather, gauge, countdown, notification area, QR code, label, page button,
  page title, divider and spacer.
- Themes, tile styles, per widget colors, icon and text sizes, hidden labels, background images.
- Own actions for tap / long press / double tap, conditions, state rules, night mode, screensaver,
  control the display from Home Assistant.
- Apply the design of one project to another display without changing its identity.
- The preview uses the same layout function, fonts (Montserrat, Material Design Icons 7.4.47)
  and styles as the generated LVGL code.
- The generator is pure Python, deterministic, covered by golden-file tests and validated with
  `esphome config` / `esphome compile` (ESPHome 2026.9).

Install via HACS (button above or custom repository, type *Integration*), restart, add the
"CYD Studio" integration. After flashing, enable *"Allow the device to perform Home Assistant
actions"* for the new ESPHome device. Changes: [CHANGELOG.md](CHANGELOG.md). Links to hardware point to an overview page on mastershort.de (partly affiliate links);
they can be switched off in the integration options.

Support the project: [https://mastershort.de/cyd-studio/unterstuetzen](https://mastershort.de/cyd-studio/unterstuetzen) · Hardware: https://mastershort.de/cyd-studio/hardware
(partly affiliate links).

License: MIT
