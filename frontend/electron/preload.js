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
    click: (selector, options) => ipcRenderer.invoke('browser-click', selector, options),
    type: (selector, text, options) => ipcRenderer.invoke('browser-type', selector, text, options),
    scroll: (direction, amount) => ipcRenderer.invoke('browser-scroll', direction, amount),
    navigate: (url, options) => ipcRenderer.invoke('browser-navigate', url, options),
    waitElement: (selector, timeout) => ipcRenderer.invoke('browser-wait-element', selector, timeout),
    waitNavigation: (timeout) => ipcRenderer.invoke('browser-wait-navigation', timeout),
    screenshot: (options) => ipcRenderer.invoke('browser-screenshot', options),
    executeScript: (script) => ipcRenderer.invoke('browser-execute-script', script),
    getPageData: (options) => ipcRenderer.invoke('browser-get-page-data', options),
  },

  // OAuth APIs
  oauth: {
    startFlow: (config) => ipcRenderer.invoke('oauth-start-flow', config),
    exchangeToken: (config) => ipcRenderer.invoke('oauth-exchange-token', config),
    refreshToken: (config) => ipcRenderer.invoke('oauth-refresh-token', config),
    stopFlow: () => ipcRenderer.invoke('oauth-stop-flow'),
  },

  // Debug APIs (deprecated - moved to oauth)
  debug: {
    checkWebviewCookies: () => ipcRenderer.invoke('debug-webview-cookies')
  }
});
