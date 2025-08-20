# Lens OS App UI 設計規格 (for Claude)

## 🎨 整體設計風格

🎨 整體設計風格（Updated）

定位：企業級、商業導向、專業可信賴（B2B / 內部工具 / 管理後台）

主題：同時支援 Light / Dark

Light（預設）：明亮中性背景，品牌藍作為主行為色（符合方案 A）

Dark：石墨黑基底，降低高光與飽和度，保留品牌藍作為重點

字體：Inter / SF Pro / Roboto（字重 400/500 為主，標題可用 600）

行高：正文 1.5、標題 1.25

字級：12 / 14 / 16（預設）/ 18 / 20 / 24 / 32

風格：專業 Dashboard + 企業 SaaS

扁平化 + 卡片式結構，資訊層級清楚

圓角：標準 6px（--radius: 0.375rem），大型元件可 8–12px

邊框：低對比髮絲線（--border），聚焦時以 --ring 強調

陰影：使用 Token（--shadow-\*），Light 減少霧化、Dark 降低透明度

玻璃擬態：僅在次要面板或浮層 適度 使用，避免炫技

氛圍：穩重、乾淨、現代、可被信任；重功能與效率，避免裝飾性噪音

色彩：

品牌主色：--primary（藍），用於主 CTA / 高亮狀態

中性色：背景/卡片/邊框以 --background / --card / --border 分層

狀態色：成功/警告/錯誤使用 --destructive 等標準 Token，避免自定義偏差

對比：正文對比度 AA 以上，按鈕與文字對比 AAA 優先

密度與間距：

基準間距 --spacing: 4px；常用模組：8/12/16/20/24/32

互動區域（點擊/觸控）最小 40×40px

表格與工具列提供 緊湊/標準 兩種密度

動效：

介面切換與進出場使用 200–250ms 淡入/淡出與位移，避免彈跳

焦點與狀態變化 120–180ms，線性到 ease-out

動效只輔助理解，不干擾操作

無障礙：

鍵盤可達、焦點環清晰（使用 --ring）

色彩對比遵循 WCAG 2.1 AA；提供可切換的 Reduce Motion

圖表語言：

優先使用 --chart-1…--chart-5，保持品牌統一

預設透明度 80–90%，以網格線與標籤提升可讀性

Light/Dark 各自調整文字與網格對比，避免低對比

圖標與插畫：

線性圖標（2px 線寬），填色與描邊遵循前景色 Token

插畫與空狀態保持克制，避免卡通化；用中性幾何圖形與品牌藍點綴

- **風格**：專業 Dashboard + 企業 SaaS UI
  - 扁平化 + 卡片式設計
  - 12-16px 圓角
  - 適度陰影
  - 少量玻璃擬態，但不過度花俏
- **氛圍**：穩重、乾淨、現代感，讓企業用戶覺得安心

---

## 1️⃣ Homepage

**功能**：入口頁，三種啟動方式 + 登入

- Header（固定上方）
  - 左側：Lens OS Logo
  - 中間：當前狀態
  - 右側：登入按鈕 / 用戶頭像
- 中央主視覺：
  - 三個主要卡片選項（等寬排版，水平置中）
    1. **Open Desktop**
    2. **Open SaaS System**
    3. **Open Website**
  - 每張卡片：深色背景 + 藍色描邊 hover 效果
- 下方區域：
  - **Supervisor Agent Input**（長條輸入框，固定在頁面底部中央）
  - **Lens Auth with Google 按鈕**（若未登入則顯示）

**排版**：  
三段式 → Header / 中央入口卡片 / 底部操作（Input & Auth）

---

## 2️⃣ Auth 流程

**功能**：用戶登入流程

- 居中卡片：
  - 標題：**Sign in to Lens OS**
  - Google OAuth 按鈕（白底，Google Logo）
  - 下方提示：`登入以啟用 Lens OS`
- 背景：淺深色抽象漸層（專業、低調）
- 登入後：自動跳轉到 Website Browser

---

## 3️⃣ Website Browser 介面

**功能**：網站模式

- Header（固定上方）
  - 左側：URL 輸入框（圓角，專業瀏覽器感）
  - 中間：Tab 區域（切換網站）
  - 右側：用戶資訊
- 主區域：
  - 左側 70%：Webview（顯示網站內容）
  - 右側 30%：**Agent Panel**
    - 背景：深色卡片式區塊
    - 顯示對話流（氣泡式，專業簡潔）
    - 底部固定輸入框（Supervisor Agent 問答）

---

## 4️⃣ Desktop 處理介面

**功能**：顯示本機檔案 + AI Agent

- Header：顯示當前檔案路徑（Breadcrumb 導覽）
- 左側：目錄樹狀結構（企業級文件總管風格）
- 中間：檔案列表 / 卡片視圖（檔名、Icon、修改日期）
- 右側：Agent Panel（與 Website 相同設計，保持一致性）

---

## 5️⃣ SaaS 系統介面

**功能**：整合企業 SaaS（如 Salesforce, Notion）

- Header：
  - 顯示 SaaS 名稱（專業字體）
  - 右側：使用者資訊
- 主區域：
  - 左側 70%：SaaS Webview（嵌入 SaaS 畫面）
  - 右側 30%：Agent Panel
    - 與 Website 相同結構
    - 區別點：底部輸入框帶「企業規則提示」字樣（ex: _Ask Supervisor Agent with company rules_）

---

## ✅ 共通設計元素

- **Header 高度固定 60px**，LOGO / 導覽 / 用戶資訊
- **Agent Panel**：所有頁面風格一致
  - 深色卡片背景
  - AI 對話卡片（氣泡樣式，專業簡潔）
  - 底部固定輸入框
- **切換動畫**：淡入淡出，給人「流暢、無縫」感

---

## 📌 總結

Lens OS 的 UI 設計應該兼具：

- **專業商業感**（企業級 SaaS 美學）
- **一致性**（Header + Agent Panel 為統一設計語言）
- **簡潔高效**（避免花俏特效，注重專業感）
