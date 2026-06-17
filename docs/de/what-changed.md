# Was sich im Vergleich zum Original geändert hat

Dieses Projekt ist ein Fork und eine Neuimplementierung des [Discord Data Package Explorer von Androz2091](https://github.com/Androz2091/discord-data-package-explorer). Wir teilen das gleiche grundlegende Ziel – Nutzern zu helfen, ihr Discord-Datenpaket zu verstehen und zu erkunden –, haben jedoch einige erhebliche Änderungen vorgenommen.

## Wichtige Unterschiede auf einen Blick

| Bereich               | Original                          | Diese statische Edition                      |
|-----------------------|-----------------------------------|----------------------------------------------|
| Build-System          | Rollup + Svelte 3                 | Vite + Svelte 4                              |
| Architektur           | Mehrere Views + Routing + Stores  | Meist einzelne Datei (`App.svelte`)          |
| Hauptfokus            | Statistiken & Insights            | Serverübergreifende Nachrichtensuche         |
| Externe Abhängigkeiten| axios, diswho API, Charts etc.    | Keine (rein client-seitig)                   |
| Netzwerkaktivität     | Optionale externe Auflösung       | Keine Netzwerkaufrufe während der Verarbeitung |
| Nachrichteninhalt     | Nur für Statistiken gekürzt       | Vollständiger Inhalt für die Suche           |
| Deployment            | Self-Host oder gehostete Versionen| GitHub Pages (rein statisch)                 |
| Dokumentation         | Einfaches README                  | Mehrsprachige VitePress-Dokumentation        |

## Bemerkenswerte Änderungen und Ergänzungen

- **Suche als zentrale Funktion**  
  Das Original lag stark auf aggregierten Statistiken. Wir haben eine leistungsstarke Volltextsuche über *alle* Server und DMs hinweg hinzugefügt, mit Filtern (nur Server / nur DMs), Kanal-Filter, Sortierung und CSV-Export. Das entspricht dem häufigen Bedürfnis, alte Nachrichten serverübergreifend zu finden.

- **Vollständige Entfernung externer Dienste**  
  Alle Aufrufe an externe APIs (z. B. zur Auflösung von Benutzernamen/Avataren) wurden entfernt. Das macht das Tool wirklich frei von Telemetrie und geeignet für besonders datenschutzbewusste Nutzer.

- **Einfachere und wartbarere Codebasis**  
  Wir haben die Logik in einer reaktiven Komponente zusammengefasst. Das reduziert die Komplexität für ein Tool, dessen Hauptaufgabe „einmal parsen, lokal erkunden“ ist.

- **Modernes Build-Toolchain**  
  Wechsel zu Vite für schnellere Entwicklung und einfachere statische Export-Konfiguration.

- **Starker Fokus auf Transparenz**  
  Der gesamte Wertversprechen lautet: „Das ist ein reiner statischer Build auf GitHub Pages.“ Wir haben sichtbare Hinweise, klare Lizenzierung der Dokumentation und separate mehrsprachige Dokumentation hinzugefügt.

- **Dokumentation**  
  Wir haben eine eigene Dokumentationsseite (diese Seite) mit Anleitungen, Architektur-Erklärungen und Datenschutzdetails erstellt. Zunächst auf Englisch und Deutsch verfügbar, mit Struktur für weitere Sprachen.

## Was wir beibehalten haben

- Den hervorragenden Streaming-ZIP-Parser mit `fflate`
- Unterstützung für alte (CSV) und neue (JSON) Datenpaket-Formate
- Grundlegende Statistiken (Nachrichtenanzahl, stündliche Aktivität, häufige Wörter usw.)
- Demo-Daten-Modus zum Testen ohne echtes Paket
- Die grundsätzliche Philosophie „alles läuft im Browser“

## Warum diese Änderungen?

Das Originalprojekt ist ausgezeichnet. Unser spezifisches Ziel war jedoch, eine **hochvertrauenswürdige, rein statische Version** zu schaffen, die auf GitHub Pages gehostet werden kann, ohne Risiko versteckter Telemetrie oder Backend-Verarbeitung. Dafür war nötig:

- Jede mögliche externe Abhängigkeit zu eliminieren
- Die Architektur für langfristige Wartbarkeit als statisches Artefakt zu vereinfachen
- Den Such-Use-Case in den Vordergrund zu stellen, den viele Nutzer tatsächlich brauchen

Wir glauben, dass diese Änderungen das Tool besser an das Ziel „rein statisch + maximale Transparenz“ anpassen, während es weiterhin echten Nutzen bietet.