const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const ProviderManager = require('../../src/api/providers/ProviderManager');

// Minimal mock for fetch where needed
global.fetch = jest.fn();

describe('LLM ProviderManager', () => {
  let mgr;

  beforeEach(() => {
    mgr = new ProviderManager();
    process.env.OPENAI_API_KEY = 'test-openai';
    process.env.GEMINI_API_KEY = 'test-gemini';
    process.env.OPENROUTER_API_KEY = 'test-openrouter';
  });

  it('lists available providers based on env', () => {
    const providers = mgr.getAvailableProviders();
    expect(providers).toEqual(expect.arrayContaining(['openai', 'gemini', 'openrouter']));
  });

  it('creates prompts for code-generation and review', () => {
    const code = 'function add(a,b){return a+b}';
    const cgPrompt = mgr.createTaskPrompt('code-generation', code, 'gpt-5');
    const rvPrompt = mgr.createTaskPrompt('code-review', code, 'claude-3.5-sonnet');
    expect(cgPrompt).toMatch(/expert software engineer/i);
    expect(rvPrompt).toMatch(/rigorous code review/i);
  });

  it('selects a provider for a task', () => {
    const provider = mgr.selectProvider('analysis');
    expect(typeof provider).toBe('string');
  });
});

describe('Perplexity executor', () => {
  const path = require('path');
  const fs = require('fs');
  const axios = require('axios');
  jest.mock('axios');

  const Executor = require(path.join(__dirname, '../../prompts/tools/executor.js'));

  beforeAll(() => {
    process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'pplx-test-key';
  });

  afterAll(() => {
    delete process.env.PERPLEXITY_API_KEY;
    jest.resetAllMocks();
  });

  test('retries on 429 then succeeds', async () => {
    const executor = new Executor();
    const promptPath = 'analysis/user-driven-sonar-pro';

    axios.post
      .mockRejectedValueOnce({ response: { status: 429 }, message: 'rate limit' })
      .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'ok' } }], usage: {} } });

    const result = await executor.execute(promptPath, { user_prompt: 'hello' });
    expect(result.content).toMatch(/ok/i);
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  test('maps 401/403 to auth error', async () => {
    const executor = new Executor();
    const promptPath = 'analysis/user-driven-sonar-pro';

    axios.post.mockRejectedValueOnce({ response: { status: 401 }, message: 'unauthorized' });

    await expect(executor.execute(promptPath, { user_prompt: 'hi' }))
      .rejects.toThrow(/authentication failed/i);
  });

  test('maps 400 to payload error', async () => {
    const executor = new Executor();
    const promptPath = 'analysis/user-driven-sonar-pro';

    axios.post.mockRejectedValueOnce({ response: { status: 400 }, message: 'bad request' });

    await expect(executor.execute(promptPath, { user_prompt: 'hi' }))
      .rejects.toThrow(/rejected the request \(400\)/i);
  });
});