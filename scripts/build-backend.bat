@echo off
echo Building Python backend...

cd backend
pyinstaller build_backend.spec --clean --noconfirm

if exist "dist\supervisor-agent-backend.exe" (
    echo Backend build successful!
    copy "dist\supervisor-agent-backend.exe" "..\frontend\electron\backend\supervisor-agent-backend.exe"
    echo Backend copied to Electron resources.
) else (
    echo Backend build failed!
    exit /b 1
)

cd ..
echo Backend build complete!
