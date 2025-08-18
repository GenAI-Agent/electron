"""
智能摘要生成器

生成更合理的文件分段和 YAML 格式摘要。
"""

import re
import yaml
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SmartSummaryGenerator:
    """智能摘要生成器"""
    
    def __init__(self):
        self.section_patterns = [
            r'^#\s+(.+)',           # Markdown 標題
            r'^##\s+(.+)',          # Markdown 二級標題
            r'^###\s+(.+)',         # Markdown 三級標題
            r'^\d+\.\s+(.+)',       # 數字列表
            r'^[A-Z]\.\s+(.+)',     # 字母列表
            r'^-\s+(.+)',           # 破折號列表
            r'^\*\s+(.+)',          # 星號列表
            r'^第\d+[項條章節]\s*[:：]?\s*(.+)',  # 中文編號
            r'^[一二三四五六七八九十]+[、．]\s*(.+)',  # 中文數字編號
        ]
    
    async def generate_smart_summary(self, file_path: str) -> Dict[str, Any]:
        """
        生成智能文件摘要
        
        Args:
            file_path: 文件路徑
            
        Returns:
            YAML 格式的智能摘要
        """
        start_time = datetime.now()
        
        try:
            # 讀取文件內容
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            # 智能分段
            sections = self._smart_segmentation(lines)
            
            # 生成 YAML 格式摘要
            summary = self._generate_yaml_summary(file_path, lines, sections)
            
            # 添加處理時間
            end_time = datetime.now()
            summary['processing_info'] = {
                'processing_time_seconds': (end_time - start_time).total_seconds(),
                'generated_at': end_time.isoformat(),
                'generator_version': 'smart_v1.0'
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"生成智能摘要失敗 {file_path}: {e}")
            raise
    
    def _smart_segmentation(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        智能分段邏輯
        
        Args:
            lines: 文件行列表
            
        Returns:
            分段結果列表
        """
        sections = []
        current_section = {
            'start_line': 1,
            'end_line': 1,
            'title': '',
            'content_lines': [],
            'section_type': 'content'
        }
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # 檢查是否是新的段落標題
            section_match = self._match_section_pattern(line)
            
            if section_match and len(current_section['content_lines']) > 0:
                # 結束當前段落
                current_section['end_line'] = i - 1
                current_section['content'] = '\n'.join(current_section['content_lines'])
                sections.append(current_section.copy())
                
                # 開始新段落
                current_section = {
                    'start_line': i,
                    'end_line': i,
                    'title': section_match['title'],
                    'content_lines': [line],
                    'section_type': section_match['type']
                }
            else:
                # 繼續當前段落
                if not current_section['title'] and line:
                    # 如果還沒有標題，用第一行非空內容作為標題
                    current_section['title'] = line[:50] + ('...' if len(line) > 50 else '')
                
                current_section['content_lines'].append(line)
                current_section['end_line'] = i
        
        # 添加最後一個段落
        if current_section['content_lines']:
            current_section['content'] = '\n'.join(current_section['content_lines'])
            sections.append(current_section)
        
        # 合併過短的段落
        return self._merge_short_sections(sections)
    
    def _match_section_pattern(self, line: str) -> Optional[Dict[str, str]]:
        """匹配段落模式"""
        for pattern in self.section_patterns:
            match = re.match(pattern, line)
            if match:
                return {
                    'title': match.group(1).strip(),
                    'type': 'header'
                }
        
        # 檢查空行（可能是段落分隔）
        if not line.strip():
            return None
        
        return None
    
    def _merge_short_sections(self, sections: List[Dict[str, Any]], min_lines: int = 3) -> List[Dict[str, Any]]:
        """合併過短的段落"""
        if not sections:
            return sections
        
        merged_sections = []
        current_merged = sections[0].copy()
        
        for i in range(1, len(sections)):
            section = sections[i]
            current_lines = current_merged['end_line'] - current_merged['start_line'] + 1
            
            if current_lines < min_lines and section['section_type'] == 'content':
                # 合併到當前段落
                current_merged['end_line'] = section['end_line']
                current_merged['content_lines'].extend(section['content_lines'])
                current_merged['content'] = '\n'.join(current_merged['content_lines'])
                
                # 更新標題（如果當前沒有好的標題）
                if len(current_merged['title']) < 20 and len(section['title']) > len(current_merged['title']):
                    current_merged['title'] = section['title']
            else:
                # 保存當前段落，開始新段落
                merged_sections.append(current_merged)
                current_merged = section.copy()
        
        # 添加最後一個段落
        merged_sections.append(current_merged)
        
        return merged_sections
    
    def _generate_yaml_summary(self, file_path: str, lines: List[str], sections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成 YAML 格式摘要"""
        
        # 提取關鍵詞
        all_keywords = set()
        for section in sections:
            keywords = self._extract_keywords(section['content'])
            all_keywords.update(keywords)
        
        # 構建摘要結構
        summary = {
            'file_info': {
                'path': file_path,
                'type': 'text',
                'size': sum(len(line.encode('utf-8')) for line in lines),
                'total_lines': len(lines),
                'encoding': 'utf-8'
            },
            'document_structure': {
                'total_sections': len(sections),
                'section_types': self._count_section_types(sections),
                'average_section_length': sum(s['end_line'] - s['start_line'] + 1 for s in sections) / len(sections) if sections else 0
            },
            'content_sections': [],
            'keywords_summary': {
                'unique_keywords': sorted(list(all_keywords))[:20],  # 只保留前20個關鍵詞
                'total_unique_keywords': len(all_keywords)
            },
            'reading_estimate': {
                'total_words': self._count_words(lines),
                'estimated_reading_time_minutes': self._estimate_reading_time(lines),
                'complexity_level': self._assess_complexity(sections)
            }
        }
        
        # 添加段落詳情
        for i, section in enumerate(sections, 1):
            section_summary = {
                'section_number': i,
                'line_range': f"{section['start_line']}-{section['end_line']}",
                'title': section['title'],
                'section_type': section['section_type'],
                'line_count': section['end_line'] - section['start_line'] + 1,
                'summary': self._generate_section_summary(section),
                'key_points': self._extract_key_points(section)
            }
            summary['content_sections'].append(section_summary)
        
        return summary
    
    def _extract_keywords(self, content: str) -> List[str]:
        """提取關鍵詞"""
        # 簡單的關鍵詞提取邏輯
        import re
        
        # 移除標點符號，分割單詞
        words = re.findall(r'\b\w+\b', content.lower())
        
        # 過濾停用詞和短詞
        stop_words = {'的', '是', '在', '有', '和', '與', '或', '但', '如果', '因為', '所以', '這', '那', '我', '你', '他', '她', '它'}
        keywords = [word for word in words if len(word) > 1 and word not in stop_words]
        
        # 統計詞頻，返回最常見的詞
        from collections import Counter
        word_counts = Counter(keywords)
        return [word for word, count in word_counts.most_common(10)]
    
    def _count_section_types(self, sections: List[Dict[str, Any]]) -> Dict[str, int]:
        """統計段落類型"""
        type_counts = {}
        for section in sections:
            section_type = section['section_type']
            type_counts[section_type] = type_counts.get(section_type, 0) + 1
        return type_counts
    
    def _count_words(self, lines: List[str]) -> int:
        """統計單詞數"""
        total_chars = sum(len(line) for line in lines)
        # 中文按字符計算，英文按單詞計算
        return total_chars  # 簡化處理
    
    def _estimate_reading_time(self, lines: List[str]) -> float:
        """估算閱讀時間（分鐘）"""
        total_chars = sum(len(line) for line in lines)
        # 假設每分鐘閱讀 300 個中文字符
        return total_chars / 300
    
    def _assess_complexity(self, sections: List[Dict[str, Any]]) -> str:
        """評估複雜度"""
        avg_section_length = sum(s['end_line'] - s['start_line'] + 1 for s in sections) / len(sections) if sections else 0
        
        if avg_section_length > 10:
            return 'high'
        elif avg_section_length > 5:
            return 'medium'
        else:
            return 'low'
    
    def _generate_section_summary(self, section: Dict[str, Any]) -> str:
        """生成段落摘要"""
        content = section['content']
        title = section['title']
        
        # 如果內容很短，直接返回
        if len(content) < 50:
            return content.strip()
        
        # 提取前幾句話作為摘要
        sentences = re.split(r'[。！？\n]', content)
        summary_sentences = []
        total_length = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and total_length + len(sentence) < 100:
                summary_sentences.append(sentence)
                total_length += len(sentence)
            elif summary_sentences:
                break
        
        summary = '。'.join(summary_sentences)
        if summary and not summary.endswith('。'):
            summary += '。'
        
        return summary or title
    
    def _extract_key_points(self, section: Dict[str, Any]) -> List[str]:
        """提取關鍵點"""
        content = section['content']
        
        # 查找列表項目
        key_points = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            # 匹配各種列表格式
            if re.match(r'^[\d\w]+[\.、：]\s*(.+)', line):
                match = re.match(r'^[\d\w]+[\.、：]\s*(.+)', line)
                if match:
                    key_points.append(match.group(1).strip())
            elif re.match(r'^[-*]\s*(.+)', line):
                match = re.match(r'^[-*]\s*(.+)', line)
                if match:
                    key_points.append(match.group(1).strip())
        
        return key_points[:5]  # 最多返回5個關鍵點


# 全局實例
smart_summary_generator = SmartSummaryGenerator()
