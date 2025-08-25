# 🧠 Gemini Integration Guide

## Overview

This document provides comprehensive instructions for integrating and using the enhanced Google Gemini provider in EchoTune AI, including multimodal capabilities, advanced caching, and comprehensive observability.

## Quick Start

### Environment Configuration

```bash
# Required - Google AI Studio (recommended for development)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-pro

# Optional - Vertex AI (production environments)
GEMINI_USE_VERTEX=false
GCP_PROJECT_ID=your_project_id
GCP_VERTEX_LOCATION=us-central1

# Advanced Configuration
GEMINI_MODEL_FALLBACK=gemini-1.5-flash
GEMINI_SAFETY_MODE=BLOCK_MEDIUM_AND_ABOVE
GEMINI_RESPONSE_FORMAT=text
GEMINI_FUNCTION_CALLING_ENABLED=false
GEMINI_CODE_ASSIST_ENABLED=false
GEMINI_CACHE_TTL_MS=600000
```

### Basic Usage

```javascript
const GeminiProvider = require('../src/chat/llm-providers/gemini-provider');

// Initialize provider
const provider = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.5-pro'
});

await provider.initialize();

// Simple text completion
const response = await provider.generateCompletion([
  { role: 'user', content: 'Recommend jazz albums for coding' }
]);

console.log(response.content);
```

## CLI Tools

### Gemini CLI Wrapper

```bash
# Simple prompt
npm run gemini:prompt -- --prompt "Suggest 5 indie rock bands"

# With image
npm run gemini:prompt -- --prompt "Analyze this album cover" --images ./cover.jpg

# Streaming response
npm run gemini:prompt -- --prompt "Tell a story" --stream

# JSON output
npm run gemini:prompt -- --prompt "List top 10 albums" --json
```

### Benchmarking

```bash
# Run standard benchmark
npm run gemini:benchmark

# Specific strategy testing
npm run ai:eval:gemini-completion
npm run ai:eval:gemini-streaming
npm run ai:eval:gemini-safety
```

### Connectivity Testing

```bash
# Test all Gemini features
npm run gemini:test

# Verbose output
npm run gemini:test -- --verbose
```

For complete documentation, see the enhanced integration guide.
