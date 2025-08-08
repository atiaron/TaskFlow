@echo off
echo 🎯 Starting TaskFlow Complete Development Environment
echo 🔄 This will open 2 windows: Frontend + Backend
echo.

echo 🚀 Starting backend server...
start "TaskFlow Backend" cmd /k "cd /d "%~dp0" && start-backend-dev.bat"

timeout /t 3 /nobreak > nul

echo 🌐 Starting frontend server...
start "TaskFlow Frontend" cmd /k "cd /d "%~dp0" && start-frontend-dev.bat"

echo.
echo ✅ Both servers starting...
echo 📍 Frontend: http://localhost:3000 (with MockAuth)
echo 📍 Backend:  http://localhost:4000
echo.
echo Press any key to close this window...
pause > nul
