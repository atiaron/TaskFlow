@echo off
title TaskFlow Development
color 0A

echo Starting TaskFlow Development Servers...

REM Start Frontend (React)
start "Frontend" cmd /k "cd /d \"%~dp0\" && title Frontend Server && color 0A && echo Frontend running on http://localhost:3000 && npm start"

REM Wait 3 seconds
timeout /t 3 /nobreak >nul

REM Start Backend (Node.js)  
start "Backend" cmd /k "cd /d \"%~dp0server\" && title Backend Server && color 0C && echo Backend running on http://localhost:4000 && npm run dev"

echo.
echo ✅ Servers starting...
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:4000
echo.
echo Keep the server windows open!
pause
