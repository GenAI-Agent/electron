# 🚀 Weaviate VectorDB 快速開始指南

## 📋 系統要求

- Python 3.8+
- Docker 和 Docker Compose (用於本地部署)
- 至少 2GB RAM

## ⚡ 5分鐘快速啟動

### 步驟 1: 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 步驟 2: 設定環境

```bash
# 建立環境配置
python -m vectordb.start_weaviate setup

# 編輯 .env 檔案 (可選，預設配置已可使用)
```

### 步驟 3: 啟動 Weaviate

```bash
# 啟動服務
python -m vectordb.start_weaviate start

# 檢查狀態
python -m vectordb.start_weaviate status
```

### 步驟 4: 執行範例

```bash
python vectordb/examples/basic_usage.py
```

## 🎯 核心功能演示

### 1. 基本使用

```python
from vectordb import VectorDBClient

# 連線和自動建立集合
with VectorDBClient() as client:
    # 根據資料自動建立 schema
    sample_data = {
        "title": "我的第一篇文章",
        "content": "這是文章內容",
        "tags": ["測試", "教學"],
        "view_count": 100
    }
    
    # 自動建立集合
    client.create_collection_with_data("articles", sample_data)
    
    # 插入更多資料
    client.insert_object("articles", {
        "title": "Python 教學",
        "content": "學習 Python 的基礎知識",
        "tags": ["python", "教學"],
        "view_count": 250
    })
    
    # 搜尋資料
    results = client.search_objects(
        collection_name="articles",
        query="Python 教學",
        limit=5
    )
    
    for result in results:
        print(f"找到: {result['properties']['title']}")
```

### 2. 多資料庫分離

```python
from vectordb import MultiDBManager

with MultiDBManager() as manager:
    # 建立專用資料庫
    manager.create_database("blog_db", description="部落格資料庫")
    manager.create_database("ecommerce_db", description="電商資料庫")
    
    # 在不同資料庫操作
    blog_db = manager.get_database("blog_db")
    blog_db.create_collection_with_data("posts", {
        "title": "部落格文章",
        "content": "文章內容"
    })
    
    ecommerce_db = manager.get_database("ecommerce_db")
    ecommerce_db.create_collection_with_data("products", {
        "name": "商品名稱",
        "price": 999.99,
        "category": "3C產品"
    })
```

### 3. 動態 Schema 調整

```python
# 動態添加新屬性
schema_manager = client.schema_manager

# 為現有集合添加評分欄位
schema_manager.add_property_to_collection(
    collection_name="articles",
    property_name="rating",
    property_type="NUMBER",
    description="文章評分"
)

# 查看 schema
schema = schema_manager.get_collection_schema("articles")
print(f"集合屬性: {[prop['name'] for prop in schema['properties']]}")
```

## 📚 常用操作備忘單

### 服務管理
```bash
# 啟動
python -m vectordb.start_weaviate start

# 停止
python -m vectordb.start_weaviate stop

# 重啟
python -m vectordb.start_weaviate restart

# 狀態檢查
python -m vectordb.start_weaviate status

# 查看日誌
python -m vectordb.start_weaviate logs
```

### 資料操作
```python
# 插入單筆
uuid = client.insert_object("collection", {"key": "value"})

# 批量插入
success, failed = client.insert_objects("collection", [obj1, obj2, obj3])

# 查詢物件
obj = client.get_object("collection", uuid)

# 更新物件
client.update_object("collection", uuid, {"new_key": "new_value"})

# 刪除物件
client.delete_object("collection", uuid)

# 搜尋
results = client.search_objects("collection", query="搜尋詞")

# 計數
count = client.count_objects("collection")
```

### Schema 管理
```python
# 列出所有集合
collections = schema_manager.list_collections()

# 查看 schema
schema = schema_manager.get_collection_schema("collection_name")

# 添加屬性
schema_manager.add_property_to_collection("collection", "new_field", "TEXT")

# 匯出 schema
schema_manager.export_schema("collection", "schema.json")

# 匯入 schema
schema_manager.import_schema("schema.json")
```

## 🔧 配置調整

### 環境變數配置
```env
# 基本配置
WEAVIATE_MODE=local
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080

# 雲端配置
WEAVIATE_MODE=cloud
WEAVIATE_CLUSTER_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your-api-key

# AI 模型配置
OPENAI_APIKEY=your-openai-api-key
```

### 程式化配置
```python
from vectordb import WeaviateConfig, WeaviateMode

# 自定義配置
config = WeaviateConfig(
    mode=WeaviateMode.CLOUD,
    cluster_url="https://your-cluster.weaviate.network",
    api_key="your-api-key",
    timeout=60
)

client = VectorDBClient(config)
```

## ⚠️ 常見問題解決

### 1. 連線失敗
```bash
# 檢查服務狀態
python -m vectordb.start_weaviate status

# 重啟服務
python -m vectordb.start_weaviate restart
```

### 2. 記憶體不足
- 調整 Docker 記憶體限制
- 減少批次處理大小
- 使用分頁查詢

### 3. 搜尋結果不佳
- 確認有設定適當的 vectorizer
- 檢查資料品質
- 調整搜尋參數

## 📖 進階功能

### 備份和還原
```python
# 備份
client.backup_collections("backup.json")

# 還原
client.restore_collections("backup.json")
```

### 過濾查詢
```python
# 條件過濾
results = client.search_objects(
    collection_name="articles",
    where_filter={
        "view_count": {"gte": 100},
        "category": {"eq": "技術"}
    }
)
```

### 批量處理
```python
# 大量資料插入
objects = [{"data": i} for i in range(1000)]
success_count, failure_count = client.insert_objects(
    "large_collection", 
    objects, 
    batch_size=50
)
```

## 🎓 下一步學習

1. 📖 閱讀完整 [API 文件](README.md)
2. 🔍 探索 [Weaviate 官方文件](https://weaviate.io/developers/weaviate)
3. 🧪 嘗試不同的 vectorizer 模型
4. 🚀 整合到您的應用程式中

## 💡 最佳實踐

1. **資料設計**: 根據查詢需求設計 schema
2. **批量操作**: 大量資料使用批量插入
3. **監控**: 定期檢查資料庫統計
4. **備份**: 定期備份重要資料
5. **測試**: 在開發環境先測試 schema 變更

---

🎉 **恭喜！您已經完成了 Weaviate VectorDB 的快速設定。現在可以開始建立您的向量資料庫應用了！**
