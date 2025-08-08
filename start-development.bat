@echo off
setlocal EnableDelayedExpansion

title TaskFlow Developer Console
color 0E

echo.
echo ██████████████████████████████████████████
echo ██                                      ██
echo ██           TaskFlow DevMode           ██
echo ██        Frontend + Backend           ██
echo ██                                      ██
echo ██████████████████████████████████████████
echo.

REM Check prerequisites
echo 🔍 Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Install from https://nodejs.org
    pause && exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found! Install Node.js first
    pause && exit /b 1
)

echo ✅ Node.js: 
node --version
echo ✅ npm: 
npm --version

echo.
echo 🚀 Starting TaskFlow Development Environment...
echo.

REM Frontend Server - Always on top, maximized
echo 🌐 Launching Frontend Server (localhost:3000)...
start "🌐 TaskFlow Frontend" /MAX powershell -WindowStyle Normal -Command ^
"& { ^
    $Host.UI.RawUI.WindowTitle = '🌐 TaskFlow Frontend - Port 3000'; ^
    Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\"user32.dll\")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags); [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1); public static readonly uint SWP_NOMOVE = 0x0002; public static readonly uint SWP_NOSIZE = 0x0001; }'; ^
    $hwnd = [Win32]::GetForegroundWindow(); ^
    [Win32]::SetWindowPos($hwnd, [Win32]::HWND_TOPMOST, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE); ^
    Write-Host ''; ^
    Write-Host '========================================' -ForegroundColor Green; ^
    Write-Host '    🌐 TaskFlow Frontend Server' -ForegroundColor Cyan; ^
    Write-Host '    Port: 3000' -ForegroundColor Yellow; ^
    Write-Host '    URL: http://localhost:3000' -ForegroundColor Magenta; ^
    Write-Host '    Status: STARTING...' -ForegroundColor Green; ^
    Write-Host '========================================' -ForegroundColor Green; ^
    Write-Host ''; ^
    cd '%~dp0'; ^
    $env:BROWSER='none'; ^
    npm start; ^
}"

timeout /t 3 /nobreak >nul

REM Backend Server - Always on top, maximized  
echo 🔧 Launching Backend Server (localhost:4000)...
start "🔧 TaskFlow Backend" /MAX powershell -WindowStyle Normal -Command ^
"& { ^
    $Host.UI.RawUI.WindowTitle = '🔧 TaskFlow Backend - Port 4000'; ^
    Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\"user32.dll\")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags); [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1); public static readonly uint SWP_NOMOVE = 0x0002; public static readonly uint SWP_NOSIZE = 0x0001; }'; ^
    $hwnd = [Win32]::GetForegroundWindow(); ^
    [Win32]::SetWindowPos($hwnd, [Win32]::HWND_TOPMOST, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE); ^
    Write-Host ''; ^
    Write-Host '========================================' -ForegroundColor Red; ^
    Write-Host '    🔧 TaskFlow Backend Server' -ForegroundColor Cyan; ^
    Write-Host '    Port: 4000' -ForegroundColor Yellow; ^
    Write-Host '    URL: http://localhost:4000' -ForegroundColor Magenta; ^
    Write-Host '    Status: STARTING...' -ForegroundColor Red; ^
    Write-Host '========================================' -ForegroundColor Red; ^
    Write-Host ''; ^
    cd '%~dp0server'; ^
    npm run dev; ^
}"

echo.
echo ✅ Development environment launched!
echo.
echo 📋 Server Information:
echo    🌐 Frontend: http://localhost:3000
echo    🔧 Backend:  http://localhost:4000
echo.
echo 💡 Development Tips:
echo    • Both servers will auto-reload on file changes
echo    • Keep server windows open during development  
echo    • Check server windows for errors and logs
echo    • Use Ctrl+C in server windows to stop
echo    • Run stop-servers.bat to stop all servers
echo.
echo 🎉 Happy coding!
echo.
echo Press any key to close this launcher...
pause >nul
