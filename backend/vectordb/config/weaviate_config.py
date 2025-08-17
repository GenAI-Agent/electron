"""
Weaviate 資料庫配置管理
支援本地和雲端部署配置
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class WeaviateMode(Enum):
    """Weaviate 部署模式"""
    LOCAL = "local"
    CLOUD = "cloud" 
    EMBEDDED = "embedded"


@dataclass
class WeaviateConfig:
    """Weaviate 配置類別"""
    
    # 基本配置
    mode: WeaviateMode = WeaviateMode.LOCAL
    host: str = "localhost"
    port: int = 8080
    scheme: str = "http"
    
    # 雲端配置 (WCS)
    cluster_url: Optional[str] = None
    api_key: Optional[str] = None
    
    # 認證配置
    username: Optional[str] = None
    password: Optional[str] = None
    
    # 進階配置
    timeout: int = 30
    startup_period: int = 5
    additional_headers: Dict[str, str] = field(default_factory=dict)
    
    # 嵌入式配置
    persistence_data_path: str = "./weaviate_data"
    binary_path: Optional[str] = None
    version: str = "1.22.4"
    
    @classmethod
    def from_env(cls) -> "WeaviateConfig":
        """從環境變數建立配置"""
        mode_str = os.getenv("WEAVIATE_MODE", "local").lower()
        mode = WeaviateMode(mode_str)
        
        config = cls(
            mode=mode,
            host=os.getenv("WEAVIATE_HOST", "localhost"),
            port=int(os.getenv("WEAVIATE_PORT", "8080")),
            scheme=os.getenv("WEAVIATE_SCHEME", "http"),
            cluster_url=os.getenv("WEAVIATE_CLUSTER_URL"),
            api_key=os.getenv("WEAVIATE_API_KEY"),
            username=os.getenv("WEAVIATE_USERNAME"),
            password=os.getenv("WEAVIATE_PASSWORD"),
            timeout=int(os.getenv("WEAVIATE_TIMEOUT", "30")),
            persistence_data_path=os.getenv("WEAVIATE_DATA_PATH", "./weaviate_data"),
            version=os.getenv("WEAVIATE_VERSION", "1.22.4")
        )
        
        return config
    
    @property
    def url(self) -> str:
        """取得完整的 Weaviate URL"""
        if self.mode == WeaviateMode.CLOUD and self.cluster_url:
            return self.cluster_url
        return f"{self.scheme}://{self.host}:{self.port}"
    
    def to_client_config(self) -> Dict[str, Any]:
        """轉換為 Weaviate 客戶端配置"""
        config = {
            "url": self.url,
            "timeout": self.timeout,
            "startup_period": self.startup_period
        }
        
        # 添加認證
        if self.api_key:
            config["auth_client_secret"] = {
                "api_key": self.api_key
            }
        elif self.username and self.password:
            config["auth_client_secret"] = {
                "username": self.username,
                "password": self.password
            }
        
        # 添加額外標頭
        if self.additional_headers:
            config["additional_headers"] = self.additional_headers
            
        return config


# 預設配置實例
DEFAULT_CONFIG = WeaviateConfig.from_env()
