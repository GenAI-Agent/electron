const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigateToUrl: (url) => ipcRenderer.invoke('navigate-to-url', url),
  getBrowserState: () => ipcRenderer.invoke('get-browser-state'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // File system APIs
  getDesktopPath: () => ipcRenderer.invoke('get-desktop-path'),
  getDocumentsPath: () => ipcRenderer.invoke('get-documents-path'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readFileBase64: (filePath) => ipcRenderer.invoke('read-file-base64', filePath),

  // Extended file operations
  writeFile: (filePath, content, encoding) => ipcRenderer.invoke('write-file', filePath, content, encoding),
  createFile: (filePath, content, encoding) => ipcRenderer.invoke('create-file', filePath, content, encoding),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  editFileLines: (filePath, startLine, endLine, newContent) => ipcRenderer.invoke('edit-file-lines', filePath, startLine, endLine, newContent),



  // Browser Control APIs (簡化版，只保留必要的API)
  browserControl: {
    getPageData: () => ipcRenderer.invoke('browser-get-page-data'),
    testScroll: (direction, amount) => ipcRenderer.invoke('browser-test-scroll', direction, amount),
    testNavigate: (url) => ipcRenderer.invoke('browser-test-navigate', url),
    testClick: (selector) => ipcRenderer.invoke('browser-test-click', selector),
    testType: (selector, text) => ipcRenderer.invoke('browser-test-type', selector, text)
  },

  // OAuth APIs
  oauth: {
    startFlow: (config) => ipcRenderer.invoke('oauth-start-flow', config),
    exchangeToken: (config) => ipcRenderer.invoke('oauth-exchange-token', config),
    refreshToken: (config) => ipcRenderer.invoke('oauth-refresh-token', config),
    stopFlow: () => ipcRenderer.invoke('oauth-stop-flow'),
    syncGoogleCookies: (tokens) => ipcRenderer.invoke('sync-google-cookies', tokens),
    injectGoogleAuth: (authData) => ipcRenderer.invoke('inject-google-auth', authData),
    injectWebviewToken: (tokenData) => ipcRenderer.invoke('inject-webview-token', tokenData),
    startWebviewGoogleLogin: () => ipcRenderer.invoke('start-webview-google-login'),
    checkWebviewLoginStatus: () => ipcRenderer.invoke('check-webview-login-status'),
    debugWebviewCookies: () => ipcRenderer.invoke('debug-webview-cookies')
  },

  // Debug APIs (deprecated - moved to oauth)
  debug: {
    checkWebviewCookies: () => ipcRenderer.invoke('debug-webview-cookies')
  }
});
