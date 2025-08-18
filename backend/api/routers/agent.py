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


# 工具轉換函數已移除，直接使用 LangChain 工具

async def _preprocess_file(file_path: str, session_id: str) -> dict:
    """
    真正的文件預處理函數

    Args:
        file_path: 文件路徑
        session_id: 會話ID

    Returns:
        文件 summary 字典，如果失敗返回 None
    """
    logger.info(f"🔧 [_preprocess_file] 開始執行文件預處理")
    logger.info(f"📥 輸入參數: file_path='{file_path}', session_id='{session_id}'")

    try:
        import os
        from pathlib import Path

        # 步驟1: 創建 session 目錄
        logger.info(f"📋 步驟1: 創建 session 目錄")
        session_dir = os.path.join(os.getcwd(), 'temp', session_id)
        os.makedirs(session_dir, exist_ok=True)
        logger.info(f"✓ Session 目錄: {session_dir}")

        # 步驟2: 檢查是否已有 summary
        logger.info(f"📋 步驟2: 檢查已存在的 summary")
        summary_file = os.path.join(session_dir, 'file_summary.json')
        if os.path.exists(summary_file):
            logger.info(f"📁 發現已存在的 summary 文件: {summary_file}")
            with open(summary_file, 'r', encoding='utf-8') as f:
                existing_summary = json.load(f)
            logger.info(f"✅ [_preprocess_file] 使用已存在的 summary")
            return existing_summary

        # 步驟3: 檢查文件存在性和基本信息
        logger.info(f"📋 步驟3: 檢查文件基本信息")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        file_size = os.path.getsize(file_path)
        file_extension = Path(file_path).suffix.lower()
        logger.info(f"✓ 文件存在，大小: {file_size} bytes")
        logger.info(f"✓ 文件擴展名: {file_extension}")

        # 步驟4: 導入處理工具
        logger.info(f"📋 步驟4: 導入處理工具")
        from tools.local_file_tools import local_file_tools
        from tools.data_analysis_tools import data_analysis_tools
        logger.info(f"✓ 工具導入完成")

        # 步驟5: 根據文件類型選擇處理方式
        logger.info(f"📋 步驟5: 根據文件類型選擇處理方式")
        if file_extension in ['.csv', '.json', '.xlsx', '.xls']:
            # 數據文件處理
            logger.info("📊 識別為數據文件，開始數據處理")
            try:
                data_info = await data_analysis_tools.get_data_info(file_path, session_id)
                if data_info.get('success'):
                    summary = {
                        'type': 'data',
                        'file_path': file_path,
                        'file_extension': file_extension,
                        'file_size': file_size,
                        'data_info': data_info,
                        'processed_at': __import__('datetime').datetime.now().isoformat(),
                        'session_id': session_id
                    }
                    logger.info(f"✅ 數據文件處理成功: {data_info.get('data_shape', 'unknown')}")
                else:
                    raise Exception(f"數據文件處理失敗: {data_info}")
            except Exception as e:
                logger.warning(f"⚠️ 數據文件處理失敗: {e}，嘗試文本處理")
                return await _process_as_text_file(file_path, session_id, session_dir)
        else:
            # 文本文件處理
            logger.info("📄 識別為文本文件，開始文本處理")
            return await _process_as_text_file(file_path, session_id, session_dir)

        # 步驟6: 保存 summary 到文件
        logger.info(f"📋 步驟6: 保存 summary 到文件")
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        logger.info(f"💾 Summary 已保存到: {summary_file}")
        logger.info(f"📤 Summary 內容前300字符: {str(summary)[:300]}")
        logger.info(f"✅ [_preprocess_file] 執行完成")
        return summary

    except Exception as e:
        logger.error(f"❌ [_preprocess_file] 執行失敗: {e}")
        return None

async def _process_as_text_file(file_path: str, session_id: str, session_dir: str) -> dict:
    """處理文本文件"""
    try:
        import os
        from pathlib import Path
        from tools.local_file_tools import local_file_tools

        # 生成文本摘要
        summary_result = await local_file_tools.read_file_with_summary(file_path, session_id)
        if summary_result.get('success'):
            summary = {
                'type': 'text',
                'file_path': file_path,
                'file_extension': Path(file_path).suffix.lower(),
                'text_summary': summary_result,
                'processed_at': __import__('datetime').datetime.now().isoformat(),
                'session_id': session_id
            }

            # 保存到文件
            summary_file = os.path.join(session_dir, 'file_summary.json')
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ 文本文件處理成功: {summary_result.get('file_info', {}).get('lines', 'unknown')} 行")
            return summary
        else:
            raise Exception(f"文本摘要生成失敗: {summary_result}")

    except Exception as e:
        logger.error(f"❌ 文本文件處理失敗: {e}")
        # 最後嘗試直接讀取
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')
            summary = {
                'type': 'raw_text',
                'file_path': file_path,
                'file_extension': Path(file_path).suffix.lower(),
                'content': content[:1000],  # 只保存前1000字符
                'char_count': len(content),
                'line_count': len(lines),
                'processed_at': __import__('datetime').datetime.now().isoformat(),
                'session_id': session_id
            }

            # 保存到文件
            summary_file = os.path.join(session_dir, 'file_summary.json')
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ 直接讀取文件成功: {len(content)} 字符, {len(lines)} 行")
            return summary

        except Exception as raw_error:
            logger.error(f"❌ 直接讀取文件也失敗: {raw_error}")
            return None

def _determine_request_type(context_data: dict, page_data: dict) -> str:
    """
    判斷請求類型

    Args:
        context_data: 上下文數據 (local file)
        page_data: 頁面數據 (web)

    Returns:
        請求類型: 'local_file', 'web', 'default'
    """
    if context_data and context_data.get('type') == 'file':
        return 'local_file'
    elif page_data:
        return 'web'
    else:
        return 'default'

async def _load_session_summary(session_id: str) -> dict:
    """
    載入 session 中的文件 summary

    Args:
        session_id: 會話ID

    Returns:
        文件 summary 字典，如果不存在返回 None
    """
    try:
        import os
        session_dir = os.path.join(os.getcwd(), 'temp', session_id)
        summary_file = os.path.join(session_dir, 'file_summary.json')

        if os.path.exists(summary_file):
            logger.info(f"📁 載入 session summary: {summary_file}")
            with open(summary_file, 'r', encoding='utf-8') as f:
                summary = json.load(f)
            logger.info(f"✅ Session summary 載入成功，類型: {summary.get('type', 'unknown')}")
            return summary
        else:
            logger.info(f"📁 Session summary 不存在: {summary_file}")
            return None
    except Exception as e:
        logger.error(f"❌ 載入 session summary 失敗: {e}")
        return None

async def _update_session_summary(session_id: str, updated_summary: dict) -> bool:
    """
    更新 session 中的文件 summary

    Args:
        session_id: 會話ID
        updated_summary: 更新後的 summary

    Returns:
        是否更新成功
    """
    try:
        import os
        session_dir = os.path.join(os.getcwd(), 'temp', session_id)
        os.makedirs(session_dir, exist_ok=True)
        summary_file = os.path.join(session_dir, 'file_summary.json')

        # 添加更新時間戳
        updated_summary['last_updated'] = __import__('datetime').datetime.now().isoformat()

        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(updated_summary, f, ensure_ascii=False, indent=2)

        logger.info(f"✅ Session summary 已更新: {summary_file}")
        return True
    except Exception as e:
        logger.error(f"❌ 更新 session summary 失敗: {e}")
        return False

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
    session_id: str = Field(default="default_session", description="會話ID")
    context_data: Optional[Dict[str, Any]] = Field(default=None, description="上下文資料（頁面或文件）")
    page_data: Optional[Dict[str, Any]] = Field(default=None, description="當前頁面資料（向後兼容）")


async def generate_stream_response(message: str, agent: SupervisorAgent, session_id: str = "default_session", context_data: dict = None, page_data: dict = None, request_type: str = 'default') -> AsyncGenerator[str, None]:
    """生成流式響應"""
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
            logger.info("📁 LOCAL FILE 模式 - Session 記憶系統")
            available_tools = get_langchain_local_file_tools()

            # 🧠 **步驟1：載入 Session 中的 Summary (記憶系統)**
            logger.info("🧠 步驟1: 載入 Session 記憶中的文件 Summary")
            session_summary = await _load_session_summary(session_id)

            if session_summary:
                logger.info("✅ 找到 Session 記憶中的 Summary，使用現有記憶")
                file_summary = session_summary
                summary_preview = str(file_summary)[:300]
                logger.info(f"� Session Summary 前300字符: {summary_preview}")
            else:
                # �🔄 **步驟2：如果沒有 Summary，執行初始文件預處理**
                if context_data and context_data.get('file_path'):
                    logger.info("🔄 步驟2: Session 中無 Summary，執行初始文件預處理")
                    file_path = context_data.get('file_path')
                    file_summary = await _preprocess_file(file_path, session_id)

                    if file_summary:
                        logger.info(f"✅ 初始文件預處理完成，Summary 已存入 Session 記憶")
                        summary_preview = str(file_summary)[:300]
                        logger.info(f"📄 新建 Summary 前300字符: {summary_preview}")
                    else:
                        logger.error("❌ 初始文件預處理失敗")
                        file_summary = None
                else:
                    logger.error("❌ 沒有提供 file_path 且 Session 中無 Summary")
                    file_summary = None

            # 🎯 **將 Summary 添加到 context_data 中 (永遠包含最新的 Session 記憶)**
            final_context = context_data.copy() if context_data else {}
            if file_summary:
                final_context['file_summary'] = file_summary
                logger.info("✅ Session Summary 已添加到 context_data，作為 SupervisorAgent 的默認輸入")
            else:
                logger.warning("⚠️ 沒有可用的 Summary")

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

        result = await agent.run(query, rule_id=rule_name, context=context, available_tools=available_tools)

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
        logger.info(f"  - message: {request.message}")
        logger.info(f"  - user_id: {request.user_id}")
        logger.info(f"  - context_data: {request.context_data}")
        logger.info(f"  - page_data: {request.page_data}")

        # 🔍 判斷請求類型並選擇對應的處理方式
        request_type = _determine_request_type(request.context_data, request.page_data)
        logger.info(f"🎯 請求類型: {request_type}")

        agent = get_agent()

        return StreamingResponse(
            generate_stream_response(request.message, agent, request.session_id, request.context_data, request.page_data, request_type),
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