#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 驗證部署配置和最終檢查
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 TransPal Astro 部署驗證開始...\n');

let allChecksPass = true;
const results = [];

function addResult(category, item, status, message = '') {
  results.push({ category, item, status, message });
  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${category}: ${item}${message ? ` - ${message}` : ''}`);
  if (status === 'fail') allChecksPass = false;
}

// 1. 檢查配置檔案
console.log('📋 檢查配置檔案...');

const configFiles = [
  { file: 'package.json', required: true },
  { file: 'astro.config.mjs', required: true },
  { file: 'astro.config.production.mjs', required: true },
  { file: 'wrangler.toml', required: true },
  { file: '_headers', required: true },
  { file: '_redirects', required: true },
  { file: 'tsconfig.json', required: true },
  { file: 'tailwind.config.ts', required: false },
];

configFiles.forEach(({ file, required }) => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    addResult('配置檔案', file, 'pass');
  } else {
    addResult('配置檔案', file, required ? 'fail' : 'warn', required ? '必需檔案遺失' : '可選檔案遺失');
  }
});

// 2. 檢查建構腳本
console.log('\n🔧 檢查建構腳本...');

try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
  const requiredScripts = [
    'dev',
    'build',
    'build:production',
    'generate-data',
    'preview',
    'test'
  ];

  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      addResult('建構腳本', script, 'pass');
    } else {
      addResult('建構腳本', script, 'fail', '腳本遺失');
    }
  });
} catch (error) {
  addResult('建構腳本', 'package.json', 'fail', '無法讀取 package.json');
}

// 3. 檢查依賴套件
console.log('\n📦 檢查依賴套件...');

try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
  const criticalDeps = [
    'astro',
    '@astrojs/react',
    'react',
    'react-dom',
    'tailwindcss'
  ];

  criticalDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      addResult('依賴套件', dep, 'pass', packageJson.dependencies[dep]);
    } else {
      addResult('依賴套件', dep, 'fail', '關鍵依賴遺失');
    }
  });
} catch (error) {
  addResult('依賴套件', '檢查', 'fail', '無法檢查依賴');
}

// 4. 檢查資料檔案
console.log('\n📄 檢查資料檔案...');

const dataFiles = [
  'public/search-data.json',
  'public/speeches/',
  'public/avatars/',
  'src/utils/generated/index.js',
  'src/utils/generated/avatars.js'
];

dataFiles.forEach(file => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      addResult('資料檔案', file, 'pass', '目錄存在');
    } else {
      const sizeKB = (stats.size / 1024).toFixed(2);
      addResult('資料檔案', file, 'pass', `${sizeKB} KB`);
    }
  } else {
    addResult('資料檔案', file, 'fail', '檔案或目錄不存在');
  }
});

// 5. 檢查 Astro 配置
console.log('\n⚙️ 檢查 Astro 配置...');

try {
  const configContent = readFileSync(join(projectRoot, 'astro.config.mjs'), 'utf-8');
  
  const configChecks = [
    { check: /output:\s*['"]static['"]/, name: '靜態輸出模式' },
    { check: /site:\s*['"]https:\/\//, name: '網站 URL 設定' },
    { check: /@astrojs\/react/, name: 'React 整合' },
    { check: /tailwindcss/, name: 'Tailwind CSS 整合' },
    { check: /compressHTML:\s*true/, name: 'HTML 壓縮' }
  ];

  configChecks.forEach(({ check, name }) => {
    if (check.test(configContent)) {
      addResult('Astro 配置', name, 'pass');
    } else {
      addResult('Astro 配置', name, 'warn', '配置可能需要檢查');
    }
  });
} catch (error) {
  addResult('Astro 配置', '讀取配置', 'fail', '無法讀取配置檔案');
}

// 6. 檢查安全標頭
console.log('\n🔒 檢查安全標頭...');

try {
  const headersContent = readFileSync(join(projectRoot, '_headers'), 'utf-8');
  
  const securityHeaders = [
    { header: 'X-Frame-Options', name: '點擊劫持防護' },
    { header: 'X-Content-Type-Options', name: 'MIME 類型嗅探防護' },
    { header: 'X-XSS-Protection', name: 'XSS 防護' },
    { header: 'Content-Security-Policy', name: '內容安全政策' },
    { header: 'Referrer-Policy', name: '引用者政策' }
  ];

  securityHeaders.forEach(({ header, name }) => {
    if (headersContent.includes(header)) {
      addResult('安全標頭', name, 'pass');
    } else {
      addResult('安全標頭', name, 'warn', '標頭可能遺失');
    }
  });
} catch (error) {
  addResult('安全標頭', '檢查', 'fail', '無法讀取 _headers 檔案');
}

// 7. 檢查快取設定
console.log('\n⚡ 檢查快取設定...');

try {
  const headersContent = readFileSync(join(projectRoot, '_headers'), 'utf-8');
  
  const cacheChecks = [
    { pattern: /_astro\/\*/, name: '靜態資源快取' },
    { pattern: /avatars\/\*/, name: '頭像快取' },
    { pattern: /speeches\/\*/, name: '會議資料快取' },
    { pattern: /Cache-Control/, name: '快取控制標頭' }
  ];

  cacheChecks.forEach(({ pattern, name }) => {
    if (pattern.test(headersContent)) {
      addResult('快取設定', name, 'pass');
    } else {
      addResult('快取設定', name, 'warn', '快取設定可能需要檢查');
    }
  });
} catch (error) {
  addResult('快取設定', '檢查', 'fail', '無法檢查快取設定');
}

// 8. 檢查文件檔案
console.log('\n📚 檢查文件檔案...');

const docFiles = [
  'README.md',
  'DEPLOYMENT.md',
  'MAINTENANCE.md',
  'PERFORMANCE.md'
];

docFiles.forEach(file => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    addResult('文件檔案', file, 'pass', `${sizeKB} KB`);
  } else {
    addResult('文件檔案', file, 'warn', '文件檔案遺失');
  }
});

// 9. 檢查測試檔案
console.log('\n🧪 檢查測試檔案...');

const testFiles = [
  'vitest.config.ts',
  'src/test/setup.ts',
  'scripts/production-test.mjs'
];

testFiles.forEach(file => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    addResult('測試檔案', file, 'pass');
  } else {
    addResult('測試檔案', file, 'warn', '測試檔案遺失');
  }
});

// 10. 檢查建構輸出
console.log('\n🏗️ 檢查建構輸出...');

const distPath = join(projectRoot, 'dist');
if (existsSync(distPath)) {
  const criticalFiles = [
    'index.html',
    '404.html',
    'sitemap.xml',
    'robots.txt',
    'search-data.json'
  ];

  criticalFiles.forEach(file => {
    const filePath = join(distPath, file);
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      addResult('建構輸出', file, 'pass', `${sizeKB} KB`);
    } else {
      addResult('建構輸出', file, 'fail', '關鍵檔案遺失');
    }
  });
} else {
  addResult('建構輸出', 'dist 目錄', 'fail', '請先執行建構');
}

// 總結報告
console.log('\n' + '='.repeat(60));
console.log('📊 驗證結果總結');
console.log('='.repeat(60));

const summary = results.reduce((acc, result) => {
  if (!acc[result.category]) {
    acc[result.category] = { pass: 0, warn: 0, fail: 0 };
  }
  acc[result.category][result.status]++;
  return acc;
}, {});

Object.entries(summary).forEach(([category, counts]) => {
  const total = counts.pass + counts.warn + counts.fail;
  console.log(`${category}: ${counts.pass}/${total} 通過, ${counts.warn} 警告, ${counts.fail} 失敗`);
});

console.log('\n' + '='.repeat(60));

if (allChecksPass) {
  console.log('🎉 所有關鍵檢查都通過！');
  console.log('✅ TransPal Astro 已準備好部署到 Cloudflare Pages');
  
  console.log('\n📋 部署步驟：');
  console.log('1. 推送程式碼到 Git 儲存庫');
  console.log('2. 在 Cloudflare Pages 中連接儲存庫');
  console.log('3. 設定建構命令：npm run build:production');
  console.log('4. 設定輸出目錄：dist');
  console.log('5. 設定環境變數：NODE_VERSION=20, NPM_VERSION=10');
  
  process.exit(0);
} else {
  console.log('❌ 發現關鍵問題，請修復後再部署');
  console.log('🔧 請檢查上述失敗項目並修復');
  process.exit(1);
}