"""
Weaviate Vector Database 客戶端
提供完整的 CRUD 操作和向量搜尋功能
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.query import MetadataQuery, Filter
from weaviate.classes.config import Property, DataType

from ..config.weaviate_config import WeaviateConfig
from ..managers.schema_manager import SchemaManager


logger = logging.getLogger(__name__)


class VectorDBClient:
    """Weaviate 向量資料庫客戶端"""
    
    def __init__(self, config: Optional[WeaviateConfig] = None):
        """
        初始化客戶端
        
        Args:
            config: Weaviate 配置
        """
        self.config = config or WeaviateConfig.from_env()
        self.client: Optional[weaviate.WeaviateClient] = None
        self.schema_manager: Optional[SchemaManager] = None
        self._connected = False
        
    def connect(self) -> bool:
        """
        連線到 Weaviate
        
        Returns:
            bool: 是否成功連線
        """
        try:
            # 建立認證物件
            auth = None
            if self.config.api_key:
                auth = Auth.api_key(self.config.api_key)
            elif self.config.username and self.config.password:
                auth = Auth.client_password(
                    username=self.config.username,
                    password=self.config.password
                )
            
            # 建立客戶端
            self.client = weaviate.connect_to_weaviate_cloud(
                cluster_url=self.config.cluster_url,
                auth_credentials=auth,
                headers=self.config.additional_headers
            ) if self.config.cluster_url else weaviate.connect_to_local(
                host=self.config.host,
                port=self.config.port,
                grpc_port=self.config.port + 1,  # gRPC 通常是 HTTP port + 1
                headers=self.config.additional_headers
            )
            
            # 測試連線
            if self.client.is_ready():
                self.schema_manager = SchemaManager(self.client)
                self._connected = True
                logger.info(f"Successfully connected to Weaviate at {self.config.url}")
                return True
            else:
                logger.error("Weaviate is not ready")
                return False
                
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate: {e}")
            return False
    
    def disconnect(self):
        """斷開與 Weaviate 的連線"""
        try:
            if self.client:
                self.client.close()
                self._connected = False
                logger.info("Disconnected from Weaviate")
        except Exception as e:
            logger.error(f"Error disconnecting from Weaviate: {e}")
    
    def is_connected(self) -> bool:
        """
        檢查是否已連線
        
        Returns:
            bool: 是否已連線
        """
        return self._connected and self.client is not None and self.client.is_ready()
    
    def create_collection_with_data(
        self,
        collection_name: str,
        sample_data: Union[Dict[str, Any], List[Dict[str, Any]]],
        vector_config: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None
    ) -> bool:
        """
        根據資料自動建立集合
        
        Args:
            collection_name: 集合名稱
            sample_data: 範例資料
            vector_config: 向量配置
            description: 集合描述
            
        Returns:
            bool: 是否成功建立
        """
        if not self.is_connected():
            logger.error("Not connected to Weaviate")
            return False
        
        return self.schema_manager.create_collection_from_data(
            collection_name=collection_name,
            sample_data=sample_data,
            vector_config=vector_config,
            description=description
        )
    
    def insert_object(
        self,
        collection_name: str,
        properties: Dict[str, Any],
        vector: Optional[List[float]] = None,
        uuid: Optional[str] = None
    ) -> Optional[str]:
        """
        插入單個物件
        
        Args:
            collection_name: 集合名稱
            properties: 物件屬性
            vector: 向量（可選，如果有 vectorizer 會自動生成）
            uuid: 物件 UUID（可選）
            
        Returns:
            str: 物件 UUID 或 None
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return None
            
            collection = self.client.collections.get(collection_name)
            
            # 準備插入資料
            insert_data = properties.copy()
            if vector:
                insert_data["vector"] = vector
            
            # 插入物件
            if uuid:
                result = collection.data.insert(insert_data, uuid=uuid)
            else:
                result = collection.data.insert(insert_data)
            
            logger.debug(f"Inserted object into {collection_name}: {result}")
            return str(result)
            
        except Exception as e:
            logger.error(f"Failed to insert object into {collection_name}: {e}")
            return None
    
    def insert_objects(
        self,
        collection_name: str,
        objects: List[Dict[str, Any]],
        batch_size: int = 100
    ) -> Tuple[int, int]:
        """
        批量插入物件
        
        Args:
            collection_name: 集合名稱
            objects: 物件列表
            batch_size: 批次大小
            
        Returns:
            Tuple[int, int]: (成功數量, 失敗數量)
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return 0, len(objects)
            
            collection = self.client.collections.get(collection_name)
            
            success_count = 0
            failure_count = 0
            
            # 分批處理
            for i in range(0, len(objects), batch_size):
                batch = objects[i:i + batch_size]
                
                try:
                    # 批量插入
                    results = collection.data.insert_many(batch)
                    
                    # 計算成功和失敗數量
                    for result in results:
                        if hasattr(result, 'errors') and result.errors:
                            failure_count += 1
                        else:
                            success_count += 1
                            
                except Exception as e:
                    logger.error(f"Batch insert failed: {e}")
                    failure_count += len(batch)
            
            logger.info(f"Batch insert completed: {success_count} success, {failure_count} failures")
            return success_count, failure_count
            
        except Exception as e:
            logger.error(f"Failed to insert objects into {collection_name}: {e}")
            return 0, len(objects)
    
    def get_object(
        self,
        collection_name: str,
        uuid: str,
        include_vector: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        取得單個物件
        
        Args:
            collection_name: 集合名稱
            uuid: 物件 UUID
            include_vector: 是否包含向量
            
        Returns:
            Dict: 物件資料或 None
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return None
            
            collection = self.client.collections.get(collection_name)
            
            # 設定查詢參數
            metadata = [MetadataQuery.UUID]
            if include_vector:
                metadata.append(MetadataQuery.VECTOR)
            
            # 查詢物件
            result = collection.query.fetch_object_by_id(
                uuid=uuid,
                include_metadata=metadata
            )
            
            if result:
                obj_data = {
                    "uuid": str(result.uuid),
                    "properties": result.properties
                }
                
                if include_vector and hasattr(result, 'vector'):
                    obj_data["vector"] = result.vector
                    
                return obj_data
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get object {uuid} from {collection_name}: {e}")
            return None
    
    def update_object(
        self,
        collection_name: str,
        uuid: str,
        properties: Dict[str, Any],
        vector: Optional[List[float]] = None
    ) -> bool:
        """
        更新物件
        
        Args:
            collection_name: 集合名稱
            uuid: 物件 UUID
            properties: 新的屬性
            vector: 新的向量（可選）
            
        Returns:
            bool: 是否成功更新
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return False
            
            collection = self.client.collections.get(collection_name)
            
            # 準備更新資料
            update_data = properties.copy()
            if vector:
                update_data["vector"] = vector
            
            # 更新物件
            collection.data.update(
                uuid=uuid,
                properties=update_data
            )
            
            logger.debug(f"Updated object {uuid} in {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update object {uuid} in {collection_name}: {e}")
            return False
    
    def delete_object(self, collection_name: str, uuid: str) -> bool:
        """
        刪除物件
        
        Args:
            collection_name: 集合名稱
            uuid: 物件 UUID
            
        Returns:
            bool: 是否成功刪除
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return False
            
            collection = self.client.collections.get(collection_name)
            
            # 刪除物件
            result = collection.data.delete_by_id(uuid=uuid)
            
            logger.debug(f"Deleted object {uuid} from {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete object {uuid} from {collection_name}: {e}")
            return False
    
    def search_objects(
        self,
        collection_name: str,
        query: Optional[str] = None,
        vector: Optional[List[float]] = None,
        where_filter: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        offset: int = 0,
        include_vector: bool = False,
        include_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """
        搜尋物件
        
        Args:
            collection_name: 集合名稱
            query: 文字查詢
            vector: 向量查詢
            where_filter: 過濾條件
            limit: 結果數量限制
            offset: 結果偏移量
            include_vector: 是否包含向量
            include_metadata: 是否包含元數據
            
        Returns:
            List[Dict]: 搜尋結果
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return []
            
            collection = self.client.collections.get(collection_name)
            
            # 準備元數據查詢
            metadata = []
            if include_metadata:
                metadata.extend([MetadataQuery.UUID, MetadataQuery.DISTANCE])
            if include_vector:
                metadata.append(MetadataQuery.VECTOR)
            
            # 執行查詢
            if query:
                # 文字查詢
                response = collection.query.near_text(
                    query=query,
                    limit=limit,
                    offset=offset,
                    where=self._build_where_filter(where_filter),
                    include_metadata=metadata
                )
            elif vector:
                # 向量查詢
                response = collection.query.near_vector(
                    near_vector=vector,
                    limit=limit,
                    offset=offset,
                    where=self._build_where_filter(where_filter),
                    include_metadata=metadata
                )
            else:
                # 普通查詢
                response = collection.query.fetch_objects(
                    limit=limit,
                    offset=offset,
                    where=self._build_where_filter(where_filter),
                    include_metadata=metadata
                )
            
            # 處理結果
            results = []
            for obj in response.objects:
                result = {
                    "uuid": str(obj.uuid),
                    "properties": obj.properties
                }
                
                if include_metadata and hasattr(obj.metadata, 'distance'):
                    result["distance"] = obj.metadata.distance
                
                if include_vector and hasattr(obj, 'vector'):
                    result["vector"] = obj.vector
                
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search objects in {collection_name}: {e}")
            return []
    
    def count_objects(self, collection_name: str, where_filter: Optional[Dict[str, Any]] = None) -> int:
        """
        計算物件數量
        
        Args:
            collection_name: 集合名稱
            where_filter: 過濾條件
            
        Returns:
            int: 物件數量
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return 0
            
            collection = self.client.collections.get(collection_name)
            
            # 計算物件數量
            response = collection.aggregate.over_all(
                total_count=True,
                where=self._build_where_filter(where_filter)
            )
            
            return response.total_count or 0
            
        except Exception as e:
            logger.error(f"Failed to count objects in {collection_name}: {e}")
            return 0
    
    def delete_all_objects(self, collection_name: str, confirm: bool = False) -> bool:
        """
        刪除集合中的所有物件
        
        Args:
            collection_name: 集合名稱
            confirm: 確認刪除
            
        Returns:
            bool: 是否成功刪除
        """
        if not confirm:
            logger.warning(f"Delete all objects requires confirmation for {collection_name}")
            return False
        
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return False
            
            collection = self.client.collections.get(collection_name)
            
            # 刪除所有物件
            result = collection.data.delete_many(where=Filter.by_id().is_not_null())
            
            logger.info(f"Deleted all objects from {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete all objects from {collection_name}: {e}")
            return False
    
    def backup_collections(self, backup_path: str, collection_names: Optional[List[str]] = None) -> bool:
        """
        備份集合資料
        
        Args:
            backup_path: 備份檔案路徑
            collection_names: 要備份的集合名稱列表，若無則備份所有集合
            
        Returns:
            bool: 是否成功備份
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return False
            
            # 取得要備份的集合
            if collection_names is None:
                collection_names = self.schema_manager.list_collections()
            
            backup_data = {
                "timestamp": datetime.now().isoformat(),
                "collections": {}
            }
            
            # 備份每個集合
            for collection_name in collection_names:
                try:
                    # 取得 schema
                    schema = self.schema_manager.get_collection_schema(collection_name)
                    
                    # 取得所有物件
                    objects = self.search_objects(
                        collection_name=collection_name,
                        limit=10000,  # 大量資料需要分批處理
                        include_vector=True
                    )
                    
                    backup_data["collections"][collection_name] = {
                        "schema": schema,
                        "objects": objects
                    }
                    
                    logger.info(f"Backed up collection {collection_name}: {len(objects)} objects")
                    
                except Exception as e:
                    logger.error(f"Failed to backup collection {collection_name}: {e}")
                    continue
            
            # 寫入備份檔案
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Successfully backed up {len(backup_data['collections'])} collections to {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to backup collections: {e}")
            return False
    
    def restore_collections(self, backup_path: str) -> bool:
        """
        還原集合資料
        
        Args:
            backup_path: 備份檔案路徑
            
        Returns:
            bool: 是否成功還原
        """
        try:
            if not self.is_connected():
                logger.error("Not connected to Weaviate")
                return False
            
            # 讀取備份檔案
            with open(backup_path, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
            
            # 還原每個集合
            for collection_name, collection_data in backup_data["collections"].items():
                try:
                    # 還原 schema
                    schema = collection_data["schema"]
                    
                    # 建立集合（如果不存在）
                    if not self.schema_manager.collection_exists(collection_name):
                        properties = []
                        for prop_data in schema.get('properties', []):
                            properties.append(Property(
                                name=prop_data['name'],
                                data_type=DataType(prop_data['dataType']),
                                description=prop_data.get('description', '')
                            ))
                        
                        self.schema_manager.create_collection(
                            collection_name=collection_name,
                            properties=properties,
                            vector_config=schema.get('vector_index_config', {}),
                            description=schema.get('description', '')
                        )
                    
                    # 還原物件
                    objects = collection_data["objects"]
                    if objects:
                        # 準備物件資料
                        insert_objects = []
                        for obj in objects:
                            insert_data = obj["properties"].copy()
                            if "vector" in obj:
                                insert_data["vector"] = obj["vector"]
                            insert_objects.append(insert_data)
                        
                        # 批量插入
                        success_count, failure_count = self.insert_objects(
                            collection_name=collection_name,
                            objects=insert_objects
                        )
                        
                        logger.info(f"Restored collection {collection_name}: {success_count} objects")
                    
                except Exception as e:
                    logger.error(f"Failed to restore collection {collection_name}: {e}")
                    continue
            
            logger.info(f"Successfully restored collections from {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to restore collections: {e}")
            return False
    
    def _build_where_filter(self, where_filter: Optional[Dict[str, Any]]) -> Optional[Filter]:
        """
        建構 where 過濾條件
        
        Args:
            where_filter: 過濾條件字典
            
        Returns:
            Filter: Weaviate 過濾物件或 None
        """
        if not where_filter:
            return None
        
        try:
            # 這裡實作簡單的過濾條件轉換
            # 實際使用時可能需要更複雜的邏輯
            filters = []
            
            for key, value in where_filter.items():
                if isinstance(value, dict):
                    # 處理操作符
                    for op, op_value in value.items():
                        if op == "eq":
                            filters.append(Filter.by_property(key).equal(op_value))
                        elif op == "ne":
                            filters.append(Filter.by_property(key).not_equal(op_value))
                        elif op == "gt":
                            filters.append(Filter.by_property(key).greater_than(op_value))
                        elif op == "gte":
                            filters.append(Filter.by_property(key).greater_or_equal(op_value))
                        elif op == "lt":
                            filters.append(Filter.by_property(key).less_than(op_value))
                        elif op == "lte":
                            filters.append(Filter.by_property(key).less_or_equal(op_value))
                        elif op == "like":
                            filters.append(Filter.by_property(key).like(op_value))
                else:
                    # 直接相等比較
                    filters.append(Filter.by_property(key).equal(value))
            
            # 組合多個過濾條件
            if len(filters) == 1:
                return filters[0]
            elif len(filters) > 1:
                result = filters[0]
                for f in filters[1:]:
                    result = result & f
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to build where filter: {e}")
            return None
    
    def __enter__(self):
        """Context manager 入口"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager 出口"""
        self.disconnect()
