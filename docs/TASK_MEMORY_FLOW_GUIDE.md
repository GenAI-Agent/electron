# 🔄 Supervisor Agent 循環任務詳細流程

## 📋 完整流程圖

```
用戶輸入 → Agent判斷 → 創建批次任務 → 循環處理 → 狀態更新 → 最終報告
    ↓           ↓           ↓           ↓           ↓           ↓
"處理1000筆"  識別大量數據   create_batch   每批50筆     save_temp    generate_report
```

## 🎯 詳細流程說明

### 階段1: 任務識別
**用戶輸入**:
```
"幫我處理這個包含1000筆客戶資料的CSV文件，分析每個客戶的購買模式"
```

**Agent 內部判斷邏輯**:
```python
# Supervisor Agent 的 supervisor_node 會分析用戶需求
if "大量數據" or "1000筆" or "批次" in user_query:
    # 決定使用批次處理工具
    tools_to_use = ["create_batch_task_tool"]
```

### 階段2: 批次任務創建
**Agent 調用工具的 Prompt**:
```
我需要處理1000筆客戶資料，這是大量數據處理任務。

調用 create_batch_task_tool:
- session_id: "session_20241218_001"
- task_id: "customer_analysis_batch"  
- items: [1000筆客戶資料的列表]
- batch_size: 50  # 每批處理50筆
```

**工具回傳結果**:
```json
{
  "success": true,
  "task_info": {
    "task_id": "customer_analysis_batch",
    "session_id": "session_20241218_001", 
    "total_items": 1000,
    "batch_size": 50,
    "total_batches": 20,
    "status": "created",
    "created_at": "2024-12-18T10:00:00",
    "progress": {
      "processed_items": 0,
      "current_batch": 0,
      "success_count": 0,
      "error_count": 0,
      "completion_percentage": 0
    }
  }
}
```

### 階段3: 循環處理 (每批次)

**批次1 - Agent Prompt**:
```
開始處理批次 1/20:
- 處理項目: 1-50 (共50筆客戶資料)
- 任務: 分析購買模式
- 當前進度: 0/1000 (0%)

對每筆客戶資料執行:
1. 提取購買歷史
2. 計算購買頻率
3. 分析購買偏好
4. 生成客戶標籤

處理完成後保存中間結果。
```

**批次處理完成後 - 保存結果**:
```python
# Agent 自動調用 save_temp_data_tool
await save_temp_data_tool(
    session_id="session_20241218_001",
    data_id="batch_1_results",
    data={
        "batch_number": 1,
        "processed_items": 50,
        "results": [
            {"customer_id": "C001", "pattern": "高頻購買", "preference": "電子產品"},
            {"customer_id": "C002", "pattern": "季節性購買", "preference": "服飾"},
            # ... 48 more results
        ],
        "batch_summary": {
            "high_frequency": 15,
            "seasonal": 20, 
            "occasional": 15
        },
        "timestamp": "2024-12-18T10:05:00"
    }
)
```

**狀態更新 (自動執行)**:
```python
# TaskMemoryManager 自動更新進度
self.tracker.update_progress(
    session_id="session_20241218_001",
    task_id="customer_analysis_batch",
    processed_items=50,      # 已處理50筆
    current_batch=1,         # 當前批次1
    success_count=48,        # 成功48筆
    error_count=2           # 失敗2筆
)
```

**批次2 - Agent Prompt**:
```
繼續處理批次 2/20:
- 處理項目: 51-100 (共50筆客戶資料)  
- 當前進度: 50/1000 (5%)
- 上批次結果: 48成功, 2失敗
- 累積結果已保存到 tmp 空間

載入上批次的分析模式，繼續處理...
```

### 階段4: 中間狀態查詢

**Agent 可隨時查詢狀態**:
```python
# 調用 get_task_status_tool
status = await get_task_status_tool(
    session_id="session_20241218_001",
    task_id="customer_analysis_batch"
)
```

**狀態回傳**:
```json
{
  "success": true,
  "task_status": {
    "task_id": "customer_analysis_batch",
    "status": "running",
    "progress": {
      "processed_items": 500,
      "total_items": 1000,
      "current_batch": 10,
      "total_batches": 20,
      "success_count": 485,
      "error_count": 15,
      "completion_percentage": 50.0
    },
    "estimated_remaining_time": "5 minutes",
    "last_checkpoint": "batch_10_completed"
  }
}
```

### 階段5: 結果累積和最終報告

**最後批次完成後**:
```python
# Agent 載入所有批次結果
all_results = []
for batch_num in range(1, 21):  # 20個批次
    batch_data = await load_temp_data_tool(
        session_id="session_20241218_001",
        data_id=f"batch_{batch_num}_results"
    )
    all_results.extend(batch_data["results"])

# 生成最終報告
final_report = {
    "total_customers": 1000,
    "successfully_analyzed": 985,
    "failed_analysis": 15,
    "patterns_found": {
        "high_frequency": 300,
        "seasonal": 450,
        "occasional": 235
    },
    "recommendations": [...]
}
```

## 🔧 關鍵技術點

### 1. 狀態持久化
- 每批次結果自動保存到 `task_memory/sessions/{session_id}/temp_data/`
- 進度信息保存到 `task_memory/sessions/{session_id}/task_states/`
- 支持任務中斷後恢復

### 2. 錯誤處理
```python
# 如果某批次失敗，不會影響整個任務
try:
    batch_results = process_batch(batch_data)
except Exception as e:
    # 記錄錯誤，繼續下一批次
    error_log = {
        "batch": batch_num,
        "error": str(e),
        "timestamp": datetime.now()
    }
    save_temp_data(session_id, f"error_batch_{batch_num}", error_log)
```

### 3. 記憶累積
- 每批次的 tool result 都會累積保存
- Agent 可以引用之前批次的結果
- 支持跨批次的模式學習和優化

## 🎯 實際使用範例

### 範例1: 數據分析任務
```
用戶: "分析這5000筆銷售記錄，找出銷售趨勢和異常值"

Agent流程:
1. 創建批次任務 (5000筆, 每批100筆)
2. 批次1-10: 基礎統計分析 → 保存統計結果
3. 批次11-20: 趨勢分析 → 累積趨勢數據  
4. 批次21-30: 異常檢測 → 標記異常值
5. 批次31-50: 深度分析 → 生成洞察
6. 最終: 合併所有結果 → 生成完整報告
```

### 範例2: 文件處理任務
```
用戶: "處理這1000個PDF文件，提取關鍵信息並分類"

Agent流程:
1. 創建批次任務 (1000個文件, 每批20個)
2. 每批次: 讀取PDF → 提取文本 → 關鍵詞分析 → 分類
3. 中間結果: 保存每批次的分類結果和關鍵詞
4. 最終: 生成分類統計和關鍵詞雲圖
```

## 📊 監控和調試

### 查看任務進度
```python
# Agent 可以隨時報告進度
current_status = await get_task_status_tool(session_id, task_id)
print(f"進度: {current_status['progress']['completion_percentage']}%")
```

### 查看中間結果
```python
# 載入特定批次的結果
batch_5_results = await load_temp_data_tool(session_id, "batch_5_results")
```

### 任務恢復
```python
# 如果任務中斷，可以從最後一個檢查點恢復
resume_info = await resume_task_tool(session_id, task_id)
```

這就是完整的循環任務流程！Agent 會自動管理整個過程，用戶只需要提出需求即可。
