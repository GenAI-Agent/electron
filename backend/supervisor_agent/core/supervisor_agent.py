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
from dotenv import load_dotenv

# from langchain.callbacks.tracers import LangChainTracer
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
load_dotenv()
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

    async def _execute_single_tool_with_message(
        self, tool, tool_args, tool_call_id, tool_name
    ):
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
                await self.stream_callback(
                    {
                        "type": "tool_result",
                        "tool_name": tool_name,
                        "parameters": tool_args,
                        "result": result_str,
                        "execution_time": execution_time,
                        "wrapped_result": wrapped_result,
                    }
                )

            # 創建 ToolMessage
            return ToolMessage(
                content=wrapped_result, tool_call_id=tool_call_id, name=tool_name
            )

        except Exception as e:
            logger.error(f"❌ 工具 {tool_name} 執行失敗: {e}")
            error_result = f"<tool name='{tool_name}' status='error'>\n工具執行失敗: {str(e)}\n</tool>"
            return ToolMessage(
                content=error_result, tool_call_id=tool_call_id, name=tool_name
            )

    async def __call__(self, state: SupervisorAgentState) -> Dict[str, Any]:
        """平行執行所有工具調用"""
        messages = state.get("messages", [])

        # 找到最後一個 AI 消息中的工具調用
        tool_calls = []
        for message in reversed(messages):
            if (
                isinstance(message, AIMessage)
                and hasattr(message, "tool_calls")
                and message.tool_calls
            ):
                tool_calls = message.tool_calls
                # 調試日誌：檢查原始 tool_calls
                logger.info(f"🔍 找到 AI 消息的 tool_calls: {tool_calls}")
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

            # 調試日誌：檢查 tool_call_id
            logger.info(
                f"🔍 工具調用詳情: name={tool_name}, id={tool_call_id}, args={tool_args}"
            )

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
        # self.tracer = LangChainTracer(project_name="BI-supervisor-agent")
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
            if hasattr(msg, "content"):
                total_tokens += self.calculate_tokens(str(msg.content))
            else:
                total_tokens += self.calculate_tokens(str(msg))
        return total_tokens

    def manage_context_for_batch_processing(
        self, messages: List, context: Dict[str, Any]
    ) -> List:
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
                if any(
                    keyword in content.lower()
                    for keyword in ["進度", "progress", "完成", "任務", "task"]
                ):
                    # 保留進度信息
                    important_messages.append(msg)
                else:
                    # 簡化工具結果
                    simplified_content = (
                        f"工具 {msg.name} 執行完成 (第{tool_call_count}次調用)"
                    )
                    simplified_msg = ToolMessage(
                        content=simplified_content,
                        tool_call_id=msg.tool_call_id,
                        name=msg.name,
                    )
                    important_messages.append(simplified_msg)

        # 記錄token節省情況
        original_tokens = self.calculate_messages_tokens(messages)
        managed_tokens = self.calculate_messages_tokens(important_messages)
        logger.info(
            f"🧠 Batch模式Token管理: {original_tokens} → {managed_tokens} (節省 {original_tokens - managed_tokens})"
        )

        return important_messages

    def compress_tool_messages(self, messages: List, max_tool_results: int = 3) -> List:
        """
        改進的工具消息壓縮方法
        - 保留完整的 SystemMessage 和 HumanMessage
        - 保留最新一個 tool result 的完整內容
        - 壓縮中間的 tool results 成結構化摘要
        - 重要信息（如文件路徑）完整保留

        Args:
            messages: 消息列表
            max_tool_results: 最大保留的工具結果數量

        Returns:
            壓縮後的消息列表
        """
        # 追蹤壓縮次數
        if not hasattr(self, "_compression_count"):
            self._compression_count = 0
        self._compression_count += 1

        # 分類消息
        system_messages = []
        human_messages = []
        ai_messages = []
        tool_messages = []

        for msg in messages:
            if isinstance(msg, SystemMessage):
                system_messages.append(msg)
            elif isinstance(msg, HumanMessage):
                human_messages.append(msg)
            elif isinstance(msg, AIMessage):
                ai_messages.append(msg)
            elif isinstance(msg, ToolMessage):
                tool_messages.append(msg)

        # 如果沒有工具消息，直接返回原消息
        if not tool_messages:
            return messages

        # 構建壓縮後的消息列表
        compressed_messages = []

        # 1. 保留完整的系統消息和用戶消息
        compressed_messages.extend(system_messages)
        compressed_messages.extend(human_messages)

        # 2. 保留最近的 AI 消息
        if ai_messages:
            # 保留最後一個 AI 消息
            compressed_messages.append(ai_messages[-1])

        # 3. 處理工具消息
        if len(tool_messages) <= max_tool_results:
            # 如果工具消息數量不多，直接保留
            compressed_messages.extend(tool_messages)
        else:
            # 需要壓縮：保留最新一個完整，壓縮其他
            latest_tool = tool_messages[-1]  # 最新的工具結果
            middle_tools = tool_messages[:-1]  # 中間的工具結果

            # 創建壓縮摘要
            compression_summary = self._create_compression_summary(middle_tools)

            # 將壓縮摘要作為 SystemMessage 插入（避免 tool_call_id 驗證問題）
            compression_system_msg = SystemMessage(
                content=f"📋 記憶壓縮摘要:\n{compression_summary}"
            )

            # 添加壓縮摘要和最新工具結果
            compressed_messages.append(compression_system_msg)
            compressed_messages.append(latest_tool)

        return compressed_messages

    def _create_compression_summary(self, tool_messages: List) -> str:
        """
        創建工具消息的壓縮摘要

        Args:
            tool_messages: 要壓縮的工具消息列表

        Returns:
            結構化的壓縮摘要字符串
        """
        import json
        from datetime import datetime

        summary_parts = [
            f"🧠 第 {self._compression_count} 次記憶壓縮",
            f"📊 壓縮時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"📋 原始工具消息數: {len(tool_messages)}",
            "",
            "📝 工具執行摘要:",
        ]

        for i, tool_msg in enumerate(tool_messages, 1):
            tool_name = tool_msg.name
            content = str(tool_msg.content)

            # 提取重要內容
            important_info = self._extract_important_content(content, tool_name)

            summary_parts.extend(
                [
                    f"",
                    f"第{i}個 tool: {tool_name}",
                    f"tool裡面的重要內容:",
                    important_info,
                    "---",
                ]
            )

        summary_parts.extend(
            [
                "",
                "💡 注意: 以上為壓縮摘要，最新的工具結果保持完整。",
                "🔄 如需詳細信息，請參考最新的工具執行結果。",
            ]
        )

        return "\n".join(summary_parts)

    def _extract_important_content(self, content: str, tool_name: str) -> str:
        """
        從工具結果中提取重要內容

        Args:
            content: 工具結果內容
            tool_name: 工具名稱

        Returns:
            提取的重要內容
        """
        try:
            import json

            # 嘗試解析 JSON 內容
            if content.startswith("<tool") and content.endswith("</tool>"):
                # 提取 XML 標籤內的內容
                start = content.find(">") + 1
                end = content.rfind("<")
                json_content = content[start:end].strip()
            else:
                json_content = content

            parsed = json.loads(json_content)

            if isinstance(parsed, dict):
                important_info = []

                # 基本狀態信息
                if "success" in parsed:
                    status = "✅ 成功" if parsed["success"] else "❌ 失敗"
                    important_info.append(f"執行狀態: {status}")

                # 錯誤信息
                if "error" in parsed and parsed["error"]:
                    important_info.append(f"錯誤信息: {parsed['error']}")

                # 文件路徑信息（完整保留）
                file_path_keys = [
                    "file_path",
                    "temp_file_path",
                    "current_file",
                    "output_file",
                ]
                for key in file_path_keys:
                    if key in parsed and parsed[key]:
                        important_info.append(f"{key}: {parsed[key]}")

                # 數據統計信息
                stats_keys = [
                    "total_rows",
                    "filtered_rows",
                    "original_rows",
                    "processed_items",
                    "success_count",
                    "error_count",
                ]
                for key in stats_keys:
                    if key in parsed and parsed[key] is not None:
                        important_info.append(f"{key}: {parsed[key]}")

                # 操作信息
                operation_keys = ["operation", "analysis_type", "tool_type", "message"]
                for key in operation_keys:
                    if key in parsed and parsed[key]:
                        value = str(parsed[key])
                        if len(value) > 100:
                            value = value[:100] + "..."
                        important_info.append(f"{key}: {value}")

                # 結果摘要
                if "results" in parsed and isinstance(parsed["results"], dict):
                    results_summary = []
                    for k, v in parsed["results"].items():
                        if isinstance(v, (int, float, str)) and len(str(v)) < 50:
                            results_summary.append(f"{k}: {v}")
                        elif isinstance(v, dict) and "value" in v:
                            results_summary.append(f"{k}: {v['value']}")

                    if results_summary:
                        important_info.append(
                            f"結果摘要: {', '.join(results_summary[:5])}"
                        )

                # 如果沒有提取到重要信息，使用消息內容
                if not important_info and "message" in parsed:
                    msg = str(parsed["message"])
                    important_info.append(
                        f"消息: {msg[:200]}{'...' if len(msg) > 200 else ''}"
                    )

                return (
                    "\n".join(f"  • {info}" for info in important_info)
                    if important_info
                    else "  • 無重要信息提取"
                )

        except (json.JSONDecodeError, Exception):
            # 如果不是 JSON 或解析失敗，提取前200字符
            clean_content = content.replace("\n", " ").strip()
            if len(clean_content) > 200:
                return f"  • 內容摘要: {clean_content[:200]}..."
            else:
                return f"  • 內容: {clean_content}"

        return "  • 無法提取內容"

    def setup_tools_for_query(
        self, tool_names: List[str] = None, available_tools: List = None
    ):
        """為當前查詢動態設置工具"""
        logger.info(f"🔧 開始動態設置工具，規則工具: {tool_names}")

        # 開始設置工具
        self.current_tools = []

        # 如果有外部提供的工具列表，優先使用
        if available_tools:
            self.current_tools = available_tools
            logger.info(f"📁 使用外部提供的工具，共 {len(available_tools)} 個")
            for tool in available_tools:
                tool_name = getattr(tool, "name", str(tool))
                logger.info(f"🔧 添加工具: {tool_name}")
        else:
            # 否則使用默認瀏覽器工具（向後兼容）
            try:
                from ..tools.langchain_browser_tools import get_langchain_browser_tools

                browser_tools = get_langchain_browser_tools()

                for tool in browser_tools:
                    self.current_tools.append(tool)

            except Exception as e:
                logger.warning(f"⚠️ 瀏覽器工具導入失敗: {e}")

        # 根據規則添加額外工具（如果需要）
        if tool_names:
            logger.info(f"📋 規則指定的工具: {tool_names}")
            # TODO: 這裡可以根據 tool_names 添加額外的工具

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
        workflow.add_node(
            "response_generator", self.response_generator_node
        )  # 最終回答生成節點

        # 設定流程 - 從supervisor節點開始
        workflow.add_edge(START, "supervisor")

        # supervisor節點後的條件分支
        workflow.add_conditional_edges(
            "supervisor",
            self.should_continue,  # 自定義條件函數
            {
                "tools": "tools",  # 需要調用工具
                "respond": "response_generator",  # 直接回答
                "__end__": END,  # 結束
            },
        )

        # 工具執行後回到supervisor節點重新評估
        workflow.add_edge("tools", "supervisor")

        # 回答生成後結束
        workflow.add_edge("response_generator", END)

        # 編譯 graph with 短期記憶
        self.current_graph = workflow.compile(checkpointer=MemorySaver())

        logger.info(
            f"✅ Supervisor Agent Graph 建立完成，工具數量: {len(self.current_tools)}"
        )

    def should_continue(self, state: SupervisorAgentState) -> str:
        """決定下一步動作的條件函數"""
        messages = state.get("messages", [])
        context = state.get("context", {})

        if not messages:
            return "respond"

        last_message = messages[-1]

        # 如果最後一個消息是AI消息且有工具調用，執行工具
        if (
            isinstance(last_message, AIMessage)
            and hasattr(last_message, "tool_calls")
            and last_message.tool_calls
        ):
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

        # 智能記憶管理 - 暫時禁用以調試 tool_call_id 問題
        if current_tokens > 20000:  # 提高閾值，暫時減少壓縮
            logger.info(f"🧠 Token數量過多 ({current_tokens})，開始記憶壓縮")
            # messages = self.compress_tool_messages(messages, max_tool_results=3)  # 暫時禁用
            # compressed_tokens = self.calculate_messages_tokens(messages)
            logger.info(f"🧠 記憶壓縮已暫時禁用以調試 tool_call_id 問題")
            # logger.info(
            #     f"🧠 記憶壓縮完成: {current_tokens} → {compressed_tokens} (節省 {current_tokens - compressed_tokens})"
            # )
            state["messages"] = messages

            # 壓縮後，將會話狀態信息注入到上下文中，確保不丟失重要信息
            try:
                from ..core.session_data_manager import session_data_manager

                session_summary = session_data_manager.get_session_summary(
                    context.get("session_id", "default")
                )
                if session_summary.get("has_current_data"):
                    context["session_data_info"] = {
                        "current_data_file": session_summary.get("current_data_file"),
                        "operations_count": session_summary.get("operations_count"),
                        "last_operation": session_summary.get("last_operation"),
                        "note": "記憶壓縮後保留的會話數據狀態信息",
                    }
                    logger.info(
                        f"🔄 會話狀態信息已注入上下文: {session_summary.get('current_data_file')}"
                    )
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
        is_initial_query = not any(
            isinstance(msg, (AIMessage, ToolMessage)) for msg in messages
        )

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
            recent_tool_messages = [
                msg for msg in messages[-5:] if isinstance(msg, ToolMessage)
            ]

            # 檢查是否已經執行了太多工具（防止無限循環）
            tool_count = len([msg for msg in messages if isinstance(msg, ToolMessage)])
            if tool_count >= 12:
                logger.info(f"🛑 已執行 {tool_count} 個工具，停止並生成回答")
                # 直接生成回答，不再調用工具
                final_prompt = f"""基於已執行的工具結果，請直接回答用戶的問題：

                    用戶請求: {query}

                    已執行的工具結果:
                    {chr(10).join([f"- {msg.name}: {msg.content[:300]}..." for msg in recent_tool_messages])}

                    請基於這些信息提供完整的回答，不要再調用任何工具。
                """

                llm_messages = [
                    SystemMessage(
                        content="你是一個智能助手。請基於提供的信息直接回答用戶問題，不要調用任何工具。"
                    ),
                    HumanMessage(content=final_prompt),
                ]
            elif recent_tool_messages:
                # 檢查是否獲得了有效的頁面內容
                page_content_found = False
                for msg in recent_tool_messages:
                    if (
                        msg.name == "browser_get_page_data_tool"
                        and len(msg.content) > 100
                    ):
                        page_content_found = True
                        break

                if page_content_found:
                    logger.info("✅ 已獲得有效的頁面內容，準備生成回答")
                    # 有了頁面內容，應該可以回答了
                    evaluation_prompt = f"""你已經成功獲取了頁面內容。請基於以下信息直接回答用戶的問題：

                        用戶請求: {query}

                        頁面內容:
                        {chr(10).join([f"- {msg.name}: {msg.content[:500]}..." for msg in recent_tool_messages if msg.name == "browser_get_page_data_tool"])}

                        請提供完整的回答，不需要再調用其他工具。
                    """
                else:
                    # 沒有獲得有效內容，可能需要重試
                    evaluation_prompt = f"""基於以下工具執行結果，請分析是否需要調用更多工具來完成用戶的請求：
                        用戶原始請求: {query}

                        最近的工具執行結果:
                        {chr(10).join([f"- {msg.name}: {msg.content[:200]}..." for msg in recent_tool_messages])}

                        請決定：
                        1. 如果需要更多工具來完成任務，請調用相應的工具
                        2. 如果已經有足夠的信息，請直接回答用戶

                        注意：避免重複調用相同的工具，除非有新的參數或需求。
                    """

                llm_messages = [
                    SystemMessage(content=self._get_system_prompt(rule_id, context)),
                    HumanMessage(content=evaluation_prompt),
                ]

                # 添加對話歷史，確保 tool_call_id 完整性
                # 找到最後一個完整的 AI -> Tool 對話組
                recent_messages = self._get_recent_complete_messages(
                    messages, max_messages=10
                )
                llm_messages.extend(recent_messages)
            else:
                # 沒有工具消息，直接使用現有消息
                llm_messages = [
                    SystemMessage(content=self._get_system_prompt(rule_id, context))
                ]
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

    def _get_recent_complete_messages(
        self, messages: List, max_messages: int = 10
    ) -> List:
        """
        獲取最近的完整消息組，確保 AI 消息和對應的 ToolMessage 都被包含

        Args:
            messages: 所有消息列表
            max_messages: 最大消息數量

        Returns:
            完整的消息列表
        """
        if len(messages) <= max_messages:
            return messages

        # 從後往前找，確保包含完整的 AI -> Tool 對話組
        result_messages = []
        i = len(messages) - 1

        while i >= 0 and len(result_messages) < max_messages:
            current_msg = messages[i]
            result_messages.insert(0, current_msg)

            # 如果是 ToolMessage，確保對應的 AI 消息也被包含
            if isinstance(current_msg, ToolMessage):
                # 向前查找對應的 AI 消息
                j = i - 1
                while j >= 0:
                    prev_msg = messages[j]
                    if (
                        isinstance(prev_msg, AIMessage)
                        and hasattr(prev_msg, "tool_calls")
                        and prev_msg.tool_calls
                    ):
                        # 檢查是否包含對應的 tool_call_id
                        tool_call_ids = [
                            call.get("id", "") for call in prev_msg.tool_calls
                        ]
                        if current_msg.tool_call_id in tool_call_ids:
                            # 確保這個 AI 消息也被包含
                            if prev_msg not in result_messages:
                                result_messages.insert(0, prev_msg)
                            break
                    j -= 1

            i -= 1

        return result_messages

    def _get_system_prompt(
        self, rule_id: Optional[str], context: Dict[str, Any]
    ) -> str:
        """獲取系統提示"""

        # 獲取當前台灣時間
        from datetime import datetime
        import pytz

        taiwan_tz = pytz.timezone("Asia/Taipei")
        current_time = datetime.now(taiwan_tz).strftime("%Y-%m-%d %H:%M:%S (台灣時間)")
        if rule_id:
            # 載入規則提示
            rule_data = self.find_rule_by_name(rule_id)
            if rule_data and rule_data.get("prompt"):
                logger.info(f"📋 使用規則提示: {rule_data.get('name', rule_id)}")

                rule_prompt = rule_data["prompt"]

                # 從 context 中獲取 file_path
                file_path = "未提供"
                if context and isinstance(context, dict):
                    context_data = context.get("context_data", {})
                    if isinstance(context_data, dict):
                        file_path = context_data.get("file_path", "未提供")

                # 替換占位符
                rule_prompt = rule_prompt.replace("{file_path}", str(file_path))
                rule_prompt = rule_prompt.replace("{current_time}", current_time)

                return rule_prompt

        # 預設提示
        return f"""你是一個智能數據分析助手。當前時間: {current_time}

🎯 **核心任務**：主動進行分析，而不只是提供建議

📊 **數據分析優先原則**：
當用戶提到統計、分析、計算、過濾等需求時，請立即執行實際的數據分析：

1. **過濾數據**：使用 filter_data_tool 過濾出符合條件的數據
   - 例如：過濾特定部門、日期範圍、金額範圍等
   - 設置 save_filtered_data=True 保存過濾結果

2. **分組分析**：使用 group_by_analysis_tool 進行統計計算
   - 支持操作：sum(總和)、mean(平均)、count(計數)、max(最大)、min(最小)
   - 例如：按部門分組計算支出總額

3. **組合分析**：使用 filter_and_analyze_tool 一步完成過濾和分析

🚀 **執行策略**：
- 看到"統計XX部門支出"→立即過濾該部門數據並計算總額
- 看到"分析XX趨勢"→過濾相關數據並進行分組分析
- 看到"計算平均值"→使用group_by_analysis_tool執行mean操作
- 不要只提供建議，要直接執行分析並給出具體結果

請根據用戶需求智能地選擇和使用工具來完成任務。"""

    def _build_context_query(
        self, query: str, context: Dict[str, Any], has_rule: bool = False
    ) -> str:
        """構建包含 context 信息的用戶查詢"""

        # 提取關鍵信息
        context_data = context.get("context_data", {})
        file_path = context_data.get("file_path", "未知文件")
        data_info = context_data.get("data_info", {})
        file_summary = context_data.get("file_summary", {})
        page_data = context_data.get("page", {})
        mails = context_data.get("mails", [])

        # 檢查是否為 Gmail 數據
        email_address = context_data.get("email_address", "")
        gmail_metadata = context_data.get("gmail_metadata", {})
        original_query = context_data.get("original_query", "")

        # 構建簡潔的數據摘要
        data_summary = ""

        # Gmail 數據摘要（優先使用 file_summary）
        if file_summary and file_summary.get("file_type") == "gmail_csv":
            total_emails = file_summary.get("total_emails", 0)
            unread_emails = file_summary.get("unread_emails", 0)
            top_senders = file_summary.get("top_senders", [])

            data_summary = f"""
                📧 Gmail 郵件數據已載入並準備分析:
                - 郵件帳戶: {email_address}
                - 郵件數量: {total_emails} 封
                - 未讀郵件: {unread_emails} 封
                - 數據文件: {file_path}
                - 主要發件人: {', '.join([f"{sender}({count}封)" for sender, count in top_senders[:3]])}
                - 原始查詢: {original_query}
                - 文件摘要: {file_summary.get('summary', '')}
            """
        # Gmail 數據摘要（回退到 gmail_metadata）
        elif email_address and gmail_metadata:
            total_emails = gmail_metadata.get("total_emails", 0)
            data_summary = f"""
                📧 Gmail 郵件數據已載入並準備分析:
                - 郵件帳戶: {email_address}
                - 郵件數量: {total_emails} 封
                - 數據文件: {file_path}
                - 原始查詢: {original_query}
                - 成功批次: {gmail_metadata.get('successful_batches', 0)}
                - 失敗批次: {gmail_metadata.get('failed_batches', 0)}
            """
        # 一般數據文件摘要（優先使用 file_summary）
        elif file_summary:
            total_rows = file_summary.get(
                "total_emails", file_summary.get("total_rows", 0)
            )
            columns = file_summary.get("columns", [])
            summary_text = file_summary.get("summary", "")

            data_summary = f"""
                📊 數據文件已載入並準備分析:
                - 文件路徑: {file_path}
                - 數據摘要: {summary_text}
                - 數據量: {total_rows} 行
                - 欄位: {', '.join(columns[:10])}{'...' if len(columns) > 10 else ''}
            """
        # 一般數據文件摘要（回退到 data_info）
        elif data_info:
            total_rows = data_info.get("total_rows", 0)
            columns = data_info.get("columns", [])
            numeric_columns = data_info.get("numeric_columns", [])
            categorical_columns = data_info.get("categorical_columns", [])

            data_summary = f"""
                📊 數據文件已載入並準備分析:
                - 文件路徑: {file_path}
                - 數據行數: {total_rows} 行
                - 總欄位數: {len(columns)} 個
                - 數值欄位: {', '.join(numeric_columns[:10])}{'...' if len(numeric_columns) > 10 else ''}
                - 分類欄位: {', '.join(categorical_columns[:10])}{'...' if len(categorical_columns) > 10 else ''}
            """

        if has_rule:
            instruction = f"""
                {data_summary}
                此為我的頁面資料 {context_data}
                請根據我的需求，以及你的規則（System Prompt），幫助我解決問題
                我的需求: "{query}"，如果是空字串，請根據你的規則（System Prompt），幫助我解決問題
            """

        elif mails:
            instruction = f"""
                郵件已準備完成，請根據你的專業規則和步驟直接開始進行完整的分析。
                請你詳細分析郵件的內容。

                郵件: {mails}

                用戶需求: "{query}"
            """

        else:
            instruction = f"""{data_summary}

🎯 **立即執行數據分析**：
根據用戶需求，請直接使用以下工具進行實際分析：

1. 如果需要過濾數據：使用 filter_data_tool
2. 如果需要統計計算：使用 group_by_analysis_tool
3. 如果需要組合操作：使用 filter_and_analyze_tool

⚠️ **重要**：不要只提供建議或說明，請立即執行實際的數據分析並提供具體結果。

用戶需求: "{query}"

請立即開始分析並執行相應的工具。"""

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
                    with open(rule_file, "r", encoding="utf-8") as f:
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

    async def response_generator_node(
        self, state: SupervisorAgentState
    ) -> Dict[str, Any]:
        """回答生成節點"""
        messages = state.get("messages", [])
        query = state.get("query", "")
        rule_id = state.get("rule_id")

        logger.info("🤖 生成最終回答...")

        # 檢查是否有工具調用結果
        has_tool_results = any(isinstance(msg, ToolMessage) for msg in messages)

        if has_tool_results:
            # 有工具調用結果，生成基於結果的回答
            # 首先嘗試獲取 rule 中的 prompt 作為系統提示
            rule_prompt = None
            if rule_id:
                rule_data = self.find_rule_by_name(rule_id)
                if rule_data and rule_data.get("prompt"):
                    rule_prompt = rule_data["prompt"]
                    logger.info(f"📋 使用規則 {rule_id} 的 prompt 作為回答生成指導")

            if rule_prompt:
                # 使用 rule 中的 prompt，並添加基本的回答生成指導
                system_prompt = f"""{rule_prompt}

=== 回答生成指導 ===
請根據上述規則和工具執行結果為用戶生成回答。

基本要求：
1. 回答要具體且有用
2. 如果有數據，請提供具體數字
3. 如果有錯誤，請說明原因並提供解決建議
4. 保持專業且友好的語調
5. 嚴格遵循上述規則中的 output_format 要求

請根據工具執行結果和上述規則要求生成最終回答。"""
            else:
                # 沒有 rule prompt，使用預設的系統提示
                system_prompt = """你是一個專業的助手，請根據工具執行結果為用戶生成簡潔明瞭的回答。

要求：
1. 回答要具體且有用
2. 如果有數據，請提供具體數字
3. 如果有錯誤，請說明原因並提供解決建議
4. 保持專業且友好的語調
5. 用繁體中文回答

📊 **特別注意 - 數據分析回答格式**：
當回答涉及數據分析結果時，請按以下格式提供豐富的內容：

## 📈 分析結果

### 🎯 核心發現
[直接回答用戶問題的主要數字和結論]

### 📊 詳細數據
```
| 項目 | 數值 | 佔比 |
|------|------|------|
| ... | ... | ... |
```

### 💡 重點整理 範例
- 重點1：[具體發現]
- 重點2：[異常或特殊情況]
- 重點3：[其他延伸資訊，或是用戶可能想要知道的內容]

### 📋 補充說明 範例
- 數據來源：[說明數據範圍]
- 統計方法：[說明使用的分析方法]
- 相關建議：[基於數據的建議，或是用戶可能想要知道的內容]

不要只給一個單薄的數字或是文字回覆，要提供完整的分析報告。"""

            response_messages = [SystemMessage(content=system_prompt)]
            response_messages.extend(messages)

            final_instruction = f"""用戶問題：{query}

請根據上述工具執行結果生成最終回答。

⚠️ 如果涉及數據分析，請務必使用上述指定的格式：
- 包含核心發現、詳細數據表格、重點整理、補充說明
- 不要只給一個簡單的數字答案"""

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

        return {"messages": [AIMessage(content=response_content)]}

    async def run(
        self,
        query: str,
        rule_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        available_tools: List = None,
    ) -> Dict[str, Any]:
        """執行查詢並返回回應"""

        logger.info(f"🚀 開始處理查詢: {query}")
        logger.info(f"🔍 詳細參數:")
        logger.info(f"  - query: {query}")
        logger.info(f"  - rule_id: {rule_id}")

        # 限制 context 日誌輸出長度
        context_str = str(context)
        if len(context_str) > 300:
            context_str = context_str[:300] + "..."
        logger.info(f"  - context: {context_str}")

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
            logger.info(
                f"📋 使用規則: {rule_data.get('name', rule_id)}，規則工具: {tool_names}"
            )
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
            "recursion_limit": 50,  # 增加遞歸限制到 50
            # "callbacks": [self.tracer],  # 註解掉 LangSmith tracer
        }

        # 執行 graph
        start_time = time.time()
        # TODO: 這是為什麼 流式回覆接不到ToolMessage
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
            "context": context or {},
        }

    # 具體的業務方法
    async def gmail_summary(
        self, days: int = 7, keywords: List[str] = None
    ) -> Dict[str, Any]:
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
            "uptime": time.time(),
        }
