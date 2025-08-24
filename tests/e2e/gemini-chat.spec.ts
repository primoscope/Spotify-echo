import { test, expect } from '../utils/step';

test.describe('Gemini direct chat (live)', () => {
  test.skip(!(process.env.LLM_PROVIDER === 'google' && process.env.LIVE_LLM_TEST === '1'), 'Live Gemini test disabled');
  test('basic prompt -> response', async ({ page, step }) => {
    await step('navigate home', async () => { await page.goto('/'); await expect(page).toHaveTitle(/Spotify/i); });
    await step('open chat UI', async () => { await page.click('[data-testid="chat-open-button"], [data-testid="chat-input"]').catch(()=>{}); });
    await step('send prompt', async () => { await page.fill('[data-testid="chat-input"]', 'List my top 3 genres (test run)'); await page.click('[data-testid="chat-send"]'); });
    await step('wait assistant response', async () => { await page.waitForSelector('[data-testid="chat-message-assistant"]', { timeout: 20000 }); const messages = await page.$$('[data-testid="chat-message-assistant"]'); expect(messages.length).toBeGreaterThan(0); });
    await step('assert model indicator (if present)', async () => { const modelIndicator = await page.$('[data-testid="chat-model"]'); if (modelIndicator) { const txt = (await modelIndicator.textContent()) || ''; expect(txt.toLowerCase()).toContain('gemini'); } });
  });
});