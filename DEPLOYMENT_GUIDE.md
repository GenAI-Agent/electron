# 🚀 Supervisor Agent 部署指南

## 📋 三種部署方案比較

| 方案 | 用戶體驗 | 文件大小 | 依賴需求 | 適用場景 |
|------|----------|----------|----------|----------|
| **Electron 打包** | ⭐⭐⭐⭐⭐ | ~300MB | 無 | 最終用戶分發 |
| **簡單啟動器** | ⭐⭐⭐ | ~50MB | Python + Node.js | 開發/測試環境 |
| **Docker 容器** | ⭐⭐⭐⭐ | ~500MB | Docker Desktop | 服務器部署 |

## 🎯 推薦使用流程

### 1. 開發階段
```bash
# 使用簡單啟動器進行開發測試
scripts\simple-launcher.bat
```

### 2. 測試階段
```bash
# 使用 Docker 進行集成測試
scripts\docker-launcher.bat
```

### 3. 生產部署
```bash
# 構建最終的可執行應用
scripts\build-app.bat
```

## 📦 各方案詳細說明

### 方案 1: Electron 打包（推薦給最終用戶）

**使用步驟：**
1. 執行 `scripts\build-app.bat`
2. 等待構建完成（首次約 10-15 分鐘）
3. 在 `frontend\dist\` 找到安裝程式
4. 分發給用戶，雙擊安裝即可使用

**優點：**
- 用戶體驗最佳，一鍵安裝
- 無需安裝任何依賴
- 自動管理服務生命週期
- 支持自動更新

### 方案 2: 簡單啟動器（推薦給開發者）

**使用步驟：**
1. 確保安裝 Python 3.8+ 和 Node.js 16+
2. 雙擊 `scripts\simple-launcher.bat`
3. 等待自動安裝依賴和啟動服務

**優點：**
- 構建速度快
- 文件體積小
- 便於開發調試
- 依賴透明可見

### 方案 3: Docker 容器（推薦給服務器）

**使用步驟：**
1. 安裝 Docker Desktop
2. 執行 `scripts\docker-launcher.bat`
3. 訪問 http://localhost

**優點：**
- 環境隔離
- 易於擴展
- 支持集群部署
- 便於 CI/CD

## 🔧 自定義配置

### 修改端口
- **後端端口**: 修改 `backend/main.py` 中的 `uvicorn.run(port=8000)`
- **前端端口**: 修改 `frontend/package.json` 中的 `--port 4081`

### 修改應用信息
- **應用名稱**: 修改 `frontend/package.json` 中的 `productName`
- **應用圖標**: 替換 `frontend/electron/icon.ico`
- **版本號**: 修改 `frontend/package.json` 中的 `version`

## 🚨 常見問題解決

### 構建問題
1. **PyInstaller 失敗**: 檢查 Python 版本和依賴
2. **Electron 構建失敗**: 清除 node_modules 重新安裝
3. **權限問題**: 以管理員身份運行

### 運行問題
1. **後端無法啟動**: 檢查端口占用和防火牆
2. **前端白屏**: 檢查後端服務是否正常
3. **功能異常**: 查看開發者工具控制台

## 📈 性能優化建議

1. **減小打包體積**:
   - 移除不必要的 Python 包
   - 優化前端資源
   - 使用 UPX 壓縮

2. **提升啟動速度**:
   - 預編譯 Python 模塊
   - 優化 Electron 預加載
   - 使用 SSD 存儲

3. **內存優化**:
   - 限制 Python 進程內存
   - 優化前端組件渲染
   - 定期清理緩存

## 🔄 更新策略

### 自動更新（Electron）
- 配置 electron-updater
- 設置更新服務器
- 實現增量更新

### 手動更新
- 提供版本檢查 API
- 下載新版本覆蓋
- 保留用戶數據

## 📊 監控和日誌

### 日誌收集
- 後端：使用 Python logging
- 前端：使用 Electron 日誌
- 錯誤：集成錯誤報告服務

### 性能監控
- CPU 和內存使用率
- 響應時間統計
- 用戶行為分析
