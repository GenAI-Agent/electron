"""
Supervisor Agent - Gmail 自動化處理監督者
使用 LangGraph 架構，整合多個專業工具，提供 Gmail 自動化處理功能
參考 example/gov_agent.py 的架構實現
"""

from __future__ import annotations
import logging
import asyncio
import json
import time
import uuid
import os
import sys
from typing import List, Optional, Dict, Any, Annotated, Literal
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.prebuilt.tool_node import ToolNode as BaseToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import AzureChatOpenAI
import tiktoken

# 工具將在查詢時動態導入

from ..utils.logger import get_logger

logger = get_logger(__name__)

# ----------------------- State Definition ----------------------- #

class SupervisorAgentState(TypedDict):
    """Supervisor Agent 的狀態定義"""
    messages: Annotated[list, add_messages]
    query: str
    rule_id: Optional[str]
    context: Optional[Dict[str, Any]]

# ----------------------- 平行工具執行節點 ----------------------- #

class ParallelToolNode(BaseToolNode):
    """平行執行工具的自定義 ToolNode"""

    def __init__(self, tools: List, stream_callback=None):
        super().__init__(tools)
        self.tools_by_name = {tool.name: tool for tool in tools}
        self.stream_callback = stream_callback  # 添加stream回調函數

    async def _execute_single_tool_with_message(self, tool, tool_args, tool_call_id, tool_name):
        """執行單個工具並返回 ToolMessage"""
        try:
            # 記錄工具調用參數
            logger.info(f"🔧 執行工具: {tool_name}")
            logger.info(f"📋 工具參數: {tool_args}")
            start_time = time.time()

            # 執行工具
            if asyncio.iscoroutinefunction(tool.func):
                result = await tool.func(**tool_args)
            else:
                result = tool.func(**tool_args)

            execution_time = time.time() - start_time
            logger.info(f"✅ 工具 {tool_name} 執行完成，耗時 {execution_time:.2f}秒")

            # 記錄工具執行結果（前300字符）
            result_str = str(result)
            logger.info(f"📤 工具 {tool_name} 執行結果前300字符: {result_str[:300]}")

            # 包裝工具結果，添加 tool 標籤
            wrapped_result = f"<tool name='{tool_name}' execution_time='{execution_time:.2f}s'>\n{result_str}\n</tool>"

            # 如果有stream回調，實時發送工具執行結果
            if self.stream_callback:
                await self.stream_callback({
                    'type': 'tool_result',
                    'tool_name': tool_name,
                    'parameters': tool_args,
                    'result': result_str,
                    'execution_time': execution_time,
                    'wrapped_result': wrapped_result
                })

            # 創建 ToolMessage
            return ToolMessage(
                content=wrapped_result,
                tool_call_id=tool_call_id,
                name=tool_name
            )

        except Exception as e:
            logger.error(f"❌ 工具 {tool_name} 執行失敗: {e}")
            error_result = f"<tool name='{tool_name}' status='error'>\n工具執行失敗: {str(e)}\n</tool>"
            return ToolMessage(
                content=error_result,
                tool_call_id=tool_call_id,
                name=tool_name
            )

    async def __call__(self, state: SupervisorAgentState) -> Dict[str, Any]:
        """平行執行所有工具調用"""
        messages = state.get("messages", [])

        # 找到最後一個 AI 消息中的工具調用
        tool_calls = []
        for message in reversed(messages):
            if isinstance(message, AIMessage) and hasattr(message, "tool_calls") and message.tool_calls:
                tool_calls = message.tool_calls
                break

        if not tool_calls:
            logger.warning("⚠️ 沒有找到工具調用")
            return {"messages": []}

        logger.info(f"🚀 平行執行 {len(tool_calls)} 個工具")

        # 準備平行執行的任務
        tasks = []
        for tool_call in tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call.get("args", {})
            tool_call_id = tool_call.get("id", "")

            if tool_name in self.tools_by_name:
                tool = self.tools_by_name[tool_name]

                # 創建異步任務
                task = self._execute_single_tool_with_message(
                    tool, tool_args, tool_call_id, tool_name
                )
                tasks.append(task)
            else:
                logger.warning(f"⚠️ 未知工具: {tool_name}")

        if not tasks:
            return {"messages": []}

        # 平行執行所有工具
        try:
            tool_messages = await asyncio.gather(*tasks, return_exceptions=True)

            # 處理結果
            valid_messages = []
            for msg in tool_messages:
                if isinstance(msg, ToolMessage):
                    valid_messages.append(msg)
                elif isinstance(msg, Exception):
                    logger.error(f"❌ 工具執行異常: {msg}")

            logger.info(f"✅ 平行工具執行完成，成功 {len(valid_messages)} 個")
            return {"messages": valid_messages}

        except Exception as e:
            logger.error(f"❌ 平行工具執行失敗: {e}")
            return {"messages": []}

# ----------------------- Supervisor Agent ----------------------- #

class SupervisorAgent:
    """Gmail 自動化處理監督者 Agent"""

    def __init__(self, rules_dir: str = "data/rules", stream_callback=None):
        logger.info("🔄 開始初始化 Supervisor Agent...")
        init_start = time.time()

        # 設置規則目錄
        self.rules_dir = rules_dir
        # 設置stream回調函數
        self.stream_callback = stream_callback

        # 初始化 LLM
        self.llm = AzureChatOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            azure_deployment="gpt-4o",
            api_version="2025-01-01-preview",
            temperature=0.7,
        )

        logger.info("✅ LLM 初始化完成")

        # 初始化Token計算器
        try:
            self.tokenizer = tiktoken.encoding_for_model("gpt-4")
        except:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")

        # 當前會話的工具（動態設置）
        self.current_tools = []
        self.current_llm_with_tools = None
        self.current_graph = None

        init_time = time.time() - init_start
        logger.info(f"✅ Supervisor Agent 初始化完成，耗時 {init_time:.2f}秒")

    def calculate_tokens(self, text: str) -> int:
        """計算文本的token數量"""
        try:
            return len(self.tokenizer.encode(text))
        except Exception as e:
            logger.warning(f"Token計算失敗: {e}")
            # 簡單估算：1 token ≈ 4 字符
            return len(text) // 4

    def calculate_messages_tokens(self, messages: List) -> int:
        """計算消息列表的總token數"""
        total_tokens = 0
        for msg in messages:
            if hasattr(msg, 'content'):
                total_tokens += self.calculate_tokens(str(msg.content))
            else:
                total_tokens += self.calculate_tokens(str(msg))
        return total_tokens

    def manage_context_for_batch_processing(self, messages: List, context: Dict[str, Any]) -> List:
        """為batch processing管理上下文，只保留進度信息"""
        is_batch_mode = context.get("is_batch_processing", False)

        if not is_batch_mode:
            return messages  # 非batch模式，保持原有邏輯

        # Batch模式：只保留最近的重要消息和進度信息
        important_messages = []
        tool_call_count = 0

        for msg in messages:
            if isinstance(msg, (HumanMessage, SystemMessage)):
                # 保留用戶消息和系統消息
                important_messages.append(msg)
            elif isinstance(msg, AIMessage):
                # 保留AI消息，但簡化內容
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    tool_call_count += len(msg.tool_calls)
                important_messages.append(msg)
            elif isinstance(msg, ToolMessage):
                # 工具消息只保留進度信息，不保留詳細結果
                tool_call_count += 1

                # 檢查是否是進度相關的工具結果
                content = str(msg.content)
                if any(keyword in content.lower() for keyword in ['進度', 'progress', '完成', '任務', 'task']):
                    # 保留進度信息
                    important_messages.append(msg)
                else:
                    # 簡化工具結果
                    simplified_content = f"工具 {msg.name} 執行完成 (第{tool_call_count}次調用)"
                    simplified_msg = ToolMessage(
                        content=simplified_content,
                        tool_call_id=msg.tool_call_id,
                        name=msg.name
                    )
                    important_messages.append(simplified_msg)

        # 記錄token節省情況
        original_tokens = self.calculate_messages_tokens(messages)
        managed_tokens = self.calculate_messages_tokens(important_messages)
        logger.info(f"🧠 Batch模式Token管理: {original_tokens} → {managed_tokens} (節省 {original_tokens - managed_tokens})")

        return important_messages

    def compress_tool_messages(self, messages: List, max_tool_results: int = 3) -> List:
        """
        壓縮工具消息，只保留最近的幾個工具結果

        Args:
            messages: 消息列表
            max_tool_results: 最大保留的工具結果數量

        Returns:
            壓縮後的消息列表
        """
        compressed_messages = []
        tool_message_count = 0

        # 從後往前遍歷，保留最近的工具結果
        for msg in reversed(messages):
            if isinstance(msg, ToolMessage):
                if tool_message_count < max_tool_results:
                    # 壓縮工具結果內容
                    content = str(msg.content)
                    if len(content) > 500:  # 如果內容太長，截斷
                        try:
                            import json
                            parsed = json.loads(content)
                            if isinstance(parsed, dict):
                                # 保留關鍵信息，移除大數據字段
                                compressed_parsed = {
                                    "success": parsed.get("success", True),
                                    "message": parsed.get("message", ""),
                                    "summary": f"工具執行結果已壓縮 (原長度: {len(content)} 字符)"
                                }
                                # 保留關鍵統計信息
                                for key in ["total_rows", "filtered_rows", "analysis_type", "results_count"]:
                                    if key in parsed:
                                        compressed_parsed[key] = parsed[key]

                                # 保留重要的工作進度信息
                                important_keys = [
                                    "temp_file_path", "temp_file_created", "current_data_updated",
                                    "operation", "file_path", "columns", "results"
                                ]
                                for key in important_keys:
                                    if key in parsed:
                                        if key == "results" and isinstance(parsed[key], dict):
                                            # 保留結果摘要，不保留詳細數據
                                            compressed_parsed[key + "_summary"] = {
                                                k: v for k, v in parsed[key].items()
                                                if not isinstance(v, (list, dict)) or k in ["count", "mean", "sum"]
                                            }
                                        else:
                                            compressed_parsed[key] = parsed[key]

                                content = json.dumps(compressed_parsed, ensure_ascii=False)
                        except:
                            # 如果不是JSON，直接截斷
                            content = content[:500] + "... (內容已截斷)"

                    compressed_msg = ToolMessage(
                        content=content,
                        tool_call_id=msg.tool_call_id,
                        name=msg.name
                    )
                    compressed_messages.insert(0, compressed_msg)
                    tool_message_count += 1
                else:
                    # 超過限制的工具消息用摘要替代
                    summary_msg = ToolMessage(
                        content=f"工具 {msg.name} 執行完成 (結果已省略)",
                        tool_call_id=msg.tool_call_id,
                        name=msg.name
                    )
                    compressed_messages.insert(0, summary_msg)
            else:
                compressed_messages.insert(0, msg)

        return compressed_messages

    def setup_tools_for_query(self, tool_names: List[str] = None, available_tools: List = None):
        """為當前查詢動態設置工具"""
        logger.info(f"🔧 開始動態設置工具，規則工具: {tool_names}")

        # 開始設置工具
        self.current_tools = []

        # 如果有外部提供的工具列表，優先使用
        if available_tools:
            self.current_tools = available_tools
            logger.info(f"📁 使用外部提供的工具，共 {len(available_tools)} 個")
            for tool in available_tools:
                tool_name = getattr(tool, 'name', str(tool))
                logger.info(f"🔧 添加工具: {tool_name}")
        else:
            # 否則使用默認瀏覽器工具（向後兼容）
            try:
                from ..tools.langchain_browser_tools import get_langchain_browser_tools
                browser_tools = get_langchain_browser_tools()

                for tool in browser_tools:
                    self.current_tools.append(tool)
                    logger.info(f"🌐 添加默認瀏覽器工具: {tool.name}")

            except Exception as e:
                logger.warning(f"⚠️ 瀏覽器工具導入失敗: {e}")

        # 根據規則添加額外工具（如果需要）
        if tool_names:
            logger.info(f"📋 規則指定的工具: {tool_names}")
            # 這裡可以根據 tool_names 添加額外的工具

        # 綁定工具到 LLM
        if self.current_tools:
            self.current_llm_with_tools = self.llm.bind_tools(self.current_tools)
            logger.info(f"🔧 工具綁定完成，共 {len(self.current_tools)} 個工具")
        else:
            self.current_llm_with_tools = self.llm
            logger.info("🔧 無工具模式，使用純LLM")

        # 重新建立 graph
        self._build_graph()

    def _build_graph(self):
        """建立 LangGraph workflow - 循環決策架構"""
        # 初始化 StateGraph
        workflow = StateGraph(SupervisorAgentState)

        # 創建自定義的平行 ToolNode 來處理工具調用
        if self.current_tools:
            tool_node = ParallelToolNode(self.current_tools, self.stream_callback)
        else:
            # 沒有工具時創建一個空的工具節點
            tool_node = ParallelToolNode([], self.stream_callback)

        # 添加節點
        workflow.add_node("supervisor", self.supervisor_node)  # 中央決策節點
        workflow.add_node("tools", tool_node)  # 工具執行節點（使用平行執行）
        workflow.add_node("response_generator", self.response_generator_node)  # 最終回答生成節點

        # 設定流程 - 從supervisor節點開始
        workflow.add_edge(START, "supervisor")

        # supervisor節點後的條件分支
        workflow.add_conditional_edges(
            "supervisor",
            self.should_continue,  # 自定義條件函數
            {
                "tools": "tools",           # 需要調用工具
                "respond": "response_generator",  # 直接回答
                "__end__": END,             # 結束
            },
        )

        # 工具執行後回到supervisor節點重新評估
        workflow.add_edge("tools", "supervisor")

        # 回答生成後結束
        workflow.add_edge("response_generator", END)

        # 編譯 graph with 短期記憶
        self.current_graph = workflow.compile(checkpointer=MemorySaver())

        logger.info(f"✅ Supervisor Agent Graph 建立完成，工具數量: {len(self.current_tools)}")

    def should_continue(self, state: SupervisorAgentState) -> str:
        """決定下一步動作的條件函數"""
        messages = state.get("messages", [])
        context = state.get("context", {})

        if not messages:
            return "respond"

        last_message = messages[-1]

        # 如果最後一個消息是AI消息且有工具調用，執行工具
        if isinstance(last_message, AIMessage) and hasattr(last_message, "tool_calls") and last_message.tool_calls:
            logger.info(f"🔧 supervisor決定調用工具: {len(last_message.tool_calls)} 個")
            return "tools"

        # 檢查是否是batch processing模式
        is_batch_mode = context.get("is_batch_processing", False)

        # 檢查是否達到最大工具調用次數（防止無限循環）
        tool_messages = [msg for msg in messages if isinstance(msg, ToolMessage)]
        max_tools = 50 if is_batch_mode else 10  # batch模式允許更多工具調用

        if len(tool_messages) >= max_tools:
            logger.info(f"🛑 達到最大工具調用次數({max_tools})，強制生成回答")
            return "respond"

        # 如果最後一個消息是AI消息但沒有工具調用，生成最終回答
        if isinstance(last_message, AIMessage):
            logger.info("� supervisor決定生成最終回答")
            return "respond"

        # 其他情況（如ToolMessage），說明需要回到supervisor重新評估
        # 但這個邏輯已經在graph中處理了（tools -> supervisor）
        logger.info("🔄 其他情況，生成回答")
        return "respond"

    async def supervisor_node(self, state: SupervisorAgentState) -> Dict[str, Any]:
        """中央決策節點 - 分析當前狀態並決定下一步動作"""
        query = state.get("query", "")
        messages = state.get("messages", [])
        rule_id = state.get("rule_id")
        context = state.get("context", {})

        # 計算當前token使用量
        current_tokens = self.calculate_messages_tokens(messages)
        logger.info(f"📊 當前上下文Token數: {current_tokens}")

        # 智能記憶管理
        if current_tokens > 8000:  # 如果token數量過多，進行壓縮
            logger.info(f"🧠 Token數量過多 ({current_tokens})，開始記憶壓縮")
            messages = self.compress_tool_messages(messages, max_tool_results=3)
            compressed_tokens = self.calculate_messages_tokens(messages)
            logger.info(f"🧠 記憶壓縮完成: {current_tokens} → {compressed_tokens} (節省 {current_tokens - compressed_tokens})")
            state["messages"] = messages

            # 壓縮後，將會話狀態信息注入到上下文中，確保不丟失重要信息
            try:
                from ..core.session_data_manager import session_data_manager
                session_summary = session_data_manager.get_session_summary(context.get("session_id", "default"))
                if session_summary.get("has_current_data"):
                    context["session_data_info"] = {
                        "current_data_file": session_summary.get("current_data_file"),
                        "operations_count": session_summary.get("operations_count"),
                        "last_operation": session_summary.get("last_operation"),
                        "note": "記憶壓縮後保留的會話數據狀態信息"
                    }
                    logger.info(f"🔄 會話狀態信息已注入上下文: {session_summary.get('current_data_file')}")
            except Exception as e:
                logger.warning(f"⚠️ 無法注入會話狀態信息: {e}")

        # 如果是batch processing模式，額外管理上下文
        if context.get("is_batch_processing", False):
            messages = self.manage_context_for_batch_processing(messages, context)
            managed_tokens = self.calculate_messages_tokens(messages)
            logger.info(f"🧠 Batch模式Token管理後: {managed_tokens}")
            # 更新state中的messages
            state["messages"] = messages

        # 檢查是否是初始查詢
        is_initial_query = not any(isinstance(msg, (AIMessage, ToolMessage)) for msg in messages)

        if is_initial_query:
            logger.info(f"🤖 處理初始用戶查詢: {query}")

            # 構建系統提示
            system_prompt = self._get_system_prompt(rule_id, context)

            # 構建消息
            llm_messages = [SystemMessage(content=system_prompt)]

            # 添加用戶查詢
            if query:
                llm_messages.append(HumanMessage(content=query))

        else:
            # 這是工具執行後的重新評估
            logger.info("🔄 工具執行後重新評估，決定下一步動作")

            # 檢查最近的工具執行結果
            recent_tool_messages = [msg for msg in messages[-5:] if isinstance(msg, ToolMessage)]

            # 檢查是否已經執行了太多工具（防止無限循環）
            tool_count = len([msg for msg in messages if isinstance(msg, ToolMessage)])
            if tool_count >= 8:
                logger.info(f"🛑 已執行 {tool_count} 個工具，停止並生成回答")
                # 直接生成回答，不再調用工具
                final_prompt = f"""基於已執行的工具結果，請直接回答用戶的問題：

用戶請求: {query}

已執行的工具結果:
{chr(10).join([f"- {msg.name}: {msg.content[:300]}..." for msg in recent_tool_messages])}

請基於這些信息提供完整的回答，不要再調用任何工具。"""

                llm_messages = [
                    SystemMessage(content="你是一個智能助手。請基於提供的信息直接回答用戶問題，不要調用任何工具。"),
                    HumanMessage(content=final_prompt)
                ]
            elif recent_tool_messages:
                # 檢查是否獲得了有效的頁面內容
                page_content_found = False
                for msg in recent_tool_messages:
                    if msg.name == "browser_get_page_data_tool" and len(msg.content) > 100:
                        page_content_found = True
                        break

                if page_content_found:
                    logger.info("✅ 已獲得有效的頁面內容，準備生成回答")
                    # 有了頁面內容，應該可以回答了
                    evaluation_prompt = f"""你已經成功獲取了頁面內容。請基於以下信息直接回答用戶的問題：

用戶請求: {query}

頁面內容:
{chr(10).join([f"- {msg.name}: {msg.content[:500]}..." for msg in recent_tool_messages if msg.name == "browser_get_page_data_tool"])}

請提供完整的回答，不需要再調用其他工具。"""
                else:
                    # 沒有獲得有效內容，可能需要重試
                    evaluation_prompt = f"""基於以下工具執行結果，請分析是否需要調用更多工具來完成用戶的請求：

用戶原始請求: {query}

最近的工具執行結果:
{chr(10).join([f"- {msg.name}: {msg.content[:200]}..." for msg in recent_tool_messages])}

請決定：
1. 如果需要更多工具來完成任務，請調用相應的工具
2. 如果已經有足夠的信息，請直接回答用戶

注意：避免重複調用相同的工具，除非有新的參數或需求。"""

                llm_messages = [
                    SystemMessage(content=self._get_system_prompt(rule_id, context)),
                    HumanMessage(content=evaluation_prompt)
                ]

                # 添加對話歷史（最近的消息）
                llm_messages.extend(messages[-10:])  # 只保留最近10條消息避免token過多
            else:
                # 沒有工具消息，直接使用現有消息
                llm_messages = [SystemMessage(content=self._get_system_prompt(rule_id, context))]
                llm_messages.extend(messages)

        # 調用 LLM 進行決策
        response = await self.current_llm_with_tools.ainvoke(llm_messages)

        # 記錄決策結果
        if hasattr(response, "tool_calls") and response.tool_calls:
            tool_names = [call["name"] for call in response.tool_calls]
            logger.info(f"🔧 決定調用工具: {tool_names}")
        else:
            logger.info("💬 決定直接回應用戶")

        return {"messages": [response]}

    def _get_system_prompt(self, rule_id: Optional[str], context: Dict[str, Any]) -> str:
        """獲取系統提示"""

        # 檢查是否是文件處理模式
        context_data = context.get('context_data', {}) if context else {}
        is_file_mode = context_data.get('type') == 'file'

        # 檢查是否有自定義的system_prompt
        custom_system_prompt = context_data.get('system_prompt')
        if custom_system_prompt:
            logger.info("📋 使用自定義system_prompt")
            return custom_system_prompt

        if is_file_mode:
            # 文件處理模式的系統提示
            file_path = context_data.get('file_path', '未知文件')
            current_time = context.get('current_time', '未知時間')

            # 檢查是否有文件 summary（優先從 context_data 中獲取）
            file_summary_info = ""
            summary = None

            # 優先從 context_data 中獲取 file_summary
            if context_data and context_data.get('file_summary'):
                summary = context_data['file_summary']
                logger.info("📋 從 context_data 中獲取到文件 summary")
            # 備用方案：從 context 中獲取
            elif context.get('file_summary'):
                summary = context['file_summary']
                logger.info("📋 從 context 中獲取到文件 summary")

            if summary:
                file_type = summary.get('type', 'unknown')

                if file_type == 'data':
                    data_info = summary.get('data_info', {})
                    data_shape = data_info.get('data_shape', [0, 0])
                    file_summary_info = f"""
📊 **文件 Summary 已載入**:
- 文件類型: 數據文件 ({summary.get('file_extension', 'unknown')})
- 數據形狀: {data_shape[0]} 行 × {data_shape[1]} 列
- 處理時間: {summary.get('processed_at', 'unknown')}
- 數值列: {data_info.get('numeric_columns', [])}
- 分類列: {data_info.get('categorical_columns', [])}
- Session 目錄: temp/{summary.get('session_id', 'unknown')}/
"""
                elif file_type == 'text':
                    # 檢查是否是新的簡潔摘要格式
                    if 'content_sections' in summary and 'file_path' in summary:
                        # 新的簡潔摘要格式
                        file_path = summary.get('file_path', 'unknown')
                        content_sections = summary.get('content_sections', [])

                        file_summary_info = f"""
📄 **文件摘要**:
文件路徑: {file_path}

📋 **內容段落**:
"""
                        # 添加段落摘要 - 使用你要的格式
                        for section in content_sections:
                            start_line = section.get('start_line', 0)
                            end_line = section.get('end_line', 0)
                            summary_text = section.get('summary', '無摘要')

                            if start_line == end_line:
                                file_summary_info += f"\n**第{start_line}行**: {summary_text}"
                            else:
                                file_summary_info += f"\n**第{start_line}-{end_line}行**: {summary_text}"

                    # 檢查是否是智能摘要格式
                    elif 'file_info' in summary and 'content_sections' in summary:
                        # 智能摘要格式
                        file_info = summary.get('file_info', {})
                        content_sections = summary.get('content_sections', [])

                        file_summary_info = f"""
📄 **文件摘要**:
文件路徑: {file_info.get('path', 'unknown')}

📋 **內容段落**:
"""
                        # 添加段落摘要 - 使用你要的格式
                        for section in content_sections:
                            section_number = section.get('section_number', 0)
                            line_range = section.get('line_range', '')
                            title = section.get('title', '無標題')

                            file_summary_info += f"\n**第{line_range}行**: {title}"

                    else:
                        # 舊的摘要格式
                        text_summary = summary.get('text_summary', {})
                        if text_summary and text_summary.get('success'):
                            summary_data = text_summary.get('summary', {})
                            file_info = summary_data.get('file_info', {})
                            segments = summary_data.get('segments', [])
                            overall_stats = summary_data.get('overall_stats', {})

                            file_summary_info = f"""
📄 **文件 Summary 已載入**:
- 文件類型: 文本文件 ({summary.get('file_extension', 'unknown')})
- 文件大小: {file_info.get('size', 0)} bytes
- 行數: {file_info.get('lines', 0)}
- 編碼: {file_info.get('encoding', 'unknown')}
- 摘要段落數: {len(segments)}
- 關鍵詞: {overall_stats.get('unique_keywords', [])}
- 預估閱讀時間: {overall_stats.get('estimated_reading_time', {}).get('reading_time_minutes', 0):.1f} 分鐘

📋 **文件內容摘要**:
"""
                            # 添加段落摘要
                            for i, segment in enumerate(segments[:5], 1):  # 只顯示前5個段落
                                file_summary_info += f"\n{i}. 第{segment.get('start_line', 0)}-{segment.get('end_line', 0)}行: {segment.get('summary', '無摘要')}"

                            if len(segments) > 5:
                                file_summary_info += f"\n... 還有 {len(segments) - 5} 個段落"
                        else:
                            file_summary_info = f"""
📄 **文件 Summary 已載入**:
- 文件類型: 文本文件 ({summary.get('file_extension', 'unknown')})
- 處理狀態: 摘要生成失敗
- Session 目錄: temp/{summary.get('session_id', 'unknown')}/
"""
                else:
                    file_summary_info = f"""
📄 **文件 Summary 已載入**:
- 文件類型: 原始文本 ({summary.get('file_extension', 'unknown')})
- 字符數: {summary.get('char_count', 0)}
- 行數: {summary.get('line_count', 0)}
- 處理時間: {summary.get('processed_at', 'unknown')}
- Session 目錄: temp/{summary.get('session_id', 'unknown')}/
"""

            base_instructions = f"""
📁 **文件處理模式 - Session 記憶系統** (當前時間: {current_time}):
你正在處理文件: {file_path}

🧠 **Session 記憶系統**:
- 這是一個持續的 session，文件的所有修改都會累積在記憶中
- 以下 Summary 是當前 session 中文件的最新狀態
- 每次文件修改後，你必須更新這個 Summary
- 這個 Summary 是你對文件的完整記憶，包含所有歷史修改

{file_summary_info}
🔧 **可用工具** (共15個)：

**文件操作工具**:
1. **read_file_with_summary_tool**: 重新讀取文件並生成摘要
2. **edit_file_by_lines_tool**: 按行編輯文件
3. **highlight_file_sections_tool**: 高亮文件區域
4. **save_file_tool**: 保存文件
5. **create_file_tool**: 創建新文件
6. **delete_file_tool**: 刪除文件

**數據文件工具**:
7. **read_data_file_tool**: 讀取數據文件
8. **edit_data_file_tool**: 編輯數據文件 (添加/刪除/修改行)

**數據分析工具**:
9. **get_data_info_tool**: 獲取數據基本信息
10. **group_by_analysis_tool**: 分組分析
11. **threshold_analysis_tool**: 閾值分析
12. **correlation_analysis_tool**: 相關性分析
13. **linear_prediction_tool**: 線性預測

💡 **執行策略 - Session 記憶管理**：
- **優先使用 Session 記憶**: 始終基於當前 Summary (Session 記憶) 回答問題
- **摘要請求**: 直接使用 Summary 中的最新信息，無需調用工具
- **數據分析**: 基於 Summary 進行分析，必要時使用分析工具
- **文件編輯**:
  1. 執行編輯操作
  2. **立即更新 Summary** (這是關鍵！)
  3. 確保 Session 記憶保持最新狀態
- **Session 持續性**: 同一 session 內的所有操作都基於累積的記憶

⚠️ **Session 記憶系統重要規則**:
1. **永遠基於 Summary 回答** - 這是你對文件的完整記憶
2. **任何文件修改都必須更新 Summary** - 保持記憶同步
3. **Summary 是持續累積的** - 包含所有歷史修改信息
4. **每次操作後檢查 Summary 是否需要更新** - 確保記憶準確性

📊 **會話數據管理**:
- 當使用 filter_data_tool 時，設置 save_filtered_data=True 來保存過濾後的數據
- 後續分析工具可以使用 "@current" 作為 file_path 來自動使用最新的過濾數據
- 使用 get_session_data_status_tool() 查看當前會話的數據狀態

🔢 **分析操作選擇指南**:
- group_by_analysis_tool 支持多種操作類型，根據分析需求選擇：
  * "mean" - 平均值（薪資分析、績效評估等）
  * "sum" - 總和（銷售額、數量統計等）
  * "count" - 計數（人員統計、頻次分析等）
  * "max" - 最大值（最高薪資、峰值分析等）
  * "min" - 最小值（最低薪資、基準分析等）
- 例如：group_by_analysis_tool("@current", "department", "salary", "mean", session_id)

"""
        else:
            # 瀏覽器模式的系統提示
            base_instructions = """
🌐 **瀏覽器操作指南**:
你已連接到前端 Puppeteer 瀏覽器，可以執行以下操作：

1. **讀取網頁內容**: 使用 `read_page_content_tool()` 獲取當前頁面的文字內容和所有連結
2. **獲取可點擊元素**: 使用 `get_clickable_elements_tool()` 找到頁面上所有可點擊的元素
3. **點擊連結**: 使用 `click_link_tool("連結文字")` 點擊特定連結
4. **導航到URL**: 使用 `navigate_to_url_tool("https://...")` 直接導航到指定網址
5. **其他瀏覽器操作**: 點擊、輸入、滾動等

⚠️ **重要**: 在分析任何網頁內容之前，必須先使用 `read_page_content_tool()` 讀取當前頁面內容！

"""

        # 添加上下文資料
        context_info = ""
        if not is_file_mode and context and "page_data" in context:
            page_data = context["page_data"]
            if page_data:
                context_info = f"""
📄 **當前頁面資訊**:
- URL: {page_data.get('url', 'N/A')}
- 標題: {page_data.get('title', 'N/A')}
- 內容預覽: {page_data.get('content', '')[:500]}...
- 互動元素數量: {len(page_data.get('interactiveElements', []))}
- 載入狀態: {page_data.get('metadata', {}).get('loadState', 'unknown')}

"""

        if rule_id:
            # 嘗試載入規則的提示
            rule_data = self._load_rule(rule_id)
            if rule_data and rule_data.get("prompt"):
                logger.info(f"📋 使用規則提示: {rule_data.get('name', rule_id)}")

                # 動態替換 prompt 中的占位符
                rule_prompt = rule_data["prompt"]

                # 從 context 中獲取 file_path
                file_path = "未提供"
                if context and isinstance(context, dict):
                    context_data = context.get('context_data', {})
                    if isinstance(context_data, dict):
                        file_path = context_data.get('file_path', '未提供')

                # 獲取當前台灣時間
                from datetime import datetime
                import pytz
                taiwan_tz = pytz.timezone('Asia/Taipei')
                current_time = datetime.now(taiwan_tz).strftime('%Y-%m-%d %H:%M:%S (台灣時間)')

                # 替換占位符
                rule_prompt = rule_prompt.replace('{file_path}', str(file_path))
                rule_prompt = rule_prompt.replace('{current_time}', current_time)

                logger.info(f"📋 已替換占位符: file_path={file_path}, current_time={current_time}")

                return base_instructions + context_info + "\n" + rule_prompt

        # 預設系統提示
        return base_instructions + context_info + """你是一個智能的任務執行助手，具備以下能力：

🎯 **核心職責**：
- 分析用戶需求，制定執行計劃
- 智能選擇和調用工具
- 根據工具執行結果決定下一步動作
- 提供準確、有用的最終回答

🔧 **可用工具**：
1. 📧 Gmail管理：gmail_summary_tool, mark_important_emails_tool, download_invoices_tool, compose_email_tool, financial_management_tool
2. 🌐 瀏覽器自動化：browser_navigate_tool, browser_click_tool, browser_type_tool, browser_scroll_tool, browser_screenshot_tool, browser_execute_script_tool
3. 📚 Taaze.ai測試：taaze_navigate_to_bestsellers_tool, taaze_click_first_book_tool, taaze_find_qa_section_tool, taaze_ask_question_tool, taaze_get_ai_response_tool, taaze_complete_workflow_tool
4. 🧪 測試工具：test_tool
5. 🧠 任務記憶管理：create_batch_task_tool, get_task_status_tool, save_temp_data_tool, load_temp_data_tool, list_session_tasks_tool, pause_task_tool, resume_task_tool, generate_task_report_tool
6. 🚀 智能批次處理：smart_batch_processor_tool, get_batch_processing_status_tool
7. 📊 繪圖可視化：create_line_chart_tool, create_bar_chart_tool, create_scatter_plot_tool, create_pie_chart_tool, list_session_plots_tool
8. 📁 文件操作：read_file_with_summary_tool, edit_file_by_lines_tool, save_file_tool, create_file_tool, delete_file_tool
9. 📈 數據分析：read_data_file_tool, get_data_info_tool, group_by_analysis_tool, threshold_analysis_tool, correlation_analysis_tool, linear_prediction_tool

💡 **執行策略**：
- 如果任務需要多個步驟，請逐步執行，每次調用必要的工具
- 根據工具執行結果評估是否需要調用更多工具
- 避免重複調用相同工具（除非參數不同）
- 當收集到足夠信息時，提供完整的最終回答

🔄 **大量數據處理策略**：
- 當遇到需要處理大量數據（>100項）時，優先使用 smart_batch_processor_tool
- 該工具會自動創建批次任務、循環處理、保存中間結果到 tmp 空間
- 所有 tool results 會自動累積，無需手動管理
- 使用 get_batch_processing_status_tool 查詢處理進度

📊 **可視化策略**：
- 數據分析完成後，使用繪圖工具創建相應的圖表
- 圖表會自動保存到會話目錄，用戶可以查看和下載

🎯 **決策原則**：
- 優先使用最相關的工具
- 如果一個工具失敗，考慮替代方案
- 保持任務執行的邏輯性和效率
- 始終以完成用戶目標為導向

請根據用戶需求智能地選擇工具並執行任務。"""

    def _parse_query(self, query: str, rule_id: Optional[str] = None) -> tuple[str, Optional[Dict[str, Any]]]:
        """解析查詢，提取規則信息"""
        # 如果直接提供了rule_id，載入規則
        if rule_id:
            rule_data = self._load_rule(rule_id)
            return query, rule_data

        # 檢查查詢是否以 /rule_name 格式開始
        if query.startswith("/"):
            parts = query.split(" ", 1)
            if len(parts) >= 1:
                rule_name = parts[0][1:]  # 移除 /
                user_input = parts[1] if len(parts) > 1 else ""

                # 根據 rule_name 查找規則
                rule_data = self._find_rule_by_name(rule_name)

                if rule_data:
                    logger.info(f"🎯 找到規則: {rule_name} -> {rule_data['id']}")
                    return user_input, rule_data
                else:
                    logger.warning(f"⚠️ 未找到規則: {rule_name}")
                    return query, None

        # 沒有規則調用
        return query, None

    def _load_rule(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """載入規則"""
        try:
            from pathlib import Path
            import json

            rules_dir = Path(self.rules_dir)
            logger.info(f"🔍 嘗試載入規則: {rule_id}")
            logger.info(f"🔍 規則目錄: {rules_dir}")

            # 嘗試多種文件名格式
            possible_files = [
                rules_dir / f"{rule_id}.json",           # hr_analysis.json
                rules_dir / f"{rule_id.replace('_', '-')}.json",  # hr-analysis.json
                rules_dir / f"{rule_id}-rule.json",      # hr_analysis-rule.json
            ]

            logger.info(f"🔍 嘗試的文件名: {[f.name for f in possible_files]}")

            # 嘗試直接文件名匹配
            for rule_file in possible_files:
                logger.info(f"🔍 檢查文件: {rule_file}")
                logger.info(f"🔍 文件是否存在: {rule_file.exists()}")
                if rule_file.exists():
                    logger.info(f"✅ 找到規則文件: {rule_file.name}")
                    with open(rule_file, 'r', encoding='utf-8') as f:
                        rule_data = json.load(f)
                        logger.info(f"✅ 規則載入成功: {rule_data.get('name', 'unknown')}")
                        return rule_data

            # 如果直接匹配失敗，遍歷所有文件查找 name 匹配
            logger.info(f"🔍 直接匹配失敗，遍歷所有文件查找 name 匹配...")
            all_files = list(rules_dir.glob("*.json"))
            logger.info(f"🔍 找到的所有 JSON 文件: {[f.name for f in all_files]}")

            for rule_file in all_files:
                try:
                    logger.info(f"🔍 檢查文件: {rule_file.name}")
                    with open(rule_file, 'r', encoding='utf-8') as f:
                        rule_data = json.load(f)
                        file_name = rule_data.get("name", "unknown")
                        logger.info(f"🔍 文件 {rule_file.name} 的 name: '{file_name}', 尋找: '{rule_id}'")
                        if file_name == rule_id:
                            logger.info(f"✅ 通過 name 找到規則文件: {rule_file.name}")
                            return rule_data
                except Exception as e:
                    logger.warning(f"⚠️ 讀取文件失敗 {rule_file.name}: {e}")
                    continue

            logger.warning(f"⚠️ 未找到規則文件: {rule_id}")
            return None
        except Exception as e:
            logger.error(f"❌ 載入規則失敗 {rule_id}: {e}")
            return None

    def _find_rule_by_name(self, rule_name: str) -> Optional[Dict[str, Any]]:
        """根據名稱查找規則"""
        try:
            from pathlib import Path
            import json

            rules_dir = Path(self.rules_dir)
            for rule_file in rules_dir.glob("*.json"):
                try:
                    with open(rule_file, 'r', encoding='utf-8') as f:
                        rule_data = json.load(f)
                        if rule_data.get("name", "").replace(" ", "_").lower() == rule_name.lower():
                            return rule_data
                except:
                    continue
            return None
        except Exception as e:
            logger.error(f"❌ 查找規則失敗 {rule_name}: {e}")
            return None

    async def response_generator_node(self, state: SupervisorAgentState) -> Dict[str, Any]:
        """回答生成節點"""
        messages = state.get("messages", [])
        query = state.get("query", "")

        logger.info("🤖 生成最終回答...")

        # 檢查是否有工具調用結果
        has_tool_results = any(isinstance(msg, ToolMessage) for msg in messages)

        if has_tool_results:
            # 有工具調用結果，生成基於結果的回答
            system_prompt = """你是一個專業的助手，請根據工具執行結果為用戶生成簡潔明瞭的回答。

要求：
1. 回答要具體且有用
2. 如果有數據，請提供具體數字
3. 如果有錯誤，請說明原因並提供解決建議
4. 保持專業且友好的語調
5. 用繁體中文回答"""

            response_messages = [SystemMessage(content=system_prompt)]
            response_messages.extend(messages)

            final_instruction = f"""用戶問題：{query}

請根據上述工具執行結果生成最終回答。"""

            response_messages.append(HumanMessage(content=final_instruction))
            final_response = await self.llm.ainvoke(response_messages)

            response_content = (
                final_response.content
                if hasattr(final_response, "content")
                else "抱歉，我無法處理這個請求。"
            )
        else:
            # 沒有工具調用，使用直接回應
            last_message = messages[-1] if messages else None
            if last_message and hasattr(last_message, "content"):
                response_content = last_message.content
            else:
                response_content = "抱歉，我無法處理這個請求。"

        logger.info(f"✅ 最終回答生成完成: {response_content[:100]}...")

        return {
            "messages": [AIMessage(content=response_content)]
        }

    async def run(self, query: str, rule_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None, available_tools: List = None) -> Dict[str, Any]:
        """執行查詢並返回回應"""
        logger.info(f"🚀 開始處理查詢: {query}")
        logger.info(f"🔍 詳細參數:")
        logger.info(f"  - query: {query}")
        logger.info(f"  - rule_id: {rule_id}")
        logger.info(f"  - context: {context}")

        # 根據 rule_id 載入規則
        rule_data = None
        if rule_id:
            rule_data = self._load_rule(rule_id)
            logger.info(f"📋 載入規則: {rule_id}")
            logger.info(f"📋 規則內容: {rule_data}")

        # 根據規則設置工具
        if rule_data:
            tool_names = rule_data.get("tools", [])
            logger.info(f"🔧 規則中的工具: {tool_names}")
            self.setup_tools_for_query(tool_names, available_tools)
            logger.info(f"📋 使用規則: {rule_data.get('name', rule_id)}，規則工具: {tool_names}")
        else:
            # 沒有規則，使用外部提供的工具或默認工具
            self.setup_tools_for_query([], available_tools)
            if available_tools:
                logger.info("📁 使用外部提供的 Local File Use Tools")
            else:
                logger.info("💬 使用預設模式（瀏覽器工具）")

        # 使用原始查詢作為處理內容
        parsed_query = query

        initial_state = {
            "messages": [],
            "query": parsed_query,
            "rule_id": rule_id,
            "context": context or {},
        }

        config = {
            "configurable": {"thread_id": str(uuid.uuid4())},
            "recursion_limit": 50  # 增加遞歸限制到 50
        }

        # 執行 graph
        start_time = time.time()
        result = await self.current_graph.ainvoke(initial_state, config=config)
        execution_time = time.time() - start_time

        logger.info(f"⏱️ 查詢執行完成，耗時 {execution_time:.2f}秒")

        # 提取最終回應
        final_message = result["messages"][-1]

        if isinstance(final_message, AIMessage):
            response_content = final_message.content
        else:
            response_content = "抱歉，無法處理您的請求"

        # 提取使用的工具
        tools_used = []
        for msg in result["messages"]:
            if isinstance(msg, ToolMessage):
                tools_used.append(msg.name)

        return {
            "response": response_content,
            "rule_id": rule_id,
            "tools_used": tools_used,
            "execution_time": execution_time,
            "context": context or {}
        }

    # 具體的業務方法
    async def gmail_summary(self, days: int = 7, keywords: List[str] = None) -> Dict[str, Any]:
        """Gmail 郵件摘要"""
        query = f"幫我總結最近 {days} 天的未讀郵件"
        if keywords:
            query += f"，特別關注包含 {', '.join(keywords)} 的郵件"

        return await self.run(query, context={"days": days, "keywords": keywords})

    async def mark_important_emails(self, days: int = 7) -> Dict[str, Any]:
        """標記重要郵件"""
        query = f"幫我檢查最近 {days} 天的郵件，並標記重要的郵件"
        return await self.run(query, context={"days": days})

    async def download_invoices(self, sender: str = "google colab") -> Dict[str, Any]:
        """下載發票"""
        query = f"幫我下載所有來自 {sender} 的發票"
        return await self.run(query, context={"sender": sender})

    async def browser_automation(self, action: str, **kwargs) -> Dict[str, Any]:
        """瀏覽器自動化"""
        query = f"執行瀏覽器操作: {action}"
        return await self.run(query, context={"action": action, **kwargs})

    async def taaze_test(self, question: str = "什麼是機器學習？") -> Dict[str, Any]:
        """Taaze.ai 測試"""
        query = f"在 Taaze.ai 上測試問答功能，問題: {question}"
        return await self.run(query, context={"question": question})

    async def get_status(self) -> Dict[str, Any]:
        """獲取 Agent 狀態"""
        return {
            "status": "running",
            "tools_count": len(self.tools),
            "uptime": time.time()
        }
