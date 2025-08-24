#!/usr/bin/env node

/**
 * Screenshot Capture and Aggregation Script for EchoTune AI
 * Aggregates and logs screenshot files from test runs
 */

const fs = require('fs').promises;
const path = require('path');

const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || './artifacts/screenshots';
const OUTPUT_FILE = process.env.SCREENSHOT_LOG || './test-results/screenshot-manifest.json';

async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      sizeKB: Math.round(stats.size / 1024),
      sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100
    };
  } catch (error) {
    return null;
  }
}

async function findScreenshots(directory) {
  const screenshots = [];
  
  try {
    const items = await fs.readdir(directory, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      
      if (item.isDirectory()) {
        // Recursively search subdirectories
        const subScreenshots = await findScreenshots(fullPath);
        screenshots.push(...subScreenshots);
      } else if (item.isFile()) {
        // Check if it's an image file
        const ext = path.extname(item.name).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
          const stats = await getFileStats(fullPath);
          if (stats) {
            screenshots.push(stats);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${directory}: ${error.message}`);
  }
  
  return screenshots;
}

async function categorizeScreenshots(screenshots) {
  const categories = {
    auth: [],
    health: [],
    error: [],
    ui: [],
    other: []
  };
  
  screenshots.forEach(screenshot => {
    const name = path.basename(screenshot.path).toLowerCase();
    const dir = path.dirname(screenshot.path).toLowerCase();
    
    if (name.includes('auth') || name.includes('login') || name.includes('callback') || name.includes('oauth')) {
      categories.auth.push(screenshot);
    } else if (name.includes('health') || name.includes('status')) {
      categories.health.push(screenshot);
    } else if (name.includes('error') || name.includes('fail') || name.includes('404')) {
      categories.error.push(screenshot);
    } else if (name.includes('ui') || name.includes('interface') || name.includes('component')) {
      categories.ui.push(screenshot);
    } else {
      categories.other.push(screenshot);
    }
  });
  
  return categories;
}

async function generateReport(screenshots, categories) {
  const totalSize = screenshots.reduce((sum, s) => sum + s.size, 0);
  const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
  
  const report = {
    summary: {
      totalScreenshots: screenshots.length,
      totalSizeMB: totalSizeMB,
      generatedAt: new Date().toISOString(),
      oldestScreenshot: screenshots.length > 0 ? Math.min(...screenshots.map(s => new Date(s.created).getTime())) : null,
      newestScreenshot: screenshots.length > 0 ? Math.max(...screenshots.map(s => new Date(s.created).getTime())) : null
    },
    categories: Object.keys(categories).reduce((acc, key) => {
      acc[key] = {
        count: categories[key].length,
        sizeMB: Math.round(categories[key].reduce((sum, s) => sum + s.size, 0) / 1024 / 1024 * 100) / 100,
        files: categories[key].map(s => ({
          name: path.basename(s.path),
          path: s.path,
          sizeKB: s.sizeKB,
          created: s.created
        }))
      };
      return acc;
    }, {}),
    screenshots: screenshots.map(s => ({
      name: path.basename(s.path),
      path: s.path,
      sizeKB: s.sizeKB,
      created: s.created,
      modified: s.modified
    }))
  };
  
  return report;
}

async function logScreenshots() {
  console.log('📸 EchoTune AI Screenshot Aggregator');
  console.log('=' .repeat(50));
  
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Find all screenshots
    console.log(`🔍 Searching for screenshots in: ${SCREENSHOTS_DIR}`);
    const screenshots = await findScreenshots(SCREENSHOTS_DIR);
    
    if (screenshots.length === 0) {
      console.log('📭 No screenshots found');
      
      // Create empty report
      const emptyReport = {
        summary: {
          totalScreenshots: 0,
          totalSizeMB: 0,
          generatedAt: new Date().toISOString(),
          oldestScreenshot: null,
          newestScreenshot: null
        },
        categories: {},
        screenshots: []
      };
      
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(emptyReport, null, 2));
      console.log(`📄 Empty report saved to: ${OUTPUT_FILE}`);
      return emptyReport;
    }
    
    // Sort by creation time (newest first)
    screenshots.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    // Categorize screenshots
    const categories = await categorizeScreenshots(screenshots);
    
    // Generate report
    const report = await generateReport(screenshots, categories);
    
    // Save report to file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(report, null, 2));
    
    // Console output
    console.log(`📊 Found ${screenshots.length} screenshots`);
    console.log(`💾 Total size: ${report.summary.totalSizeMB} MB`);
    console.log('');
    
    console.log('📁 Categories:');
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        const sizeMB = Math.round(items.reduce((sum, s) => sum + s.size, 0) / 1024 / 1024 * 100) / 100;
        console.log(`   ${category}: ${items.length} files (${sizeMB} MB)`);
      }
    });
    
    console.log('');
    console.log('📋 Recent screenshots:');
    screenshots.slice(0, 10).forEach((screenshot, index) => {
      const name = path.basename(screenshot.path);
      const created = new Date(screenshot.created).toLocaleString();
      console.log(`   ${index + 1}. ${name} (${screenshot.sizeKB} KB, ${created})`);
    });
    
    if (screenshots.length > 10) {
      console.log(`   ... and ${screenshots.length - 10} more`);
    }
    
    console.log('');
    console.log(`📄 Full report saved to: ${OUTPUT_FILE}`);
    
    return report;
    
  } catch (error) {
    console.error(`❌ Error aggregating screenshots: ${error.message}`);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  logScreenshots()
    .then((report) => {
      console.log('');
      console.log('✅ Screenshot aggregation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Screenshot aggregation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { logScreenshots, findScreenshots };