# 測試文件 (Testing Documentation)

## 測試架構概覽

本專案使用 Vitest 作為測試框架，配合 Testing Library 進行 React 組件測試。

### 測試類型

1. **單元測試 (Unit Tests)**
   - 測試個別函數和組件
   - 位置: `src/components/*.test.tsx`, `src/utils/*.test.ts`

2. **整合測試 (Integration Tests)**
   - 測試多個組件或模組間的互動
   - 位置: `src/test/integration.test.ts`

3. **效能測試 (Performance Tests)**
   - 測試應用程式效能和記憶體使用
   - 位置: `src/test/performance.test.ts`

### 執行測試

```bash
# 執行所有測試
npm run test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 以監視模式執行測試
npm run test

# 執行測試 UI
npm run test:ui

# 執行一次性測試
npm run test:run
```

### 測試覆蓋率目標

- 分支覆蓋率: 80%
- 函數覆蓋率: 80%
- 行覆蓋率: 80%
- 語句覆蓋率: 80%

### 測試檔案結構

```
src/
├── test/
│   ├── setup.ts          # 測試環境設定
│   ├── integration.test.ts # 整合測試
│   ├── performance.test.ts # 效能測試
│   └── README.md         # 本文件
├── components/
│   ├── *.test.tsx        # 組件單元測試
└── utils/
    └── *.test.ts         # 工具函數單元測試
```

### 測試最佳實踐

1. **命名規範**
   - 測試檔案: `*.test.ts` 或 `*.test.tsx`
   - 測試描述使用中文，清楚描述測試目的

2. **測試結構**
   - 使用 `describe` 群組相關測試
   - 使用 `it` 描述個別測試案例
   - 遵循 AAA 模式: Arrange, Act, Assert

3. **Mock 使用**
   - 適當使用 mock 隔離測試單元
   - 避免過度 mock 導致測試失去意義

4. **非同步測試**
   - 使用 `waitFor` 等待非同步操作完成
   - 適當設定 timeout

### 常見測試模式

#### React 組件測試
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle user interaction', async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(screen.getByText('Expected Result')).toBeInTheDocument();
});
```

#### 工具函數測試
```typescript
import { myFunction } from './myFunction';

it('should return expected result', () => {
  const result = myFunction('input');
  expect(result).toBe('expected');
});
```

### 持續整合

測試會在以下情況自動執行:
- 本地開發時 (監視模式)
- 建置前 (pre-build)
- CI/CD 流程中

### 疑難排解

1. **測試執行緩慢**
   - 檢查是否有不必要的 DOM 操作
   - 考慮使用 `happy-dom` 而非 `jsdom`

2. **Mock 問題**
   - 確保 mock 在測試前正確設定
   - 使用 `vi.clearAllMocks()` 清理 mock 狀態

3. **非同步測試失敗**
   - 增加適當的 `await` 和 `waitFor`
   - 檢查 timeout 設定