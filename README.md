# 朝陽科技大學企管系｜推甄備審資料產生器

學生填寫社團基本資料後，由 AI 自動生成符合企管系特質的備審文案，並可一鍵輸出 Word 檔。

---

## 功能

- 輸入姓名、就讀學校、社團類型、職務、經驗反思
- 上傳社團活動照片（選填）
- AI 生成符合朝陽科技大學企管系審查標準的備審文案
- 文案可即時編輯、調整語氣（更正式/更親切/更精簡等）
- 一鍵輸出含照片與頁尾資訊的 Word 檔（.docx）

---

## 本地開發

### 1. 安裝套件

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.local.example` 並改名為 `.env.local`，填入你的 Anthropic API Key：

```bash
cp .env.local.example .env.local
```

編輯 `.env.local`：
```
ANTHROPIC_API_KEY=sk-ant-你的金鑰
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器前往 http://localhost:3000

---

## 部署到 Vercel

### 步驟一：上傳到 GitHub

1. 登入 [github.com](https://github.com)，建立新的 Repository
2. 將本專案所有檔案上傳至 Repository

### 步驟二：連結 Vercel

1. 登入 [vercel.com](https://vercel.com)（用 GitHub 帳號登入）
2. 點「Add New Project」→ 選擇你的 Repository → 點「Import」
3. Framework 選「Next.js」（通常自動偵測）

### 步驟三：設定 API Key

在 Vercel 部署前，設定環境變數：

1. 進入專案 Settings → Environment Variables
2. 新增：
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-你的金鑰`
3. 點「Save」

### 步驟四：部署

點「Deploy」，等待 2～3 分鐘後即可使用！

---

## 專案結構

```
cyut-portfolio/
├── pages/
│   ├── _app.js          # Next.js App wrapper
│   ├── index.js         # 主頁面（表單 + 輸出介面）
│   └── api/
│       ├── generate.js  # 後端：呼叫 Anthropic API 生成文案
│       └── export-word.js # 後端：產生 Word 檔
├── styles/
│   └── globals.css      # 全域樣式
├── .env.local.example   # 環境變數範本
├── next.config.js
└── package.json
```

---

## 技術棧

- [Next.js 14](https://nextjs.org/) — 前後端框架
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-node) — AI 文案生成
- [docx](https://docx.js.org/) — Word 檔產生
