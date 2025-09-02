"""
Supervisor Agent - Gmail 自動化處理監督者
使用 LangGraph 架構，整合多個專業工具，提供 Gmail 自動化處理功能
參考 example/gov_agent.py 的架構實現
"""

from __future__ import annotations
import logging
import asyncio
import time
import uuid
import os
import sys
from typing import List, Optional, Dict, Any, Annotated, Literal
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain.callbacks.tracers import LangChainTracer
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt.tool_node import ToolNode as BaseToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import AzureChatOpenAI
import tiktoken

# 工具將在查詢時動態導入

from ..utils.logger import get_logger
from .context_builder import build_context_query
from ..prompts import (
    DEFAULT_SYSTEM_PROMPT,
    DEFAULT_SYSTEM_PROMPT_RULE,
    RESPONSE_GENERATOR_WITH_RULE,
    RESPONSE_GENERATOR_DEFAULT,
    RESPONSE_FINAL_INSTRUCTION,
    EVALUATION_TOO_MANY_TOOLS,
    EVALUATION_WITH_PAGE_CONTENT,
    EVALUATION_NEED_MORE_TOOLS,
)

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
            print(f"\n🚀 ===== 開始執行工具 =====")
            print(f"🚀 工具名稱: {tool_name}")
            print(f"🚀 工具參數: {tool_args}")
            print(f"🚀 ========================")
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

            # 🔍 詳細日誌：顯示完整的工具執行結果
            print(f"\n🔧 ===== 工具執行詳情 =====")
            print(f"🔧 工具名稱: {tool_name}")
            print(f"🔧 執行時間: {execution_time:.2f}秒")
            print(f"🔧 參數: {tool_args}")
            print(f"🔧 完整結果:")
            print(f"{result_str}")
            print(f"🔧 ========================\n")

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
            print(f"\n❌ ===== 工具執行異常 =====")
            print(f"❌ 工具名稱: {tool_name}")
            print(f"❌ tool_call_id: {tool_call_id}")
            print(f"❌ 異常信息: {str(e)}")
            print(f"❌ 異常類型: {type(e).__name__}")
            import traceback

            print(f"❌ 完整堆疊: {traceback.format_exc()}")
            print(f"❌ ========================\n")

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

        print(f"🚀 Agent 準備執行 {len(tool_calls)} 個工具")
        logger.info(f"🚀 平行執行 {len(tool_calls)} 個工具")

        # 準備平行執行的任務
        tasks = []
        for tool_call in tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call.get("args", {})
            tool_call_id = tool_call.get("id", "")

            print(f"🔍 工具調用: {tool_name}")
            print(f"   - ID: {tool_call_id}")
            print(f"   - 參數: {tool_args}")

            # 調試日誌：檢查 tool_call_id
            logger.info(
                f"🔍 工具調用詳情: name={tool_name}, id={tool_call_id}, args={tool_args}"
            )

            # 🔍 額外檢查 tool_call_id 是否有效
            if not tool_call_id:
                logger.error(f"❌ 工具 {tool_name} 的 tool_call_id 為空！")
                print(f"❌ 工具 {tool_name} 的 tool_call_id 為空！")
                continue

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
            print(f"🚀 開始平行執行 {len(tasks)} 個工具任務...")
            tool_messages = await asyncio.gather(*tasks, return_exceptions=True)

            # 處理結果
            valid_messages = []
            for i, msg in enumerate(tool_messages):
                if isinstance(msg, ToolMessage):
                    valid_messages.append(msg)
                    print(f"✅ 工具 {i} 執行成功，tool_call_id: {msg.tool_call_id}")
                elif isinstance(msg, Exception):
                    logger.error(f"❌ 工具執行異常 {i}: {msg}")
                    print(f"❌ 工具執行異常 {i}: {msg}")
                    import traceback

                    print(f"❌ 異常堆疊: {traceback.format_exc()}")

            # 🔍 檢查所有 tool_call_id 是否正確
            for msg in valid_messages:
                if not hasattr(msg, "tool_call_id") or not msg.tool_call_id:
                    logger.error(f"❌ ToolMessage 缺少 tool_call_id: {msg}")
                    print(f"❌ ToolMessage 缺少 tool_call_id: {msg}")

            logger.info(f"✅ 平行工具執行完成，成功 {len(valid_messages)} 個")
            print(f"✅ 平行工具執行完成，成功 {len(valid_messages)} 個")
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
        self.tracer = LangChainTracer(project_name="BI-supervisor-agent")
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
                tool_results = chr(10).join(
                    [
                        f"- {msg.name}: {msg.content[:300]}..."
                        for msg in recent_tool_messages
                    ]
                )
                final_prompt = EVALUATION_TOO_MANY_TOOLS.format(
                    query=query, tool_results=tool_results
                )

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
                    page_content = chr(10).join(
                        [
                            f"- {msg.name}: {msg.content[:500]}..."
                            for msg in recent_tool_messages
                            if msg.name == "browser_get_page_data_tool"
                        ]
                    )
                    evaluation_prompt = EVALUATION_WITH_PAGE_CONTENT.format(
                        query=query, page_content=page_content
                    )
                else:
                    # 沒有獲得有效內容，可能需要重試
                    recent_tools = chr(10).join(
                        [
                            f"- {msg.name}: {msg.content[:200]}..."
                            for msg in recent_tool_messages
                        ]
                    )
                    evaluation_prompt = EVALUATION_NEED_MORE_TOOLS.format(
                        query=query, recent_tools=recent_tools
                    )

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

        # 決定要使用的規則數據 #TODO: 根據 type 去用預設規則
        rule_data_content = DEFAULT_SYSTEM_PROMPT_RULE  # 預設規則

        if rule_id:
            # 載入規則提示
            rule_data = self.find_rule_by_name(rule_id)
            if rule_data and rule_data.get("prompt"):
                logger.info(f"📋 使用規則提示: {rule_data.get('name', rule_id)}")
                rule_data_content = rule_data["prompt"]

                # 從 context 中獲取 file_path 並替換占位符
                if context and isinstance(context, dict):
                    context_data = context.get("context_data", {})
                    if isinstance(context_data, dict):
                        file_path = context_data.get("file_path", "未提供")
                        # 如果規則中有占位符，進行替換
                        rule_data_content = rule_data_content.replace(
                            "{file_path}", str(file_path)
                        )
                        rule_data_content = rule_data_content.replace(
                            "{current_time}", current_time
                        )

        # 使用 DEFAULT_SYSTEM_PROMPT 作為基礎模板，將規則數據填入
        return DEFAULT_SYSTEM_PROMPT.format(
            current_time=current_time, rule_data=rule_data_content
        )

    def _build_context_query(
        self, query: str, context: Dict[str, Any], has_rule: bool = False
    ) -> str:
        """構建包含 context 信息的用戶查詢"""
        # 使用 context_builder 中的函數
        return build_context_query(query, context, has_rule)

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
                system_prompt = RESPONSE_GENERATOR_WITH_RULE.format(
                    rule_prompt=rule_prompt
                )
            else:
                # 沒有 rule prompt，使用預設的系統提示
                system_prompt = RESPONSE_GENERATOR_DEFAULT

            response_messages = [SystemMessage(content=system_prompt)]
            response_messages.extend(messages)

            final_instruction = RESPONSE_FINAL_INSTRUCTION.format(query=query)

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

        print(f"🚀 SupervisorAgent 開始處理查詢: {query}")
        print(f"🔍 詳細參數:")
        print(f"  - query: {query}")
        print(f"  - rule_id: {rule_id}")
        print(f"  - context type: {context.get('type', {})}")

        logger.info(f"🚀 開始處理查詢: {query}")
        logger.info(f"🔍 詳細參數:")
        logger.info(f"  - query: {query}")
        logger.info(f"  - rule_id: {rule_id}")

        # 限制 context 日誌輸出長度
        context_str = str(context)
        if len(context_str) > 300:
            context_str = context_str[:300] + "..."
        logger.info(f"  - context: {context_str}")

        # 檢查 context 中是否有錯誤
        if (
            context
            and context.get("context_data")
            and context["context_data"].get("error")
        ):
            print(
                f"❌ SupervisorAgent 收到錯誤的 context: {context['context_data']['error']}"
            )
            print(f"❌ 完整錯誤 context: {context['context_data']}")
            logger.error(
                f"❌ SupervisorAgent 收到錯誤的 context: {context['context_data']['error']}"
            )
            logger.error(f"❌ 完整錯誤 context: {context['context_data']}")

        # 檢查是否有可用的檔案路徑和數據
        if context and context.get("context_data"):
            context_data = context["context_data"]
            if context_data.get("mode") == "multi_file_analysis":
                print(f"✅ 檢測到多檔案分析模式")
                print(f"📁 檔案數量: {context_data.get('total_files', 0)}")
                print(f"🏷️ 平台類型: {context_data.get('platform_types', [])}")
                print(f"📊 分析上下文: {context_data.get('analysis_context', '')}")
                if context_data.get("files_summary"):
                    print(f"📋 檔案摘要已準備完成")
                    logger.info(
                        f"✅ 多檔案分析模式：{context_data.get('total_files', 0)} 個檔案，平台：{context_data.get('platforms', [])}"
                    )
                else:
                    print(f"⚠️ 多檔案分析模式但缺少摘要數據")
                    logger.warning(f"⚠️ 多檔案分析模式但缺少摘要數據")
            elif context_data.get("file_path"):
                print(f"✅ 檢測到單檔案路徑: {context_data['file_path']}")
                logger.info(f"✅ 檢測到檔案路徑: {context_data['file_path']}")
            elif context_data.get("file_paths"):
                print(f"✅ 檢測到多檔案路徑: {context_data['file_paths']}")
                logger.info(f"✅ 檢測到多檔案路徑: {context_data['file_paths']}")
            elif context_data.get("url"):
                print(f"✅ 檢測到頁面: {context_data['url']}")
                logger.info(f"✅ 檢測到頁面: {context_data['url']}")
            else:
                print(
                    f"⚠️ 沒有檢測到檔案路徑，context_data keys: {list(context_data.keys())}"
                )
                logger.warning(
                    f"⚠️ 沒有檢測到檔案路徑，context_data keys: {list(context_data.keys())}"
                )

        print(f"🔧 可用工具數量: {len(available_tools) if available_tools else 0}")
        logger.info(
            f"🔧 可用工具數量: {len(available_tools) if available_tools else 0}"
        )
        if available_tools:
            tool_names = [tool.name for tool in available_tools]
            print(f"🔧 可用工具列表: {tool_names}")
            logger.info(f"🔧 可用工具列表: {tool_names}")

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
            "callbacks": [self.tracer],  # 註解掉 LangSmith tracer
        }

        # 執行 graph
        start_time = time.time()
        print(f"🚀 開始執行 Agent Graph...")
        print(
            f"📋 初始狀態: query='{parsed_query}', context keys={list(context.keys()) if context else []}"
        )

        # TODO: 這是為什麼 流式回覆接不到ToolMessage
        result = await self.current_graph.ainvoke(initial_state, config=config)
        execution_time = time.time() - start_time

        print(f"⏱️ Agent Graph 執行完成，耗時 {execution_time:.2f}秒")
        print(f"📨 返回的消息數量: {len(result.get('messages', []))}")

        logger.info(f"⏱️ 查詢執行完成，耗時 {execution_time:.2f}秒")

        # 提取最終回應
        final_message = result["messages"][-1]
        print(f"📝 最終消息類型: {type(final_message).__name__}")

        if isinstance(final_message, AIMessage):
            response_content = final_message.content
            print(f"✅ AI 回應內容長度: {len(response_content)} 字符")
        else:
            response_content = "抱歉，無法處理您的請求"
            print(f"❌ 非 AI 消息，使用默認回應")

        # 提取使用的工具
        tools_used = []
        for i, msg in enumerate(result["messages"]):
            print(f"📨 消息 {i}: {type(msg).__name__}")
            if isinstance(msg, ToolMessage):
                tools_used.append(msg.name)
                print(f"🔧 使用工具: {msg.name}")
                # 🔍 顯示工具消息的詳細內容
                print(f"🔧 工具消息內容前500字符: {msg.content[:500]}")
            elif isinstance(msg, AIMessage):
                print(f"🤖 AI 消息內容前200字符: {msg.content[:200]}")
            elif hasattr(msg, "content"):
                print(f"📄 消息內容前200字符: {str(msg.content)[:200]}")

        print(f"🔧 總共使用的工具: {tools_used}")
        if not tools_used:
            print(f"⚠️ 警告：Agent 沒有使用任何工具！")

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
