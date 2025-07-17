# TransPal Astro - 維護指南

## 技術維護清單

### 每週檢查
- [ ] 檢查網站可用性和載入速度
- [ ] 驗證搜尋功能正常運作
- [ ] 檢查新增的會議記錄是否正確顯示
- [ ] 監控 Cloudflare Pages 部署狀態

### 每月檢查
- [ ] 更新 npm 依賴套件
- [ ] 執行安全漏洞掃描
- [ ] 檢查 Core Web Vitals 指標
- [ ] 備份重要資料檔案
- [ ] 檢查 CDN 快取效能

### 每季檢查
- [ ] 更新 Node.js 版本
- [ ] 檢查 Astro 框架更新
- [ ] 審查安全標頭設定
- [ ] 效能基準測試
- [ ] 檢查存取日誌和錯誤報告

## 常見維護任務

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

3. **新增頭像（如需要）**
   - 將頭像圖片放入 `public/avatars/`
   - 檔名必須與發言者姓名完全一致

4. **重新建構**
   ```bash
   npm run generate-data
   npm run build:production
   ```

### 更新依賴套件

1. **檢查過時套件**
   ```bash
   npm outdated
   ```

2. **更新套件**
   ```bash
   # 更新所有套件到最新版本
   npm update
   
   # 或個別更新
   npm install package-name@latest
   ```

3. **測試更新**
   ```bash
   npm test
   npm run build:production
   node scripts/production-test.mjs
   ```

### 效能優化

1. **分析打包大小**
   ```bash
   npm run build:analyze-bundle
   ```

2. **監控建構時間**
   ```bash
   npm run build:monitor
   ```

3. **圖片優化**
   - 使用 WebP 格式
   - 壓縮圖片檔案
   - 設定適當的圖片尺寸

### 安全更新

1. **檢查安全漏洞**
   ```bash
   npm audit
   ```

2. **修復安全問題**
   ```bash
   npm audit fix
   ```

3. **更新安全標頭**
   - 檢查 `_headers` 檔案
   - 更新 CSP 政策
   - 驗證 HTTPS 設定

## 故障排除指南

### 建構錯誤

#### 錯誤：JSON 解析失敗
```
解決方案：
1. 檢查 JSON 檔案語法
2. 使用 JSON 驗證工具
3. 確認檔案編碼為 UTF-8
```

#### 錯誤：記憶體不足
```
解決方案：
1. 增加 Node.js 記憶體限制
2. 清理暫存檔案
3. 分批處理大型檔案
```

#### 錯誤：依賴衝突
```
解決方案：
1. 刪除 node_modules 和 package-lock.json
2. 重新安裝依賴
3. 檢查套件版本相容性
```

### 部署問題

#### 問題：部署失敗
```
檢查項目：
1. Cloudflare Pages 建構日誌
2. 環境變數設定
3. 建構命令正確性
4. 檔案大小限制
```

#### 問題：網站無法存取
```
檢查項目：
1. DNS 設定
2. SSL 憑證狀態
3. Cloudflare 服務狀態
4. 自訂網域配置
```

### 效能問題

#### 問題：載入速度慢
```
檢查項目：
1. 圖片檔案大小
2. JavaScript 打包大小
3. CDN 快取設定
4. 網路連線品質
```

#### 問題：搜尋功能慢
```
檢查項目：
1. 搜尋資料檔案大小
2. 搜尋演算法效率
3. 瀏覽器快取設定
4. 資料索引結構
```

## 監控和警報

### 關鍵指標
- 網站可用性：> 99.9%
- 頁面載入時間：< 3 秒
- 搜尋回應時間：< 500ms
- 建構成功率：> 95%

### 監控工具
- Cloudflare Analytics
- Google PageSpeed Insights
- Lighthouse CI
- Uptime 監控服務

### 警報設定
- 網站離線警報
- 效能降級警報
- 建構失敗通知
- 安全漏洞警報

## 備份策略

### 自動備份
- Git 儲存庫：程式碼和配置
- Cloudflare：靜態檔案
- 定期快照：完整網站備份

### 手動備份
```bash
# 備份重要檔案
tar -czf backup-$(date +%Y%m%d).tar.gz \
  public/speeches/ \
  public/avatars/ \
  src/ \
  package.json \
  astro.config.mjs
```

### 恢復程序
1. 從 Git 恢復程式碼
2. 恢復資料檔案
3. 重新安裝依賴
4. 建構和部署
5. 驗證功能

## 聯絡資訊

### 技術支援
- 主要聯絡人：[姓名] <email@example.com>
- 備用聯絡人：[姓名] <email@example.com>
- 緊急聯絡：[電話號碼]

### 服務提供商
- Cloudflare 支援：https://support.cloudflare.com/
- GitHub 支援：https://support.github.com/
- npm 支援：https://www.npmjs.com/support

---

最後更新：2025年1月16日
維護者：TransPal 技術團隊