"""
摘要生成器

生成文件的重點整理表，包括文本文件和數據文件的不同處理方式。
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from .parallel_reader import ParallelFileReader
from .content_analyzer import ContentAnalyzer

logger = logging.getLogger(__name__)


class SummaryGenerator:
    """摘要生成器"""
    
    def __init__(self):
        self.reader = ParallelFileReader()
        self.analyzer = ContentAnalyzer()
    
    async def generate_file_summary(self, file_path: str, min_lines: int = 5, min_chars: int = 100, overlap: int = 2) -> Dict[str, Any]:
        """
        生成文件的完整摘要
        
        Args:
            file_path: 文件路徑
            min_lines: 最少行數
            min_chars: 最少字符數
            overlap: 重疊行數
            
        Returns:
            完整的文件摘要
        """
        start_time = datetime.now()
        
        try:
            # 讀取文件並分段
            self.reader.min_lines = min_lines
            self.reader.min_chars = min_chars
            self.reader.overlap = overlap
            file_data = await self.reader.read_file_parallel(file_path)
            
            # 分析文件類型
            file_type = file_data['file_info']['type']
            
            if file_type in ['csv', 'json', 'excel']:
                # 數據文件處理
                summary = await self._generate_data_summary(file_path, file_data)
            else:
                # 文本文件處理
                summary = await self._generate_text_summary(file_data)
            
            # 添加處理時間
            end_time = datetime.now()
            summary['processing_time'] = (end_time - start_time).total_seconds()
            summary['generated_at'] = end_time.isoformat()
            
            return summary
            
        except Exception as e:
            logger.error(f"生成文件摘要失敗 {file_path}: {e}")
            raise
    
    async def _generate_text_summary(self, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成文本文件摘要"""
        file_info = file_data['file_info']
        segments = file_data['segments']
        file_path = file_info.get('path', 'unknown')  # 從 file_info 中獲取路徑

        # 並行分析所有段落
        analysis_tasks = []
        for segment in segments:
            task = asyncio.create_task(self._analyze_segment_async(segment, file_path))
            analysis_tasks.append(task)
        
        segment_analyses = await asyncio.gather(*analysis_tasks)
        
        # 生成整體統計
        total_keywords = set()
        content_types = {}
        total_complexity = 0
        
        for analysis in segment_analyses:
            total_keywords.update(analysis['keywords'])
            content_type = analysis['content_type']
            content_types[content_type] = content_types.get(content_type, 0) + 1
            total_complexity += analysis['complexity']['cyclomatic_complexity']
        
        # 構建摘要 - 展開子段落
        all_segments = []
        for analysis in segment_analyses:
            if 'sub_segments' in analysis and analysis['sub_segments']:
                # 使用子段落
                for sub_seg in analysis['sub_segments']:
                    all_segments.append({
                        'start_line': sub_seg['start_line'],
                        'end_line': sub_seg['end_line'],
                        'summary': sub_seg['summary'],
                        'topic': sub_seg['topic'],
                        'keywords': self.analyzer._extract_keywords(sub_seg['content']),
                        'content_type': self.analyzer._detect_content_type(sub_seg['content'], file_path),
                        'line_count': sub_seg['end_line'] - sub_seg['start_line'] + 1,
                        'char_count': len(sub_seg['content'])
                    })
            else:
                # 使用原始段落
                all_segments.append({
                    'start_line': analysis['start_line'],
                    'end_line': analysis['end_line'],
                    'summary': analysis['summary'],
                    'topic': '未分類',
                    'keywords': analysis['keywords'],
                    'content_type': analysis['content_type'],
                    'line_count': analysis['line_count'],
                    'char_count': analysis['char_count']
                })

        summary = {
            'file_info': {
                'path': file_info['path'],
                'type': 'text',
                'size': file_info['size'],
                'lines': file_info['lines'],
                'encoding': file_info['encoding']
            },
            'segments': all_segments,
            'overall_stats': {
                'total_segments': len(all_segments),
                'unique_keywords': list(total_keywords)[:20],  # 限制關鍵詞數量
                'content_type_distribution': content_types,
                'average_complexity': total_complexity / len(segments) if segments else 0,
                'estimated_reading_time': self._estimate_reading_time(file_info['lines'])
            }
        }
        
        return summary
    
    async def _generate_data_summary(self, file_path: str, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成數據文件摘要"""
        file_info = file_data['file_info']
        
        # 讀取文件內容進行數據分析
        content = ""
        for segment in file_data['segments']:
            content += segment['content']
        
        # 分析數據結構
        data_analysis = self.analyzer.analyze_data_file(file_path, content)
        
        # 構建數據文件摘要
        summary = {
            'file_info': {
                'path': file_info['path'],
                'type': 'data',
                'size': file_info['size'],
                'encoding': file_info['encoding'],
                'data_format': data_analysis.get('format', 'unknown')
            },
            'data_schema': self._extract_data_schema(data_analysis),
            'segments': [
                {
                    'start_line': segment['start_line'],
                    'end_line': segment['end_line'],
                    'summary': f"數據行 {segment['start_line']}-{segment['end_line']}",
                    'keywords': [],
                    'content_type': 'data',
                    'line_count': segment['line_count']
                }
                for segment in file_data['segments']
            ]
        }
        
        return summary
    
    def _extract_data_schema(self, data_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """提取數據結構信息"""
        data_format = data_analysis.get('format', 'unknown')
        
        if data_format == 'csv':
            return {
                'columns': data_analysis.get('columns', []),
                'types': data_analysis.get('column_types', {}),
                'sample_data': data_analysis.get('sample_data', {}),
                'row_count': data_analysis.get('row_count', 0),
                'delimiter': data_analysis.get('delimiter', ',')
            }
        elif data_format == 'json':
            structure = data_analysis.get('structure', {})
            return {
                'structure_type': structure.get('type', 'unknown'),
                'keys': structure.get('keys', []) if structure.get('type') == 'object' else [],
                'sample_data': self._extract_json_sample(structure),
                'size_bytes': data_analysis.get('size_bytes', 0)
            }
        elif data_format == 'jsonl':
            return {
                'total_lines': data_analysis.get('total_lines', 0),
                'valid_lines': data_analysis.get('valid_lines', 0),
                'common_keys': data_analysis.get('common_keys', []),
                'sample_data': data_analysis.get('sample_objects', []),
                'key_count': data_analysis.get('key_count', 0)
            }
        else:
            return {'error': f'不支持的數據格式: {data_format}'}
    
    def _extract_json_sample(self, structure: Dict[str, Any]) -> Any:
        """提取JSON樣本數據"""
        if structure.get('type') == 'object':
            nested = structure.get('nested', {})
            sample = {}
            for key, value_structure in list(nested.items())[:5]:  # 限制樣本大小
                if value_structure.get('type') in ['str', 'int', 'float', 'bool']:
                    sample[key] = value_structure.get('value')
                elif value_structure.get('type') == 'array':
                    sample[key] = value_structure.get('sample_items', [])
                else:
                    sample[key] = f"<{value_structure.get('type', 'unknown')}>"
            return sample
        elif structure.get('type') == 'array':
            return structure.get('sample_items', [])
        else:
            return structure.get('value')
    
    async def _analyze_segment_async(self, segment: Dict[str, Any], file_path: str = "") -> Dict[str, Any]:
        """異步分析段落"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.analyzer.analyze_segment, segment, file_path)
    
    def _estimate_reading_time(self, line_count: int) -> Dict[str, float]:
        """估算閱讀時間"""
        # 假設平均每行10個詞，每分鐘閱讀200詞
        words_per_line = 10
        words_per_minute = 200
        
        total_words = line_count * words_per_line
        reading_time_minutes = total_words / words_per_minute
        
        return {
            'estimated_words': total_words,
            'reading_time_minutes': round(reading_time_minutes, 1),
            'reading_time_hours': round(reading_time_minutes / 60, 2)
        }
    
    async def update_file_summary(self, existing_summary: Dict[str, Any], 
                                 start_line: int, end_line: int, 
                                 new_content: str) -> Dict[str, Any]:
        """
        更新文件摘要（當文件被編輯後）
        
        Args:
            existing_summary: 現有摘要
            start_line: 編輯開始行
            end_line: 編輯結束行
            new_content: 新內容
            
        Returns:
            更新後的摘要
        """
        # 找到受影響的段落
        affected_segments = []
        for i, segment in enumerate(existing_summary.get('segments', [])):
            if (segment['start_line'] <= end_line and segment['end_line'] >= start_line):
                affected_segments.append(i)
        
        # 重新分析受影響的段落
        # 這裡簡化處理，實際應該重新讀取文件並分析
        for segment_idx in affected_segments:
            segment = existing_summary['segments'][segment_idx]
            # 創建臨時段落進行分析
            temp_segment = {
                'segment_id': segment_idx + 1,
                'start_line': segment['start_line'],
                'end_line': segment['end_line'],
                'content': new_content,  # 簡化：使用新內容
                'line_count': len(new_content.split('\n'))
            }
            
            # 重新分析
            analysis = await self._analyze_segment_async(temp_segment, file_path)
            
            # 更新摘要
            existing_summary['segments'][segment_idx].update({
                'summary': analysis['summary'],
                'keywords': analysis['keywords'],
                'content_type': analysis['content_type'],
                'line_count': analysis['line_count']
            })
        
        # 更新時間戳
        existing_summary['updated_at'] = datetime.now().isoformat()
        
        return existing_summary


# 便利函數
async def generate_file_summary(file_path: str, chunk_size: int = 1000, overlap: int = 100) -> Dict[str, Any]:
    """便利函數：生成文件摘要"""
    generator = SummaryGenerator()
    return await generator.generate_file_summary(file_path, chunk_size, overlap)
