# Automatische Cover für das Notion-„Rezepte Buch“

Eine stündliche geplante Aufgabe in Claude Code (Cloud) gibt neuen Rezepten ein Cover.

## Ablauf

1. Rezepte holen, die in den letzten 48 Stunden angelegt wurden. Notion-Datenquelle:
   `collection://25b14d48-28ee-81d3-af1f-000be8f2f889`, SQL über `createdTime`.
2. Jede Seite abrufen. Seiten mit Cover werden übersprungen.
3. Für jede Seite ohne Cover drei Farben passend zum Gericht wählen und das Bild erzeugen:
   `node "AIWorkspace/01 Rezeptfinder/tools/cover-bild.js" "<Name>" "#haupt,#stuecke,#garnitur"`
4. Alle neuen Bilder in einem Commit auf den Branch `rezeptfinder-bilder` pushen.
5. Cover-URL mit Commit-SHA bilden:
   `https://raw.githubusercontent.com/tomaik3/awesome-chatgpt-prompts/<sha>/AIWorkspace/01%20Rezeptfinder/bilder/<datei>.jpg`.
   Mit `curl` prüfen, dass die URL `200` und `image/jpeg` liefert.
6. In Notion:
   - Cover setzen: `notion-update-page`, `update_properties`, Parameter `cover`.
   - Ist das Feld `Bild` leer: `notion-create-attachment` mit `source_url` aufrufen, dann `Bild` auf `[{type:"file_upload", file_upload:{id}}]` setzen.

## Regeln

- Vorhandene Cover und alle anderen Inhalte bleiben unverändert.
- Keine Bilder von Chefkoch oder anderen Rezeptseiten verwenden. Chefkoch sperrt automatischen Zugriff, und die Fotos sind urheberrechtlich geschützt.
- Gibt es nichts zu tun, wird nichts committet.
