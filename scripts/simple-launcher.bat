@echo off
title Supervisor Agent Launcher
echo ========================================
echo    Supervisor Agent 啟動器
echo ========================================
echo.

:: 檢查 Python 是否安裝
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Python，請先安裝 Python 3.8+
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 檢查 Node.js 是否安裝
node --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Node.js，請先安裝 Node.js 16+
    echo 下載地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 安裝 Python 依賴
echo [1/4] 安裝 Python 依賴...
pip install -r requirements.txt

:: 安裝前端依賴
echo [2/4] 安裝前端依賴...
cd frontend
call yarn install
cd ..

:: 啟動後端服務
echo [3/4] 啟動後端服務...
start "Supervisor Agent Backend" cmd /k "cd backend && python main.py"

:: 等待後端啟動
echo 等待後端服務啟動...
timeout /t 5 /nobreak >nul

:: 啟動前端應用
echo [4/4] 啟動前端應用...
cd frontend
start "Supervisor Agent Frontend" cmd /k "yarn start"

echo.
echo ========================================
echo 應用啟動完成！
echo 後端服務: http://localhost:8000
echo 前端應用: 將自動打開
echo ========================================
echo.
echo 關閉此視窗將停止所有服務
pause
