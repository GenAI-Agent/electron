"""
CSV 格式轉換工具
用於將 Gmail CSV 格式轉換為標準化格式
"""

import pandas as pd
import re
from datetime import datetime
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class CSVFormatConverter:
    """CSV 格式轉換器"""
    
    def convert_gmail_csv(self, input_file: str, output_file: str = None) -> str:
        """
        轉換 Gmail CSV 格式
        
        修改內容：
        1. 移除 id 欄位
        2. 簡化 sender 格式（只保留名稱和郵箱）
        3. 標準化日期格式為數字顯示
        
        Args:
            input_file: 輸入 CSV 文件路徑
            output_file: 輸出 CSV 文件路徑（可選）
            
        Returns:
            輸出文件路徑
        """
        try:
            # 讀取 CSV 文件
            df = pd.read_csv(input_file, encoding='utf-8-sig')
            logger.info(f"📁 讀取 CSV 文件: {input_file}, 共 {len(df)} 行")
            
            # 1. 移除 id 欄位（如果存在）
            if 'id' in df.columns:
                df = df.drop('id', axis=1)
                logger.info("✅ 已移除 id 欄位")
            
            # 2. 簡化 sender 格式
            if 'sender' in df.columns:
                df['sender'] = df['sender'].apply(self._simplify_sender)
                logger.info("✅ 已簡化 sender 格式")
            
            # 3. 標準化日期格式
            if 'date' in df.columns:
                df['date'] = df['date'].apply(self._standardize_date)
                logger.info("✅ 已標準化日期格式")
            
            # 生成輸出文件名
            if not output_file:
                if input_file.endswith('.csv'):
                    output_file = input_file.replace('.csv', '_formatted.csv')
                else:
                    output_file = input_file + '_formatted.csv'
            
            # 保存轉換後的文件
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            logger.info(f"💾 已保存轉換後的文件: {output_file}")
            
            return output_file
            
        except Exception as e:
            logger.error(f"❌ CSV 格式轉換失敗: {e}")
            raise
    
    def _simplify_sender(self, sender: str) -> str:
        """
        簡化發件人格式
        
        輸入: "舒培培" <peipeishu93@gmail.com> 或 舒培培 <peipeishu93@gmail.com>
        輸出: 舒培培 <peipeishu93@gmail.com>
        """
        if pd.isna(sender) or not sender:
            return ""
        
        sender = str(sender).strip()
        
        # 移除多餘的引號
        sender = re.sub(r'^"([^"]+)"\s*<(.+)>$', r'\1 <\2>', sender)
        
        # 確保格式為 "名稱 <郵箱>"
        email_pattern = r'<([^>]+)>'
        email_match = re.search(email_pattern, sender)
        
        if email_match:
            email = email_match.group(1)
            # 提取名稱部分
            name_part = re.sub(email_pattern, '', sender).strip()
            name_part = name_part.strip('"').strip()
            
            if name_part:
                return f"{name_part} <{email}>"
            else:
                return f"<{email}>"
        
        return sender
    
    def _standardize_date(self, date_str: str) -> str:
        """
        標準化日期格式
        
        輸入: "Wed, 20 Aug 2025 15:12:34 +0800" 或其他格式
        輸出: "2025-08-20 15:12:34"
        """
        if pd.isna(date_str) or not date_str:
            return ""
        
        date_str = str(date_str).strip()
        
        # 如果已經是標準格式，直接返回
        if re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$', date_str):
            return date_str
        
        try:
            # 嘗試解析各種日期格式
            date_formats = [
                "%a, %d %b %Y %H:%M:%S %z",  # Wed, 20 Aug 2025 15:12:34 +0800
                "%a, %d %b %Y %H:%M:%S",     # Wed, 20 Aug 2025 15:12:34
                "%Y-%m-%d %H:%M:%S",         # 2025-08-20 15:12:34
                "%Y-%m-%d",                  # 2025-08-20
                "%d/%m/%Y %H:%M:%S",         # 20/08/2025 15:12:34
                "%d/%m/%Y",                  # 20/08/2025
                "%d-%m-%Y %H:%M:%S",         # 20-08-2025 15:12:34
                "%d-%m-%Y",                  # 20-08-2025
            ]
            
            parsed_date = None
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue
            
            if parsed_date:
                return parsed_date.strftime("%Y-%m-%d %H:%M:%S")
            else:
                logger.warning(f"⚠️ 無法解析日期格式: {date_str}")
                return date_str
                
        except Exception as e:
            logger.warning(f"⚠️ 日期轉換失敗: {date_str}, 錯誤: {e}")
            return date_str
    
    def preview_conversion(self, input_file: str, num_rows: int = 5) -> Dict[str, Any]:
        """
        預覽轉換結果
        
        Args:
            input_file: 輸入文件路徑
            num_rows: 預覽行數
            
        Returns:
            包含原始和轉換後數據的字典
        """
        try:
            # 讀取原始數據
            df_original = pd.read_csv(input_file, encoding='utf-8-sig')
            
            # 創建轉換後的數據
            df_converted = df_original.copy()
            
            # 應用轉換
            if 'id' in df_converted.columns:
                df_converted = df_converted.drop('id', axis=1)
            
            if 'sender' in df_converted.columns:
                df_converted['sender'] = df_converted['sender'].apply(self._simplify_sender)
            
            if 'date' in df_converted.columns:
                df_converted['date'] = df_converted['date'].apply(self._standardize_date)
            
            return {
                "original": {
                    "columns": df_original.columns.tolist(),
                    "sample_data": df_original.head(num_rows).to_dict('records')
                },
                "converted": {
                    "columns": df_converted.columns.tolist(),
                    "sample_data": df_converted.head(num_rows).to_dict('records')
                },
                "changes": {
                    "removed_columns": ['id'] if 'id' in df_original.columns else [],
                    "modified_columns": ['sender', 'date'],
                    "total_rows": len(df_original)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ 預覽轉換失敗: {e}")
            raise


# 全局實例
csv_converter = CSVFormatConverter()


def convert_gmail_csv_format(input_file: str, output_file: str = None) -> str:
    """
    轉換 Gmail CSV 格式的便利函數
    
    Args:
        input_file: 輸入 CSV 文件路徑
        output_file: 輸出 CSV 文件路徑（可選）
        
    Returns:
        輸出文件路徑
    """
    return csv_converter.convert_gmail_csv(input_file, output_file)


def preview_gmail_csv_conversion(input_file: str, num_rows: int = 5) -> Dict[str, Any]:
    """
    預覽 Gmail CSV 轉換結果的便利函數
    
    Args:
        input_file: 輸入文件路徑
        num_rows: 預覽行數
        
    Returns:
        預覽結果字典
    """
    return csv_converter.preview_conversion(input_file, num_rows)
