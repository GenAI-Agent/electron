@echo off
title Supervisor Agent Docker Launcher
echo ========================================
echo    Supervisor Agent Docker 啟動器
echo ========================================
echo.

:: 檢查 Docker 是否安裝
docker --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Docker，請先安裝 Docker Desktop
    echo 下載地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 檢查 Docker 是否運行
docker info >nul 2>&1
if errorlevel 1 (
    echo 錯誤: Docker 未運行，請啟動 Docker Desktop
    pause
    exit /b 1
)

echo [1/3] 構建 Docker 映像...
docker-compose build

if errorlevel 1 (
    echo Docker 構建失敗！
    pause
    exit /b 1
)

echo [2/3] 啟動應用容器...
docker-compose up -d

if errorlevel 1 (
    echo Docker 啟動失敗！
    pause
    exit /b 1
)

echo [3/3] 等待服務啟動...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo 應用啟動完成！
echo ========================================
echo 訪問地址: http://localhost
echo 後端 API: http://localhost/api
echo 健康檢查: http://localhost/health
echo.
echo 管理命令:
echo   查看日誌: docker-compose logs -f
echo   停止服務: docker-compose down
echo   重啟服務: docker-compose restart
echo ========================================
echo.

:: 自動打開瀏覽器
start http://localhost

echo 按任意鍵查看容器狀態...
pause

docker-compose ps
echo.
echo 按任意鍵退出...
pause
