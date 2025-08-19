# Electron 瀏覽器自動化解決方案完整指南

## 📋 問題分析

### 1. 核心問題

您的專案中，瀏覽器控制 API 無法正常工作的主要原因是：

- **架構層級問題**：瀏覽器控制代碼寫在 `main.js` 中，但實際的網頁內容在 `webview` 元素內
- **執行上下文錯誤**：`mainWindow.webContents.executeJavaScript()` 執行在 Next.js 頁面上下文中，而不是 webview 的網頁上下文中
- **選擇器範圍限制**：無法直接操作 webview 內部的 DOM 元素

### 2. 當前架構分析

```
Electron Main Process (main.js)
├── BrowserWindow (mainWindow)
│   └── Next.js App (/browser)
│       └── webview element
│           └── 實際網頁內容 (Gmail, 其他網站)
```

**問題**：`mainWindow.webContents.executeJavaScript()` 只能操作 Next.js 頁面，無法操作 webview 內的網頁。

## 🛠️ 解決方案

### 方案 1：直接操作 webview 內容（推薦）

#### 1.1 修改 BrowserView 組件

在 `BrowserView.tsx` 中添加瀏覽器控制方法：

```typescript:frontend/src/components/BrowserView.tsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Box } from '@mui/material';

export interface BrowserViewRef {
  click: (selector: string, options?: any) => Promise<any>;
  type: (selector: string, text: string, options?: any) => Promise<any>;
  scroll: (direction: string, amount?: number) => Promise<any>;
  navigate: (url: string) => Promise<any>;
  getPageData: () => Promise<any>;
  executeScript: (script: string) => Promise<any>;
}

interface BrowserViewProps {
  url?: string;
  path?: string;
  file?: string;
  mode?: 'web' | 'local';
  disablePointerEvents?: boolean;
}

const BrowserView = forwardRef<BrowserViewRef, BrowserViewProps>(({
  url,
  path,
  file,
  mode = 'web',
  disablePointerEvents = false
}, ref) => {
  const webviewRef = useRef<any>(null);

  // 暴露瀏覽器控制方法給父組件
  useImperativeHandle(ref, () => ({
    async click(selector: string, options: any = {}) {
      if (!webviewRef.current) {
        throw new Error('Webview not ready');
      }

      try {
        const result = await webviewRef.current.executeJavaScript(`
          (function() {
            const element = document.querySelector('${selector}');
            if (!element) {
              return { success: false, error: 'Element not found: ${selector}' };
            }

            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              return { success: false, error: 'Element is not visible' };
            }

            // 模擬點擊
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              button: ${options.button === 'right' ? 2 : options.button === 'middle' ? 1 : 0}
            });

            element.dispatchEvent(clickEvent);

            // 如果是雙擊
            if (${options.doubleClick || false}) {
              const dblClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              element.dispatchEvent(dblClickEvent);
            }

            return {
              success: true,
              elementText: element.textContent?.trim() || '',
              elementTag: element.tagName.toLowerCase()
            };
          })();
        `);

        // 等待一小段時間讓頁面響應
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }

        return result;
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async type(selector: string, text: string, options: any = {}) {
      if (!webviewRef.current) {
        throw new Error('Webview not ready');
      }

      try {
        const result = await webviewRef.current.executeJavaScript(`
          (function() {
            const element = document.querySelector('${selector}');
            if (!element) {
              return { success: false, error: 'Element not found: ${selector}' };
            }

            // 清空現有內容（如果需要）
            if (${options.clear || false}) {
              element.value = '';
            }

            // 聚焦元素
            element.focus();

            // 設置值
            element.value = '${text.replace(/'/g, "\\'")}';

            // 觸發 input 事件
            const inputEvent = new Event('input', { bubbles: true });
            element.dispatchEvent(inputEvent);

            // 觸發 change 事件
            const changeEvent = new Event('change', { bubbles: true });
            element.dispatchEvent(changeEvent);

            // 如果需要按 Enter
            if (${options.pressEnter || false}) {
              const keyEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
              });
              element.dispatchEvent(keyEvent);
            }

            return {
              success: true,
              value: element.value
            };
          })();
        `);

        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }

        return result;
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async scroll(direction: string, amount: number = 300) {
      if (!webviewRef.current) {
        throw new Error('Webview not ready');
      }

      try {
        const result = await webviewRef.current.executeJavaScript(`
          (function() {
            let scrollX = 0, scrollY = 0;

            switch ('${direction}') {
              case 'up':
                scrollY = -${amount};
                break;
              case 'down':
                scrollY = ${amount};
                break;
              case 'left':
                scrollX = -${amount};
                break;
              case 'right':
                scrollX = ${amount};
                break;
              case 'top':
                window.scrollTo(0, 0);
                return { success: true, position: { x: 0, y: 0 } };
              case 'bottom':
                window.scrollTo(0, document.body.scrollHeight);
                return { success: true, position: { x: window.scrollX, y: window.scrollY } };
            }

            window.scrollBy(scrollX, scrollY);

            return {
              success: true,
              position: {
                x: window.scrollX,
                y: window.scrollY
              }
            };
          })();
        `);

        return result;
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async navigate(url: string) {
      if (!webviewRef.current) {
        throw new Error('Webview not ready');
      }

      try {
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          targetUrl = `https://${url}`;
        }

        webviewRef.current.src = targetUrl;

        // 等待頁面載入
        await new Promise((resolve) => {
          const handleLoadStop = () => {
            webviewRef.current.removeEventListener('did-stop-loading', handleLoadStop);
            resolve(true);
          };
          webviewRef.current.addEventListener('did-stop-loading', handleLoadStop);
        });

        return { success: true, url: targetUrl };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async getPageData() {
      if (!webviewRef.current) {
        throw new Error('Webview not ready');
      }

      try {
        const result = await webviewRef.current.executeJavaScript(`
          (function() {
            try {
              const title = document.title || 'Untitled';
              const url = window.location.href;

              // 提取頁面內容
              const content = document.body.innerText || '';

              // 提取連結
              const links = Array.from(document.querySelectorAll('a[href]')).map(link => ({
                text: link.textContent?.trim() || '',
                href: link.href,
                selector: generateSelector(link)
              }));

              // 提取互動元素
              const interactiveElements = [];

              // 按鈕
              document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach((el, index) => {
                interactiveElements.push({
                  type: 'button',
                  text: el.textContent?.trim() || el.value || '',
                  selector: generateSelector(el),
                  index: index
                });
              });

              // 輸入框
              document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea').forEach((el, index) => {
                interactiveElements.push({
                  type: 'input',
                  text: el.placeholder || el.name || '',
                  selector: generateSelector(el),
                  index: index
                });
              });

              function generateSelector(element) {
                if (element.id) return '#' + element.id;
                if (element.className) return '.' + element.className.split(' ')[0];
                return element.tagName.toLowerCase() + ':nth-of-type(' + (Array.from(element.parentNode.children).filter(c => c.tagName === element.tagName).indexOf(element) + 1) + ')';
              }

              return {
                title,
                url,
                content: content.substring(0, 10000), // 限制內容長度
                links,
                interactiveElements
              };
            } catch (e) {
              return { error: 'Failed to extract content: ' + e.message };
            }
          })();
        `);

        return result;
      } catch (error) {
        return { error: error.message };
      }
    },

    async executeScript(script: string) {
      if (!webviewRef.current) {
        throw new Error('Webview not ready');
      }

      try {
        const result = await webviewRef.current.executeJavaScript(script);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }), [webviewRef]);

  // ... existing code ...
});

export default BrowserView;
```

#### 1.2 修改 browser.tsx 頁面

更新 `browser.tsx` 以使用新的瀏覽器控制方法：

```typescript:frontend/src/pages/browser.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import BrowserView, { BrowserViewRef } from '@/components/BrowserView';
import ViewToggle from '@/components/ViewToggle';
import AgentPanel from '@/components/AgentPanel';
import TitleBar from '@/components/TitleBar';

type ViewMode = 'left-only' | 'right-only' | 'both';

const BrowserPage: React.FC = () => {
  const router = useRouter();
  const { url, path, mode, file } = router.query;
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [leftWidth, setLeftWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url as string || '');
  const browserViewRef = useRef<BrowserViewRef>(null);
  const isLocalMode = mode === 'local';

  // 暴露瀏覽器控制方法給全域
  useEffect(() => {
    if (browserViewRef.current && typeof window !== 'undefined') {
      (window as any).browserControl = {
        click: (selector: string, options?: any) =>
          browserViewRef.current?.click(selector, options),
        type: (selector: string, text: string, options?: any) =>
          browserViewRef.current?.type(selector, text, options),
        scroll: (direction: string, amount?: number) =>
          browserViewRef.current?.scroll(direction, amount),
        navigate: (url: string) =>
          browserViewRef.current?.navigate(url),
        getPageData: () =>
          browserViewRef.current?.getPageData(),
        executeScript: (script: string) =>
          browserViewRef.current?.executeScript(script)
      };
    }
  }, [browserViewRef.current]);

  // ... existing code ...

  return (
    <Box sx={{ /* existing styles */ }}>
      {/* Title Bar */}
      <TitleBar
        title={isLocalMode ? (path as string || 'Local Files') : (currentUrl || url as string || 'Browser')}
        showHomeButton={true}
        showUrlInput={!isLocalMode}
        onUrlChange={handleUrlChange}
      />

      {/* Main Content Area */}
      <Box sx={{ /* existing styles */ }}>
        {/* Left Panel - Browser View */}
        {(viewMode === 'left-only' || viewMode === 'both') && (
          <Box sx={{ /* existing styles */ }}>
            <BrowserView
              ref={browserViewRef}
              url={currentUrl || url as string}
              path={path as string}
              file={file as string}
              mode={isLocalMode ? 'local' : 'web'}
              disablePointerEvents={isDragging}
            />
          </Box>
        )}

        {/* ... existing resizer and right panel code ... */}
      </Box>
    </Box>
  );
};

export default BrowserPage;
```

### 方案 2：使用 Electron 的 BrowserView API（進階）

#### 2.1 創建獨立的 BrowserView

在 `main.js` 中創建獨立的 BrowserView 來控制網頁：

```javascript:frontend/electron/main.js
const { app, BrowserWindow, ipcMain, BrowserView } = require('electron');

let mainWindow;
let browserView;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 創建獨立的 BrowserView
  browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.setBrowserView(browserView);

  // 設置 BrowserView 的位置和大小
  const bounds = mainWindow.getBounds();
  browserView.setBounds({
    x: 0,
    y: 60, // 留出標題欄空間
    width: bounds.width,
    height: bounds.height - 60
  });

  // 載入初始頁面
  browserView.webContents.loadURL('https://www.google.com');

  mainWindow.loadURL('http://localhost:4081');
}

// 更新瀏覽器控制 IPC 處理器
ipcMain.handle('browser-click', async (event, selector, options = {}) => {
  try {
    if (!browserView) {
      throw new Error('BrowserView not available');
    }

    const result = await browserView.webContents.executeJavaScript(`
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) {
          return { success: false, error: 'Element not found' };
        }

        element.click();
        return { success: true, elementText: element.textContent?.trim() || '' };
      })();
    `);

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 其他瀏覽器控制方法類似...
```

### 方案 3：混合方案（推薦用於生產環境）

結合方案 1 和方案 2 的優點：

1. **使用 webview** 進行頁面顯示和基本互動
2. **使用 BrowserView** 進行自動化操作
3. **提供統一的 API 介面**

## 🔧 實作步驟

### 步驟 1：更新 BrowserView 組件

1. 修改 `BrowserView.tsx`，添加 `useImperativeHandle` 和瀏覽器控制方法
2. 確保所有方法都通過 webview 的 `executeJavaScript` 執行

### 步驟 2：更新 browser.tsx 頁面

1. 使用 `useRef` 引用 BrowserView 組件
2. 將瀏覽器控制方法暴露到全域 `window.browserControl`

### 步驟 3：測試瀏覽器控制

1. 在瀏覽器控制台中測試：

```javascript
// 點擊元素
await window.browserControl.click('button[type="submit"]');

// 輸入文字
await window.browserControl.type('input[name="q"]', "Hello World");

// 滾動頁面
await window.browserControl.scroll("down", 500);

// 獲取頁面數據
const pageData = await window.browserControl.getPageData();
console.log(pageData);
```

## 🚀 進階功能

### 1. 等待元素出現

```typescript
async waitForElement(selector: string, timeout: number = 5000) {
  if (!webviewRef.current) {
    throw new Error('Webview not ready');
  }

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await webviewRef.current.executeJavaScript(`
        !!document.querySelector('${selector}')
      `);

      if (result) {
        return { success: true, found: true };
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // 繼續等待
    }
  }

  return { success: false, found: false, error: 'Timeout' };
}
```

### 2. 智能等待頁面載入

```typescript
async waitForNavigation(timeout: number = 10000) {
  if (!webviewRef.current) {
    throw new Error('Webview not ready');
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Navigation timeout'));
    }, timeout);

    const handleLoadStop = () => {
      clearTimeout(timer);
      webviewRef.current.removeEventListener('did-stop-loading', handleLoadStop);
      resolve({ success: true });
    };

    webviewRef.current.addEventListener('did-stop-loading', handleLoadStop);
  });
}
```

### 3. 截圖功能

```typescript
async takeScreenshot(options: any = {}) {
  if (!webviewRef.current) {
    throw new Error('Webview not ready');
  }

  try {
    const result = await webviewRef.current.executeJavaScript(`
      (function() {
        // 創建 canvas 來截圖
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 這裡需要更複雜的截圖邏輯
        // 可以使用 html2canvas 或其他庫

        return canvas.toDataURL('image/png');
      })();
    `);

    return { success: true, screenshot: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 📊 效能優化

### 1. 批量操作

```typescript
async batchExecute(operations: Array<{type: string, ...any}>) {
  const results = [];

  for (const operation of operations) {
    try {
      let result;
      switch (operation.type) {
        case 'click':
          result = await this.click(operation.selector, operation.options);
          break;
        case 'type':
          result = await this.type(operation.selector, operation.text, operation.options);
          break;
        // ... 其他操作
      }
      results.push(result);

      // 添加延遲避免操作過快
      if (operation.delay) {
        await new Promise(resolve => setTimeout(resolve, operation.delay));
      }
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}
```

### 2. 事件節流

```typescript
private throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
}
```

## 🧪 測試和調試

### 1. 開發者工具

```typescript
// 在 BrowserView 中添加調試方法
async openDevTools() {
  if (webviewRef.current) {
    webviewRef.current.openDevTools();
  }
}

async getConsoleLogs() {
  if (!webviewRef.current) return [];

  try {
    const logs = await webviewRef.current.executeJavaScript(`
      window.console.logs || []
    `);
    return logs;
  } catch (error) {
    return [];
  }
}
```

### 2. 錯誤處理和日誌

```typescript
private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }

  // 可以發送到日誌服務或保存到文件
}
```

## 📝 總結

通過這個解決方案，您可以：

1. **直接操作 webview 內容**：所有瀏覽器控制操作都在正確的上下文中執行
2. **保持架構清晰**：BrowserView 組件負責所有瀏覽器相關操作
3. **提供統一的 API**：通過 `window.browserControl` 可以從任何地方調用
4. **支援進階功能**：等待元素、智能導航、批量操作等
5. **效能優化**：事件節流、批量操作、錯誤處理

這個方案解決了您原始架構中的核心問題，讓瀏覽器控制 API 能夠正常工作，就像 Playwright 一樣強大和可靠。
