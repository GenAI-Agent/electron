"""
Task Memory API 路由

提供任務記憶、進度追蹤和會話管理功能。
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import logging

# 添加 src 目錄到路徑
current_dir = Path(__file__).parent
src_dir = current_dir.parent.parent / "src"
sys.path.insert(0, str(src_dir))

from task_memory.task_memory_manager import TaskMemoryManager
from task_memory.session_storage import SessionStorage
from task_memory.progress_tracker import ProgressTracker, TaskStatus

logger = logging.getLogger(__name__)

router = APIRouter()

# 全局實例
task_memory_manager = TaskMemoryManager()
session_storage = SessionStorage()
progress_tracker = ProgressTracker()


class CreateTaskRequest(BaseModel):
    """創建任務請求"""
    session_id: str = Field(..., description="會話ID")
    task_id: str = Field(..., description="任務ID")
    items: List[Any] = Field(..., description="要處理的項目列表")
    batch_size: int = Field(default=10, description="批次大小")
    task_type: str = Field(default="batch_processing", description="任務類型")


class UpdateProgressRequest(BaseModel):
    """更新進度請求"""
    session_id: str = Field(..., description="會話ID")
    task_id: str = Field(..., description="任務ID")
    processed_items: Optional[int] = Field(default=None, description="已處理項目數")
    current_batch: Optional[int] = Field(default=None, description="當前批次")
    success_count: Optional[int] = Field(default=None, description="成功數量")
    error_count: Optional[int] = Field(default=None, description="錯誤數量")
    additional_data: Optional[Dict[str, Any]] = Field(default=None, description="額外數據")


class TaskStatusRequest(BaseModel):
    """任務狀態請求"""
    session_id: str = Field(..., description="會話ID")
    task_id: str = Field(..., description="任務ID")
    status: str = Field(..., description="新狀態")
    message: Optional[str] = Field(default=None, description="狀態消息")


class SaveDataRequest(BaseModel):
    """保存數據請求"""
    session_id: str = Field(..., description="會話ID")
    data_id: str = Field(..., description="數據ID")
    data: Dict[str, Any] = Field(..., description="要保存的數據")


@router.post("/sessions/create")
async def create_session(session_id: str):
    """創建新會話"""
    try:
        logger.info(f"創建會話: {session_id}")
        
        session_info = session_storage.create_session(session_id)
        
        return {
            "success": True,
            "session_info": session_info,
            "message": "會話創建成功"
        }
        
    except Exception as e:
        logger.error(f"創建會話失敗 {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """獲取會話信息"""
    try:
        session_info = session_storage.get_session_info(session_id)
        
        if not session_info:
            raise HTTPException(status_code=404, detail=f"會話不存在: {session_id}")
        
        return {
            "success": True,
            "session_info": session_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"獲取會話信息失敗 {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/summary")
async def get_session_summary(session_id: str):
    """獲取會話摘要"""
    try:
        summary = task_memory_manager.get_session_summary(session_id)
        
        return {
            "success": True,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"獲取會話摘要失敗 {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/create")
async def create_task(request: CreateTaskRequest):
    """創建批次處理任務"""
    try:
        logger.info(f"創建任務: {request.session_id}/{request.task_id}")
        
        task_info = await task_memory_manager.create_batch_task(
            request.session_id,
            request.task_id,
            request.items,
            request.batch_size
        )
        
        return {
            "success": True,
            "task_info": task_info,
            "message": "任務創建成功"
        }
        
    except Exception as e:
        logger.error(f"創建任務失敗 {request.session_id}/{request.task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/update-progress")
async def update_task_progress(request: UpdateProgressRequest):
    """更新任務進度"""
    try:
        task_info = progress_tracker.update_progress(
            request.session_id,
            request.task_id,
            processed_items=request.processed_items,
            current_batch=request.current_batch,
            success_count=request.success_count,
            error_count=request.error_count,
            additional_data=request.additional_data
        )
        
        return {
            "success": True,
            "task_info": task_info,
            "message": "進度更新成功"
        }
        
    except Exception as e:
        logger.error(f"更新任務進度失敗 {request.session_id}/{request.task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/set-status")
async def set_task_status(request: TaskStatusRequest):
    """設置任務狀態"""
    try:
        # 驗證狀態值
        try:
            status = TaskStatus(request.status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"無效的狀態值: {request.status}")
        
        success = progress_tracker.set_task_status(
            request.session_id,
            request.task_id,
            status,
            request.message
        )
        
        if not success:
            raise HTTPException(status_code=404, detail=f"任務不存在: {request.task_id}")
        
        return {
            "success": True,
            "message": "狀態設置成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"設置任務狀態失敗 {request.session_id}/{request.task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{session_id}/{task_id}")
async def get_task_status(session_id: str, task_id: str):
    """獲取任務狀態"""
    try:
        task_info = task_memory_manager.get_task_status(session_id, task_id)
        
        if not task_info:
            raise HTTPException(status_code=404, detail=f"任務不存在: {task_id}")
        
        return {
            "success": True,
            "task_info": task_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"獲取任務狀態失敗 {session_id}/{task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{session_id}")
async def list_session_tasks(session_id: str):
    """列出會話的所有任務"""
    try:
        tasks = task_memory_manager.list_session_tasks(session_id)
        
        return {
            "success": True,
            "tasks": tasks,
            "count": len(tasks)
        }
        
    except Exception as e:
        logger.error(f"列出會話任務失敗 {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{session_id}/{task_id}/report")
async def get_task_report(session_id: str, task_id: str):
    """獲取任務報告"""
    try:
        report = task_memory_manager.generate_task_report(session_id, task_id)
        
        return {
            "success": True,
            "report": report
        }
        
    except Exception as e:
        logger.error(f"獲取任務報告失敗 {session_id}/{task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/data/save")
async def save_temp_data(request: SaveDataRequest):
    """保存暫存數據"""
    try:
        success = session_storage.save_temp_data(
            request.session_id,
            request.data_id,
            request.data
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="保存數據失敗")
        
        return {
            "success": True,
            "message": "數據保存成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"保存暫存數據失敗 {request.session_id}/{request.data_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/{session_id}/{data_id}")
async def load_temp_data(session_id: str, data_id: str):
    """加載暫存數據"""
    try:
        data = session_storage.load_temp_data(session_id, data_id)
        
        if data is None:
            raise HTTPException(status_code=404, detail=f"數據不存在: {data_id}")
        
        return {
            "success": True,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"加載暫存數據失敗 {session_id}/{data_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def cleanup_session(session_id: str):
    """清理會話"""
    try:
        success = session_storage.cleanup_session(session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"會話不存在: {session_id}")
        
        return {
            "success": True,
            "message": "會話清理成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"清理會話失敗 {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "service": "task_memory",
        "version": "1.0.0"
    }
