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

    def __init__(self, tools: List):
        super().__init__(tools)
        self.tools_by_name = {tool.name: tool for tool in tools}

    async def _execute_single_tool_with_message(self, tool, tool_args, tool_call_id, tool_name):
        """執行單個工具並返回 ToolMessage"""
        try:
            logger.info(f"🔧 執行工具: {tool_name}")
            start_time = time.time()

            # 執行工具
            if asyncio.iscoroutinefunction(tool.func):
                result = await tool.func(**tool_args)
            else:
                result = tool.func(**tool_args)

            execution_time = time.time() - start_time
            logger.info(f"✅ 工具 {tool_name} 執行完成，耗時 {execution_time:.2f}秒")

            # 創建 ToolMessage
            return ToolMessage(
                content=str(result),
                tool_call_id=tool_call_id,
                name=tool_name
            )

        except Exception as e:
            logger.error(f"❌ 工具 {tool_name} 執行失敗: {e}")
            return ToolMessage(
                content=f"工具執行失敗: {str(e)}",
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

    def __init__(self, rules_dir: str = "data/rules"):
        logger.info("🔄 開始初始化 Supervisor Agent...")
        init_start = time.time()

        # 設置規則目錄
        self.rules_dir = rules_dir

        # 初始化 LLM
        self.llm = AzureChatOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            azure_deployment="gpt-4o",
            api_version="2025-01-01-preview",
            temperature=0.7,
        )

        logger.info("✅ LLM 初始化完成")

        # 當前會話的工具（動態設置）
        self.current_tools = []
        self.current_llm_with_tools = None
        self.current_graph = None

        init_time = time.time() - init_start
        logger.info(f"✅ Supervisor Agent 初始化完成，耗時 {init_time:.2f}秒")

    def setup_tools_for_query(self, tool_names: List[str] = None):
        """為當前查詢動態設置工具"""
        logger.info(f"🔧 開始動態設置工具，規則工具: {tool_names}")

        # 開始設置工具
        self.current_tools = []

        # 1. 動態導入並添加默認瀏覽器工具
        try:
            from ..tools.langchain_browser_tools import get_langchain_browser_tools
            browser_tools = get_langchain_browser_tools()

            for tool in browser_tools:
                self.current_tools.append(tool)
                logger.info(f"🌐 添加默認瀏覽器工具: {tool.name}")

        except Exception as e:
            logger.warning(f"⚠️ 瀏覽器工具導入失敗: {e}")

        # 2. 根據規則添加額外的瀏覽器工具（如果需要）
        if tool_names:
            logger.info(f"📋 規則指定的工具: {tool_names}")
            # 目前所有工具都是瀏覽器工具，已經在上面載入了

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
            tool_node = ParallelToolNode(self.current_tools)
        else:
            # 沒有工具時創建一個空的工具節點
            tool_node = ParallelToolNode([])

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

        if not messages:
            return "respond"

        last_message = messages[-1]

        # 如果最後一個消息是AI消息且有工具調用，執行工具
        if isinstance(last_message, AIMessage) and hasattr(last_message, "tool_calls") and last_message.tool_calls:
            logger.info(f"🔧 supervisor決定調用工具: {len(last_message.tool_calls)} 個")
            return "tools"

        # 檢查是否達到最大工具調用次數（防止無限循環）
        tool_messages = [msg for msg in messages if isinstance(msg, ToolMessage)]
        if len(tool_messages) >= 10:  # 最多10次工具調用
            logger.info("🛑 達到最大工具調用次數，強制生成回答")
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
            if tool_count >= 5:
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
        base_browser_instructions = """
🌐 **瀏覽器操作指南**:
你已連接到前端 Puppeteer 瀏覽器，可以執行以下操作：

1. **讀取網頁內容**: 使用 `read_page_content_tool()` 獲取當前頁面的文字內容和所有連結
2. **獲取可點擊元素**: 使用 `get_clickable_elements_tool()` 找到頁面上所有可點擊的元素
3. **點擊連結**: 使用 `click_link_tool("連結文字")` 點擊特定連結
4. **導航到URL**: 使用 `navigate_to_url_tool("https://...")` 直接導航到指定網址
5. **其他瀏覽器操作**: 點擊、輸入、滾動等

⚠️ **重要**: 在分析任何網頁內容之前，必須先使用 `read_page_content_tool()` 讀取當前頁面內容！

"""

        # 添加當前頁面資料到系統提示中
        page_data_context = ""
        if context and "page_data" in context:
            page_data = context["page_data"]
            if page_data:
                page_data_context = f"""
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
                return base_browser_instructions + page_data_context + "\n" + rule_data["prompt"]

        # 預設系統提示
        return base_browser_instructions + page_data_context + """你是一個智能的任務執行助手，具備以下能力：

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

💡 **執行策略**：
- 如果任務需要多個步驟，請逐步執行，每次調用必要的工具
- 根據工具執行結果評估是否需要調用更多工具
- 避免重複調用相同工具（除非參數不同）
- 當收集到足夠信息時，提供完整的最終回答

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
            rule_file = rules_dir / f"{rule_id}.json"

            if rule_file.exists():
                with open(rule_file, 'r', encoding='utf-8') as f:
                    rule_data = json.load(f)
                    return rule_data
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

    async def run(self, query: str, rule_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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
            self.setup_tools_for_query(tool_names)
            logger.info(f"📋 使用規則: {rule_data.get('name', rule_id)}，規則工具: {tool_names}")
        else:
            # 沒有規則，只使用默認瀏覽器工具
            self.setup_tools_for_query([])
            logger.info("💬 使用預設模式（只有瀏覽器工具）")

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
