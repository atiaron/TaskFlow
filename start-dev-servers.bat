@echo off
title TaskFlow Development Servers Launcher
color 0A

echo.
echo ========================================
echo      TaskFlow Development Servers
echo ========================================
echo.
echo Starting Frontend and Backend servers...
echo Frontend will run on: http://localhost:3000
echo Backend will run on: http://localhost:4000
echo.
echo Press CTRL+C in each window to stop servers
echo.

REM Start Frontend Server in new window (stays on top)
echo Starting Frontend Server...
start "TaskFlow Frontend" /MAX cmd /k "cd /d \"%~dp0\" && echo Frontend Server Starting... && echo ========================== && echo TaskFlow Frontend (React) && echo Port: 3000 && echo ========================== && npm start"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Backend Server in new window (stays on top)
echo Starting Backend Server...
start "TaskFlow Backend" /MAX cmd /k "cd /d \"%~dp0server\" && echo Backend Server Starting... && echo ========================== && echo TaskFlow Backend (Node.js) && echo Port: 4000 && echo ========================== && npm start"

echo.
echo ✅ Both servers launched!
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000
echo.
echo Tip: Keep both windows open for development
echo This launcher window can be closed now.
echo.
pause
