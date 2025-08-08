@echo off
title TaskFlow Development Environment
color 0B

echo.
echo =========================================
echo    TaskFlow Development Environment
echo =========================================
echo.
echo Setting up development environment...
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

echo.
echo Installing dependencies if needed...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

if not exist "server\node_modules" (
    echo Installing backend dependencies...
    cd server
    npm install
    cd ..
)

echo.
echo ========================================
echo       Starting Development Servers
echo ========================================
echo.

REM Start Frontend with always on top
echo 🚀 Starting Frontend (React) on port 3000...
start "TaskFlow Frontend - KEEP OPEN" /REALTIME cmd /k "title TaskFlow Frontend Server && color 0A && echo. && echo ================================== && echo    TaskFlow Frontend Server && echo    Port: 3000 && echo    Status: RUNNING && echo ================================== && echo. && cd /d \"%~dp0\" && set BROWSER=none && npm start"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Start Backend with always on top  
echo 🚀 Starting Backend (Node.js) on port 4000...
start "TaskFlow Backend - KEEP OPEN" /REALTIME cmd /k "title TaskFlow Backend Server && color 0C && echo. && echo ================================== && echo    TaskFlow Backend Server && echo    Port: 4000 && echo    Status: RUNNING && echo ================================== && echo. && cd /d \"%~dp0server\" && npm start"

echo.
echo ✅ Development environment ready!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:4000
echo.
echo 📋 Development Tips:
echo   • Keep both server windows open
echo   • Changes auto-reload in development
echo   • Check server windows for errors
echo   • Use Ctrl+C to stop servers
echo.
echo Happy coding! 🎉
echo.
pause
