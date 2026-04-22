@echo off
REM harouda-app Demo — lokaler Mini-Server (Windows)
REM
REM Variante A: Python 3 vorhanden
REM Variante B: Node.js vorhanden
REM Variante C: Einfach dist\index.html doppelklicken

cd /d "%~dp0\dist"

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Starte Python-HTTP-Server auf http://localhost:8080 ...
  echo Mit Strg+C beenden. Browser: http://localhost:8080
  python -m http.server 8080
  goto :eof
)

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Starte npx serve auf http://localhost:8080 ...
  echo Mit Strg+C beenden. Browser: http://localhost:8080
  npx --yes serve -s . -l 8080
  goto :eof
)

echo Weder Python noch Node.js gefunden.
echo Oeffnen Sie einfach "dist\index.html" im Browser per Doppelklick.
pause
