"""
多資料庫管理器
支援建立和管理多個獨立的向量資料庫實例，實現資料分離儲存
"""

import logging
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
import weaviate
from weaviate.classes.init import Auth

from ..config.weaviate_config import WeaviateConfig
from ..core.vectordb_client import VectorDBClient
from .schema_manager import SchemaManager


logger = logging.getLogger(__name__)


class MultiDBManager:
    """多資料庫管理器"""
    
    def __init__(self, base_config: Optional[WeaviateConfig] = None):
        """
        初始化多資料庫管理器
        
        Args:
            base_config: 基礎配置，用於建立新的資料庫實例
        """
        self.base_config = base_config or WeaviateConfig.from_env()
        self._db_instances: Dict[str, VectorDBClient] = {}
        self._db_configs: Dict[str, WeaviateConfig] = {}
        self._db_metadata: Dict[str, Dict[str, Any]] = {}
        
    def create_database(
        self,
        db_name: str,
        config: Optional[WeaviateConfig] = None,
        description: Optional[str] = None,
        auto_connect: bool = True
    ) -> bool:
        """
        建立新的資料庫實例
        
        Args:
            db_name: 資料庫名稱
            config: 特定配置，若無則使用基礎配置
            description: 資料庫描述
            auto_connect: 是否自動連線
            
        Returns:
            bool: 是否成功建立
        """
        try:
            if db_name in self._db_instances:
                logger.warning(f"Database {db_name} already exists")
                return True
            
            # 使用指定配置或基礎配置
            db_config = config or self._create_db_specific_config(db_name)
            
            # 建立資料庫客戶端
            db_client = VectorDBClient(db_config)
            
            if auto_connect:
                if not db_client.connect():
                    logger.error(f"Failed to connect to database {db_name}")
                    return False
            
            # 儲存實例和配置
            self._db_instances[db_name] = db_client
            self._db_configs[db_name] = db_config
            self._db_metadata[db_name] = {
                "name": db_name,
                "description": description or f"Database instance: {db_name}",
                "created_at": datetime.now().isoformat(),
                "collections_count": 0,
                "total_objects": 0,
                "last_updated": datetime.now().isoformat()
            }
            
            logger.info(f"Successfully created database: {db_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create database {db_name}: {e}")
            return False
    
    def get_database(self, db_name: str) -> Optional[VectorDBClient]:
        """
        取得資料庫實例
        
        Args:
            db_name: 資料庫名稱
            
        Returns:
            VectorDBClient: 資料庫客戶端實例或 None
        """
        if db_name not in self._db_instances:
            logger.error(f"Database {db_name} not found")
            return None
        
        db_client = self._db_instances[db_name]
        
        # 檢查連線狀態
        if not db_client.is_connected():
            logger.info(f"Reconnecting to database {db_name}")
            if not db_client.connect():
                logger.error(f"Failed to reconnect to database {db_name}")
                return None
        
        return db_client
    
    def list_databases(self) -> List[str]:
        """
        列出所有資料庫名稱
        
        Returns:
            List[str]: 資料庫名稱列表
        """
        return list(self._db_instances.keys())
    
    def get_database_info(self, db_name: str) -> Optional[Dict[str, Any]]:
        """
        取得資料庫資訊
        
        Args:
            db_name: 資料庫名稱
            
        Returns:
            Dict: 資料庫資訊或 None
        """
        if db_name not in self._db_metadata:
            return None
        
        # 更新統計資訊
        self._update_database_stats(db_name)
        
        return self._db_metadata[db_name].copy()
    
    def delete_database(self, db_name: str, confirm: bool = False) -> bool:
        """
        刪除資料庫實例
        
        Args:
            db_name: 資料庫名稱
            confirm: 確認刪除
            
        Returns:
            bool: 是否成功刪除
        """
        if not confirm:
            logger.warning(f"Database deletion requires confirmation for {db_name}")
            return False
        
        try:
            if db_name not in self._db_instances:
                logger.warning(f"Database {db_name} not found")
                return True
            
            # 關閉連線
            db_client = self._db_instances[db_name]
            db_client.disconnect()
            
            # 移除實例和配置
            del self._db_instances[db_name]
            del self._db_configs[db_name]
            del self._db_metadata[db_name]
            
            logger.info(f"Successfully deleted database: {db_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete database {db_name}: {e}")
            return False
    
    def switch_database(self, from_db: str, to_db: str) -> bool:
        """
        切換資料庫（將一個資料庫的別名指向另一個）
        
        Args:
            from_db: 來源資料庫名稱
            to_db: 目標資料庫名稱
            
        Returns:
            bool: 是否成功切換
        """
        try:
            if to_db not in self._db_instances:
                logger.error(f"Target database {to_db} not found")
                return False
            
            # 建立別名
            self._db_instances[from_db] = self._db_instances[to_db]
            self._db_configs[from_db] = self._db_configs[to_db]
            
            # 更新元數據
            if from_db not in self._db_metadata:
                self._db_metadata[from_db] = self._db_metadata[to_db].copy()
                self._db_metadata[from_db]["name"] = from_db
                self._db_metadata[from_db]["description"] = f"Alias for {to_db}"
            
            logger.info(f"Successfully switched database {from_db} to point to {to_db}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to switch database: {e}")
            return False
    
    def backup_database(self, db_name: str, backup_path: str) -> bool:
        """
        備份資料庫
        
        Args:
            db_name: 資料庫名稱
            backup_path: 備份路徑
            
        Returns:
            bool: 是否成功備份
        """
        try:
            db_client = self.get_database(db_name)
            if not db_client:
                return False
            
            # 使用資料庫客戶端的備份功能
            return db_client.backup_collections(backup_path)
            
        except Exception as e:
            logger.error(f"Failed to backup database {db_name}: {e}")
            return False
    
    def restore_database(self, db_name: str, backup_path: str) -> bool:
        """
        還原資料庫
        
        Args:
            db_name: 資料庫名稱
            backup_path: 備份路徑
            
        Returns:
            bool: 是否成功還原
        """
        try:
            db_client = self.get_database(db_name)
            if not db_client:
                return False
            
            # 使用資料庫客戶端的還原功能
            return db_client.restore_collections(backup_path)
            
        except Exception as e:
            logger.error(f"Failed to restore database {db_name}: {e}")
            return False
    
    def get_database_collections(self, db_name: str) -> List[str]:
        """
        取得資料庫中的所有集合
        
        Args:
            db_name: 資料庫名稱
            
        Returns:
            List[str]: 集合名稱列表
        """
        try:
            db_client = self.get_database(db_name)
            if not db_client:
                return []
            
            return db_client.schema_manager.list_collections()
            
        except Exception as e:
            logger.error(f"Failed to get collections for database {db_name}: {e}")
            return []
    
    def copy_collection_between_databases(
        self,
        source_db: str,
        target_db: str,
        collection_name: str,
        new_collection_name: Optional[str] = None
    ) -> bool:
        """
        在資料庫間複製集合
        
        Args:
            source_db: 來源資料庫
            target_db: 目標資料庫
            collection_name: 集合名稱
            new_collection_name: 新集合名稱（可選）
            
        Returns:
            bool: 是否成功複製
        """
        try:
            source_client = self.get_database(source_db)
            target_client = self.get_database(target_db)
            
            if not source_client or not target_client:
                return False
            
            target_collection_name = new_collection_name or collection_name
            
            # 取得來源集合的 schema
            source_schema = source_client.schema_manager.get_collection_schema(collection_name)
            if not source_schema:
                logger.error(f"Collection {collection_name} not found in source database")
                return False
            
            # 在目標資料庫建立集合
            # 這裡需要實作具體的複製邏輯
            # 包括 schema 複製和資料複製
            
            logger.info(f"Collection copying feature needs implementation")
            return False
            
        except Exception as e:
            logger.error(f"Failed to copy collection: {e}")
            return False
    
    def get_all_database_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        取得所有資料庫的統計資訊
        
        Returns:
            Dict: 所有資料庫的統計資訊
        """
        stats = {}
        
        for db_name in self._db_instances.keys():
            stats[db_name] = self.get_database_info(db_name)
        
        return stats
    
    def disconnect_all(self):
        """關閉所有資料庫連線"""
        for db_name, db_client in self._db_instances.items():
            try:
                db_client.disconnect()
                logger.info(f"Disconnected from database: {db_name}")
            except Exception as e:
                logger.error(f"Error disconnecting from database {db_name}: {e}")
    
    def _create_db_specific_config(self, db_name: str) -> WeaviateConfig:
        """
        為特定資料庫建立配置
        
        Args:
            db_name: 資料庫名稱
            
        Returns:
            WeaviateConfig: 資料庫特定配置
        """
        # 複製基礎配置
        config = WeaviateConfig(
            mode=self.base_config.mode,
            host=self.base_config.host,
            port=self.base_config.port,
            scheme=self.base_config.scheme,
            cluster_url=self.base_config.cluster_url,
            api_key=self.base_config.api_key,
            username=self.base_config.username,
            password=self.base_config.password,
            timeout=self.base_config.timeout,
            startup_period=self.base_config.startup_period,
            additional_headers=self.base_config.additional_headers.copy()
        )
        
        # 可以根據資料庫名稱調整配置
        # 例如：不同的端口、不同的數據路徑等
        if self.base_config.mode.value == "embedded":
            config.persistence_data_path = f"{self.base_config.persistence_data_path}_{db_name}"
        
        # 在 headers 中添加資料庫標識
        config.additional_headers["X-Database-Name"] = db_name
        
        return config
    
    def _update_database_stats(self, db_name: str):
        """
        更新資料庫統計資訊
        
        Args:
            db_name: 資料庫名稱
        """
        try:
            db_client = self.get_database(db_name)
            if not db_client:
                return
            
            # 取得集合列表
            collections = db_client.schema_manager.list_collections()
            
            # 計算總物件數量
            total_objects = 0
            for collection_name in collections:
                try:
                    count = db_client.count_objects(collection_name)
                    total_objects += count
                except Exception:
                    pass  # 忽略個別集合的錯誤
            
            # 更新元數據
            self._db_metadata[db_name].update({
                "collections_count": len(collections),
                "total_objects": total_objects,
                "last_updated": datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error updating database stats for {db_name}: {e}")
    
    def __enter__(self):
        """Context manager 入口"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager 出口"""
        self.disconnect_all()
