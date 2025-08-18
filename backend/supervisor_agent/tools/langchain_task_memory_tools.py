"""
Task Memory Tools for LangChain Integration

提供任務記憶管理工具，支持批次處理和循環任務。
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
from langchain_core.tools import tool

from ...src.task_memory.task_memory_manager import TaskMemoryManager
from ..utils.logger import get_logger

logger = get_logger(__name__)

# 全局 Task Memory Manager 實例
task_memory_manager = TaskMemoryManager()


@tool
async def create_batch_task_tool(session_id: str, task_id: str, items: List[Any], 
                                batch_size: int = 10) -> str:
    """
    創建批次處理任務
    
    Args:
        session_id: 會話ID
        task_id: 任務ID  
        items: 要處理的項目列表（如1000筆資料）
        batch_size: 每批處理的數量，默認10
        
    Returns:
        任務創建結果的JSON字符串
    """
    try:
        logger.info(f"🔄 創建批次任務: {session_id}/{task_id}, 項目數: {len(items)}")
        
        task_info = await task_memory_manager.create_batch_task(
            session_id=session_id,
            task_id=task_id,
            items=items,
            batch_size=batch_size
        )
        
        result = {
            "success": True,
            "task_info": task_info,
            "message": f"成功創建批次任務，共 {len(items)} 項目，每批 {batch_size} 個"
        }
        
        return json.dumps(result, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 創建批次任務失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def get_task_status_tool(session_id: str, task_id: str) -> str:
    """
    獲取任務狀態和進度
    
    Args:
        session_id: 會話ID
        task_id: 任務ID
        
    Returns:
        任務狀態的JSON字符串
    """
    try:
        task_status = task_memory_manager.get_task_status(session_id, task_id)
        
        if task_status:
            return json.dumps({
                "success": True,
                "task_status": task_status
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": f"任務不存在: {task_id}"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"❌ 獲取任務狀態失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def save_temp_data_tool(session_id: str, data_id: str, data: Dict[str, Any]) -> str:
    """
    保存暫存數據到 tmp 空間
    
    Args:
        session_id: 會話ID
        data_id: 數據ID
        data: 要保存的數據
        
    Returns:
        保存結果的JSON字符串
    """
    try:
        success = task_memory_manager.storage.save_temp_data(session_id, data_id, data)
        
        if success:
            return json.dumps({
                "success": True,
                "message": f"成功保存暫存數據: {data_id}"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": "保存暫存數據失敗"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"❌ 保存暫存數據失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def load_temp_data_tool(session_id: str, data_id: str) -> str:
    """
    從 tmp 空間載入暫存數據
    
    Args:
        session_id: 會話ID
        data_id: 數據ID
        
    Returns:
        載入的數據JSON字符串
    """
    try:
        data = task_memory_manager.storage.load_temp_data(session_id, data_id)
        
        if data:
            return json.dumps({
                "success": True,
                "data": data
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": f"暫存數據不存在: {data_id}"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"❌ 載入暫存數據失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def list_session_tasks_tool(session_id: str) -> str:
    """
    列出會話的所有任務
    
    Args:
        session_id: 會話ID
        
    Returns:
        任務列表的JSON字符串
    """
    try:
        tasks = task_memory_manager.list_session_tasks(session_id)
        
        return json.dumps({
            "success": True,
            "tasks": tasks,
            "count": len(tasks)
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 列出會話任務失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def pause_task_tool(session_id: str, task_id: str) -> str:
    """
    暫停任務
    
    Args:
        session_id: 會話ID
        task_id: 任務ID
        
    Returns:
        操作結果的JSON字符串
    """
    try:
        success = task_memory_manager.pause_task(session_id, task_id)
        
        return json.dumps({
            "success": success,
            "message": "任務已暫停" if success else "暫停任務失敗"
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 暫停任務失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def resume_task_tool(session_id: str, task_id: str) -> str:
    """
    恢復任務
    
    Args:
        session_id: 會話ID
        task_id: 任務ID
        
    Returns:
        操作結果的JSON字符串
    """
    try:
        task_info = task_memory_manager.resume_task(session_id, task_id)
        
        if task_info:
            return json.dumps({
                "success": True,
                "task_info": task_info,
                "message": "任務已恢復"
            }, ensure_ascii=False)
        else:
            return json.dumps({
                "success": False,
                "error": "恢復任務失敗"
            }, ensure_ascii=False)
            
    except Exception as e:
        logger.error(f"❌ 恢復任務失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


@tool
async def generate_task_report_tool(session_id: str, task_id: str) -> str:
    """
    生成任務報告
    
    Args:
        session_id: 會話ID
        task_id: 任務ID
        
    Returns:
        任務報告的JSON字符串
    """
    try:
        report = task_memory_manager.generate_task_report(session_id, task_id)
        
        return json.dumps({
            "success": True,
            "report": report
        }, ensure_ascii=False)
        
    except Exception as e:
        logger.error(f"❌ 生成任務報告失敗: {e}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, ensure_ascii=False)


# 導出所有工具函數
def get_langchain_task_memory_tools():
    """獲取所有 Task Memory 工具"""
    return [
        create_batch_task_tool,
        get_task_status_tool,
        save_temp_data_tool,
        load_temp_data_tool,
        list_session_tasks_tool,
        pause_task_tool,
        resume_task_tool,
        generate_task_report_tool
    ]
