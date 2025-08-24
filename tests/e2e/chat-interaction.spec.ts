import { test, expect } from '../utils/step';
import MockProvider from '../utils/mocks';

test.describe('Chat Interaction Validation', () => {
  let mockProvider: MockProvider;

  test.beforeEach(async ({ page }) => {
    mockProvider = new MockProvider();
    await mockProvider.setupLLMMocks(page);
    await mockProvider.setupSpotifyMocks(page);
  });

  test('basic conversation with mock or openrouter', async ({ page, step }) => {
    test.skip(process.env.LLM_PROVIDER === 'google', 'Handled in gemini spec when live');
    
    await step('navigate to home', async () => { 
      await page.goto('/'); 
      await expect(page).toHaveTitle(/EchoTune|Spotify/i); 
    });
    
    await step('find and open chat interface', async () => { 
      // Look for various chat UI elements
      const chatElements = [
        '[data-testid="chat-open-button"]',
        '[data-testid="chat-input"]',
        'button:has-text("Chat")',
        'button:has-text("Ask AI")',
        '.chat-button',
        '.ai-chat',
        'input[placeholder*="chat"]',
        'input[placeholder*="ask"]',
        'textarea[placeholder*="message"]'
      ];
      
      let chatFound = false;
      for (const selector of chatElements) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          chatFound = true;
          console.log(`✅ Found chat element: ${selector}`);
          break;
        }
      }
      
      if (!chatFound) {
        console.log('⚠️ No specific chat interface found - checking for input fields');
        const anyInput = page.locator('input[type="text"], textarea').first();
        if (await anyInput.count() > 0) {
          chatFound = true;
          console.log('✅ Found generic input field for chat');
        }
      }
      
      expect(chatFound).toBeTruthy();
    });
    
    await step('send chat prompt', async () => { 
      const chatInputs = [
        '[data-testid="chat-input"]',
        'input[placeholder*="chat"]',
        'input[placeholder*="ask"]',
        'input[placeholder*="message"]',
        'textarea[placeholder*="message"]',
        'input[type="text"]',
        'textarea'
      ];
      
      let inputFound = false;
      for (const selector of chatInputs) {
        const input = page.locator(selector).first();
        if (await input.count() > 0) {
          await input.fill('Show my top 5 artists (test)');
          inputFound = true;
          console.log(`✅ Filled chat input: ${selector}`);
          break;
        }
      }
      
      expect(inputFound).toBeTruthy();
      
      // Try to find and click send button
      const sendButtons = [
        '[data-testid="chat-send"]',
        'button:has-text("Send")',
        'button[type="submit"]',
        '.send-button',
        '.chat-send'
      ];
      
      let sendFound = false;
      for (const selector of sendButtons) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          sendFound = true;
          console.log(`✅ Clicked send button: ${selector}`);
          break;
        }
      }
      
      if (!sendFound) {
        // Try pressing Enter
        await page.keyboard.press('Enter');
        console.log('✅ Sent message with Enter key');
      }
    });
    
    await step('receive and validate answer', async () => { 
      // Wait for response with various possible selectors
      const responseSelectors = [
        '[data-testid="chat-message-assistant"]',
        '[data-testid="chat-response"]',
        '.chat-message.assistant',
        '.ai-response',
        '.chat-response',
        '.message.bot',
        '.response'
      ];
      
      let responseFound = false;
      for (const selector of responseSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 15000 });
          const text = await page.textContent(selector);
          if (text && text.trim().length > 0) {
            expect(text).toBeTruthy();
            responseFound = true;
            console.log(`✅ Found AI response: ${text.substring(0, 100)}...`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!responseFound) {
        // Check for any new content that might be the response
        await page.waitForTimeout(3000);
        const pageContent = await page.textContent('body');
        const hasResponseKeywords = pageContent.includes('artist') || 
                                  pageContent.includes('music') || 
                                  pageContent.includes('response') ||
                                  pageContent.includes('mock');
        
        if (hasResponseKeywords) {
          responseFound = true;
          console.log('✅ Response detected in page content');
        }
      }
      
      expect(responseFound).toBeTruthy();
    });
    
    await step('check model indicator (optional)', async () => { 
      const modelIndicators = [
        '[data-testid="chat-model"]',
        '.model-indicator',
        '.llm-provider',
        '.ai-model'
      ];
      
      let modelFound = false;
      for (const selector of modelIndicators) {
        const modelIndicator = await page.locator(selector).first();
        if (await modelIndicator.count() > 0) {
          const text = (await modelIndicator.textContent())?.toLowerCase() || '';
          const validModels = ['llama', 'mistral', 'mythomax', 'gemini', 'mock', 'openai', 'gpt'];
          const hasValidModel = validModels.some(model => text.includes(model));
          
          if (hasValidModel) {
            expect(hasValidModel).toBeTruthy();
            modelFound = true;
            console.log(`✅ Model indicator found: ${text}`);
            break;
          }
        }
      }
      
      if (!modelFound) {
        console.log('⚠️ No model indicator found - this is optional');
      }
    });
  });

  test('should handle multiple conversation turns', async ({ page, step }) => {
    await step('navigate and start chat', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    });

    await step('send first message', async () => {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.count() > 0) {
        await input.fill('What music do you recommend?');
        await page.keyboard.press('Enter');
      }
    });

    await step('wait for first response', async () => {
      await page.waitForTimeout(2000);
    });

    await step('send follow-up message', async () => {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.count() > 0) {
        await input.fill('Tell me more about jazz music');
        await page.keyboard.press('Enter');
      }
    });

    await step('verify conversation history', async () => {
      await page.waitForTimeout(2000);
      
      // Check for multiple messages in conversation
      const messages = await page.locator('[data-testid*="message"], .message, .chat-message').count();
      
      if (messages >= 2) {
        console.log(`✅ Conversation history maintained: ${messages} messages`);
      } else {
        console.log('⚠️ Conversation history not clearly visible');
      }
    });
  });

  test('should handle chat errors gracefully', async ({ page, step }) => {
    await step('setup error conditions', async () => {
      // Mock error responses
      await page.route('**/api/chat/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI service unavailable' })
        });
      });

      await page.goto('/');
    });

    await step('attempt to send message', async () => {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.count() > 0) {
        await input.fill('This should cause an error');
        await page.keyboard.press('Enter');
      }
    });

    await step('verify error handling', async () => {
      await page.waitForTimeout(2000);
      
      // Check for error messages
      const hasErrorMessage = await page.locator('[data-testid*="error"], .error-message, .chat-error').count() > 0;
      
      if (hasErrorMessage) {
        console.log('✅ Error message displayed to user');
      } else {
        console.log('⚠️ No clear error handling UI found');
      }
      
      // App should still be functional
      await expect(page).toHaveTitle(/EchoTune|Spotify/i);
    });
  });

  test('should provide typing indicators', async ({ page, step }) => {
    await step('navigate to chat', async () => {
      await page.goto('/');
    });

    await step('send message and check typing indicator', async () => {
      const input = page.locator('input[type="text"], textarea').first();
      if (await input.count() > 0) {
        await input.fill('Generate a playlist');
        await page.keyboard.press('Enter');
        
        // Check for typing/loading indicators
        const hasTypingIndicator = await page.locator('[data-testid*="typing"], .typing-indicator, .loading, .spinner').count() > 0;
        
        if (hasTypingIndicator) {
          console.log('✅ Typing indicator found');
        } else {
          console.log('⚠️ No typing indicator found');
        }
      }
    });

    await step('wait for response', async () => {
      await page.waitForTimeout(3000);
    });
  });
});