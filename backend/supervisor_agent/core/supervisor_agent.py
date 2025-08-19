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

            # 構建包含 context 的用戶查詢
            has_rule = rule_id is not None
            context_query = self._build_context_query(query, context, has_rule)

            # 構建消息
            llm_messages = [SystemMessage(content=system_prompt)]
            llm_messages.append(HumanMessage(content=context_query))

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

        # 獲取當前台灣時間
        from datetime import datetime
        import pytz
        taiwan_tz = pytz.timezone('Asia/Taipei')
        current_time = datetime.now(taiwan_tz).strftime('%Y-%m-%d %H:%M:%S (台灣時間)')

        if rule_id:
            # 載入規則提示
            rule_data = self.find_rule_by_name(rule_id)
            if rule_data and rule_data.get("prompt"):
                logger.info(f"📋 使用規則提示: {rule_data.get('name', rule_id)}")

                rule_prompt = rule_data["prompt"]

                # 從 context 中獲取 file_path
                file_path = "未提供"
                if context and isinstance(context, dict):
                    context_data = context.get('context_data', {})
                    if isinstance(context_data, dict):
                        file_path = context_data.get('file_path', '未提供')

                # 替換占位符
                rule_prompt = rule_prompt.replace('{file_path}', str(file_path))
                rule_prompt = rule_prompt.replace('{current_time}', current_time)

                return rule_prompt

        # 預設提示
        return f"你是一個智能助手。當前時間: {current_time}\n請根據用戶需求智能地選擇和使用工具來完成任務。"

    def _build_context_query(self, query: str, context: Dict[str, Any], has_rule: bool = False) -> str:
        """構建包含 context 信息的用戶查詢"""

        # 提取關鍵信息
        context_data = context.get('context_data', {})
        file_path = context_data.get('file_path', '未知文件')
        data_info = context_data.get('data_info', {})

        # 構建簡潔的數據摘要
        data_summary = ""
        if data_info:
            total_rows = data_info.get('total_rows', 0)
            columns = data_info.get('columns', [])
            numeric_columns = data_info.get('numeric_columns', [])
            categorical_columns = data_info.get('categorical_columns', [])

            data_summary = f"""
📊 數據文件已載入並準備分析:
- 文件路徑: {file_path}
- 數據行數: {total_rows} 行
- 總欄位數: {len(columns)} 個
- 數值欄位: {', '.join(numeric_columns[:10])}{'...' if len(numeric_columns) > 10 else ''}
- 分類欄位: {', '.join(categorical_columns[:10])}{'...' if len(categorical_columns) > 10 else ''}
"""

        if has_rule:
            instruction = f"""{data_summary}

✅ 數據已準備完成，請根據你的專業規則和步驟直接開始進行完整的分析。

用戶需求: "{query}"

請立即開始分析，不需要再詢問用戶需求。"""
        else:
            instruction = f"""{data_summary}

請參考上面的數據架構，使用專業工具進行分析。

用戶需求: "{query}" """

        return instruction

    def find_rule_by_name(self, rule_name: str) -> Optional[Dict[str, Any]]:
        """根據 rule name 查找規則 - 簡單直接的方法"""
        try:
            from pathlib import Path
            import json

            rules_dir = Path(self.rules_dir)

            # 遍歷所有 JSON 文件
            for rule_file in rules_dir.glob("*.json"):
                try:
                    with open(rule_file, 'r', encoding='utf-8') as f:
                        rule_data = json.load(f)
                        # 直接比對 name 字段
                        if rule_data.get("name") == rule_name:
                            return rule_data
                except Exception as e:
                    logger.warning(f"⚠️ 讀取規則文件失敗 {rule_file.name}: {e}")
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
            rule_data = self.find_rule_by_name(rule_id)
            if not rule_data:
                logger.info(f"⚠️ 未找到規則: {rule_id}")

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