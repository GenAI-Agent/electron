"""
網頁分析工具
提供網頁內容抓取、連結提取、文字提取和內容總結功能
"""

import os
import logging
import httpx
from typing import List, Dict, Any
from langchain_core.tools import tool
from langchain_openai import AzureChatOpenAI
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# 初始化 LLM
llm = AzureChatOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
    temperature=0.3,
)


async def fetch_webpage_content(url: str, timeout: int = 30) -> Dict[str, Any]:
    """
    抓取網頁內容
    
    Args:
        url: 目標網址
        timeout: 超時時間（秒）
    
    Returns:
        包含 HTML 內容和狀態的字典
    """
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            # 設置 User-Agent 避免被擋
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            return {
                "success": True,
                "url": str(response.url),  # 最終的 URL（可能被重定向）
                "status_code": response.status_code,
                "content": response.text,
                "content_type": response.headers.get("content-type", ""),
            }
    except httpx.TimeoutException:
        logger.error(f"抓取網頁超時: {url}")
        return {"success": False, "error": "請求超時"}
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP 錯誤 {e.response.status_code}: {url}")
        return {"success": False, "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"抓取網頁失敗: {str(e)}")
        return {"success": False, "error": str(e)}


def extract_links_from_html(html_content: str, base_url: str) -> List[Dict[str, str]]:
    """
    從 HTML 提取所有連結
    
    Args:
        html_content: HTML 內容
        base_url: 基礎 URL（用於相對連結轉換）
    
    Returns:
        連結列表，每個連結包含 url、text、title
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    links = []
    
    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        # 轉換相對連結為絕對連結
        absolute_url = urljoin(base_url, href)
        
        # 提取連結文字和標題
        text = link.get_text(strip=True)
        title = link.get('title', '')
        
        links.append({
            "url": absolute_url,
            "text": text or "(無文字)",
            "title": title,
            "original_href": href
        })
    
    return links


def extract_text_content(html_content: str) -> Dict[str, Any]:
    """
    從 HTML 提取結構化文字內容
    
    Args:
        html_content: HTML 內容
    
    Returns:
        包含標題、段落、列表等結構化文字
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 移除 script 和 style 標籤
    for script in soup(["script", "style"]):
        script.decompose()
    
    # 提取標題
    title = soup.find('title')
    title_text = title.get_text(strip=True) if title else ""
    
    # 提取各級標題
    headings = []
    for i in range(1, 7):
        for heading in soup.find_all(f'h{i}'):
            headings.append({
                "level": i,
                "text": heading.get_text(strip=True)
            })
    
    # 提取段落
    paragraphs = []
    for p in soup.find_all('p'):
        text = p.get_text(strip=True)
        if text:  # 過濾空段落
            paragraphs.append(text)
    
    # 提取列表項目
    list_items = []
    for li in soup.find_all('li'):
        text = li.get_text(strip=True)
        if text:
            list_items.append(text)
    
    # 提取 meta 描述
    meta_description = ""
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc:
        meta_description = meta_desc.get('content', '')
    
    # 獲取全文（用於總結）
    full_text = soup.get_text(separator=' ', strip=True)
    
    return {
        "title": title_text,
        "meta_description": meta_description,
        "headings": headings,
        "paragraphs": paragraphs,
        "list_items": list_items,
        "full_text": full_text[:5000]  # 限制長度避免 token 過多
    }


async def summarize_content(text_content: Dict[str, Any]) -> str:
    """
    使用 LLM 總結網頁內容
    
    Args:
        text_content: 結構化文字內容
    
    Returns:
        內容總結
    """
    try:
        # 準備總結的內容
        summary_parts = []
        
        if text_content.get("title"):
            summary_parts.append(f"標題: {text_content['title']}")
        
        if text_content.get("meta_description"):
            summary_parts.append(f"描述: {text_content['meta_description']}")
        
        # 添加前幾個標題
        headings = text_content.get("headings", [])[:5]
        if headings:
            heading_texts = [f"H{h['level']}: {h['text']}" for h in headings]
            summary_parts.append("主要標題:\n" + "\n".join(heading_texts))
        
        # 添加前幾個段落
        paragraphs = text_content.get("paragraphs", [])[:3]
        if paragraphs:
            summary_parts.append("主要內容:\n" + "\n".join(paragraphs))
        
        content_to_summarize = "\n\n".join(summary_parts)
        
        # 使用 LLM 生成總結
        prompt = f"""請為以下網頁內容提供一個簡潔的中文總結（約100-200字）：

{content_to_summarize}

總結要點：
1. 網頁的主要主題
2. 關鍵信息和重點
3. 網頁的用途或目標受眾"""
        
        response = await llm.ainvoke(prompt)
        return response.content
        
    except Exception as e:
        logger.error(f"生成總結失敗: {str(e)}")
        return "無法生成總結"


@tool
async def analyze_webpage(url: str, extract_links: bool = True, summarize: bool = True) -> str:
    """
    分析網頁內容，提取連結、文字並生成總結
    
    Args:
        url: 要分析的網頁 URL
        extract_links: 是否提取連結（預設為 True）
        summarize: 是否生成內容總結（預設為 True）
    
    Returns:
        網頁分析結果，包含連結、文字內容和總結
    """
    try:
        logger.info(f"開始分析網頁: {url}")
        
        # 抓取網頁內容
        fetch_result = await fetch_webpage_content(url)
        if not fetch_result["success"]:
            return f"❌ 無法抓取網頁: {fetch_result['error']}"
        
        html_content = fetch_result["content"]
        final_url = fetch_result["url"]
        
        # 提取文字內容
        text_content = extract_text_content(html_content)
        
        # 準備結果
        result_parts = []
        result_parts.append(f"🌐 網頁分析結果")
        result_parts.append(f"URL: {final_url}")
        result_parts.append(f"標題: {text_content['title']}")
        
        if text_content.get("meta_description"):
            result_parts.append(f"描述: {text_content['meta_description']}")
        
        # 提取連結（如果需要）
        if extract_links:
            links = extract_links_from_html(html_content, final_url)
            result_parts.append(f"\n📎 找到 {len(links)} 個連結")
            
            # 顯示前10個連結
            for i, link in enumerate(links[:10]):
                result_parts.append(f"{i+1}. [{link['text']}]({link['url']})")
            
            if len(links) > 10:
                result_parts.append(f"... 還有 {len(links) - 10} 個連結")
        
        # 生成總結（如果需要）
        if summarize:
            summary = await summarize_content(text_content)
            result_parts.append(f"\n📝 內容總結:\n{summary}")
        
        # 顯示主要標題
        headings = text_content.get("headings", [])[:5]
        if headings:
            result_parts.append("\n📋 主要章節:")
            for h in headings:
                indent = "  " * (h['level'] - 1)
                result_parts.append(f"{indent}• {h['text']}")
        
        return "\n".join(result_parts)
        
    except Exception as e:
        logger.error(f"分析網頁失敗: {str(e)}", exc_info=True)
        return f"❌ 分析網頁時發生錯誤: {str(e)}"


@tool
async def extract_webpage_links(url: str) -> str:
    """
    提取網頁中的所有連結
    
    Args:
        url: 要分析的網頁 URL
    
    Returns:
        網頁中所有連結的列表
    """
    try:
        logger.info(f"提取網頁連結: {url}")
        
        # 抓取網頁內容
        fetch_result = await fetch_webpage_content(url)
        if not fetch_result["success"]:
            return f"❌ 無法抓取網頁: {fetch_result['error']}"
        
        html_content = fetch_result["content"]
        final_url = fetch_result["url"]
        
        # 提取連結
        links = extract_links_from_html(html_content, final_url)
        
        # 按域名分組連結
        links_by_domain = {}
        for link in links:
            parsed = urlparse(link['url'])
            domain = parsed.netloc or 'relative'
            if domain not in links_by_domain:
                links_by_domain[domain] = []
            links_by_domain[domain].append(link)
        
        # 格式化輸出
        result_parts = []
        result_parts.append(f"🔗 從 {final_url} 提取到 {len(links)} 個連結")
        
        for domain, domain_links in sorted(links_by_domain.items()):
            result_parts.append(f"\n📌 {domain} ({len(domain_links)} 個連結):")
            for link in domain_links[:5]:  # 每個域名顯示前5個
                result_parts.append(f"  • [{link['text']}]({link['url']})")
            if len(domain_links) > 5:
                result_parts.append(f"  ... 還有 {len(domain_links) - 5} 個連結")
        
        return "\n".join(result_parts)
        
    except Exception as e:
        logger.error(f"提取連結失敗: {str(e)}", exc_info=True)
        return f"❌ 提取連結時發生錯誤: {str(e)}"


@tool
async def extract_webpage_text(url: str) -> str:
    """
    提取網頁的純文字內容
    
    Args:
        url: 要分析的網頁 URL
    
    Returns:
        網頁的結構化文字內容
    """
    try:
        logger.info(f"提取網頁文字: {url}")
        
        # 抓取網頁內容
        fetch_result = await fetch_webpage_content(url)
        if not fetch_result["success"]:
            return f"❌ 無法抓取網頁: {fetch_result['error']}"
        
        html_content = fetch_result["content"]
        
        # 提取文字內容
        text_content = extract_text_content(html_content)
        
        # 格式化輸出
        result_parts = []
        result_parts.append(f"📄 網頁文字內容")
        result_parts.append(f"標題: {text_content['title']}")
        
        if text_content.get("meta_description"):
            result_parts.append(f"描述: {text_content['meta_description']}")
        
        # 顯示標題結構
        headings = text_content.get("headings", [])
        if headings:
            result_parts.append("\n📑 內容結構:")
            for h in headings[:10]:  # 顯示前10個標題
                indent = "  " * (h['level'] - 1)
                result_parts.append(f"{indent}H{h['level']}: {h['text']}")
        
        # 顯示前幾個段落
        paragraphs = text_content.get("paragraphs", [])
        if paragraphs:
            result_parts.append("\n📝 主要段落:")
            for i, p in enumerate(paragraphs[:5]):
                result_parts.append(f"\n段落 {i+1}:\n{p}")
        
        # 顯示列表項目
        list_items = text_content.get("list_items", [])
        if list_items:
            result_parts.append(f"\n📋 列表項目 (共 {len(list_items)} 項):")
            for item in list_items[:10]:
                result_parts.append(f"  • {item}")
        
        return "\n".join(result_parts)
        
    except Exception as e:
        logger.error(f"提取文字失敗: {str(e)}", exc_info=True)
        return f"❌ 提取文字時發生錯誤: {str(e)}"


# 工具列表供 tool_manager 使用
webpage_tools = [
    analyze_webpage,
    extract_webpage_links,
    extract_webpage_text,
]