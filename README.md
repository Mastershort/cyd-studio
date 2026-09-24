# CYD Studio

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
5. **Code erzeugen** → kopieren oder herunterladen → in ESPHome einfügen → installieren.

> Status: **Phase 1 (MVP)**. Der erzeugte Code wird mit ESPHome 2026.9 validiert und kompiliert.
> Die Abnahme auf echter Hardware steht noch aus – siehe [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md).

## Installation

1. HACS → ⋮ → *Benutzerdefinierte Repositories* → `https://github.com/Mastershort/cyd-studio` (Typ *Integration*).
2. „CYD Studio“ installieren, Home Assistant neu starten.
3. Einstellungen → Geräte & Dienste → *Integration hinzufügen* → „CYD Studio“.
4. In der Seitenleiste erscheint **CYD Studio**.

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

## Unterstützte Hardware

| Board | Status |
|---|---|
| ESP32-2432S028R (ILI9341, Varianten ST7789 / ILI9342) | kompiliert, Hardware-Abnahme ausstehend |
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

- Multiple pages, sub pages with back navigation, tab bar and swiping, global header.
- Widgets (phase 1): toggle tile, sensor value, binary indicator, clock, label, action button,
  page button, page title.
- The preview uses the same layout function, fonts (Montserrat, Material Design Icons 7.4.47)
  and styles as the generated LVGL code.
- The generator is pure Python, deterministic, covered by golden-file tests and validated with
  `esphome config` / `esphome compile` (ESPHome 2026.9).

Install via HACS (custom repository, type *Integration*), restart, add the "CYD Studio" integration.
After flashing, enable *"Allow the device to perform Home Assistant actions"* for the new ESPHome
device. Links to hardware point to an overview page on mastershort.de (partly affiliate links);
they can be switched off in the integration options.

License: MIT
