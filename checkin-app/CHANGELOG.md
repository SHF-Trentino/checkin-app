In dieser Datei wird erläutert, wie Visual Studio das Projekt erstellt hat.

Folgende Tools wurden zur Erstellung dieses Projekts verwendet:
- TypeScript Compiler (tsc)

Folgende Schritte wurden zur Erstellung dieses Projekts verwendet:
- Projektdatei (`checkin-app.esproj`) erstellen.
- Erstellen Sie `launch.json`, um das Debuggen zu aktivieren.
- NPM-Pakete installieren und `tsconfig.json` erstellen: `npm init && npm i --save-dev eslint typescript @types/node && npx tsc --init --sourceMap true`.
- Erstellen Sie `app.ts`.
- Aktualisieren Sie de `package.json`-Einstiegspunkt.
- Aktualisieren Sie TypeScript-Buildskripts in `package.json`.
- `eslint.config.js` erstellen, um Linting zu aktivieren.
- Projekt zur Projektmappe hinzufügen.
- Schreiben Sie diese Datei.
