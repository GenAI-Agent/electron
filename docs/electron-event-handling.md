# Electron 事件處理完整指南

## 📋 概述

本文檔基於實際開發經驗，總結了在 Electron 應用中處理拖曳調整面板大小的最佳實踐和常見問題解決方案。

## 🔍 核心問題分析

### 1. 主要挑戰
- **webview 事件攔截**：webview 元素會攔截滑鼠事件，干擾拖曳操作
- **CSS 區域設定衝突**：`-webkit-app-region` 設定過於寬泛會影響互動元素
- **事件傳播問題**：在 Electron 環境下事件傳播機制與普通網頁不同
- **跨平台一致性**：不同操作系統下的行為差異

### 2. 根本原因
```css
/* 問題：全域設定會影響所有元素 */
body {
  -webkit-app-region: drag; /* 過於寬泛 */
}
```

## 🛠️ 解決方案

### 1. CSS 優化策略

#### 精確控制拖曳區域
```css
/* 移除全域拖曳設定 */
html, body {
  /* 不設定 -webkit-app-region */
}

/* 只在標題欄設定拖曳 */
.title-bar {
  -webkit-app-region: drag;
}

/* 確保互動元素不可拖曳 */
button, input, textarea, select, a, [role="button"], webview, iframe {
  -webkit-app-region: no-drag;
}

/* 拖曳手柄專用樣式 */
.drag-handle {
  -webkit-app-region: no-drag;
  user-select: none;
  -webkit-user-select: none;
  cursor: col-resize; /* 或 row-resize */
}

/* 拖曳狀態樣式 */
.dragging {
  user-select: none !important;
  pointer-events: none !important;
}
```

### 2. JavaScript 事件處理最佳實踐

#### 完整的拖曳實現
```typescript
const startDrag = (clientX: number) => {
  // 1. 立即設定拖曳狀態
  setIsDragging(true);
  
  // 2. 設定全域樣式
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.body.style.pointerEvents = 'none';
  document.body.classList.add('dragging');

  const onMove = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 處理拖曳邏輯
  };

  const onUp = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 3. 清理事件監聽器（使用 capture）
    document.removeEventListener('mousemove', onMove, { capture: true } as any);
    document.removeEventListener('mouseup', onUp, { capture: true } as any);
    
    // 4. 重置樣式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
    document.body.classList.remove('dragging');
    
    setIsDragging(false);
  };

  // 5. 使用 capture 模式確保事件不被攔截
  document.addEventListener('mousemove', onMove, { passive: false, capture: true });
  document.addEventListener('mouseup', onUp, { passive: false, capture: true });
};
```

### 3. webview 事件管理

#### 動態禁用 webview 事件
```typescript
// 在拖曳時禁用 webview
<webview
  style={{
    pointerEvents: isDragging ? 'none' : 'auto',
    userSelect: isDragging ? 'none' : 'auto',
  }}
/>

// 在父組件中管理拖曳狀態
const [isDragging, setIsDragging] = useState(false);

<BrowserView 
  url={url} 
  disablePointerEvents={isDragging} 
/>
```

## 🎯 關鍵技術要點

### 1. 事件選項配置
```typescript
// 使用正確的事件選項
document.addEventListener('mousemove', handler, {
  passive: false,  // 允許 preventDefault
  capture: true    // 在捕獲階段處理，避免被攔截
});
```

### 2. 樣式重置順序
```typescript
const cleanup = () => {
  // 順序很重要：先移除監聽器，再重置樣式
  document.removeEventListener('mousemove', onMove, { capture: true });
  document.removeEventListener('mouseup', onUp, { capture: true });
  
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  document.body.style.pointerEvents = '';
  document.body.classList.remove('dragging');
};
```

### 3. 防止事件洩漏
```typescript
// 使用 useRef 避免閉包問題
const rafRef = useRef<number | null>(null);

const cleanup = () => {
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }
};
```

## 🚨 常見陷阱

### 1. 全域 CSS 設定
```css
/* ❌ 錯誤：會影響所有互動 */
body { -webkit-app-region: drag; }

/* ✅ 正確：精確控制 */
.title-bar { -webkit-app-region: drag; }
```

### 2. 事件清理不完整
```typescript
// ❌ 錯誤：沒有使用相同的選項
document.addEventListener('mousemove', handler, { capture: true });
document.removeEventListener('mousemove', handler); // 不會移除

// ✅ 正確：選項必須一致
document.removeEventListener('mousemove', handler, { capture: true });
```

### 3. 拖曳狀態管理
```typescript
// ❌ 錯誤：狀態更新順序錯誤
document.addEventListener('mousemove', onMove);
setIsDragging(true); // 太晚了

// ✅ 正確：立即設定狀態
setIsDragging(true);
document.addEventListener('mousemove', onMove);
```

## 📊 效能優化

### 1. 使用 requestAnimationFrame
```typescript
const move = (clientX: number) => {
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(() => {
    // 更新 UI
  });
};
```

### 2. 事件節流
```typescript
let lastMoveTime = 0;
const onMove = (e: MouseEvent) => {
  const now = Date.now();
  if (now - lastMoveTime < 16) return; // ~60fps
  lastMoveTime = now;
  // 處理移動
};
```

## 🔧 調試技巧

### 1. 事件監聽器檢查
```typescript
// 在開發者工具中檢查
getEventListeners(document);
```

### 2. CSS 區域可視化
```css
/* 臨時添加邊框查看拖曳區域 */
.drag-handle {
  border: 2px solid red !important;
}
```

## 📝 總結

成功實現 Electron 中的拖曳功能需要：

1. **精確的 CSS 設定**：避免全域 `-webkit-app-region`
2. **正確的事件處理**：使用 capture 模式和正確的清理
3. **webview 管理**：動態禁用指標事件
4. **狀態同步**：確保拖曳狀態及時更新
5. **效能優化**：使用 RAF 和事件節流

遵循這些最佳實踐，可以創建流暢、可靠的拖曳調整功能。
