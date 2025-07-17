#!/usr/bin/env node

/**
 * Test script for markdown support enhancement
 * This script runs the tests for the markdown functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Run a command and return the output
function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout, error };
  }
}

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Main test function
async function runTests() {
  log('🧪 Running Markdown Support Enhancement Tests', colors.bright + colors.blue);
  log('=============================================', colors.blue);
  
  // Check for required files
  log('\n📁 Checking for required files...', colors.cyan);
  
  const requiredFiles = [
    'src/components/MarkdownContent.astro',
    'src/components/ProseWrapper.astro',
    'src/utils/markdownCache.ts',
    'src/utils/contentTypeDetection.ts',
    'src/components/MarkdownContent.test.ts',
    'src/test/markdown-integration.test.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fileExists(file)) {
      log(`  ✅ ${file} exists`, colors.green);
    } else {
      log(`  ❌ ${file} does not exist`, colors.red);
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    log('\n❌ Some required files are missing. Please implement them first.', colors.red);
    process.exit(1);
  }
  
  // Run unit tests
  log('\n🧪 Running unit tests...', colors.cyan);
  const unitTestResult = runCommand('npx vitest run src/components/MarkdownContent.test.ts --run');
  
  if (unitTestResult.success) {
    log('  ✅ Unit tests passed', colors.green);
  } else {
    log('  ❌ Unit tests failed', colors.red);
    log(unitTestResult.output);
  }
  
  // Run integration tests
  log('\n🧪 Running integration tests...', colors.cyan);
  const integrationTestResult = runCommand('npx vitest run src/test/markdown-integration.test.ts --run');
  
  if (integrationTestResult.success) {
    log('  ✅ Integration tests passed', colors.green);
  } else {
    log('  ❌ Integration tests failed', colors.red);
    log(integrationTestResult.output);
  }
  
  // Run performance tests
  log('\n⚡ Running performance tests...', colors.cyan);
  const performanceTestResult = runCommand('npx vitest run src/test/performance.test.ts --run');
  
  if (performanceTestResult.success) {
    log('  ✅ Performance tests passed', colors.green);
  } else {
    log('  ❌ Performance tests failed', colors.red);
    log(performanceTestResult.output);
  }
  
  // Summary
  log('\n📋 Test Summary', colors.bright + colors.blue);
  log('=============', colors.blue);
  
  if (unitTestResult.success && integrationTestResult.success && performanceTestResult.success) {
    log('✅ All tests passed successfully!', colors.bright + colors.green);
    log('The markdown support enhancement has been implemented correctly.', colors.green);
  } else {
    log('❌ Some tests failed. Please fix the issues and run the tests again.', colors.bright + colors.red);
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Error running tests: ${error.message}`, colors.red);
  process.exit(1);
});