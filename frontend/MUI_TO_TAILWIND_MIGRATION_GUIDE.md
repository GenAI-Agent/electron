# MUI 到 Tailwind V4 遷移指南

## 🎯 遷移概覽

**已完成設置：**
- ✅ 移除 MUI 依賴 (@mui/material, @mui/icons-material, @emotion/react, @emotion/styled)
- ✅ 添加 Tailwind V4 和相關依賴
- ✅ 配置 Tailwind CSS
- ✅ 更新 globals.css 和 _app.tsx
- ✅ 遷移示例組件 (ViewToggle)

**待遷移組件 (18個)：**
1. TitleBar.tsx
2. ResultPanel.tsx  
3. LocalFileCards.tsx
4. FileEditor.tsx (新增)
5. FileCardBrowser.tsx
6. ChartViewer.tsx (新增)
7. AgentPanel.tsx
8. RulesPanel.tsx
9. PageDataExtractorTest.tsx
10. LocalFileBrowser.tsx
11. InputArea.tsx
12. GoogleAuth.tsx
13. FileViewer.tsx
14. BrowserView.tsx
15. index.tsx
16. browser.tsx
17. gmail-auth.tsx

## 🔄 遷移模式和對照表

### 常見 MUI → Tailwind 對應

#### 佈局組件
```tsx
// MUI Box → Tailwind div
<Box sx={{ display: 'flex', flexDirection: 'column' }}>
<div className="flex flex-col">

// MUI Container → Tailwind div
<Container maxWidth="lg">
<div className="max-w-7xl mx-auto px-4">

// MUI Stack → Tailwind div
<Stack spacing={2} direction="row">
<div className="flex flex-row gap-2">

// MUI Grid → Tailwind div
<Grid container spacing={2}>
<div className="grid grid-cols-12 gap-2">
```

#### 輸入組件
```tsx
// MUI TextField → Tailwind input
<TextField 
  variant="outlined" 
  size="small" 
  placeholder="搜尋..."
/>
<input 
  className="border border-gray-300 rounded-md px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
  placeholder="搜尋..."
/>

// MUI Button → Tailwind button
<Button variant="contained" size="small">
<button className="bg-primary-500 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-600 transition-colors">
```

#### 表面組件
```tsx
// MUI Paper → Tailwind div
<Paper sx={{ p: 2, borderRadius: 2 }}>
<div className="bg-white p-2 rounded-lg shadow-sm">

// MUI Card → Tailwind div
<Card sx={{ maxWidth: 345 }}>
<div className="max-w-sm bg-white rounded-lg shadow-md">
```

### 圖標遷移
```tsx
// MUI Icons → Lucide React
import { Add, Delete, Edit } from '@mui/icons-material';
import { Plus, Trash2, Edit } from 'lucide-react';

// 使用方式
<Add fontSize="small" />
<Plus className="w-4 h-4" />
```

### 樣式系統遷移
```tsx
// MUI sx prop → Tailwind classes
sx={{
  position: 'fixed',
  top: 0,
  right: 0,
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  zIndex: 1000,
}}
className="fixed top-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000]"

// 條件樣式
sx={{
  bgcolor: isActive ? '#f1f5f9' : 'transparent',
  color: isActive ? '#64748b' : '#94a3b8',
}}
className={cn(
  isActive ? "bg-slate-100 text-slate-600" : "bg-transparent text-slate-400"
)}
```

## 🛠️ 遷移步驟

### 1. 基本遷移模板
```tsx
// 前
import React from 'react';
import { Box, Button, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';

// 後  
import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
```

### 2. 組件結構遷移
```tsx
// 前
const MyComponent = () => {
  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
      <TextField variant="outlined" size="small" />
      <Button variant="contained">Submit</Button>
    </Box>
  );
};

// 後
const MyComponent = () => {
  return (
    <div className="p-2 bg-white">
      <input className="border border-gray-300 rounded px-3 py-2 text-sm" />
      <button className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600">
        Submit
      </button>
    </div>
  );
};
```

### 3. 複雜樣式遷移
```tsx
// 前 - 複雜的 sx 樣式
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: { xs: 1, sm: 2 },
    bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'white',
    borderRadius: 2,
    border: 1,
    borderColor: 'divider',
    '&:hover': {
      bgcolor: 'action.hover',
    },
  }}
>

// 後 - Tailwind 等效
<div className={cn(
  "flex items-center justify-between",
  "p-1 sm:p-2",
  "bg-white rounded-lg border border-gray-200",
  "hover:bg-gray-50 transition-colors"
)}>
```

## 🎨 設計系統保持一致

### 顏色配置
```tsx
// tailwind.config.ts 中已配置的顏色
colors: {
  primary: {
    main: '#64748b',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  background: {
    default: '#eef5fb',
    paper: '#eef5fb',
  }
}
```

### 常用樣式類
```css
/* 可以添加到 globals.css 的 @layer components 中 */
@layer components {
  .btn-primary {
    @apply bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-sm border border-slate-200;
  }
  
  .input-field {
    @apply border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
}
```

## 🚀 遷移建議

### 優先順序
1. **高優先級** - 基礎佈局組件：TitleBar, BrowserView
2. **中優先級** - 功能組件：AgentPanel, InputArea, ResultPanel  
3. **低優先級** - 特定頁面：index, browser, gmail-auth

### 遷移策略
1. **逐一遷移** - 一次遷移一個組件
2. **測試驗證** - 每個組件遷移後立即測試
3. **保持功能性** - 確保 Electron IPC 和 webview 控制不受影響

### 注意事項
- 保持原有的事件處理邏輯
- Electron 相關的樣式（如 `-webkit-app-region`）需要保留
- webview 控制邏輯完全不需要改變

## 📦 下一步

現在你可以：

1. **運行安裝命令**：
   ```bash
   cd frontend
   bun install
   ```

2. **測試 ViewToggle 組件**：
   ```bash
   bun dev
   ```

3. **開始遷移其他組件** - 建議從 TitleBar.tsx 開始

4. **需要幫助時** - 參考 ViewToggle.tsx 的遷移模式

遷移完成後，你的應用將具備：
- 更小的包體積
- 更好的性能
- 更現代的開發體驗
- 更靈活的樣式系統