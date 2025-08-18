"""
Data File Tools

提供數據文件（CSV、JSON、Excel等）的專門操作工具。
"""

import os
import json
import csv
import io
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import logging

logger = logging.getLogger(__name__)


class DataFileTools:
    """數據文件操作工具集"""
    
    def __init__(self):
        pass
    
    async def read_data_file(self, file_path: str, filters: Optional[Dict[str, Any]] = None, 
                           limit: Optional[int] = None, session_id: str = "default") -> Dict[str, Any]:
        """
        讀取數據文件
        
        Args:
            file_path: 文件路徑
            filters: 過濾條件
            limit: 限制返回行數
            session_id: 會話ID
            
        Returns:
            數據內容和結構信息
        """
        try:
            logger.info(f"讀取數據文件: {file_path}")
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"文件不存在: {file_path}"
                }
            
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext == '.csv':
                return await self._read_csv_file(file_path, filters, limit, session_id)
            elif file_ext == '.json':
                return await self._read_json_file(file_path, filters, limit, session_id)
            elif file_ext == '.jsonl':
                return await self._read_jsonl_file(file_path, filters, limit, session_id)
            elif file_ext in ['.xlsx', '.xls']:
                return await self._read_excel_file(file_path, filters, limit, session_id)
            else:
                return {
                    "success": False,
                    "error": f"不支持的數據文件格式: {file_ext}"
                }
                
        except Exception as e:
            logger.error(f"讀取數據文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _read_csv_file(self, file_path: str, filters: Optional[Dict[str, Any]], 
                           limit: Optional[int], session_id: str) -> Dict[str, Any]:
        """讀取CSV文件"""
        try:
            df = pd.read_csv(file_path)
            
            # 應用過濾器
            if filters:
                for column, condition in filters.items():
                    if column in df.columns:
                        if isinstance(condition, dict):
                            if 'equals' in condition:
                                df = df[df[column] == condition['equals']]
                            elif 'contains' in condition:
                                df = df[df[column].astype(str).str.contains(condition['contains'], na=False)]
                            elif 'greater_than' in condition:
                                df = df[df[column] > condition['greater_than']]
                            elif 'less_than' in condition:
                                df = df[df[column] < condition['less_than']]
            
            # 限制行數
            if limit:
                df = df.head(limit)
            
            # 分析數據結構
            schema = {
                'columns': df.columns.tolist(),
                'types': {col: str(df[col].dtype) for col in df.columns},
                'row_count': len(df),
                'sample_data': df.head(3).to_dict('records') if len(df) > 0 else []
            }
            
            return {
                "success": True,
                "format": "csv",
                "schema": schema,
                "data": df.to_dict('records'),
                "total_rows": len(df),
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"讀取CSV文件失敗: {str(e)}"
            }
    
    async def _read_json_file(self, file_path: str, filters: Optional[Dict[str, Any]], 
                            limit: Optional[int], session_id: str) -> Dict[str, Any]:
        """讀取JSON文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 如果是數組，可以應用過濾和限制
            if isinstance(data, list):
                filtered_data = data
                
                # 應用過濾器
                if filters and len(data) > 0 and isinstance(data[0], dict):
                    for key, condition in filters.items():
                        if isinstance(condition, dict):
                            if 'equals' in condition:
                                filtered_data = [item for item in filtered_data 
                                               if item.get(key) == condition['equals']]
                            elif 'contains' in condition:
                                filtered_data = [item for item in filtered_data 
                                               if condition['contains'] in str(item.get(key, ''))]
                
                # 限制行數
                if limit:
                    filtered_data = filtered_data[:limit]
                
                # 分析結構
                if filtered_data:
                    sample_item = filtered_data[0]
                    if isinstance(sample_item, dict):
                        schema = {
                            'type': 'array_of_objects',
                            'keys': list(sample_item.keys()),
                            'sample_data': filtered_data[:3],
                            'total_items': len(filtered_data)
                        }
                    else:
                        schema = {
                            'type': 'array_of_primitives',
                            'sample_data': filtered_data[:3],
                            'total_items': len(filtered_data)
                        }
                else:
                    schema = {'type': 'empty_array', 'total_items': 0}
                
                return {
                    "success": True,
                    "format": "json",
                    "schema": schema,
                    "data": filtered_data,
                    "session_id": session_id
                }
            else:
                # 單個對象
                return {
                    "success": True,
                    "format": "json",
                    "schema": {
                        'type': 'object',
                        'keys': list(data.keys()) if isinstance(data, dict) else [],
                        'sample_data': data
                    },
                    "data": data,
                    "session_id": session_id
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"讀取JSON文件失敗: {str(e)}"
            }
    
    async def _read_jsonl_file(self, file_path: str, filters: Optional[Dict[str, Any]], 
                             limit: Optional[int], session_id: str) -> Dict[str, Any]:
        """讀取JSONL文件"""
        try:
            data = []
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f):
                    if limit and len(data) >= limit:
                        break
                    
                    try:
                        item = json.loads(line.strip())
                        
                        # 應用過濾器
                        if filters and isinstance(item, dict):
                            match = True
                            for key, condition in filters.items():
                                if isinstance(condition, dict):
                                    if 'equals' in condition and item.get(key) != condition['equals']:
                                        match = False
                                        break
                                    elif 'contains' in condition and condition['contains'] not in str(item.get(key, '')):
                                        match = False
                                        break
                            if not match:
                                continue
                        
                        data.append(item)
                        
                    except json.JSONDecodeError:
                        logger.warning(f"跳過無效JSON行 {line_num + 1}: {line[:50]}...")
                        continue
            
            # 分析結構
            if data:
                all_keys = set()
                for item in data[:10]:  # 分析前10個項目
                    if isinstance(item, dict):
                        all_keys.update(item.keys())
                
                schema = {
                    'type': 'jsonl',
                    'common_keys': list(all_keys),
                    'sample_data': data[:3],
                    'total_lines': len(data)
                }
            else:
                schema = {'type': 'empty_jsonl', 'total_lines': 0}
            
            return {
                "success": True,
                "format": "jsonl",
                "schema": schema,
                "data": data,
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"讀取JSONL文件失敗: {str(e)}"
            }
    
    async def _read_excel_file(self, file_path: str, filters: Optional[Dict[str, Any]], 
                             limit: Optional[int], session_id: str) -> Dict[str, Any]:
        """讀取Excel文件"""
        try:
            # 讀取所有工作表
            excel_file = pd.ExcelFile(file_path)
            sheets_data = {}
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                
                # 應用過濾器
                if filters:
                    for column, condition in filters.items():
                        if column in df.columns:
                            if isinstance(condition, dict):
                                if 'equals' in condition:
                                    df = df[df[column] == condition['equals']]
                                elif 'contains' in condition:
                                    df = df[df[column].astype(str).str.contains(condition['contains'], na=False)]
                
                # 限制行數
                if limit:
                    df = df.head(limit)
                
                sheets_data[sheet_name] = {
                    'columns': df.columns.tolist(),
                    'types': {col: str(df[col].dtype) for col in df.columns},
                    'row_count': len(df),
                    'data': df.to_dict('records'),
                    'sample_data': df.head(3).to_dict('records') if len(df) > 0 else []
                }
            
            return {
                "success": True,
                "format": "excel",
                "sheets": list(excel_file.sheet_names),
                "data": sheets_data,
                "session_id": session_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"讀取Excel文件失敗: {str(e)}"
            }
    
    async def edit_data_file(self, file_path: str, row_range: Optional[tuple] = None, 
                           column: Optional[str] = None, new_values: Optional[List[Any]] = None,
                           session_id: str = "default") -> Dict[str, Any]:
        """
        編輯數據文件
        
        Args:
            file_path: 文件路徑
            row_range: 行範圍 (start, end)
            column: 要編輯的列名
            new_values: 新值列表
            session_id: 會話ID
            
        Returns:
            編輯結果
        """
        try:
            logger.info(f"編輯數據文件: {file_path}")
            
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext == '.csv':
                return await self._edit_csv_file(file_path, row_range, column, new_values, session_id)
            else:
                return {
                    "success": False,
                    "error": f"暫不支持編輯 {file_ext} 格式的文件"
                }
                
        except Exception as e:
            logger.error(f"編輯數據文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _edit_csv_file(self, file_path: str, row_range: Optional[tuple], 
                           column: Optional[str], new_values: Optional[List[Any]], 
                           session_id: str) -> Dict[str, Any]:
        """編輯CSV文件"""
        try:
            df = pd.read_csv(file_path)
            
            if column and column in df.columns and new_values:
                if row_range:
                    start, end = row_range
                    start = max(0, start)
                    end = min(len(df), end)
                    
                    # 確保新值數量匹配行數
                    rows_to_update = end - start
                    if len(new_values) != rows_to_update:
                        return {
                            "success": False,
                            "error": f"新值數量 ({len(new_values)}) 與行數 ({rows_to_update}) 不匹配"
                        }
                    
                    df.loc[start:end-1, column] = new_values
                else:
                    # 更新整列
                    if len(new_values) != len(df):
                        return {
                            "success": False,
                            "error": f"新值數量 ({len(new_values)}) 與總行數 ({len(df)}) 不匹配"
                        }
                    df[column] = new_values
                
                # 保存文件
                df.to_csv(file_path, index=False)
                
                return {
                    "success": True,
                    "message": f"成功更新列 '{column}'",
                    "rows_affected": len(new_values),
                    "session_id": session_id
                }
            else:
                return {
                    "success": False,
                    "error": "缺少必要參數或列不存在"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"編輯CSV文件失敗: {str(e)}"
            }


# 全局工具實例
data_file_tools = DataFileTools()


# 便利函數，供 Agent 調用
async def read_data_file_tool(file_path: str, filters: Optional[Dict[str, Any]] = None, 
                            limit: Optional[int] = None, session_id: str = "default") -> Dict[str, Any]:
    """讀取數據文件的工具函數"""
    return await data_file_tools.read_data_file(file_path, filters, limit, session_id)


async def edit_data_file_tool(file_path: str, row_range: Optional[tuple] = None, 
                            column: Optional[str] = None, new_values: Optional[List[Any]] = None,
                            session_id: str = "default") -> Dict[str, Any]:
    """編輯數據文件的工具函數"""
    return await data_file_tools.edit_data_file(file_path, row_range, column, new_values, session_id)
