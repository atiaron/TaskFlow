@echo off
echo 🚀 Starting TaskFlow Backend Development Server
echo.

REM בדיקה אם יש תיקיית server
if not exist server (
    echo ❌ Server directory not found!
    echo Please make sure you have a backend server setup
    pause
    exit /b 1
)

echo 🔧 Environment: Development
echo 📍 Backend URL: http://localhost:4000
echo.

cd server

REM התקנת dependencies אם צריך
if not exist node_modules (
    echo 📦 Installing backend dependencies...
    npm install
    echo.
)

echo 🌐 Starting backend server...
npm run dev

pause
