#!/usr/bin/env python3
"""
AI選情沙盒 API 路由
處理Thread、PTT、陳情系統等資料來源的管理和分析
"""

import os
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import asyncio
import aiofiles
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# 資料目錄
SANDBOX_DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "sandbox"
SANDBOX_DATA_DIR.mkdir(exist_ok=True)

class RefreshRequest(BaseModel):
    source: str  # 'thread' 或 'ptt'

class DataFile(BaseModel):
    filename: str
    date: str
    time: str
    fullPath: str

@router.get("/files")
async def get_available_files(source: str = Query(..., description="資料來源: thread, ptt, petition")):
    """獲取指定資料來源的可用檔案列表"""
    try:
        files = []
        
        # 根據資料來源過濾檔案
        if source == "thread":
            pattern = "thread_data_*.csv"
        elif source == "ptt":
            pattern = "ptt_data_*.csv"
        elif source == "petition":
            pattern = "petition_system_*.csv"
        else:
            raise HTTPException(status_code=400, detail="不支援的資料來源")
        
        # 掃描檔案
        for file_path in SANDBOX_DATA_DIR.glob(pattern):
            # 解析檔名中的日期時間
            filename = file_path.name
            try:
                # 假設檔名格式: {source}_data_YYYYMMDD_HHMMSS.csv
                parts = filename.replace('.csv', '').split('_')
                if len(parts) >= 4:
                    date_str = parts[-2]  # YYYYMMDD
                    time_str = parts[-1]  # HHMMSS
                    
                    # 格式化日期時間
                    date_formatted = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
                    time_formatted = f"{time_str[:2]}:{time_str[2:4]}:{time_str[4:6]}"
                    
                    files.append(DataFile(
                        filename=filename,
                        date=date_formatted,
                        time=time_formatted,
                        fullPath=str(file_path)
                    ))
            except Exception as e:
                logger.warning(f"解析檔名失敗 {filename}: {e}")
                continue
        
        # 按日期時間排序（最新的在前）
        files.sort(key=lambda x: f"{x.date} {x.time}", reverse=True)
        
        return files
        
    except Exception as e:
        logger.error(f"獲取檔案列表失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
async def get_file_data(filename: str = Query(..., description="檔案名稱")):
    """讀取指定檔案的資料"""
    try:
        file_path = SANDBOX_DATA_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="檔案不存在")
        
        # 讀取CSV檔案
        data = []
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
            
        # 解析CSV
        lines = content.strip().split('\n')
        if len(lines) < 2:
            return []
        
        headers = lines[0].split(',')
        for line in lines[1:]:
            values = line.split(',')
            if len(values) == len(headers):
                row = dict(zip(headers, values))
                data.append(row)
        
        return data
        
    except Exception as e:
        logger.error(f"讀取檔案資料失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh")
async def refresh_data(request: RefreshRequest, background_tasks: BackgroundTasks):
    """刷新指定資料來源的資料"""
    try:
        if request.source not in ["thread", "ptt"]:
            raise HTTPException(status_code=400, detail="不支援的資料來源")
        
        # 生成新的檔案名稱（包含當前時間戳）
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        filename = f"{request.source}_data_{timestamp}.csv"
        file_path = SANDBOX_DATA_DIR / filename
        
        # 在背景執行資料刷新
        background_tasks.add_task(perform_data_refresh, request.source, file_path)
        
        return {
            "message": "資料刷新已開始",
            "filename": filename,
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"刷新資料失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def perform_data_refresh(source: str, file_path: Path):
    """執行實際的資料刷新作業"""
    try:
        logger.info(f"開始刷新 {source} 資料...")
        
        if source == "thread":
            await refresh_thread_data(file_path)
        elif source == "ptt":
            await refresh_ptt_data(file_path)
        
        logger.info(f"{source} 資料刷新完成: {file_path}")
        
    except Exception as e:
        logger.error(f"資料刷新失敗 {source}: {e}")

async def refresh_thread_data(file_path: Path):
    """刷新Thread資料"""
    # 模擬API調用和資料處理
    await asyncio.sleep(2)  # 模擬API調用延遲

    # 生成模擬資料（實際應該調用Thread API）
    import random

    topics = [
        "政府新政策討論", "經濟民生問題", "教育改革議題", "交通建設進度",
        "環保政策執行", "醫療資源分配", "房屋政策討論", "勞工權益保障",
        "農業發展問題", "文化保存工作", "科技發展政策", "社會福利制度"
    ]

    regions = ["台北市", "新北市", "桃園市", "台中市", "高雄市", "台南市", "新竹市", "基隆市"]
    genders = ["男", "女"]

    sample_data = []
    now = datetime.now()

    for i in range(20):  # 生成20筆資料
        topic = random.choice(topics)
        region = random.choice(regions)
        age = random.randint(20, 60)
        gender = random.choice(genders)

        # 隨機生成時間（過去24小時內）
        time_offset = random.randint(0, 1440)  # 0-1440分鐘
        from datetime import timedelta
        post_time = now - timedelta(minutes=time_offset)

        sample_data.append({
            "日期時間": post_time.strftime("%Y-%m-%d %H:%M:%S"),
            "貼文ID": f"T{post_time.strftime('%H%M%S')}{i:03d}",
            "內容": f"關於{topic}的討論，大家覺得如何？",
            "關注數": str(random.randint(50, 500)),
            "表情反應": f"👍{random.randint(20, 200)} 👎{random.randint(5, 50)} 😡{random.randint(0, 30)}",
            "瀏覽數": str(random.randint(1000, 10000)),
            "地區": region,
            "年齡": str(age),
            "性別": gender,
            "主題標籤": f"#{topic[:4]}"
        })
    
    # 寫入CSV檔案
    async with aiofiles.open(file_path, 'w', encoding='utf-8', newline='') as f:
        if sample_data:
            headers = list(sample_data[0].keys())
            await f.write(','.join(headers) + '\n')
            
            for row in sample_data:
                values = [str(row.get(header, '')) for header in headers]
                await f.write(','.join(values) + '\n')

async def refresh_ptt_data(file_path: Path):
    """刷新PTT資料"""
    # 模擬爬蟲和資料處理
    await asyncio.sleep(3)  # 模擬爬蟲延遲

    # 生成模擬資料（實際應該執行PTT爬蟲）
    import random

    titles = [
        "[問卦] 政府政策到底有沒有效？",
        "[新聞] 最新經濟數據出爐",
        "[討論] 教育改革的影響",
        "[抱怨] 交通建設進度太慢",
        "[環保] 空氣品質改善方案",
        "[醫療] 健保制度檢討",
        "[房屋] 青年購屋困難",
        "[勞工] 薪資成長停滯"
    ]

    boards = ["Gossiping", "Politics", "HatePolitics", "PublicServan", "Salary", "home-sale"]
    regions = ["台北市", "新北市", "桃園市", "台中市", "高雄市", "台南市", "新竹市", "基隆市"]
    genders = ["男", "女"]

    sample_data = []
    now = datetime.now()

    for i in range(25):  # 生成25筆資料
        title = random.choice(titles)
        board = random.choice(boards)
        region = random.choice(regions)
        age = random.randint(18, 55)
        gender = random.choice(genders)

        # 隨機生成時間（過去48小時內）
        time_offset = random.randint(0, 2880)  # 0-2880分鐘
        from datetime import timedelta
        post_time = now - timedelta(minutes=time_offset)

        sample_data.append({
            "日期時間": post_time.strftime("%Y-%m-%d %H:%M:%S"),
            "文章ID": f"P{post_time.strftime('%H%M%S')}{i:03d}",
            "標題": title,
            "內容摘要": f"關於{title[4:]}的詳細討論內容...",
            "推文數": str(random.randint(10, 200)),
            "噓文數": str(random.randint(0, 50)),
            "瀏覽數": str(random.randint(500, 5000)),
            "地區": region,
            "年齡": str(age),
            "性別": gender,
            "看板": board
        })
    
    # 寫入CSV檔案
    async with aiofiles.open(file_path, 'w', encoding='utf-8', newline='') as f:
        if sample_data:
            headers = list(sample_data[0].keys())
            await f.write(','.join(headers) + '\n')
            
            for row in sample_data:
                values = [str(row.get(header, '')) for header in headers]
                await f.write(','.join(values) + '\n')

@router.get("/stats")
async def get_data_stats(source: str = Query(..., description="資料來源")):
    """獲取資料統計資訊"""
    try:
        files = await get_available_files(source)
        
        total_files = len(files)
        latest_file = files[0] if files else None
        
        # 如果有最新檔案，讀取資料量
        total_records = 0
        if latest_file:
            data = await get_file_data(latest_file.filename)
            total_records = len(data)
        
        return {
            "source": source,
            "total_files": total_files,
            "total_records": total_records,
            "latest_update": f"{latest_file.date} {latest_file.time}" if latest_file else None
        }
        
    except Exception as e:
        logger.error(f"獲取統計資訊失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))
