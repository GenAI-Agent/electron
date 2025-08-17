const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const OAuthUtils = require('./oauth-utils');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let oauthUtils;
let httpServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      webviewTag: true // Enable webview tag
    },
    titleBarStyle: 'hidden', // Completely hide title bar
    frame: false, // Remove window frame completely
    show: false,
    titleBarOverlay: false // Disable title bar overlay
  });

  const startUrl = isDev
    ? process.env.NEXT_URL || 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Hide native traffic lights on macOS
    if (process.platform === 'darwin') {
      mainWindow.setWindowButtonVisibility(false);
    }

    // Set user agent for webviews to avoid bot detection
    mainWindow.webContents.session.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  startHttpServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('navigate-to-url', async (event, url) => {
  return { success: true, url };
});

// Window control handlers
ipcMain.handle('close-window', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

ipcMain.handle('minimize-window', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  }
});

ipcMain.handle('get-browser-state', async () => {
  return {
    currentUrl: mainWindow?.webContents?.getURL() || '',
    canGoBack: mainWindow?.webContents?.canGoBack() || false,
    canGoForward: mainWindow?.webContents?.canGoForward() || false
  };
});

// File system handlers
ipcMain.handle('get-desktop-path', async () => {
  return path.join(os.homedir(), 'Desktop');
});

ipcMain.handle('get-documents-path', async () => {
  return path.join(os.homedir(), 'Documents');
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return {
      success: true,
      items: items.map(item => ({
        name: item.name,
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
        path: path.join(dirPath, item.name)
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      success: true,
      stats: {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    // 檢查文件大小，避免讀取過大的文件
    const stats = await fs.promises.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB 限制

    if (stats.size > maxSize) {
      throw new Error('文件過大，無法預覽');
    }

    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`無法讀取文件: ${error.message}`);
  }
});

// OAuth 2.0 handlers
ipcMain.handle('oauth-start-flow', async (event, config) => {
  try {
    oauthUtils = new OAuthUtils();

    // Build authorization URL
    const authUrl = oauthUtils.buildAuthorizationUrl(config);

    // Start callback server
    const callbackPromise = oauthUtils.startCallbackServer();

    // Create a new window for OAuth instead of using system browser
    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: 'oauth-session' // Use separate session for OAuth
      }
    });

    // Load the authorization URL
    authWindow.loadURL(authUrl);

    // Wait for callback
    const { code, state } = await callbackPromise;

    // Verify state parameter
    if (state !== oauthUtils.state) {
      throw new Error('State parameter mismatch - possible CSRF attack');
    }

    // Get cookies from auth window and copy to main window
    const cookies = await authWindow.webContents.session.cookies.get({
      domain: '.google.com'
    });

    // 詳細記錄所有獲取到的 cookies
    console.log('\n=== OAuth 認證完成，獲取到的 Cookies ===');
    console.log(`總共獲取到 ${cookies.length} 個 cookies:`);

    cookies.forEach((cookie, index) => {
      console.log(`\nCookie ${index + 1}:`);
      console.log(`  名稱: ${cookie.name}`);
      console.log(`  值: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
      console.log(`  域名: ${cookie.domain}`);
      console.log(`  路徑: ${cookie.path}`);
      console.log(`  安全: ${cookie.secure}`);
      console.log(`  HttpOnly: ${cookie.httpOnly}`);
      console.log(`  過期時間: ${cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString() : '會話結束'}`);
    });

    // 也獲取所有 Google 相關的 cookies (不只 .google.com)
    const allGoogleCookies = await authWindow.webContents.session.cookies.get({});
    const googleRelatedCookies = allGoogleCookies.filter(cookie =>
      cookie.domain.includes('google') ||
      cookie.domain.includes('gstatic') ||
      cookie.domain.includes('googleapis')
    );

    console.log(`\n=== 所有 Google 相關 Cookies (${googleRelatedCookies.length} 個) ===`);
    googleRelatedCookies.forEach((cookie, index) => {
      console.log(`${index + 1}. ${cookie.name} @ ${cookie.domain}`);
    });

    // Copy cookies to both main window session and browser session
    if (cookies.length > 0) {
      const { session } = require('electron');
      const browserSession = session.fromPartition('persist:browser');

      console.log('\n=== 開始複製 Cookies ===');
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (const cookie of cookies) {
        try {
          // Skip problematic cookies
          if (cookie.name.startsWith('__Host-') || cookie.name.startsWith('__Secure-')) {
            console.log(`❌ Skipping secure prefix cookie: ${cookie.name}`);
            skipCount++;
            continue;
          }

          // Skip cookies with invalid domains
          if (!cookie.domain || cookie.domain === '') {
            console.log(`❌ Skipping cookie with invalid domain: ${cookie.name}`);
            skipCount++;
            continue;
          }

          // Fix domain for URL construction
          let urlDomain = cookie.domain;
          if (urlDomain.startsWith('.')) {
            urlDomain = urlDomain.substring(1); // Remove leading dot for URL
          }

          // 先嘗試複製所有 cookies，不過濾
          console.log(`🔄 嘗試複製 cookie: ${cookie.name} @ ${cookie.domain}`);

          const cookieData = {
            url: `https://${urlDomain}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain, // Keep original domain format
            path: cookie.path || '/',
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate
          };

          // Copy to main window session
          if (mainWindow) {
            await mainWindow.webContents.session.cookies.set(cookieData);
          }

          // Copy to browser session (used by browser page)
          await browserSession.cookies.set(cookieData);

          console.log(`✅ Successfully copied cookie: ${cookie.name}`);
          successCount++;

        } catch (err) {
          console.warn(`❌ Failed to set cookie ${cookie.name}:`, err.message);
          errorCount++;
        }
      }

      console.log(`\n=== Cookie 複製結果 ===`);
      console.log(`✅ 成功: ${successCount}`);
      console.log(`❌ 跳過: ${skipCount}`);
      console.log(`🚫 錯誤: ${errorCount}`);
    } else {
      console.log('⚠️ 沒有獲取到任何 cookies');
    }

    // Close auth window
    authWindow.close();

    return { success: true, code, state, cookiesCopied: cookies.length };
  } catch (error) {
    console.error('OAuth flow error:', error);
    if (oauthUtils) {
      oauthUtils.stopCallbackServer();
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oauth-exchange-token', async (event, config) => {
  try {
    if (!oauthUtils) {
      throw new Error('OAuth flow not started');
    }

    const tokenResponse = await oauthUtils.exchangeCodeForToken(config);

    // Clean up
    oauthUtils = null;

    return { success: true, tokens: tokenResponse };
  } catch (error) {
    console.error('Token exchange error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('oauth-refresh-token', async (event, config) => {
  try {
    const tempOAuth = new OAuthUtils();
    const tokenResponse = await tempOAuth.refreshAccessToken(config);

    return { success: true, tokens: tokenResponse };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, error: error.message };
  }
});

// Browser Control IPC Handlers
ipcMain.handle('browser-click', async (event, selector, options = {}) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const script = `
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) {
          throw new Error('Element not found: ${selector}');
        }

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          throw new Error('Element is not visible');
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
    `;

    const result = await webContents.executeJavaScript(script);

    // 等待一小段時間讓頁面響應
    await new Promise(resolve => setTimeout(resolve, options.delay || 100));

    return {
      success: true,
      ...result,
      executionTime: Date.now()
    };

  } catch (error) {
    console.error('Browser click error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-type', async (event, selector, text, options = {}) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const script = `
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) {
          throw new Error('Element not found: ${selector}');
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
    `;

    const result = await webContents.executeJavaScript(script);

    // 等待一小段時間
    await new Promise(resolve => setTimeout(resolve, options.delay || 100));

    return {
      success: true,
      ...result,
      executionTime: Date.now()
    };

  } catch (error) {
    console.error('Browser type error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-scroll', async (event, direction, amount = 300) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const script = `
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
    `;

    const result = await webContents.executeJavaScript(script);
    return result;

  } catch (error) {
    console.error('Browser scroll error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-navigate', async (event, url, options = {}) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    // 載入新頁面
    await webContents.loadURL(url);

    // 等待頁面載入完成
    const timeout = options.timeout || 10000;
    const waitUntil = options.waitUntil || 'domcontentloaded';

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Navigation timeout'));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
        webContents.removeListener('dom-ready', onDomReady);
        webContents.removeListener('did-finish-load', onFinishLoad);
      };

      const onDomReady = () => {
        if (waitUntil === 'domcontentloaded') {
          cleanup();
          resolve();
        }
      };

      const onFinishLoad = () => {
        if (waitUntil === 'load') {
          cleanup();
          resolve();
        }
      };

      webContents.once('dom-ready', onDomReady);
      webContents.once('did-finish-load', onFinishLoad);

      // 如果是 networkidle，等待額外時間
      if (waitUntil === 'networkidle') {
        setTimeout(() => {
          cleanup();
          resolve();
        }, 2000);
      }
    });

    return {
      success: true,
      url: webContents.getURL(),
      title: webContents.getTitle()
    };

  } catch (error) {
    console.error('Browser navigate error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-wait-element', async (event, selector, timeout = 5000) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const script = `
      new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkElement = () => {
          const element = document.querySelector('${selector}');
          if (element) {
            resolve({
              success: true,
              found: true,
              elementText: element.textContent?.trim() || ''
            });
            return;
          }

          if (Date.now() - startTime > ${timeout}) {
            resolve({
              success: false,
              found: false,
              error: 'Element not found within timeout'
            });
            return;
          }

          setTimeout(checkElement, 100);
        };

        checkElement();
      });
    `;

    const result = await webContents.executeJavaScript(script);
    return result;

  } catch (error) {
    console.error('Browser wait element error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-wait-navigation', async (event, timeout = 10000) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Navigation wait timeout'));
      }, timeout);

      webContents.once('did-finish-load', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    return {
      success: true,
      url: webContents.getURL(),
      title: webContents.getTitle()
    };

  } catch (error) {
    console.error('Browser wait navigation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-screenshot', async (event, options = {}) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const image = await webContents.capturePage();
    const buffer = image.toPNG();
    const base64 = buffer.toString('base64');

    return {
      success: true,
      screenshot: base64,
      format: 'png'
    };

  } catch (error) {
    console.error('Browser screenshot error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('browser-execute-script', async (event, script) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const result = await webContents.executeJavaScript(script);

    return {
      success: true,
      result: result
    };

  } catch (error) {
    console.error('Browser execute script error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * 統一的 webview URL 提取函數
 * 優先從 webview 獲取真實 URL，回退到 URL 參數解析
 */
async function extractRealWebviewUrl(webContents, maxRetries = 3) {
  const currentUrl = webContents.getURL();
  console.log('🔍 當前 URL:', currentUrl);

  // 嘗試從 webview 獲取真實 URL（帶重試機制）
  for (let i = 0; i < maxRetries; i++) {
    try {
      const webviewInfo = await webContents.executeJavaScript(`
        (function() {
          const webview = document.querySelector('webview');
          if (webview && webview.src && !webview.src.includes('about:blank')) {
            try {
              return {
                url: webview.src,
                title: webview.getTitle ? webview.getTitle() : null,
                isLoaded: webview.src !== 'about:blank'
              };
            } catch (e) {
              return {
                url: webview.src,
                title: null,
                isLoaded: webview.src !== 'about:blank'
              };
            }
          }
          return null;
        })();
      `);

      if (webviewInfo && webviewInfo.url && webviewInfo.isLoaded) {
        console.log('✅ 從 webview 獲取到真實 URL:', webviewInfo.url);
        return {
          url: webviewInfo.url,
          title: webviewInfo.title,
          source: 'webview'
        };
      }

      // 如果 webview 還沒載入完成，等待一下再重試
      if (i < maxRetries - 1) {
        console.log(`⏳ webview 還未載入完成，等待重試 (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 次嘗試獲取 webview 信息失敗:`, error);
    }
  }

  // 回退到 URL 參數解析
  console.log('🔄 回退到 URL 參數解析');
  if (currentUrl.includes('/browser?url=')) {
    const urlParams = new URL(currentUrl).searchParams;
    const urlParam = urlParams.get('url');

    if (urlParam) {
      const targetUrl = urlParam.startsWith('http') ? urlParam : `https://${urlParam}`;
      console.log('✅ 從 URL 參數解析得到:', targetUrl);
      return {
        url: targetUrl,
        title: null,
        source: 'url_param'
      };
    }
  }

  console.log('❌ 無法提取真實 URL');
  return {
    url: currentUrl,
    title: null,
    source: 'fallback'
  };
}

/**
 * 從 webview 提取真實的 HTML 內容並轉換為 markdown
 */
async function extractWebviewContent(webContents) {
  try {
    console.log('📄 開始從 webview 提取內容...');

    // 首先檢查 webview 是否存在
    const webviewExists = await webContents.executeJavaScript(`
      !!document.querySelector('webview')
    `);

    if (!webviewExists) {
      console.error('❌ webview 元素不存在');
      return { error: 'webview not found' };
    }

    // 通過 webview 的 executeJavaScript 方法獲取內容
    try {
      const contentData = await webContents.executeJavaScript(`
        (async function() {
          const webview = document.querySelector('webview');
          if (!webview) {
            return { error: 'webview not found' };
          }

          try {
            // 使用 webview 的 executeJavaScript 方法來獲取內容
            const result = await webview.executeJavaScript(\`
              (function() {
                try {
                  // 提取標題
                  const title = document.title || 'Untitled';

                  // 單一最佳提取策略：遍歷所有元素，生成完整的 markdown
                  const extractionResult = extractAllElementsAsMarkdown();
                  const content = extractionResult.content;
                  const interactiveElements = extractionResult.interactiveElements;
                  const links = extractionResult.links;

                  // 遍歷所有元素並轉換為 markdown (按順序，整合所有元素)
                  function extractAllElementsAsMarkdown() {
                    console.log('開始按順序遍歷所有元素生成完整的 markdown');

                    let markdown = '';
                    const links = []; // 只保留 links，用於返回數據

                    // 頁面標題和基本信息
                    const pageTitle = document.title || 'Untitled Page';
                    const currentUrl = window.location.href;
                    markdown += '# ' + cleanText(pageTitle) + '\\\\n\\\\n';
                    markdown += '**URL:** ' + currentUrl + '\\\\n\\\\n';

                    // 按順序遍歷所有可見元素，直接生成完整的 markdown
                    const allElements = document.body.querySelectorAll('*');
                    const processedElements = new Set(); // 避免重複處理
                    const selectorCounts = {}; // 追蹤 selector 使用次數

                    console.log('總共找到元素數量:', allElements.length);

                    // 按 DOM 順序處理每個元素
                    for (let i = 0; i < allElements.length && i < 1500; i++) {
                      const element = allElements[i];

                      // 跳過已處理的元素
                      if (processedElements.has(element)) continue;

                      // 跳過不可見或不需要的元素
                      if (isElementHidden(element) || isElementUnwanted(element)) continue;

                      const elementInfo = convertElementToMarkdownWithDetails(element, selectorCounts);
                      if (elementInfo && elementInfo.markdown) {
                        // 直接按順序添加到 markdown
                        markdown += elementInfo.markdown;

                        // 只收集連結數據用於返回
                        if (elementInfo.isLink) {
                          links.push(elementInfo.elementData);
                        }

                        processedElements.add(element);
                      }
                    }

                    // 限制最大字數為 30000 字
                    if (markdown.length > 30000) {
                      console.log('內容超過 30000 字，進行截斷');
                      markdown = markdown.substring(0, 30000) + '\\\\n\\\\n[內容已截斷，總長度超過 30000 字]';
                    }

                    console.log('最終 markdown 長度:', markdown.length);
                    console.log('連結數量:', links.length);

                    return {
                      content: markdown,
                      links: links
                    };
                  }

                  // 清理文字，移除特殊字符和編碼問題
                  function cleanText(text) {
                    if (!text) return '';
                    return text
                      // 移除零寬字符
                      .replace(/[\\u200b\\u200c\\u200d\\u200e\\u200f\\ufeff]/g, '')
                      // 移除非斷行空格
                      .replace(/\\u00a0/g, ' ')
                      // 移除多餘空白
                      .replace(/\\s+/g, ' ')
                      // 移除前後空白
                      .trim();
                  }

                  // 檢查元素是否隱藏
                  function isElementHidden(element) {
                    const style = window.getComputedStyle(element);
                    return style.display === 'none' ||
                           style.visibility === 'hidden' ||
                           style.opacity === '0' ||
                           element.offsetWidth === 0 ||
                           element.offsetHeight === 0;
                  }

                  // 檢查元素是否不需要
                  function isElementUnwanted(element) {
                    const unwantedTags = ['script', 'style', 'meta', 'link', 'noscript'];
                    const unwantedClasses = ['ad', 'advertisement', 'popup', 'modal', 'overlay'];

                    // 檢查標籤名
                    if (unwantedTags.includes(element.tagName.toLowerCase())) {
                      return true;
                    }

                    // 檢查類名
                    if (element.className && typeof element.className === 'string') {
                      const classes = element.className.toLowerCase();
                      if (unwantedClasses.some(cls => classes.includes(cls))) {
                        return true;
                      }
                    }

                    return false;
                  }

                  // 將單個元素轉換為 markdown（按 HTML 標籤順序處理）
                  function convertElementToMarkdownWithDetails(element, selectorCounts) {
                    const tagName = element.tagName.toLowerCase();
                    let markdown = '';
                    let isInteractive = false;
                    let isLink = false;
                    let elementData = null;

                    // 生成選擇器和索引
                    const selector = generatePreciseSelector(element);
                    selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
                    const index = selectorCounts[selector];

                    switch (tagName) {
                      case 'h1':
                      case 'h2':
                      case 'h3':
                      case 'h4':
                      case 'h5':
                      case 'h6':
                        const level = parseInt(tagName.charAt(1)) + 1; // +1 因為頁面標題已經是 h1
                        const headingText = cleanText(element.textContent);
                        if (headingText && headingText.length > 0) {
                          markdown = '\\\\n' + '#'.repeat(level) + ' ' + headingText + '\\\\n\\\\n';
                        }
                        break;

                      case 'p':
                        const pText = cleanText(element.textContent);
                        if (pText && pText.length > 5) {
                          markdown = pText + '\\\\n\\\\n';
                        }
                        break;

                      case 'div':
                        // 處理 div 元素 - 只提取直接文字內容
                        const divText = Array.from(element.childNodes)
                          .filter(node => node.nodeType === Node.TEXT_NODE)
                          .map(node => cleanText(node.textContent))
                          .join(' ')
                          .trim();

                        if (divText && divText.length > 5) {
                          // 檢查是否是可點擊的
                          if (element.onclick || element.getAttribute('onclick') || element.style.cursor === 'pointer' || element.getAttribute('role') === 'button') {
                            isInteractive = true;
                            elementData = {
                              type: 'clickable-div',
                              text: divText,
                              selector: selector,
                              index: index,
                              id: element.id || '',
                              className: element.className || '',
                              tagName: tagName
                            };
                            markdown = '### 🎯 可點擊區域: ' + divText.substring(0, 50) + '\\\\n';
                            markdown += '- **動作**: 點擊執行動作\\\\n';
                            markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                            markdown += '- **索引**: ' + index + '\\\\n';
                            markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\n\\\\n';
                          } else {
                            markdown = divText + '\\\\n\\\\n';
                          }
                        }
                        break;

                      case 'a':
                        const linkText = cleanText(element.textContent);
                        const href = element.href;
                        if (linkText && href && linkText.length > 0) {
                          // 跳過已經在表格行中處理過的連結
                          const parentRow = element.closest('tr[role="row"], tr.zA');
                          if (parentRow) {
                            // 這個連結已經在表格行中處理過了，跳過
                            break;
                          }

                          isLink = true;
                          elementData = {
                            type: 'link',
                            text: linkText,
                            href: href,
                            selector: selector,
                            index: index,
                            id: element.id || '',
                            className: element.className || '',
                            tagName: tagName
                          };
                          markdown = '### 🔗 連結: ' + linkText + '\\\\n';
                          markdown += '- **目標URL**: ' + href + '\\\\n';
                          markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                          markdown += '- **索引**: ' + index + '\\\\n';
                          markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\n\\\\n';
                        }
                        break;

                      case 'button':
                        const buttonText = cleanText(element.textContent || element.value || element.getAttribute('aria-label') || 'Button');
                        if (buttonText && buttonText.length > 0) {
                          isInteractive = true;
                          elementData = {
                            type: 'button',
                            text: buttonText,
                            selector: selector,
                            index: index,
                            id: element.id || '',
                            className: element.className || '',
                            tagName: tagName
                          };
                          markdown = '### 🔘 按鈕: ' + buttonText + '\\\\n';
                          markdown += '- **動作**: 點擊執行動作\\\\n';
                          markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                          markdown += '- **索引**: ' + index + '\\\\n';
                          markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\n\\\\n';
                        }
                        break;

                      case 'input':
                        const inputType = element.type || 'text';
                        const inputLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Input');
                        if (inputLabel && inputLabel.length > 0) {
                          isInteractive = true;
                          elementData = {
                            type: 'input',
                            inputType: inputType,
                            text: inputLabel,
                            selector: selector,
                            index: index,
                            id: element.id || '',
                            className: element.className || '',
                            tagName: tagName,
                            value: element.value || ''
                          };
                          markdown = '### 📝 輸入框 (' + inputType + '): ' + inputLabel + '\\\\n';
                          markdown += '- **動作**: ' + (inputType === 'submit' ? '點擊提交' : '輸入文字') + '\\\\n';
                          if (element.value) {
                            markdown += '- **當前值**: ' + cleanText(element.value) + '\\\\n';
                          }
                          markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                          markdown += '- **索引**: ' + index + '\\\\n';
                          if (inputType === 'submit' || inputType === 'button') {
                            markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\n\\\\n';
                          } else {
                            markdown += '- **使用方法**: 使用 browser_type_tool("' + selector + '", "要輸入的文字", ' + index + ')\\\\n\\\\n';
                          }
                        }
                        break;

                      case 'textarea':
                        const textareaLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Textarea');
                        if (textareaLabel && textareaLabel.length > 0) {
                          isInteractive = true;
                          elementData = {
                            type: 'textarea',
                            text: textareaLabel,
                            selector: selector,
                            index: index,
                            id: element.id || '',
                            className: element.className || '',
                            tagName: tagName,
                            value: element.value || ''
                          };
                          markdown = '### 📝 文字區域: ' + textareaLabel + '\\\\n';
                          markdown += '- **動作**: 輸入多行文字\\\\n';
                          if (element.value) {
                            markdown += '- **當前值**: ' + cleanText(element.value.substring(0, 100)) + (element.value.length > 100 ? '...' : '') + '\\\\n';
                          }
                          markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                          markdown += '- **索引**: ' + index + '\\\\n';
                          markdown += '- **使用方法**: 使用 browser_type_tool("' + selector + '", "要輸入的文字", ' + index + ')\\\\n\\\\n';
                        }
                        break;

                      case 'select':
                        const selectLabel = cleanText(element.name || element.id || element.getAttribute('aria-label') || 'Select');
                        if (selectLabel && selectLabel.length > 0) {
                          isInteractive = true;
                          const options = Array.from(element.options || []).map(opt => cleanText(opt.text));
                          elementData = {
                            type: 'select',
                            text: selectLabel,
                            selector: selector,
                            index: index,
                            id: element.id || '',
                            className: element.className || '',
                            tagName: tagName,
                            options: options
                          };
                          markdown = '### 📋 下拉選單: ' + selectLabel + '\\\\n';
                          markdown += '- **動作**: 選擇選項\\\\n';
                          if (options.length > 0) {
                            markdown += '- **可選項目**: ' + options.join(', ') + '\\\\n';
                          }
                          markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                          markdown += '- **索引**: ' + index + '\\\\n';
                          markdown += '- **使用方法**: 使用 browser_select_option_tool("' + selector + '", ["選項值"], ' + index + ')\\\\n\\\\n';
                        }
                        break;

                      case 'table':
                        markdown = extractTableAsMarkdown(element);
                        break;

                      case 'tr':
                        // 特別處理表格行（如 Gmail 郵件列表）
                        if (element.getAttribute('role') === 'row' || element.classList.contains('zA')) {
                          const rowText = cleanText(element.textContent);
                          if (rowText && rowText.length > 10) {
                            // 查找這一行中的所有連結
                            const rowLinks = element.querySelectorAll('a[href]');
                            let emailLink = null;

                            console.log('郵件行找到連結數量:', rowLinks.length);

                            // 找到郵件的主要連結
                            for (const link of rowLinks) {
                              console.log('檢查連結:', link.href);
                              if (link.href && link.href.includes('mail.google.com')) {
                                // 找到包含郵件 ID 的連結
                                if (link.href.includes('#inbox/') || link.href.includes('#thread/') || link.href.includes('#label/')) {
                                  emailLink = {
                                    href: link.href,
                                    text: cleanText(link.textContent) || '開啟郵件'
                                  };
                                  console.log('找到郵件連結:', emailLink.href);
                                  break;
                                }
                              }
                            }

                            // 如果沒找到特定連結，嘗試使用第一個連結或構建點擊方式
                            if (!emailLink) {
                              if (rowLinks.length > 0) {
                                const firstLink = rowLinks[0];
                                emailLink = {
                                  href: firstLink.href,
                                  text: cleanText(firstLink.textContent) || '郵件連結'
                                };
                              } else {
                                // 沒有連結，使用點擊行的方式
                                emailLink = {
                                  href: 'javascript:void(0)',
                                  text: '點擊開啟郵件'
                                };
                              }
                            }

                            isInteractive = true;
                            elementData = {
                              type: 'email-row',
                              text: rowText.substring(0, 200),
                              selector: selector,
                              index: index,
                              id: element.id || '',
                              className: element.className || '',
                              tagName: tagName,
                              emailLink: emailLink
                            };

                            markdown = '### � 郵件: ' + rowText.substring(0, 100) + '\\\\n';
                            if (emailLink) {
                              markdown += '- **郵件連結**: [' + emailLink.text + '](' + emailLink.href + ')\\\\n';
                            }
                            markdown += '- **動作**: 點擊開啟郵件\\\\n';
                            markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                            markdown += '- **索引**: ' + index + '\\\\n';
                            markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\n\\\\n';

                            // 如果有郵件連結，標記為連結類型
                            if (emailLink) {
                              isLink = true;
                            }
                          }
                        }
                        break;

                      case 'ul':
                      case 'ol':
                        // 只處理直接的列表，避免嵌套重複
                        if (!element.closest('ul, ol')) {
                          markdown = '\\\\n';
                          const listItems = element.querySelectorAll('li');
                          listItems.forEach((li, liIndex) => {
                            const liText = cleanText(li.textContent);
                            if (liText && liText.length > 0) {
                              const prefix = tagName === 'ul' ? '- ' : (liIndex + 1) + '. ';
                              markdown += prefix + liText + '\\\\n';
                            }
                          });
                          markdown += '\\\\n';
                        }
                        break;

                      case 'div':
                      case 'span':
                        // 對於 div 和 span，只提取直接文字內容（不包含子元素）
                        const directText = Array.from(element.childNodes)
                          .filter(node => node.nodeType === Node.TEXT_NODE)
                          .map(node => cleanText(node.textContent))
                          .join(' ')
                          .trim();

                        if (directText && directText.length > 5) {
                          // 檢查是否是可點擊的
                          if (element.onclick || element.getAttribute('onclick') || element.style.cursor === 'pointer' || element.getAttribute('role') === 'button') {
                            isInteractive = true;
                            elementData = {
                              type: 'clickable',
                              text: directText,
                              selector: selector,
                              index: index,
                              id: element.id || '',
                              className: element.className || '',
                              tagName: tagName
                            };
                            markdown = '### 🎯 可點擊區域: ' + directText.substring(0, 50) + '\\\\n';
                            markdown += '- **動作**: 點擊執行動作\\\\n';
                            markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\n';
                            markdown += '- **索引**: ' + index + '\\\\n';
                            markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\n\\\\n';
                          } else {
                            markdown = directText + '\\\\n\\\\n';
                          }
                        }
                        break;

                      default:
                        // 對於其他元素，提取純文字內容
                        const otherText = cleanText(element.textContent);
                        if (otherText && otherText.length > 5 && !element.children.length) {
                          markdown = otherText + '\\\\n\\\\n';
                        }
                        break;
                    }

                    return {
                      markdown: markdown,
                      isInteractive: isInteractive,
                      isLink: isLink,
                      elementData: elementData
                    };
                  }

                  // 生成精確的選擇器
                  function generatePreciseSelector(element) {
                    // 優先級：id > name > class > 屬性 > 位置
                    if (element.id) {
                      return '#' + element.id;
                    }

                    if (element.name) {
                      return '[name="' + element.name + '"]';
                    }

                    if (element.className && typeof element.className === 'string') {
                      const classes = element.className.split(' ').filter(c => c.trim());
                      if (classes.length > 0) {
                        return '.' + classes[0];
                      }
                    }

                    // 使用屬性
                    const attrs = ['data-id', 'data-testid', 'aria-label', 'title', 'role'];
                    for (const attr of attrs) {
                      const value = element.getAttribute(attr);
                      if (value) {
                        return '[' + attr + '="' + value + '"]';
                      }
                    }

                    // 最後使用標籤名 + 位置
                    const tagName = element.tagName.toLowerCase();
                    const siblings = Array.from(element.parentNode.children).filter(el => el.tagName.toLowerCase() === tagName);
                    const index = siblings.indexOf(element) + 1;
                    return tagName + ':nth-of-type(' + index + ')';
                  }

                  // 提取表格為 markdown
                  function extractTableAsMarkdown(table) {
                    let tableMarkdown = '\\\\n';
                    const rows = table.querySelectorAll('tr');

                    rows.forEach((row, rowIndex) => {
                      const cells = row.querySelectorAll('td, th');
                      if (cells.length > 0) {
                        const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
                        tableMarkdown += '| ' + cellTexts.join(' | ') + ' |\\\\n';

                        // 添加表頭分隔線
                        if (rowIndex === 0 && row.querySelectorAll('th').length > 0) {
                          tableMarkdown += '|' + cellTexts.map(() => '---').join('|') + '|\\\\n';
                        }
                      }
                    });

                    return tableMarkdown + '\\\\n';
                  }

                  return {
                    title,
                    content,
                    links
                  };

                } catch (e) {
                  return { error: 'failed to extract content: ' + e.message };
                }
              })();
            \`);

            return result;
          } catch (e) {
            return { error: 'failed to execute script in webview: ' + e.message };
          }
        })();
      `);

      if (contentData.error) {
        console.error('❌ webview 內容提取失敗:', contentData.error);
        return null;
      }

      console.log('✅ webview 內容提取成功');
      return contentData;

    } catch (error) {
      console.error('❌ webview executeJavaScript 失敗:', error);
      return { error: 'webview execution failed: ' + error.message };
    }

  } catch (error) {
    console.error('❌ webview 內容提取異常:', error);
    return null;
  }
}

ipcMain.handle('browser-get-page-data', async (event) => {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    // 使用統一的 URL 提取函數
    const urlInfo = await extractRealWebviewUrl(webContents);
    const targetUrl = urlInfo.url;
    let pageTitle = urlInfo.title || 'Unknown';

    // 從 webview 提取真實內容
    const webviewContent = await extractWebviewContent(webContents);

    let content, interactiveElements, links = [];

    if (!webviewContent || webviewContent.error) {
      throw new Error(`Webview 內容提取失敗: ${webviewContent?.error || '未知錯誤'}`);
    }

    // 使用從 webview 提取的真實內容
    pageTitle = webviewContent.title || pageTitle;
    content = webviewContent.content || '無法提取頁面內容';
    links = webviewContent.links || [];

    console.log('✅ 使用 webview 提取的真實內容');
    console.log('📄 內容長度:', content.length);
    console.log('🔗 連結數量:', links.length);

    console.log('✅ 最終使用的 URL:', targetUrl);
    console.log('✅ 頁面標題:', pageTitle);
    console.log('✅ URL 來源:', urlInfo.source);

    const webviewData = {
      url: targetUrl,  // 返回 webview 的真實 URL
      title: pageTitle,  // 使用真實的頁面標題
      content: content,  // 使用從 webview 提取的真實內容（包含所有互動元素）
      links: links,  // 添加連結信息
      metadata: {
        timestamp: Date.now(),
        viewport: { width: 1200, height: 800 },
        scrollPosition: { x: 0, y: 0 },
        loadState: 'complete',
        extractionMethod: 'webview'
      },
      extractionErrors: []
    };

    // 導出完整的頁面數據為 JSON 文件（用於調試和改進）
    try {
      const fs = require('fs');
      const path = require('path');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `page-data-${timestamp}.json`;
      const filepath = path.join(process.cwd(), 'debug', filename);

      // 確保 debug 目錄存在
      const debugDir = path.join(process.cwd(), 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      // 創建完整的調試數據
      const debugData = {
        ...webviewData,
        rawWebviewContent: webviewContent,  // 包含原始的 webview 提取數據
        urlInfo: urlInfo,  // 包含 URL 提取信息
        extractionTimestamp: new Date().toISOString(),
        debugInfo: {
          contentLength: content ? content.length : 0,
          linksCount: links ? links.length : 0,
          interactiveElementsCount: interactiveElements ? interactiveElements.length : 0,
          extractionSource: urlInfo.source
        }
      };

      fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2), 'utf8');
      console.log(`📄 頁面數據已導出到: ${filepath}`);
    } catch (error) {
      console.error('❌ 導出頁面數據失敗:', error);
    }

    return {
      success: true,
      pageData: webviewData
    };

  } catch (error) {
    console.error('Browser get page data error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('oauth-stop-flow', async () => {
  try {
    if (oauthUtils) {
      oauthUtils.stopCallbackServer();
      oauthUtils = null;
    }
    return { success: true };
  } catch (error) {
    console.error('OAuth stop error:', error);
    return { success: false, error: error.message };
  }
});

// HTTP 服務器用於接收後端的瀏覽器操作請求
function startHttpServer() {
  httpServer = http.createServer(async (req, res) => {
    // 設置 CORS 頭
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && (req.url === '/browser-action' || req.url === '/api/browser-action')) {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { action, selector, text, url, press_enter, direction, script, options } = JSON.parse(body);

          console.log(`🔧 Electron HTTP API: ${action}`, { selector, text, url, press_enter, direction, script });

          let result;

          switch (action) {
            case 'get_page_data':
              result = await handleBrowserGetPageData();
              break;
            case 'test_extractor':
              result = { success: true, message: 'Test extractor removed' };
              break;
            case 'navigate':
              result = await handleBrowserNavigate(url, options);
              break;
            case 'click':
              result = await handleBrowserClick(selector, options);
              break;
            case 'type':
              result = await handleBrowserType(selector, text, { ...options, pressEnter: press_enter });
              break;
            case 'scroll':
              result = await handleBrowserScroll(direction || 'down');
              break;
            case 'screenshot':
              result = await handleBrowserScreenshot(options);
              break;
            case 'execute_script':
              result = await handleBrowserExecuteScript(script);
              break;
            case 'read_element':
              const readScript = `document.querySelector('${selector}')?.innerText || ''`;
              const readResult = await handleBrowserExecuteScript(readScript);
              result = {
                success: readResult.success,
                error: readResult.error,
                data: { text: readResult.result }
              };
              break;
            default:
              result = { success: false, error: `不支援的操作: ${action}` };
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

        } catch (error) {
          console.error('HTTP API error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const port = 3001; // 使用不同的端口避免與 Next.js 衝突
  httpServer.listen(port, () => {
    console.log(`🚀 Electron HTTP API 服務器啟動在端口 ${port}`);
  });
}

// HTTP API 處理函數 - 調用現有的 IPC 處理器
async function handleBrowserGetPageData() {
  try {
    // 直接調用 IPC 處理器的邏輯
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      return { success: false, error: 'No active window' };
    }

    // 使用統一的 URL 提取函數
    const urlInfo = await extractRealWebviewUrl(webContents);
    const targetUrl = urlInfo.url;
    let pageTitle = urlInfo.title || 'Unknown';

    // 從 webview 提取真實內容
    const webviewContent = await extractWebviewContent(webContents);

    let content, interactiveElements, links = [];

    if (!webviewContent || webviewContent.error) {
      throw new Error(`HTTP API Webview 內容提取失敗: ${webviewContent?.error || '未知錯誤'}`);
    }

    // 使用從 webview 提取的真實內容
    pageTitle = webviewContent.title || pageTitle;
    content = webviewContent.content || '無法提取頁面內容';
    links = webviewContent.links || [];

    console.log('✅ HTTP API 使用 webview 提取的真實內容');
    console.log('📄 內容長度:', content.length);
    console.log('🔗 連結數量:', links.length);

    console.log('✅ HTTP API 最終使用的 URL:', targetUrl);
    console.log('✅ 頁面標題:', pageTitle);
    console.log('✅ URL 來源:', urlInfo.source);

    const webviewData = {
      url: targetUrl,  // 返回轉換後的 URL
      title: pageTitle,  // 使用真實的頁面標題
      content: content,  // 使用從 webview 提取的真實內容（包含所有互動元素）
      links: links,  // 添加連結信息
      metadata: {
        timestamp: Date.now(),
        viewport: { width: 1200, height: 800 },
        scrollPosition: { x: 0, y: 0 },
        loadState: 'complete',
        extractionMethod: 'webview'
      },
      extractionErrors: []
    };

    // HTTP API 也導出完整的頁面數據
    try {
      const fs = require('fs');
      const path = require('path');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `page-data-http-${timestamp}.json`;
      const filepath = path.join(process.cwd(), 'debug', filename);

      // 確保 debug 目錄存在
      const debugDir = path.join(process.cwd(), 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      // 創建完整的調試數據
      const debugData = {
        ...webviewData,
        rawWebviewContent: webviewContent,
        urlInfo: urlInfo,
        extractionTimestamp: new Date().toISOString(),
        apiType: 'http',
        debugInfo: {
          contentLength: content ? content.length : 0,
          linksCount: links ? links.length : 0,
          interactiveElementsCount: interactiveElements ? interactiveElements.length : 0,
          extractionSource: urlInfo.source
        }
      };

      fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2), 'utf8');
      console.log(`📄 HTTP API 頁面數據已導出到: ${filepath}`);
    } catch (error) {
      console.error('❌ HTTP API 導出頁面數據失敗:', error);
    }

    return {
      success: true,
      page_data: webviewData  // 修復：使用 page_data 而不是 pageData
    };

  } catch (error) {
    console.error('Browser get page data error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleBrowserNavigate(url, options = {}) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const currentUrl = webContents.getURL();
    console.log('🔍 當前 URL:', currentUrl);
    console.log('🎯 目標 URL:', url);

    // 檢查是否已經在 browser 頁面
    if (currentUrl.includes('/browser')) {
      console.log('✅ 已在 browser 頁面，控制現有的 webview');

      // 準備目標 URL（確保有協議）
      let targetUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        targetUrl = `https://${url}`;
      }

      console.log('🔧 讓 webview 導航到:', targetUrl);

      // 控制現有的 webview 導航到新 URL
      const script = `
        (function() {
          const webview = document.querySelector('webview');
          if (webview) {
            console.log('🔧 設置 webview src 到:', '${targetUrl}');
            webview.src = '${targetUrl}';
            return true;
          } else {
            console.error('❌ 找不到 webview 元素');
            return false;
          }
        })();
      `;

      const webviewFound = await webContents.executeJavaScript(script);

      if (webviewFound) {
        // 等待 webview 載入
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
          success: true,
          data: {
            url: targetUrl,
            title: 'Webview navigated'
          }
        };
      } else {
        return {
          success: false,
          error: 'Webview element not found'
        };
      }
    } else {
      // 如果不在 browser 頁面，先導航到 browser 頁面
      console.log('🔄 導航到 browser 頁面');
      const browserPageUrl = `http://localhost:3000/browser?url=${encodeURIComponent(url)}`;
      await webContents.loadURL(browserPageUrl);

      // 等待頁面載入完成
      await new Promise((resolve) => {
        webContents.once('did-finish-load', resolve);
      });

      // 等待更長時間讓 webview 完全載入
      await new Promise(resolve => setTimeout(resolve, 5000));

      return {
        success: true,
        data: {
          url: url,
          title: 'Browser Page'
        }
      };
    }

  } catch (error) {
    console.error('Browser navigate error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleBrowserClick(selector, options = {}) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    console.log('🔧 點擊元素:', selector);

    const script = `
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) {
          return { success: false, error: 'Element not found: ${selector}' };
        }

        element.click();
        return { success: true, message: 'Element clicked' };
      })();
    `;

    const result = await webContents.executeJavaScript(script);
    return result;
  } catch (error) {
    console.error('Browser click error:', error);
    return { success: false, error: error.message };
  }
}

async function handleBrowserType(selector, text, options = {}) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    console.log('🔧 輸入文字到:', selector, '文字:', text);

    // 簡單的輸入實現
    const script = `
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) {
          return { success: false, error: 'Element not found: ${selector}' };
        }

        // 清空輸入框
        element.value = '';

        // 輸入文字
        element.value = '${text.replace(/'/g, "\\'")}';

        // 觸發事件
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
                  element.dispatchEvent(new Event('change', { bubbles: true }));

        // 按 Enter 鍵
        if (${options.pressEnter === true}) {
          element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
        }

        return {
          success: true,
          value: element.value
        };
      })();
    `;

    const result = await webContents.executeJavaScript(script);
    return result;

  } catch (error) {
    console.error('Browser type error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleBrowserScroll(direction, amount = 300) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const script = `
      (function() {
        const scrollAmount = ${amount};
        let scrollX = 0, scrollY = 0;

        switch ('${direction}') {
          case 'down':
            scrollY = scrollAmount;
            break;
          case 'up':
            scrollY = -scrollAmount;
            break;
          case 'left':
            scrollX = -scrollAmount;
            break;
          case 'right':
            scrollX = scrollAmount;
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
          position: { x: window.scrollX, y: window.scrollY }
        };
      })();
    `;

    const result = await webContents.executeJavaScript(script);
    return {
      success: true,
      data: {
        position: result.position
      }
    };

  } catch (error) {
    console.error('Browser scroll error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleBrowserScreenshot(options = {}) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const image = await webContents.capturePage();
    const screenshot = image.toDataURL();

    return {
      success: true,
      data: {
        screenshot: screenshot,
        format: 'png'
      }
    };

  } catch (error) {
    console.error('Browser screenshot error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleBrowserExecuteScript(script) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const result = await webContents.executeJavaScript(script);

    return {
      success: true,
      result: result
    };

  } catch (error) {
    console.error('Browser execute script error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Navigate to Google to verify login status
ipcMain.handle('navigate-to-google', async () => {
  try {
    if (mainWindow) {
      mainWindow.loadURL('https://www.google.com');
      return { success: true };
    }
    return { success: false, error: 'Main window not available' };
  } catch (error) {
    console.error('Error navigating to Google:', error);
    return { success: false, error: error.message };
  }
});