@echo off
setlocal
cd /d "%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0Test-OfficeMetadata.ps1"
set "RC=%ERRORLEVEL%"
pause
endlocal & exit /b %RC%
