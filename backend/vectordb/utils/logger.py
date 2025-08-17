"""
VectorDB 日誌工具
提供結構化日誌記錄功能
"""

import logging
import sys
from pathlib import Path
from typing import Optional
from rich.logging import RichHandler
from rich.console import Console


def setup_logger(
    name: str = "vectordb",
    level: str = "INFO",
    log_file: Optional[str] = None,
    rich_console: bool = True
) -> logging.Logger:
    """
    設定日誌記錄器
    
    Args:
        name: 記錄器名稱
        level: 日誌級別
        log_file: 日誌檔案路徑（可選）
        rich_console: 是否使用 Rich 控制台輸出
        
    Returns:
        logging.Logger: 配置好的記錄器
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # 避免重複添加處理器
    if logger.handlers:
        return logger
    
    # 日誌格式
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # 控制台處理器
    if rich_console:
        console_handler = RichHandler(
            console=Console(stderr=True),
            show_time=True,
            show_path=True
        )
    else:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    
    # 檔案處理器
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


# 預設記錄器
default_logger = setup_logger()
