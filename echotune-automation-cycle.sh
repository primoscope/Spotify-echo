#!/bin/bash
# EchoTune AI - Complete Automation Cycle

echo "🤖 Starting EchoTune AI Automation Cycle"
echo "========================================"

# Step 1: Run full automation analysis
echo "📊 Step 1: Repository & Roadmap Analysis..."
node test-full-automation-workflow.js

# Step 2: Check for generated tasks
echo "📋 Step 2: Checking generated tasks..."
if [ -f "perplexity-roadmap-analysis-*.md" ]; then
    echo "✅ New roadmap analysis available"
    ls -la perplexity-roadmap-analysis-*.md
else
    echo "⚠️ No new roadmap analysis found"
fi

# Step 3: Run tests to ensure system health
echo "🧪 Step 3: Running system tests..."
npm test

# Step 4: Start development server
echo "🚀 Step 4: Starting development server..."
echo "💡 Ready for automated coding workflow!"
npm run dev