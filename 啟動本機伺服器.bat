@echo off
cd /d "%~dp0"
set PORT=8765
echo.
echo   Local media server for OBS
echo   http://127.0.0.1:%PORT%/
echo.
echo   1. Keep this window open
echo   2. Open entry page, copy media URL
echo   3. Paste into OBS browser source
echo   Must be http://127.0.0.1 not file://
echo.

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -m http.server %PORT% --bind 127.0.0.1
  goto end
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  python -m http.server %PORT% --bind 127.0.0.1
  goto end
)

where python3 >nul 2>nul
if %ERRORLEVEL%==0 (
  python3 -m http.server %PORT% --bind 127.0.0.1
  goto end
)

where node >nul 2>nul
if %ERRORLEVEL%==0 (
  set PORT=%PORT%
  node local-server.js
  goto end
)

echo ERROR: Python or Node.js not found.
echo Install Python from python.org and check "Add to PATH"
echo or install Node.js from nodejs.org
echo.
pause

:end
