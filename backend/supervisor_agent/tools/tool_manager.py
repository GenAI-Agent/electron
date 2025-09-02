"""
Tool Manager - 工具管理器
負責管理和協調所有的工具，包括默認工具和規則特定工具
"""

import asyncio
import time
from typing import Dict, List, Any, Optional, Set
from pathlib import Path
import json

from supervisor_agent.tools.langchain_browser_tools import (
    BROWSER_TOOLS,
    get_browser_tool,
    cleanup_all_tools,
    BaseBrowserTool,
)
from supervisor_agent.tools.webpage_tool import webpage_tools
from supervisor_agent.utils.logger import get_logger

logger = get_logger(__name__)


class ToolManager:
    """工具管理器"""

    def __init__(self, rules_dir: str = "data/rules"):
        self.rules_dir = Path(rules_dir)
        self.default_tools: Dict[str, BaseBrowserTool] = {}
        self.rule_tools: Dict[str, Dict[str, BaseBrowserTool]] = {}
        self.active_tools: Dict[str, BaseBrowserTool] = {}
        self.rules_cache: Dict[str, Dict[str, Any]] = {}

        # 初始化
        self._load_rules()
        self._initialize_default_tools()

    def _load_rules(self):
        """載入所有規則"""
        if not self.rules_dir.exists():
            logger.warning(f"規則目錄不存在: {self.rules_dir}")
            return

        for rule_file in self.rules_dir.glob("*.json"):
            try:
                with open(rule_file, "r", encoding="utf-8") as f:
                    rule_data = json.load(f)
                    rule_name = rule_data.get("name", "")
                    if rule_name:
                        self.rules_cache[rule_name] = rule_data
                        logger.info(f"載入規則: {rule_name}")
            except Exception as e:
                logger.error(f"載入規則失敗 {rule_file}: {e}")

    def _initialize_default_tools(self):
        """初始化默認工具"""
        logger.info("🔧 初始化默認工具...")

        # 默認瀏覽器工具
        default_browser_tools = [
            "browser_click",
            "browser_type",
            "browser_scroll",
            "browser_navigate",
            "browser_wait_element",
            "browser_get_page_data",
            "browser_screenshot",
        ]

        for tool_name in default_browser_tools:
            try:
                tool = get_browser_tool(tool_name)
                if tool:
                    self.default_tools[tool_name] = tool
                    logger.info(f"✅ 載入默認工具: {tool_name}")
            except Exception as e:
                logger.error(f"❌ 載入默認工具失敗 {tool_name}: {e}")

        # 添加網頁分析工具
        for tool in webpage_tools:
            try:
                self.default_tools[tool.name] = tool
                logger.info(f"✅ 載入網頁工具: {tool.name}")
            except Exception as e:
                logger.error(f"❌ 載入網頁工具失敗: {e}")

        logger.info(f"🎯 默認工具載入完成: {len(self.default_tools)} 個")

    def get_tools_for_rule(
        self, rule_name: Optional[str] = None
    ) -> Dict[str, BaseBrowserTool]:
        """獲取指定規則的工具集"""
        tools = {}

        # 1. 添加默認工具
        tools.update(self.default_tools)
        logger.info(f"📋 載入默認工具: {len(self.default_tools)} 個")

        # 2. 如果有規則，添加規則特定工具
        if rule_name and rule_name in self.rules_cache:
            rule_data = self.rules_cache[rule_name]
            rule_tools = rule_data.get("tools", [])

            if rule_tools:
                logger.info(f"🎯 規則 '{rule_name}' 指定工具: {rule_tools}")

                for tool_name in rule_tools:
                    try:
                        # 檢查是否為瀏覽器工具
                        if tool_name in BROWSER_TOOLS:
                            tool = get_browser_tool(tool_name)
                            if tool:
                                tools[tool_name] = tool
                                logger.info(f"✅ 載入規則工具: {tool_name}")
                        else:
                            logger.warning(f"⚠️ 未知工具: {tool_name}")
                    except Exception as e:
                        logger.error(f"❌ 載入規則工具失敗 {tool_name}: {e}")

        return tools

    def activate_tools(
        self, rule_name: Optional[str] = None
    ) -> Dict[str, BaseBrowserTool]:
        """激活指定規則的工具集"""
        logger.info(f"🚀 激活工具集，規則: {rule_name or '默認'}")

        # 清理之前的活動工具
        self._cleanup_active_tools()

        # 獲取新的工具集
        self.active_tools = self.get_tools_for_rule(rule_name)

        logger.info(f"✅ 工具集激活完成: {len(self.active_tools)} 個工具")
        return self.active_tools

    def get_active_tools(self) -> Dict[str, BaseBrowserTool]:
        """獲取當前活動的工具集"""
        return self.active_tools

    def get_tool(self, tool_name: str) -> Optional[BaseBrowserTool]:
        """獲取指定的工具"""
        return self.active_tools.get(tool_name)

    def list_available_tools(self) -> List[str]:
        """列出所有可用的工具"""
        return list(BROWSER_TOOLS.keys())

    def list_active_tools(self) -> List[str]:
        """列出當前活動的工具"""
        return list(self.active_tools.keys())

    def get_tool_info(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """獲取工具資訊"""
        tool = self.active_tools.get(tool_name)
        if not tool:
            return None

        return {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.get_parameters(),
        }

    def get_all_tools_info(self) -> List[Dict[str, Any]]:
        """獲取所有活動工具的資訊"""
        tools_info = []
        for tool_name, tool in self.active_tools.items():
            tools_info.append(
                {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.get_parameters(),
                }
            )
        return tools_info

    async def execute_tool(
        self, tool_name: str, parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """執行指定工具"""
        tool = self.get_tool(tool_name)
        if not tool:
            return {
                "success": False,
                "error": f"工具不存在: {tool_name}",
                "tool_name": tool_name,
            }

        try:
            logger.info(f"🔧 執行工具: {tool_name}")
            start_time = time.time()

            result = await tool.execute(parameters)

            execution_time = time.time() - start_time

            # 轉換結果格式
            return {
                "success": result.success,
                "error": result.error,
                "data": result.page_data,
                "screenshot": result.screenshot,
                "execution_time": execution_time,
                "tool_name": tool_name,
                "parameters": parameters,
                "details": result.details,
            }

        except Exception as e:
            logger.error(f"❌ 工具執行失敗 {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_name": tool_name,
                "parameters": parameters,
            }

    def _cleanup_active_tools(self):
        """清理活動工具"""
        if self.active_tools:
            # 注意：這裡不能直接調用 async 方法，需要在適當的地方調用
            logger.info("🧹 清理活動工具...")
            self.active_tools.clear()

    async def cleanup(self):
        """清理所有資源"""
        logger.info("🧹 清理工具管理器...")

        # 清理活動工具
        if self.active_tools:
            tools_list = list(self.active_tools.values())
            await cleanup_all_tools(tools_list)
            self.active_tools.clear()

        # 清理默認工具
        if self.default_tools:
            tools_list = list(self.default_tools.values())
            await cleanup_all_tools(tools_list)
            self.default_tools.clear()

        logger.info("✅ 工具管理器清理完成")

    def reload_rules(self):
        """重新載入規則"""
        logger.info("🔄 重新載入規則...")
        self.rules_cache.clear()
        self._load_rules()
        logger.info("✅ 規則重新載入完成")

    def get_rule_info(self, rule_name: str) -> Optional[Dict[str, Any]]:
        """獲取規則資訊"""
        return self.rules_cache.get(rule_name)

    def list_rules(self) -> List[str]:
        """列出所有規則"""
        return list(self.rules_cache.keys())


# 全局工具管理器實例
_tool_manager: Optional[ToolManager] = None


def get_tool_manager(rules_dir: str = "data/rules") -> ToolManager:
    """獲取工具管理器實例（單例模式）"""
    global _tool_manager
    if _tool_manager is None:
        _tool_manager = ToolManager(rules_dir)
    return _tool_manager


async def cleanup_tool_manager():
    """清理全局工具管理器"""
    global _tool_manager
    if _tool_manager:
        await _tool_manager.cleanup()
        _tool_manager = None
