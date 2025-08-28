@echo off
title Stop TaskFlow Servers
color 0C

echo.
echo ========================================
echo      Stop TaskFlow Development Servers
echo ========================================
echo.

echo Stopping all Node.js processes...

REM Kill all node processes (be careful!)
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js processes stopped
) else (
    echo ℹ️ No Node.js processes were running
)

REM Kill npm processes
taskkill /f /im npm.cmd 2>nul

echo.
echo Stopping development servers on specific ports...

REM Stop processes on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do (
    taskkill /f /pid %%a 2>nul
    echo ✅ Stopped process on port 3000
)

REM Stop processes on port 4000 (Backend)  
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000"') do (
    taskkill /f /pid %%a 2>nul
    echo ✅ Stopped process on port 4000
)

echo.
echo ✅ All TaskFlow development servers stopped!
echo.
echo You can now restart them with:
echo   dev-environment.bat
echo.
pause
