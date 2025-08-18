/**
 * 頁面資料提取相關的 TypeScript 介面定義
 * 用於標準化前端頁面資料格式，供 AI Agent 理解和操作
 */

/**
 * 可互動元素類型
 */
export type InteractiveElementType = 
  | 'button' 
  | 'link' 
  | 'input' 
  | 'select' 
  | 'textarea' 
  | 'checkbox' 
  | 'radio' 
  | 'submit'
  | 'image'
  | 'div_clickable';

/**
 * 可互動元素介面
 */
export interface InteractiveElement {
  /** 唯一識別碼 */
  id: string;
  
  /** 元素類型 */
  type: InteractiveElementType;
  
  /** CSS 選擇器（主要） */
  selector: string;
  
  /** 備用選擇器（用於容錯） */
  fallbackSelectors: string[];
  
  /** 元素顯示文字 */
  text: string;
  
  /** 元素屬性 */
  attributes: Record<string, string>;
  
  /** 元素位置 */
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** 是否可見 */
  isVisible: boolean;
  
  /** 是否可點擊 */
  isClickable: boolean;
  
  /** 父元素資訊 */
  parent?: {
    tagName: string;
    className: string;
    id: string;
  };
  
  /** 元素在頁面中的重要性評分 (0-1) */
  importance: number;
}

/**
 * 頁面元數據
 */
export interface PageMetadata {
  /** 時間戳 */
  timestamp: number;
  
  /** 視窗大小 */
  viewport: {
    width: number;
    height: number;
  };
  
  /** 滾動位置 */
  scrollPosition: {
    x: number;
    y: number;
  };
  
  /** 頁面載入狀態 */
  loadState: 'loading' | 'interactive' | 'complete';
  
  /** 頁面語言 */
  language?: string;
  
  /** 頁面編碼 */
  charset?: string;
  
  /** 頁面大小（字節） */
  contentSize?: number;
}

/**
 * 簡化的頁面資料介面（只包含url和content）
 */
export interface SimplePageData {
  /** 當前 URL */
  url: string;

  /** 頁面內容（YAML 格式，包含所有可操作元素） */
  content: string;
}

/**
 * 頁面資料主介面（保留原有完整格式，用於向後兼容）
 */
export interface PageData {
  /** 當前 URL */
  url: string;

  /** 頁面標題 */
  title: string;

  /** 頁面內容（Markdown 格式） */
  content: string;

  /** 原始 HTML（可選，用於調試） */
  rawHtml?: string;

  /** 可互動元素列表 */
  interactiveElements: InteractiveElement[];

  /** 頁面元數據 */
  metadata: PageMetadata;

  /** 頁面截圖（base64 編碼，可選） */
  screenshot?: string;

  /** 提取錯誤（如果有） */
  extractionErrors?: string[];
}

/**
 * 瀏覽器操作結果
 */
export interface BrowserActionResult {
  /** 操作是否成功 */
  success: boolean;
  
  /** 錯誤訊息（如果失敗） */
  error?: string;
  
  /** 操作後的新頁面資料 */
  pageData?: PageData;
  
  /** 操作截圖（可選） */
  screenshot?: string;
  
  /** 操作執行時間（毫秒） */
  executionTime?: number;
  
  /** 操作詳細資訊 */
  details?: {
    action: string;
    target: string;
    parameters: Record<string, any>;
  };
}

/**
 * 瀏覽器控制 API 介面
 */
export interface BrowserControlAPI {
  /** 點擊元素 */
  click(selector: string, options?: ClickOptions): Promise<BrowserActionResult>;
  
  /** 輸入文字 */
  type(selector: string, text: string, options?: TypeOptions): Promise<BrowserActionResult>;
  
  /** 滾動頁面 */
  scroll(direction: ScrollDirection, amount?: number): Promise<BrowserActionResult>;
  
  /** 導航到新頁面 */
  navigate(url: string, options?: NavigateOptions): Promise<BrowserActionResult>;
  
  /** 等待元素出現 */
  waitForElement(selector: string, timeout?: number): Promise<BrowserActionResult>;
  
  /** 等待頁面載入完成 */
  waitForNavigation(timeout?: number): Promise<BrowserActionResult>;
  
  /** 獲取當前頁面資料 */
  getPageData(): Promise<PageData>;
  
  /** 截取頁面截圖 */
  takeScreenshot(options?: ScreenshotOptions): Promise<string>;
  
  /** 執行 JavaScript */
  executeScript(script: string): Promise<any>;
}

/**
 * 點擊選項
 */
export interface ClickOptions {
  /** 點擊按鈕 */
  button?: 'left' | 'right' | 'middle';
  
  /** 是否雙擊 */
  doubleClick?: boolean;
  
  /** 點擊延遲（毫秒） */
  delay?: number;
  
  /** 是否強制點擊（即使元素不可見） */
  force?: boolean;
}

/**
 * 輸入選項
 */
export interface TypeOptions {
  /** 輸入延遲（毫秒） */
  delay?: number;
  
  /** 是否清空現有內容 */
  clear?: boolean;
  
  /** 是否按 Enter */
  pressEnter?: boolean;
}

/**
 * 滾動方向
 */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | 'top' | 'bottom';

/**
 * 導航選項
 */
export interface NavigateOptions {
  /** 等待載入完成 */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  
  /** 超時時間（毫秒） */
  timeout?: number;
}

/**
 * 截圖選項
 */
export interface ScreenshotOptions {
  /** 圖片格式 */
  format?: 'png' | 'jpeg';
  
  /** 圖片品質（0-100，僅 JPEG） */
  quality?: number;
  
  /** 是否截取整個頁面 */
  fullPage?: boolean;
  
  /** 截取區域 */
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 頁面提取配置
 */
export interface PageExtractionConfig {
  /** 是否包含原始 HTML */
  includeRawHtml?: boolean;
  
  /** 是否自動截圖 */
  autoScreenshot?: boolean;
  
  /** 最大內容長度 */
  maxContentLength?: number;
  
  /** 是否提取隱藏元素 */
  includeHiddenElements?: boolean;
  
  /** 元素重要性閾值 */
  importanceThreshold?: number;
  
  /** 自定義過濾器 */
  customFilters?: string[];
}
