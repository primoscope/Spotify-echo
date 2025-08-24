#!/usr/bin/env node
/**
 * Analyze package.json dependencies and identify MCP-only packages
 * that should be moved to devDependencies for production optimization
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// MCP-specific package patterns
const mcpPatterns = [
  '@modelcontextprotocol',
  '@browserbasehq/mcp-server',
  '@hisma/server-puppeteer',
  'mcp-server-code-runner',
  'mongodb-mcp-server',
  'n8n-mcp',
  'puppeteer-mcp-server',
  'FileScopeMCP'
];

// Development-only patterns
const devPatterns = [
  'puppeteer',
  'playwright',
  'jest',
  'eslint',
  'babel',
  'typescript',
  'nodemon',
  'concurrently',
  'swagger',
  'supertest',
  'terser',
  'webpack',
  'vite',
  'prettier',
  'autoprefixer',
  'postcss'
];

function isMcpDependency(packageName) {
  return mcpPatterns.some(pattern => packageName.includes(pattern));
}

function isDevDependency(packageName) {
  return devPatterns.some(pattern => packageName.includes(pattern));
}

function analyzeDependencies() {
  const { dependencies = {}, devDependencies = {} } = packageJson;
  
  const mcpDeps = [];
  const shouldMoveToDevDeps = [];
  const alreadyInDevDeps = [];
  
  console.log('🔍 Analyzing dependencies for MCP and development-only packages\n');
  
  // Check production dependencies
  Object.keys(dependencies).forEach(pkg => {
    if (isMcpDependency(pkg)) {
      mcpDeps.push(pkg);
      shouldMoveToDevDeps.push(pkg);
    } else if (isDevDependency(pkg)) {
      shouldMoveToDevDeps.push(pkg);
    }
  });
  
  // Check what's already in devDependencies
  Object.keys(devDependencies).forEach(pkg => {
    if (isMcpDependency(pkg) || isDevDependency(pkg)) {
      alreadyInDevDeps.push(pkg);
    }
  });
  
  return { mcpDeps, shouldMoveToDevDeps, alreadyInDevDeps };
}

function generateOptimizedPackageJson() {
  const { dependencies = {}, devDependencies = {} } = packageJson;
  const { shouldMoveToDevDeps } = analyzeDependencies();
  
  const newDependencies = { ...dependencies };
  const newDevDependencies = { ...devDependencies };
  
  // Move packages to devDependencies
  shouldMoveToDevDeps.forEach(pkg => {
    if (newDependencies[pkg]) {
      newDevDependencies[pkg] = newDependencies[pkg];
      delete newDependencies[pkg];
    }
  });
  
  return {
    ...packageJson,
    dependencies: newDependencies,
    devDependencies: newDevDependencies
  };
}

function main() {
  const { mcpDeps, shouldMoveToDevDeps, alreadyInDevDeps } = analyzeDependencies();
  
  console.log(`📊 Analysis Results:`);
  console.log(`   Total production dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
  console.log(`   Total dev dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
  console.log('');
  
  if (mcpDeps.length > 0) {
    console.log('🔧 MCP-specific dependencies found:');
    mcpDeps.forEach(pkg => console.log(`   - ${pkg}`));
    console.log('');
  }
  
  if (shouldMoveToDevDeps.length > 0) {
    console.log('📦 Packages that should be moved to devDependencies:');
    shouldMoveToDevDeps.forEach(pkg => console.log(`   - ${pkg}`));
    console.log('');
  }
  
  if (alreadyInDevDeps.length > 0) {
    console.log('✅ Packages correctly in devDependencies:');
    alreadyInDevDeps.forEach(pkg => console.log(`   - ${pkg}`));
    console.log('');
  }
  
  // Show deployment size impact
  const prodDepsCount = Object.keys(packageJson.dependencies || {}).length;
  const optimizedDepsCount = prodDepsCount - shouldMoveToDevDeps.length;
  const reduction = prodDepsCount > 0 ? ((shouldMoveToDevDeps.length / prodDepsCount) * 100).toFixed(1) : 0;
  
  console.log('🚀 Deployment Impact:');
  console.log(`   Current production dependencies: ${prodDepsCount}`);
  console.log(`   Optimized production dependencies: ${optimizedDepsCount}`);
  console.log(`   Reduction: ${shouldMoveToDevDeps.length} packages (${reduction}%)`);
  console.log('');
  
  if (process.argv.includes('--write')) {
    const optimizedPackageJson = generateOptimizedPackageJson();
    fs.writeFileSync(packagePath, JSON.stringify(optimizedPackageJson, null, 2) + '\n');
    console.log('✅ package.json has been updated with optimized dependencies');
  } else {
    console.log('💡 Run with --write flag to update package.json');
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeDependencies, generateOptimizedPackageJson };