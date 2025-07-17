#!/usr/bin/env node

/**
 * Production Environment Testing Script
 * Tests performance and functionality of the built static site
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');

console.log('🚀 Starting Production Environment Tests...\n');

// Test 1: Verify all critical files exist
console.log('📁 Testing file generation...');
const criticalFiles = [
  'index.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'search-data.json',
  'favicon.svg',
  'speeches/2024-02-22-audrey-first-visit/index.html',
  'speeches/2024-03-01-press-conf-2024-03-01/index.html',
];

let filesOk = true;
for (const file of criticalFiles) {
  const filePath = join(distDir, file);
  if (existsSync(filePath)) {
    const stats = statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
}

if (!filesOk) {
  console.log('\n❌ Critical files missing! Build may have failed.');
  process.exit(1);
}

// Test 2: Verify HTML structure and meta tags
console.log('\n🏷️  Testing HTML structure and SEO...');
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

const htmlTests = [
  { test: /<title>.*TransPal.*<\/title>/, name: 'Page title' },
  { test: /<meta name="description"/, name: 'Meta description' },
  { test: /<meta property="og:title"/, name: 'Open Graph title' },
  { test: /<meta property="og:description"/, name: 'Open Graph description' },
  { test: /<meta name="viewport"/, name: 'Viewport meta tag' },
  { test: /<html lang="/, name: 'HTML lang attribute' },
  { test: /<nav/, name: 'Navigation element' },
  { test: /<main/, name: 'Main content element' },
  { test: /<footer/, name: 'Footer element' },
];

let htmlOk = true;
for (const { test, name } of htmlTests) {
  if (test.test(indexHtml)) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name} - MISSING`);
    htmlOk = false;
  }
}

// Test 3: Verify JavaScript bundles
console.log('\n📦 Testing JavaScript bundles...');
const jsDir = join(distDir, 'js');
if (existsSync(jsDir)) {
  const jsFiles = ['client-', 'Search-', 'DarkModeToggle-', 'ShareButton-'];
  
  for (const jsPrefix of jsFiles) {
    const files = readdirSync(jsDir).filter(f => f.startsWith(jsPrefix));
    if (files.length > 0) {
      const filePath = join(jsDir, files[0]);
      const stats = statSync(filePath);
      console.log(`✅ ${jsPrefix}*.js (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`❌ ${jsPrefix}*.js - MISSING`);
      htmlOk = false;
    }
  }
} else {
  console.log('❌ JavaScript directory missing');
  htmlOk = false;
}

// Test 4: Verify search data
console.log('\n🔍 Testing search functionality...');
try {
  const searchData = JSON.parse(readFileSync(join(distDir, 'search-data.json'), 'utf-8'));
  if (Array.isArray(searchData) && searchData.length > 0) {
    console.log(`✅ Search data loaded (${searchData.length} entries)`);
    
    // Verify search data structure
    const firstEntry = searchData[0];
    if (firstEntry.name && firstEntry.date && firstEntry.filename && firstEntry.contentSummary) {
      console.log('✅ Search data structure valid');
    } else {
      console.log('❌ Search data structure invalid');
      htmlOk = false;
    }
  } else {
    console.log('❌ Search data empty or invalid');
    htmlOk = false;
  }
} catch (error) {
  console.log(`❌ Search data parsing failed: ${error.message}`);
  htmlOk = false;
}

// Test 5: Verify sitemap
console.log('\n🗺️  Testing sitemap...');
try {
  const sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf-8');
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  if (urlCount > 0) {
    console.log(`✅ Sitemap generated (${urlCount} URLs)`);
  } else {
    console.log('❌ Sitemap empty');
    htmlOk = false;
  }
} catch (error) {
  console.log(`❌ Sitemap reading failed: ${error.message}`);
  htmlOk = false;
}

// Test 6: Check bundle sizes
console.log('\n📊 Bundle size analysis...');
const bundleSizeLimit = {
  'client-': 200, // KB
  'Search-': 15,
  'DarkModeToggle-': 5,
  'ShareButton-': 15,
};

let sizeOk = true;
for (const [prefix, limit] of Object.entries(bundleSizeLimit)) {
  const files = readdirSync(jsDir).filter(f => f.startsWith(prefix));
  if (files.length > 0) {
    const filePath = join(jsDir, files[0]);
    const stats = statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB <= limit) {
      console.log(`✅ ${prefix}*.js: ${sizeKB.toFixed(2)} KB (limit: ${limit} KB)`);
    } else {
      console.log(`⚠️  ${prefix}*.js: ${sizeKB.toFixed(2)} KB (exceeds limit: ${limit} KB)`);
      // Don't fail for size warnings, just note them
    }
  }
}

// Test 7: Verify avatar files
console.log('\n👤 Testing avatar files...');
const avatarDir = join(distDir, 'avatars');
if (existsSync(avatarDir)) {
  const avatarFiles = readdirSync(avatarDir);
  console.log(`✅ Avatar files copied (${avatarFiles.length} files)`);
} else {
  console.log('❌ Avatar directory missing');
  htmlOk = false;
}

// Final results
console.log('\n' + '='.repeat(50));
if (htmlOk && filesOk) {
  console.log('🎉 All production tests PASSED!');
  console.log('✅ Site is ready for deployment to Cloudflare Pages');
  process.exit(0);
} else {
  console.log('❌ Some production tests FAILED!');
  console.log('🔧 Please fix the issues before deploying');
  process.exit(1);
}