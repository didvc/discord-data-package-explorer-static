# Datenpaket-Format

Discord ändert von Zeit zu Zeit die Struktur der exportierten Datenpakete.

Dieses Tool unterstützt sowohl ältere (CSV) als auch neuere (JSON) Nachrichtenformate.

## Häufige Ordner und Dateien

- `messages/` — enthält deine Nachrichten
- `account/user.json` oder ähnlich — deine Kontoinformationen
- Index-Dateien, die Kanal-IDs Namen zuordnen

Aktuelle Details findest du im Quellcode unter `src/App.svelte` (im Extraktions-Logik).

Falls du auf ein neues Format stößt, das das Tool kaputt macht, öffne bitte ein Issue auf GitHub.
