"""
內容分析器

分析文件內容，識別內容類型、提取關鍵詞和生成摘要。
"""

import re
import json
import csv
import io
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ContentAnalyzer:
    """內容分析器"""
    def analyze_segment(self, segment: Dict[str, Any], file_path: str = "") -> Dict[str, Any]:
        """
        分析文件段落

        Args:
            segment: 文件段落信息
            file_path: 文件路徑（用於類型檢測）

        Returns:
            分析結果
        """
        content = segment.get('content', '')

        # 智能內容分段 - 在 chunk 內部進一步分析
        sub_segments = self._analyze_content_structure(content, segment.get('start_line', 1))

        # 如果沒有找到子段落，使用整個內容作為一個段落
        if not sub_segments:
            sub_segments = [{
                'start_line': segment.get('start_line', 1),
                'end_line': segment.get('end_line', 1),
                'content': content,
                'topic': '未分類內容',
                'summary': self._generate_summary(content)
            }]

        # 基本分析
        analysis = {
            'segment_id': segment.get('segment_id'),
            'start_line': segment.get('start_line'),
            'end_line': segment.get('end_line'),
            'line_count': segment.get('line_count', 0),
            'char_count': len(content),
            'content_type': self._detect_content_type(content, file_path),
            'keywords': self._extract_keywords(content),
            'summary': self._generate_summary(content),
            'structure': self._analyze_structure(content),
            'complexity': self._calculate_complexity(content),
            'sub_segments': sub_segments  # 新增：子段落分析
        }

        return analysis

    def _analyze_content_structure(self, content: str, start_line: int) -> List[Dict[str, Any]]:
        """
        分析內容結構，識別段落和主題

        Args:
            content: 文件內容
            start_line: 起始行號

        Returns:
            子段落列表
        """
        if isinstance(content, bytes):
            content = content.decode('utf-8', errors='replace')

        lines = content.split('\n')
        sub_segments = []
        current_segment = {
            'start_line': start_line,
            'end_line': start_line,
            'lines': [],
            'topic': '',
            'content': ''
        }

        for i, line in enumerate(lines):
            current_line_num = start_line + i
            line = line.strip()

            # 檢查是否為新段落的開始
            is_new_paragraph = self._is_paragraph_start(line, i, lines)

            if is_new_paragraph and current_segment['lines']:
                # 完成當前段落
                current_segment['end_line'] = current_line_num - 1
                current_segment['content'] = '\n'.join(current_segment['lines'])
                current_segment['topic'] = self._extract_topic(current_segment['content'])
                current_segment['summary'] = self._generate_summary(current_segment['content'])

                sub_segments.append(current_segment.copy())

                # 開始新段落
                current_segment = {
                    'start_line': current_line_num,
                    'end_line': current_line_num,
                    'lines': [line] if line else [],
                    'topic': '',
                    'content': ''
                }
            else:
                # 繼續當前段落
                if line:  # 只添加非空行
                    current_segment['lines'].append(line)
                current_segment['end_line'] = current_line_num

        # 處理最後一個段落
        if current_segment['lines']:
            current_segment['content'] = '\n'.join(current_segment['lines'])
            current_segment['topic'] = self._extract_topic(current_segment['content'])
            current_segment['summary'] = self._generate_summary(current_segment['content'])
            sub_segments.append(current_segment)

        return sub_segments

    def _is_paragraph_start(self, line: str, line_index: int, all_lines: List[str]) -> bool:
        """
        判斷是否為新段落的開始

        Args:
            line: 當前行內容
            line_index: 行索引
            all_lines: 所有行

        Returns:
            是否為新段落開始
        """
        if not line.strip():
            return False

        # 第一行總是段落開始
        if line_index == 0:
            return True

        # 檢查前一行是否為空行
        if line_index > 0 and not all_lines[line_index - 1].strip():
            return True

        # 檢查是否為標題格式
        title_patterns = [
            r'^第[一二三四五六七八九十\d]+段',  # 第X段
            r'^第[一二三四五六七八九十\d]+章',  # 第X章
            r'^第[一二三四五六七八九十\d]+節',  # 第X節
            r'^\d+\.',  # 數字編號
            r'^[一二三四五六七八九十]+、',  # 中文數字編號
            r'^[A-Z][a-z]*:',  # 英文標題
            r'^#+\s+',  # Markdown 標題
            r'^.*：$',  # 以冒號結尾的標題
            r'^結語',  # 結語
            r'^總結',  # 總結
            r'^結論',  # 結論
        ]

        for pattern in title_patterns:
            if re.search(pattern, line):
                return True

        return False

    def _extract_topic(self, content: str) -> str:
        """
        提取段落主題

        Args:
            content: 段落內容

        Returns:
            主題描述
        """
        if not content.strip():
            return "空段落"

        lines = content.strip().split('\n')
        first_line = lines[0].strip()

        # 檢查是否有明顯的標題
        title_patterns = [
            (r'^第([一二三四五六七八九十\d]+)段[：:]?\s*(.+)', r'第\1段：\2'),
            (r'^第([一二三四五六七八九十\d]+)章[：:]?\s*(.+)', r'第\1章：\2'),
            (r'^(\d+)\.\s*(.+)', r'第\1項：\2'),
            (r'^([一二三四五六七八九十]+)、\s*(.+)', r'\1、\2'),
            (r'^(.+)：$', r'\1'),
            (r'^結語', '結語'),
            (r'^總結', '總結'),
            (r'^結論', '結論'),
        ]

        for pattern, replacement in title_patterns:
            match = re.search(pattern, first_line)
            if match:
                if callable(replacement):
                    return replacement(match)
                else:
                    return re.sub(pattern, replacement, first_line)

        # 如果沒有明顯標題，使用前幾個詞作為主題
        words = first_line.split()[:5]
        if words:
            topic = ' '.join(words)
            if len(topic) > 30:
                topic = topic[:30] + "..."
            return topic

        return "未命名段落"
    
    def _detect_content_type(self, content: str, file_path: str = "") -> str:
        """基於文件擴展名檢測內容類型"""
        if not content.strip():
            return 'empty'

        # 從文件路徑獲取擴展名
        if file_path:
            from pathlib import Path
            ext = Path(file_path).suffix.lower()

            # 數據文件
            if ext in ['.csv']:
                return 'data_csv'
            elif ext in ['.json', '.jsonl']:
                return 'data_json'
            elif ext in ['.xlsx', '.xls']:
                return 'data_excel'

            # 文檔文件
            elif ext in ['.md', '.markdown']:
                return 'document_markdown'
            elif ext in ['.docx', '.doc']:
                return 'document_word'
            elif ext in ['.pdf']:
                return 'document_pdf'
            elif ext in ['.txt']:
                return 'text_plain'

            # 代碼文件
            elif ext in ['.py']:
                return 'code_python'
            elif ext in ['.js', '.ts']:
                return 'code_javascript'
            elif ext in ['.html', '.htm']:
                return 'code_html'
            elif ext in ['.css']:
                return 'code_css'
            elif ext in ['.sql']:
                return 'code_sql'
            elif ext in ['.xml']:
                return 'code_xml'
            elif ext in ['.yaml', '.yml']:
                return 'config_yaml'
            elif ext in ['.ini', '.conf']:
                return 'config_ini'

        # 如果沒有文件路徑或無法識別擴展名，回退到內容檢測
        # 檢查是否為數據格式
        try:
            json.loads(content)
            return 'data_json'
        except:
            pass

        # 檢查是否為CSV格式
        if self._is_csv_like(content):
            return 'data_csv'

        # 默認為文本
        return 'text'
    
    def _is_csv_like(self, content: str) -> bool:
        """檢查是否為CSV格式"""
        lines = content.strip().split('\n')
        if len(lines) < 2:
            return False
        
        try:
            # 嘗試解析前幾行
            sample = '\n'.join(lines[:5])
            reader = csv.reader(io.StringIO(sample))
            rows = list(reader)
            
            if len(rows) < 2:
                return False
            
            # 檢查列數是否一致
            col_count = len(rows[0])
            return all(len(row) == col_count for row in rows[1:])
        except:
            return False
    
    def _extract_keywords(self, content: str) -> List[str]:
        """提取關鍵詞"""
        # 簡單的關鍵詞提取
        words = re.findall(r'\b[a-zA-Z_]\w{2,}\b', content)
        
        # 過濾常見詞
        stop_words = {
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
            'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
        }
        
        # 統計詞頻
        word_freq = {}
        for word in words:
            word_lower = word.lower()
            if word_lower not in stop_words and len(word_lower) > 2:
                word_freq[word_lower] = word_freq.get(word_lower, 0) + 1
        
        # 返回頻率最高的關鍵詞
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:10]]
    
    def _generate_summary(self, content: str) -> str:
        """生成內容摘要"""
        # 確保內容是正確的 UTF-8 字符串
        if isinstance(content, bytes):
            content = content.decode('utf-8', errors='replace')

        lines = content.strip().split('\n')

        if not lines:
            return "空內容"

        # 獲取前幾行作為摘要
        summary_lines = []
        for line in lines[:5]:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('//'):
                summary_lines.append(line)
                if len(summary_lines) >= 3:
                    break

        if not summary_lines:
            return f"包含 {len(lines)} 行內容"

        summary = ' '.join(summary_lines)
        if len(summary) > 200:
            # 確保截斷時不會破壞 UTF-8 字符
            summary = summary[:200]
            # 檢查最後一個字符是否完整
            try:
                summary.encode('utf-8')
            except UnicodeEncodeError:
                # 如果最後一個字符不完整，往前截斷
                summary = summary[:-1]
            summary += "..."

        return summary
    
    def _analyze_structure(self, content: str) -> Dict[str, Any]:
        """分析內容結構"""
        lines = content.split('\n')
        
        structure = {
            'total_lines': len(lines),
            'empty_lines': sum(1 for line in lines if not line.strip()),
            'comment_lines': 0,
            'code_lines': 0,
            'has_functions': False,
            'has_classes': False,
            'indentation_levels': set()
        }
        
        for line in lines:
            stripped = line.strip()
            
            # 計算縮進級別
            indent = len(line) - len(line.lstrip())
            if indent > 0:
                structure['indentation_levels'].add(indent)
            
            # 檢查註釋
            if stripped.startswith('#') or stripped.startswith('//') or stripped.startswith('/*'):
                structure['comment_lines'] += 1
            elif stripped:
                structure['code_lines'] += 1
            
            # 檢查函數和類
            if re.search(r'\b(def|function)\s+\w+', line):
                structure['has_functions'] = True
            if re.search(r'\b(class)\s+\w+', line):
                structure['has_classes'] = True
        
        structure['indentation_levels'] = sorted(list(structure['indentation_levels']))
        
        return structure
    
    def _calculate_complexity(self, content: str) -> Dict[str, Any]:
        """計算內容複雜度"""
        lines = content.split('\n')
        
        complexity = {
            'cyclomatic_complexity': 1,  # 基礎複雜度
            'nesting_depth': 0,
            'unique_words': 0,
            'readability_score': 0
        }
        
        # 計算循環複雜度（簡化版）
        control_keywords = ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'case', 'switch']
        for line in lines:
            for keyword in control_keywords:
                if re.search(rf'\b{keyword}\b', line):
                    complexity['cyclomatic_complexity'] += 1
        
        # 計算嵌套深度
        max_depth = 0
        current_depth = 0
        for line in lines:
            stripped = line.strip()
            if stripped.endswith(':') or stripped.endswith('{'):
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif stripped in ['}', 'end'] or (stripped.startswith('end') and len(stripped) <= 6):
                current_depth = max(0, current_depth - 1)
        
        complexity['nesting_depth'] = max_depth
        
        # 計算唯一詞數
        words = re.findall(r'\b\w+\b', content.lower())
        complexity['unique_words'] = len(set(words))
        
        # 簡單的可讀性評分（基於行長度和複雜度）
        avg_line_length = sum(len(line) for line in lines) / max(len(lines), 1)
        complexity['readability_score'] = max(0, 100 - avg_line_length - complexity['cyclomatic_complexity'] * 5)
        
        return complexity
    
    def analyze_data_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """分析數據文件"""
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == '.json':
            return self._analyze_json(content)
        elif file_ext == '.jsonl':
            return self._analyze_jsonl(content)
        elif file_ext in ['.csv', '.tsv']:
            return self._analyze_csv(content, file_ext)
        else:
            return {'error': f'不支持的數據文件格式: {file_ext}'}
    
    def _analyze_json(self, content: str) -> Dict[str, Any]:
        """分析JSON文件"""
        try:
            data = json.loads(content)
            
            def analyze_structure(obj, path="root"):
                if isinstance(obj, dict):
                    return {
                        'type': 'object',
                        'keys': list(obj.keys()),
                        'key_count': len(obj),
                        'nested': {k: analyze_structure(v, f"{path}.{k}") for k, v in obj.items()}
                    }
                elif isinstance(obj, list):
                    return {
                        'type': 'array',
                        'length': len(obj),
                        'item_types': list(set(type(item).__name__ for item in obj[:10])),
                        'sample_items': obj[:3] if obj else []
                    }
                else:
                    return {
                        'type': type(obj).__name__,
                        'value': obj if len(str(obj)) < 100 else str(obj)[:100] + "..."
                    }
            
            return {
                'format': 'json',
                'structure': analyze_structure(data),
                'size_bytes': len(content),
                'valid': True
            }
            
        except json.JSONDecodeError as e:
            return {
                'format': 'json',
                'valid': False,
                'error': str(e)
            }
    
    def _analyze_jsonl(self, content: str) -> Dict[str, Any]:
        """分析JSONL文件"""
        lines = content.strip().split('\n')
        valid_lines = 0
        sample_objects = []
        all_keys = set()
        
        for i, line in enumerate(lines[:100]):  # 只分析前100行
            try:
                obj = json.loads(line)
                valid_lines += 1
                if len(sample_objects) < 3:
                    sample_objects.append(obj)
                if isinstance(obj, dict):
                    all_keys.update(obj.keys())
            except json.JSONDecodeError:
                continue
        
        return {
            'format': 'jsonl',
            'total_lines': len(lines),
            'valid_lines': valid_lines,
            'sample_objects': sample_objects,
            'common_keys': list(all_keys),
            'key_count': len(all_keys)
        }
    
    def _analyze_csv(self, content: str, file_ext: str) -> Dict[str, Any]:
        """分析CSV文件"""
        delimiter = '\t' if file_ext == '.tsv' else ','
        
        try:
            reader = csv.reader(io.StringIO(content), delimiter=delimiter)
            rows = list(reader)
            
            if not rows:
                return {'format': 'csv', 'error': '空文件'}
            
            headers = rows[0]
            data_rows = rows[1:]
            
            # 分析列類型
            column_types = {}
            sample_data = {}
            
            for i, header in enumerate(headers):
                column_values = [row[i] if i < len(row) else '' for row in data_rows[:100]]
                column_types[header] = self._detect_column_type(column_values)
                sample_data[header] = column_values[:3]
            
            return {
                'format': 'csv',
                'columns': headers,
                'column_count': len(headers),
                'row_count': len(data_rows),
                'column_types': column_types,
                'sample_data': sample_data,
                'delimiter': delimiter
            }
            
        except Exception as e:
            return {
                'format': 'csv',
                'error': str(e)
            }
    
    def _detect_column_type(self, values: List[str]) -> str:
        """檢測列的數據類型"""
        non_empty_values = [v for v in values if v.strip()]

        if not non_empty_values:
            return 'empty'

        # 檢查是否為數字
        numeric_count = 0
        numeric_values = []
        for value in non_empty_values:
            try:
                num_val = float(value)
                numeric_values.append(num_val)
                numeric_count += 1
            except ValueError:
                pass

        if numeric_count == len(non_empty_values):
            # 檢查是否為整數
            integer_count = 0
            for value in non_empty_values:
                try:
                    int(value)
                    integer_count += 1
                except ValueError:
                    pass

            if integer_count == len(non_empty_values):
                # 檢查是否為ID類型
                unique_ratio = len(set(non_empty_values)) / len(non_empty_values)
                all_positive = all(float(v) > 0 for v in non_empty_values)
                avg_value = sum(numeric_values) / len(numeric_values) if numeric_values else 0
                has_large_values = avg_value > 1000

                # ID判斷條件：高唯一性 + 正整數 + 較大數值
                if unique_ratio > 0.9 and all_positive and has_large_values:
                    return 'id'
                else:
                    return 'integer'
            else:
                return 'float'

        # 檢查是否為布爾值
        boolean_values = {'true', 'false', '1', '0', 'yes', 'no', 'y', 'n'}
        if all(v.lower() in boolean_values for v in non_empty_values):
            return 'boolean'
        
        # 檢查是否為日期
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{2}-\d{2}-\d{4}'
        ]
        
        date_count = 0
        for value in non_empty_values:
            if any(re.match(pattern, value) for pattern in date_patterns):
                date_count += 1
        
        if date_count > len(non_empty_values) * 0.8:
            return 'date'
        
        return 'string'
