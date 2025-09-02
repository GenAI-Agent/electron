const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
const oauthHandlers = require('./handlers/oauth-handlers');
const browserHandlers = require('./handlers/browser-handlers');
const { extractRealWebviewUrl, extractWebviewContent } = require('./utils/webview-utils');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let httpServer;
let backendProcess;

// Backend management functions
function startBackend() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, assume backend is running separately
      console.log('Development mode: Backend should be running separately');
      resolve();
      return;
    }

    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'backend', 'supervisor-agent-backend.exe')
      : path.join(__dirname, 'backend', 'supervisor-agent-backend.exe');

    if (!fs.existsSync(backendPath)) {
      reject(new Error(`Backend executable not found at: ${backendPath}`));
      return;
    }

    console.log('Starting backend process...');
    backendProcess = spawn(backendPath, [], {
      cwd: path.dirname(backendPath),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend stdout: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // Wait for backend to be ready
    setTimeout(() => {
      checkBackendHealth()
        .then(() => resolve())
        .catch(() => reject(new Error('Backend failed to start')));
    }, 3000);
  });
}

function checkBackendHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8000/health', (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Backend health check failed: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Backend health check timeout'));
    });
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('Stopping backend process...');
    backendProcess.kill('SIGTERM');

    // Force kill after 5 seconds if not terminated
    setTimeout(() => {
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

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
    ? process.env.NEXT_URL || 'http://localhost:4081'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Hide native traffic lights on macOS
    if (process.platform === 'darwin') {
      mainWindow.setWindowButtonVisibility(false);
    }

    // Handle certificate errors for webviews
    mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
      // Allow all certificates for development/testing
      event.preventDefault();
      callback(true);
    });

    // Set user agent for webviews to avoid bot detection
    mainWindow.webContents.session.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Configure webview session to handle ERR_ABORTED issues
function configureWebviewSession() {
  const { session } = require('electron');
  
  // Get the browser session used by webviews
  const browserSession = session.fromPartition('persist:browser');
  
  // Modify response headers to bypass frame restrictions
  browserSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    
    // Remove X-Frame-Options header that blocks webviews
    if (responseHeaders['x-frame-options']) {
      delete responseHeaders['x-frame-options'];
    }
    if (responseHeaders['X-Frame-Options']) {
      delete responseHeaders['X-Frame-Options'];
    }
    
    // Modify CSP headers to allow framing
    if (responseHeaders['content-security-policy']) {
      responseHeaders['content-security-policy'] = responseHeaders['content-security-policy'].map(csp => 
        csp.replace(/frame-ancestors[^;]*;?/g, 'frame-ancestors *;')
      );
    }
    
    callback({ responseHeaders });
  });

  // Set request headers to appear more like regular browser
  browserSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    details.requestHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
    details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.5';
    details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br';
    details.requestHeaders['Connection'] = 'keep-alive';
    details.requestHeaders['Upgrade-Insecure-Requests'] = '1';
    details.requestHeaders['Sec-Fetch-Dest'] = 'document';
    details.requestHeaders['Sec-Fetch-Mode'] = 'navigate';
    details.requestHeaders['Sec-Fetch-Site'] = 'none';
    
    callback({ requestHeaders: details.requestHeaders });
  });

  // Handle certificate errors for webviews
  browserSession.setCertificateVerifyProc((request, callback) => {
    // Allow all certificates for development/testing
    callback(0);
  });

  console.log('✅ Webview session configured to handle ERR_ABORTED issues');
}

app.whenReady().then(async () => {
  try {
    // Start backend first
    await startBackend();
    console.log('Backend started successfully');

    createWindow();
    
    // Configure webview session after window creation
    configureWebviewSession();

    // Register handlers immediately after creating window
    oauthHandlers.register(mainWindow);
    browserHandlers.register(mainWindow);

    startHttpServer();
  } catch (error) {
    console.error('Failed to start backend:', error);
    // Show error dialog to user
    const { dialog } = require('electron');
    dialog.showErrorBox('Backend Error', `Failed to start backend service: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('App is quitting, stopping backend...');
  stopBackend();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    try {
      if (!isDev) {
        await startBackend();
      }
      createWindow();
    } catch (error) {
      console.error('Failed to restart backend:', error);
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('navigate-to-url', async (_, url) => {
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

ipcMain.handle('read-directory', async (_, dirPath) => {
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

ipcMain.handle('open-file', async (_, filePath) => {
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

ipcMain.handle('get-file-stats', async (_, filePath) => {
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

ipcMain.handle('read-file', async (_, filePath) => {
  try {
    // 檢查文件大小，根據文件類型設置不同限制
    const stats = await fs.promises.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 根據文件類型設置不同的大小限制
    let maxSize;
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(ext)) {
      maxSize = 2048 * 1024 * 1024; // 視頻文件 2G 限制
    } else if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'].includes(ext)) {
      maxSize = 2048 * 1024 * 1024; // 音頻文件 2G 限制
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
      maxSize = 500 * 1024 * 1024; // 圖片文件 500MB 限制
    } else if (['.pdf'].includes(ext)) {
      maxSize = 1024 * 1024 * 1024; // PDF 文件 1G 限制
    } else {
      maxSize = 500 * 1024 * 1024; // 其他文件 500MB 限制
    }

    if (stats.size > maxSize) {
      throw new Error(`文件過大，無法預覽。文件大小: ${(stats.size / 1024 / 1024).toFixed(2)}MB，限制: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // 獲取文件名
    const fileName = path.basename(filePath);

    // 根據文件類型返回不同的結果
    if (ext === '.csv') {
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 解析 CSV 內容
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV 文件為空');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      return {
        type: 'csv',
        content: content,
        data: {
          headers: headers,
          rows: rows
        },
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (ext === '.json') {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      try {
        const jsonData = JSON.parse(content);
        return {
          type: 'json',
          content: content,
          data: jsonData,
          size: stats.size,
          extension: ext,
          filePath: filePath
        };
      } catch (e) {
        return {
          type: 'text',
          content: content,
          size: stats.size,
          extension: ext,
          filePath: filePath
        };
      }
    } else if (['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.h', '.xml', '.yaml', '.yml', '.ini', '.cfg', '.log'].includes(ext)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return {
        type: 'text',
        content: content,
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
      return {
        type: 'image',
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(ext)) {
      return {
        type: 'video',
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'].includes(ext)) {
      return {
        type: 'audio',
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (ext === '.pdf') {
      return {
        type: 'pdf',
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (['.ppt', '.pptx'].includes(ext)) {
      return {
        type: 'presentation',
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else if (['.doc', '.docx', '.xls', '.xlsx'].includes(ext)) {
      return {
        type: 'office',
        size: stats.size,
        extension: ext,
        filePath: filePath
      };
    } else {
      // 嘗試作為文本文件讀取
      try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return {
          type: 'text',
          content: content,
          size: stats.size,
          extension: ext,
          filePath: filePath
        };
      } catch (textError) {
        return {
          type: 'binary',
          size: stats.size,
          extension: ext,
          filePath: filePath
        };
      }
    }
  } catch (error) {
    throw new Error(`無法讀取文件: ${error.message}`);
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

  const port = 4080; // 使用不同的端口避免與 Next.js 衝突
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
      const browserPageUrl = `http://localhost:4081/browser?url=${encodeURIComponent(url)}`;
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

