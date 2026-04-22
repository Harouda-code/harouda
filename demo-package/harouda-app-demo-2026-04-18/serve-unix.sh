#!/usr/bin/env bash
# harouda-app Demo — lokaler Mini-Server (Linux / macOS)

set -eu
cd "$(dirname "$0")/dist"

if command -v python3 >/dev/null 2>&1; then
  echo "Starte python3 -m http.server auf http://localhost:8080"
  echo "Mit Strg+C beenden. Browser: http://localhost:8080"
  exec python3 -m http.server 8080
fi

if command -v node >/dev/null 2>&1; then
  echo "Starte npx serve auf http://localhost:8080"
  echo "Mit Strg+C beenden. Browser: http://localhost:8080"
  exec npx --yes serve -s . -l 8080
fi

echo "Weder python3 noch node gefunden."
echo "Öffnen Sie einfach dist/index.html im Browser."
exit 1
