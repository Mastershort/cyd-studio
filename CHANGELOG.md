# Changelog

Alle nennenswerten Änderungen an CYD Studio. Versionen folgen [SemVer](https://semver.org/lang/de/);
jede Version ist ein GitHub-Release, das HACS als Update anbietet.

## 1.0.3 – 2026-09-25

- Vorlagen erzeugen bei englischer Oberfläche englische Seitennamen und Beschriftungen
  („Home“, „Light 1“, „All off“ statt „Start“, „Licht 1“, „Alles aus“)

## 1.0.2 – 2026-09-25

- README: Hardware-Tabelle (AliExpress, Amazon, Netzteil, Gehäuse zum Selbstdrucken) in Deutsch
  und Englisch, Affiliate-Hinweis, PayPal-Spenden; „Sponsor“-Knopf zeigt auf PayPal

## 1.0.1 – 2026-09-25

- Projektliste: Links „Wo bekomme ich das Board?“ und „♥ CYD Studio unterstützen“ (abschaltbar über
  die Option „Hinweise auf Hardware, Gehäuse & Unterstützung anzeigen“)
- README: Abschnitt „Unterstützen“, Hinweis auf Affiliate-Links; GitHub zeigt einen „Sponsor“-Knopf

## 1.0.0 – 2026-09-25

Erste offizielle Veröffentlichung über HACS – auf echter Hardware (ESP32-2432S028R) getestet.

- Icon und Logo für Home Assistant und HACS
- Release-Workflow: ein Tag `vX.Y.Z` erzeugt das GitHub-Release mit den Notizen aus dieser Datei
- README aktualisiert (Funktionsumfang, Installation, Update)

## 0.15.0 – 2026-09-25

- **Design übernehmen:** Seiten, Widgets, Popups, Kopfzeile, Navigation, Raster, Theme, Farben,
  Kachel-Stil, Hintergrundbilder und Anzeige-Einstellungen aus einem anderen Projekt oder einer
  `.cydstudio.json` übernehmen – Name, Gerätename, Board, WLAN und API-Schlüssel bleiben;
  Warnung bei anderem Board / anderer Ausrichtung, „Rückgängig“ direkt danach
- Exportierte Projektdateien enthalten die Hintergrundbilder; Import und Duplizieren übernehmen sie
  (vorher gingen sie verloren)

## 0.14.0 – 2026-09-25

- **Beschriftung ausblenden** pro Widget („Beschriftung anzeigen“); das Layout rückt nach
  (Icon zentriert, Wert mittig, größerer Gauge-Bogen)

## 0.13.0 – 2026-09-25

- Eigene Farben für **Spur, Füllung und Knopf** bei Slider, Lautstärke, Gauge und Countdown-Balken
- Status-Anzeige (z. B. Fensterkontakt): **„Icon an“ / „Icon aus“** frei wählbar

## 0.12.0 – 2026-09-24

- Editor überarbeitet: gruppierte Werkzeugleiste, Widget-Suche und -Gruppen, Farbfelder mit Hex-Wert,
  aufgeräumte Projektliste

## 0.11.0 – 2026-09-24

- Neues Widget **Media-Player**: Titel, Interpret, Zurück / Play-Pause / Weiter, Lautstärke

## 0.10.0 – 2026-09-24

- Icon-Größe (auch ausblenden), Textgröße XS–XL, fette Schrift, Wertgröße pro Widget
- **Aktionen:** eigene Schritte für Tippen, langes Drücken und Doppeltippen

## 0.9.0 – 2026-09-24

- **Licht-Popup** bei langem Druck: Helligkeit, Farbtemperatur und Farbe (je nach Lampe)

## 0.8.0 – 2026-09-24

- **Bedingungen** (Widget nur zeigen, wenn …) und **Zustandsregeln** (z. B. rot über 25 °C)

## 0.7.0 – 2026-09-24

- Display aus Home Assistant steuern: Seite zeigen, Nachricht anzeigen, aufwecken, dimmen,
  Helligkeit, LED; Widget „Nachrichtenbereich“

## 0.6.0 – 2026-09-24

- Neue Widgets: Zahlen-Stepper, Auswahl, Countdown, Person, QR-Code, Trennlinie, Abstand, Button-Raster

## 0.5.0 – 2026-09-24

- Neue Widgets: Rollladen, Klima, Regler, Gauge, Wetter, Mehrfachwert

## 0.4.0 – 2026-09-24

- Hintergrundbilder pro Projekt oder Seite; **„In ESPHome speichern“** inkl. WLAN-Secrets

## 0.3.0 – 2026-09-24

- Kachel-Stile (Karte, Flach, Umriss, Glas, Kräftig), eigene Farben, Icons im Kreis, neue Themes

## 0.2.0 – 0.2.2 – 2026-09-24

- Regler bei langem Druck, Werte auf Kacheln, schlankeres YAML
- ESPHome-Gerät wird erkannt; „Aktionen erlauben“ mit einem Klick; Anleitung zum Verbinden

## 0.1.0 – 2026-09-24

- Erste Version: visueller Designer, pixelgenaue Vorschau, ESPHome-Code für das Cheap Yellow Display
