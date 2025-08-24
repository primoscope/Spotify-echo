export interface LlmMessage { role: 'user' | 'assistant' | 'system'; content: string; }
export interface LlmGenerateOptions { model?: string; timeoutMs?: number; signal?: AbortSignal; }
export interface LlmProvider { name: string; generate(messages: LlmMessage[], options?: LlmGenerateOptions): Promise<string>; getActiveModel(): string; }