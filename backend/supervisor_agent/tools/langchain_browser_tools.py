"""
LangChain 兼容的瀏覽器工具
提供標準的 LangChain tool 格式
"""

import logging
import httpx
from typing import Dict, Any, Optional, List
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# Electron HTTP API 的基礎 URL
ELECTRON_API_URL = "http://localhost:3001/browser-action"

async def call_frontend_browser(action_data: Dict[str, Any]) -> Dict[str, Any]:
    """調用 Electron 瀏覽器 API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(ELECTRON_API_URL, json=action_data)
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        logger.error("❌ 瀏覽器操作超時")
        return {"success": False, "error": "操作超時"}
    except httpx.HTTPStatusError as e:
        logger.error(f"❌ 瀏覽器操作失敗: {e.response.status_code}")
        return {"success": False, "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"❌ 調用前端瀏覽器失敗: {e}")
        return {"success": False, "error": str(e)}

@tool
async def browser_navigate_tool(url: str) -> str:
    """
    導航到指定網頁

    注意：當前頁面 URL 已經是正確的格式（如 'https://www.google.com'），
    表示已經在目標網站。只有當需要前往不同網站時才使用此工具。

    Args:
        url: 目標網址

    Returns:
        導航結果
    """
    try:
        logger.info(f"🌐 導航到: {url}")
        
        result = await call_frontend_browser({
            "action": "navigate",
            "url": url
        })
        
        if result.get("success"):
            return f"✅ 成功導航到: {result.get('url', url)}\n頁面標題: {result.get('title', '未知')}"
        else:
            return f"❌ 導航失敗: {result.get('error', '未知錯誤')}"
            
    except Exception as e:
        logger.error(f"❌ 導航工具失敗: {e}")
        return f"導航失敗: {str(e)}"

@tool
async def browser_click_tool(selector: str) -> str:
    """
    點擊頁面元素
    
    Args:
        selector: CSS 選擇器
    
    Returns:
        點擊結果
    """
    try:
        logger.info(f"👆 點擊元素: {selector}")
        
        result = await call_frontend_browser({
            "action": "click",
            "selector": selector
        })
        
        if result.get("success"):
            return f"✅ 成功點擊元素: {selector}"
        else:
            return f"❌ 點擊失敗: {result.get('error', '元素未找到或不可點擊')}"
            
    except Exception as e:
        logger.error(f"❌ 點擊工具失敗: {e}")
        return f"點擊失敗: {str(e)}"

@tool
async def browser_type_tool(selector: str, text: str, press_enter: bool = False) -> str:
    """
    在輸入框中輸入文字
    
    Args:
        selector: CSS 選擇器
        text: 要輸入的文字
        press_enter: 是否按 Enter 鍵
    
    Returns:
        輸入結果
    """
    try:
        logger.info(f"⌨️ 輸入文字到 {selector}: {text}")
        
        result = await call_frontend_browser({
            "action": "type",
            "selector": selector,
            "text": text,
            "press_enter": press_enter
        })
        
        if result.get("success"):
            return f"✅ 成功輸入文字到: {selector}"
        else:
            return f"❌ 輸入失敗: {result.get('error', '輸入框未找到')}"
            
    except Exception as e:
        logger.error(f"❌ 輸入工具失敗: {e}")
        return f"輸入失敗: {str(e)}"

@tool
async def browser_get_page_data_tool() -> str:
    """
    獲取當前頁面的完整資料，包括內容、連結和互動元素

    Returns:
        頁面的詳細資料
    """
    try:
        logger.info("📄 獲取頁面資料")

        result = await call_frontend_browser({
            "action": "get_page_data"
        })

        if result.get("success"):
            page_data = result.get("page_data", {})

            # 調試：打印原始數據結構
            logger.info(f"🔍 原始 page_data 鍵: {list(page_data.keys())}")
            logger.info(f"🔍 page_data 類型: {type(page_data)}")

            # 提取基本信息
            url = page_data.get('url', 'N/A')
            title = page_data.get('title', 'N/A')
            content = page_data.get('content', '')
            links = page_data.get('links', [])
            interactive_elements = page_data.get('interactiveElements', [])
            metadata = page_data.get('metadata', {})
            extraction_method = metadata.get('extractionMethod', 'unknown')

            # 調試：打印提取的內容信息
            logger.info(f"🔍 提取的 URL: {url}")
            logger.info(f"🔍 提取的標題: {title}")
            logger.info(f"🔍 提取的內容長度: {len(content)}")
            logger.info(f"🔍 內容類型: {type(content)}")
            if content:
                logger.info(f"🔍 內容前100字符: {content[:100]}")
            else:
                logger.info("🔍 內容為空或 None")

            # 構建詳細的回應
            response = f"✅ 頁面資料獲取成功\n\n"
            response += f"**URL**: {url}\n"
            response += f"**標題**: {title}\n"
            response += f"**提取方式**: {extraction_method}\n\n"

            if content:
                # 限制內容長度，最大 20000 字
                max_length = 20000
                if len(content) > max_length:
                    content_preview = content[:max_length] + f"\n\n[內容已截斷，原始長度: {len(content)} 字符]"
                else:
                    content_preview = content
                response += f"**頁面內容**:\n{content_preview}\n\n"

            # 新的 markdown 格式已經包含了連結和互動元素信息
            # 所以不需要單獨顯示這些信息
            if links and len(links) > 0:
                response += f"**注意**: 頁面包含 {len(links)} 個連結，已整合在上方內容中\n"

            if interactive_elements and len(interactive_elements) > 0:
                response += f"**注意**: 頁面包含 {len(interactive_elements)} 個互動元素，已整合在上方內容中\n"

            # 添加調試信息
            logger.info(f"🔍 頁面內容調試 - URL: {url}")
            logger.info(f"🔍 內容長度: {len(content)} 字符")
            logger.info(f"🔍 內容前1000字符: {content[:1000]}")

            return response.strip()
        else:
            return f"❌ 頁面資料獲取失敗: {result.get('error', '未知錯誤')}"

    except Exception as e:
        logger.error(f"❌ 頁面資料獲取失敗: {e}")
        return f"頁面資料獲取失敗: {str(e)}"

@tool
async def browser_read_element_tool(selector: str) -> str:
    """
    讀取元素內容
    
    Args:
        selector: CSS 選擇器
    
    Returns:
        元素內容
    """
    try:
        logger.info(f"📖 讀取元素: {selector}")
        
        result = await call_frontend_browser({
            "action": "read_element",
            "selector": selector
        })
        
        if result.get("success"):
            data = result.get("data", {})
            return f"✅ 元素讀取成功\n文字: {data.get('text', 'N/A')[:500]}..."
        else:
            return f"❌ 元素讀取失敗: {result.get('error', '元素未找到')}"
            
    except Exception as e:
        logger.error(f"❌ 元素讀取失敗: {e}")
        return f"元素讀取失敗: {str(e)}"

@tool
async def browser_scroll_tool(direction: str = "down") -> str:
    """
    滾動頁面
    
    Args:
        direction: 滾動方向，"up" 或 "down"
    
    Returns:
        滾動結果
    """
    try:
        logger.info(f"📜 滾動頁面: {direction}")
        
        result = await call_frontend_browser({
            "action": "scroll",
            "direction": direction
        })
        
        if result.get("success"):
            return f"✅ 成功滾動頁面: {direction}"
        else:
            return f"❌ 滾動失敗: {result.get('error', '滾動操作失敗')}"
            
    except Exception as e:
        logger.error(f"❌ 滾動工具失敗: {e}")
        return f"滾動失敗: {str(e)}"

@tool
async def browser_screenshot_tool() -> str:
    """
    截取當前頁面截圖
    
    Returns:
        截圖結果
    """
    try:
        logger.info("📸 截取頁面截圖")
        
        result = await call_frontend_browser({
            "action": "screenshot"
        })
        
        if result.get("success"):
            return f"✅ 成功截取截圖\n當前頁面: {result.get('url', '未知')}\n頁面標題: {result.get('title', '未知')}"
        else:
            return f"❌ 截圖失敗: {result.get('error', '截圖操作失敗')}"
            
    except Exception as e:
        logger.error(f"❌ 截圖工具失敗: {e}")
        return f"截圖失敗: {str(e)}"

@tool
async def browser_execute_script_tool(script: str) -> str:
    """
    執行 JavaScript 腳本
    
    Args:
        script: JavaScript 代碼
    
    Returns:
        執行結果
    """
    try:
        logger.info(f"🔧 執行腳本: {script[:100]}...")
        
        result = await call_frontend_browser({
            "action": "execute_script",
            "script": script
        })
        
        if result.get("success"):
            script_result = result.get("result", "無返回值")
            return f"✅ 腳本執行成功\n結果: {script_result}"
        else:
            return f"❌ 腳本執行失敗: {result.get('error', '腳本錯誤')}"
            
    except Exception as e:
        logger.error(f"❌ 腳本執行工具失敗: {e}")
        return f"腳本執行失敗: {str(e)}"

# 獲取所有瀏覽器工具
def get_langchain_browser_tools() -> List:
    """獲取所有 LangChain 兼容的瀏覽器工具"""
    return [
        browser_navigate_tool,
        browser_click_tool,
        browser_type_tool,
        browser_get_page_data_tool,
        browser_read_element_tool,
        browser_scroll_tool,
        browser_screenshot_tool,
        browser_execute_script_tool,
    ]
