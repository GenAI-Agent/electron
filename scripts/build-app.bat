@echo off
echo ========================================
echo Building Supervisor Agent Application
echo ========================================

:: Create necessary directories
if not exist "frontend\electron\backend" mkdir "frontend\electron\backend"

:: Step 1: Build Python backend
echo.
echo [1/4] Building Python backend...
call scripts\build-backend.bat
if errorlevel 1 (
    echo Backend build failed!
    exit /b 1
)

:: Step 2: Install frontend dependencies
echo.
echo [2/4] Installing frontend dependencies...
cd frontend
call yarn install
if errorlevel 1 (
    echo Frontend dependency installation failed!
    exit /b 1
)

:: Step 3: Build Next.js frontend
echo.
echo [3/4] Building Next.js frontend...
call yarn build
if errorlevel 1 (
    echo Frontend build failed!
    exit /b 1
)

:: Step 4: Build Electron application
echo.
echo [4/4] Building Electron application...
call yarn build:electron
if errorlevel 1 (
    echo Electron build failed!
    exit /b 1
)

cd ..
echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Your application is ready in: frontend\dist\
echo Double-click the installer to install and run your app!
pause
