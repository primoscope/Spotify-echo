const { describe, it, expect, beforeEach, vi } = require('@jest/globals');
const ProviderManager = require('../../src/api/providers/ProviderManager');

// Minimal mock for fetch where needed
global.fetch = vi.fn();

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