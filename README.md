# TransPal Astro

高效能會議記錄搜尋與管理系統，使用 Astro 框架建構，專為靜態部署優化。

## 🎯 專案特色

- **極速搜尋體驗** - 即時搜尋數百場會議記錄，響應時間 < 100ms
- **響應式設計** - 完美適配桌面、平板、手機等各種裝置
- **深色模式支援** - 自動切換深色/淺色主題
- **SEO 優化** - 靜態生成，極速載入，搜尋引擎友善
- **無障礙設計** - 符合 WCAG 2.1 標準

## 🚀 快速開始

### 系統需求

- **Node.js**: 20.x 或更高版本
- **pnpm**: 最新版本（推薦使用 pnpm）
- **Git**: 最新版本

### 安裝與執行

```bash
# 複製專案
git clone [repository-url]
cd Transpal-astro

# 安裝依賴
pnpm install

# 開發模式
pnpm dev

# 建構專案（包含資料生成）
pnpm build

# 生產建構（使用生產配置）
pnpm build:production

# 預覽建構結果
pnpm preview

# 檢查程式碼
pnpm check
```

## 📁 專案結構

```
TransPal-astro/
├── public/
│   ├── speeches/          # 會議記錄 JSON 檔案
│   ├── avatars/          # 發言者頭像圖片
├── src/
│   ├── components/       # Astro 和 React 元件
│   │   ├── Search.tsx    # 搜尋功能元件
│   │   ├── Avatar.astro  # 頭像顯示元件
│   │   └── DarkModeToggle.tsx
│   ├── layouts/          # 頁面佈局
│   ├── pages/            # 路由頁面
│   ├── styles/           # 全域樣式
│   ├── utils/            # 工具函數
│   └── types/            # TypeScript 型別定義
├── scripts/
│   └── generate-data.mjs # 搜尋資料生成腳本
├── astro.config.mjs      # Astro 配置
├── wrangler.toml         # Cloudflare Pages 配置
└── _headers              # HTTP 安全標頭
```

## 🛠️ 核心技術

- **Astro** - 靜態網站生成框架
- **TypeScript** - 型別安全的 JavaScript
- **Tailwind CSS** - 實用優先的 CSS 框架
- **React** - 互動式 UI 元件
- **Vitest** - 單元測試框架
- **Cloudflare Pages** - 全球 CDN 部署

## 🚀 部署指南

### 自動部署 (推薦)

1. **連接 Git 儲存庫**

   - 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 前往 Pages > Create a project
   - 連接您的 GitHub/GitLab 儲存庫

2. **建構設定**

   ```
   Build command: pnpm build:production
   Build output directory: dist
   Root directory: (留空)
   ```

3. **環境變數**
   ```
   NODE_VERSION=20
   NPM_VERSION=10
   NODE_ENV=production
   ```

### 手動部署

```bash
# 建構專案
pnpm build:production

# 使用 Wrangler CLI 部署
npx wrangler pages deploy dist --project-name transpal-astro
```

## 🔧 維護指南

### 新增會議記錄

1. **準備 JSON 檔案**

   ```json
   {
     "version": "1.0",
     "info": {
       "name": "會議名稱",
       "date": "2025-01-16",
       "time": "14:00",
       "description": "會議描述",
       "filename": "2025-01-16-meeting-name",
       "slug": "2025-01-16-meeting-name"
     },
     "content": [
       {
         "id": "1",
         "speaker": "發言者姓名",
         "text": "發言內容",
         "type": "speech",
         "start": 0,
         "end": 30
       }
     ]
   }
   ```

2. **檔案放置**

   - 將 JSON 檔案放入 `public/speeches/`
   - 檔名格式：`YYYY-MM-DD-description.json`
   - 頭像圖片放入 `public/avatars/`（檔名需與發言者姓名一致）

3. **重新建構**
   ```bash
   pnpm generate-data
   pnpm build:production
   ```

### 定期維護任務

#### 每週檢查

- [ ] 檢查網站可用性和載入速度
- [ ] 驗證搜尋功能正常運作
- [ ] 監控 Cloudflare Pages 部署狀態

#### 每月檢查

- [ ] 更新 pnpm 依賴套件 (`pnpm outdated && pnpm update`)
- [ ] 執行安全漏洞掃描 (`pnpm audit`)
- [ ] 檢查 Core Web Vitals 指標
- [ ] 備份重要資料檔案

#### 每季檢查

- [ ] 更新 Node.js 版本
- [ ] 檢查 Astro 框架更新
- [ ] 審查安全標頭設定
- [ ] 效能基準測試

## 📈 效能監控

### 監控工具

- **Lighthouse CI** - 自動化效能測試
- **Google PageSpeed Insights** - 線上效能分析
- **WebPageTest** - 詳細載入時間分析
- **Cloudflare Analytics** - CDN 效能監控

### 測試與建構指令

```bash
# 執行所有測試
pnpm test

# 建構專案
pnpm build

# 生產建構
pnpm build:production

# 清理並優化
pnpm optimize
```

## 🛡️ 安全特性

- **內容安全政策 (CSP)** - 防止 XSS 攻擊
- **HTTPS 強制加密** - 所有流量加密傳輸
- **安全標頭** - 完整的 HTTP 安全標頭設定
- **依賴安全掃描** - 定期檢查套件漏洞

## 🧪 測試

```bash
# 執行所有測試
pnpm test

# 檢查程式碼
pnpm check
```

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。
