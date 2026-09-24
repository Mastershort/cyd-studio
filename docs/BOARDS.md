# Boards

Board-Profile liegen als Daten in `custom_components/cyd_studio/boards/<id>.yaml`. Ein neues Board
braucht keine Programmänderung – nur eine neue Datei. Kein Board wird freigegeben, bevor ein
Referenz-Layout darauf geflasht und bedient wurde.

## Felder

| Feld | Bedeutung |
|---|---|
| `id`, `name`, `name_en` | Kennung und Anzeigename |
| `chip`, `board`, `framework` | `esp32:`-Block der ESPHome-Konfiguration |
| `native` | Auflösung des Panels ohne Rotation |
| `display` | `platform: mipi_spi`, `model`, `color_order`, `data_rate`, SPI-Pins, `cs`, `dc`, `strapping_pins`, `invert_colors` |
| `display.variants[]` | wählbare Varianten; jedes Feld (auch `native`, `touch`, `orientations`) überschreibt das Basisprofil |
| `orientations` | Projekt-Ausrichtung → `rotation` (LVGL-Grad), optional `touch_transform`, `usb` (Seite des USB-Anschlusses) |
| `touch` | Plattform, SPI-Pins, `cs`, `irq`, `calibration`, `transform` (Rohachsen-Korrektur) |
| `backlight`, `extras` | Hintergrundbeleuchtung (PWM), LDR, RGB-LED, SD, Lautsprecher |
| `memory_budget` | grobe RAM-Grenze für die Speicherwarnung |

## ESP32-2432S028R („Cheap Yellow Display“ 2,8″, resistiv)

Status: **kompiliert** (ESPHome 2026.9.0) · Hardware-Abnahme **ausstehend**.

| Teil | Wert | Quelle |
|---|---|---|
| MCU | ESP32-WROOM-32, `esp32dev`, kein PSRAM | Referenz-Repo, Sunton-Datenblatt |
| Display | ILI9341, 240×320 nativ, SPI CLK GPIO14, MOSI GPIO13, CS 15, DC 2, BGR, 10 MHz | `home-like.yaml` (Referenz-Repo, 2026.9 geprüft) |
| Rotation (LVGL) | Querformat 90°, Hochformat 180°, Querformat gedreht 270°, Hochformat gedreht 0° | `home-like.yaml` ORIENTATION-Presets |
| Touch | XPT2046, SPI CLK GPIO25, MOSI GPIO32, MISO GPIO39, CS 33, IRQ 36, Kalibrierung x 280–3860 / y 340–3860, `mirror_x: true` | `home-like.yaml` |
| Backlight | GPIO21 (LEDC-PWM) | `buttons.yaml`/`home-like.yaml` |
| RGB-LED | R GPIO4, G GPIO16, B GPIO17, invertiert | `buttons.yaml` |
| LDR | GPIO34 (Polarität je Revision) | Community (witnessmenow/ESP32-Cheap-Yellow-Display) |

Varianten:

- **ST7789** (Revision mit USB-C + Micro-USB): `model: ST7789V`, 40 MHz – aus ESPHomes eingebautem
  Modell `ESP32-2432S028-7789` (`esphome/components/mipi_spi/models/cyd.py`). *Nicht auf Hardware geprüft.*
- **ILI9342**: 320×240 nativ, RGB, 40 MHz, Rotation 180/270/0/90, Touch `swap_xy` +
  eigene Spiegelung, Kalibrierung x 340–3860 / y 280–3860 – aus den von Nutzern getesteten
  Presets im Referenz-Repo.

Referenz: <https://github.com/akuehlewind/ESPHome-touch-display-mount> (MIT, © 2023 Adrian Kuehlewind),
Gehäuse „Home Assistant Desk Mount – Cheap Yellow Display“ (CC0).

## Geplant (Phase 3)

ESP32-2432S028C (kapazitiv, CST820/GT911), ESP32-3248S035R/C (3,5″, ST7796),
ESP32-8048S043 (ESP32-S3, 4,3″ RGB-Parallel, GT911).
