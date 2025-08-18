# 瀏覽器控制 API 使用說明

## 🚀 概述

這個瀏覽器控制 API 讓您能夠像使用 Playwright 一樣控制 Electron 應用中的 webview 內容。所有操作都直接在 webview 的上下文中執行，確保了操作的有效性和可靠性。

## 📋 可用的 API 方法

### 1. 基本操作

#### `click(selector, options)`
點擊頁面中的元素。

**參數：**
- `selector` (string): CSS 選擇器
- `options` (object, 可選):
  - `button` (string): 滑鼠按鈕 ('left', 'right', 'middle')
  - `doubleClick` (boolean): 是否雙擊
  - `delay` (number): 操作後的延遲時間（毫秒）

**示例：**
```javascript
// 點擊搜尋按鈕
await window.browserControl.click('button[type="submit"]');

// 右鍵點擊元素
await window.browserControl.click('.menu-item', { button: 'right' });

// 雙擊元素
await window.browserControl.click('.file-item', { doubleClick: true });

// 點擊後等待 500ms
await window.browserControl.click('.submit-btn', { delay: 500 });
```

#### `type(selector, text, options)`
在輸入框中輸入文字。

**參數：**
- `selector` (string): CSS 選擇器
- `text` (string): 要輸入的文字
- `options` (object, 可選):
  - `clear` (boolean): 是否先清空輸入框
  - `pressEnter` (boolean): 輸入後是否按 Enter 鍵
  - `delay` (number): 操作後的延遲時間（毫秒）

**示例：**
```javascript
// 在搜尋框輸入文字
await window.browserControl.type('input[name="q"]', 'Hello World');

// 清空輸入框後輸入新文字
await window.browserControl.type('input[name="email"]', 'test@example.com', { clear: true });

// 輸入後按 Enter 鍵
await window.browserControl.type('input[name="search"]', 'search term', { pressEnter: true });

// 輸入後等待 1 秒
await window.browserControl.type('textarea', 'Long text content', { delay: 1000 });
```

#### `scroll(direction, amount)`
滾動頁面。

**參數：**
- `direction` (string): 滾動方向 ('up', 'down', 'left', 'right', 'top', 'bottom')
- `amount` (number, 可選): 滾動距離（像素），預設為 300

**示例：**
```javascript
// 向下滾動 500 像素
await window.browserControl.scroll('down', 500);

// 向上滾動 300 像素
await window.browserControl.scroll('up');

// 滾動到頁面頂部
await window.browserControl.scroll('top');

// 滾動到頁面底部
await window.browserControl.scroll('bottom');

// 向左滾動 200 像素
await window.browserControl.scroll('left', 200);
```

#### `navigate(url)`
導航到新的 URL。

**參數：**
- `url` (string): 目標 URL

**示例：**
```javascript
// 導航到 Google
await window.browserControl.navigate('https://www.google.com');

// 導航到相對路徑
await window.browserControl.navigate('/dashboard');

// 導航到沒有協議的 URL（會自動添加 https://）
await window.browserControl.navigate('example.com');
```

### 2. 進階操作

#### `getPageData()`
獲取當前頁面的詳細信息。

**返回值：**
```javascript
{
  title: "頁面標題",
  url: "頁面 URL",
  content: "頁面文字內容",
  links: [
    {
      text: "連結文字",
      href: "連結 URL",
      selector: "CSS 選擇器"
    }
  ],
  interactiveElements: [
    {
      type: "button",
      text: "按鈕文字",
      selector: "CSS 選擇器",
      index: 0
    }
  ]
}
```

**示例：**
```javascript
// 獲取頁面數據
const pageData = await window.browserControl.getPageData();
console.log('頁面標題:', pageData.title);
console.log('頁面連結數量:', pageData.links.length);
console.log('互動元素數量:', pageData.interactiveElements.length);

// 遍歷所有連結
pageData.links.forEach(link => {
  console.log(`${link.text}: ${link.href}`);
});

// 遍歷所有按鈕
pageData.interactiveElements
  .filter(el => el.type === 'button')
  .forEach(button => {
    console.log(`按鈕: ${button.text} (${button.selector})`);
  });
```

#### `waitForElement(selector, timeout)`
等待元素出現在頁面中。

**參數：**
- `selector` (string): CSS 選擇器
- `timeout` (number, 可選): 超時時間（毫秒），預設為 5000

**示例：**
```javascript
// 等待搜尋框出現
await window.browserControl.waitForElement('input[name="q"]');

// 等待元素出現，超時時間為 10 秒
await window.browserControl.waitForElement('.loading-spinner', 10000);

// 等待多個元素
await Promise.all([
  window.browserControl.waitForElement('.header'),
  window.browserControl.waitForElement('.content'),
  window.browserControl.waitForElement('.footer')
]);
```

#### `waitForNavigation(timeout)`
等待頁面導航完成。

**參數：**
- `timeout` (number, 可選): 超時時間（毫秒），預設為 10000

**示例：**
```javascript
// 點擊連結後等待導航完成
await window.browserControl.click('a[href="/next-page"]');
await window.browserControl.waitForNavigation();

// 等待導航完成，超時時間為 15 秒
await window.browserControl.waitForNavigation(15000);
```

#### `executeScript(script)`
在頁面中執行 JavaScript 代碼。

**參數：**
- `script` (string): 要執行的 JavaScript 代碼

**示例：**
```javascript
// 獲取頁面標題
const title = await window.browserControl.executeScript('document.title');

// 獲取元素屬性
const href = await window.browserControl.executeScript(`
  document.querySelector('a.button').getAttribute('href')
`);

// 執行複雜的腳本
const result = await window.browserControl.executeScript(`
  (function() {
    const elements = document.querySelectorAll('.item');
    return Array.from(elements).map(el => ({
      text: el.textContent,
      className: el.className,
      rect: el.getBoundingClientRect()
    }));
  })();
`);

// 修改頁面內容
await window.browserControl.executeScript(`
  document.body.style.backgroundColor = 'lightblue';
  document.title = 'Modified Title';
`);
```

#### `takeScreenshot(options)`
截取頁面截圖。

**參數：**
- `options` (object, 可選): 截圖選項

**示例：**
```javascript
// 截取整個頁面
const screenshot = await window.browserControl.takeScreenshot();

// 截取特定區域
const areaScreenshot = await window.browserControl.takeScreenshot({
  clip: { x: 0, y: 0, width: 800, height: 600 }
});
```

## 🔧 實際使用場景

### 1. 自動化登入

```javascript
async function autoLogin(username, password) {
  try {
    // 導航到登入頁面
    await window.browserControl.navigate('https://example.com/login');
    
    // 等待登入表單載入
    await window.browserControl.waitForElement('#login-form');
    
    // 輸入用戶名
    await window.browserControl.type('#username', username, { clear: true });
    
    // 輸入密碼
    await window.browserControl.type('#password', password, { clear: true });
    
    // 點擊登入按鈕
    await window.browserControl.click('#login-btn');
    
    // 等待登入完成
    await window.browserControl.waitForNavigation();
    
    console.log('登入成功！');
  } catch (error) {
    console.error('登入失敗:', error);
  }
}

// 使用示例
await autoLogin('myuser', 'mypassword');
```

### 2. 自動化表單填寫

```javascript
async function fillForm(formData) {
  try {
    // 等待表單載入
    await window.browserControl.waitForElement('form');
    
    // 填寫各個欄位
    for (const [field, value] of Object.entries(formData)) {
      const selector = `[name="${field}"]`;
      
      // 等待欄位出現
      await window.browserControl.waitForElement(selector);
      
      // 填寫內容
      await window.browserControl.type(selector, value, { clear: true });
      
      // 短暫延遲
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 提交表單
    await window.browserControl.click('button[type="submit"]');
    
    console.log('表單填寫完成！');
  } catch (error) {
    console.error('表單填寫失敗:', error);
  }
}

// 使用示例
const formData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '123-456-7890'
};

await fillForm(formData);
```

### 3. 自動化數據提取

```javascript
async function extractTableData() {
  try {
    // 等待表格載入
    await window.browserControl.waitForElement('table');
    
    // 提取表格數據
    const tableData = await window.browserControl.executeScript(`
      (function() {
        const rows = document.querySelectorAll('table tr');
        return Array.from(rows).map(row => {
          const cells = row.querySelectorAll('td, th');
          return Array.from(cells).map(cell => cell.textContent.trim());
        });
      })();
    `);
    
    console.log('表格數據:', tableData);
    return tableData;
  } catch (error) {
    console.error('數據提取失敗:', error);
    return null;
  }
}

// 使用示例
const data = await extractTableData();
```

### 4. 自動化測試

```javascript
async function runAutomatedTest() {
  const testResults = [];
  
  try {
    // 測試 1: 導航
    console.log('測試 1: 導航到頁面');
    const navResult = await window.browserControl.navigate('https://example.com');
    testResults.push({ test: '導航', success: navResult.success });
    
    // 測試 2: 等待元素
    console.log('測試 2: 等待頁面元素');
    const waitResult = await window.browserControl.waitForElement('.main-content');
    testResults.push({ test: '等待元素', success: waitResult.success });
    
    // 測試 3: 點擊
    console.log('測試 3: 點擊按鈕');
    const clickResult = await window.browserControl.click('.test-button');
    testResults.push({ test: '點擊', success: clickResult.success });
    
    // 測試 4: 獲取頁面數據
    console.log('測試 4: 獲取頁面數據');
    const pageData = await window.browserControl.getPageData();
    testResults.push({ test: '獲取頁面數據', success: !pageData.error });
    
    console.log('測試結果:', testResults);
    return testResults;
    
  } catch (error) {
    console.error('測試執行失敗:', error);
    return testResults;
  }
}

// 執行測試
await runAutomatedTest();
```

## 🚨 注意事項

### 1. 選擇器策略
- **優先使用 ID 選擇器**：`#username` 比 `.username` 更可靠
- **避免過於複雜的選擇器**：`div.container > div.content > button` 容易失效
- **使用屬性選擇器**：`[name="search"]` 比類名更穩定

### 2. 等待策略
- **總是等待元素出現**：在操作前使用 `waitForElement`
- **等待導航完成**：點擊連結後使用 `waitForNavigation`
- **適當的延遲**：某些操作後添加延遲讓頁面響應

### 3. 錯誤處理
- **使用 try-catch**：包裝所有 API 調用
- **檢查返回值**：驗證操作是否成功
- **提供用戶反饋**：顯示操作狀態和錯誤信息

### 4. 效能優化
- **批量操作**：將多個操作組合在一起
- **避免過度等待**：設置合理的超時時間
- **重用選擇器**：將常用的選擇器存儲為變數

## 🔍 調試技巧

### 1. 控制台調試
```javascript
// 檢查 API 是否可用
console.log('瀏覽器控制 API:', window.browserControl);

// 測試基本功能
window.browserControl.getPageData().then(console.log);

// 檢查頁面狀態
window.browserControl.executeScript('document.readyState').then(console.log);
```

### 2. 開發者工具
- 在 webview 中打開開發者工具來檢查元素
- 使用 Console 面板測試選擇器
- 使用 Network 面板監控頁面載入

### 3. 日誌記錄
```javascript
// 創建詳細的日誌
async function logOperation(operation, ...args) {
  console.log(`[${new Date().toISOString()}] ${operation}`, ...args);
  
  try {
    const result = await window.browserControl[operation](...args);
    console.log(`✅ ${operation} 成功:`, result);
    return result;
  } catch (error) {
    console.error(`❌ ${operation} 失敗:`, error);
    throw error;
  }
}

// 使用示例
await logOperation('click', '.submit-btn');
await logOperation('type', '#email', 'test@example.com');
```

## 📚 進階用法

### 1. 自定義等待條件
```javascript
async function waitForCondition(condition, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = await window.browserControl.executeScript(condition);
      if (result) {
        return { success: true, result };
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // 繼續等待
    }
  }
  
  return { success: false, error: 'Timeout' };
}

// 等待特定文字出現
await waitForCondition(`
  document.body.textContent.includes('Welcome')
`);

// 等待元素數量達到預期
await waitForCondition(`
  document.querySelectorAll('.item').length >= 5
`);
```

### 2. 重試機制
```javascript
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      console.log(`操作失敗，${delay}ms 後重試 (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 使用示例
await retryOperation(async () => {
  return await window.browserControl.click('.unreliable-button');
});
```

### 3. 批量操作
```javascript
async function batchOperations(operations) {
  const results = [];
  
  for (const operation of operations) {
    try {
      const result = await window.browserControl[operation.type](...operation.args);
      results.push({ success: true, operation: operation.type, result });
      
      // 添加延遲避免操作過快
      if (operation.delay) {
        await new Promise(resolve => setTimeout(resolve, operation.delay));
      }
    } catch (error) {
      results.push({ success: false, operation: operation.type, error: error.message });
    }
  }
  
  return results;
}

// 使用示例
const operations = [
  { type: 'click', args: ['.tab-1'] },
  { type: 'waitForElement', args: ['.content-1'], delay: 500 },
  { type: 'click', args: ['.tab-2'] },
  { type: 'waitForElement', args: ['.content-2'], delay: 500 }
];

const results = await batchOperations(operations);
console.log('批量操作結果:', results);
```

這個瀏覽器控制 API 為您提供了強大而靈活的網頁自動化能力，讓您能夠輕鬆實現各種複雜的網頁操作和測試場景。

