# Weaviate Vector Database 管理系統

這是一個完整的 Weaviate v3 向量資料庫管理系統，支援動態 Schema 管理和多資料庫分離儲存。

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 2. 環境設定

```bash
python vectordb/start_weaviate.py setup
```

這會建立 `.env` 檔案，您可以編輯它來配置您的 Weaviate 設定。

### 3. 啟動 Weaviate 服務

```bash
python vectordb/start_weaviate.py start
```

### 4. 檢查服務狀態

```bash
python vectordb/start_weaviate.py status
```

### 5. 執行範例程式

```bash
python vectordb/examples/basic_usage.py
```

## 📋 功能特色

### 🔧 動態 Schema 管理

- **自動 Schema 推斷**: 根據資料內容自動建立集合結構
- **動態屬性添加**: 執行時期動態添加新屬性
- **Schema 匯出/匯入**: 支援 Schema 的備份和還原
- **多種資料類型**: 支援文字、數字、日期、陣列、物件等

```python
from vectordb import VectorDBClient

# 根據資料自動建立集合
sample_data = {
    "title": "文章標題",
    "content": "文章內容",
    "tags": ["標籤1", "標籤2"],
    "published_date": "2024-01-15",
    "view_count": 100
}

with VectorDBClient() as client:
    client.create_collection_with_data(
        collection_name="articles",
        sample_data=sample_data
    )
```

### 🗄️ 多資料庫管理

- **分離儲存**: 建立多個獨立的資料庫實例
- **資料庫切換**: 輕鬆在不同資料庫間切換
- **統計監控**: 取得每個資料庫的統計資訊
- **備份還原**: 支援個別資料庫的備份和還原

```python
from vectordb import MultiDBManager

with MultiDBManager() as manager:
    # 建立不同用途的資料庫
    manager.create_database("articles_db", description="文章資料庫")
    manager.create_database("users_db", description="使用者資料庫")
    
    # 取得特定資料庫
    articles_db = manager.get_database("articles_db")
    users_db = manager.get_database("users_db")
```

### 🔍 完整的 CRUD 操作

- **物件管理**: 插入、查詢、更新、刪除
- **批量操作**: 高效能的批量資料處理
- **向量搜尋**: 支援文字和向量相似度搜尋
- **過濾查詢**: 複雜的條件過濾

```python
# 插入資料
client.insert_object("articles", {
    "title": "新文章",
    "content": "文章內容"
})

# 搜尋資料
results = client.search_objects(
    collection_name="articles",
    query="Python 教學",
    limit=10
)

# 更新資料
client.update_object("articles", uuid, {
    "title": "更新後的標題"
})
```

## 🛠️ 配置選項

### 環境變數配置

在 `.env` 檔案中設定：

```env
# 本地部署
WEAVIATE_MODE=local
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080

# 雲端部署 (Weaviate Cloud Services)
WEAVIATE_MODE=cloud
WEAVIATE_CLUSTER_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your-api-key

# OpenAI 整合 (可選)
OPENAI_APIKEY=your-openai-api-key
```

### 程式化配置

```python
from vectordb import WeaviateConfig, WeaviateMode

config = WeaviateConfig(
    mode=WeaviateMode.LOCAL,
    host="localhost",
    port=8080,
    timeout=30
)
```

## 📖 API 文件

### VectorDBClient

主要的資料庫客戶端類別。

#### 方法

- `connect()`: 連線到 Weaviate
- `disconnect()`: 斷開連線
- `create_collection_with_data()`: 根據資料建立集合
- `insert_object()`: 插入單個物件
- `insert_objects()`: 批量插入物件
- `get_object()`: 取得物件
- `update_object()`: 更新物件
- `delete_object()`: 刪除物件
- `search_objects()`: 搜尋物件
- `count_objects()`: 計算物件數量

### SchemaManager

動態 Schema 管理器。

#### 方法

- `create_collection_from_data()`: 根據資料建立集合
- `add_property_to_collection()`: 添加屬性
- `get_collection_schema()`: 取得 Schema
- `list_collections()`: 列出所有集合
- `export_schema()`: 匯出 Schema
- `import_schema()`: 匯入 Schema

### MultiDBManager

多資料庫管理器。

#### 方法

- `create_database()`: 建立資料庫
- `get_database()`: 取得資料庫
- `list_databases()`: 列出所有資料庫
- `delete_database()`: 刪除資料庫
- `get_database_info()`: 取得資料庫資訊

## 🎯 使用場景

### 1. 內容管理系統

```python
# 文章集合
article_schema = {
    "title": "文章標題",
    "content": "文章內容", 
    "author": "作者",
    "tags": ["標籤"],
    "published_at": "2024-01-15"
}

# 評論集合
comment_schema = {
    "article_id": "文章ID",
    "content": "評論內容",
    "author": "評論者",
    "created_at": "2024-01-15"
}
```

### 2. 電商產品搜尋

```python
# 產品集合
product_schema = {
    "name": "產品名稱",
    "description": "產品描述",
    "price": 999.99,
    "category": "分類",
    "specifications": {
        "brand": "品牌",
        "model": "型號"
    },
    "in_stock": True
}
```

### 3. 知識庫系統

```python
# 文件集合
document_schema = {
    "title": "文件標題",
    "content": "文件內容",
    "type": "文件類型",
    "department": "部門",
    "keywords": ["關鍵字"],
    "last_updated": "2024-01-15"
}
```

## 🔧 服務管理命令

```bash
# 啟動服務
python vectordb/start_weaviate.py start

# 停止服務
python vectordb/start_weaviate.py stop

# 重啟服務
python vectordb/start_weaviate.py restart

# 檢查狀態
python vectordb/start_weaviate.py status

# 查看日誌
python vectordb/start_weaviate.py logs

# 重置資料 (危險操作)
python vectordb/start_weaviate.py reset --confirm
```

## 🐳 Docker 部署

本系統包含完整的 Docker Compose 配置：

```yaml
# docker-compose.yml
version: '3.8'
services:
  weaviate:
    image: cr.weaviate.io/semitechnologies/weaviate:1.22.4
    ports:
      - "8080:8080"
    environment:
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
```

## 📊 監控和維護

### 效能監控

```python
# 取得資料庫統計
with MultiDBManager() as manager:
    stats = manager.get_all_database_stats()
    for db_name, info in stats.items():
        print(f"{db_name}: {info['total_objects']} objects")
```

### 備份和還原

```python
# 備份
client.backup_collections("backup.json")

# 還原
client.restore_collections("backup.json")
```

## 🚨 故障排除

### 常見問題

1. **連線失敗**
   - 檢查 Weaviate 服務是否啟動
   - 確認端口配置正確
   - 檢查防火牆設定

2. **Schema 建立失敗**
   - 檢查資料格式是否正確
   - 確認屬性名稱符合規範
   - 檢查資料類型相容性

3. **搜尋結果不理想**
   - 調整 vectorizer 設定
   - 優化查詢參數
   - 檢查資料品質

### 日誌檢查

```bash
# 查看 Weaviate 服務日誌
python vectordb/start_weaviate.py logs

# 查看應用程式日誌
tail -f vectordb.log
```

## 🔗 相關資源

- [Weaviate 官方文件](https://weaviate.io/developers/weaviate)
- [Weaviate Python 客戶端](https://weaviate.io/developers/weaviate/client-libraries/python)
- [向量資料庫最佳實踐](https://weaviate.io/blog)

## 📝 授權

此專案基於 MIT 授權條款開源。
