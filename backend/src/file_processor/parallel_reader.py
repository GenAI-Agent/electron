"""
平行文件分段讀取器

支持大文件的分段讀取，包含 overlap 機制避免內容斷裂。
"""

import asyncio
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import concurrent.futures
import logging

logger = logging.getLogger(__name__)


class FileSegment:
    """文件段落"""
    
    def __init__(self, start_line: int, end_line: int, content: str, overlap_start: int = 0, overlap_end: int = 0):
        self.start_line = start_line
        self.end_line = end_line
        self.content = content
        self.overlap_start = overlap_start  # 前重疊行數
        self.overlap_end = overlap_end      # 後重疊行數
        self.actual_start = start_line + overlap_start
        self.actual_end = end_line - overlap_end


class ParallelFileReader:
    """平行文件讀取器"""

    def __init__(self, min_lines: int = 30, min_chars: int = 200, overlap: int = 5, max_workers: int = 4):
        self.min_lines = min_lines  # 最少行數
        self.min_chars = min_chars  # 最少字符數
        self.overlap = overlap
        self.max_workers = max_workers

        # 向後兼容
        self.chunk_size = min_lines
    
    async def read_file_parallel(self, file_path: str) -> Dict[str, Any]:
        """
        平行讀取文件並分段處理

        Args:
            file_path: 文件路徑

        Returns:
            包含文件信息和分段內容的字典
        """
        original_path = file_path  # 保存原始路徑用於錯誤日誌
        try:
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                raise FileNotFoundError(f"文件不存在: {file_path}")

            # 獲取文件基本信息
            file_info = await self._get_file_info(file_path_obj)

            # 讀取並分段處理文件
            segments = await self._process_file_segments(file_path_obj)

            return {
                "file_info": file_info,
                "segments": segments,
                "total_segments": len(segments),
                "processing_time": 0  # 將在調用處計算
            }

        except Exception as e:
            logger.error(f"讀取文件失敗 {original_path}: {e}")
            raise
    
    async def _get_file_info(self, file_path: Path) -> Dict[str, Any]:
        """獲取文件基本信息"""
        stat = file_path.stat()
        
        # 計算總行數
        total_lines = await self._count_lines(file_path)
        
        # 檢測文件編碼
        encoding = await self._detect_encoding(file_path)
        
        return {
            "path": str(file_path),
            "name": file_path.name,
            "size": stat.st_size,
            "lines": total_lines,
            "encoding": encoding,
            "type": self._detect_file_type(file_path),
            "modified": stat.st_mtime
        }
    
    async def _count_lines(self, file_path: Path) -> int:
        """計算文件總行數"""
        def count_lines_sync():
            try:
                # 優先使用 UTF-8
                with open(file_path, 'r', encoding='utf-8') as f:
                    return sum(1 for _ in f)
            except UnicodeDecodeError:
                # 如果 UTF-8 失敗，嘗試其他編碼
                for encoding in ['gbk', 'big5', 'latin-1']:
                    try:
                        with open(file_path, 'r', encoding=encoding) as f:
                            return sum(1 for _ in f)
                    except UnicodeDecodeError:
                        continue

                # 最後使用 UTF-8 with replace
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    return sum(1 for _ in f)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, count_lines_sync)
    
    async def _detect_encoding(self, file_path: Path) -> str:
        """檢測文件編碼"""
        def detect_encoding_sync():
            # 優先返回 UTF-8，確保統一編碼
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    f.read(1000)
                return 'utf-8'
            except UnicodeDecodeError:
                # 如果不是 UTF-8，嘗試檢測實際編碼但仍返回 utf-8
                try:
                    import chardet
                    with open(file_path, 'rb') as f:
                        raw_data = f.read(10000)
                        result = chardet.detect(raw_data)
                        detected = result.get('encoding', 'utf-8')
                        # 記錄檢測到的編碼，但統一返回 utf-8
                        logger.debug(f"檢測到編碼 {detected}，統一使用 utf-8")
                        return 'utf-8'
                except ImportError:
                    return 'utf-8'

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, detect_encoding_sync)
    
    def _detect_file_type(self, file_path: Path) -> str:
        """檢測文件類型"""
        ext = file_path.suffix.lower()
        
        if ext in ['.txt', '.md', '.py', '.js', '.ts', '.html', '.css', '.json', '.xml', '.yaml', '.yml']:
            return 'text'
        elif ext in ['.csv', '.tsv']:
            return 'csv'
        elif ext in ['.json', '.jsonl']:
            return 'json'
        elif ext in ['.xlsx', '.xls']:
            return 'excel'
        else:
            return 'unknown'
    
    async def _process_file_segments(self, file_path: Path) -> List[Dict[str, Any]]:
        """處理文件分段"""
        # 讀取完整文件內容
        content = await self._read_file_content(file_path)
        lines = content.split('\n')
        total_lines = len(lines)
        
        # 總是進行分段處理，即使文件較小也要按邏輯分段
        # 這樣可以提供更詳細的分析結果
        
        # 計算分段
        segments_info = self._calculate_segments(total_lines, lines)
        
        # 並行處理各個分段
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            tasks = []
            for i, (start, end, overlap_start, overlap_end) in enumerate(segments_info):
                task = executor.submit(
                    self._process_segment,
                    i + 1,
                    lines,
                    start,
                    end,
                    overlap_start,
                    overlap_end
                )
                tasks.append(task)
            
            segments = []
            for future in concurrent.futures.as_completed(tasks):
                segment = future.result()
                segments.append(segment)
        
        # 按 segment_id 排序
        segments.sort(key=lambda x: x['segment_id'])
        
        return segments
    
    def _calculate_segments(self, total_lines: int, lines: List[str]) -> List[Tuple[int, int, int, int]]:
        """
        動態計算分段信息

        Args:
            total_lines: 總行數
            lines: 所有行的內容

        Returns:
            分段信息列表 (start, end, overlap_start, overlap_end)
        """
        segments = []
        current_start = 1

        while current_start <= total_lines:
            # 從最少行數開始
            current_end = min(current_start + self.min_lines - 1, total_lines)

            # 計算當前段落的字符數
            segment_lines = lines[current_start-1:current_end]
            char_count = sum(len(line) for line in segment_lines)

            # 如果字符數不足且還有更多行，繼續添加行
            while char_count < self.min_chars and current_end < total_lines:
                current_end += 1
                if current_end <= total_lines:
                    char_count += len(lines[current_end-1])

            # 計算重疊
            overlap_start = self.overlap if current_start > 1 else 0
            overlap_end = self.overlap if current_end < total_lines else 0

            # 調整實際讀取範圍
            read_start = max(1, current_start - overlap_start)
            read_end = min(total_lines, current_end + overlap_end)

            segments.append((read_start, read_end, overlap_start, overlap_end))

            # 下一段從當前段結束後開始（減去重疊）
            current_start = current_end + 1 - overlap_end

            # 防止無限循環
            if current_start <= current_end - overlap_end:
                current_start = current_end + 1

        return segments
    
    def _process_segment(self, segment_id: int, lines: List[str], start: int, end: int, 
                        overlap_start: int, overlap_end: int) -> Dict[str, Any]:
        """處理單個分段"""
        # 提取分段內容（注意行號是1-based，但list是0-based）
        segment_lines = lines[start-1:end]
        content = '\n'.join(segment_lines)
        
        return {
            "segment_id": segment_id,
            "start_line": start,
            "end_line": end,
            "actual_start": start + overlap_start,
            "actual_end": end - overlap_end,
            "content": content,
            "line_count": len(segment_lines),
            "has_overlap": overlap_start > 0 or overlap_end > 0,
            "overlap_info": {
                "start_overlap": overlap_start,
                "end_overlap": overlap_end
            }
        }
    
    async def _read_file_content(self, file_path: Path) -> str:
        """讀取文件內容"""
        def read_file_sync():
            # 優先使用 UTF-8 編碼
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except UnicodeDecodeError:
                # 嘗試其他編碼
                for enc in ['gbk', 'big5', 'latin-1']:
                    try:
                        with open(file_path, 'r', encoding=enc) as f:
                            content = f.read()
                            # 轉換為 UTF-8
                            return content
                    except UnicodeDecodeError:
                        continue

                # 如果都失敗，使用 errors='replace' 替換無法解碼的字符
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    return f.read()

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, read_file_sync)


# 便利函數
async def read_file_parallel(file_path: str, chunk_size: int = 1000, overlap: int = 100) -> Dict[str, Any]:
    """便利函數：平行讀取文件"""
    reader = ParallelFileReader(chunk_size=chunk_size, overlap=overlap)
    return await reader.read_file_parallel(file_path)
