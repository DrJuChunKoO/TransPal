#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

async function optimizeBuild() {
  console.log('🚀 Starting build optimization...');
  
  const distPath = path.join(projectRoot, 'dist');
  
  try {
    // Check if dist directory exists
    await fs.access(distPath);
  } catch (error) {
    console.log('❌ Dist directory not found. Please run build first.');
    process.exit(1);
  }
  
  // Analyze bundle sizes
  await analyzeBundleSizes(distPath);
  
  // Generate performance report
  await generatePerformanceReport(distPath);
  
  console.log('✅ Build optimization complete!');
}

async function analyzeBundleSizes(distPath) {
  console.log('\n📊 Analyzing bundle sizes...');
  
  const sizes = new Map();
  
  async function analyzeDirectory(dir, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(prefix, entry.name);
      
      if (entry.isDirectory()) {
        await analyzeDirectory(fullPath, relativePath);
      } else {
        const stats = await fs.stat(fullPath);
        sizes.set(relativePath, stats.size);
      }
    }
  }
  
  await analyzeDirectory(distPath);
  
  // Sort by size (largest first)
  const sortedSizes = Array.from(sizes.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20); // Top 20 largest files
  
  console.log('\n📈 Largest files:');
  sortedSizes.forEach(([file, size]) => {
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`  ${file}: ${sizeKB} KB`);
  });
  
  // Calculate total size
  const totalSize = Array.from(sizes.values()).reduce((sum, size) => sum + size, 0);
  console.log(`\n📦 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

async function generatePerformanceReport(distPath) {
  console.log('\n📋 Generating performance report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    buildSize: {},
    recommendations: []
  };
  
  // Analyze different file types
  const fileTypes = {
    js: [],
    css: [],
    html: [],
    images: [],
    other: []
  };
  
  async function categorizeFiles(dir, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(prefix, entry.name);
      
      if (entry.isDirectory()) {
        await categorizeFiles(fullPath, relativePath);
      } else {
        const stats = await fs.stat(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        
        const fileInfo = {
          path: relativePath,
          size: stats.size
        };
        
        switch (ext) {
          case '.js':
          case '.mjs':
            fileTypes.js.push(fileInfo);
            break;
          case '.css':
            fileTypes.css.push(fileInfo);
            break;
          case '.html':
            fileTypes.html.push(fileInfo);
            break;
          case '.jpg':
          case '.jpeg':
          case '.png':
          case '.gif':
          case '.webp':
          case '.svg':
            fileTypes.images.push(fileInfo);
            break;
          default:
            fileTypes.other.push(fileInfo);
        }
      }
    }
  }
  
  await categorizeFiles(distPath);
  
  // Calculate sizes by type
  Object.keys(fileTypes).forEach(type => {
    const totalSize = fileTypes[type].reduce((sum, file) => sum + file.size, 0);
    report.buildSize[type] = {
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      fileCount: fileTypes[type].length
    };
  });
  
  // Generate recommendations
  const jsSize = report.buildSize.js.totalSize;
  const cssSize = report.buildSize.css.totalSize;
  const imageSize = report.buildSize.images.totalSize;
  
  if (jsSize > 500 * 1024) { // > 500KB
    report.recommendations.push('Consider code splitting or lazy loading for JavaScript bundles');
  }
  
  if (cssSize > 100 * 1024) { // > 100KB
    report.recommendations.push('Consider purging unused CSS or splitting CSS files');
  }
  
  if (imageSize > 2 * 1024 * 1024) { // > 2MB
    report.recommendations.push('Consider optimizing images or using modern formats like WebP');
  }
  
  // Large individual files
  const largeFiles = [];
  Object.values(fileTypes).flat().forEach(file => {
    if (file.size > 200 * 1024) { // > 200KB
      largeFiles.push(file);
    }
  });
  
  if (largeFiles.length > 0) {
    report.recommendations.push(`Large files detected: ${largeFiles.map(f => f.path).join(', ')}`);
  }
  
  // Write report
  const reportPath = path.join(projectRoot, 'performance-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Performance report saved to: ${reportPath}`);
  
  // Display summary
  console.log('\n📊 Build size summary:');
  Object.entries(report.buildSize).forEach(([type, info]) => {
    console.log(`  ${type.toUpperCase()}: ${info.totalSizeKB} KB (${info.fileCount} files)`);
  });
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeBuild().catch(console.error);
}

export { optimizeBuild };