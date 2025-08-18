# Electron 瀏覽器自動化解決方案

## 🎯 專案概述

這個專案解決了 Electron 應用中瀏覽器控制 API 無法正常工作的核心問題。通過重新設計架構，我們實現了類似 Playwright 的強大網頁自動化能力。

## 🔍 問題分析

### 原始問題
- **架構層級錯誤**：瀏覽器控制代碼寫在 `main.js` 中，但實際網頁內容在 `webview` 元素內
- **執行上下文錯誤**：`mainWindow.webContents.executeJavaScript()` 執行在 Next.js 頁面上下文中，無法操作 webview 內容
- **選擇器範圍限制**：無法直接操作 webview 內部的 DOM 元素

### 架構圖解
```
❌ 原始架構（有問題）
Electron Main Process (main.js)
├── BrowserWindow (mainWindow)
│   └── Next.js App (/browser)
│       └── webview element
│           └── 實際網頁內容 (Gmail, 其他網站)

✅ 新架構（解決方案）
BrowserView 組件 (React)
├── useImperativeHandle 暴露方法
├── webview 直接操作
└── 統一的 API 介面
```

## 🛠️ 解決方案

### 核心思路
1. **直接操作 webview**：所有瀏覽器控制操作都通過 webview 的 `executeJavaScript` 方法執行
2. **React 組件封裝**：使用 `useImperativeHandle` 將瀏覽器控制方法暴露給父組件
3. **全域 API 暴露**：通過 `window.browserControl` 讓任何地方都能調用瀏覽器控制方法

### 技術實現
- **BrowserView 組件**：封裝所有瀏覽器控制邏輯
- **useImperativeHandle**：暴露方法給父組件
- **webview.executeJavaScript**：在正確的上下文中執行腳本
- **事件監聽**：處理頁面載入、導航等事件

## 📁 檔案結構

```
docs/
├── README.md                           # 本文件
├── electron-event-handling.md          # Electron 事件處理指南
├── electron-browser-automation-solution.md  # 完整解決方案
└── browser-control-api-usage.md        # API 使用說明

frontend/src/
├── components/
│   ├── BrowserView.tsx                 # 核心瀏覽器控制組件
│   └── BrowserControlTest.tsx          # 測試工具組件
└── pages/
    └── browser.tsx                     # 瀏覽器頁面（已更新）
```

## 🚀 使用方法

### 1. 基本使用
```javascript
// 檢查 API 是否可用
if (window.browserControl) {
  console.log('瀏覽器控制 API 已就緒');
}

// 點擊元素
await window.browserControl.click('button[type="submit"]');

// 輸入文字
await window.browserControl.type('input[name="q"]', 'Hello World');

// 滾動頁面
await window.browserControl.scroll('down', 500);
```

### 2. 進階操作
```javascript
// 等待元素出現
await window.browserControl.waitForElement('.content');

// 獲取頁面數據
const pageData = await window.browserControl.getPageData();

// 執行自定義腳本
const result = await window.browserControl.executeScript('document.title');
```

### 3. 自動化腳本
```javascript
async function autoLogin() {
  await window.browserControl.navigate('https://example.com/login');
  await window.browserControl.waitForElement('#login-form');
  await window.browserControl.type('#username', 'user');
  await window.browserControl.type('#password', 'pass');
  await window.browserControl.click('#login-btn');
  await window.browserControl.waitForNavigation();
}
```

## 🔧 可用的 API 方法

| 方法 | 描述 | 參數 |
|------|------|------|
| `click(selector, options)` | 點擊元素 | selector, options |
| `type(selector, text, options)` | 輸入文字 | selector, text, options |
| `scroll(direction, amount)` | 滾動頁面 | direction, amount |
| `navigate(url)` | 導航到 URL | url |
| `getPageData()` | 獲取頁面數據 | 無 |
| `waitForElement(selector, timeout)` | 等待元素出現 | selector, timeout |
| `waitForNavigation(timeout)` | 等待導航完成 | timeout |
| `executeScript(script)` | 執行 JavaScript | script |
| `takeScreenshot(options)` | 截取截圖 | options |

## 📊 效能特點

### 優勢
- **直接操作**：所有操作都在 webview 上下文中執行，無需 IPC 通信
- **即時響應**：操作結果立即返回，無延遲
- **資源節省**：不需要額外的進程或服務
- **穩定性高**：避免了跨進程通信的複雜性

### 限制
- **單頁面操作**：只能操作當前 webview 中的頁面
- **同步執行**：操作按順序執行，不支援並行
- **錯誤處理**：需要手動處理各種異常情況

## 🧪 測試和調試

### 1. 使用測試工具
```javascript
// 在瀏覽器控制台中測試
window.browserControl.getPageData().then(console.log);
```

### 2. 開發者工具
- 在 webview 中打開開發者工具
- 使用 Console 面板測試選擇器
- 監控 Network 和 Console 輸出

### 3. 錯誤處理
```javascript
try {
  const result = await window.browserControl.click('.button');
  console.log('操作成功:', result);
} catch (error) {
  console.error('操作失敗:', error);
}
```

## 🔮 未來改進

### 短期目標
- [ ] 添加更多元素選擇器策略
- [ ] 實現並行操作支援
- [ ] 添加操作錄製和回放功能

### 長期目標
- [ ] 支援多個 webview 同時控制
- [ ] 實現視覺化測試腳本編輯器
- [ ] 添加 AI 輔助的元素識別

## 📚 相關文檔

- [Electron 事件處理指南](./electron-event-handling.md)
- [完整解決方案文檔](./electron-browser-automation-solution.md)
- [API 使用說明](./browser-control-api-usage.md)

## 🤝 貢獻指南

如果您發現問題或有改進建議，請：

1. 檢查現有文檔
2. 在 GitHub 上創建 Issue
3. 提交 Pull Request

## 📄 授權

本專案採用 MIT 授權條款。

---

**注意**：這個解決方案專門針對 Electron 應用中的 webview 控制問題設計。如果您需要在其他環境中使用，可能需要進行相應的調整。

