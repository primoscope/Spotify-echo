#!/usr/bin/env node

/**
 * Stagehand Integration with Browserbase
 * Implementation example for browser automation using Browserbase API
 */

const BROWSERBASE_API_KEY = 'bb_live_P4BWp-i1Atz_NMBWXr521kxcrXw';
const BROWSERBASE_PROJECT_ID = 'df31bafd-8541-40f2-80a8-2f6ea30df60e';

class StagehendBrowserbaseIntegration {
    constructor() {
        this.apiKey = BROWSERBASE_API_KEY;
        this.projectId = BROWSERBASE_PROJECT_ID;
        this.sessionId = null;
        this.debugUrl = null;
    }

    async createSession() {
        try {
            console.log('🚀 Creating Browserbase session...');
            
            const response = await fetch('https://api.browserbase.com/v1/sessions', {
                method: 'POST',
                headers: {
                    'x-bb-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    projectId: this.projectId,
                    browserSettings: {
                        fingerprint: {
                            browser: 'chrome',
                            os: 'linux',
                            screen: {
                                width: 1280,
                                height: 800
                            }
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Session creation failed: ${response.status} - ${errorText}`);
            }

            const sessionData = await response.json();
            this.sessionId = sessionData.id;
            this.debugUrl = sessionData.debuggerFullscreenUrl;
            
            console.log(`✅ Session created: ${this.sessionId}`);
            console.log(`🔍 Debug URL: ${this.debugUrl}`);
            
            return sessionData;
        } catch (error) {
            console.error('❌ Session creation failed:', error.message);
            throw error;
        }
    }

    async navigateToSpotify() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }

        try {
            console.log('🎵 Navigating to Spotify Web Player...');
            
            const response = await fetch(`https://api.browserbase.com/v1/sessions/${this.sessionId}/actions`, {
                method: 'POST',
                headers: {
                    'x-bb-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'goto',
                    url: 'https://open.spotify.com'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Navigation failed: ${response.status} - ${errorText}`);
            }

            console.log('✅ Successfully navigated to Spotify');
            return await response.json();
        } catch (error) {
            console.error('❌ Navigation failed:', error.message);
            throw error;
        }
    }

    async takeScreenshot() {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }

        try {
            console.log('📸 Taking screenshot...');
            
            const response = await fetch(`https://api.browserbase.com/v1/sessions/${this.sessionId}/screenshot`, {
                method: 'POST',
                headers: {
                    'x-bb-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Screenshot failed: ${response.status} - ${errorText}`);
            }

            const screenshotData = await response.json();
            console.log('✅ Screenshot taken successfully');
            console.log(`🖼️ Screenshot URL: ${screenshotData.url}`);
            
            return screenshotData;
        } catch (error) {
            console.error('❌ Screenshot failed:', error.message);
            throw error;
        }
    }

    async executeScript(script) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }

        try {
            console.log('⚡ Executing JavaScript...');
            
            const response = await fetch(`https://api.browserbase.com/v1/sessions/${this.sessionId}/actions`, {
                method: 'POST',
                headers: {
                    'x-bb-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'evaluate',
                    expression: script
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Script execution failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Script executed successfully');
            return result;
        } catch (error) {
            console.error('❌ Script execution failed:', error.message);
            throw error;
        }
    }

    async clickElement(selector) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }

        try {
            console.log(`🖱️ Clicking element: ${selector}`);
            
            const response = await fetch(`https://api.browserbase.com/v1/sessions/${this.sessionId}/actions`, {
                method: 'POST',
                headers: {
                    'x-bb-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'click',
                    selector: selector
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Click failed: ${response.status} - ${errorText}`);
            }

            console.log('✅ Element clicked successfully');
            return await response.json();
        } catch (error) {
            console.error('❌ Click failed:', error.message);
            throw error;
        }
    }

    async typeText(selector, text) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }

        try {
            console.log(`⌨️ Typing text into: ${selector}`);
            
            const response = await fetch(`https://api.browserbase.com/v1/sessions/${this.sessionId}/actions`, {
                method: 'POST',
                headers: {
                    'x-bb-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'type',
                    selector: selector,
                    text: text
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Type failed: ${response.status} - ${errorText}`);
            }

            console.log('✅ Text typed successfully');
            return await response.json();
        } catch (error) {
            console.error('❌ Type failed:', error.message);
            throw error;
        }
    }

    async closeSession() {
        if (!this.sessionId) {
            console.log('⚠️ No active session to close');
            return;
        }

        try {
            console.log('🛑 Closing session...');
            
            const response = await fetch(`https://api.browserbase.com/v1/sessions/${this.sessionId}`, {
                method: 'DELETE',
                headers: {
                    'x-bb-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Session close warning: ${response.status} - ${errorText}`);
            } else {
                console.log('✅ Session closed successfully');
            }

            this.sessionId = null;
            this.debugUrl = null;
        } catch (error) {
            console.error('❌ Session close failed:', error.message);
        }
    }

    async runSpotifyAutomationDemo() {
        try {
            console.log('🎭 Starting Spotify automation demo...\n');
            
            // Create session
            await this.createSession();
            
            // Navigate to Spotify
            await this.navigateToSpotify();
            
            // Wait for page load
            console.log('⏳ Waiting for page to load...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take initial screenshot
            await this.takeScreenshot();
            
            // Get page title
            const titleResult = await this.executeScript('document.title');
            console.log(`📄 Page title: ${titleResult.result}`);
            
            // Check if login button exists
            const loginCheck = await this.executeScript(`
                document.querySelector('[data-testid="login-button"]') ? 'Login button found' : 'No login button'
            `);
            console.log(`🔍 Login status: ${loginCheck.result}`);
            
            console.log('\n🎯 Demo completed successfully!');
            console.log(`🔗 You can view the session at: ${this.debugUrl}`);
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        } finally {
            // Always clean up
            await this.closeSession();
        }
    }

    // Stagehand-style API wrapper
    async stagehand(actions) {
        try {
            await this.createSession();
            
            for (const action of actions) {
                switch (action.type) {
                    case 'goto':
                        await this.navigateToSpotify();
                        break;
                    case 'click':
                        await this.clickElement(action.selector);
                        break;
                    case 'type':
                        await this.typeText(action.selector, action.text);
                        break;
                    case 'screenshot':
                        await this.takeScreenshot();
                        break;
                    case 'wait':
                        await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
                        break;
                    case 'script':
                        await this.executeScript(action.code);
                        break;
                    default:
                        console.warn(`⚠️ Unknown action type: ${action.type}`);
                }
            }
        } finally {
            await this.closeSession();
        }
    }
}

// Example usage and testing
async function testStagehandIntegration() {
    const stagehand = new StagehendBrowserbaseIntegration();
    
    try {
        console.log('🧪 Testing Stagehand Integration with Browserbase...\n');
        
        // Run the Spotify demo
        await stagehand.runSpotifyAutomationDemo();
        
        console.log('\n✅ All tests passed!');
        
        // Example of Stagehand-style API usage
        console.log('\n🎭 Example Stagehand-style API usage:');
        console.log(`
const actions = [
    { type: 'goto', url: 'https://open.spotify.com' },
    { type: 'wait', duration: 2000 },
    { type: 'screenshot' },
    { type: 'script', code: 'document.title' }
];

await stagehand.stagehand(actions);
        `);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Check for free plan limitations
        if (error.message.includes('quota') || error.message.includes('limit')) {
            console.log('\n📝 Note: This appears to be a free plan limitation.');
            console.log('   - Free plan: 1 browser concurrency');
            console.log('   - Consider upgrading if you need more concurrent browsers');
        }
    }
}

// Export for use in other files
module.exports = { StagehendBrowserbaseIntegration };

// Run if called directly
if (require.main === module) {
    testStagehandIntegration();
}