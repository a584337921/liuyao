@echo off
cd /d "%~dp0"
echo 正在保存到 Git...
git add .
git commit -m "备份"
echo.
echo ===== 最近3条记录 =====
git log --oneline -3
echo.
echo 备份完成
echo.
pause
