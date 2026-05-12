# VeloDB — Projekt-Kontext für Claude Code

## Was ist das?
HTML-App zur Verwaltung von Mountainbikes.
Kein Build-System, kein Framework, kein Server — Vanilla JS/CSS in separaten Dateien.
Läuft lokal im Browser (Safari/Chrome) und auf GitHub Pages: https://balmaeh.github.io/Velodb/

## Technologie
- Vanilla HTML/CSS/JavaScript (kein Build-Step)
- `localStorage` für Datenpersistenz (Key: `velodb_v6`)
- JSON Export/Import als Backup
- Fonts via Google Fonts (Barlow, Barlow Condensed, DM Mono)

## Dateistruktur
```
index.html        ← HTML-Shell (nur Struktur + Script-Tags)
css/
  style.css       ← alle Styles
js/
  utils.js        ← Hilfsfunktionen (esc, fmtDate, uid, EXIF, Slideshow...)
  app.js          ← Konstanten, State-Variablen, Navigation, Bike-CRUD
  storage.js      ← State-Init, Migration, markDirty, saveState
  render.js       ← alle Render-Funktionen (render, switchTab, tabXxx...)
  handlers.js     ← DnD, Modals, Edit-Funktionen, Import/Export
CLAUDE.md         ← diese Datei
```

### Script-Ladereihenfolge (wichtig!)
```
utils.js → app.js → storage.js → render.js → handlers.js
```
`storage.js` initialisiert `state` beim Laden — braucht `defaultGeoDefs()` (utils.js)
und `DEFAULT_INFO_DEFS` (app.js). Reihenfolge nicht ändern!

## Aktuelle Version: 1.1
Versionshinweise immer an drei Stellen aktualisieren:
- `<title>VeloDB 1.x</title>`
- Sidebar: `v1.x · Bike Management`
- `state={version:XX,...}`
- Storage Key bei Breaking Changes: `velodb_vX`

## Coding-Regeln

### Kritisch
- **Nie `…` (Unicode-Ellipse)** — immer drei Punkte `...` (Spread-Operator!)
- **Nie `–` (En-Dash) in CSS-Variablen** — immer `--` (z.B. `var(--border)`)
- **Keine Markdown-Codeblöcke** (` ``` `) im JavaScript
- Nach jeder Änderung JS-Syntax prüfen: `node --check index.html` geht nicht direkt, aber Script extrahieren und prüfen

### Stil
- Umlaute ausschreiben: `Ä Ö Ü ä ö ü` — nie `ae oe ue`
- Grossbuchstaben bevorzugen: `Dämpfer`, `Bremsbeläge`, `Bremsschläuche`
- Keine Demo-Daten im Code — App startet leer, Daten kommen per JSON-Import

### Architektur
- Alle Render-Funktionen geben HTML-Strings zurück
- State-Mutationen immer mit `markDirty(label)` gefolgt von `switchTab()` oder `render()`
- Drag & Drop via Pointer Events API (funktioniert auf iOS Safari + Desktop)
- Gruppennamen für DnD in Arrays `dndCompGrpNames[]` / `dndSetGrpNames[]` — nie direkt als String im HTML-Attribut (Umlaut-Escaping-Bug!)

## Datenstruktur (state)
```js
state = {
  version: 11,
  personalInfo: '',        // HTML-String
  geoDefs: [...],          // globale Geometrie-Felddefinitionen
  bikes: [{
    id, status,            // 'aktiv' | 'ausgemustert'
    marke, modell, typ, jahr, farbe, groesse,
    bezug, preis, federweg, gewichtGewogen,
    fotos: [{data: 'base64...', datum: 'YYYY-MM-DD'}],
    aktuellerZustand, bemerkungen,
    components: [{group, name, history: [{datum, wert, gewicht, preis, notiz}], notVorhanden}],
    settings: [{label, unit, group, isStandard, history: [{datum, wert, notiz, kompSnapshot}]}],
    geometry: [{defId, history: [{datum, wert, notiz}]}],
    todos: [{text, done}]
  }]
}
```

## Views / Navigation
- `overview` — Bike-Karten Grid mit Filter (aktiv/ausgemustert/alle)
- `bike` — Bike-Detailseite mit Tabs: Info, Komponenten, Einstellungen, Geometrie, ToDo
- `compare` — N Bikes nebeneinander vergleichen (mit Snapshot-Auswahl)
- `personal` — Richtext-Editor für persönliche Infos

## Komponenten-Gruppen (Standard)
Rahmen & Federung, Antrieb, Bremsen, Räder, Cockpit, Sattel, E-Bike

## Einstellungen-Gruppen (Standard)
Gabel (Luftdruck, Tokens, Zugstufe, Druckstufe, Sag)
Dämpfer (gleiche 5 Felder)
Reifen (Druck vorne/hinten)

## Einstellungen → Komponenten-Referenz (SETTING_COMP_MAP)
Beim Öffnen einer Einstellung wird die zugehörige Komponente als Referenz angezeigt:
- Gabel-Einstellungen → Gabel
- Dämpfer-Einstellungen → Dämpfer
- Reifendruck vorne → Reifen vorne + Ventil/Schlauch vorne
- Reifendruck hinten → Reifen hinten + Ventil/Schlauch hinten

Beim Speichern einer Einstellung wird automatisch ein `kompSnapshot` der aktuellen Komponentenwerte gespeichert.

## Bekannte Stolperstellen
- `cmpIds[]` und `cmpSnaps[]` sind globale Arrays für den Vergleich — Länge ist dynamisch
- Foto-Format: `{data: 'data:image/jpeg;base64,...', datum: 'YYYY-MM-DD'}` — alte String-Fotos werden bei Migration konvertiert
- `ensureBikeGeo(b)` muss vor jedem Geometrie-Tab-Render aufgerufen werden
- Edit-Mode (`editMode` Variable) gilt global — beim Tab-Wechsel zurücksetzen wenn nötig
- `buildZeitstrahlHtml(b)` ist eine separate Funktion (kein eigener Tab mehr, eingeklappt unter Komponenten)
