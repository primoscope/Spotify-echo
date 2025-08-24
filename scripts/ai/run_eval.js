#!/usr/bin/env node
/**
 * AI Model Evaluation CLI Script
 * Run evaluation tests on AI models with different configurations
 */

const ModelEvaluationHarness = require('../../src/ai/eval/evaluationHarness');
const path = require('path');

class EvaluationCLI {
  constructor() {
    this.harness = null;
  }

  async initialize() {
    this.harness = new ModelEvaluationHarness({
      verbose: true,
      testSuitesPath: 'src/ai/eval/test-suites',
      reportsPath: 'reports/ai_eval'
    });
    
    await this.harness.initialize();
  }

  /**
   * Run evaluation with specified parameters
   */
  async runEvaluation(model, suite, options = {}) {
    console.log(`🚀 Starting AI Model Evaluation`);
    console.log(`   Model: ${model}`);
    console.log(`   Suite: ${suite}`);
    console.log(`   Options: ${JSON.stringify(options, null, 2)}`);
    
    const startTime = Date.now();
    
    try {
      const results = await this.harness.evaluate(model, suite, options);
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ Evaluation completed successfully in ${duration}ms`);
      
      // Print summary
      console.log(`\n📊 Results Summary:`);
      console.log(`   Success Rate: ${(results.stats.successRate * 100).toFixed(1)}%`);
      console.log(`   Average Latency: ${results.latency.mean.toFixed(0)}ms`);
      console.log(`   Total Cost: $${results.cost.total.toFixed(6)}`);
      console.log(`   Quality Grade: ${results.summary.qualityGrade}`);
      console.log(`   Performance Grade: ${results.summary.performanceGrade}`);
      
      if (results.summary.recommendation.issues.length > 0) {
        console.log(`\n⚠️  Issues Identified:`);
        results.summary.recommendation.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.error(`❌ Evaluation failed: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * List available test suites
   */
  async listSuites() {
    const fs = require('fs').promises;
    const suitesPath = 'src/ai/eval/test-suites';
    
    try {
      const files = await fs.readdir(suitesPath);
      const jsonlFiles = files.filter(file => file.endsWith('.jsonl'));
      
      console.log(`📋 Available Test Suites (${jsonlFiles.length}):`);
      
      for (const file of jsonlFiles) {
        const suiteName = path.basename(file, '.jsonl');
        const filePath = path.join(suitesPath, file);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          console.log(`   📦 ${suiteName} (${lines.length} test cases)`);
          
          // Show first test case as example
          if (lines.length > 0) {
            const firstTest = JSON.parse(lines[0]);
            console.log(`      Example: "${firstTest.input.substring(0, 50)}..."`);
          }
        } catch (readError) {
          console.log(`   📦 ${suiteName} (error reading file)`);
        }
      }
      
      return jsonlFiles.map(file => path.basename(file, '.jsonl'));
      
    } catch (error) {
      console.error(`❌ Failed to list test suites: ${error.message}`);
      return [];
    }
  }

  /**
   * Show detailed help
   */
  showHelp() {
    console.log(`
🧪 AI Model Evaluation CLI

USAGE:
  node scripts/ai/run_eval.js [command] [options]

COMMANDS:
  run --model <model> --suite <suite>  Run evaluation on specific model and suite
  list                                 List available test suites
  help                                 Show this help message

OPTIONS:
  --model <model>        Model to evaluate (e.g., text-bison@latest)
  --suite <suite>        Test suite name (e.g., baseline_recommendations)
  --temperature <temp>   Temperature for generation (default: 0.1)
  --max-tokens <tokens>  Maximum tokens per response (default: 512)
  --delay <ms>           Delay between requests in ms (default: 100)
  --batch-size <size>    Batch size for parallel execution (default: 1)
  --verbose              Enable verbose output

EXAMPLES:
  # List available test suites
  node scripts/ai/run_eval.js list

  # Run evaluation on baseline recommendations
  node scripts/ai/run_eval.js run --model text-bison@latest --suite baseline_recommendations

  # Run with custom parameters
  node scripts/ai/run_eval.js run --model text-bison@latest --suite baseline_recommendations --temperature 0.2 --max-tokens 1024 --verbose

  # Quick evaluation with faster requests
  node scripts/ai/run_eval.js run --model text-bison@latest --suite baseline_recommendations --delay 50

ENVIRONMENT VARIABLES:
  GCP_PROJECT_ID           Google Cloud project ID
  GCP_VERTEX_LOCATION      Vertex AI location (default: us-central1)
  VERTEX_PRIMARY_TEXT_MODEL Default text model
  AI_TIMEOUT_MS            Request timeout in milliseconds

REPORTS:
  Evaluation reports are saved to: reports/ai_eval/
  - JSON format: {date}_{model}_{suite}.json
  - Markdown format: {date}_{model}_{suite}.md
`);
  }
}

// CLI main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('help') || args.includes('--help')) {
    const cli = new EvaluationCLI();
    cli.showHelp();
    return;
  }

  const command = args[0];
  const cli = new EvaluationCLI();
  
  try {
    await cli.initialize();
    
    switch (command) {
      case 'run': {
        // Parse arguments
        const model = getArgValue(args, '--model');
        const suite = getArgValue(args, '--suite');
        
        if (!model) {
          throw new Error('--model is required for run command');
        }
        
        if (!suite) {
          throw new Error('--suite is required for run command');
        }
        
        const options = {
          temperature: parseFloat(getArgValue(args, '--temperature')) || 0.1,
          maxTokens: parseInt(getArgValue(args, '--max-tokens')) || 512,
          delayMs: parseInt(getArgValue(args, '--delay')) || 100,
          batchSize: parseInt(getArgValue(args, '--batch-size')) || 1,
          verbose: args.includes('--verbose')
        };
        
        await cli.runEvaluation(model, suite, options);
        break;
      }
      
      case 'list': {
        await cli.listSuites();
        break;
      }
      
      default: {
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use "help" to see available commands');
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (args.includes('--verbose')) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Utility function to get argument values
function getArgValue(args, argName) {
  const index = args.indexOf(argName);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = EvaluationCLI;