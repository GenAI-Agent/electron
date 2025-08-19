const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const OAuthUtils = require('./oauth-utils');

// 加載環境變量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let mainWindow;
let oauthUtils;
let authWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset',  // 隱藏標題欄但保留窗口控制按鈕
    autoHideMenuBar: true,  // 隱藏菜單欄
    title: '',  // 移除窗口標題
    trafficLightPosition: { x: 15, y: 15 }  // 調整窗口控制按鈕位置
  });

  const isDev = process.env.NODE_ENV === 'development';
  const startUrl = isDev
    ? 'http://localhost:4081'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // 完全移除菜單欄
    mainWindow.setMenuBarVisibility(false);

    if (process.platform === 'darwin') {
      mainWindow.setWindowButtonVisibility(false);
    }

    mainWindow.webContents.session.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 設置webview的權限
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(true);
    });

    // 處理webview的導航錯誤
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.log(`Navigation failed: ${errorCode} - ${errorDescription} for ${validatedURL}`);
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  // 清理 OAuth 服務器
  if (oauthUtils) {
    oauthUtils.stopCallbackServer().catch(console.error);
    oauthUtils = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 應用退出前清理
app.on('before-quit', async (event) => {
  if (oauthUtils) {
    event.preventDefault();
    try {
      await oauthUtils.stopCallbackServer();
      oauthUtils = null;
    } catch (error) {
      console.error('Error cleaning up OAuth server:', error);
    } finally {
      app.quit();
    }
  }
});

// 基本IPC handlers
ipcMain.handle('navigate-to-url', async (event, url) => {
  return { success: true, url };
});

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

// 文件系統handlers
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
    const stats = await fs.promises.stat(filePath);
    const maxSize = 50 * 1024 * 1024; // 增加到50MB限制，支持較大的PDF/PPT文件

    if (stats.size > maxSize) {
      throw new Error('文件過大，無法預覽');
    }

    const ext = path.extname(filePath).toLowerCase();

    // 對於文本文件，使用UTF-8編碼讀取
    if (['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.h', '.xml', '.yaml', '.yml', '.ini', '.cfg', '.log'].includes(ext)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return { type: 'text', content };
    }

    // 對於JSON文件，特別處理以支持格式化顯示
    if (ext === '.json') {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return { type: 'json', content };
    }

    // 對於CSV文件，讀取內容並進行基本解析
    if (ext === '.csv') {
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 簡單的CSV解析
      const lines = content.split('\n').filter(line => line.trim());
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/"/g, '')) : [];
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
        content,
        data: { headers, rows: rows.slice(0, 100) }, // 限制前100行以提高性能
        totalRows: rows.length,
        filePath,
        size: stats.size
      };
    }

    // 對於Excel文件，返回文件信息供前端處理
    if (['.xlsx', '.xls'].includes(ext)) {
      return { type: 'excel', filePath, size: stats.size, extension: ext };
    }

    // 對於PDF文件，返回文件路徑供前端處理
    if (ext === '.pdf') {
      return { type: 'pdf', filePath, size: stats.size };
    }

    // 對於PPT文件，返回文件信息
    if (['.ppt', '.pptx'].includes(ext)) {
      return { type: 'presentation', filePath, size: stats.size, extension: ext };
    }

    // 對於其他二進制文件，返回base64編碼
    const content = await fs.promises.readFile(filePath);
    return { type: 'binary', content: content.toString('base64'), size: stats.size };

  } catch (error) {
    throw new Error(`無法讀取文件: ${error.message}`);
  }
});

// 新增：獲取文件的base64編碼（用於嵌入顯示）
ipcMain.handle('read-file-base64', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    const maxSize = 50 * 1024 * 1024; // 50MB限制

    if (stats.size > maxSize) {
      throw new Error('文件過大，無法預覽');
    }

    const content = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return {
      success: true,
      data: content.toString('base64'),
      mimeType: getMimeType(ext),
      size: stats.size
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 新增：寫入文件
ipcMain.handle('write-file', async (event, filePath, content, encoding = 'utf-8') => {
  try {
    await fs.promises.writeFile(filePath, content, encoding);
    return {
      success: true,
      message: '文件寫入成功'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 新增：創建新文件
ipcMain.handle('create-file', async (event, filePath, content = '', encoding = 'utf-8') => {
  try {
    // 檢查文件是否已存在
    try {
      await fs.promises.access(filePath);
      return {
        success: false,
        error: '文件已存在'
      };
    } catch {
      // 文件不存在，可以創建
    }

    // 確保目錄存在
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    // 創建文件
    await fs.promises.writeFile(filePath, content, encoding);

    return {
      success: true,
      message: '文件創建成功',
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 新增：刪除文件
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      return {
        success: false,
        error: '無法刪除目錄，請使用刪除目錄功能'
      };
    }

    await fs.promises.unlink(filePath);

    return {
      success: true,
      message: '文件刪除成功'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 新增：按行編輯文件
ipcMain.handle('edit-file-lines', async (event, filePath, startLine, endLine, newContent) => {
  try {
    // 讀取原文件內容
    const originalContent = await fs.promises.readFile(filePath, 'utf-8');
    const lines = originalContent.split('\n');

    // 驗證行號範圍
    if (startLine < 1 || endLine < startLine || startLine > lines.length) {
      return {
        success: false,
        error: '無效的行號範圍'
      };
    }

    // 替換指定行範圍的內容
    const newLines = newContent.split('\n');
    const beforeLines = lines.slice(0, startLine - 1);
    const afterLines = lines.slice(endLine);

    const updatedLines = [...beforeLines, ...newLines, ...afterLines];
    const updatedContent = updatedLines.join('\n');

    // 寫回文件
    await fs.promises.writeFile(filePath, updatedContent, 'utf-8');

    return {
      success: true,
      message: `成功編輯第 ${startLine}-${endLine} 行`,
      linesChanged: endLine - startLine + 1,
      newLineCount: newLines.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// 輔助函數：獲取MIME類型
function getMimeType(ext) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 內部函數：點擊元素（通過webview控制）
async function internalClick(selector, options = {}) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const result = await webContents.executeJavaScript(`
      (async function() {
        const webview = document.querySelector('webview');
        if (!webview) {
          return { success: false, error: 'webview not found' };
        }

        try {
          const clickResult = await webview.executeJavaScript(\`
            (function() {
              const element = document.querySelector('${selector}');
              if (!element) {
                return { success: false, error: 'Element not found: ${selector}' };
              }
              element.click();
              return { success: true, message: 'Element clicked' };
            })();
          \`);
          return clickResult;
        } catch (e) {
          return { success: false, error: 'Failed to execute click in webview: ' + e.message };
        }
      })();
    `);

    return result;
  } catch (error) {
    console.error('Internal click error:', error);
    return { success: false, error: error.message };
  }
}

// 內部函數：滾動頁面（通過webview控制）
async function internalScroll(direction, amount = 300) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    const result = await webContents.executeJavaScript(`
      (async function() {
        const webview = document.querySelector('webview');
        if (!webview) {
          return { success: false, error: 'webview not found' };
        }

        try {
          const scrollResult = await webview.executeJavaScript(\`
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
          \`);
          return scrollResult;
        } catch (e) {
          return { success: false, error: 'Failed to execute scroll in webview: ' + e.message };
        }
      })();
    `);

    return result;
  } catch (error) {
    console.error('Internal scroll error:', error);
    return { success: false, error: error.message };
  }
}

// 內部函數：導覽到URL
async function internalNavigate(url) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    // 通過webview導覽到新URL
    const result = await webContents.executeJavaScript(`
      (async function() {
        const webview = document.querySelector('webview');
        if (!webview) {
          return { success: false, error: 'webview not found' };
        }

        try {
          webview.src = '${url}';
          return { success: true, url: '${url}' };
        } catch (e) {
          return { success: false, error: 'Failed to navigate: ' + e.message };
        }
      })();
    `);

    return result;
  } catch (error) {
    console.error('Internal navigate error:', error);
    return { success: false, error: error.message };
  }
}

// 內部函數：輸入文字
async function internalType(selector, text) {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    // 通過webview執行輸入操作
    const result = await webContents.executeJavaScript(`
      (async function() {
        const webview = document.querySelector('webview');
        if (!webview) {
          return { success: false, error: 'webview not found' };
        }

        try {
          const typeResult = await webview.executeJavaScript(\`
            (function() {
              const element = document.querySelector('${selector}');
              if (!element) {
                return { success: false, error: 'Element not found: ${selector}' };
              }

              element.focus();
              element.value = '${text}';

              // 觸發input事件
              const inputEvent = new Event('input', { bubbles: true });
              element.dispatchEvent(inputEvent);

              return { success: true, message: 'Text entered', selector: '${selector}', text: '${text}' };
            })();
          \`);
          return typeResult;
        } catch (e) {
          return { success: false, error: 'Failed to execute type in webview: ' + e.message };
        }
      })();
    `);

    return result;
  } catch (error) {
    console.error('Internal type error:', error);
    return { success: false, error: error.message };
  }
}

// 內部函數：獲取頁面數據（只返回url和content）
async function internalGetPageData() {
  try {
    const webContents = mainWindow?.webContents;
    if (!webContents) {
      throw new Error('No active window');
    }

    // 使用統一的 URL 提取函數
    const urlInfo = await extractRealWebviewUrl(webContents);
    const targetUrl = urlInfo.url;

    // 從 webview 提取真實內容 - 使用完整的提取腳本
    const webviewContent = await extractWebviewContentWithFullScript(webContents);

    if (!webviewContent || webviewContent.error) {
      throw new Error(`Webview 內容提取失敗: ${webviewContent?.error || '未知錯誤'}`);
    }

    // 只返回url和content
    return {
      success: true,
      data: {
        url: targetUrl,
        content: webviewContent.content || '無法提取頁面內容'
      }
    };

  } catch (error) {
    console.error('Internal get page data error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

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
 * 從 webview 提取真實的 HTML 內容並轉換為 YAML 格式
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
            // 簡化的內容提取腳本，直接在這裡定義
            const result = await webview.executeJavaScript(\`
              (function() {
                try {
                  // 簡化的YAML提取函數
                  function escapeYamlString(str) {
                    if (!str) return '';
                    return str.replace(/"/g, '\\\\"').replace(/\\\\n/g, '\\\\\\\\n').replace(/\\\\r/g, '\\\\\\\\r');
                  }

                  function cleanText(text) {
                    if (!text) return '';
                    return text.trim().replace(/\\\\s+/g, ' ').substring(0, 200);
                  }

                  // 提取標題
                  const title = document.title || 'Untitled';
                  const currentUrl = window.location.href;

                  // 生成簡化的YAML內容
                  let yamlContent = 'page_info:\\\\n';
                  yamlContent += '  title: "' + escapeYamlString(cleanText(title)) + '"\\\\n';
                  yamlContent += '  url: "' + escapeYamlString(currentUrl) + '"\\\\n\\\\n';
                  yamlContent += 'content:\\\\n';

                  // 提取主要元素
                  const elements = document.body.querySelectorAll('h1, h2, h3, p, button, a, input, textarea');
                  let count = 0;

                  for (let i = 0; i < elements.length && count < 50; i++) {
                    const element = elements[i];
                    const tagName = element.tagName.toLowerCase();
                    const text = cleanText(element.textContent);

                    if (text && text.length > 3) {
                      yamlContent += '  - type: ' + tagName + '\\\\n';
                      yamlContent += '    text: "' + escapeYamlString(text) + '"\\\\n';

                      if (tagName === 'a' && element.href) {
                        yamlContent += '    href: "' + escapeYamlString(element.href) + '"\\\\n';
                        yamlContent += '    action: click\\\\n';
                      } else if (tagName === 'button') {
                        yamlContent += '    action: click\\\\n';
                      } else if (tagName === 'input' || tagName === 'textarea') {
                        yamlContent += '    action: type\\\\n';
                      }

                      yamlContent += '\\\\n';
                      count++;
                    }
                  }

                  return {
                    title,
                    content: yamlContent
                  };
                } catch (e) {
                  return { error: 'extraction failed: ' + e.message + ' at ' + e.stack };
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

/**
 * 使用完整腳本從 webview 提取內容並轉換為 YAML 格式
 */
async function extractWebviewContentWithFullScript(webContents) {
  try {
    console.log('📄 開始使用完整腳本從 webview 提取內容...');

    // 首先檢查 webview 是否存在
    const webviewExists = await webContents.executeJavaScript(`
      !!document.querySelector('webview')
    `);

    if (!webviewExists) {
      console.error('❌ webview 元素不存在');
      return { error: 'webview not found' };
    }

    // 通過 webview 的 executeJavaScript 方法獲取內容，使用內嵌的完整腳本
    try {
      const contentData = await webContents.executeJavaScript(`
        (async function() {
          const webview = document.querySelector('webview');
          if (!webview) {
            return { error: 'webview not found' };
          }

          try {
            // 直接在這裡定義完整的提取腳本，避免字符串轉義問題
            const result = await webview.executeJavaScript(\`
              (function() {
                try {
                  // YAML 字符串轉義函數
                  function escapeYamlString(str) {
                    if (!str) return '';
                    return str.replace(/"/g, '\\\\"').replace(/\\\\n/g, '\\\\\\\\n').replace(/\\\\r/g, '\\\\\\\\r');
                  }

                  // 清理文本函數
                  function cleanText(text) {
                    if (!text) return '';
                    return text.trim().replace(/\\\\s+/g, ' ').substring(0, 200);
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
                    const tagName = element.tagName.toLowerCase();
                    const unwantedTags = ['script', 'style', 'meta', 'link', 'noscript', 'br', 'hr'];
                    return unwantedTags.includes(tagName);
                  }

                  // 生成精確的選擇器
                  function generatePreciseSelector(element) {
                    if (element.id) {
                      return '#' + element.id;
                    }

                    if (element.className) {
                      // 處理 className 可能是 DOMTokenList 或字符串的情況
                      const classNameStr = typeof element.className === 'string' ? element.className : element.className.toString();
                      const classes = classNameStr.split(' ').filter(c => c.trim());
                      if (classes.length > 0) {
                        return '.' + classes[0];
                      }
                    }

                    const tagName = element.tagName.toLowerCase();
                    const parent = element.parentElement;

                    if (parent) {
                      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
                      if (siblings.length > 1) {
                        const index = siblings.indexOf(element) + 1;
                        return tagName + ':nth-of-type(' + index + ')';
                      }
                    }

                    return tagName;
                  }

                  // 檢查元素是否可操作
                  function isInteractiveElement(element) {
                    const tagName = element.tagName.toLowerCase();

                    // 明確的互動元素
                    if (['button', 'a', 'input', 'textarea', 'select', 'option'].includes(tagName)) {
                      return true;
                    }

                    // 有點擊事件的元素
                    if (element.onclick || element.getAttribute('onclick')) {
                      return true;
                    }

                    // 有特定屬性的元素
                    if (element.getAttribute('role') === 'button' ||
                        element.getAttribute('role') === 'link' ||
                        element.getAttribute('tabindex') ||
                        element.style.cursor === 'pointer') {
                      return true;
                    }

                    // 有 data-* 屬性可能表示互動元素
                    for (let attr of element.attributes) {
                      if (attr.name.startsWith('data-') &&
                          (attr.name.includes('click') || attr.name.includes('action') || attr.name.includes('handler'))) {
                        return true;
                      }
                    }

                    return false;
                  }

                  // 檢查元素是否有有意義的內容
                  function hasContentValue(element) {
                    const tagName = element.tagName.toLowerCase();

                    // 圖片元素
                    if (tagName === 'img' && (element.src || element.alt)) {
                      return true;
                    }

                    // 有文字內容的元素
                    const text = cleanText(element.textContent);
                    if (text && text.length > 2) {
                      return true;
                    }

                    // 表單元素即使沒有文字也有價值
                    if (['input', 'textarea', 'select'].includes(tagName)) {
                      return true;
                    }

                    return false;
                  }

                  // 提取可操作和有內容的元素
                  function extractAllElementsAsYAML() {
                    let yamlContent = '';

                    // 頁面基本信息
                    const pageTitle = document.title || 'Untitled Page';
                    const currentUrl = window.location.href;

                    yamlContent += 'page_info:\\\\n';
                    yamlContent += '  title: "' + escapeYamlString(cleanText(pageTitle)) + '"\\\\n';
                    yamlContent += '  url: "' + escapeYamlString(currentUrl) + '"\\\\n\\\\n';

                    yamlContent += 'content:\\\\n';

                    // 按順序遍歷所有元素，專注於可操作和有內容的元素
                    const allElements = document.body.querySelectorAll('*');
                    let count = 0;

                    for (let i = 0; i < allElements.length && count < 300; i++) {
                      const element = allElements[i];

                      // 跳過不可見或不需要的元素
                      if (isElementHidden(element) || isElementUnwanted(element)) continue;

                      // 只處理可操作的元素或有內容價值的元素
                      if (!isInteractiveElement(element) && !hasContentValue(element)) continue;

                      const tagName = element.tagName.toLowerCase();
                      const text = cleanText(element.textContent);
                      const selector = generatePreciseSelector(element);

                      // 處理連結
                      if (tagName === 'a' && element.href) {
                        yamlContent += '  - type: link\\\\n';
                        yamlContent += '    text: "' + escapeYamlString(text || 'Link') + '"\\\\n';
                        yamlContent += '    href: "' + escapeYamlString(element.href) + '"\\\\n';
                        yamlContent += '    action: click\\\\n';
                        yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理按鈕
                      else if (tagName === 'button' || element.getAttribute('role') === 'button') {
                        yamlContent += '  - type: button\\\\n';
                        yamlContent += '    text: "' + escapeYamlString(text || element.getAttribute('aria-label') || 'Button') + '"\\\\n';
                        yamlContent += '    action: click\\\\n';
                        yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理輸入框
                      else if (tagName === 'input' && element.type !== 'hidden') {
                        const inputType = element.type || 'text';
                        const inputLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Input');
                        yamlContent += '  - type: input\\\\n';
                        yamlContent += '    input_type: "' + inputType + '"\\\\n';
                        yamlContent += '    label: "' + escapeYamlString(inputLabel) + '"\\\\n';
                        if (element.value) {
                          yamlContent += '    current_value: "' + escapeYamlString(element.value) + '"\\\\n';
                        }
                        yamlContent += '    action: ' + (inputType === 'submit' || inputType === 'button' ? 'click' : 'type') + '\\\\n';
                        yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理文字區域
                      else if (tagName === 'textarea') {
                        const textareaLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Textarea');
                        yamlContent += '  - type: textarea\\\\n';
                        yamlContent += '    label: "' + escapeYamlString(textareaLabel) + '"\\\\n';
                        if (element.value) {
                          yamlContent += '    current_value: "' + escapeYamlString(element.value.substring(0, 200)) + '"\\\\n';
                        }
                        yamlContent += '    action: type\\\\n';
                        yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理下拉選單
                      else if (tagName === 'select') {
                        const selectLabel = cleanText(element.name || element.id || element.getAttribute('aria-label') || 'Select');
                        const options = Array.from(element.options || []).map(opt => cleanText(opt.text));
                        yamlContent += '  - type: select\\\\n';
                        yamlContent += '    label: "' + escapeYamlString(selectLabel) + '"\\\\n';
                        if (options.length > 0) {
                          yamlContent += '    options:\\\\n';
                          options.slice(0, 10).forEach(opt => {
                            yamlContent += '      - "' + escapeYamlString(opt) + '"\\\\n';
                          });
                        }
                        yamlContent += '    action: select\\\\n';
                        yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理圖片
                      else if (tagName === 'img') {
                        yamlContent += '  - type: image\\\\n';
                        yamlContent += '    alt: "' + escapeYamlString(element.alt || 'Image') + '"\\\\n';
                        if (element.src) {
                          yamlContent += '    src: "' + escapeYamlString(element.src) + '"\\\\n';
                        }
                        if (isInteractiveElement(element)) {
                          yamlContent += '    action: click\\\\n';
                          yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n';
                        }
                        yamlContent += '\\\\n';
                        count++;
                      }
                      // 處理標題
                      else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) && text && text.length > 0) {
                        yamlContent += '  - type: heading\\\\n';
                        yamlContent += '    level: ' + tagName.charAt(1) + '\\\\n';
                        yamlContent += '    text: "' + escapeYamlString(text) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理可點擊的元素
                      else if (isInteractiveElement(element) && text && text.length > 0) {
                        yamlContent += '  - type: clickable_element\\\\n';
                        yamlContent += '    element_type: ' + tagName + '\\\\n';
                        yamlContent += '    text: "' + escapeYamlString(text.substring(0, 150)) + '"\\\\n';
                        yamlContent += '    action: click\\\\n';
                        yamlContent += '    selector: "' + escapeYamlString(selector) + '"\\\\n\\\\n';
                        count++;
                      }
                      // 處理重要的文字內容（段落等）
                      else if (['p', 'span', 'div'].includes(tagName) && text && text.length > 10) {
                        // 只提取較長的文字內容，避免太多碎片
                        yamlContent += '  - type: text\\\\n';
                        yamlContent += '    content: "' + escapeYamlString(text.substring(0, 200)) + '"\\\\n\\\\n';
                        count++;
                      }
                    }

                    // 限制最大字數
                    if (yamlContent.length > 50000) {
                      yamlContent = yamlContent.substring(0, 50000) + '\\\\n\\\\n# [內容已截斷，總長度超過 50000 字]';
                    }

                    return {
                      content: yamlContent
                    };
                  }

                  // 執行提取
                  return extractAllElementsAsYAML();
                } catch (e) {
                  return { error: 'extraction execution failed: ' + e.message + ' at ' + e.stack };
                }
              })();
            \`);

            return result;
          } catch (e) {
            return { error: 'failed to execute full script in webview: ' + e.message };
          }
        })();
      `);

      if (contentData.error) {
        console.error('❌ webview 完整腳本內容提取失敗:', contentData.error);
        // 如果完整腳本失敗，回退到簡化版本
        return await extractWebviewContent(webContents);
      }

      console.log('✅ webview 完整腳本內容提取成功');
      return contentData;

    } catch (error) {
      console.error('❌ webview 完整腳本 executeJavaScript 失敗:', error);
      // 如果完整腳本失敗，回退到簡化版本
      return await extractWebviewContent(webContents);
    }

  } catch (error) {
    console.error('❌ webview 完整腳本內容提取異常:', error);
    // 如果完整腳本失敗，回退到簡化版本
    return await extractWebviewContent(webContents);
  }
}

// IPC handler for getting page data
ipcMain.handle('browser-get-page-data', async () => {
  return await internalGetPageData();
});

// IPC handler for test scroll
ipcMain.handle('browser-test-scroll', async (event, direction, amount) => {
  return await internalScroll(direction, amount);
});

// IPC handler for test navigate
ipcMain.handle('browser-test-navigate', async (event, url) => {
  return await internalNavigate(url);
});

// IPC handler for test click
ipcMain.handle('browser-test-click', async (event, selector) => {
  return await internalClick(selector);
});

// IPC handler for test type
ipcMain.handle('browser-test-type', async (event, selector, text) => {
  return await internalType(selector, text);
});

// IPC handler for testing full page data extraction
ipcMain.handle('browser-test-full-page-data', async () => {
  return await internalGetPageData();
});

// HTTP服務器已刪除，現在只使用內部函數

// OAuth IPC handlers
ipcMain.handle('oauth-start-flow', async (event, config) => {
  try {
    // 確保先清理任何現有的 OAuth 實例
    if (oauthUtils) {
      await oauthUtils.stopCallbackServer();
    }
    
    // 創建新的 OAuth 實例
    oauthUtils = new OAuthUtils();

    // 建立授權 URL
    const authUrl = oauthUtils.buildAuthorizationUrl(config);

    // 啟動回調服務器
    const callbackPromise = oauthUtils.startCallbackServer();

    // 在系統瀏覽器中打開授權 URL
    oauthUtils.openInBrowser(authUrl);

    // 等待回調
    const result = await callbackPromise;

    return {
      success: true,
      code: result.code,
      state: result.state
    };
  } catch (error) {
    console.error('OAuth start flow error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('oauth-exchange-token', async (event, config) => {
  try {
    if (!oauthUtils) {
      throw new Error('OAuth flow not started');
    }

    // 從環境變量獲取 Client Secret（安全地在主進程中處理）
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientSecret || !clientId) {
      throw new Error('Missing Google OAuth credentials in environment variables');
    }

    const tokens = await oauthUtils.exchangeCodeForToken({
      clientId,
      clientSecret,
      code: config.code
    });

    return {
      success: true,
      tokens
    };
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('oauth-refresh-token', async (event, config) => {
  try {
    if (!oauthUtils) {
      oauthUtils = new OAuthUtils();
    }

    // 從環境變量獲取 Client Secret（安全地在主進程中處理）
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientSecret || !clientId) {
      throw new Error('Missing Google OAuth credentials in environment variables');
    }

    const tokens = await oauthUtils.refreshAccessToken({
      clientId,
      clientSecret,
      refreshToken: config.refreshToken
    });

    return {
      success: true,
      tokens
    };
  } catch (error) {
    console.error('OAuth token refresh error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('oauth-stop-flow', async (event) => {
  try {
    if (oauthUtils) {
      await oauthUtils.stopCallbackServer();
      oauthUtils = null; // 清除實例引用
    }
    return { success: true };
  } catch (error) {
    console.error('OAuth stop flow error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 直接注入 access token 到 webview
ipcMain.handle('sync-google-cookies', async (event, tokens) => {
  try {
    console.log('🎯 直接設置 webview 認證狀態...');
    
    if (!tokens || !tokens.access_token) {
      throw new Error('No access token provided');
    }
    
    // 先獲取用戶信息
    const https = require('https');
    const userInfoResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.googleapis.com',
        path: '/oauth2/v2/userinfo',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'User-Agent': 'Electron-App/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      req.end();
    });
    
    console.log('✅ 用戶信息已獲取:', userInfoResponse.email);
    
    // 找到 webview 並直接注入 access token
    const webviewSession = require('electron').session.fromPartition('persist:browser');
    
    // 直接在 webview 中注入全局 access token
    if (mainWindow && mainWindow.webContents) {
      try {
        // 向所有 webview 注入 access token
        await mainWindow.webContents.executeJavaScript(`
          // 為所有現有和未來的 webview 設置 access token
          window.GOOGLE_ACCESS_TOKEN = '${tokens.access_token}';
          window.GOOGLE_USER_INFO = ${JSON.stringify(userInfoResponse)};
          console.log('🎯 Global access token 已注入到主窗口');
          
          // 如果有 webview 元素，直接注入
          const webviews = document.querySelectorAll('webview');
          webviews.forEach((webview, index) => {
            if (webview && webview.executeJavaScript) {
              webview.addEventListener('dom-ready', () => {
                webview.executeJavaScript(\`
                  window.GOOGLE_ACCESS_TOKEN = '${tokens.access_token}';
                  window.GOOGLE_USER_INFO = ${JSON.stringify(userInfoResponse)};
                  localStorage.setItem('google_access_token', '${tokens.access_token}');
                  localStorage.setItem('google_user_info', '${JSON.stringify(userInfoResponse)}');
                  console.log('🎯 Access token 已直接注入到 webview #' + ${index});
                \`);
              });
            }
          });
          
          true; // 返回成功
        `);
        
        console.log('✅ Access token 已注入到主窗口和 webview');
      } catch (injectionError) {
        console.warn('主窗口注入失敗:', injectionError);
      }
    }
    
    return {
      success: true,
      userInfo: userInfoResponse,
      message: `Access token 已直接注入 - ${userInfoResponse.email}`,
      access_token: tokens.access_token
    };
    
  } catch (error) {
    console.error('直接注入 access token 失敗:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 新增：專用的 webview token 注入 handler
ipcMain.handle('inject-webview-token', async (event, tokenData) => {
  try {
    console.log('💉 注入 token 到 webview...');
    
    if (!mainWindow || !mainWindow.webContents) {
      throw new Error('Main window not available');
    }
    
    // 執行注入腳本
    const result = await mainWindow.webContents.executeJavaScript(`
      (async function() {
        try {
          const webviews = document.querySelectorAll('webview');
          let injectedCount = 0;
          
          for (let i = 0; i < webviews.length; i++) {
            const webview = webviews[i];
            if (webview && webview.executeJavaScript) {
              try {
                await webview.executeJavaScript(\`
                  // 設置全局 access token
                  window.GOOGLE_ACCESS_TOKEN = '${tokenData.access_token}';
                  window.GOOGLE_USER_INFO = ${JSON.stringify(tokenData.user_info)};
                  
                  // 設置 localStorage
                  localStorage.setItem('google_access_token', '${tokenData.access_token}');
                  localStorage.setItem('google_user_info', '${JSON.stringify(tokenData.user_info)}');
                  localStorage.setItem('google_authenticated', 'true');
                  localStorage.setItem('google_auth_expires', '${tokenData.expires_at}');
                  
                  // 設置 sessionStorage  
                  sessionStorage.setItem('google_signed_in', 'true');
                  sessionStorage.setItem('user_email', '${tokenData.user_info.email}');
                  
                  // 如果在 Google 域名上，創建視覺指示器
                  if (window.location.hostname.includes('google.com')) {
                    const existing = document.getElementById('token-auth-indicator');
                    if (existing) existing.remove();
                    
                    const indicator = document.createElement('div');
                    indicator.id = 'token-auth-indicator';
                    indicator.style.cssText = \\\`
                      position: fixed !important;
                      top: 20px !important;
                      right: 20px !important;
                      z-index: 999999 !important;
                      background: #0f9d58 !important;
                      color: white !important;
                      padding: 12px 18px !important;
                      border-radius: 25px !important;
                      font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                      font-size: 14px !important;
                      font-weight: 500 !important;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                      cursor: pointer !important;
                      border: 2px solid white !important;
                      animation: slideIn 0.3s ease-out !important;
                    \\\`;
                    
                    indicator.innerHTML = \\\`
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">🎯</span>
                        <div>
                          <div>Access Token 已啟用</div>
                          <div style="font-size: 11px; opacity: 0.9; margin-top: 1px;">
                            ${tokenData.user_info.email}
                          </div>
                        </div>
                      </div>
                    \\\`;
                    
                    indicator.onclick = function() {
                      const tokenInfo = \\\`
🎯 Google Access Token 已啟用！

用戶: ${tokenData.user_info.email}
Token: ${tokenData.access_token.substring(0, 40)}...
過期: \\\${new Date(${tokenData.expires_at}).toLocaleString()}

✅ 這個 access token 可以直接用於：
• Google API 調用
• Gmail 操作  
• 其他 Google 服務

你可以通過 window.GOOGLE_ACCESS_TOKEN 訪問此 token。
                      \\\`.trim();
                      alert(tokenInfo);
                    };
                    
                    // 添加動畫
                    const style = document.createElement('style');
                    style.textContent = \\\`
                      @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                      }
                    \\\`;
                    document.head.appendChild(style);
                    document.body.appendChild(indicator);
                    
                    console.log('🎯 Token 指示器已顯示');
                  }
                  
                  console.log('💉 Access token 已成功注入到 webview', window.location.href);
                  return { success: true, url: window.location.href };
                \`);
                
                injectedCount++;
              } catch (webviewError) {
                console.warn('注入到 webview ' + i + ' 失敗:', webviewError);
              }
            }
          }
          
          return { success: true, injectedCount, totalWebviews: webviews.length };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })();
    `);
    
    console.log('💉 Token 注入結果:', result);
    return { success: true, result };
    
  } catch (error) {
    console.error('Token 注入失敗:', error);
    return { success: false, error: error.message };
  }
});

// 在 webview 中注入認證狀態
ipcMain.handle('inject-google-auth', async (event, authData) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }
    
    console.log('💉 Injecting Google authentication state into webview...');
    
    // 在 webview 中執行 JavaScript 來設置認證狀態
    const injectionScript = `
      (function() {
        try {
          // 設置 localStorage 中的認證信息
          localStorage.setItem('google_auth_token', '${authData.access_token}');
          localStorage.setItem('google_user_info', JSON.stringify(${JSON.stringify(authData.user_info)}));
          localStorage.setItem('google_auth_expires', '${authData.expires_at}');
          localStorage.setItem('google_authenticated', 'true');
          
          // 設置 sessionStorage
          sessionStorage.setItem('google_signed_in', 'true');
          sessionStorage.setItem('user_email', '${authData.user_info.email}');
          
          // 嘗試設置一些 Google 特有的標記
          if (window.location.hostname.includes('google.com')) {
            // 觸發 Google 的認證狀態檢查
            window.dispatchEvent(new CustomEvent('google-auth-injected', {
              detail: {
                authenticated: true,
                email: '${authData.user_info.email}'
              }
            }));
          }
          
          console.log('✅ Google auth state injected successfully');
          return { success: true };
        } catch (error) {
          console.error('❌ Error injecting auth state:', error);
          return { success: false, error: error.message };
        }
      })();
    `;
    
    // 執行注入腳本
    const result = await mainWindow.webContents.executeJavaScript(`
      (async function() {
        const webview = document.querySelector('webview');
        if (webview) {
          try {
            const result = await webview.executeJavaScript(\`${injectionScript.replace(/`/g, '\\`')}\`);
            return { success: true, injectionResult: result };
          } catch (error) {
            return { success: false, error: error.message };
          }
        } else {
          return { success: false, error: 'Webview not found' };
        }
      })();
    `);
    
    console.log('Auth injection result:', result);
    
    return {
      success: true,
      message: 'Google authentication state injected into webview',
      result
    };
  } catch (error) {
    console.error('Auth injection error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 在 webview 中啟動 Google 登入流程
ipcMain.handle('start-webview-google-login', async (event) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }
    
    console.log('🔗 Starting Google login in webview...');
    
    // 在 webview 中導航到 Google 登入頁面
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        const webview = document.querySelector('webview');
        if (!webview) {
          return { success: false, error: 'Webview not found' };
        }
        
        // 導航到 Google 登入頁面
        const loginUrl = 'https://accounts.google.com/signin/v2/identifier?continue=https://mail.google.com/mail/&service=mail';
        webview.src = loginUrl;
        
        console.log('🔗 Navigating webview to Google login:', loginUrl);
        
        return { 
          success: true, 
          url: loginUrl,
          message: '請在 webview 中完成 Google 登入流程' 
        };
      })();
    `);
    
    return result;
  } catch (error) {
    console.error('Start webview login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 檢查 webview 登入狀態
ipcMain.handle('check-webview-login-status', async (event) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }
    
    const result = await mainWindow.webContents.executeJavaScript(`
      (async function() {
        const webview = document.querySelector('webview');
        if (!webview) {
          return { success: false, error: 'Webview not found' };
        }
        
        try {
          const loginStatus = await webview.executeJavaScript(\`
            (function() {
              const url = window.location.href;
              const hostname = window.location.hostname;
              
              // 檢查是否在 Gmail 頁面
              const isOnGmail = hostname.includes('mail.google.com');
              
              // 檢查是否有登入指示器
              const hasUserAvatar = document.querySelector('[data-email], .gb_A, .gb_d, .go3jq, [aria-label*="帳戶"]');
              const hasAccountMenu = document.querySelector('[data-ved], .gb_B, .gb_e');
              
              // 檢查 URL 是否表示已登入
              const urlIndicatesLogin = !url.includes('signin') && !url.includes('login');
              
              return {
                url: url,
                hostname: hostname,
                isOnGmail: isOnGmail,
                hasUserElements: !!hasUserAvatar,
                hasAccountMenu: !!hasAccountMenu,
                urlIndicatesLogin: urlIndicatesLogin,
                likelyLoggedIn: (isOnGmail && urlIndicatesLogin) || !!(hasUserAvatar || hasAccountMenu)
              };
            })();
          \`);
          
          return { success: true, status: loginStatus };
        } catch (webviewError) {
          return { success: false, error: 'Failed to check login status in webview: ' + webviewError.message };
        }
      })();
    `);
    
    return result;
  } catch (error) {
    console.error('Check login status error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 調試：檢查 webview cookies
ipcMain.handle('debug-webview-cookies', async (event) => {
  try {
    const { session } = require('electron');
    const webviewSession = session.fromPartition('persist:browser');
    
    console.log('🔍 Checking webview cookies...');
    
    const googleDomains = ['.google.com', '.accounts.google.com', '.gmail.com'];
    const allCookies = {};
    
    for (const domain of googleDomains) {
      const cookies = await webviewSession.cookies.get({ domain });
      allCookies[domain] = cookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 20) + (c.value.length > 20 ? '...' : ''),
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        secure: c.secure
      }));
    }
    
    console.log('Webview cookies:', allCookies);
    
    // 檢查重要的 Google 認證 Cookie
    const authCookies = [];
    for (const domain in allCookies) {
      const cookies = allCookies[domain];
      for (const cookie of cookies) {
        if (['SID', 'HSID', 'SSID', 'LSID', 'SAPISID', 'APISID', 'COMPASS', '1P_JAR'].includes(cookie.name)) {
          authCookies.push({
            domain,
            name: cookie.name,
            hasValue: !!cookie.value
          });
        }
      }
    }
    
    return {
      success: true,
      cookies: allCookies,
      authCookies,
      hasGoogleAuth: authCookies.length > 0
    };
  } catch (error) {
    console.error('Cookie debug error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

module.exports = { internalClick, internalScroll, internalGetPageData };
