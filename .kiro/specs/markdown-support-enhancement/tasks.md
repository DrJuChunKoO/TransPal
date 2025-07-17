# Implementation Plan

- [ ] 1. 建立 Markdown 處理核心功能
  - 安裝 marked 和 DOMPurify 依賴套件及其 TypeScript 型別定義
  - 建立 MarkdownContent.astro 元件實作完整 markdown 解析和 HTML 清理
  - 建立 ProseWrapper.astro 元件整合 Tailwind prose 樣式和深色模式支援
  - 實作錯誤處理和優雅降級機制確保系統穩定性
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 5.2, 5.3_

- [x] 2. 整合現有元件並實作跨頁面支援
  - 更新 MessageText.astro 元件支援 markdown 內容類型並保持向後相容性
  - 修改 SpeechContent.astro 使用新的 MarkdownContent 元件處理 type: 'markdown' 項目
  - 更新 [messageId].astro 頁面和 MessageShare.astro 元件支援 markdown 渲染
  - 實作自動內容類型偵測邏輯和內容驗證機制
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 3. 效能優化、測試和最終整合
  - 實作建構時 markdown 處理和快取機制優化效能
  - 確保響應式設計和行動裝置上的正確顯示
  - 建立完整的測試套件包含單元測試、整合測試和安全性測試
  - 進行端到端測試驗證所有功能正常運作並更新相關文件
  - _Requirements: 2.3, 2.4, 3.4, 5.1, 5.4, 測試策略需求_