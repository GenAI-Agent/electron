"""
Agent API 路由

處理與 Agent 相關的請求，只提供流式接口。
"""

import json
from typing import AsyncGenerator, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from supervisor_agent.core.supervisor_agent import SupervisorAgent
from supervisor_agent.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

# 全局 agent 實例
_agent_instance = None


def get_agent() -> SupervisorAgent:
    """獲取 Agent 實例"""
    global _agent_instance

    if _agent_instance is None:
        # 創建新實例（備用方案）
        from pathlib import Path
        rules_dir = Path(__file__).parent.parent.parent / "data" / "rules"
        logger.info(f"🔧 創建新 Agent 實例，規則目錄: {rules_dir}")
        _agent_instance = SupervisorAgent(str(rules_dir))

    return _agent_instance

def set_agent(agent: SupervisorAgent):
    """設置 Agent 實例"""
    global _agent_instance
    _agent_instance = agent
    logger.info("✅ Agent 實例已設置")


class StreamRequest(BaseModel):
    """流式請求模型"""
    message: str = Field(..., description="用戶消息")
    user_id: str = Field(default="default_user", description="用戶ID")
    page_data: Optional[Dict[str, Any]] = Field(default=None, description="當前頁面資料")


async def generate_stream_response(message: str, agent: SupervisorAgent, page_data: dict = None) -> AsyncGenerator[str, None]:
    """生成流式響應"""
    try:
        logger.info(f"🚀 開始生成流式響應")
        logger.info(f"  - message: {message}")
        logger.info(f"  - message 長度: {len(message)}")
        logger.info(f"  - message 類型: {type(message)}")
        logger.info(f"  - page_data: {page_data}")
        logger.info(f"  - page_data 類型: {type(page_data)}")
        if page_data:
            logger.info(f"  - page_data 內容: {json.dumps(page_data, ensure_ascii=False, indent=2)}")
        else:
            logger.info(f"  - page_data 為空或 None")

        # 發送開始事件
        start_event = {'type': 'start', 'message': '開始處理任務...'}
        yield f"data: {json.dumps(start_event, ensure_ascii=False)}\n\n"

        # 解析規則
        rule_name = None
        query = message
        logger.info(f"🔍 開始解析規則:")
        logger.info(f"  - 原始 message: '{message}'")
        logger.info(f"  - message.startswith('/'): {message.startswith('/')}")

        if message.startswith('/'):
            parts = message[1:].split(' ', 1)
            logger.info(f"  - 分割後的 parts: {parts}")
            logger.info(f"  - parts 長度: {len(parts)}")
            if len(parts) >= 1:
                rule_name = parts[0]
                query = parts[1] if len(parts) > 1 else ""
                logger.info(f"  - 解析出的 rule_name: '{rule_name}'")
                logger.info(f"  - 解析出的 query: '{query}'")

        logger.info(f"🎯 最終解析結果:")
        logger.info(f"  - rule_name: '{rule_name}'")
        logger.info(f"  - query: '{query}'")

        if rule_name:
            rule_event = {'type': 'rule', 'rule_name': rule_name, 'message': f'使用規則: {rule_name}'}
            yield f"data: {json.dumps(rule_event, ensure_ascii=False)}\n\n"

        # 發送處理事件
        processing_event = {'type': 'processing', 'message': '正在執行任務...'}
        yield f"data: {json.dumps(processing_event, ensure_ascii=False)}\n\n"

        # 執行任務 - 傳遞頁面資料作為 context
        context = {"page_data": page_data} if page_data else None
        result = await agent.run(query, rule_id=rule_name, context=context)

        # 發送工具使用事件
        tools_used = result.get('tools_used', [])
        if tools_used:
            tools_event = {'type': 'tools', 'message': f'使用了工具: {", ".join(tools_used)}'}
            yield f"data: {json.dumps(tools_event, ensure_ascii=False)}\n\n"

        # 發送內容事件
        content_event = {
            'type': 'content',
            'content': result.get('response', ''),
            'execution_time': result.get('execution_time', 0),
            'tools_used': tools_used
        }
        yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"

        # 發送完成事件
        complete_event = {
            'type': 'complete',
            'message': '任務執行完成',
            'success': result.get('success', True)
        }
        yield f"data: {json.dumps(complete_event, ensure_ascii=False)}\n\n"

    except Exception as e:
        logger.error(f"流式響應生成失敗: {e}")
        error_event = {'type': 'error', 'message': f'處理失敗: {str(e)}'}
        json_str = json.dumps(error_event, ensure_ascii=False)
        yield f"data: {json_str}\n\n"

    finally:
        # 發送結束標記
        yield "data: [DONE]\n\n"


@router.post("/stream")
async def stream_chat(request: StreamRequest):
    """流式聊天接口"""
    try:
        logger.info(f"收到流式聊天請求: {request.message[:100]}...")
        logger.info(f"🔍 完整請求內容:")
        logger.info(f"  - message: {request.message}")
        logger.info(f"  - user_id: {request.user_id}")
        logger.info(f"  - page_data: {request.page_data}")

        agent = get_agent()

        return StreamingResponse(
            generate_stream_response(request.message, agent, request.page_data),
            media_type="text/event-stream; charset=utf-8",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*",
            }
        )

    except Exception as e:
        logger.error(f"流式聊天失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_agent_status():
    """獲取 Agent 狀態"""
    try:
        agent = get_agent()
        rules = agent.parser.list_rules()
        
        return {
            "status": "running",
            "rules_count": len(rules),
            "available_rules": rules
        }
    except Exception as e:
        logger.error(f"獲取狀態失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))
