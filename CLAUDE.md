# CLAUDE.md

此文件為 Claude Code (claude.ai/code) 在本倉庫工作時提供指導。

## 開發命令

### 前端 (Electron + Next.js)

```bash
cd frontend
bun dev                    # 啟動 Next.js 開發服務器 + Electron 應用
bun dev:next              # 僅啟動 Next.js 開發服務器（端口 4081）
bun dev:electron          # 僅啟動 Electron（等待 Next.js）
bun build                 # 構建 Next.js 生產版本
bun build:electron        # 構建完整的 Electron 分發應用
bun start                 # 構建並啟動生產版 Electron 應用
bun lint                  # 運行 ESLint
```

### 後端 (FastAPI + LangGraph)

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8021  # 開發服務器
python main.py            # 運行並檢查啟動和日誌
python -m pytest tests/   # 運行測試（如果可用）
```

### 向量數據庫 (Weaviate)

```bash
cd backend/vectordb
python start_weaviate.py setup    # 設置 .env 配置
python start_weaviate.py start    # 啟動 Weaviate 服務
python start_weaviate.py stop     # 停止 Weaviate 服務
python start_weaviate.py status   # 檢查服務狀態
```

## 架構概述

這是一個 **Supervisor Agent** 系統，結合了 Electron 桌面自動化和 AI 驅動的瀏覽器控制。系統實現智能網頁自動化，具備記憶、規則引擎和向量數據庫功能。

### 核心組件

**前端 (Electron + Next.js + Tailwind V4)**

- `frontend/electron/main.js` - Electron 主進程，包含 webview 控制 API
- `frontend/src/components/BrowserView.tsx` - 核心瀏覽器控制組件
- `frontend/src/pages/browser.tsx` - 主要瀏覽器自動化界面
- 基於 webview 的自定義瀏覽器控制，繞過 Electron 標準限制
- 使用 Tailwind V4 + Lucide React 圖標系統

**後端 (Python FastAPI + LangGraph)**

- `backend/main.py` - FastAPI 服務器，包含監督代理初始化
- `backend/supervisor_agent/core/supervisor_agent.py` - 基於 LangGraph 的主要 AI 代理
- `backend/api/routers/` - 代理和規則管理的 API 端點
- `backend/vectordb/` - Weaviate 向量數據庫集成的記憶系統

**關鍵架構模式**

- **瀏覽器控制**: 使用 webview.executeJavaScript() 進行直接 DOM 操作，而非 Electron 標準 API
- **記憶系統**: 三層記憶（工作、會話、長期）與向量搜索
- **規則引擎**: `data/rules/` 中基於 JSON 的規則定義用於代理行為
- **工具系統**: 由 `tool_manager.py` 管理的模塊化瀏覽器自動化工具

### 瀏覽器控制創新

此項目解決了 Electron 的關鍵限制問題：當內容在 webview 元素內時，標準瀏覽器控制 API 失效。解決方案：

1. **直接 webview 操作** 通過 `webview.executeJavaScript()`
2. **統一 API 暴露** 通過 `window.browserControl` 全局對象
3. **上下文感知執行** 在正確的 DOM 範圍內操作

瀏覽器控制的關鍵文件：

- `frontend/electron/main.js:262-442` - 內部瀏覽器控制函數
- `frontend/src/components/BrowserView.tsx` - React 組件包裝器
- `docs/electron-browser-automation-solution.md` - 完整技術解決方案

### 記憶與上下文管理

系統實現了複雜的記憶架構：

- **工作記憶**: 當前任務上下文和即時狀態
- **會話記憶**: 對話歷史和最近交互
- **長期記憶**: 用戶偏好和歷史模式
- **向量數據庫**: 通過 Weaviate 進行語義搜索和檢索

記憶在會話間持久化，實現上下文感知的自動化。

### 環境設置

必需的環境變量（在 backend/ 中創建 `.env`）：

```bash
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_API_KEY=your_key
SECRET_KEY=your_secret_key
```

如果未配置 Azure OpenAI，系統會優雅地回退到模擬 LLM。

## 開發注意事項

- 使用 **bun** 作為包管理器（用戶偏好）
- 前端運行在端口 4081，後端 API 在端口 8000
- 使用 **Tailwind V4** 進行樣式開發，已移除 MUI 依賴
- 圖標使用 **Lucide React**，樣式工具使用 `clsx`
- `src/utils/cn.ts` 提供樣式類名合併工具函數
- Weaviate 在由 vectordb 系統管理的 Docker 容器中運行
- 所有瀏覽器自動化都通過 webview 控制系統，而非標準 Electron API
- 規則存儲為 `data/rules/` 中的 JSON 文件並動態加載
- 系統支持前端和後端開發的熱重載
- 參考 `MUI_TO_TAILWIND_MIGRATION_GUIDE.md` 進行組件樣式開發
