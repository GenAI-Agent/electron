"""
文件處理 API 路由

提供文件分析、摘要生成和文件操作功能。
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

from file_processor.summary_generator import SummaryGenerator
from file_processor.parallel_reader import ParallelFileReader
from file_processor.content_analyzer import ContentAnalyzer
from tools.data_file_tools import DataFileTools

logger = logging.getLogger(__name__)

router = APIRouter()

# 全局實例
summary_generator = SummaryGenerator()
file_reader = ParallelFileReader()
content_analyzer = ContentAnalyzer()
data_file_tools = DataFileTools()


class FileAnalysisRequest(BaseModel):
    """文件分析請求"""
    file_path: str = Field(..., description="文件路徑")
    min_lines: int = Field(default=30, description="最少行數")
    min_chars: int = Field(default=200, description="最少字符數")
    overlap: int = Field(default=5, description="重疊行數")


class FileEditRequest(BaseModel):
    """文件編輯請求"""
    file_path: str = Field(..., description="文件路徑")
    start_line: int = Field(..., description="開始行號")
    end_line: int = Field(..., description="結束行號")
    new_content: str = Field(..., description="新內容")


class FileCreateRequest(BaseModel):
    """文件創建請求"""
    file_path: str = Field(..., description="文件路徑")
    content: str = Field(default="", description="文件內容")
    encoding: str = Field(default="utf-8", description="文件編碼")


class DataFileReadRequest(BaseModel):
    """數據文件讀取請求"""
    file_path: str = Field(..., description="文件路徑")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="過濾條件")
    limit: Optional[int] = Field(default=None, description="限制返回行數")


class DataFileEditRequest(BaseModel):
    """數據文件編輯請求"""
    file_path: str = Field(..., description="文件路徑")
    row_range: Optional[tuple] = Field(default=None, description="行範圍")
    column: Optional[str] = Field(default=None, description="列名")
    new_values: Optional[List[Any]] = Field(default=None, description="新值列表")


@router.post("/analyze")
async def analyze_file(request: FileAnalysisRequest):
    """分析文件並生成摘要"""
    try:
        logger.info(f"開始分析文件: {request.file_path}")
        
        # 檢查文件是否存在
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")
        
        # 生成文件摘要
        summary = await summary_generator.generate_file_summary(
            request.file_path,
            min_lines=request.min_lines,
            min_chars=request.min_chars,
            overlap=request.overlap
        )
        
        logger.info(f"文件分析完成: {request.file_path}")
        
        return {
            "success": True,
            "summary": summary,
            "message": "文件分析完成"
        }
        
    except Exception as e:
        logger.error(f"文件分析失敗 {request.file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/read-parallel")
async def read_file_parallel(request: FileAnalysisRequest):
    """平行讀取文件"""
    try:
        logger.info(f"開始平行讀取文件: {request.file_path}")
        
        # 檢查文件是否存在
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")
        
        # 平行讀取文件
        file_data = await file_reader.read_file_parallel(request.file_path)
        
        logger.info(f"文件讀取完成: {request.file_path}")
        
        return {
            "success": True,
            "data": file_data,
            "message": "文件讀取完成"
        }
        
    except Exception as e:
        logger.error(f"文件讀取失敗 {request.file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit")
async def edit_file(request: FileEditRequest):
    """編輯文件指定行範圍"""
    try:
        logger.info(f"開始編輯文件: {request.file_path}, 行範圍: {request.start_line}-{request.end_line}")
        
        # 檢查文件是否存在
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")
        
        # 讀取原文件內容
        with open(request.file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # 驗證行號範圍
        if request.start_line < 1 or request.end_line < request.start_line or request.start_line > len(lines):
            raise HTTPException(status_code=400, detail="無效的行號範圍")
        
        # 替換指定行範圍的內容
        new_lines = request.new_content.split('\n')
        if not request.new_content.endswith('\n'):
            new_lines = [line + '\n' for line in new_lines[:-1]] + [new_lines[-1]]
        else:
            new_lines = [line + '\n' for line in new_lines]
        
        # 構建新的文件內容
        before_lines = lines[:request.start_line - 1]
        after_lines = lines[request.end_line:]
        updated_lines = before_lines + new_lines + after_lines
        
        # 寫回文件
        with open(request.file_path, 'w', encoding='utf-8') as f:
            f.writelines(updated_lines)
        
        logger.info(f"文件編輯完成: {request.file_path}")
        
        return {
            "success": True,
            "message": f"成功編輯第 {request.start_line}-{request.end_line} 行",
            "lines_changed": request.end_line - request.start_line + 1,
            "new_line_count": len(new_lines)
        }
        
    except Exception as e:
        logger.error(f"文件編輯失敗 {request.file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_file(request: FileCreateRequest):
    """創建新文件"""
    try:
        logger.info(f"開始創建文件: {request.file_path}")
        
        # 檢查文件是否已存在
        if os.path.exists(request.file_path):
            raise HTTPException(status_code=400, detail=f"文件已存在: {request.file_path}")
        
        # 確保目錄存在
        os.makedirs(os.path.dirname(request.file_path), exist_ok=True)
        
        # 創建文件
        with open(request.file_path, 'w', encoding=request.encoding) as f:
            f.write(request.content)
        
        logger.info(f"文件創建完成: {request.file_path}")
        
        return {
            "success": True,
            "message": "文件創建成功",
            "path": request.file_path,
            "size": len(request.content.encode(request.encoding))
        }
        
    except Exception as e:
        logger.error(f"文件創建失敗 {request.file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{file_path:path}")
async def delete_file(file_path: str):
    """刪除文件"""
    try:
        logger.info(f"開始刪除文件: {file_path}")
        
        # 檢查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {file_path}")
        
        # 檢查是否為目錄
        if os.path.isdir(file_path):
            raise HTTPException(status_code=400, detail="無法刪除目錄，請使用目錄刪除功能")
        
        # 刪除文件
        os.remove(file_path)
        
        logger.info(f"文件刪除完成: {file_path}")
        
        return {
            "success": True,
            "message": "文件刪除成功"
        }
        
    except Exception as e:
        logger.error(f"文件刪除失敗 {file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{file_path:path}")
async def get_file_info(file_path: str):
    """獲取文件信息"""
    try:
        logger.info(f"獲取文件信息: {file_path}")
        
        # 檢查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {file_path}")
        
        # 獲取文件統計信息
        stat = os.stat(file_path)
        
        # 計算行數（僅對文本文件）
        line_count = 0
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                line_count = sum(1 for _ in f)
        except:
            pass
        
        file_info = {
            "path": file_path,
            "name": os.path.basename(file_path),
            "size": stat.st_size,
            "lines": line_count,
            "modified": stat.st_mtime,
            "created": stat.st_ctime,
            "is_directory": os.path.isdir(file_path),
            "is_file": os.path.isfile(file_path),
            "extension": os.path.splitext(file_path)[1].lower()
        }
        
        return {
            "success": True,
            "file_info": file_info
        }
        
    except Exception as e:
        logger.error(f"獲取文件信息失敗 {file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/read-data")
async def read_data_file(request: DataFileReadRequest):
    """讀取數據文件"""
    try:
        logger.info(f"開始讀取數據文件: {request.file_path}")

        # 檢查文件是否存在
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")

        # 讀取數據文件
        result = await data_file_tools.read_data_file(
            request.file_path,
            filters=request.filters,
            limit=request.limit
        )

        if result["success"]:
            logger.info(f"數據文件讀取完成: {request.file_path}")
            return {
                "success": True,
                "data": result,
                "message": "數據文件讀取完成"
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])

    except Exception as e:
        logger.error(f"數據文件讀取失敗 {request.file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/edit-data")
async def edit_data_file(request: DataFileEditRequest):
    """編輯數據文件"""
    try:
        logger.info(f"開始編輯數據文件: {request.file_path}")

        # 檢查文件是否存在
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail=f"文件不存在: {request.file_path}")

        # 編輯數據文件
        result = await data_file_tools.edit_data_file(
            request.file_path,
            row_range=request.row_range,
            column=request.column,
            new_values=request.new_values
        )

        if result["success"]:
            logger.info(f"數據文件編輯完成: {request.file_path}")
            return {
                "success": True,
                "result": result,
                "message": "數據文件編輯完成"
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])

    except Exception as e:
        logger.error(f"數據文件編輯失敗 {request.file_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "healthy",
        "service": "file_processor",
        "version": "1.0.0"
    }
