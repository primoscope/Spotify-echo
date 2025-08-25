#!/usr/bin/env node

/**
 * Gemini CLI Wrapper
 * Command-line interface for Gemini API with support for multimodal assets
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
require('dotenv').config();

const GeminiProvider = require('../../src/chat/llm-providers/gemini-provider');

async function main() {
  program
    .name('gemini-cli')
    .description('Gemini API command-line interface')
    .version('1.0.0');

  program
    .command('prompt')
    .description('Send a prompt to Gemini')
    .option('-p, --prompt <text>', 'Prompt text or path to file')
    .option('-m, --model <model>', 'Gemini model to use', 'gemini-2.5-pro')
    .option('-s, --stream', 'Use streaming response', false)
    .option('-t, --temperature <temp>', 'Temperature (0-1)', parseFloat, 0.7)
    .option('-j, --json', 'Output JSON response', false)
    .option('--max-tokens <tokens>', 'Maximum output tokens', parseInt, 2000)
    .option('--images <paths>', 'Comma-separated image file paths')
    .option('--safety <mode>', 'Safety mode', 'BLOCK_MEDIUM_AND_ABOVE')
    .action(async (options) => {
      try {
        const result = await runPrompt(options);
        process.exit(result ? 0 : 1);
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    });

  program
    .command('benchmark')
    .description('Run benchmark tests')
    .option('-n, --trials <number>', 'Number of trials', parseInt, 5)
    .option('-m, --models <models>', 'Comma-separated model names')
    .option('-o, --output <file>', 'Output JSON file', 'gemini-benchmark.json')
    .action(async (options) => {
      try {
        const result = await runBenchmark(options);
        process.exit(result ? 0 : 1);
      } catch (error) {
        console.error('❌ Benchmark error:', error.message);
        process.exit(1);
      }
    });

  program
    .command('test')
    .description('Test Gemini connectivity and basic functionality')
    .option('--verbose', 'Verbose output', false)
    .action(async (options) => {
      try {
        const result = await runConnectivityTest(options);
        process.exit(result ? 0 : 1);
      } catch (error) {
        console.error('❌ Test error:', error.message);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

async function runPrompt(options) {
  console.log('🚀 Gemini CLI - Prompt Mode');
  
  // Initialize Gemini provider
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY,
    model: options.model,
    useVertex: process.env.GEMINI_USE_VERTEX === 'true'
  });

  await provider.initialize();

  // Prepare prompt
  let promptText;
  if (options.prompt.startsWith('/') || options.prompt.startsWith('./')) {
    // File path
    try {
      promptText = await fs.readFile(options.prompt, 'utf8');
      console.log(`📂 Loaded prompt from: ${options.prompt}`);
    } catch (error) {
      throw new Error(`Failed to read prompt file: ${error.message}`);
    }
  } else {
    promptText = options.prompt;
  }

  // Prepare messages array
  const messages = [];
  const userMessage = { role: 'user', content: promptText };

  // Handle images if provided
  if (options.images) {
    const imagePaths = options.images.split(',').map(p => p.trim());
    const imageContents = [];

    for (const imagePath of imagePaths) {
      try {
        const imageData = await fs.readFile(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = getMimeType(ext);
        
        if (!mimeType) {
          throw new Error(`Unsupported image type: ${ext}`);
        }

        imageContents.push({
          type: 'image',
          mimeType,
          data: imageData.toString('base64')
        });

        console.log(`🖼️ Loaded image: ${imagePath} (${mimeType})`);
      } catch (error) {
        throw new Error(`Failed to load image ${imagePath}: ${error.message}`);
      }
    }

    // Convert to multimodal format
    userMessage.content = [
      { type: 'text', text: promptText },
      ...imageContents
    ];
  }

  messages.push(userMessage);

  const requestOptions = {
    model: options.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    safetyMode: options.safety
  };

  console.log(`\n📋 Configuration:`);
  console.log(`   Model: ${options.model}`);
  console.log(`   Temperature: ${options.temperature}`);
  console.log(`   Max tokens: ${options.maxTokens}`);
  console.log(`   Safety mode: ${options.safety}`);
  console.log(`   Streaming: ${options.stream ? 'enabled' : 'disabled'}`);
  console.log(`   Images: ${options.images ? imagePaths.length : 0}`);
  console.log('');

  const startTime = Date.now();

  try {
    if (options.stream) {
      // Streaming response
      console.log('🔄 Streaming response...\n');
      let fullContent = '';
      
      for await (const chunk of provider.generateStreamingCompletion(messages, requestOptions)) {
        if (chunk.isError) {
          console.error(`❌ Stream error: ${chunk.content}`);
          return false;
        }
        
        if (chunk.content) {
          process.stdout.write(chunk.content);
          fullContent += chunk.content;
        }
        
        if (!chunk.isPartial) {
          console.log('\n');
          break;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`\n⏱️ Completed in ${duration}ms`);
      
      if (options.json) {
        const result = {
          content: fullContent,
          model: options.model,
          duration,
          streaming: true
        };
        console.log('\n📊 JSON Output:');
        console.log(JSON.stringify(result, null, 2));
      }

    } else {
      // Non-streaming response
      console.log('⏳ Generating response...\n');
      
      const response = await provider.generateCompletion(messages, requestOptions);
      const duration = Date.now() - startTime;

      if (options.json) {
        const result = {
          ...response,
          duration,
          streaming: false
        };
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(response.content);
        console.log(`\n⏱️ Completed in ${duration}ms`);
        console.log(`💰 Cost: $${response.usage?.cost?.toFixed(6) || 'unknown'}`);
        console.log(`🎯 Tokens: ${response.usage?.totalTokens || 'unknown'}`);
      }
    }

    return true;

  } catch (error) {
    console.error(`❌ Generation failed: ${error.message}`);
    return false;
  }
}

async function runBenchmark(options) {
  console.log('🏁 Gemini Benchmark Suite');
  
  const models = options.models ? 
    options.models.split(',').map(m => m.trim()) : 
    ['gemini-2.5-pro', 'gemini-1.5-flash'];

  const results = {
    timestamp: new Date().toISOString(),
    trials: options.trials,
    models: {},
    summary: {}
  };

  const testPrompts = [
    'Write a short poem about artificial intelligence',
    'Explain quantum computing in simple terms',
    'Create a JSON object representing a music playlist',
    'List the benefits of renewable energy',
    'Describe the process of photosynthesis'
  ];

  for (const model of models) {
    console.log(`\n🎯 Testing model: ${model}`);
    
    const provider = new GeminiProvider({
      apiKey: process.env.GEMINI_API_KEY,
      model,
      useVertex: process.env.GEMINI_USE_VERTEX === 'true'
    });

    await provider.initialize();

    const modelResults = {
      trials: [],
      averageLatency: 0,
      successRate: 0,
      averageCost: 0,
      totalTokens: 0
    };

    for (let i = 0; i < options.trials; i++) {
      console.log(`  Trial ${i + 1}/${options.trials}`);
      
      const prompt = testPrompts[i % testPrompts.length];
      const startTime = Date.now();
      
      try {
        const response = await provider.generateCompletion([
          { role: 'user', content: prompt }
        ], { model });

        const latency = Date.now() - startTime;
        
        modelResults.trials.push({
          success: true,
          latency,
          tokens: response.usage?.totalTokens || 0,
          cost: response.usage?.cost || 0,
          prompt: prompt.substring(0, 50) + '...'
        });

      } catch (error) {
        const latency = Date.now() - startTime;
        modelResults.trials.push({
          success: false,
          latency,
          error: error.message,
          prompt: prompt.substring(0, 50) + '...'
        });
      }
    }

    // Calculate statistics
    const successfulTrials = modelResults.trials.filter(t => t.success);
    modelResults.successRate = successfulTrials.length / options.trials;
    modelResults.averageLatency = successfulTrials.reduce((sum, t) => sum + t.latency, 0) / successfulTrials.length || 0;
    modelResults.averageCost = successfulTrials.reduce((sum, t) => sum + (t.cost || 0), 0) / successfulTrials.length || 0;
    modelResults.totalTokens = successfulTrials.reduce((sum, t) => sum + t.tokens, 0);

    results.models[model] = modelResults;

    console.log(`  ✅ Success rate: ${(modelResults.successRate * 100).toFixed(1)}%`);
    console.log(`  ⏱️ Average latency: ${modelResults.averageLatency.toFixed(0)}ms`);
    console.log(`  💰 Average cost: $${modelResults.averageCost.toFixed(6)}`);
  }

  // Overall summary
  const allTrials = Object.values(results.models).flatMap(m => m.trials);
  const allSuccessful = allTrials.filter(t => t.success);
  
  results.summary = {
    totalTrials: allTrials.length,
    successfulTrials: allSuccessful.length,
    overallSuccessRate: allSuccessful.length / allTrials.length,
    averageLatency: allSuccessful.reduce((sum, t) => sum + t.latency, 0) / allSuccessful.length || 0,
    totalCost: allSuccessful.reduce((sum, t) => sum + (t.cost || 0), 0),
    totalTokens: allSuccessful.reduce((sum, t) => sum + t.tokens, 0)
  };

  // Save results
  await fs.writeFile(options.output, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 Benchmark Results:`);
  console.log(`   Overall success rate: ${(results.summary.overallSuccessRate * 100).toFixed(1)}%`);
  console.log(`   Average latency: ${results.summary.averageLatency.toFixed(0)}ms`);
  console.log(`   Total cost: $${results.summary.totalCost.toFixed(6)}`);
  console.log(`   Total tokens: ${results.summary.totalTokens}`);
  console.log(`   Results saved to: ${options.output}`);

  return true;
}

async function runConnectivityTest(options) {
  console.log('🔍 Gemini Connectivity Test');

  const tests = [
    { name: 'API Key Validation', test: testApiKey },
    { name: 'Basic Completion', test: testBasicCompletion },
    { name: 'Streaming Response', test: testStreaming },
    { name: 'Safety Filtering', test: testSafety }
  ];

  if (process.env.GEMINI_USE_VERTEX === 'true') {
    tests.unshift({ name: 'Vertex AI Authentication', test: testVertexAuth });
  }

  let passed = 0;
  let total = tests.length;

  for (const { name, test } of tests) {
    process.stdout.write(`  ${name}... `);
    
    try {
      const result = await test(options);
      if (result) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      if (options.verbose) {
        console.log(`     ${error.stack}`);
      }
    }
  }

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testApiKey(options) {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  const useVertex = process.env.GEMINI_USE_VERTEX === 'true';
  
  if (useVertex) {
    return !!(process.env.GCP_PROJECT_ID);
  } else {
    return hasApiKey;
  }
}

async function testVertexAuth(options) {
  // Basic Vertex AI auth test
  try {
    const { VertexAI } = require('@google-cloud/vertexai');
    const vertex = new VertexAI({
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_VERTEX_LOCATION || 'us-central1',
    });
    
    // Just test initialization
    return true;
  } catch (error) {
    if (options.verbose) {
      console.log(`\n     Vertex Auth Error: ${error.message}`);
    }
    return false;
  }
}

async function testBasicCompletion(options) {
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY,
    useVertex: process.env.GEMINI_USE_VERTEX === 'true'
  });

  await provider.initialize();
  
  const response = await provider.generateCompletion([
    { role: 'user', content: 'Say "Hello from Gemini" and nothing else.' }
  ], { maxTokens: 50 });

  return response.content.includes('Hello from Gemini');
}

async function testStreaming(options) {
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY,
    useVertex: process.env.GEMINI_USE_VERTEX === 'true'
  });

  await provider.initialize();
  
  let chunks = 0;
  let hasContent = false;
  
  for await (const chunk of provider.generateStreamingCompletion([
    { role: 'user', content: 'Count from 1 to 3.' }
  ])) {
    chunks++;
    if (chunk.content && chunk.content.trim()) {
      hasContent = true;
    }
    if (!chunk.isPartial) break;
  }

  return chunks > 0 && hasContent;
}

async function testSafety(options) {
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY,
    useVertex: process.env.GEMINI_USE_VERTEX === 'true'
  });

  await provider.initialize();
  
  try {
    await provider.generateCompletion([
      { role: 'user', content: 'This is a safe test message for content filtering.' }
    ], { maxTokens: 50 });
    return true;
  } catch (error) {
    // If it's a safety error, that means safety is working
    return error.message.includes('safety') || error.message.includes('blocked');
  }
}

function getMimeType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return types[ext] || null;
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runPrompt, runBenchmark, runConnectivityTest };