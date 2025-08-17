"""
Weaviate VectorDB 基本使用範例
展示如何使用動態 schema 和多資料庫功能
"""

import asyncio
import json
from pathlib import Path

# 需要先安裝依賴: pip install -r requirements.txt
from vectordb import VectorDBClient, MultiDBManager, WeaviateConfig, WeaviateMode


def basic_example():
    """基本使用範例"""
    print("=== Weaviate VectorDB 基本使用範例 ===\n")
    
    # 1. 建立配置
    config = WeaviateConfig(
        mode=WeaviateMode.LOCAL,
        host="localhost",
        port=8080
    )
    
    # 2. 建立客戶端並連線
    with VectorDBClient(config) as client:
        print("✅ 成功連線到 Weaviate")
        
        # 3. 準備範例資料
        sample_data = [
            {
                "title": "Python 程式設計",
                "content": "Python 是一種高階程式語言",
                "category": "程式設計",
                "tags": ["python", "程式設計", "教學"],
                "published_date": "2024-01-15",
                "view_count": 1250
            },
            {
                "title": "機器學習入門",
                "content": "機器學習是人工智慧的一個分支",
                "category": "AI",
                "tags": ["機器學習", "AI", "資料科學"],
                "published_date": "2024-01-20",
                "view_count": 980
            }
        ]
        
        # 4. 根據資料自動建立集合
        collection_name = "articles"
        success = client.create_collection_with_data(
            collection_name=collection_name,
            sample_data=sample_data,
            description="文章集合範例"
        )
        
        if success:
            print(f"✅ 成功建立集合: {collection_name}")
            
            # 5. 插入資料
            success_count, failure_count = client.insert_objects(
                collection_name=collection_name,
                objects=sample_data
            )
            print(f"✅ 插入資料: 成功 {success_count} 筆，失敗 {failure_count} 筆")
            
            # 6. 搜尋資料
            results = client.search_objects(
                collection_name=collection_name,
                query="Python 程式設計",
                limit=5
            )
            print(f"✅ 搜尋結果: 找到 {len(results)} 筆資料")
            for result in results:
                print(f"  - {result['properties']['title']}")
            
            # 7. 取得集合統計
            count = client.count_objects(collection_name)
            print(f"✅ 集合中共有 {count} 個物件")
            
        else:
            print("❌ 建立集合失敗")


def multi_database_example():
    """多資料庫範例"""
    print("\n=== 多資料庫管理範例 ===\n")
    
    # 1. 建立多資料庫管理器
    with MultiDBManager() as manager:
        
        # 2. 建立不同的資料庫實例
        databases = ["articles_db", "users_db", "products_db"]
        
        for db_name in databases:
            success = manager.create_database(
                db_name=db_name,
                description=f"專用於 {db_name} 的資料庫"
            )
            if success:
                print(f"✅ 建立資料庫: {db_name}")
        
        # 3. 在不同資料庫中建立集合
        # 文章資料庫
        articles_db = manager.get_database("articles_db")
        if articles_db:
            article_data = {
                "title": "AI 趨勢分析",
                "content": "2024年AI發展趨勢...",
                "author": "張三"
            }
            articles_db.create_collection_with_data("articles", article_data)
            print("✅ 在 articles_db 中建立文章集合")
        
        # 使用者資料庫
        users_db = manager.get_database("users_db")
        if users_db:
            user_data = {
                "username": "user123",
                "email": "user@example.com",
                "preferences": ["tech", "ai", "programming"]
            }
            users_db.create_collection_with_data("users", user_data)
            print("✅ 在 users_db 中建立使用者集合")
        
        # 4. 列出所有資料庫
        all_dbs = manager.list_databases()
        print(f"✅ 目前有 {len(all_dbs)} 個資料庫: {all_dbs}")
        
        # 5. 取得資料庫統計資訊
        for db_name in all_dbs:
            info = manager.get_database_info(db_name)
            if info:
                print(f"📊 {db_name}: {info['collections_count']} 個集合，{info['total_objects']} 個物件")


def dynamic_schema_example():
    """動態 Schema 範例"""
    print("\n=== 動態 Schema 管理範例 ===\n")
    
    config = WeaviateConfig.from_env()
    
    with VectorDBClient(config) as client:
        # 1. 根據不同類型的資料動態建立集合
        
        # 電商產品資料
        product_data = {
            "name": "智慧手機",
            "price": 15999.0,
            "brand": "TechBrand",
            "specifications": {
                "screen_size": "6.1吋",
                "storage": "128GB",
                "camera": "48MP"
            },
            "in_stock": True,
            "categories": ["電子產品", "手機"],
            "launch_date": "2024-01-01"
        }
        
        client.create_collection_with_data(
            "products",
            product_data,
            description="電商產品資料"
        )
        print("✅ 建立產品集合 (複雜物件結構)")
        
        # 社交媒體貼文資料
        post_data = {
            "content": "今天天氣真好！ #美好一天",
            "author": "user456",
            "timestamp": "2024-01-25T10:30:00",
            "likes": 42,
            "hashtags": ["美好一天", "天氣"],
            "location": "台北市",
            "is_public": True
        }
        
        client.create_collection_with_data(
            "social_posts",
            post_data,
            description="社交媒體貼文"
        )
        print("✅ 建立社交貼文集合 (時間序列資料)")
        
        # 2. 動態添加新屬性
        schema_manager = client.schema_manager
        
        # 為產品集合添加評分屬性
        schema_manager.add_property_to_collection(
            "products",
            "rating",
            "NUMBER",
            "產品評分 (1-5)"
        )
        print("✅ 為產品集合添加評分屬性")
        
        # 3. 匯出和匯入 Schema
        schema_manager.export_schema("products", "product_schema.json")
        print("✅ 匯出產品 Schema 到檔案")
        
        # 4. 列出所有集合和其 Schema
        collections = schema_manager.list_collections()
        print(f"✅ 目前有 {len(collections)} 個集合:")
        
        for collection in collections:
            schema = schema_manager.get_collection_schema(collection)
            if schema:
                properties = [prop['name'] for prop in schema['properties']]
                print(f"  - {collection}: {len(properties)} 個屬性 ({', '.join(properties[:3])}...)")


def main():
    """主函數"""
    print("🚀 啟動 Weaviate VectorDB 範例程式\n")
    
    try:
        # 執行範例
        basic_example()
        multi_database_example()
        dynamic_schema_example()
        
        print("\n✨ 所有範例執行完成！")
        
    except Exception as e:
        print(f"\n❌ 執行過程中發生錯誤: {e}")
        print("\n💡 請確認:")
        print("1. Weaviate 服務已啟動")
        print("2. 配置設定正確")
        print("3. 網路連線正常")


if __name__ == "__main__":
    main()
