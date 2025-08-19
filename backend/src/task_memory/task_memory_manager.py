"""
Task Memory Manager

統一管理任務記憶、會話存儲和進度追蹤。
"""

import asyncio
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
import logging

from .session_storage import SessionStorage
from .progress_tracker import ProgressTracker, TaskStatus

logger = logging.getLogger(__name__)


class TaskMemoryManager:
    """任務記憶管理器"""
    
    def __init__(self):
        self.storage = SessionStorage()
        self.tracker = ProgressTracker(self.storage)
    
    async def create_batch_task(self, session_id: str, task_id: str, 
                               items: List[Any], batch_size: int = 10,
                               processor_func: Callable = None) -> Dict[str, Any]:
        """
        創建批次處理任務
        
        Args:
            session_id: 會話ID
            task_id: 任務ID
            items: 要處理的項目列表
            batch_size: 批次大小
            processor_func: 處理函數
            
        Returns:
            任務信息
        """
        try:
            task_config = {
                "type": "batch_processing",
                "total_items": len(items),
                "batch_size": batch_size,
                "processor_func": processor_func.__name__ if processor_func else None,
                "created_by": "task_memory_manager"
            }
            
            # 創建任務
            task_info = self.tracker.create_task(session_id, task_id, task_config)
            
            # 保存項目數據
            self.storage.save_temp_data(session_id, f"items_{task_id}", {
                "items": items,
                "batch_size": batch_size
            })
            
            logger.info(f"創建批次任務: {session_id}/{task_id}, 項目數: {len(items)}")
            return task_info
            
        except Exception as e:
            logger.error(f"創建批次任務失敗 {session_id}/{task_id}: {e}")
            raise
    
    async def process_batch_task(self, session_id: str, task_id: str, 
                                processor_func: Callable,
                                on_batch_complete: Callable = None,
                                on_error: Callable = None) -> Dict[str, Any]:
        """
        處理批次任務
        
        Args:
            session_id: 會話ID
            task_id: 任務ID
            processor_func: 處理函數
            on_batch_complete: 批次完成回調
            on_error: 錯誤處理回調
            
        Returns:
            處理結果
        """
        try:
            # 獲取任務狀態
            task_info = self.tracker.get_task_state(session_id, task_id)
            if not task_info:
                raise ValueError(f"任務不存在: {task_id}")
            
            # 設置任務為運行狀態
            self.tracker.set_task_status(session_id, task_id, TaskStatus.RUNNING)
            
            # 獲取項目數據
            items_data = self.storage.load_temp_data(session_id, f"items_{task_id}")
            if not items_data:
                raise ValueError(f"項目數據不存在: {task_id}")
            
            items = items_data["items"]
            batch_size = items_data["batch_size"]
            
            # 獲取當前進度
            progress = task_info["progress"]
            start_index = progress["processed_items"]
            
            results = []
            errors = []
            
            # 分批處理
            for i in range(start_index, len(items), batch_size):
                batch = items[i:i + batch_size]
                batch_number = (i // batch_size) + 1
                
                try:
                    logger.info(f"處理批次 {batch_number}: {len(batch)} 項目")
                    
                    # 處理批次
                    batch_results = await self._process_batch(batch, processor_func)
                    results.extend(batch_results)
                    
                    # 更新進度
                    processed_count = min(i + batch_size, len(items))
                    success_count = len([r for r in batch_results if r.get("success", False)])
                    error_count = len([r for r in batch_results if not r.get("success", False)])
                    
                    self.tracker.update_progress(
                        session_id, task_id,
                        processed_items=processed_count,
                        current_batch=batch_number,
                        success_count=progress["success_count"] + success_count,
                        error_count=progress["error_count"] + error_count
                    )
                    
                    # 保存中間結果
                    self.storage.save_temp_data(session_id, f"results_{task_id}", {
                        "results": results,
                        "errors": errors,
                        "last_batch": batch_number
                    })
                    
                    # 添加檢查點
                    self.tracker.add_checkpoint(session_id, task_id, {
                        "batch_number": batch_number,
                        "batch_size": len(batch),
                        "batch_results": batch_results
                    })
                    
                    # 調用批次完成回調
                    if on_batch_complete:
                        await on_batch_complete(batch_number, batch_results)
                    
                except Exception as e:
                    logger.error(f"批次處理失敗 {batch_number}: {e}")
                    errors.append({
                        "batch_number": batch_number,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    if on_error:
                        await on_error(batch_number, e)
                    
                    # 根據錯誤策略決定是否繼續
                    # 這裡簡單地繼續處理下一批次
                    continue
            
            # 任務完成
            self.tracker.set_task_status(session_id, task_id, TaskStatus.COMPLETED, "批次處理完成")
            
            # 生成最終報告
            final_results = {
                "total_processed": len(items),
                "successful_results": len([r for r in results if r.get("success", False)]),
                "failed_results": len([r for r in results if not r.get("success", False)]),
                "errors": errors,
                "results": results
            }
            
            # 保存最終結果
            self.storage.save_temp_data(session_id, f"final_results_{task_id}", final_results)
            
            logger.info(f"批次任務完成: {session_id}/{task_id}")
            return final_results
            
        except Exception as e:
            logger.error(f"批次任務處理失敗 {session_id}/{task_id}: {e}")
            self.tracker.set_task_status(session_id, task_id, TaskStatus.FAILED, str(e))
            raise
    
    async def _process_batch(self, batch: List[Any], processor_func: Callable) -> List[Dict[str, Any]]:
        """處理單個批次"""
        results = []
        
        for item in batch:
            try:
                if asyncio.iscoroutinefunction(processor_func):
                    result = await processor_func(item)
                else:
                    result = processor_func(item)
                
                results.append({
                    "success": True,
                    "item": item,
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                results.append({
                    "success": False,
                    "item": item,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        return results
    
    def pause_task(self, session_id: str, task_id: str) -> bool:
        """暫停任務"""
        return self.tracker.set_task_status(session_id, task_id, TaskStatus.PAUSED, "任務已暫停")
    
    def resume_task(self, session_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """恢復任務"""
        return self.tracker.resume_task(session_id, task_id)
    
    def cancel_task(self, session_id: str, task_id: str) -> bool:
        """取消任務"""
        return self.tracker.set_task_status(session_id, task_id, TaskStatus.CANCELLED, "任務已取消")
    
    def get_task_status(self, session_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        """獲取任務狀態"""
        return self.tracker.get_task_state(session_id, task_id)
    
    def list_session_tasks(self, session_id: str) -> List[Dict[str, Any]]:
        """列出會話的所有任務"""
        return self.tracker.list_tasks(session_id)
    
    def generate_task_report(self, session_id: str, task_id: str) -> Dict[str, Any]:
        """生成任務報告"""
        return self.tracker.generate_summary_report(session_id, task_id)
    
    def cleanup_task_data(self, session_id: str, task_id: str) -> bool:
        """清理任務數據"""
        try:
            # 清理相關的暫存數據
            data_keys = [
                f"task_{task_id}",
                f"items_{task_id}",
                f"results_{task_id}",
                f"final_results_{task_id}"
            ]
            
            for key in data_keys:
                # 這裡需要實現刪除暫存數據的方法
                pass
            
            logger.info(f"清理任務數據: {session_id}/{task_id}")
            return True
            
        except Exception as e:
            logger.error(f"清理任務數據失敗 {session_id}/{task_id}: {e}")
            return False
    
    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """獲取會話摘要"""
        try:
            session_info = self.storage.get_session_info(session_id)
            tasks = self.list_session_tasks(session_id)
            
            summary = {
                "session_id": session_id,
                "session_info": session_info,
                "tasks_count": len(tasks),
                "tasks_by_status": {},
                "total_processed_items": 0,
                "active_tasks": []
            }
            
            # 統計任務狀態
            for task in tasks:
                status = task.get("status", "unknown")
                summary["tasks_by_status"][status] = summary["tasks_by_status"].get(status, 0) + 1
                
                # 統計處理項目數
                progress = task.get("progress", {})
                summary["total_processed_items"] += progress.get("processed_items", 0)
                
                # 收集活躍任務
                if status in [TaskStatus.RUNNING.value, TaskStatus.PAUSED.value]:
                    summary["active_tasks"].append({
                        "task_id": task["task_id"],
                        "status": status,
                        "progress": progress.get("percentage", 0)
                    })
            
            return summary
            
        except Exception as e:
            logger.error(f"獲取會話摘要失敗 {session_id}: {e}")
            return {"error": str(e)}


# 全局任務記憶管理器實例
task_memory_manager = TaskMemoryManager()
