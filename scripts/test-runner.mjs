#!/usr/bin/env node

/**
 * 測試執行器 - 提供額外的測試功能和報告
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.blue}${colors.bold}${description}${colors.reset}`);
  log(`執行: ${command}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    log(`${colors.green}✓ ${description} 完成${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}✗ ${description} 失敗${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

function checkTestCoverage() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    log(`${colors.yellow}警告: 找不到覆蓋率報告${colors.reset}`);
    return;
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverage.total;
    
    log(`\n${colors.bold}測試覆蓋率報告:${colors.reset}`);
    log(`行覆蓋率: ${total.lines.pct}%`);
    log(`函數覆蓋率: ${total.functions.pct}%`);
    log(`分支覆蓋率: ${total.branches.pct}%`);
    log(`語句覆蓋率: ${total.statements.pct}%`);
    
    const threshold = 80;
    const allAboveThreshold = [
      total.lines.pct,
      total.functions.pct,
      total.branches.pct,
      total.statements.pct
    ].every(pct => pct >= threshold);
    
    if (allAboveThreshold) {
      log(`${colors.green}✓ 所有覆蓋率指標都達到 ${threshold}% 門檻${colors.reset}`);
    } else {
      log(`${colors.yellow}⚠ 部分覆蓋率指標未達到 ${threshold}% 門檻${colors.reset}`);
    }
  } catch (error) {
    log(`${colors.red}讀取覆蓋率報告時發生錯誤: ${error.message}${colors.reset}`);
  }
}

function main() {
  log(`${colors.bold}${colors.blue}TransPal Astro 測試執行器${colors.reset}`);
  log('開始執行完整測試套件...\n');

  const steps = [
    {
      command: 'npm run test:run',
      description: '執行所有測試'
    },
    {
      command: 'npm run test:coverage',
      description: '產生測試覆蓋率報告'
    }
  ];

  let allPassed = true;

  for (const step of steps) {
    const success = runCommand(step.command, step.description);
    if (!success) {
      allPassed = false;
    }
  }

  // 檢查測試覆蓋率
  checkTestCoverage();

  // 最終結果
  log('\n' + '='.repeat(50));
  if (allPassed) {
    log(`${colors.green}${colors.bold}✓ 所有測試執行完成！${colors.reset}`);
    log(`${colors.green}測試套件執行成功${colors.reset}`);
  } else {
    log(`${colors.red}${colors.bold}✗ 測試執行過程中發生錯誤${colors.reset}`);
    process.exit(1);
  }
}

main();