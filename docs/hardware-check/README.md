# Hardware-Abnahme

Pro Phase und Board: Referenz-Layouts flashen, bedienen, dokumentieren. Ohne diesen Nachweis wird
kein Board und keine Phase freigegeben.

## Ablauf

1. Golden File erzeugen (`pytest`), z. B. `tests/golden/multipage.yaml`, in ESPHome als neues
   Gerät einfügen, per USB flashen.
2. Checkliste abarbeiten, Ergebnis unten eintragen.
3. Foto des Displays **neben** dem Vorschau-PNG (Editor → „PNG“) als
   `docs/hardware-check/<board>-<variante>-<projekt>-<seite>.jpg` ablegen.

## Checkliste

- [ ] Bild erscheint, Farben stimmen (sonst Variante ST7789/ILI9342 wählen)
- [ ] Ausrichtung stimmt (USB-Seite wie im Assistenten angezeigt)
- [ ] Touch trifft in allen **vier Ecken** und in der Mitte
- [ ] Uhrzeit/Datum nach Zeitsynchronisierung korrekt (DE-Wochentag, Umlaute „März“)
- [ ] Schalter-Kachel schaltet, Zustand/Farbe folgt HA (auch bei Änderung in HA)
- [ ] Messwert mit Einheit und Nachkommastellen, „--“ bei nicht verfügbar
- [ ] Status-Anzeige wechselt Icon-Farbe/Text
- [ ] Aktions-Taste führt Skript/Szene aus („Aktionen erlauben“ aktiv)
- [ ] Tab-Leiste: Seitenwechsel, aktiver Tab hervorgehoben, Titel in der Kopfzeile
- [ ] Wischen links/rechts zwischen Hauptseiten
- [ ] Seiten-Taste → Unterseite, Zurück-Pfeil (Kopfzeile und Seitentitel), Wischen rechts = zurück
- [ ] Rückkehr zur Startseite nach Zeitablauf (global und je Seite)
- [ ] Bildschirmschoner dimmt, Berührung weckt
- [ ] Vorschau-PNG und Foto stimmen bis auf Kantenglättung/Farbe überein

## Ergebnisse

| Datum | Board / Variante | Projekt | Ergebnis | Notizen |
|---|---|---|---|---|
| – | ESP32-2432S028R / ILI9341 | multipage | ausstehend | kompiliert mit ESPHome 2026.9.0 |
