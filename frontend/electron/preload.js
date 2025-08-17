const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigateToUrl: (url) => ipcRenderer.invoke('navigate-to-url', url),
  getBrowserState: () => ipcRenderer.invoke('get-browser-state'),
  navigateToGoogle: () => ipcRenderer.invoke('navigate-to-google'),

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

  // OAuth 2.0 APIs
  oauth: {
    startFlow: (config) => ipcRenderer.invoke('oauth-start-flow', config),
    exchangeToken: (config) => ipcRenderer.invoke('oauth-exchange-token', config),
    refreshToken: (config) => ipcRenderer.invoke('oauth-refresh-token', config),
    stopFlow: () => ipcRenderer.invoke('oauth-stop-flow')
  },

  // Browser Control APIs
  browserControl: {
    click: (selector, options) => ipcRenderer.invoke('browser-click', selector, options),
    type: (selector, text, options) => ipcRenderer.invoke('browser-type', selector, text, options),
    scroll: (direction, amount) => ipcRenderer.invoke('browser-scroll', direction, amount),
    navigate: (url, options) => ipcRenderer.invoke('browser-navigate', url, options),
    waitForElement: (selector, timeout) => ipcRenderer.invoke('browser-wait-element', selector, timeout),
    waitForNavigation: (timeout) => ipcRenderer.invoke('browser-wait-navigation', timeout),
    takeScreenshot: (options) => ipcRenderer.invoke('browser-screenshot', options),
    executeScript: (script) => ipcRenderer.invoke('browser-execute-script', script),
    getPageData: () => ipcRenderer.invoke('browser-get-page-data'),
    getPageData: () => ipcRenderer.invoke('browser-get-page-data')
  }
});
