# TransPal Astro - 效能監控指南

## 效能目標

### Core Web Vitals 目標
- **Largest Contentful Paint (LCP)**: < 2.5 秒
- **First Input Delay (FID)**: < 100 毫秒
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 秒

### 其他效能指標
- **Time to Interactive (TTI)**: < 3.8 秒
- **Total Blocking Time (TBT)**: < 200 毫秒
- **Speed Index**: < 3.4 秒

## 效能監控工具

### 自動化監控

1. **Lighthouse CI**
   ```bash
   # 安裝 Lighthouse CI
   npm install -g @lhci/cli
   
   # 執行效能測試
   lhci autorun
   ```

2. **Web Vitals 監控**
   ```javascript
   // 在生產環境中監控 Core Web Vitals
   import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';
   
   getCLS(console.log);
   getFID(console.log);
   getFCP(console.log);
   getLCP(console.log);
   getTTFB(console.log);
   ```

### 手動測試工具

1. **Google PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - 測試桌面和行動版效能
   - 提供具體優化建議

2. **WebPageTest**
   - URL: https://www.webpagetest.org/
   - 詳細的載入時間分析
   - 多地點測試

3. **Chrome DevTools**
   - Performance 面板
   - Network 面板
   - Lighthouse 審計

## 效能基準測試

### 建構效能
```bash
# 執行建構效能測試
npm run build:monitor

# 分析打包大小
npm run build:analyze-bundle

# 生產環境測試
node scripts/production-test.mjs
```

### 預期結果
- 建構時間：< 60 秒
- 總打包大小：< 2MB
- JavaScript 主要包：< 200KB
- CSS 檔案：< 50KB

## 效能優化策略

### 圖片優化
1. **格式選擇**
   - 使用 WebP 格式（支援度 > 95%）
   - 備用 JPEG/PNG 格式
   - SVG 用於圖標和簡單圖形

2. **尺寸優化**
   - 響應式圖片
   - 適當的解析度
   - 延遲載入

3. **壓縮設定**
   ```javascript
   // Astro 圖片優化配置
   image: {
     service: {
       entrypoint: 'astro/assets/services/sharp',
       config: {
         limitInputPixels: false,
       },
     },
   }
   ```

### JavaScript 優化
1. **程式碼分割**
   ```javascript
   // 手動分割重要模組
   manualChunks: {
     'react-vendor': ['react', 'react-dom'],
     'utils': ['src/utils/speeches.ts'],
   }
   ```

2. **樹搖優化**
   - 移除未使用的程式碼
   - 使用 ES6 模組
   - 避免全域匯入

3. **延遲載入**
   ```javascript
   // 動態匯入非關鍵元件
   const SearchComponent = lazy(() => import('./Search'));
   ```

### CSS 優化
1. **關鍵 CSS 內聯**
   ```javascript
   // Astro 配置
   build: {
     inlineStylesheets: 'always',
   }
   ```

2. **未使用 CSS 移除**
   - PurgeCSS 整合
   - Tailwind CSS 樹搖
   - 關鍵路徑優化

### 快取策略
1. **靜態資源快取**
   ```
   # _headers 檔案設定
   /_astro/*
     Cache-Control: public, max-age=31536000, immutable
   
   /avatars/*
     Cache-Control: public, max-age=31536000, immutable
   ```

2. **動態內容快取**
   ```
   /speeches/*
     Cache-Control: public, max-age=86400, must-revalidate
   
   /search-data.json
     Cache-Control: public, max-age=3600, must-revalidate
   ```

## 效能監控腳本

### 自動化效能測試
```javascript
// scripts/performance-monitor.mjs
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

async function runPerformanceTest(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  const score = runnerResult.lhr.categories.performance.score * 100;
  console.log(`Performance Score: ${score}`);
  
  return runnerResult;
}
```

### 持續監控設定
```yaml
# .github/workflows/performance.yml
name: Performance Monitoring
on:
  schedule:
    - cron: '0 0 * * *'  # 每日執行
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## 效能問題診斷

### 常見效能問題

1. **大型 JavaScript 包**
   ```bash
   # 分析打包大小
   npm run build:analyze
   
   # 檢查重複依賴
   npm ls --depth=0
   ```

2. **未優化圖片**
   ```bash
   # 檢查圖片大小
   find public/avatars -name "*.jpg" -exec ls -lh {} \;
   
   # 壓縮圖片
   imagemin public/avatars/*.jpg --out-dir=public/avatars/optimized
   ```

3. **過多 HTTP 請求**
   - 合併 CSS 檔案
   - 使用 CSS Sprites
   - 內聯小型資源

### 診斷工具

1. **Bundle Analyzer**
   ```bash
   # 安裝分析工具
   npm install --save-dev webpack-bundle-analyzer
   
   # 分析打包結果
   npm run build:analyze
   ```

2. **Performance Budget**
   ```json
   // lighthouse-config.json
   {
     "ci": {
       "assert": {
         "assertions": {
           "categories:performance": ["warn", {"minScore": 0.9}],
           "resource-summary:script:size": ["error", {"maxNumericValue": 200000}],
           "resource-summary:image:size": ["warn", {"maxNumericValue": 500000}]
         }
       }
     }
   }
   ```

## 效能報告

### 每週效能報告
- Core Web Vitals 趨勢
- 頁面載入時間分析
- 資源使用統計
- 使用者體驗指標

### 月度效能審查
- 效能基準比較
- 優化機會識別
- 技術債務評估
- 改進計劃制定

### 效能警報設定
```javascript
// 效能閾值警報
const performanceThresholds = {
  LCP: 2500,  // 毫秒
  FID: 100,   // 毫秒
  CLS: 0.1,   // 分數
  FCP: 1800,  // 毫秒
};

// 監控腳本
function checkPerformance(metrics) {
  Object.entries(performanceThresholds).forEach(([metric, threshold]) => {
    if (metrics[metric] > threshold) {
      sendAlert(`${metric} 超過閾值: ${metrics[metric]} > ${threshold}`);
    }
  });
}
```

## 效能優化檢查清單

### 建構時優化
- [ ] 啟用程式碼分割
- [ ] 移除未使用的程式碼
- [ ] 最小化 CSS 和 JavaScript
- [ ] 優化圖片格式和大小
- [ ] 啟用 Gzip/Brotli 壓縮

### 執行時優化
- [ ] 設定適當的快取標頭
- [ ] 使用 CDN 加速
- [ ] 啟用 HTTP/2
- [ ] 預載入關鍵資源
- [ ] 延遲載入非關鍵內容

### 監控設定
- [ ] 設定 Core Web Vitals 監控
- [ ] 配置效能警報
- [ ] 建立效能儀表板
- [ ] 定期效能審查
- [ ] 使用者體驗監控

---

最後更新：2025年1月16日
效能目標版本：1.0.0