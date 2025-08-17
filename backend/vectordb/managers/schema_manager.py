"""
動態 Schema 管理器
支援動態建立、修改和管理 Weaviate 集合 (Collections) 的 schema
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import weaviate
from weaviate.classes.config import Property, DataType, VectorDistances
from weaviate.classes.init import Auth


logger = logging.getLogger(__name__)


class SchemaManager:
    """動態 Schema 管理器"""
    
    def __init__(self, client: weaviate.WeaviateClient):
        """
        初始化 Schema 管理器
        
        Args:
            client: Weaviate 客戶端實例
        """
        self.client = client
        self._schema_cache: Dict[str, Dict[str, Any]] = {}
        
    def create_collection_from_data(
        self, 
        collection_name: str, 
        sample_data: Union[Dict[str, Any], List[Dict[str, Any]]], 
        vector_config: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None
    ) -> bool:
        """
        根據範例資料動態建立集合 schema
        
        Args:
            collection_name: 集合名稱
            sample_data: 範例資料 (單筆或多筆)
            vector_config: 向量配置
            description: 集合描述
            
        Returns:
            bool: 是否成功建立
        """
        try:
            # 標準化資料格式
            if isinstance(sample_data, dict):
                sample_data = [sample_data]
            
            # 分析資料結構並建立 properties
            properties = self._analyze_data_structure(sample_data)
            
            # 預設向量配置
            if vector_config is None:
                vector_config = {
                    "vectorizer": "text2vec-openai",  # 可根據需要調整
                    "distance": VectorDistances.COSINE
                }
            
            # 建立集合
            return self.create_collection(
                collection_name=collection_name,
                properties=properties,
                vector_config=vector_config,
                description=description or f"Auto-generated collection for {collection_name}"
            )
            
        except Exception as e:
            logger.error(f"Failed to create collection from data: {e}")
            return False
    
    def create_collection(
        self,
        collection_name: str,
        properties: List[Property],
        vector_config: Dict[str, Any],
        description: Optional[str] = None
    ) -> bool:
        """
        建立新的集合
        
        Args:
            collection_name: 集合名稱
            properties: 屬性列表
            vector_config: 向量配置
            description: 集合描述
            
        Returns:
            bool: 是否成功建立
        """
        try:
            # 檢查集合是否已存在
            if self.collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} already exists")
                return True
            
            # 建立集合
            collection = self.client.collections.create(
                name=collection_name,
                description=description,
                properties=properties,
                vectorizer_config=vector_config.get("vectorizer"),
                vector_index_config=vector_config
            )
            
            # 更新快取
            self._update_schema_cache(collection_name)
            
            logger.info(f"Successfully created collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {e}")
            return False
    
    def add_property_to_collection(
        self,
        collection_name: str,
        property_name: str,
        property_type: DataType,
        description: Optional[str] = None
    ) -> bool:
        """
        向現有集合添加新屬性
        
        Args:
            collection_name: 集合名稱
            property_name: 屬性名稱
            property_type: 屬性類型
            description: 屬性描述
            
        Returns:
            bool: 是否成功添加
        """
        try:
            if not self.collection_exists(collection_name):
                logger.error(f"Collection {collection_name} does not exist")
                return False
            
            collection = self.client.collections.get(collection_name)
            
            new_property = Property(
                name=property_name,
                data_type=property_type,
                description=description
            )
            
            collection.config.add_property(new_property)
            
            # 更新快取
            self._update_schema_cache(collection_name)
            
            logger.info(f"Successfully added property {property_name} to collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add property to collection: {e}")
            return False
    
    def collection_exists(self, collection_name: str) -> bool:
        """
        檢查集合是否存在
        
        Args:
            collection_name: 集合名稱
            
        Returns:
            bool: 集合是否存在
        """
        try:
            return self.client.collections.exists(collection_name)
        except Exception as e:
            logger.error(f"Error checking collection existence: {e}")
            return False
    
    def get_collection_schema(self, collection_name: str) -> Optional[Dict[str, Any]]:
        """
        取得集合的 schema
        
        Args:
            collection_name: 集合名稱
            
        Returns:
            Dict: 集合 schema 或 None
        """
        try:
            if collection_name in self._schema_cache:
                return self._schema_cache[collection_name]
            
            if not self.collection_exists(collection_name):
                return None
            
            collection = self.client.collections.get(collection_name)
            schema = collection.config.get()
            
            # 轉換為字典格式並快取
            schema_dict = self._schema_to_dict(schema)
            self._schema_cache[collection_name] = schema_dict
            
            return schema_dict
            
        except Exception as e:
            logger.error(f"Error getting collection schema: {e}")
            return None
    
    def list_collections(self) -> List[str]:
        """
        列出所有集合名稱
        
        Returns:
            List[str]: 集合名稱列表
        """
        try:
            collections = self.client.collections.list_all()
            return [collection.name for collection in collections]
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        """
        刪除集合
        
        Args:
            collection_name: 集合名稱
            
        Returns:
            bool: 是否成功刪除
        """
        try:
            if not self.collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} does not exist")
                return True
            
            self.client.collections.delete(collection_name)
            
            # 清除快取
            if collection_name in self._schema_cache:
                del self._schema_cache[collection_name]
            
            logger.info(f"Successfully deleted collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {e}")
            return False
    
    def update_collection_description(self, collection_name: str, description: str) -> bool:
        """
        更新集合描述
        
        Args:
            collection_name: 集合名稱
            description: 新描述
            
        Returns:
            bool: 是否成功更新
        """
        try:
            if not self.collection_exists(collection_name):
                logger.error(f"Collection {collection_name} does not exist")
                return False
            
            collection = self.client.collections.get(collection_name)
            collection.config.update(description=description)
            
            # 更新快取
            self._update_schema_cache(collection_name)
            
            logger.info(f"Successfully updated description for collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update collection description: {e}")
            return False
    
    def _analyze_data_structure(self, data_list: List[Dict[str, Any]]) -> List[Property]:
        """
        分析資料結構並生成屬性定義
        
        Args:
            data_list: 資料列表
            
        Returns:
            List[Property]: 屬性定義列表
        """
        property_types = {}
        
        # 分析所有資料項目
        for data in data_list:
            for key, value in data.items():
                if key.startswith('_'):  # 跳過內部欄位
                    continue
                    
                # 推斷資料類型
                inferred_type = self._infer_data_type(value)
                
                if key in property_types:
                    # 如果類型不一致，使用更通用的類型
                    if property_types[key] != inferred_type:
                        property_types[key] = DataType.TEXT
                else:
                    property_types[key] = inferred_type
        
        # 建立屬性列表
        properties = []
        for prop_name, prop_type in property_types.items():
            properties.append(Property(
                name=prop_name,
                data_type=prop_type,
                description=f"Auto-generated property for {prop_name}"
            ))
        
        return properties
    
    def _infer_data_type(self, value: Any) -> DataType:
        """
        推斷資料類型
        
        Args:
            value: 資料值
            
        Returns:
            DataType: Weaviate 資料類型
        """
        if value is None:
            return DataType.TEXT
        elif isinstance(value, bool):
            return DataType.BOOL
        elif isinstance(value, int):
            return DataType.INT
        elif isinstance(value, float):
            return DataType.NUMBER
        elif isinstance(value, str):
            # 檢查是否為日期時間格式
            if self._is_datetime_string(value):
                return DataType.DATE
            return DataType.TEXT
        elif isinstance(value, list):
            if value and isinstance(value[0], str):
                return DataType.TEXT_ARRAY
            elif value and isinstance(value[0], (int, float)):
                return DataType.NUMBER_ARRAY
            return DataType.TEXT_ARRAY
        elif isinstance(value, dict):
            return DataType.OBJECT
        else:
            return DataType.TEXT
    
    def _is_datetime_string(self, value: str) -> bool:
        """
        檢查字串是否為日期時間格式
        
        Args:
            value: 字串值
            
        Returns:
            bool: 是否為日期時間格式
        """
        datetime_formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%SZ"
        ]
        
        for fmt in datetime_formats:
            try:
                datetime.strptime(value, fmt)
                return True
            except ValueError:
                continue
        
        return False
    
    def _schema_to_dict(self, schema: Any) -> Dict[str, Any]:
        """
        將 schema 物件轉換為字典
        
        Args:
            schema: Weaviate schema 物件
            
        Returns:
            Dict: schema 字典
        """
        return {
            "name": schema.name,
            "description": schema.description,
            "properties": [
                {
                    "name": prop.name,
                    "dataType": prop.data_type.value,
                    "description": prop.description
                }
                for prop in schema.properties
            ],
            "vectorizer": getattr(schema, 'vectorizer', None),
            "vector_index_config": getattr(schema, 'vector_index_config', None)
        }
    
    def _update_schema_cache(self, collection_name: str):
        """
        更新 schema 快取
        
        Args:
            collection_name: 集合名稱
        """
        try:
            if collection_name in self._schema_cache:
                del self._schema_cache[collection_name]
            self.get_collection_schema(collection_name)  # 重新載入快取
        except Exception as e:
            logger.error(f"Error updating schema cache: {e}")
    
    def export_schema(self, collection_name: str, file_path: str) -> bool:
        """
        匯出集合 schema 到檔案
        
        Args:
            collection_name: 集合名稱
            file_path: 檔案路徑
            
        Returns:
            bool: 是否成功匯出
        """
        try:
            schema = self.get_collection_schema(collection_name)
            if schema is None:
                logger.error(f"Collection {collection_name} not found")
                return False
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(schema, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Successfully exported schema to {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export schema: {e}")
            return False
    
    def import_schema(self, file_path: str) -> bool:
        """
        從檔案匯入 schema 並建立集合
        
        Args:
            file_path: 檔案路徑
            
        Returns:
            bool: 是否成功匯入
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                schema_data = json.load(f)
            
            # 建立屬性列表
            properties = []
            for prop_data in schema_data.get('properties', []):
                properties.append(Property(
                    name=prop_data['name'],
                    data_type=DataType(prop_data['dataType']),
                    description=prop_data.get('description', '')
                ))
            
            # 建立集合
            return self.create_collection(
                collection_name=schema_data['name'],
                properties=properties,
                vector_config=schema_data.get('vector_index_config', {}),
                description=schema_data.get('description', '')
            )
            
        except Exception as e:
            logger.error(f"Failed to import schema: {e}")
            return False
