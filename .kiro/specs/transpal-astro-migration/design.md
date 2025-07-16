# Design Document

## Overview

TransPal 是一個會議逐字稿記錄網站，目前使用 Next.js 建構。本設計文件描述如何將其重構到 Astro 框架，以實現更好的效能和更簡潔的架構。重構將保持所有現有功能，同時利用 Astro 的靜態生成優勢。

## Architecture

### Current Next.js Architecture

```
TransPal/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根佈局
│   ├── page.tsx           # 首頁
│   ├── globals.css        # 全域樣式
│   └── speeches/
│       └── [filename]/
│           └── page.tsx   # 會議詳細頁面
├── components/            # React 元件
├── utils/                 # 工具函數
├── public/               # 靜態資源
│   ├── speeches/         # 會議 JSON 檔案
│   └── avatars/          # 頭像圖片
└── scripts/
    └── generate-data.mjs # 建構時資料生成
```

### Target Astro Architecture

```
src/
├── layouts/              # Astro 佈局
│   └── Layout.astro     # 主要佈局
├── pages/               # 路由頁面
│   ├── index.astro      # 首頁
│   └── speeches/
│       ├── [filename].astro     # 會議詳細頁面
│       └── [filename]/
│           └── [messageId].astro # 單一訊息分享頁面
├── components/          # Astro/React 元件
│   ├── ui/             # 基礎 UI 元件
│   └── features/       # 功能性元件
├── utils/              # 工具函數
├── styles/             # 樣式檔案
└── content/            # 內容集合 (可選)
public/
├── speeches/           # 會議 JSON 檔案
├── avatars/           # 頭像圖片
└── search-data.json   # 搜尋資料
```

## Components and Interfaces

### Core Components Migration

#### 1. Layout Components
- **Layout.astro**: 主要佈局，整合導航、頁腳和全域樣式
- **Nav.astro**: 導航列，包含搜尋和深色模式切換
- **Footer.astro**: 頁腳連結和版權資訊

#### 2. Content Components
- **SpeechesList.astro**: 會議列表顯示
- **SpeechContent.astro**: 會議內容顯示
- **MessageShare.astro**: 單一訊息分享頁面
- **Avatar.astro**: 發言者頭像元件
- **MessageText.astro**: 發言內容元件

#### 3. Interactive Components (React Islands)
- **Search.tsx**: 搜尋功能 (保持 React)
- **DarkModeToggle.tsx**: 深色模式切換 (保持 React)
- **ShareButton.tsx**: 分享按鈕 (保持 React)

### Data Flow Architecture

```mermaid
graph TD
    A[JSON Files in public/speeches/] --> B[Build Script]
    B --> C[Generated Data Files]
    C --> D[search-data.json]
    C --> E[utils/generated/]
    
    F[Astro Pages] --> G[getSpeeches()]
    F --> H[getSpeech()]
    G --> E
    H --> E
    
    I[Search Component] --> D
    J[Avatar Component] --> K[avatars.js]
```

## Message Share Pages

### Individual Message Sharing
每個會議中的訊息都有獨立的分享頁面，路徑格式為 `/speeches/[filename]/[messageId]`。

#### Features
1. **獨立 URL**: 每個訊息都有唯一的 URL，便於分享和引用
2. **上下文顯示**: 顯示該訊息及其前後幾則訊息，提供完整對話脈絡
3. **會議資訊**: 顯示會議標題、日期和參與者資訊
4. **社交分享**: 優化的 Open Graph 標籤，適合社交媒體分享
5. **導航功能**: 提供返回完整會議頁面的連結

#### Page Structure
```
/speeches/[filename]/[messageId]
├── 會議標題和基本資訊
├── 目標訊息 (高亮顯示)
├── 上下文訊息 (前後 2-3 則)
├── 分享按鈕
└── 返回完整會議連結
```

#### SEO Optimization
- 動態生成 meta title: "[發言者] 在 [會議名稱] 中的發言"
- 動態生成 meta description: 訊息內容摘要
- Open Graph 圖片包含發言者頭像和訊息預覽

## Data Models

### Speech Data Structure
```typescript
interface SpeechDetail {
  version: string;
  info: {
    name: string;
    date: string;
    time?: string;
    description?: string;
    filename: string;
    slug: string;
  };
  content: SpeechContentItem[];
}

interface SpeechContentItem {
  id: string;
  speaker: string;
  text: string;
  type: 'speech' | 'divider' | 'markdown';
  start?: number;
  end?: number;
}

interface SpeechMetadata {
  name: string;
  date: string;
  filename: string;
}
```

### Search Data Structure
```typescript
interface SearchData {
  name: string;
  date: string;
  filename: string;
  contentSummary: {
    id: string;
    text: string;
    speaker: string;
  }[];
}
```

## Error Handling

### Build Time Error Handling
1. **Invalid JSON Files**: 記錄警告並跳過無效檔案
2. **Missing Metadata**: 使用檔名作為預設值
3. **Invalid Dates**: 使用 epoch 時間作為預設值

### Runtime Error Handling
1. **404 Pages**: 當會議檔案不存在時顯示 404 頁面
2. **Search Errors**: 搜尋 API 失敗時顯示錯誤訊息
3. **Image Loading**: 頭像載入失敗時顯示預設圖示

## Testing Strategy

### Unit Testing
- 工具函數測試 (getSpeeches, getSpeech)
- 元件渲染測試
- 資料轉換邏輯測試

### Integration Testing
- 頁面路由測試
- 搜尋功能測試
- 深色模式切換測試

### Build Testing
- 靜態生成測試
- 資料生成腳本測試
- 部署前驗證測試

## Migration Strategy

### Phase 1: Core Structure
1. 建立 Astro 專案結構
2. 設定 Tailwind CSS 和基礎配置
3. 建立主要佈局和頁面

### Phase 2: Static Components
1. 轉換靜態元件到 Astro
2. 實作會議列表和詳細頁面
3. 設定路由和導航

### Phase 3: Interactive Features
1. 整合 React Islands 用於互動功能
2. 實作搜尋功能
3. 實作深色模式和分享功能

### Phase 4: Optimization
1. 效能優化和圖片處理
2. SEO 優化和 meta 標籤
3. 建構和部署配置

## Technology Stack

### Core Framework
- **Astro**: 主要框架，用於靜態生成
- **React**: 用於需要互動的元件 (Islands Architecture)
- **TypeScript**: 型別安全

### Styling
- **Tailwind CSS**: 樣式框架
- **CSS Variables**: 深色模式支援

### Build Tools
- **Vite**: Astro 內建建構工具
- **Node.js Scripts**: 資料生成和處理

### Deployment
- **Cloudflare Pages**: 靜態網站託管
- **Static Generation**: 完全靜態輸出

## Performance Considerations

### Static Generation Benefits
- 所有頁面在建構時預渲染
- 零 JavaScript 用於靜態內容
- 更快的首次載入時間

### Code Splitting
- React 元件僅在需要時載入
- 按頁面分割 JavaScript
- 圖片延遲載入

### Caching Strategy
- 靜態資源長期快取
- 搜尋資料適當快取
- CDN 邊緣快取

## SEO and Accessibility

### SEO Optimization
- 自動生成 meta 標籤
- Open Graph 支援
- 結構化資料標記

### Accessibility Features
- 語義化 HTML 結構
- 鍵盤導航支援
- 螢幕閱讀器友善
- 適當的對比度和字體大小

## Security Considerations

### Static Site Security
- 無伺服器端攻擊面
- 內容安全政策 (CSP)
- 安全的外部連結處理

### Data Validation
- 建構時資料驗證
- 使用者輸入清理
- XSS 防護

## Deployment Configuration

### Static Site Setup
```javascript
// astro.config.mjs
export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    tailwind()
  ]
});
```

### Build Process
1. 執行資料生成腳本
2. Astro 靜態生成
3. 資產優化和壓縮
4. 部署到 Cloudflare Pages

## Monitoring and Analytics

### Performance Monitoring
- Core Web Vitals 追蹤
- 載入時間監控
- 錯誤追蹤

### Usage Analytics
- Google Analytics 整合
- 搜尋查詢分析
- 使用者行為追蹤