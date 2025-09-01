@echo off
echo ========================================
echo Starting Supervisor Agent (Development)
echo ========================================

:: Start backend in background
echo Starting Python backend...
start "Backend Server" cmd /k "cd backend && python main.py"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend
echo Starting Electron frontend...
cd frontend
yarn dev

echo.
echo Development servers stopped.
pause
