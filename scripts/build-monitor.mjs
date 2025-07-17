#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const metricsFile = path.join(projectRoot, 'build-metrics.json');

async function monitorBuild() {
  console.log('🔍 Starting build monitoring...');
  
  const startTime = Date.now();
  const metrics = {
    timestamp: new Date().toISOString(),
    buildStart: startTime,
    phases: {},
    totalTime: 0,
    success: false,
    errors: []
  };
  
  try {
    // Monitor data generation phase
    console.log('📊 Phase 1: Data generation');
    const dataGenStart = Date.now();
    
    await runCommand('node', ['scripts/generate-data.mjs']);
    
    const dataGenEnd = Date.now();
    metrics.phases.dataGeneration = {
      duration: dataGenEnd - dataGenStart,
      success: true
    };
    
    console.log(`✅ Data generation completed in ${metrics.phases.dataGeneration.duration}ms`);
    
    // Monitor Astro build phase
    console.log('🏗️ Phase 2: Astro build');
    const buildStart = Date.now();
    
    const buildConfig = process.env.NODE_ENV === 'production' 
      ? ['build', '--config', 'astro.config.production.mjs']
      : ['build'];
    
    await runCommand('npx', ['astro', ...buildConfig]);
    
    const buildEnd = Date.now();
    metrics.phases.astroBuild = {
      duration: buildEnd - buildStart,
      success: true
    };
    
    console.log(`✅ Astro build completed in ${metrics.phases.astroBuild.duration}ms`);
    
    // Calculate total time
    const endTime = Date.now();
    metrics.totalTime = endTime - startTime;
    metrics.success = true;
    
    console.log(`🎉 Total build time: ${metrics.totalTime}ms`);
    
    // Analyze build output
    await analyzeBuildOutput(metrics);
    
  } catch (error) {
    metrics.success = false;
    metrics.errors.push(error.message);
    metrics.totalTime = Date.now() - startTime;
    
    console.error('❌ Build failed:', error.message);
  }
  
  // Save metrics
  await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
  console.log(`📈 Build metrics saved to ${metricsFile}`);
  
  // Display summary
  displayBuildSummary(metrics);
  
  if (!metrics.success) {
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function analyzeBuildOutput(metrics) {
  const distPath = path.join(projectRoot, 'dist');
  
  try {
    await fs.access(distPath);
    
    // Count files and calculate sizes
    const analysis = await analyzeDirectory(distPath);
    metrics.buildOutput = analysis;
    
    console.log(`📦 Build output: ${analysis.totalFiles} files, ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.warn('⚠️ Could not analyze build output:', error.message);
  }
}

async function analyzeDirectory(dir) {
  const analysis = {
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {}
  };
  
  async function traverse(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        const ext = path.extname(entry.name).toLowerCase() || 'no-ext';
        
        analysis.totalFiles++;
        analysis.totalSize += stats.size;
        
        if (!analysis.fileTypes[ext]) {
          analysis.fileTypes[ext] = { count: 0, size: 0 };
        }
        
        analysis.fileTypes[ext].count++;
        analysis.fileTypes[ext].size += stats.size;
      }
    }
  }
  
  await traverse(dir);
  return analysis;
}

function displayBuildSummary(metrics) {
  console.log('\n📋 Build Summary');
  console.log('================');
  console.log(`Status: ${metrics.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Total Time: ${metrics.totalTime}ms`);
  
  if (metrics.phases.dataGeneration) {
    console.log(`Data Generation: ${metrics.phases.dataGeneration.duration}ms`);
  }
  
  if (metrics.phases.astroBuild) {
    console.log(`Astro Build: ${metrics.phases.astroBuild.duration}ms`);
  }
  
  if (metrics.buildOutput) {
    console.log(`Output Files: ${metrics.buildOutput.totalFiles}`);
    console.log(`Output Size: ${(metrics.buildOutput.totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  if (metrics.errors.length > 0) {
    console.log('\n❌ Errors:');
    metrics.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  // Performance recommendations
  if (metrics.success && metrics.totalTime > 30000) { // > 30 seconds
    console.log('\n💡 Performance Recommendations:');
    console.log('- Consider enabling build caching');
    console.log('- Check for large dependencies that could be optimized');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorBuild().catch(console.error);
}

export { monitorBuild };