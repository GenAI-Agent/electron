"""
Agent API 路由

處理與 Agent 相關的請求，只提供流式接口。
"""

import json
import numpy as np
from typing import AsyncGenerator, Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from supervisor_agent.core.supervisor_agent import SupervisorAgent

# 添加 src 目錄到路徑以導入工具
import os
import sys
from pathlib import Path
current_dir = Path(__file__).parent
src_dir = current_dir.parent.parent / "src"
sys.path.insert(0, str(src_dir))

# 導入 LangChain 兼容的本地文件工具
from supervisor_agent.tools.langchain_local_file_tools import get_langchain_local_file_tools
from supervisor_agent.utils.logger import get_logger

logger = get_logger(__name__)


def convert_numpy_types(obj):
    """
    遞歸轉換numpy類型為Python原生類型，解決JSON序列化問題
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj


# 工具轉換函數已移除，直接使用 LangChain 工具

# 移除不需要的函數，簡化邏輯

def _determine_request_type(context_data: dict, page_data: dict) -> str:
    """
    判斷請求類型

    Args:
        context_data: 上下文數據 (local file)
        page_data: 頁面數據 (web)

    Returns:
        請求類型: 'local_file', 'web'
    """
    if page_data:
        return 'web'
    else:
        return 'local_file'

# 移除 session summary 相關函數

router = APIRouter()

# Session-based Agent 管理
class AgentManager:
    """Agent管理器，為每個session維護獨立的agent實例"""

    def __init__(self):
        self.agents: Dict[str, SupervisorAgent] = {}
        # 從 backend/api/routers/agent.py 到 data/rules 的正確路徑
        self.rules_dir = Path(__file__).parent.parent.parent.parent / "data" / "rules"
        logger.info(f"📁 AgentManager rules_dir: {self.rules_dir}")
        logger.info(f"📁 rules_dir 是否存在: {self.rules_dir.exists()}")
        if self.rules_dir.exists():
            rule_files = list(self.rules_dir.glob("*.json"))
            logger.info(f"📁 找到的 rule 文件: {[f.name for f in rule_files]}")

    def get_agent(self, session_id: str, stream_callback=None) -> SupervisorAgent:
        """獲取指定session的Agent實例"""
        if session_id not in self.agents:
            logger.info(f"🆕 為session {session_id} 創建新的Agent實例")
            self.agents[session_id] = SupervisorAgent(str(self.rules_dir), stream_callback)
        else:
            # 更新現有agent的stream_callback
            self.agents[session_id].stream_callback = stream_callback
        return self.agents[session_id]

    def cleanup_agent(self, session_id: str):
        """清理指定session的Agent實例"""
        if session_id in self.agents:
            logger.info(f"🗑️ 清理session {session_id} 的Agent實例")
            del self.agents[session_id]

    def get_active_sessions(self) -> List[str]:
        """獲取活躍的session列表"""
        return list(self.agents.keys())

# 全域Agent管理器實例
_agent_manager = AgentManager()

def get_agent(session_id: str = "default", stream_callback=None) -> SupervisorAgent:
    """獲取指定session的Agent實例"""
    return _agent_manager.get_agent(session_id, stream_callback)

def set_agent(agent: SupervisorAgent, session_id: str = "default"):
    """設置指定session的Agent實例"""
    _agent_manager.agents[session_id] = agent
    logger.info(f"✅ Session {session_id} 的Agent實例已設置")


class StreamRequest(BaseModel):
    """流式請求模型"""
    message: str = Field(..., description="用戶消息")
    user_id: str = Field(default="default_user", description="用戶ID")
    session_id: str = Field(default="default_session", description="會話ID")
    context_data: Optional[Dict[str, Any]] = Field(default=None, description="上下文資料（頁面或文件）")
    page_data: Optional[Dict[str, Any]] = Field(default=None, description="當前頁面資料（向後兼容）")


async def generate_stream_response(message: str, agent: SupervisorAgent, session_id: str = "default_session", context_data: dict = None, page_data: dict = None, request_type: str = 'default') -> AsyncGenerator[str, None]:
    """生成流式響應"""

    # 用於存儲stream事件的列表
    stream_events = []

    # 定義stream回調函數
    async def stream_callback(event_data):
        """收集工具執行結果"""
        stream_events.append(event_data)

    try:
        logger.info(f"🚀 開始生成流式響應")
        logger.info(f"  - message: {message}")
        logger.info(f"  - session_id: {session_id}")
        logger.info(f"  - context_data: {context_data}")
        logger.info(f"  - page_data: {page_data}")
        logger.info(f"  - request_type: {request_type}")

        # 🎯 根據請求類型選擇工具集和處理方式
        available_tools = []
        file_summary = None
        final_context = None

        if request_type == 'local_file':
            logger.info("📁 LOCAL FILE 模式 - 直接處理文件")
            available_tools = get_langchain_local_file_tools()

            # 🔄 **直接處理文件，獲取 data_info**
            if context_data and context_data.get('file_path'):
                file_path = context_data.get('file_path')
                logger.info(f"📄 處理文件: {file_path}")

                # 直接調用底層的數據分析函數獲取數據信息
                from src.tools.data_analysis_tools import data_analysis_tools

                try:
                    data_info_result = await data_analysis_tools.get_data_info(file_path, session_id)
                    logger.info(f"� get_data_info_tool 執行結果: {str(data_info_result)[:500]}...")

                    # 構建 final_context，只包含 data_info
                    final_context = {
                        'file_path': file_path,
                        'data_info': data_info_result
                    }

                    # 詳細記錄傳給 agent 的內容
                    logger.info("� 傳給 Agent 的 final_context 內容:")
                    logger.info(f"  - file_path: {final_context['file_path']}")
                    logger.info(f"  - data_info 類型: {type(final_context['data_info'])}")

                    if isinstance(data_info_result, dict):
                        # 記錄 data_info 的關鍵信息
                        sample_data = data_info_result.get('sample_data', [])
                        total_rows = data_info_result.get('total_rows', 0)
                        columns = data_info_result.get('columns', [])

                        logger.info(f"  - sample_data 數量: {len(sample_data)}")
                        logger.info(f"  - total_rows: {total_rows}")
                        logger.info(f"  - columns: {columns}")
                        logger.info(f"  - sample_data 內容: {sample_data}")

                        # 確保有 sample_data
                        if sample_data:
                            logger.info("✅ 成功獲取 sample_data，將傳給 Agent")
                        else:
                            logger.warning("⚠️ sample_data 為空")

                except Exception as e:
                    logger.error(f"❌ 處理文件失敗: {e}")
                    final_context = {'error': f'文件處理失敗: {str(e)}'}
            else:
                logger.error("❌ 沒有提供 file_path")
                final_context = {'error': '沒有提供文件路徑'}

        elif request_type == 'web':
            logger.info("🌐 WEB 模式 - 使用 Web Tools")
            # TODO: 添加 Web Tools
            available_tools = []  # 暫時為空，等待實現 Web Tools
            final_context = page_data
            logger.info(f"  - 使用上下文: {json.dumps(final_context, ensure_ascii=False, indent=2)}")

        else:
            logger.info("🔧 DEFAULT 模式 - 使用默認工具集")
            available_tools = get_langchain_local_file_tools()
            final_context = context_data or page_data
            if final_context:
                logger.info(f"  - 使用上下文: {json.dumps(final_context, ensure_ascii=False, indent=2)}")
            else:
                logger.info(f"  - 無上下文數據")

        logger.info(f"🔧 選擇的工具數量: {len(available_tools)}")

        # 發送開始事件
        if request_type == 'local_file':
            start_event = {'type': 'start', 'message': '📁 Local File 模式：文件預處理已完成，開始分析...'}
        elif request_type == 'web':
            start_event = {'type': 'start', 'message': '🌐 Web 模式：開始處理網頁內容...'}
        else:
            start_event = {'type': 'start', 'message': '🔧 Default 模式：開始處理任務...'}

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

        # 🎯 **關鍵步驟：傳遞預處理後的上下文給 SupervisorAgent**
        logger.info("🔄 步驟2: 準備上下文數據傳遞給 SupervisorAgent")

        context = {
            "session_id": session_id,
            "context_data": final_context,  # 這裡已經包含了 file_summary
            "current_time": __import__('datetime').datetime.now().isoformat()
        } if final_context else {
            "session_id": session_id,
            "current_time": __import__('datetime').datetime.now().isoformat()
        }

        # 檢查是否有文件 summary（應該已經在 final_context 中）
        if final_context and final_context.get('file_summary'):
            logger.info(f"📋 確認：文件 Summary 已包含在 context_data 中")
            logger.info(f"📋 Summary 類型: {final_context['file_summary'].get('type', 'unknown')}")
        elif file_summary:
            # 備用方案：直接添加到 context
            context["file_summary"] = file_summary
            logger.info(f"📋 備用：文件 Summary 已直接添加到 context")

        # 將工具名稱列表傳遞給 Agent，而不是函數對象
        tool_names = [tool.name for tool in available_tools]
        context["available_tool_names"] = tool_names

        logger.info(f"🔄 步驟3: 準備調用 SupervisorAgent，工具數量: {len(available_tools)}")

        # 獲取agent實例並設置stream回調
        agent = get_agent(session_id, stream_callback)

        # 執行agent，stream回調會自動處理工具執行結果
        result = await agent.run(query, rule_id=rule_name, context=context, available_tools=available_tools)

        # 轉換numpy類型以避免序列化問題
        result = convert_numpy_types(result)

        # 發送所有工具執行事件
        for event_data in stream_events:
            if event_data['type'] == 'tool_result':
                tool_event = {
                    'type': 'tool_execution',
                    'tool_name': event_data['tool_name'],
                    'parameters': event_data['parameters'],
                    'execution_time': event_data['execution_time'],
                    'result': event_data['wrapped_result']
                }
                tool_event = convert_numpy_types(tool_event)
                yield f"data: {json.dumps(tool_event, ensure_ascii=False)}\n\n"

        # 發送工具使用事件
        tools_used = result.get('tools_used', [])
        if tools_used:
            tools_event = {'type': 'tools', 'message': f'使用了工具: {", ".join(tools_used)}'}
            tools_event = convert_numpy_types(tools_event)
            yield f"data: {json.dumps(tools_event, ensure_ascii=False)}\n\n"

        # 發送內容事件
        content_event = {
            'type': 'content',
            'content': result.get('response', ''),
            'execution_time': result.get('execution_time', 0),
            'tools_used': tools_used
        }
        content_event = convert_numpy_types(content_event)
        yield f"data: {json.dumps(content_event, ensure_ascii=False)}\n\n"

        # 發送完成事件
        complete_event = {
            'type': 'complete',
            'message': '任務執行完成',
            'success': result.get('success', True)
        }
        complete_event = convert_numpy_types(complete_event)
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
        logger.info(f"  - user_id: {request.user_id}")
        logger.info(f"  - context_data: {request.context_data}")
        logger.info(f"  - page_data: {request.page_data}")

        # 🔍 判斷請求類型並選擇對應的處理方式
        request_type = _determine_request_type(request.context_data, request.page_data)
        logger.info(f"🎯 請求類型: {request_type}")

        return StreamingResponse(
            generate_stream_response(request.message, None, request.session_id, request.context_data, request.page_data, request_type),
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