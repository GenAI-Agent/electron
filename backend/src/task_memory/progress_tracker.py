"""
Progress Tracker

追蹤循環任務的進度和狀態。
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
import logging

from .session_storage import SessionStorage

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """任務狀態"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ProgressTracker:
    """進度追蹤器"""
    
    def __init__(self, storage: Optional[SessionStorage] = None):
        self.storage = storage or SessionStorage()
    
    def create_task(self, session_id: str, task_id: str, task_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        創建新任務
        
        Args:
            session_id: 會話ID
            task_id: 任務ID
            task_config: 任務配置
            
        Returns:
            任務信息
        """
        try:
            task_info = {
                "task_id": task_id,
                "session_id": session_id,
                "status": TaskStatus.PENDING.value,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "config": task_config,
                "progress": {
                    "total_items": task_config.get("total_items", 0),
                    "processed_items": 0,
                    "current_batch": 0,
                    "total_batches": 0,
                    "success_count": 0,
                    "error_count": 0,
                    "percentage": 0.0
                },
                "results": {
                    "processed_data": [],
                    "errors": [],
                    "summary": {}
                },
                "checkpoints": []
            }
            
            # 計算批次數
            batch_size = task_config.get("batch_size", 10)
            total_items = task_config.get("total_items", 0)
            if total_items > 0 and batch_size > 0:
                task_info["progress"]["total_batches"] = (total_items + batch_size - 1) // batch_size
            
            # 保存任務狀態
            self._save_task_state(session_id, task_id, task_info)
            
            logger.info(f"創建任務: {session_id}/{task_id}")
            return task_info
            
        except Exception as e:
            logger.error(f"創建任務失敗 {session_id}/{task_id}: {e}")
            raise
    
    def update_progress(self, session_id: str, task_id: str, 
                       processed_items: int = None, 
                       current_batch: int = None,
                       success_count: int = None,
                       error_count: int = None,
                       additional_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        更新任務進度
        
        Args:
            session_id: 會話ID
            task_id: 任務ID
            processed_items: 已處理項目數
            current_batch: 當前批次
            success_count: 成功數量
            error_count: 錯誤數量
            additional_data: 額外數據
            
        Returns:
            更新後的任務信息
        """
        try:
            task_info = self.get_task_state(session_id, task_id)
            if not task_info:
                raise ValueError(f"任務不存在: {task_id}")
            
            # 更新進度
            progress = task_info["progress"]
            
            if processed_items is not None:
                progress["processed_items"] = processed_items
            if current_batch is not None:
                progress["current_batch"] = current_batch
            if success_count is not None:
                progress["success_count"] = success_count
            if error_count is not None:
                progress["error_count"] = error_count
            
            # 計算百分比
            total_items = progress["total_items"]
            if total_items > 0:
                progress["percentage"] = (progress["processed_items"] / total_items) * 100
            
            # 更新時間戳
            task_info["updated_at"] = datetime.now().isoformat()
            
            # 添加額外數據
            if additional_data:
                task_info["results"].update(additional_data)
            
            # 保存更新
            self._save_task_state(session_id, task_id, task_info)
            
            logger.debug(f"更新任務進度: {session_id}/{task_id} - {progress['percentage']:.1f}%")
            return task_info
            
        except Exception as e:
            logger.error(f"更新任務進度失敗 {session_id}/{task_id}: {e}")
            raise
    
    def add_checkpoint(self, session_id: str, task_id: str, checkpoint_data: Dict[str, Any]) -> bool:
        """
        添加檢查點
        
        Args:
            session_id: 會話ID
            task_id: 任務ID
            checkpoint_data: 檢查點數據
            
        Returns:
            是否成功
        """
        try:
            task_info = self.get_task_state(session_id, task_id)
            if not task_info:
                return False
            
            checkpoint = {
                "timestamp": datetime.now().isoformat(),
                "progress": task_info["progress"].copy(),
                "data": checkpoint_data
            }
            
            task_info["checkpoints"].append(checkpoint)
            task_info["updated_at"] = datetime.now().isoformat()
            
            # 限制檢查點數量
            max_checkpoints = 10
            if len(task_info["checkpoints"]) > max_checkpoints:
                task_info["checkpoints"] = task_info["checkpoints"][-max_checkpoints:]
            
            self._save_task_state(session_id, task_id, task_info)
            
            logger.debug(f"添加檢查點: {session_id}/{task_id}")
            return True
            
        except Exception as e:
            logger.error(f"添加檢查點失敗 {session_id}/{task_id}: {e}")
            return False
    
    def set_task_status(self, session_id: str, task_id: str, status: TaskStatus, 
                       message: str = None) -> bool:
        """
        設置任務狀態
        
        Args:
            session_id: 會話ID
            task_id: 任務ID
            status: 新狀態
            message: 狀態消息
            
        Returns:
            是否成功
        """
        try:
            task_info = self.get_task_state(session_id, task_id)
            if not task_info:
                return False
            
            old_status = task_info["status"]
            task_info["status"] = status.value
            task_info["updated_at"] = datetime.now().isoformat()
            
            if message:
                task_info["status_message"] = message
            
            # 如果任務完成，計算總耗時
            if status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                created_at = datetime.fromisoformat(task_info["created_at"])
                updated_at = datetime.fromisoformat(task_info["updated_at"])
                duration = (updated_at - created_at).total_seconds()
                task_info["duration_seconds"] = duration
            
            self._save_task_state(session_id, task_id, task_info)
            
            logger.info(f"任務狀態變更: {session_id}/{task_id} {old_status} -> {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"設置任務狀態失敗 {session_id}/{task_id}: {e}")
            return False
    
    def get_task_state(self, session_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """獲取任務狀態"""
        try:
            return self.storage.load_temp_data(session_id, f"task_{task_id}")
        except Exception as e:
            logger.error(f"獲取任務狀態失敗 {session_id}/{task_id}: {e}")
            return None
    
    def list_tasks(self, session_id: str) -> List[Dict[str, Any]]:
        """列出會話的所有任務"""
        try:
            temp_data_ids = self.storage.list_temp_data(session_id)
            tasks = []
            
            for data_id in temp_data_ids:
                if data_id.startswith("task_"):
                    task_data = self.storage.load_temp_data(session_id, data_id)
                    if task_data:
                        tasks.append(task_data)
            
            # 按創建時間排序
            tasks.sort(key=lambda x: x.get("created_at", ""))
            return tasks
            
        except Exception as e:
            logger.error(f"列出任務失敗 {session_id}: {e}")
            return []
    
    def resume_task(self, session_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """恢復任務"""
        try:
            task_info = self.get_task_state(session_id, task_id)
            if not task_info:
                return None
            
            if task_info["status"] in [TaskStatus.PAUSED.value, TaskStatus.FAILED.value]:
                self.set_task_status(session_id, task_id, TaskStatus.RUNNING, "任務已恢復")
                return task_info
            
            return task_info
            
        except Exception as e:
            logger.error(f"恢復任務失敗 {session_id}/{task_id}: {e}")
            return None
    
    def generate_summary_report(self, session_id: str, task_id: str) -> Dict[str, Any]:
        """生成任務摘要報告"""
        try:
            task_info = self.get_task_state(session_id, task_id)
            if not task_info:
                return {"error": "任務不存在"}
            
            progress = task_info["progress"]
            
            report = {
                "task_id": task_id,
                "session_id": session_id,
                "status": task_info["status"],
                "created_at": task_info["created_at"],
                "updated_at": task_info["updated_at"],
                "duration_seconds": task_info.get("duration_seconds"),
                "progress_summary": {
                    "total_items": progress["total_items"],
                    "processed_items": progress["processed_items"],
                    "success_rate": (progress["success_count"] / max(progress["processed_items"], 1)) * 100,
                    "error_rate": (progress["error_count"] / max(progress["processed_items"], 1)) * 100,
                    "completion_percentage": progress["percentage"]
                },
                "performance_metrics": {
                    "items_per_second": 0,
                    "estimated_remaining_time": 0
                },
                "checkpoints_count": len(task_info.get("checkpoints", [])),
                "results_summary": task_info["results"].get("summary", {})
            }
            
            # 計算性能指標
            if task_info.get("duration_seconds") and progress["processed_items"] > 0:
                report["performance_metrics"]["items_per_second"] = progress["processed_items"] / task_info["duration_seconds"]
                
                remaining_items = progress["total_items"] - progress["processed_items"]
                if report["performance_metrics"]["items_per_second"] > 0:
                    report["performance_metrics"]["estimated_remaining_time"] = remaining_items / report["performance_metrics"]["items_per_second"]
            
            return report
            
        except Exception as e:
            logger.error(f"生成摘要報告失敗 {session_id}/{task_id}: {e}")
            return {"error": str(e)}
    
    def _save_task_state(self, session_id: str, task_id: str, task_info: Dict[str, Any]) -> bool:
        """保存任務狀態"""
        return self.storage.save_temp_data(session_id, f"task_{task_id}", task_info)


# 全局進度追蹤器實例
progress_tracker = ProgressTracker()
