@echo off
cd /d "%~dp0"
echo Saving to Git...
git add .
git commit -m "backup"
echo.
echo === Last 3 commits ===
git log --oneline -3
echo.
echo Done
echo.
pause
