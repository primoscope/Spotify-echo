import { OpenRouterProvider } from './providers/openrouter';
import { MockProvider } from './providers/mock';
import { GoogleGeminiProvider } from './providers/google';
import type { LlmProvider } from './types';
export function getLlmProvider(): LlmProvider { const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase(); switch (provider) { case 'openrouter': return new OpenRouterProvider(); case 'google': return new GoogleGeminiProvider(); case 'mock': return new MockProvider(); default: throw new Error(`Unsupported LLM_PROVIDER: ${provider}`); } }