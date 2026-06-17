# Architektur

Diese Seite erklärt den grundlegenden Entwurf des statischen Discord Data Package Explorer.

## Kernprinzipien

- **Alles läuft im Browser**  
  Kein Backend, keine API-Aufrufe, keine Daten verlassen das Gerät des Nutzers.

- **Einfachheit vor Features**  
  Wir haben bewusst eine einfachere Architektur als im Original gewählt, damit der Code leichter zu prüfen und als statisches Artefakt zu warten ist.

- **Suche als Hauptfunktion**  
  Während Statistiken weiterhin verfügbar sind, liegt der primäre Wert darin, eigene Nachrichten über alle Server und DMs hinweg durchsuchen zu können.

## Grober Datenfluss

1. Nutzer zieht oder wählt `package.zip` per Drag & Drop
2. Streaming-Unzip mit `fflate` (speichereffizient auch bei großen Paketen)
3. Erkennung des Message-Roots, der Kontoinformationen und des Formattyps (altes CSV oder neues JSON)
4. Parsen des Kanal-Index und der einzelnen Nachrichtendateien
5. In-Memory-Datenstruktur mit vollständigem Nachrichteninhalt
6. Reaktive Benutzeroberfläche (Svelte) zum Filtern, Suchen und Anzeigen

Alle Schritte laufen vollständig client-seitig ab.

## Warum eine Single-File-Architektur?

Das Originalprojekt nutzte eine klassischere Struktur mit separaten Views, Komponenten und Stores. Wir haben den Großteil der Logik in `src/App.svelte` zusammengefasst.

Gründe:

- Reduziert die Fläche, die Nutzer verstehen müssen, wenn sie den Code prüfen.
- Einfacher als reines statisches Deployment.
- Für diesen Anwendungsbereich (einmal parsen → lokal erkunden) waren komplexes Routing und aufwändiges State-Management nicht notwendig.
- Schnellere Iteration bei kleiner Bundle-Größe.

Wichtige Teile der Logik (ZIP-Verarbeitung, Nachrichten-Parsing, Statistikberechnung) sind dennoch als eigene Funktionen innerhalb der Komponente klar abgetrennt.

## Parsing-Ansatz

Wir haben die exzellente Streaming-Parser-Logik des Originalprojekts übernommen und angepasst:

- Unterstützt Pakete mit und ohne `c`-Präfix bei Kanalordnern.
- Verarbeitet sowohl alte CSV-Nachrichtendateien als auch moderne JSON-Dateien.
- Nutzt `DecodeUTF8` von `fflate` für effizientes Text-Dekodieren während des Streamings.
- Behält den **vollständigen Nachrichteninhalt** (im Gegensatz zum Original, das Inhalte für reine Statistiken gekürzt hat).

Diese Änderung war notwendig, um die serverübergreifende Suchfunktion zu ermöglichen.

## State-Management

Wir verwenden die eingebaute Reaktivität von Svelte (`let`-Deklarationen und `$:`-reaktive Statements) statt eines separaten Store-Systems. Das hält den Code zugänglich und liefert dennoch reaktive Aktualisierungen beim Filtern oder Suchen.

## Deployment-Modell

Die Anwendung ist ausschließlich für statisches Hosting ausgelegt:

- GitHub Pages (primär)
- Jeder andere statische Host (Netlify, Vercel, Cloudflare Pages usw.)

Da es keine Server-Komponente gibt, ist der einzige „Backend“ der Browser des Nutzers.

## Dokumentation

Getrennt von der Anwendung pflegen wir eine Dokumentation mit VitePress. Das ermöglicht:

- Reichhaltigere Erklärungen (Architektur, Datenformate, Datenschutz)
- Mehrsprachige Unterstützung ohne Aufblähung der Haupt-App
- Klare Trennung zwischen dem Tool und seiner Dokumentation

Die Dokumentation selbst steht unter der Lizenz CC-BY-SA 4.0 (siehe `LICENSE` im docs-Ordner).

## Kompromisse

Diese Architektur macht einiges einfacher und anderes schwieriger:

- Einfacher: Auditierbarkeit, statisches Deployment, Such-Performance, Transparenz
- Schwieriger: Komplexe UI-Flows, schwere Visualisierungen oder mehrseitige Navigation

Wir glauben, dass dieser Kompromiss für das erklärte Ziel eines reinen, vertrauenswürdigen, statischen Datenpaket-Explorers richtig ist.