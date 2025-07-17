# TransPal Astro - 部署指南

## 概述

TransPal Astro 是一個靜態網站，使用 Astro 框架建構，專為 Cloudflare Pages 部署而優化。本文件提供完整的部署和維護指南。

## 系統需求

### 開發環境
- Node.js 20.x 或更高版本
- npm 10.x 或更高版本
- Git

### 生產環境
- Cloudflare Pages 帳戶
- 自訂網域（可選）

## 建構流程

### 本地建構

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 生產建構
npm run build:production

# 預覽建構結果
npm run preview
```

### 建構腳本說明

- `npm run build` - 標準建構（開發用）
- `npm run build:production` - 生產優化建構
- `npm run generate-data` - 生成搜尋資料和索引檔案
- `npm run build:analyze` - 建構並顯示詳細資訊
- `npm run build:monitor` - 建構效能監控

## Cloudflare Pages 部署

### 自動部署設定

1. **連接 Git 儲存庫**
   - 登入 Cloudflare Dashboard
   - 前往 Pages > Create a project
   - 連接您的 GitHub/GitLab 儲存庫

2. **建構設定**
   ```
   Build command: npm run build:production
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
npm run build:production

# 使用 Wrangler CLI 部署
npx wrangler pages deploy dist --project-name transpal-astro
```

## 部署配置檔案

### _headers
設定安全標頭和快取策略：
- 安全標頭（CSP, X-Frame-Options 等）
- 靜態資源長期快取
- HTML 頁面短期快取

### _redirects
處理 URL 重定向：
- 移除尾隨斜線
- 404 錯誤處理
- 舊版 URL 重定向（如需要）

### wrangler.toml
Cloudflare 專案配置：
- 建構命令和輸出目錄
- 環境變數設定
- 自訂網域配置

## 效能優化

### 建構時優化
- 程式碼分割和樹搖（Tree Shaking）
- CSS 和 JavaScript 最小化
- 圖片優化和延遲載入
- 靜態資源指紋（Fingerprinting）

### 執行時優化
- CDN 邊緣快取
- Gzip/Brotli 壓縮
- HTTP/2 推送
- 預載入關鍵資源

### 效能指標
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms

## 監控和分析

### 建構監控
```bash
# 執行建構監控
npm run build:monitor

# 分析打包大小
npm run build:analyze-bundle
```

### 生產環境測試
```bash
# 執行生產環境測試
node scripts/production-test.mjs
```

### 效能測試
- 使用 Lighthouse 進行效能審計
- 監控 Core Web Vitals
- 定期檢查載入時間

## 維護指南

### 日常維護

1. **內容更新**
   ```bash
   # 新增會議記錄檔案到 public/speeches/
   # 新增頭像圖片到 public/avatars/
   # 執行建構以更新搜尋索引
   npm run generate-data
   ```

2. **依賴更新**
   ```bash
   # 檢查過時的套件
   npm outdated
   
   # 更新依賴
   npm update
   
   # 測試更新後的功能
   npm test
   npm run build:production
   ```

3. **安全更新**
   ```bash
   # 檢查安全漏洞
   npm audit
   
   # 修復安全問題
   npm audit fix
   ```

### 故障排除

#### 建構失敗
1. 檢查 Node.js 版本是否符合要求
2. 清除快取：`npm run clean`
3. 重新安裝依賴：`rm -rf node_modules package-lock.json && npm install`
4. 檢查會議 JSON 檔案格式是否正確

#### 部署失敗
1. 檢查 Cloudflare Pages 建構日誌
2. 驗證環境變數設定
3. 確認建構命令和輸出目錄正確
4. 檢查檔案大小限制（25MB）

#### 效能問題
1. 使用 `npm run build:analyze` 分析打包大小
2. 檢查圖片是否過大或未優化
3. 驗證快取標頭設定
4. 監控 CDN 快取命中率

### 備份和恢復

#### 資料備份
- 會議 JSON 檔案：`public/speeches/`
- 頭像圖片：`public/avatars/`
- 配置檔案：`astro.config.mjs`, `package.json`

#### 恢復程序
1. 從 Git 儲存庫恢復程式碼
2. 恢復會議資料和圖片檔案
3. 重新建構和部署
4. 驗證網站功能

## 安全考量

### 內容安全政策 (CSP)
- 限制腳本來源
- 防止 XSS 攻擊
- 控制外部資源載入

### 資料驗證
- 建構時驗證 JSON 檔案格式
- 清理使用者輸入
- 防止注入攻擊

### 存取控制
- 使用 HTTPS 強制加密
- 設定適當的 CORS 標頭
- 限制敏感檔案存取

## 擴展和客製化

### 新增功能
1. 在 `src/components/` 新增元件
2. 在 `src/pages/` 新增頁面
3. 更新路由和導航
4. 測試和部署

### 主題客製化
1. 修改 `src/styles/global.css`
2. 更新 Tailwind 配置
3. 調整顏色和字體變數
4. 測試深色模式相容性

### 整合第三方服務
1. 新增環境變數
2. 更新建構配置
3. 實作 API 整合
4. 測試和監控

## 聯絡資訊

如有技術問題或需要支援，請聯絡：
- 技術團隊：[技術支援信箱]
- 文件更新：[文件維護者]
- 緊急聯絡：[緊急聯絡方式]

---

最後更新：2025年1月16日
版本：1.0.0