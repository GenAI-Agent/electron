/**
 * PageDataExtractor - 頁面資料提取器
 * 用於提取當前頁面的內容和互動元素
 */

import {
  PageData,
  InteractiveElement,
  InteractiveElementType,
} from "@/types/page-data";

interface ExtractOptions {
  accessToken?: string;
  refreshToken?: string;
  clientConfig?: {
    clientId: string;
    clientSecret: string;
  };
  useAPI?: boolean;
  maxResults?: number;
}

/**
 * 提取當前頁面資料
 */
export async function extractCurrentPageData(
  options: ExtractOptions = {}
): Promise<PageData> {
  try {
    // 如果在 Electron 環境中，使用 Electron API
    if (
      typeof window !== "undefined" &&
      window.electronAPI?.browserControl?.getPageData
    ) {
      const result = await window.electronAPI.browserControl.getPageData(
        options
      );
      if (result.success) {
        return result.pageData;
      }
    }

    // 如果在瀏覽器環境中，直接提取
    return await extractPageDataFromDOM();
  } catch (error) {
    console.error("❌ 頁面資料提取失敗:", error);
    return createErrorPageData(
      error instanceof Error ? error.message : "未知錯誤"
    );
  }
}

/**
 * 從 DOM 直接提取頁面資料
 */
async function extractPageDataFromDOM(): Promise<PageData> {
  const url = window.location.href;
  const title = document.title;
  const content = generateMarkdownContent();
  const interactiveElements = findInteractiveElements();

  return {
    url,
    title,
    content,
    interactiveElements,
    metadata: {
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY,
      },
      loadState: document.readyState as "loading" | "interactive" | "complete",
      language: document.documentElement.lang || "zh-TW",
      charset: document.characterSet || "UTF-8",
    },
    extractionErrors: [],
  };
}

/**
 * 生成 Markdown 格式的頁面內容
 */
function generateMarkdownContent(): string {
  let markdown = `# ${document.title}\n\n`;

  // 提取主要內容區域
  const contentSelectors = [
    "main",
    '[role="main"]',
    ".main-content",
    ".content",
    "article",
    ".article",
    "#content",
    "body",
  ];

  let contentElement: Element | null = null;
  for (const selector of contentSelectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) break;
  }

  if (!contentElement) {
    contentElement = document.body;
  }

  // 遞歸處理元素
  markdown += processElement(contentElement);

  return markdown;
}

/**
 * 處理單個元素，轉換為 Markdown
 */
function processElement(element: Element): string {
  if (!element) return "";

  const tagName = element.tagName.toLowerCase();
  const text = element.textContent?.trim() || "";

  // 跳過不需要的元素
  if (
    ["script", "style", "nav", "header", "footer", "aside"].includes(tagName)
  ) {
    return "";
  }

  // 處理標題
  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
    const level = parseInt(tagName.charAt(1));
    return `${"#".repeat(level)} ${text}\n\n`;
  }

  // 處理段落
  if (tagName === "p") {
    return text ? `${text}\n\n` : "";
  }

  // 處理列表
  if (tagName === "ul" || tagName === "ol") {
    let listContent = "";
    const items = element.querySelectorAll("li");
    items.forEach((item, index) => {
      const itemText = item.textContent?.trim() || "";
      if (itemText) {
        const prefix = tagName === "ol" ? `${index + 1}. ` : "- ";
        listContent += `${prefix}${itemText}\n`;
      }
    });
    return listContent ? `${listContent}\n` : "";
  }

  // 處理連結
  if (tagName === "a") {
    const href = element.getAttribute("href");
    return href ? `[${text}](${href})` : text;
  }

  // 處理其他元素，遞歸處理子元素
  let content = "";
  for (let i = 0; i < element.children.length; i++) {
    content += processElement(element.children[i]);
  }

  // 如果沒有子元素但有文字內容
  if (!content && text) {
    content = text + "\n\n";
  }

  return content;
}

/**
 * 查找頁面上的互動元素
 */
function findInteractiveElements(): InteractiveElement[] {
  const elements: InteractiveElement[] = [];
  const selectors = [
    "button",
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="search"]',
    "textarea",
    "select",
    "a[href]",
    "[onclick]",
    '[role="button"]',
    ".btn",
    ".button",
  ];

  selectors.forEach((selector) => {
    const foundElements = document.querySelectorAll(selector);
    foundElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        window.getComputedStyle(element).visibility !== "hidden";

      if (isVisible) {
        elements.push(createInteractiveElement(element, index));
      }
    });
  });

  return elements;
}

/**
 * 創建互動元素對象
 */
function createInteractiveElement(
  element: Element,
  index: number
): InteractiveElement {
  const rect = element.getBoundingClientRect();
  const tagName = element.tagName.toLowerCase();
  const type = getElementType(element);
  const text =
    element.textContent?.trim() ||
    element.getAttribute("placeholder") ||
    element.getAttribute("value") ||
    element.getAttribute("title") ||
    "";

  // 生成選擇器
  const id = element.id;
  const className = element.className;
  let selector = tagName;

  if (id) {
    selector = `#${id}`;
  } else if (className && typeof className === "string") {
    const classes = className.split(" ").filter((c) => c.trim());
    if (classes.length > 0) {
      selector = `${tagName}.${classes[0]}`;
    }
  }

  return {
    id: `element_${index}`,
    type,
    selector,
    fallbackSelectors: [
      selector,
      `${tagName}:nth-child(${index + 1})`,
      `${tagName}:contains("${text.substring(0, 20)}")`,
    ],
    text,
    attributes: getElementAttributes(element),
    position: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
    isVisible: true,
    isClickable: isElementClickable(element),
    importance: calculateImportance(element, text),
  };
}

/**
 * 獲取元素類型
 */
function getElementType(element: Element): InteractiveElementType {
  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute("type")?.toLowerCase();

  if (tagName === "button" || type === "button" || type === "submit") {
    return "button";
  }
  if (tagName === "a") {
    return "link";
  }
  if (tagName === "input") {
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    return "input";
  }
  if (tagName === "select") {
    return "select";
  }
  if (tagName === "textarea") {
    return "textarea";
  }
  if (tagName === "img") {
    return "image";
  }

  return "div_clickable";
}

/**
 * 獲取元素屬性
 */
function getElementAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  return attributes;
}

/**
 * 判斷元素是否可點擊
 */
function isElementClickable(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  const clickableTags = ["button", "a", "input", "select", "textarea"];

  return (
    clickableTags.includes(tagName) ||
    element.hasAttribute("onclick") ||
    element.getAttribute("role") === "button" ||
    element.classList.contains("btn") ||
    element.classList.contains("button")
  );
}

/**
 * 計算元素重要性
 */
function calculateImportance(element: Element, text: string): number {
  let importance = 0.5; // 基礎重要性

  // 根據標籤類型調整
  const tagName = element.tagName.toLowerCase();
  if (["button", 'input[type="submit"]'].includes(tagName)) {
    importance += 0.3;
  }
  if (tagName === "a") {
    importance += 0.2;
  }

  // 根據文字內容調整
  if (text.length > 0) {
    importance += 0.1;
  }

  // 根據位置調整（頁面上方的元素更重要）
  const rect = element.getBoundingClientRect();
  if (rect.top < window.innerHeight / 2) {
    importance += 0.1;
  }

  return Math.min(importance, 1.0);
}

/**
 * 創建錯誤頁面資料
 */
function createErrorPageData(error: string): PageData {
  return {
    url: window.location.href,
    title: document.title || "Error",
    content: `# 頁面資料提取錯誤\n\n錯誤信息：${error}`,
    interactiveElements: [],
    metadata: {
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY,
      },
      loadState: "complete",
    },
    extractionErrors: [error],
  };
}

/**
 * 提取頁面摘要
 */
export async function extractPageSummary(): Promise<string> {
  const pageData = await extractCurrentPageData();
  const contentPreview = pageData.content.substring(0, 500);
  const elementCount = pageData.interactiveElements.length;

  return (
    `頁面標題：${pageData.title}\n` +
    `URL：${pageData.url}\n` +
    `互動元素數量：${elementCount}\n` +
    `內容預覽：${contentPreview}...`
  );
}

/**
 * 重新檢測互動元素
 */
export async function refreshInteractiveElements(): Promise<
  InteractiveElement[]
> {
  return findInteractiveElements();
}

/**
 * 使用 OAuth token 提取 Gmail 頁面資料
 */
export async function extractGmailPageDataWithOAuth(): Promise<PageData> {
  try {
    // 嘗試從 localStorage 獲取保存的 token
    const storedTokens = localStorage.getItem("google_oauth_tokens");

    if (!storedTokens) {
      console.warn("⚠️ 未找到保存的 OAuth token，使用純 DOM 解析");
      return await extractCurrentPageData({ useAPI: false });
    }

    const tokens = JSON.parse(storedTokens);
    const { access_token, refresh_token } = tokens;

    if (!access_token) {
      console.warn("⚠️ OAuth token 無效，使用純 DOM 解析");
      return await extractCurrentPageData({ useAPI: false });
    }

    // 使用 OAuth token 調用 Gmail API + DOM 解析
    const options: ExtractOptions = {
      accessToken: access_token,
      refreshToken: refresh_token,
      clientConfig: {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
      },
      useAPI: true,
      maxResults: 100,
    };

    console.log("🔄 使用 OAuth token 提取 Gmail 資料...");
    const result = await extractCurrentPageData(options);

    // 如果返回的結果包含刷新後的 token，更新 localStorage
    if (result.metadata && (result.metadata as any).refreshedToken) {
      const updatedTokens = {
        ...tokens,
        access_token: (result.metadata as any).refreshedToken,
      };
      localStorage.setItem(
        "google_oauth_tokens",
        JSON.stringify(updatedTokens)
      );
      console.log("✅ OAuth token 已更新");
    }

    return result;
  } catch (error) {
    console.error("❌ OAuth Gmail 資料提取失敗:", error);
    console.log("🔄 回退到純 DOM 解析...");
    return await extractCurrentPageData({ useAPI: false });
  }
}

/**
 * 檢查當前頁面是否為 Gmail
 */
export function isGmailPage(): boolean {
  return window.location.href.includes("mail.google.com");
}

/**
 * 保存 OAuth tokens 到 localStorage
 */
export function saveOAuthTokens(tokens: any): void {
  try {
    localStorage.setItem("google_oauth_tokens", JSON.stringify(tokens));
    console.log("✅ OAuth tokens 已保存");
  } catch (error) {
    console.error("❌ 保存 OAuth tokens 失敗:", error);
  }
}

/**
 * 從 localStorage 獲取 OAuth tokens
 */
export function getOAuthTokens(): any | null {
  try {
    const storedTokens = localStorage.getItem("google_oauth_tokens");
    return storedTokens ? JSON.parse(storedTokens) : null;
  } catch (error) {
    console.error("❌ 獲取 OAuth tokens 失敗:", error);
    return null;
  }
}

/**
 * 清除保存的 OAuth tokens
 */
export function clearOAuthTokens(): void {
  try {
    localStorage.removeItem("google_oauth_tokens");
    console.log("✅ OAuth tokens 已清除");
  } catch (error) {
    console.error("❌ 清除 OAuth tokens 失敗:", error);
  }
}
