"""
日誌工具模塊

提供統一的日誌配置和管理功能。
"""

import logging
import sys
from typing import Dict, Any


def setup_logging(config: Dict[str, Any] = None):
    """設置日誌配置"""
    if config is None:
        config = {
            "level": "INFO",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    
    level = getattr(logging, config.get("level", "INFO").upper())
    format_str = config.get("format", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    
    logging.basicConfig(
        level=level,
        format=format_str,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


def get_logger(name: str) -> logging.Logger:
    """獲取日誌記錄器"""
    return logging.getLogger(name)
