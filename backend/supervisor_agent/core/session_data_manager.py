"""
會話級數據狀態管理器

解決 filter 後數據無法自動被後續工具使用的問題
"""

import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class DataState:
    """數據狀態記錄"""
    original_file: str  # 原始文件路徑
    current_file: str   # 當前數據文件路徑
    operation: str      # 執行的操作 (filter, analysis, etc.)
    timestamp: str      # 操作時間
    metadata: Dict[str, Any]  # 額外元數據 (行數、列數等)
    description: str    # 操作描述


class SessionDataManager:
    """會話級數據狀態管理器"""
    
    def __init__(self):
        # 存儲每個會話的數據狀態
        self._session_states: Dict[str, List[DataState]] = {}
        # 存儲每個會話的當前數據文件
        self._current_data: Dict[str, str] = {}
    
    def update_data_state(self, session_id: str, original_file: str, 
                         current_file: str, operation: str, 
                         metadata: Dict[str, Any] = None,
                         description: str = "") -> None:
        """
        更新會話的數據狀態
        
        Args:
            session_id: 會話ID
            original_file: 原始文件路徑
            current_file: 當前數據文件路徑
            operation: 執行的操作
            metadata: 元數據
            description: 操作描述
        """
        if session_id not in self._session_states:
            self._session_states[session_id] = []
        
        # 創建新的數據狀態
        state = DataState(
            original_file=original_file,
            current_file=current_file,
            operation=operation,
            timestamp=datetime.now().isoformat(),
            metadata=metadata or {},
            description=description
        )
        
        # 添加到會話狀態歷史
        self._session_states[session_id].append(state)
        
        # 更新當前數據文件
        self._current_data[session_id] = current_file
        
        logger.info(f"📊 會話 {session_id} 數據狀態已更新: {operation} -> {current_file}")
    
    def get_current_data_file(self, session_id: str) -> Optional[str]:
        """
        獲取會話的當前數據文件路徑
        
        Args:
            session_id: 會話ID
            
        Returns:
            當前數據文件路徑，如果沒有則返回 None
        """
        return self._current_data.get(session_id)
    
    def resolve_file_path(self, session_id: str, file_path: str) -> str:
        """
        解析文件路徑，支持特殊標識符
        
        Args:
            session_id: 會話ID
            file_path: 文件路徑，可以是實際路徑或特殊標識符
            
        Returns:
            解析後的實際文件路徑
        """
        # 支持的特殊標識符
        if file_path in ["@current", "current", "latest"]:
            current_file = self.get_current_data_file(session_id)
            if current_file:
                logger.info(f"🔄 解析 '{file_path}' -> {current_file}")
                return current_file
            else:
                logger.warning(f"⚠️ 會話 {session_id} 沒有當前數據文件，無法解析 '{file_path}'")
                raise ValueError(f"會話 {session_id} 沒有當前數據文件")
        
        # 普通文件路徑直接返回
        return file_path
    
    def get_data_history(self, session_id: str) -> List[Dict[str, Any]]:
        """
        獲取會話的數據處理歷史
        
        Args:
            session_id: 會話ID
            
        Returns:
            數據處理歷史列表
        """
        if session_id not in self._session_states:
            return []
        
        return [asdict(state) for state in self._session_states[session_id]]
    
    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """
        獲取會話數據狀態摘要
        
        Args:
            session_id: 會話ID
            
        Returns:
            會話摘要信息
        """
        history = self.get_data_history(session_id)
        current_file = self.get_current_data_file(session_id)
        
        return {
            "session_id": session_id,
            "current_data_file": current_file,
            "operations_count": len(history),
            "last_operation": history[-1] if history else None,
            "has_current_data": current_file is not None
        }
    
    def clear_session_data(self, session_id: str) -> Dict[str, Any]:
        """
        清理會話的數據狀態
        
        Args:
            session_id: 會話ID
            
        Returns:
            清理結果
        """
        operations_count = len(self._session_states.get(session_id, []))
        current_file = self._current_data.get(session_id)
        
        # 清理狀態
        if session_id in self._session_states:
            del self._session_states[session_id]
        if session_id in self._current_data:
            del self._current_data[session_id]
        
        result = {
            "session_id": session_id,
            "cleared_operations": operations_count,
            "had_current_data": current_file is not None,
            "message": f"已清理會話 {session_id} 的數據狀態"
        }
        
        logger.info(f"🗑️ {result['message']}")
        return result
    
    def list_active_sessions(self) -> List[str]:
        """獲取有活躍數據狀態的會話列表"""
        return list(self._session_states.keys())


# 全局實例
session_data_manager = SessionDataManager()
