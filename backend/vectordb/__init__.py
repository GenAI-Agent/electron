"""
Weaviate Vector Database 管理系統
支援動態 schema 管理和多資料庫分離儲存
"""

from .core.vectordb_client import VectorDBClient
from .managers.multi_db_manager import MultiDBManager
from .managers.schema_manager import SchemaManager
from .config.weaviate_config import WeaviateConfig

__all__ = [
    "VectorDBClient",
    "MultiDBManager", 
    "SchemaManager",
    "WeaviateConfig"
]
