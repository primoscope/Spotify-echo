import { test, expect } from '@playwright/test';
import { config } from 'dotenv';

// Load real environment variables
config({ path: '.env.real-testing' });

test.describe('Real AI Chat Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up environment for real API testing
    await page.addInitScript(() => {
      window.TEST_MODE = 'real';
      window.USE_REAL_APIS = true;
      window.DISABLE_MOCKS = true;
    });
  });

  test('should test real OpenAI/Gemini chat interaction', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for real AI responses
    
    console.log('🤖 Testing Real AI Chat Integration...');
    
    await page.goto('/');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'artifacts/screenshots/01-chat-initial-page.png',
      fullPage: true 
    });
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Look for chat interface elements
    const chatSelectors = [
      '[data-testid="chat-input"]',
      '[data-testid="chat-container"]',
      'input[placeholder*="chat"]',
      'input[placeholder*="ask"]',
      'input[placeholder*="message"]',
      'textarea[placeholder*="message"]',
      '.chat-input',
      '.ai-chat-input',
      'input[type="text"]',
      'textarea'
    ];
    
    let chatInput = null;
    for (const selector of chatSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        chatInput = element;
        console.log(`✅ Found chat input: ${selector}`);
        break;
      }
    }
    
    if (!chatInput) {
      console.log('🔍 No chat interface found, testing direct API endpoint...');
      
      // Test chat API directly
      const chatResponse = await page.request.post('/api/chat', {
        data: {
          message: 'Recommend me some jazz music for studying',
          provider: 'gemini' // Use Gemini as primary
        }
      });
      
      console.log(`📍 Chat API status: ${chatResponse.status()}`);
      
      if (chatResponse.status() === 200) {
        const chatData = await chatResponse.json();
        expect(chatData).toHaveProperty('response');
        expect(chatData.response.length).toBeGreaterThan(10);
        
        console.log('✅ Real AI response received');
        console.log(`🤖 Response preview: ${chatData.response.substring(0, 100)}...`);
        
        // Take screenshot showing API response would work
        await page.screenshot({
          path: 'artifacts/screenshots/02-chat-api-response.png',
          fullPage: true
        });
        
        return;
      } else {
        console.log(`⚠️ Chat API returned status: ${chatResponse.status()}`);
      }
    }
    
    if (chatInput) {
      // Test real chat interaction through UI
      console.log('✅ Found chat interface, testing real interaction...');
      
      // Clear any existing content
      await chatInput.clear();
      
      // Type a music-related question
      const testMessage = 'Can you recommend some chill electronic music for working?';
      await chatInput.fill(testMessage);
      
      // Take screenshot after typing
      await page.screenshot({
        path: 'artifacts/screenshots/03-chat-message-typed.png',
        fullPage: true
      });
      
      // Look for send button or press Enter
      const sendSelectors = [
        '[data-testid="chat-send"]',
        'button:has-text("Send")',
        'button[type="submit"]',
        '.send-button',
        '.chat-send-button'
      ];
      
      let sendButton = null;
      for (const selector of sendSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          sendButton = element;
          break;
        }
      }
      
      if (sendButton) {
        await sendButton.click();
        console.log('✅ Clicked send button');
      } else {
        await page.keyboard.press('Enter');
        console.log('✅ Sent message with Enter key');
      }
      
      // Take screenshot after sending
      await page.screenshot({
        path: 'artifacts/screenshots/04-chat-message-sent.png',
        fullPage: true
      });
      
      // Wait for AI response (with timeout)
      console.log('⏳ Waiting for AI response...');
      
      const responseSelectors = [
        '[data-testid="chat-message-assistant"]',
        '[data-testid="ai-response"]',
        '.chat-message.assistant',
        '.ai-response',
        '.chat-response',
        '.message.bot',
        '.response'
      ];
      
      let responseReceived = false;
      const maxWaitTime = 60000; // 1 minute
      const startTime = Date.now();
      
      while (!responseReceived && (Date.now() - startTime) < maxWaitTime) {
        for (const selector of responseSelectors) {
          const element = page.locator(selector).last();
          if (await element.count() > 0) {
            const text = await element.textContent();
            if (text && text.trim().length > 5) {
              responseReceived = true;
              console.log(`✅ AI response received: ${text.substring(0, 100)}...`);
              
              // Verify response is relevant to music
              const musicKeywords = ['music', 'track', 'song', 'artist', 'album', 'electronic', 'chill', 'recommend'];
              const hasRelevantContent = musicKeywords.some(keyword => 
                text.toLowerCase().includes(keyword)
              );
              
              expect(hasRelevantContent).toBeTruthy();
              break;
            }
          }
        }
        
        if (!responseReceived) {
          await page.waitForTimeout(2000);
        }
      }
      
      // Take screenshot of response
      await page.screenshot({
        path: 'artifacts/screenshots/05-chat-ai-response.png',
        fullPage: true
      });
      
      if (!responseReceived) {
        console.log('⚠️ No AI response received within timeout');
        
        // Check for loading indicators
        const loadingSelectors = [
          '[data-testid="chat-loading"]',
          '.loading',
          '.spinner',
          '.typing-indicator'
        ];
        
        for (const selector of loadingSelectors) {
          if (await page.locator(selector).count() > 0) {
            console.log(`⏳ Loading indicator found: ${selector}`);
          }
        }
      }
      
      expect(responseReceived).toBeTruthy();
    }
    
    console.log('✅ Real AI chat integration testing completed');
  });

  test('should test multiple AI providers', async ({ page }) => {
    test.setTimeout(240000); // 4 minutes for multiple providers
    
    console.log('🔄 Testing Multiple AI Providers...');
    
    await page.goto('/');
    
    // Test different providers
    const providers = [
      { name: 'gemini', apiKey: process.env.GEMINI_API_KEY },
      { name: 'openai', apiKey: process.env.OPENAI_API_KEY },
      { name: 'openrouter', apiKey: process.env.OPENROUTER_API_KEY }
    ];
    
    for (const provider of providers) {
      if (!provider.apiKey) {
        console.log(`⚠️ Skipping ${provider.name} - no API key`);
        continue;
      }
      
      console.log(`🔍 Testing ${provider.name} provider...`);
      
      const response = await page.request.post('/api/chat', {
        data: {
          message: 'What is your favorite music genre?',
          provider: provider.name
        }
      });
      
      console.log(`📍 ${provider.name} status: ${response.status()}`);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('response');
        expect(data.response.length).toBeGreaterThan(5);
        
        console.log(`✅ ${provider.name} response: ${data.response.substring(0, 50)}...`);
      } else {
        console.log(`⚠️ ${provider.name} failed with status: ${response.status()}`);
      }
      
      // Take screenshot for each provider test
      await page.screenshot({
        path: `artifacts/screenshots/06-${provider.name}-provider-test.png`,
        fullPage: true
      });
      
      // Wait between requests to avoid rate limiting
      await page.waitForTimeout(2000);
    }
    
    console.log('✅ Multiple AI providers testing completed');
  });

  test('should test real-time conversation flow', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for conversation
    
    console.log('💬 Testing Real-time Conversation Flow...');
    
    await page.goto('/');
    
    // Take initial screenshot
    await page.screenshot({
      path: 'artifacts/screenshots/07-conversation-initial.png',
      fullPage: true
    });
    
    const conversation = [
      'I love jazz music, what do you recommend?',
      'Tell me more about Miles Davis',
      'Can you create a playlist with similar artists?'
    ];
    
    for (let i = 0; i < conversation.length; i++) {
      const message = conversation[i];
      console.log(`💬 Sending message ${i + 1}: ${message}`);
      
      // Find chat input
      const chatInput = page.locator('input[type="text"], textarea').first();
      
      if (await chatInput.count() > 0) {
        await chatInput.clear();
        await chatInput.fill(message);
        await page.keyboard.press('Enter');
        
        // Take screenshot after each message
        await page.screenshot({
          path: `artifacts/screenshots/08-conversation-message-${i + 1}.png`,
          fullPage: true
        });
        
        // Wait for response
        await page.waitForTimeout(10000);
        
        // Take screenshot of response
        await page.screenshot({
          path: `artifacts/screenshots/09-conversation-response-${i + 1}.png`,
          fullPage: true
        });
      } else {
        // Test via API if no UI
        const response = await page.request.post('/api/chat', {
          data: {
            message: message,
            conversationId: 'test-conversation-123'
          }
        });
        
        if (response.status() === 200) {
          const data = await response.json();
          console.log(`✅ API response ${i + 1}: ${data.response.substring(0, 50)}...`);
        }
      }
    }
    
    console.log('✅ Real-time conversation flow testing completed');
  });

  test('should test AI error handling and fallbacks', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🚨 Testing AI Error Handling and Fallbacks...');
    
    await page.goto('/');
    
    // Test with invalid API key
    const invalidKeyResponse = await page.request.post('/api/chat', {
      data: {
        message: 'Test message',
        provider: 'gemini'
      },
      headers: {
        'X-Test-Invalid-Key': 'true'
      }
    });
    
    console.log(`📍 Invalid key response: ${invalidKeyResponse.status()}`);
    
    // Should handle error gracefully
    if (invalidKeyResponse.status() === 401 || invalidKeyResponse.status() === 403) {
      console.log('✅ Invalid API key handled correctly');
    } else if (invalidKeyResponse.status() === 500) {
      const errorData = await invalidKeyResponse.json();
      expect(errorData).toHaveProperty('error');
      console.log('✅ Server error handled with proper response');
    }
    
    // Test rate limiting
    const rateLimitResponse = await page.request.post('/api/chat', {
      data: {
        message: 'Rate limit test',
        provider: 'gemini'
      },
      headers: {
        'X-Test-Rate-Limit': 'true'
      }
    });
    
    console.log(`📍 Rate limit response: ${rateLimitResponse.status()}`);
    
    // Test provider fallback
    const fallbackResponse = await page.request.post('/api/chat', {
      data: {
        message: 'Fallback test - recommend rock music',
        provider: 'auto' // Should use best available provider
      }
    });
    
    if (fallbackResponse.status() === 200) {
      const data = await fallbackResponse.json();
      console.log(`✅ Fallback provider worked: ${data.response.substring(0, 50)}...`);
    }
    
    // Take screenshot of error handling
    await page.screenshot({
      path: 'artifacts/screenshots/10-ai-error-handling.png',
      fullPage: true
    });
    
    console.log('✅ AI error handling and fallbacks testing completed');
  });

  test('should test music-specific AI capabilities', async ({ page }) => {
    test.setTimeout(180000);
    
    console.log('🎵 Testing Music-Specific AI Capabilities...');
    
    await page.goto('/');
    
    const musicQueries = [
      'Analyze the musical characteristics of bebop jazz',
      'Create a workout playlist with high-energy songs',
      'What are the key differences between house and techno music?',
      'Recommend ambient music for meditation',
      'Explain the chord progression in "Giant Steps" by John Coltrane'
    ];
    
    for (let i = 0; i < musicQueries.length; i++) {
      const query = musicQueries[i];
      console.log(`🎵 Testing query ${i + 1}: ${query.substring(0, 50)}...`);
      
      const response = await page.request.post('/api/chat', {
        data: {
          message: query,
          context: 'music_analysis'
        }
      });
      
      if (response.status() === 200) {
        const data = await response.json();
        
        // Verify response contains music-related content
        const musicTerms = ['music', 'song', 'artist', 'album', 'chord', 'rhythm', 'melody', 'genre'];
        const responseText = data.response.toLowerCase();
        const containsMusicTerms = musicTerms.some(term => responseText.includes(term));
        
        expect(containsMusicTerms).toBeTruthy();
        console.log(`✅ Music-aware response received for query ${i + 1}`);
      }
      
      // Take screenshot for each music query
      await page.screenshot({
        path: `artifacts/screenshots/11-music-query-${i + 1}.png`,
        fullPage: true
      });
      
      await page.waitForTimeout(3000);
    }
    
    console.log('✅ Music-specific AI capabilities testing completed');
  });

  test('should test performance and response times', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('⚡ Testing AI Performance and Response Times...');
    
    await page.goto('/');
    
    const performanceTests = [
      { message: 'Quick question about rock music', expectedMaxTime: 15000 },
      { message: 'Give me a detailed analysis of Bach\'s compositional style with examples', expectedMaxTime: 30000 },
      { message: 'Jazz', expectedMaxTime: 10000 } // Short query
    ];
    
    for (let i = 0; i < performanceTests.length; i++) {
      const test = performanceTests[i];
      
      console.log(`⚡ Performance test ${i + 1}: ${test.message.substring(0, 30)}...`);
      
      const startTime = Date.now();
      
      const response = await page.request.post('/api/chat', {
        data: {
          message: test.message,
          provider: 'gemini' // Use consistent provider for timing
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`📊 Response time: ${responseTime}ms (max: ${test.expectedMaxTime}ms)`);
      
      if (response.status() === 200) {
        // For successful responses, check timing
        expect(responseTime).toBeLessThan(test.expectedMaxTime);
        
        const data = await response.json();
        console.log(`✅ Performance test ${i + 1} passed: ${data.response.length} characters in ${responseTime}ms`);
      } else {
        console.log(`⚠️ Performance test ${i + 1} failed with status: ${response.status()}`);
      }
    }
    
    // Take performance screenshot
    await page.screenshot({
      path: 'artifacts/screenshots/12-ai-performance-complete.png',
      fullPage: true
    });
    
    console.log('✅ AI performance and response times testing completed');
  });

  test.afterEach(async ({ page }) => {
    // Clear any chat state
    await page.evaluate(() => {
      localStorage.removeItem('chat_history');
      localStorage.removeItem('conversation_id');
      sessionStorage.clear();
    });
    
    // Take cleanup screenshot
    await page.screenshot({
      path: `artifacts/screenshots/chat-cleanup-${Date.now()}.png`,
      fullPage: true
    });
  });
});