#!/usr/bin/env python3
"""
Calendar API Router

提供日曆事件的 API 端點，支持事件查詢、過濾和分析功能。
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from supervisor_agent.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

# 數據模型定義
class EventRole(BaseModel):
    entity_id: str
    role: str
    required: bool = True
    response_status: str = "needsAction"
    weight: float = 1.0

class EventPlace(BaseModel):
    entity_id: Optional[str] = None
    fallback_text: str
    geo: Optional[Dict[str, Any]] = None
    region: Optional[str] = None

class EventWhen(BaseModel):
    start: str
    end: str
    timezone: str = "Asia/Taipei"
    all_day: bool = False
    rrule: Optional[str] = None
    span: bool = False

class EventFacets(BaseModel):
    type: str
    topics: List[str] = []
    tags: List[str] = []

class EventProvenance(BaseModel):
    source: str
    created_by: str
    created_at: str
    updated_at: str

class CalendarEvent(BaseModel):
    id: str
    kind: str = Field(..., description="Event kind: business, personal, activity, public_event")
    when: EventWhen
    roles: List[EventRole] = []
    place: Optional[EventPlace] = None
    facets: EventFacets
    status: str = "planned"
    visibility: str = "team"
    priority: float = Field(0.5, ge=0.0, le=1.0)
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    notes: Optional[str] = None
    provenance: EventProvenance

class CalendarResponse(BaseModel):
    events: List[CalendarEvent]
    total: int
    date_range: Dict[str, str]
    filters_applied: Dict[str, Any] = {}

class Entity(BaseModel):
    id: str
    type: str
    name: str
    aliases: List[str] = []
    labels: List[str] = []
    contacts: Optional[Dict[str, Any]] = None
    geo: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
    visibility: str = "team"

# 數據加載函數
def load_calendar_data() -> Dict[str, Any]:
    """加載日曆數據"""
    try:
        # 獲取數據文件路徑
        project_root = Path(__file__).parent.parent.parent.parent
        calendar_file = project_root / "data" / "calendar" / "events.json"

        logger.info(f"Looking for calendar data at: {calendar_file}")
        logger.info(f"File exists: {calendar_file.exists()}")

        if not calendar_file.exists():
            logger.error(f"Calendar data file not found: {calendar_file}")
            return {"events": [], "entities": []}

        with open(calendar_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        logger.info(f"Loaded {len(data.get('events', []))} calendar events")
        logger.info(f"Loaded {len(data.get('entities', []))} calendar entities")
        return data

    except Exception as e:
        logger.error(f"Error loading calendar data: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"events": [], "entities": []}

def filter_events_by_date_range(
    events: List[Dict[str, Any]], 
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """根據日期範圍過濾事件"""
    if not start_date and not end_date:
        return events
    
    filtered_events = []
    for event in events:
        event_start = event.get("when", {}).get("start", "")
        event_end = event.get("when", {}).get("end", "")
        
        try:
            event_start_dt = datetime.fromisoformat(event_start.replace("Z", "+00:00"))
            event_end_dt = datetime.fromisoformat(event_end.replace("Z", "+00:00"))
            
            # 檢查日期範圍
            include_event = True
            
            if start_date:
                filter_start_dt = datetime.fromisoformat(start_date + "T00:00:00+08:00")
                if event_end_dt < filter_start_dt:
                    include_event = False
            
            if end_date and include_event:
                filter_end_dt = datetime.fromisoformat(end_date + "T23:59:59+08:00")
                if event_start_dt > filter_end_dt:
                    include_event = False
            
            if include_event:
                filtered_events.append(event)
                
        except Exception as e:
            logger.warning(f"Error parsing event date {event.get('id', 'unknown')}: {e}")
            continue
    
    return filtered_events

# API 端點
@router.get("/events", response_model=CalendarResponse)
async def get_calendar_events(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    kind: Optional[str] = Query(None, description="Event kind filter"),
    status: Optional[str] = Query(None, description="Event status filter"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of events to return")
):
    """
    獲取日曆事件列表
    
    支持的查詢參數：
    - start_date: 開始日期 (YYYY-MM-DD)
    - end_date: 結束日期 (YYYY-MM-DD)  
    - kind: 事件類型過濾 (business, personal, activity, public_event)
    - status: 事件狀態過濾 (planned, confirmed, done, canceled)
    - limit: 返回事件數量限制
    """
    try:
        # 加載數據
        data = load_calendar_data()
        events = data.get("events", [])
        
        # 應用過濾器
        filters_applied = {}
        
        # 日期範圍過濾
        if start_date or end_date:
            events = filter_events_by_date_range(events, start_date, end_date)
            filters_applied["date_range"] = {"start": start_date, "end": end_date}
        
        # 事件類型過濾
        if kind:
            events = [e for e in events if e.get("kind") == kind]
            filters_applied["kind"] = kind
        
        # 事件狀態過濾
        if status:
            events = [e for e in events if e.get("status") == status]
            filters_applied["status"] = status
        
        # 限制返回數量
        events = events[:limit]
        
        # 確定日期範圍
        if events:
            event_dates = []
            for event in events:
                event_start = event.get("when", {}).get("start", "")
                if event_start:
                    try:
                        event_dt = datetime.fromisoformat(event_start.replace("Z", "+00:00"))
                        event_dates.append(event_dt.date())
                    except:
                        continue
            
            if event_dates:
                min_date = min(event_dates).isoformat()
                max_date = max(event_dates).isoformat()
            else:
                min_date = max_date = datetime.now().date().isoformat()
        else:
            min_date = max_date = datetime.now().date().isoformat()
        
        # 構建響應
        response = CalendarResponse(
            events=[CalendarEvent(**event) for event in events],
            total=len(events),
            date_range={"start": min_date, "end": max_date},
            filters_applied=filters_applied
        )
        
        logger.info(f"Returned {len(events)} calendar events with filters: {filters_applied}")
        return response
        
    except Exception as e:
        logger.error(f"Error fetching calendar events: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/events/{event_id}", response_model=CalendarEvent)
async def get_calendar_event(event_id: str):
    """獲取特定事件詳情"""
    try:
        data = load_calendar_data()
        events = data.get("events", [])
        
        # 查找事件
        event = next((e for e in events if e.get("id") == event_id), None)
        
        if not event:
            raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")
        
        return CalendarEvent(**event)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/entities", response_model=List[Entity])
async def get_calendar_entities(
    entity_type: Optional[str] = Query(None, description="Entity type filter"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of entities to return")
):
    """獲取日曆相關實體列表"""
    try:
        data = load_calendar_data()
        entities = data.get("entities", [])
        
        # 類型過濾
        if entity_type:
            entities = [e for e in entities if e.get("type") == entity_type]
        
        # 限制數量
        entities = entities[:limit]
        
        return [Entity(**entity) for entity in entities]
        
    except Exception as e:
        logger.error(f"Error fetching calendar entities: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/health")
async def calendar_health_check():
    """日曆服務健康檢查"""
    try:
        data = load_calendar_data()
        events_count = len(data.get("events", []))
        entities_count = len(data.get("entities", []))
        
        return {
            "status": "healthy",
            "events_count": events_count,
            "entities_count": entities_count,
            "data_loaded": True
        }
        
    except Exception as e:
        logger.error(f"Calendar health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "data_loaded": False
        }
