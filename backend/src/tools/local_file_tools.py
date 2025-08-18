"""
Local File Use Tools

提供文件操作工具，供 Agent 使用。
"""

import os
import json
import asyncio
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import logging

from file_processor.summary_generator import SummaryGenerator
from file_processor.parallel_reader import ParallelFileReader
from file_processor.content_analyzer import ContentAnalyzer
from file_processor.smart_summary_generator import smart_summary_generator

logger = logging.getLogger(__name__)


class LocalFileTools:
    """本地文件操作工具集"""
    
    def __init__(self):
        self.summary_generator = SummaryGenerator()
        self.file_reader = ParallelFileReader()
        self.content_analyzer = ContentAnalyzer()
    
    async def read_file_with_summary(self, file_path: str, session_id: str = "default") -> Dict[str, Any]:
        """
        讀取文件並生成摘要
        
        Args:
            file_path: 文件路徑
            session_id: 會話ID
            
        Returns:
            包含文件內容和摘要的字典
        """
        try:
            logger.info(f"讀取文件並生成摘要: {file_path}")
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"文件不存在: {file_path}"
                }
            
            # 生成簡潔的文件摘要
            summary = await self._generate_simple_summary(file_path)
            
            return {
                "success": True,
                "file_path": file_path,
                "summary": summary,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"讀取文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _generate_simple_summary(self, file_path: str) -> Dict[str, Any]:
        """生成簡潔的文件摘要"""
        try:
            # 讀取文件內容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')

            # 智能分段
            sections = self._smart_segmentation(lines)

            # 生成簡潔摘要
            return {
                'file_path': file_path,
                'content_sections': sections
            }

        except Exception as e:
            logger.error(f"生成簡潔摘要失敗 {file_path}: {e}")
            raise

    def _smart_segmentation(self, lines: List[str]) -> List[Dict[str, Any]]:
        """智能分段邏輯"""
        sections = []
        current_section = {
            'start_line': 1,
            'end_line': 1,
            'content_lines': []
        }

        section_patterns = [
            r'^#\s+(.+)',           # Markdown 標題
            r'^##\s+(.+)',          # Markdown 二級標題
            r'^###\s+(.+)',         # Markdown 三級標題
            r'^\d+\.\s+(.+)',       # 數字列表
            r'^[A-Z]\.\s+(.+)',     # 字母列表
            r'^第\d+[項條章節]\s*[:：]?\s*(.+)',  # 中文編號
        ]

        for i, line in enumerate(lines, 1):
            line_stripped = line.strip()

            # 檢查是否是新的段落標題
            is_new_section = False
            for pattern in section_patterns:
                if re.match(pattern, line_stripped):
                    is_new_section = True
                    break

            if is_new_section and len(current_section['content_lines']) > 0:
                # 結束當前段落
                current_section['end_line'] = i - 1
                current_section['summary'] = self._generate_section_summary(current_section['content_lines'])
                sections.append(current_section.copy())

                # 開始新段落
                current_section = {
                    'start_line': i,
                    'end_line': i,
                    'content_lines': [line]
                }
            else:
                # 繼續當前段落
                current_section['content_lines'].append(line)
                current_section['end_line'] = i

        # 添加最後一個段落
        if current_section['content_lines']:
            current_section['summary'] = self._generate_section_summary(current_section['content_lines'])
            sections.append(current_section)

        # 合併過短的段落
        return self._merge_short_sections(sections)

    def _generate_section_summary(self, content_lines: List[str]) -> str:
        """生成段落摘要"""
        content = '\n'.join(content_lines).strip()

        # 如果內容很短，直接返回
        if len(content) < 50:
            return content

        # 提取第一句話作為摘要
        first_line = content_lines[0].strip() if content_lines else ""
        if first_line:
            # 截取前100個字符
            summary = first_line[:100]
            if len(first_line) > 100:
                summary += "..."
            return summary

        return "包含內容但無法生成摘要"

    def _merge_short_sections(self, sections: List[Dict[str, Any]], min_lines: int = 3) -> List[Dict[str, Any]]:
        """合併過短的段落"""
        if not sections:
            return sections

        merged_sections = []
        current_merged = sections[0].copy()

        for i in range(1, len(sections)):
            section = sections[i]
            current_lines = current_merged['end_line'] - current_merged['start_line'] + 1

            if current_lines < min_lines:
                # 合併到當前段落
                current_merged['end_line'] = section['end_line']
                current_merged['content_lines'].extend(section['content_lines'])
                current_merged['summary'] = self._generate_section_summary(current_merged['content_lines'])
            else:
                # 保存當前段落，開始新段落
                merged_sections.append(current_merged)
                current_merged = section.copy()

        # 添加最後一個段落
        merged_sections.append(current_merged)

        return merged_sections
    
    async def edit_file_by_lines(self, file_path: str, start_line: int, end_line: int, 
                                new_content: str, session_id: str = "default") -> Dict[str, Any]:
        """
        按行編輯文件
        
        Args:
            file_path: 文件路徑
            start_line: 開始行號（1-based）
            end_line: 結束行號（1-based）
            new_content: 新內容
            session_id: 會話ID
            
        Returns:
            編輯結果
        """
        try:
            logger.info(f"編輯文件 {file_path}, 行範圍: {start_line}-{end_line}")
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"文件不存在: {file_path}"
                }
            
            # 讀取原文件內容
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # 驗證行號範圍
            if start_line < 1 or end_line < start_line or start_line > len(lines):
                return {
                    "success": False,
                    "error": "無效的行號範圍"
                }
            
            # 替換指定行範圍的內容
            new_lines = new_content.split('\n')
            if not new_content.endswith('\n'):
                new_lines = [line + '\n' for line in new_lines[:-1]] + [new_lines[-1]]
            else:
                new_lines = [line + '\n' for line in new_lines]
            
            # 構建新的文件內容
            before_lines = lines[:start_line - 1]
            after_lines = lines[end_line:]
            updated_lines = before_lines + new_lines + after_lines
            
            # 寫回文件
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(updated_lines)
            
            # 重新生成摘要
            try:
                updated_summary = await self.summary_generator.generate_file_summary(file_path)
            except Exception as e:
                logger.warning(f"重新生成摘要失敗: {e}")
                updated_summary = None
            
            return {
                "success": True,
                "message": f"成功編輯第 {start_line}-{end_line} 行",
                "lines_changed": end_line - start_line + 1,
                "new_line_count": len(new_lines),
                "updated_summary": updated_summary,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"編輯文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def highlight_file_sections(self, file_path: str, ranges: List[Dict[str, int]], 
                                    session_id: str = "default") -> Dict[str, Any]:
        """
        高亮文件指定區域
        
        Args:
            file_path: 文件路徑
            ranges: 高亮範圍列表，每個範圍包含 start_line 和 end_line
            session_id: 會話ID
            
        Returns:
            高亮結果
        """
        try:
            logger.info(f"高亮文件區域 {file_path}: {ranges}")
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"文件不存在: {file_path}"
                }
            
            # 讀取文件內容
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # 驗證所有範圍
            for range_info in ranges:
                start = range_info.get('start_line', 1)
                end = range_info.get('end_line', 1)
                if start < 1 or end < start or start > len(lines):
                    return {
                        "success": False,
                        "error": f"無效的行號範圍: {start}-{end}"
                    }
            
            # 提取高亮內容
            highlighted_content = []
            for range_info in ranges:
                start = range_info['start_line']
                end = range_info['end_line']
                content = ''.join(lines[start-1:end])
                highlighted_content.append({
                    "start_line": start,
                    "end_line": end,
                    "content": content.rstrip('\n'),
                    "line_count": end - start + 1
                })
            
            return {
                "success": True,
                "file_path": file_path,
                "highlighted_sections": highlighted_content,
                "total_sections": len(highlighted_content),
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"高亮文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def delete_file(self, file_path: str, session_id: str = "default") -> Dict[str, Any]:
        """
        刪除文件
        
        Args:
            file_path: 文件路徑
            session_id: 會話ID
            
        Returns:
            刪除結果
        """
        try:
            logger.info(f"刪除文件: {file_path}")
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"文件不存在: {file_path}"
                }
            
            if os.path.isdir(file_path):
                return {
                    "success": False,
                    "error": "無法刪除目錄，請使用目錄刪除功能"
                }
            
            # 刪除文件
            os.remove(file_path)
            
            return {
                "success": True,
                "message": "文件刪除成功",
                "file_path": file_path,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"刪除文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def save_file(self, file_path: str, content: str, encoding: str = "utf-8", 
                       session_id: str = "default") -> Dict[str, Any]:
        """
        保存文件
        
        Args:
            file_path: 文件路徑
            content: 文件內容
            encoding: 文件編碼
            session_id: 會話ID
            
        Returns:
            保存結果
        """
        try:
            logger.info(f"保存文件: {file_path}")
            
            # 確保目錄存在
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # 保存文件
            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)
            
            # 生成摘要
            try:
                summary = await self.summary_generator.generate_file_summary(file_path)
            except Exception as e:
                logger.warning(f"生成摘要失敗: {e}")
                summary = None
            
            return {
                "success": True,
                "message": "文件保存成功",
                "file_path": file_path,
                "size": len(content.encode(encoding)),
                "summary": summary,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"保存文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_file(self, file_path: str, content: str = "", encoding: str = "utf-8", 
                         session_id: str = "default") -> Dict[str, Any]:
        """
        創建新文件
        
        Args:
            file_path: 文件路徑
            content: 文件內容
            encoding: 文件編碼
            session_id: 會話ID
            
        Returns:
            創建結果
        """
        try:
            logger.info(f"創建文件: {file_path}")
            
            # 檢查文件是否已存在
            if os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"文件已存在: {file_path}"
                }
            
            # 確保目錄存在
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # 創建文件
            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)
            
            # 生成摘要
            try:
                summary = await self.summary_generator.generate_file_summary(file_path)
            except Exception as e:
                logger.warning(f"生成摘要失敗: {e}")
                summary = None
            
            return {
                "success": True,
                "message": "文件創建成功",
                "file_path": file_path,
                "size": len(content.encode(encoding)),
                "summary": summary,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"創建文件失敗 {file_path}: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# 全局工具實例
local_file_tools = LocalFileTools()


# 便利函數，供 Agent 調用
async def read_file_with_summary_tool(file_path: str, session_id: str = "default") -> Dict[str, Any]:
    """讀取文件並生成摘要的工具函數"""
    return await local_file_tools.read_file_with_summary(file_path, session_id)


async def edit_file_by_lines_tool(file_path: str, start_line: int, end_line: int, 
                                 new_content: str, session_id: str = "default") -> Dict[str, Any]:
    """按行編輯文件的工具函數"""
    return await local_file_tools.edit_file_by_lines(file_path, start_line, end_line, new_content, session_id)


async def highlight_file_sections_tool(file_path: str, ranges: List[Dict[str, int]], 
                                      session_id: str = "default") -> Dict[str, Any]:
    """高亮文件區域的工具函數"""
    return await local_file_tools.highlight_file_sections(file_path, ranges, session_id)


async def delete_file_tool(file_path: str, session_id: str = "default") -> Dict[str, Any]:
    """刪除文件的工具函數"""
    return await local_file_tools.delete_file(file_path, session_id)


async def save_file_tool(file_path: str, content: str, encoding: str = "utf-8", 
                        session_id: str = "default") -> Dict[str, Any]:
    """保存文件的工具函數"""
    return await local_file_tools.save_file(file_path, content, encoding, session_id)


async def create_file_tool(file_path: str, content: str = "", encoding: str = "utf-8", 
                          session_id: str = "default") -> Dict[str, Any]:
    """創建文件的工具函數"""
    return await local_file_tools.create_file(file_path, content, encoding, session_id)
