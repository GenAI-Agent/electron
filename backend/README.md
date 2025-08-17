# SupervisorAgent Backend

基於 Claude 架構的智能瀏覽器控制系統後端服務。

## 🌟 特性

- **完全模仿 Claude 的工作方式**：信息收集 → 分析規劃 → 執行操作 → 驗證結果 → 記憶更新
- **智能記憶系統**：短期、工作、長期記憶管理，支持語義搜索
- **規則引擎**：靈活的權限控制和安全約束
- **工具管理**：模塊化的瀏覽器控制工具
- **會話管理**：多用戶會話支持
- **RESTful API**：完整的 API 接口

## 🏗️ 架構設計

```
SupervisorAgent/
├── core/                    # 核心模組
│   ├── supervisor_agent.py  # 主要 Agent 實現
│   ├── execution_context.py # 執行上下文管理
│   ├── agent_session.py     # 會話管理
│   └── config.py           # 配置管理
├── memory/                  # 記憶系統
│   ├── memory_system.py     # 記憶系統主實現
│   ├── memory_types.py      # 記憶類型定義
│   └── memory_storage.py    # 記憶存儲
├── rules/                   # 規則引擎
│   ├── rules_engine.py      # 規則引擎主實現
│   ├── rule.py             # 規則定義
│   └── rule_evaluation.py  # 規則評估
├── tools/                   # 工具系統
│   ├── tool_manager.py      # 工具管理器
│   ├── base_tool.py         # 工具基類
│   ├── browser_tools.py     # 瀏覽器工具
│   └── browser_state.py     # 瀏覽器狀態
└── utils/                   # 工具模組
    ├── logger.py           # 日誌系統
    └── exceptions.py       # 異常定義
```

## 🚀 快速開始

### 環境要求

- Python 3.11+
- SQLite 3
- Node.js 18+ (用於 Electron 瀏覽器控制)

### 安裝依賴

```bash
# 創建虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt
```

### 環境變量配置

創建 `.env` 文件：

```bash
# LLM API 密鑰
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# 安全密鑰
SECRET_KEY=your_secret_key

# 可選配置
SUPERVISOR_AGENT_DEBUG=true
SUPERVISOR_AGENT_HOST=localhost
SUPERVISOR_AGENT_PORT=8000
SUPERVISOR_AGENT_LOG_LEVEL=INFO
```

### 啟動服務

```bash
# 開發模式
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# 生產模式
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 驗證安裝

```bash
# 健康檢查
curl http://localhost:8000/api/health

# API 信息
curl http://localhost:8000/api/info
```

## 📖 API 文檔

啟動服務後，訪問以下地址查看 API 文檔：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 主要 API 端點

#### 處理用戶請求

```bash
POST /api/process
Content-Type: application/json

{
  "user_id": "user123",
  "query": "請幫我打開 Google 並截圖",
  "session_id": "optional-session-id"
}
```

#### 會話管理

```bash
# 列出會話
GET /api/sessions?user_id=user123

# 獲取會話詳情
GET /api/sessions/{session_id}

# 獲取對話歷史
GET /api/sessions/{session_id}/history
```

#### 記憶系統

```bash
# 創建記憶
POST /api/memory/remember
{
  "user_id": "user123",
  "content": {"type": "note", "text": "重要信息"},
  "memory_type": "long_term",
  "tags": ["important"]
}

# 檢索記憶
GET /api/memory/recall?user_id=user123&query=重要信息
```

## ⚙️ 配置說明

### 主配置文件 (config/config.yaml)

```yaml
# 應用基本配置
app:
  name: "SupervisorAgent"
  version: "2.0.0"
  debug: false
  host: "localhost"
  port: 8000

# 記憶系統配置
memory:
  db_path: "data/memory.db"
  max_short_term_memories: 50
  max_working_memories: 20
  max_long_term_index: 1000

# 規則引擎配置
rules:
  rules_file: "config/rules.yaml"
  enable_rules: true
  default_action: "allow"

# 工具系統配置
tools:
  electron_api_url: "http://localhost:3001"
  default_timeout: 30
```

### 規則配置 (config/rules.yaml)

定義 Agent 操作的安全規則和約束：

```yaml
rules:
  - id: "https_only"
    name: "僅允許 HTTPS 連接"
    type: "permission"
    conditions:
      url_pattern: "^https://.*"
    action: "allow"
    priority: 90
    enabled: true
```

## 🔧 開發指南

### 添加新工具

1. 繼承 `BaseTool` 類：

```python
from supervisor_agent.tools import BaseTool, ToolExecutionResult

class MyCustomTool(BaseTool):
    @property
    def name(self) -> str:
        return "my_custom_tool"
    
    @property
    def description(self) -> str:
        return "我的自定義工具"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "param1": {"type": "string", "description": "參數1"}
            },
            "required": ["param1"]
        }
    
    async def execute(self, parameters: Dict[str, Any], context) -> ToolExecutionResult:
        # 實現工具邏輯
        return ToolExecutionResult(
            success=True,
            data={"result": "success"},
            message="工具執行成功",
            execution_time=0,
            tool_name=self.name,
            parameters=parameters
        )
```

2. 註冊工具：

```python
from supervisor_agent.tools import ToolManager

tool_manager = ToolManager(config)
tool_manager.register_tool(MyCustomTool())
```

### 添加新規則

在 `config/rules.yaml` 中添加規則：

```yaml
- id: "my_custom_rule"
  name: "我的自定義規則"
  type: "permission"
  conditions:
    custom_condition: "value"
  action: "allow"
  priority: 50
  enabled: true
  description: "自定義規則描述"
```

### 擴展記憶系統

```python
from supervisor_agent.memory import MemorySystem, MemoryType

# 創建記憶
await memory_system.remember(
    user_id="user123",
    content={"type": "custom", "data": "..."},
    memory_type=MemoryType.LONG_TERM,
    tags=["custom"],
    importance=0.8
)

# 檢索記憶
result = await memory_system.recall(
    query="搜索查詢",
    user_id="user123",
    memory_types=[MemoryType.LONG_TERM],
    limit=10
)
```

## 🧪 測試

```bash
# 運行所有測試
python -m pytest tests/

# 運行特定測試
python -m pytest tests/test_memory.py

# 生成覆蓋率報告
python -m pytest --cov=supervisor_agent tests/
```

## 📊 監控和日誌

### 日誌配置

日誌配置在 `config/config.yaml` 中：

```yaml
logging:
  level: "INFO"
  file:
    enabled: true
    path: "data/logs/supervisor_agent.log"
    rotation: "1 day"
    retention: "30 days"
```

### 健康檢查

```bash
# 基本健康檢查
GET /api/health

# 詳細系統狀態
GET /api/health/metrics
```

### 性能監控

```bash
# Agent 統計
GET /api/agent/stats

# 工具統計
GET /api/tools/stats/summary

# 會話統計
GET /api/sessions/stats/summary
```

## 🔒 安全考慮

1. **API 安全**：
   - 啟用 CORS 保護
   - 實施速率限制
   - 輸入驗證和清理

2. **規則引擎**：
   - 默認拒絕策略
   - 多層安全檢查
   - 敏感操作確認

3. **數據保護**：
   - 敏感信息過濾
   - 加密存儲
   - 訪問日誌記錄

## 🚀 部署

### Docker 部署

```bash
# 構建鏡像
docker build -t supervisor-agent .

# 運行容器
docker run -d \
  --name supervisor-agent \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  -v $(pwd)/data:/app/data \
  supervisor-agent
```

### 生產環境配置

1. 設置環境變量
2. 配置反向代理 (Nginx)
3. 設置 SSL 證書
4. 配置監控和告警
5. 設置自動備份

## 🤝 貢獻

1. Fork 項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打開 Pull Request

## 📄 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 📞 支持

如有問題或建議，請：

1. 查看 [文檔](docs/)
2. 搜索 [Issues](https://github.com/your-repo/issues)
3. 創建新的 Issue
4. 聯繫維護者

---

**SupervisorAgent** - 讓瀏覽器控制變得智能而安全 🚀
