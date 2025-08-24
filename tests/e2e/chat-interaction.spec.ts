import { test, expect } from '../utils/step';

test.describe('Chat interaction (provider-agnostic)', () => {
  test('basic conversation with mock or openrouter', async ({ page, step }) => {
    test.skip(process.env.LLM_PROVIDER === 'google', 'Handled in gemini spec when live');
    await step('home', async () => { await page.goto('/'); await expect(page).toHaveTitle(/Spotify/i); });
    await step('open chat', async () => { await page.click('[data-testid="chat-open-button"], [data-testid="chat-input"]').catch(()=>{}); });
    await step('send prompt', async () => { await page.fill('[data-testid="chat-input"]', 'Show my top 5 artists (test)'); await page.click('[data-testid="chat-send"]'); });
    await step('receive answer', async () => { await page.waitForSelector('[data-testid="chat-message-assistant"]', { timeout: 15000 }); const txt = await page.textContent('[data-testid="chat-message-assistant"] >> nth=0'); expect(txt).toBeTruthy(); });
    await step('model indicator optional', async () => { const modelIndicator = await page.$('[data-testid="chat-model"]'); if (modelIndicator) { const text = (await modelIndicator.textContent())?.toLowerCase() || ''; expect(['llama','mistral','mythomax','gemini','mock'].some(k => text.includes(k))).toBeTruthy(); } });
  });
});