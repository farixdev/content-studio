@echo off
title Content Helper

echo ==========================
echo Building project...
echo ==========================

cd /d "E:\Projects\content helper"

call npm run build

if errorlevel 1 (
    echo.
    echo Build failed!
    pause
    exit /b
)

echo.
echo Starting server...

start "" cmd /k "cd /d E:\Projects\content helper && npm start"

timeout /t 5 /nobreak >nul

start http://localhost:3000

exit