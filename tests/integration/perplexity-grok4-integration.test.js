/**
 * Perplexity and Grok-4 Integration Tests
 * Validates the new provider implementations
 */

const path = require('path');

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.PERPLEXITY_API_KEY = 'test-key';
process.env.XAI_API_KEY = 'test-key';

// Mock node-fetch to avoid real API calls during testing
jest.mock('node-fetch', () => {
  return jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: { content: 'Test response' }
        }],
        model: 'test-model',
        usage: { total_tokens: 100 }
      }),
    })
  );
});

describe('Perplexity Provider Integration', () => {
  let PerplexityProvider;
  
  beforeAll(() => {
    PerplexityProvider = require('../src/chat/llm-providers/perplexity-provider');
  });

  test('should create Perplexity provider instance', () => {
    const provider = new PerplexityProvider({
      apiKey: 'test-key',
      model: 'sonar-pro'
    });

    expect(provider).toBeDefined();
    expect(provider.defaultModel).toBe('sonar-pro');
    expect(provider.supportedModels).toContain('sonar-pro');
  });

  test('should validate configuration correctly', () => {
    const provider = new PerplexityProvider({
      apiKey: 'test-key'
    });

    expect(provider.validateConfig()).toBe(true);

    const providerNoKey = new PerplexityProvider({});
    expect(providerNoKey.validateConfig()).toBe(false);
  });

  test('should return correct capabilities', () => {
    const provider = new PerplexityProvider({
      apiKey: 'test-key'
    });

    const capabilities = provider.getCapabilities();
    expect(capabilities.webSearch).toBe(true);
    expect(capabilities.citations).toBe(true);
    expect(capabilities.features).toContain('research');
  });

  test('should initialize provider successfully', async () => {
    const provider = new PerplexityProvider({
      apiKey: 'test-key'
    });

    await expect(provider.initialize()).resolves.not.toThrow();
    expect(provider.isInitialized).toBe(true);
  });

  test('should handle research queries', async () => {
    const provider = new PerplexityProvider({
      apiKey: 'test-key'
    });
    await provider.initialize();

    const result = await provider.research('test query');
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });
});

describe('Grok-4 Provider Integration', () => {
  let Grok4Provider;
  
  beforeAll(() => {
    Grok4Provider = require('../src/chat/llm-providers/grok4-provider');
  });

  test('should create Grok-4 provider instance', () => {
    const provider = new Grok4Provider({
      apiKey: 'test-key',
      model: 'grok-4'
    });

    expect(provider).toBeDefined();
    expect(provider.defaultModel).toBe('grok-4');
    expect(provider.supportedModels).toContain('grok-4-heavy');
  });

  test('should validate configuration correctly', () => {
    const provider = new Grok4Provider({
      apiKey: 'test-key'
    });

    expect(provider.validateConfig()).toBe(true);

    const providerWithOpenRouter = new Grok4Provider({
      openRouterKey: 'test-key'
    });
    expect(providerWithOpenRouter.validateConfig()).toBe(true);

    const providerNoKey = new Grok4Provider({});
    expect(providerNoKey.validateConfig()).toBe(false);
  });

  test('should return correct capabilities', () => {
    const provider = new Grok4Provider({
      apiKey: 'test-key'
    });

    const capabilities = provider.getCapabilities();
    expect(capabilities.codeAnalysis).toBe(true);
    expect(capabilities.multiAgent).toBe(true);
    expect(capabilities.largeContext).toBe(true);
    expect(capabilities.features).toContain('code-analysis');
  });

  test('should initialize provider successfully', async () => {
    const provider = new Grok4Provider({
      apiKey: 'test-key'
    });

    await expect(provider.initialize()).resolves.not.toThrow();
    expect(provider.isInitialized).toBe(true);
  });

  test('should handle repository analysis', async () => {
    const provider = new Grok4Provider({
      apiKey: 'test-key'
    });
    await provider.initialize();

    const codeSnapshot = 'const test = "sample code";';
    const result = await provider.analyzeRepository(codeSnapshot, 'comprehensive');
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  test('should handle code debugging', async () => {
    const provider = new Grok4Provider({
      apiKey: 'test-key'
    });
    await provider.initialize();

    const code = 'function broken() { return undefined.property; }';
    const error = 'TypeError: Cannot read property of undefined';
    const result = await provider.debugCode(code, error);
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });
});

describe('Model Registry Integration', () => {
  let modelRegistry;

  beforeAll(() => {
    modelRegistry = require('../src/chat/model-registry');
  });

  beforeEach(async () => {
    await modelRegistry.initialize();
  });

  test('should include Perplexity models in registry', async () => {
    await modelRegistry.loadModelDefinitions();
    
    const perplexityModels = modelRegistry.models.get('perplexity');
    expect(perplexityModels).toBeDefined();
    expect(perplexityModels.has('sonar-pro')).toBe(true);
    expect(perplexityModels.has('sonar-large')).toBe(true);
  });

  test('should include Grok-4 models in registry', async () => {
    await modelRegistry.loadModelDefinitions();
    
    const grok4Models = modelRegistry.models.get('grok4');
    expect(grok4Models).toBeDefined();
    expect(grok4Models.has('grok-4')).toBe(true);
    expect(grok4Models.has('grok-4-heavy')).toBe(true);
  });

  test('should detect available providers', () => {
    const providers = modelRegistry.getAvailableProviders();
    expect(providers).toContain('perplexity');
    expect(providers).toContain('grok4');
  });
});

describe('LLM Provider Manager Integration', () => {
  let llmProviderManager;

  beforeAll(() => {
    llmProviderManager = require('../src/chat/llm-provider-manager');
  });

  test('should initialize new providers', async () => {
    await llmProviderManager.initialize();

    expect(llmProviderManager.providers.has('perplexity')).toBe(true);
    expect(llmProviderManager.providers.has('grok4')).toBe(true);
  });

  test('should include new providers in fallback order', () => {
    expect(llmProviderManager.fallbackOrder).toContain('perplexity');
    expect(llmProviderManager.fallbackOrder).toContain('grok4');
  });
});

describe('API Routes Integration', () => {
  test('research routes should be defined', () => {
    const researchRoutes = require('../src/api/routes/research');
    expect(researchRoutes).toBeDefined();
  });

  test('analysis routes should be defined', () => {
    const analysisRoutes = require('../src/api/routes/analysis');
    expect(analysisRoutes).toBeDefined();
  });
});

// Cleanup
afterAll(() => {
  jest.restoreAllMocks();
});