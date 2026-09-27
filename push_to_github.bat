@echo off
title Push MatiSync to GitHub (Mahdiya-Tech)
echo ===================================================
echo Pushing MatiSync repository to Mahdiya-Tech/MatiSync...
echo ===================================================
cd /d "%~dp0"
git push -u origin main
echo.
echo ===================================================
echo If successful, your repo is now live at:
echo https://github.com/Mahdiya-Tech/MatiSync
echo ===================================================
pause
