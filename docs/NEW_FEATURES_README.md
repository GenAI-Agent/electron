# 🚀 新功能說明文檔

## 📋 功能概覽

本次更新添加了三個主要功能：

1. **Frontend 刷新 Session 功能** - 左上角刷新按鈕
2. **Task Memory 系統** - 支持批次處理和循環任務
3. **繪圖可視化系統** - 完整的圖表創建和顯示功能

---

## 1. 🔄 Frontend 刷新 Session 功能

### 功能描述
在 Agent Panel 左上角添加了刷新按鈕，可以創建新的 session 並清空當前對話記錄。

### 使用方法
- 點擊 Agent Panel 左上角的 🔄 刷新按鈕
- 系統會自動創建新的 session ID
- 清空當前的對話記錄和狀態

### 技術實現
- 使用 `sessionManager.createNewSession()` 創建新會話
- 清空 `messages`、`streamResponse`、`currentRule`、`usedTools` 等狀態
- 保持 session 隔離，確保數據不會混淆

---

## 2. 🧠 Task Memory 系統

### 功能描述
完整的任務記憶管理系統，支持：
- 批次處理任務（可處理1000+筆資料）
- 循環任務執行
- 中間結果保存到 tmp 空間
- 任務進度追蹤和恢復
- Tool result 累積

### 核心組件

#### TaskMemoryManager
- `create_batch_task()`: 創建批次處理任務
- `process_batch_task()`: 執行批次處理
- `get_task_status()`: 獲取任務狀態
- `pause_task()` / `resume_task()`: 暫停/恢復任務

#### SessionStorage
- `save_temp_data()`: 保存暫存數據到 tmp 空間
- `load_temp_data()`: 載入暫存數據
- 支持會話級別的數據隔離

#### 可用工具
- `create_batch_task_tool`: 創建批次任務
- `get_task_status_tool`: 查詢任務狀態
- `save_temp_data_tool`: 保存暫存數據
- `load_temp_data_tool`: 載入暫存數據
- `list_session_tasks_tool`: 列出會話任務
- `pause_task_tool` / `resume_task_tool`: 暫停/恢復任務
- `generate_task_report_tool`: 生成任務報告

### 使用範例

```python
# 創建批次任務處理1000筆資料
await create_batch_task_tool(
    session_id="my_session",
    task_id="process_1000_items", 
    items=data_list,  # 1000筆資料
    batch_size=50     # 每批處理50筆
)

# 保存中間結果
await save_temp_data_tool(
    session_id="my_session",
    data_id="processed_results",
    data={"results": processed_data, "count": 500}
)
```

---

## 3. 📊 繪圖可視化系統

### 功能描述
完整的圖表創建和顯示系統，支持：
- 多種圖表類型（線圖、柱狀圖、散點圖、圓餅圖）
- 圖表文件管理
- Electron 中的圖表顯示
- 圖表下載和縮放功能

### 支持的圖表類型

#### 線圖 (Line Chart)
```python
await create_line_chart_tool(
    data=[{"x": 1, "y": 10}, {"x": 2, "y": 15}],
    x_column="x",
    y_column="y", 
    title="銷售趨勢圖"
)
```

#### 柱狀圖 (Bar Chart)
```python
await create_bar_chart_tool(
    data=[{"category": "A", "value": 100}],
    x_column="category",
    y_column="value",
    title="分類統計圖"
)
```

#### 散點圖 (Scatter Plot)
```python
await create_scatter_plot_tool(
    data=[{"x": 1, "y": 10}, {"x": 2, "y": 15}],
    x_column="x", 
    y_column="y",
    title="相關性分析圖"
)
```

#### 圓餅圖 (Pie Chart)
```python
await create_pie_chart_tool(
    data=[{"label": "A", "value": 30}],
    label_column="label",
    value_column="value",
    title="比例分布圖"
)
```

### Frontend 圖表查看器

#### 新增圖表面板
- 在 Agent Panel 右上角添加了 📊 圖表按鈕
- 點擊可切換到圖表查看模式
- 顯示當前會話的所有圖表

#### 圖表功能
- 圖表縮略圖網格顯示
- 點擊圖表可全屏預覽
- 支持圖表縮放（0.5x - 3x）
- 圖表下載功能
- 圖表類型標籤和元數據顯示

---

## 🛠️ 安裝和配置

### 1. 安裝繪圖依賴

```bash
cd backend
python install_plotting_deps.py
```

### 2. 測試新功能

```bash
cd backend  
python test_new_features.py
```

### 3. 啟動系統

```bash
# 後端
cd backend
python -m uvicorn main:app --reload

# 前端
cd frontend
npm run dev
```

---

## 🎯 使用場景

### 場景1: 大量數據處理
```
用戶: "幫我處理這1000筆客戶數據，分析每個客戶的購買模式"

Agent會:
1. 使用 create_batch_task_tool 創建批次任務
2. 每批處理50筆數據
3. 使用 save_temp_data_tool 保存中間結果
4. 最終生成完整的分析報告
```

### 場景2: 數據可視化
```
用戶: "根據銷售數據創建一個趨勢圖"

Agent會:
1. 分析數據結構
2. 使用 create_line_chart_tool 創建線圖
3. 圖表自動保存到會話目錄
4. 用戶可在圖表面板查看和下載
```

### 場景3: 長時間任務管理
```
用戶: "開始處理大批量數據，我需要暫停一下"

Agent會:
1. 使用 pause_task_tool 暫停當前任務
2. 保存當前進度到 tmp 空間
3. 稍後使用 resume_task_tool 恢復任務
4. 從上次停止的地方繼續處理
```

---

## 🔧 技術架構

### Task Memory 架構
```
TaskMemoryManager
├── SessionStorage (會話存儲)
│   ├── sessions/          # 會話目錄
│   ├── global_cache/      # 全局緩存
│   ├── data_tables/       # 重要資料表
│   └── batch_processing/  # 批次處理
└── ProgressTracker (進度追蹤)
    ├── 任務狀態管理
    ├── 檢查點機制
    └── 進度持久化
```

### 繪圖系統架構
```
Plotting System
├── Backend Tools
│   ├── matplotlib/seaborn 圖表生成
│   ├── 圖表文件管理
│   └── 會話級別圖表存儲
└── Frontend Viewer
    ├── ChartViewer 組件
    ├── 圖表網格顯示
    ├── 全屏預覽功能
    └── 下載和縮放功能
```

---

## 📝 注意事項

1. **繪圖依賴**: 首次使用需要安裝 matplotlib、seaborn 等依賴
2. **文件權限**: 確保 tmp 目錄有寫入權限
3. **會話隔離**: 不同會話的數據和圖表是隔離的
4. **內存管理**: 大批量數據處理時注意內存使用
5. **圖表格式**: 目前支持 PNG 格式，DPI 300

---

## 🚀 未來擴展

1. **更多圖表類型**: 熱力圖、箱線圖、雷達圖等
2. **交互式圖表**: 使用 Plotly 創建交互式圖表
3. **圖表模板**: 預設的圖表樣式和主題
4. **批量圖表**: 一次創建多個相關圖表
5. **圖表動畫**: 支持動態圖表和時間序列動畫

---

## 🐛 故障排除

### 常見問題

1. **繪圖工具不可用**
   - 運行 `python install_plotting_deps.py`
   - 檢查 Python 環境和包管理器

2. **圖表不顯示**
   - 檢查文件路徑權限
   - 確認 Electron 可以訪問臨時目錄

3. **任務記憶失效**
   - 檢查 task_memory 目錄權限
   - 確認會話 ID 正確

4. **刷新按鈕無效**
   - 檢查 sessionManager 是否正確初始化
   - 確認 localStorage 可用

---

## 📞 支持

如有問題，請檢查：
1. 運行 `python test_new_features.py` 進行診斷
2. 查看後端日誌輸出
3. 檢查瀏覽器控制台錯誤
4. 確認所有依賴已正確安裝
