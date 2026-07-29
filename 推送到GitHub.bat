@echo off
cd /d "%~dp0"
echo ========================================
echo   六爻排盘 - 推送到 GitHub
echo ========================================
echo.

echo [1/3] 添加所有改动...
git add .

echo [2/3] 提交到本地仓库...
git commit -m "更新 %date% %time%"

echo [3/3] 推送到 GitHub...
git push origin main

echo.
echo ========================================
echo   推送完成！
echo   访问: https://a584337921.github.io/liuyao/
echo ========================================
echo.
echo === 最近3次提交 ===
git log --oneline -3
echo.
pause
