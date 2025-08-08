@echo off
echo 🚀 Starting TaskFlow Development Environment with Unified Auth System
echo.

REM הגדרת משתני סביבה לפיתוח
set NODE_ENV=development
set REACT_APP_ENV=development

echo 🔧 Environment: %NODE_ENV%
echo 🎯 Auth Mode: Mock (Development)
echo.

REM תחילה npm install אם צריך
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    echo.
)

echo 🌐 Starting frontend development server...
echo 📍 URL: http://localhost:3000
echo 🔐 Auth: MockAuth (Development Mode)
echo.

npm start

pause
