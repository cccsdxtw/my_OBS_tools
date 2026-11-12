@echo off
cd /d "%~dp0"
set PORT=8765
echo.
echo   Local media server for OBS
echo   http://127.0.0.1:%PORT%/
echo.
echo   Keep this window open.
echo   Then copy media URL from entry page into OBS.
echo.

where node >nul 2>nul
if %ERRORLEVEL%==0 (
  set PORT=%PORT%
  node local-server.js
  goto end
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py local-server.py
  goto end
)

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  python local-server.py
  goto end
)

where python3 >nul 2>nul
if %ERRORLEVEL%==0 (
  python3 local-server.py
  goto end
)

echo ERROR: Python or Node.js not found.
echo Install Python from python.org and check "Add to PATH"
echo or install Node.js from nodejs.org
echo.
pause

:end
