# 🚀 Enhanced Agent System Design
## 智能代理系統增強設計方案

### 📋 目標概述
基於現有的 FastAPI + LangGraph 架構，設計一個完整的解決方案來解決：
1. **循環重複任務問題** - 處理大量信件時的斷點續傳和上下文管理
2. **記憶系統整合** - 實現 user memory、conversation memory、task memory
3. **長序列任務管理** - 複雜任務的規劃和 token 限制處理
4. **分段閱讀機制** - 大型內容的並行處理和合併

---

## 🏗️ 系統架構設計

### 四層核心架構

```
Enhanced Agent System
├── 1. TaskExecutionEngine/     # 任務執行引擎
│   ├── TaskManager            # 任務生命週期管理
│   ├── ProgressTracker        # 進度追蹤和持久化
│   ├── CheckpointManager      # 斷點續傳機制
│   ├── DeduplicationService   # 任務去重
│   └── TaskScheduler          # 任務調度器
│
├── 2. MemoryManagementSystem/  # 記憶管理系統
│   ├── WorkingMemory          # 工作記憶 (當前任務)
│   ├── SessionMemory          # 會話記憶 (對話上下文)
│   ├── LongTermMemory         # 長期記憶 (用戶偏好/歷史)
│   ├── MemoryCompressor       # 智能壓縮器
│   ├── MemoryRetrieval        # 語義檢索
│   └── MemoryLifecycle        # 記憶生命週期管理
│
├── 3. ContentProcessingEngine/ # 內容處理引擎
│   ├── ContentChunker         # 智能分塊器
│   ├── ParallelProcessor      # 並行處理協調器
│   ├── ResultAggregator       # 結果合併器
│   ├── QualityAssurance       # 一致性檢查
│   └── WorkspaceManager       # 臨時工作空間管理
│
└── 4. ContextManager/          # 上下文管理器
    ├── TokenBudgetManager     # Token 預算管理
    ├── ContextWindow          # 動態上下文窗口
    ├── PriorityQueue          # 信息優先級排序
    ├── ContextOptimizer       # 上下文優化
    └── ToolResultManager      # Tool Result 生命週期
```

---

## 🎯 核心問題解決方案

### 1. 循環重複任務問題

**問題：** 處理 1000 封信件時如何避免斷點和累積無意義上下文

**解決方案：**
- **任務狀態機：** `PENDING → RUNNING → PAUSED → COMPLETED/FAILED`
- **批次處理：** 將 1000 封信件分成 50 封一批處理
- **斷點續傳：** 每處理一批自動保存檢查點
- **進度持久化：** 任務狀態存儲到數據庫，重啟後可恢復
- **智能去重：** 避免重複處理相同信件

**實現策略：**
```python
class EmailProcessingTask:
    async def process_emails_batch(self, emails: List[Email], batch_size: int = 50):
        # 1. 檢查未完成任務
        checkpoint = await self.checkpoint_manager.load_checkpoint(task_id)
        start_index = checkpoint.get('last_processed_index', 0)
        
        # 2. 分批處理
        for i in range(start_index, len(emails), batch_size):
            batch = emails[i:i+batch_size]
            results = await self.parallel_process_batch(batch)
            
            # 3. 保存檢查點
            await self.checkpoint_manager.save_checkpoint(
                task_id, {'last_processed_index': i + batch_size}
            )
            
            # 4. 清理工作記憶
            await self.memory_manager.cleanup_working_memory()
```

### 2. 記憶系統整合

**三層記憶架構：**

| 記憶層級 | 容量限制 | 生命週期 | 用途 |
|---------|---------|---------|------|
| **Working Memory** | 2K tokens | 任務期間 | 當前任務的臨時信息 |
| **Session Memory** | 5K tokens | 對話期間 | 當前對話的上下文 |
| **Long-term Memory** | Vector DB | 永久 | 用戶偏好、處理經驗 |

**記憶生命週期管理：**
```python
class MemoryManager:
    async def manage_memory_lifecycle(self, context: Dict):
        # 1. 工作記憶 → 會話記憶
        if self.working_memory.is_full():
            important_items = self.filter_by_importance(
                self.working_memory.items, threshold=0.7
            )
            await self.session_memory.store(important_items)
            await self.working_memory.clear()
        
        # 2. 會話記憶 → 長期記憶
        if self.session_memory.is_full():
            compressed_summary = await self.compress_session_memory()
            await self.long_term_memory.store_vector(compressed_summary)
```

### 3. 長序列任務管理

**Token 預算分配策略：**
```
總預算 20K tokens:
├── System Prompt: 4K tokens (20%)
├── Context Memory: 8K tokens (40%)
├── Tool Results: 6K tokens (30%)
└── Response Generation: 2K tokens (10%)
```

**智能上下文管理：**
- **動態調整：** 根據任務重要性重新分配預算
- **智能壓縮：** 保留關鍵信息，壓縮冗餘內容
- **工具結果管理：** 及時清理過期的 tool results
- **優先級排序：** 基於重要性保留最相關信息

### 4. 分段閱讀機制

**並行處理策略（你的好想法！）：**

```
50封信件 → ContentChunker → [Chunk1, Chunk2, ..., ChunkN]
                                ↓
                        ParallelProcessor
                       ↙        ↓        ↘
                LLM Instance1  LLM Instance2  LLM Instance3
                (處理Chunk1-3) (處理Chunk4-6) (處理Chunk7-N)
                       ↘        ↓        ↙
                        ResultAggregator
                              ↓
                       [合併後的摘要]
```

**實現細節：**
```python
class ParallelContentProcessor:
    async def process_large_content(self, content: str, query: str):
        # 1. 創建臨時工作空間
        workspace = await self.workspace_manager.create_workspace()
        
        # 2. 智能分塊
        chunks = await self.content_chunker.chunk_content(
            content, max_tokens=2000, overlap=200
        )
        
        # 3. 並行處理
        tasks = [
            self.process_chunk_with_llm(chunk, query, workspace.id)
            for chunk in chunks
        ]
        chunk_results = await asyncio.gather(*tasks)
        
        # 4. 合併結果
        final_result = await self.result_aggregator.merge_results(
            chunk_results, query
        )
        
        # 5. 清理工作空間
        await self.workspace_manager.cleanup_workspace(workspace.id)
        return final_result
```

---

## 🔄 完整數據流設計

### 階段 1：任務接收和分解
```
User Query → TaskAnalyzer → TaskDecomposer → TaskQueue
                ↓
        [Task: 處理1000封信件]
                ↓
    [SubTask1: 信件1-50] [SubTask2: 信件51-100] ... [SubTask20: 信件951-1000]
```

### 階段 2：內容處理和並行分析
```
WebpageData(50封信件) → ContentChunker → [語義分塊]
                                              ↓
                                    ParallelProcessor
                                   (多個LLM實例並行處理)
                                              ↓
                                    ResultAggregator
                                          ↓
                                   [統一摘要結果]
```

### 階段 3：記憶管理和狀態更新
```
ProcessedData → MemoryClassifier → [Working/Session/LongTerm Memory]
                      ↓
              ProgressTracker → CheckpointManager → 持久化存儲
```

---

## 🛠️ 與現有系統整合

### LangGraph 擴展

**擴展 State 定義：**
```python
class EnhancedAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    # 新增字段
    task_context: Dict[str, Any]      # 任務上下文
    memory_context: Dict[str, Any]    # 記憶上下文
    progress_state: Dict[str, Any]    # 進度狀態
    workspace_id: str                 # 工作空間ID
    chunk_results: List[Dict]         # 分塊處理結果
```

**新增 Graph 節點：**
```python
# 在現有 supervisor_agent.py 中添加
workflow.add_node("memory_manager", self.memory_manager_node)
workflow.add_node("content_processor", self.content_processor_node)
workflow.add_node("checkpoint_manager", self.checkpoint_manager_node)
workflow.add_node("result_aggregator", self.result_aggregator_node)

# 更新流程控制
workflow.add_conditional_edges(
    "supervisor",
    self.enhanced_should_continue,
    {
        "tools": "tools",
        "memory": "memory_manager",
        "process_content": "content_processor",
        "checkpoint": "checkpoint_manager",
        "respond": "response_generator",
        "__end__": END,
    },
)
```

### 工具系統擴展

**增強 ToolManager：**
```python
class EnhancedToolManager(ToolManager):
    async def execute_parallel_tools(self, tool_configs: List[Dict]) -> List[Dict]:
        """並行執行多個工具"""
        tasks = [
            self.execute_tool(config['name'], config['params'])
            for config in tool_configs
        ]
        return await asyncio.gather(*tasks)
    
    def manage_tool_result_lifecycle(self, result_id: str, ttl: int):
        """管理工具結果生命週期"""
        self.result_cache[result_id] = {
            'data': result_data,
            'expires_at': time.time() + ttl
        }
```

---

## 📊 詳細實現規範

### 任務管理系統

**TaskManager 類設計：**
```python
class TaskManager:
    def __init__(self, db_connection, checkpoint_manager):
        self.db = db_connection
        self.checkpoint_manager = checkpoint_manager
        self.active_tasks = {}
    
    async def create_task(self, task_config: Dict) -> str:
        """創建新任務"""
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            type=task_config['type'],
            status=TaskStatus.PENDING,
            config=task_config,
            created_at=datetime.now()
        )
        await self.db.save_task(task)
        return task_id
    
    async def execute_task(self, task_id: str):
        """執行任務"""
        task = await self.db.get_task(task_id)
        task.status = TaskStatus.RUNNING
        
        try:
            if task.type == 'email_processing':
                await self.execute_email_processing_task(task)
            elif task.type == 'content_analysis':
                await self.execute_content_analysis_task(task)
            
            task.status = TaskStatus.COMPLETED
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
        finally:
            await self.db.update_task(task)
```

**CheckpointManager 類設計：**
```python
class CheckpointManager:
    async def save_checkpoint(self, task_id: str, state: Dict):
        """保存檢查點"""
        checkpoint = Checkpoint(
            task_id=task_id,
            state=state,
            timestamp=datetime.now()
        )
        await self.db.save_checkpoint(checkpoint)

    async def load_checkpoint(self, task_id: str) -> Optional[Dict]:
        """載入檢查點"""
        checkpoint = await self.db.get_latest_checkpoint(task_id)
        return checkpoint.state if checkpoint else None

    async def cleanup_old_checkpoints(self, retention_days: int = 7):
        """清理舊檢查點"""
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        await self.db.delete_checkpoints_before(cutoff_date)
```

### 記憶管理系統

**MemoryHierarchy 類設計：**
```python
class MemoryHierarchy:
    def __init__(self, vectordb_client, config):
        self.working_memory = WorkingMemory(max_tokens=2000)
        self.session_memory = SessionMemory(max_tokens=5000)
        self.long_term_memory = LongTermMemory(vectordb_client)
        self.compressor = MemoryCompressor()

    async def store_memory(self, content: Dict, memory_type: MemoryType):
        """存儲記憶到指定層級"""
        if memory_type == MemoryType.WORKING:
            await self.working_memory.store(content)
        elif memory_type == MemoryType.SESSION:
            await self.session_memory.store(content)
        elif memory_type == MemoryType.LONG_TERM:
            await self.long_term_memory.store_vector(content)

    async def recall_memory(self, query: str, memory_types: List[MemoryType]) -> List[Dict]:
        """從指定記憶層級檢索相關記憶"""
        results = []

        if MemoryType.WORKING in memory_types:
            results.extend(await self.working_memory.search(query))
        if MemoryType.SESSION in memory_types:
            results.extend(await self.session_memory.search(query))
        if MemoryType.LONG_TERM in memory_types:
            results.extend(await self.long_term_memory.vector_search(query))

        return self._rank_by_relevance(results, query)
```

**MemoryCompressor 類設計：**
```python
class MemoryCompressor:
    async def compress_working_memory(self, memories: List[Dict]) -> Dict:
        """壓縮工作記憶"""
        # 1. 分類記憶類型
        categorized = self._categorize_memories(memories)

        # 2. 提取關鍵信息
        key_insights = await self._extract_key_insights(categorized)

        # 3. 生成壓縮摘要
        compressed = await self._generate_summary(key_insights)

        return {
            'type': 'compressed_working_memory',
            'original_count': len(memories),
            'summary': compressed,
            'key_insights': key_insights,
            'compression_ratio': len(compressed) / sum(len(str(m)) for m in memories)
        }

    async def compress_session_memory(self, session_data: Dict) -> Dict:
        """壓縮會話記憶"""
        # 提取對話要點、用戶偏好、重要決策
        conversation_summary = await self._summarize_conversation(session_data)
        user_preferences = self._extract_user_preferences(session_data)
        important_decisions = self._extract_decisions(session_data)

        return {
            'type': 'compressed_session_memory',
            'conversation_summary': conversation_summary,
            'user_preferences': user_preferences,
            'important_decisions': important_decisions,
            'session_duration': session_data.get('duration'),
            'task_completion_rate': session_data.get('completion_rate')
        }
```

### 內容處理引擎

**ContentChunker 類設計：**
```python
class ContentChunker:
    def __init__(self, max_chunk_tokens: int = 2000, overlap_tokens: int = 200):
        self.max_chunk_tokens = max_chunk_tokens
        self.overlap_tokens = overlap_tokens
        self.tokenizer = tiktoken.get_encoding("cl100k_base")

    async def chunk_content(self, content: str, content_type: str = 'email') -> List[ContentChunk]:
        """智能分塊內容"""
        if content_type == 'email':
            return await self._chunk_emails(content)
        elif content_type == 'webpage':
            return await self._chunk_webpage(content)
        else:
            return await self._chunk_generic(content)

    async def _chunk_emails(self, emails_content: str) -> List[ContentChunk]:
        """專門處理信件內容的分塊"""
        # 1. 解析信件結構
        emails = self._parse_emails(emails_content)

        # 2. 按語義邊界分組
        chunks = []
        current_chunk = []
        current_tokens = 0

        for email in emails:
            email_tokens = len(self.tokenizer.encode(str(email)))

            if current_tokens + email_tokens > self.max_chunk_tokens and current_chunk:
                # 創建當前塊
                chunks.append(ContentChunk(
                    id=f"chunk_{len(chunks)}",
                    content=current_chunk,
                    token_count=current_tokens,
                    metadata={'type': 'email_group', 'email_count': len(current_chunk)}
                ))
                current_chunk = []
                current_tokens = 0

            current_chunk.append(email)
            current_tokens += email_tokens

        # 處理最後一塊
        if current_chunk:
            chunks.append(ContentChunk(
                id=f"chunk_{len(chunks)}",
                content=current_chunk,
                token_count=current_tokens,
                metadata={'type': 'email_group', 'email_count': len(current_chunk)}
            ))

        return chunks
```

**ParallelProcessor 類設計：**
```python
class ParallelProcessor:
    def __init__(self, max_workers: int = 3, llm_config: Dict = None):
        self.max_workers = max_workers
        self.llm_config = llm_config
        self.worker_pool = []

    async def process_chunks_parallel(self, chunks: List[ContentChunk], query: str, workspace_id: str) -> List[ProcessingResult]:
        """並行處理內容塊"""
        # 1. 初始化工作池
        await self._initialize_worker_pool()

        # 2. 創建處理任務
        tasks = []
        for i, chunk in enumerate(chunks):
            worker = self.worker_pool[i % len(self.worker_pool)]
            task = self._process_single_chunk(worker, chunk, query, workspace_id)
            tasks.append(task)

        # 3. 並行執行
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 4. 處理異常結果
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # 重試機制
                retry_result = await self._retry_chunk_processing(chunks[i], query, workspace_id)
                processed_results.append(retry_result)
            else:
                processed_results.append(result)

        return processed_results

    async def _process_single_chunk(self, worker: LLMWorker, chunk: ContentChunk, query: str, workspace_id: str) -> ProcessingResult:
        """處理單個內容塊"""
        prompt = self._build_chunk_processing_prompt(chunk, query)

        try:
            response = await worker.process(prompt)

            return ProcessingResult(
                chunk_id=chunk.id,
                summary=response.get('summary'),
                key_points=response.get('key_points'),
                relevance_score=response.get('relevance_score'),
                processing_time=response.get('processing_time'),
                worker_id=worker.id
            )
        except Exception as e:
            return ProcessingResult(
                chunk_id=chunk.id,
                error=str(e),
                processing_time=0,
                worker_id=worker.id
            )
```

**ResultAggregator 類設計：**
```python
class ResultAggregator:
    async def merge_chunk_results(self, results: List[ProcessingResult], original_query: str) -> AggregatedResult:
        """合併分塊處理結果"""
        # 1. 過濾有效結果
        valid_results = [r for r in results if not r.error]

        # 2. 按相關性排序
        sorted_results = sorted(valid_results, key=lambda x: x.relevance_score, reverse=True)

        # 3. 提取關鍵信息
        all_summaries = [r.summary for r in sorted_results]
        all_key_points = []
        for r in sorted_results:
            all_key_points.extend(r.key_points)

        # 4. 生成統一摘要
        unified_summary = await self._generate_unified_summary(all_summaries, original_query)

        # 5. 去重和排序關鍵點
        deduplicated_points = await self._deduplicate_key_points(all_key_points)

        # 6. 質量評估
        quality_score = self._assess_result_quality(unified_summary, deduplicated_points)

        return AggregatedResult(
            unified_summary=unified_summary,
            key_points=deduplicated_points,
            source_chunks=len(valid_results),
            quality_score=quality_score,
            processing_stats={
                'total_chunks': len(results),
                'successful_chunks': len(valid_results),
                'failed_chunks': len(results) - len(valid_results),
                'average_relevance': sum(r.relevance_score for r in valid_results) / len(valid_results) if valid_results else 0
            }
        )
```

### 上下文管理器

**TokenBudgetManager 類設計：**
```python
class TokenBudgetManager:
    def __init__(self, total_budget: int = 20000):
        self.total_budget = total_budget
        self.budget_allocation = {
            'system_prompt': 4000,      # 20%
            'context_memory': 8000,     # 40%
            'tool_results': 6000,       # 30%
            'response_generation': 2000  # 10%
        }
        self.current_usage = {key: 0 for key in self.budget_allocation}

    async def allocate_tokens(self, component: str, requested_tokens: int) -> int:
        """為組件分配 tokens"""
        available = self.budget_allocation[component] - self.current_usage[component]
        allocated = min(requested_tokens, available)
        self.current_usage[component] += allocated
        return allocated

    async def optimize_context_for_budget(self, context: Dict) -> Dict:
        """根據預算優化上下文"""
        current_tokens = self._calculate_tokens(context)
        budget_limit = self.budget_allocation['context_memory']

        if current_tokens <= budget_limit:
            return context

        # 壓縮策略
        optimized_context = await self._compress_context(context, budget_limit)
        return optimized_context

    async def _compress_context(self, context: Dict, target_tokens: int) -> Dict:
        """壓縮上下文到目標 token 數"""
        # 1. 按重要性排序信息
        prioritized_items = self._prioritize_context_items(context)

        # 2. 選擇最重要的項目
        selected_items = []
        current_tokens = 0

        for item in prioritized_items:
            item_tokens = self._calculate_tokens(item)
            if current_tokens + item_tokens <= target_tokens:
                selected_items.append(item)
                current_tokens += item_tokens
            else:
                # 嘗試壓縮該項目
                compressed_item = await self._compress_single_item(item, target_tokens - current_tokens)
                if compressed_item:
                    selected_items.append(compressed_item)
                break

        return {'compressed_context': selected_items, 'compression_ratio': current_tokens / self._calculate_tokens(context)}
```

---

## 🚀 實現路線圖

### Phase 1: 基礎架構 (2-3 週)

**Week 1-2: 任務管理系統**
- [ ] 實現 `TaskManager` 類
- [ ] 實現 `ProgressTracker` 類
- [ ] 實現 `CheckpointManager` 類
- [ ] 集成到現有 `supervisor_agent.py`
- [ ] 添加任務狀態數據庫表
- [ ] 實現基本的斷點續傳功能

**Week 2-3: 記憶分層架構**
- [ ] 擴展現有記憶系統
- [ ] 實現 `MemoryHierarchy` 類
- [ ] 集成 vectordb 作為長期記憶
- [ ] 實現 `MemoryCompressor` 類
- [ ] 實現記憶生命週期管理
- [ ] 添加記憶檢索和語義搜索

### Phase 2: 核心功能 (3-4 週)

**Week 4-5: 並行內容處理**
- [ ] 實現 `ContentChunker` 類
- [ ] 實現 `ParallelProcessor` 類
- [ ] 實現 `WorkspaceManager` 類
- [ ] 添加 LLM 工作池管理
- [ ] 實現錯誤處理和重試機制

**Week 5-6: 結果合併和質量保證**
- [ ] 實現 `ResultAggregator` 類
- [ ] 實現 `QualityAssurance` 類
- [ ] 添加結果一致性檢查
- [ ] 實現智能去重算法
- [ ] 添加質量評估指標

**Week 6-7: 上下文管理**
- [ ] 實現 `TokenBudgetManager` 類
- [ ] 實現 `ContextOptimizer` 類
- [ ] 添加智能壓縮算法
- [ ] 實現 `ToolResultManager` 類
- [ ] 優化工具結果生命週期管理

### Phase 3: 優化和擴展 (2-3 週)

**Week 8-9: 性能優化**
- [ ] 並行處理性能調優
- [ ] 記憶檢索優化
- [ ] 數據庫查詢優化
- [ ] 緩存策略實現
- [ ] 負載均衡優化

**Week 9-10: 監控和調試**
- [ ] 添加性能監控
- [ ] 實現調試工具
- [ ] 添加日誌分析
- [ ] 實現健康檢查
- [ ] 添加錯誤追蹤

**Week 10: 高級功能**
- [ ] 智能任務調度
- [ ] 自適應壓縮算法
- [ ] 用戶偏好學習
- [ ] 預測性記憶管理
- [ ] 自動化測試套件

---

## 📊 數據庫設計

### 任務管理表

```sql
-- 任務表
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    config JSON,
    progress_data JSON,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_type_status (type, status)
);

-- 檢查點表
CREATE TABLE checkpoints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    state JSON NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_timestamp (task_id, timestamp)
);

-- 任務依賴表
CREATE TABLE task_dependencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_task_id VARCHAR(36) NOT NULL,
    child_task_id VARCHAR(36) NOT NULL,
    dependency_type ENUM('SEQUENTIAL', 'PARALLEL', 'CONDITIONAL') DEFAULT 'SEQUENTIAL',
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (child_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dependency (parent_task_id, child_task_id)
);
```

### 記憶管理表

```sql
-- 工作記憶表
CREATE TABLE working_memory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    content JSON NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_session_importance (session_id, importance_score),
    INDEX idx_expires (expires_at)
);

-- 會話記憶表
CREATE TABLE session_memory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    compressed_content JSON NOT NULL,
    summary TEXT,
    key_insights JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_session (user_id, session_id)
);

-- 長期記憶元數據表 (向量存儲在 Weaviate)
CREATE TABLE long_term_memory_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    vector_id VARCHAR(100) NOT NULL,
    content_type VARCHAR(50),
    tags JSON,
    importance_score FLOAT,
    access_count INT DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_type (user_id, content_type),
    INDEX idx_importance (importance_score),
    UNIQUE KEY unique_vector (vector_id)
);
```

### 內容處理表

```sql
-- 工作空間表
CREATE TABLE workspaces (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    task_id VARCHAR(36),
    status ENUM('ACTIVE', 'COMPLETED', 'EXPIRED') DEFAULT 'ACTIVE',
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_expires (expires_at)
);

-- 內容塊表
CREATE TABLE content_chunks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id VARCHAR(36) NOT NULL,
    chunk_id VARCHAR(100) NOT NULL,
    content LONGTEXT NOT NULL,
    metadata JSON,
    token_count INT,
    processing_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    INDEX idx_workspace_status (workspace_id, processing_status)
);

-- 處理結果表
CREATE TABLE processing_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chunk_id BIGINT NOT NULL,
    worker_id VARCHAR(100),
    summary TEXT,
    key_points JSON,
    relevance_score FLOAT,
    processing_time_ms INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chunk_id) REFERENCES content_chunks(id) ON DELETE CASCADE,
    INDEX idx_chunk_relevance (chunk_id, relevance_score)
);
```

---

## 🔧 配置文件擴展

### 增強的 config.yaml

```yaml
# 應用基本配置
app:
  name: "Enhanced SupervisorAgent"
  version: "2.0.0"
  debug: false
  host: "localhost"
  port: 8000

# 任務執行引擎配置
task_execution:
  max_concurrent_tasks: 5
  checkpoint_interval: 50  # 每處理50個項目保存檢查點
  task_timeout: 3600      # 任務超時時間(秒)
  retry_attempts: 3
  batch_size: 50          # 批次處理大小

# 記憶管理系統配置
memory:
  # 工作記憶配置
  working_memory:
    max_tokens: 2000
    cleanup_interval: 300  # 5分鐘清理一次
    importance_threshold: 0.3

  # 會話記憶配置
  session_memory:
    max_tokens: 5000
    compression_threshold: 0.8
    retention_hours: 24

  # 長期記憶配置
  long_term_memory:
    vector_db_collection: "agent_memories"
    embedding_model: "text-embedding-ada-002"
    similarity_threshold: 0.7
    max_results: 10

# 內容處理引擎配置
content_processing:
  # 分塊配置
  chunking:
    max_chunk_tokens: 2000
    overlap_tokens: 200
    chunk_strategy: "semantic"  # semantic, fixed, adaptive

  # 並行處理配置
  parallel_processing:
    max_workers: 3
    worker_timeout: 120
    retry_failed_chunks: true
    load_balancing: "round_robin"  # round_robin, least_loaded, random

  # 工作空間配置
  workspace:
    cleanup_interval: 3600  # 1小時清理一次
    max_workspace_age: 86400  # 24小時過期
    auto_cleanup: true

# 上下文管理器配置
context_management:
  # Token 預算配置
  token_budget:
    total_budget: 20000
    allocation:
      system_prompt: 4000
      context_memory: 8000
      tool_results: 6000
      response_generation: 2000

  # 壓縮配置
  compression:
    enable_auto_compression: true
    compression_threshold: 0.9  # 當使用率超過90%時壓縮
    compression_ratio_target: 0.7
    preserve_recent_items: 10

# 工具結果管理配置
tool_result_management:
  default_ttl: 1800  # 30分鐘
  max_cache_size: 100
  cleanup_interval: 600  # 10分鐘清理一次
  compression_enabled: true

# 性能監控配置
monitoring:
  enable_metrics: true
  metrics_interval: 60  # 1分鐘收集一次指標
  log_slow_operations: true
  slow_operation_threshold: 5000  # 5秒

# 數據庫配置
database:
  # 主數據庫
  primary:
    host: "localhost"
    port: 3306
    database: "enhanced_agent"
    username: "agent_user"
    password: "${DB_PASSWORD}"
    pool_size: 10

  # 向量數據庫
  vector_db:
    type: "weaviate"
    host: "localhost"
    port: 8080
    scheme: "http"
    timeout: 30

# 安全配置
security:
  enable_rate_limiting: true
  rate_limit_requests: 100
  rate_limit_window: 60
  enable_input_validation: true
  max_content_size: 10485760  # 10MB
```

---

## 🧪 測試策略

### 單元測試

```python
# tests/test_task_manager.py
import pytest
from enhanced_agent.task_execution import TaskManager, TaskStatus

class TestTaskManager:
    @pytest.fixture
    async def task_manager(self):
        # 設置測試數據庫
        db = await setup_test_database()
        checkpoint_manager = CheckpointManager(db)
        return TaskManager(db, checkpoint_manager)

    async def test_create_task(self, task_manager):
        """測試任務創建"""
        task_config = {
            'type': 'email_processing',
            'emails': ['email1', 'email2'],
            'batch_size': 50
        }

        task_id = await task_manager.create_task(task_config)
        assert task_id is not None

        task = await task_manager.get_task(task_id)
        assert task.status == TaskStatus.PENDING
        assert task.config == task_config

    async def test_checkpoint_recovery(self, task_manager):
        """測試檢查點恢復"""
        # 創建任務並設置檢查點
        task_id = await task_manager.create_task({'type': 'test'})
        await task_manager.checkpoint_manager.save_checkpoint(
            task_id, {'processed_count': 25}
        )

        # 模擬重啟後恢復
        checkpoint = await task_manager.checkpoint_manager.load_checkpoint(task_id)
        assert checkpoint['processed_count'] == 25
```

### 集成測試

```python
# tests/test_parallel_processing.py
import pytest
from enhanced_agent.content_processing import ParallelProcessor, ContentChunker

class TestParallelProcessing:
    @pytest.fixture
    async def processor(self):
        return ParallelProcessor(max_workers=2)

    async def test_email_batch_processing(self, processor):
        """測試信件批次並行處理"""
        # 準備測試數據
        emails = [f"Email {i} content..." for i in range(50)]
        chunker = ContentChunker()
        chunks = await chunker.chunk_content('\n'.join(emails), 'email')

        # 並行處理
        query = "總結這些信件的主要內容"
        workspace_id = "test_workspace"
        results = await processor.process_chunks_parallel(chunks, query, workspace_id)

        # 驗證結果
        assert len(results) == len(chunks)
        assert all(r.summary for r in results if not r.error)
```

### 性能測試

```python
# tests/test_performance.py
import pytest
import time
from enhanced_agent.memory import MemoryHierarchy

class TestPerformance:
    async def test_memory_compression_performance(self):
        """測試記憶壓縮性能"""
        memory_hierarchy = MemoryHierarchy()

        # 準備大量測試數據
        large_memories = [
            {'content': f'Memory {i}' * 100, 'importance': 0.5}
            for i in range(1000)
        ]

        start_time = time.time()
        compressed = await memory_hierarchy.compressor.compress_working_memory(large_memories)
        compression_time = time.time() - start_time

        # 性能要求：1000個記憶項目壓縮時間不超過5秒
        assert compression_time < 5.0
        assert compressed['compression_ratio'] > 0.5

    async def test_parallel_processing_scalability(self):
        """測試並行處理可擴展性"""
        processor = ParallelProcessor(max_workers=4)

        # 測試不同大小的內容
        content_sizes = [100, 500, 1000, 2000]  # 信件數量

        for size in content_sizes:
            emails = [f"Email {i}" for i in range(size)]

            start_time = time.time()
            # 模擬處理
            processing_time = time.time() - start_time

            # 性能要求：處理時間應該隨內容大小線性增長
            expected_max_time = size * 0.01  # 每封信件10ms
            assert processing_time < expected_max_time
```

---

## 📈 監控和指標

### 關鍵性能指標 (KPIs)

```python
# monitoring/metrics.py
from dataclasses import dataclass
from typing import Dict, List
import time

@dataclass
class PerformanceMetrics:
    # 任務執行指標
    task_completion_rate: float
    average_task_duration: float
    checkpoint_recovery_success_rate: float

    # 記憶管理指標
    memory_compression_ratio: float
    memory_retrieval_accuracy: float
    memory_storage_efficiency: float

    # 內容處理指標
    parallel_processing_speedup: float
    chunk_processing_success_rate: float
    result_aggregation_quality: float

    # 上下文管理指標
    token_utilization_rate: float
    context_compression_effectiveness: float
    tool_result_cache_hit_rate: float

class MetricsCollector:
    def __init__(self):
        self.metrics_history = []
        self.current_metrics = PerformanceMetrics()

    async def collect_task_metrics(self, task_manager):
        """收集任務執行指標"""
        completed_tasks = await task_manager.get_completed_tasks_last_hour()
        failed_tasks = await task_manager.get_failed_tasks_last_hour()

        total_tasks = len(completed_tasks) + len(failed_tasks)
        completion_rate = len(completed_tasks) / total_tasks if total_tasks > 0 else 0

        avg_duration = sum(t.duration for t in completed_tasks) / len(completed_tasks) if completed_tasks else 0

        return {
            'completion_rate': completion_rate,
            'average_duration': avg_duration,
            'total_tasks': total_tasks
        }

    async def collect_memory_metrics(self, memory_hierarchy):
        """收集記憶管理指標"""
        # 壓縮比率
        compression_stats = await memory_hierarchy.get_compression_stats()

        # 檢索準確性
        retrieval_stats = await memory_hierarchy.get_retrieval_stats()

        return {
            'compression_ratio': compression_stats.get('average_ratio', 0),
            'retrieval_accuracy': retrieval_stats.get('accuracy', 0),
            'storage_efficiency': compression_stats.get('storage_saved', 0)
        }
```

### 監控儀表板

```python
# monitoring/dashboard.py
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/dashboard", response_class=HTMLResponse)
async def monitoring_dashboard():
    """監控儀表板"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Enhanced Agent Monitoring</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    </head>
    <body>
        <h1>Enhanced Agent System Monitoring</h1>

        <div id="task-metrics" style="width:100%;height:400px;"></div>
        <div id="memory-metrics" style="width:100%;height:400px;"></div>
        <div id="performance-metrics" style="width:100%;height:400px;"></div>

        <script>
            // 實時更新圖表的 JavaScript 代碼
            async function updateDashboard() {
                const response = await fetch('/api/monitoring/metrics');
                const data = await response.json();

                // 更新任務指標圖表
                Plotly.newPlot('task-metrics', [{
                    x: data.timestamps,
                    y: data.task_completion_rates,
                    type: 'scatter',
                    name: 'Task Completion Rate'
                }], {title: 'Task Execution Metrics'});

                // 更新記憶指標圖表
                Plotly.newPlot('memory-metrics', [{
                    x: data.timestamps,
                    y: data.memory_compression_ratios,
                    type: 'scatter',
                    name: 'Memory Compression Ratio'
                }], {title: 'Memory Management Metrics'});

                // 更新性能指標圖表
                Plotly.newPlot('performance-metrics', [{
                    x: data.timestamps,
                    y: data.token_utilization_rates,
                    type: 'scatter',
                    name: 'Token Utilization Rate'
                }], {title: 'Performance Metrics'});
            }

            // 每30秒更新一次
            setInterval(updateDashboard, 30000);
            updateDashboard(); // 初始載入
        </script>
    </body>
    </html>
    """

@router.get("/api/monitoring/metrics")
async def get_metrics():
    """獲取監控指標 API"""
    metrics_collector = MetricsCollector()
    current_metrics = await metrics_collector.collect_all_metrics()

    return {
        'timestamps': current_metrics.timestamps,
        'task_completion_rates': current_metrics.task_completion_rates,
        'memory_compression_ratios': current_metrics.memory_compression_ratios,
        'token_utilization_rates': current_metrics.token_utilization_rates,
        'parallel_processing_speedups': current_metrics.parallel_processing_speedups
    }
```

---

## 🎯 成功指標和驗收標準

### 功能性指標

1. **任務執行可靠性**
   - ✅ 1000封信件處理成功率 > 99%
   - ✅ 斷點續傳成功率 > 95%
   - ✅ 任務去重準確率 > 98%

2. **記憶管理效率**
   - ✅ 記憶壓縮比率 > 70%
   - ✅ 記憶檢索準確率 > 85%
   - ✅ 長期記憶存儲效率 > 80%

3. **內容處理質量**
   - ✅ 並行處理加速比 > 2.5x
   - ✅ 結果合併一致性 > 90%
   - ✅ 分塊處理成功率 > 95%

### 性能指標

1. **響應時間**
   - ✅ 50封信件處理時間 < 60秒
   - ✅ 記憶檢索響應時間 < 2秒
   - ✅ 上下文壓縮時間 < 5秒

2. **資源利用率**
   - ✅ Token 利用率 > 85%
   - ✅ 記憶體使用效率 > 80%
   - ✅ 並行處理資源利用率 > 75%

3. **可擴展性**
   - ✅ 支援同時處理 5 個大型任務
   - ✅ 支援 100+ 並發用戶
   - ✅ 記憶系統支援 10萬+ 記憶項目

### 用戶體驗指標

1. **任務透明度**
   - ✅ 實時進度追蹤
   - ✅ 詳細錯誤報告
   - ✅ 任務狀態可視化

2. **系統穩定性**
   - ✅ 系統可用性 > 99.5%
   - ✅ 錯誤恢復時間 < 30秒
   - ✅ 數據一致性保證

---

## 🔚 總結

這個增強設計方案完全基於你現有的系統架構，提供了：

### ✨ 核心優勢

1. **你的並行處理想法確實很棒！** - 臨時工作空間 + 多 LLM 並行處理可以顯著提高效率
2. **漸進式實現** - 不破壞現有系統，逐步增強功能
3. **完整的記憶管理** - 三層記憶架構解決上下文累積問題
4. **智能資源管理** - Token 預算管理和動態優化
5. **企業級可靠性** - 斷點續傳、錯誤恢復、監控告警

### 🎯 解決的核心問題

- ✅ **循環任務問題** - 批次處理 + 檢查點機制
- ✅ **記憶系統** - 三層架構 + 智能壓縮
- ✅ **長序列任務** - Token 預算管理 + 上下文優化
- ✅ **分段閱讀** - 並行處理 + 智能合併

### 🚀 實施建議

建議按照 Phase 1 → Phase 2 → Phase 3 的順序實施，每個階段都有明確的交付物和驗收標準。這樣可以確保系統穩定性，同時逐步增強功能。

你覺得這個設計方案如何？有哪些部分需要我進一步詳細說明或調整？
