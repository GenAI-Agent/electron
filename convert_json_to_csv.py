#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON to CSV Converter for Social Media Data
將所有 JSON 檔案轉換為 CSV 格式，複雜資料結構轉為字串
"""

import json
import csv
import os
import glob
from pathlib import Path

def convert_complex_to_string(value):
    """將複雜資料結構轉換為字串"""
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return value

def convert_json_to_csv(json_file_path, csv_file_path):
    """將單個 JSON 檔案轉換為 CSV"""
    try:
        # 讀取 JSON 檔案
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print(f"⚠️  {json_file_path} 是空檔案，跳過")
            return False
            
        # 如果是單個物件，轉換為列表
        if isinstance(data, dict):
            data = [data]
        
        # 獲取所有可能的欄位名稱
        all_fields = set()
        for item in data:
            if isinstance(item, dict):
                all_fields.update(item.keys())
        
        all_fields = sorted(list(all_fields))
        
        # 寫入 CSV 檔案
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=all_fields)
            writer.writeheader()
            
            for item in data:
                if isinstance(item, dict):
                    # 轉換複雜資料結構為字串
                    converted_item = {}
                    for field in all_fields:
                        value = item.get(field, '')
                        converted_item[field] = convert_complex_to_string(value)
                    writer.writerow(converted_item)
        
        print(f"✅ 成功轉換: {json_file_path} -> {csv_file_path}")
        return True
        
    except Exception as e:
        print(f"❌ 轉換失敗 {json_file_path}: {str(e)}")
        return False

def main():
    """主函數：批量轉換所有 JSON 檔案"""
    
    # 設定目錄路徑
    sandbox_dir = Path("data/sandbox")
    
    if not sandbox_dir.exists():
        print(f"❌ 目錄不存在: {sandbox_dir}")
        return
    
    # 尋找所有 JSON 檔案
    json_files = list(sandbox_dir.glob("*.json"))
    
    if not json_files:
        print("❌ 沒有找到 JSON 檔案")
        return
    
    print(f"🔍 找到 {len(json_files)} 個 JSON 檔案")
    print("=" * 50)
    
    success_count = 0
    total_count = len(json_files)
    
    # 逐一轉換每個 JSON 檔案
    for json_file in json_files:
        # 生成對應的 CSV 檔案名稱
        csv_file = json_file.with_suffix('.csv')
        
        print(f"🔄 處理: {json_file.name}")
        
        if convert_json_to_csv(json_file, csv_file):
            success_count += 1
        
        print()
    
    print("=" * 50)
    print(f"📊 轉換完成: {success_count}/{total_count} 成功")
    
    # 列出轉換後的 CSV 檔案
    csv_files = list(sandbox_dir.glob("*.csv"))
    print(f"📁 現有 CSV 檔案 ({len(csv_files)} 個):")
    for csv_file in sorted(csv_files):
        print(f"   - {csv_file.name}")

if __name__ == "__main__":
    main()
