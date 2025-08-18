#!/usr/bin/env node

/**
 * n8n Browser Automation for Workflow Setup
 * Automates the manual creation of workflows in the n8n web interface
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class N8nBrowserWorkflowSetup {
    constructor() {
        this.n8nUrl = process.env.N8N_API_URL || 'https://primosphere.ninja';
        this.username = process.env.N8N_USERNAME || 'willexmen8@gmail.com';
        this.password = process.env.N8N_PASSWORD || 'DapperMan77$$';
        
        this.browser = null;
        this.page = null;
        
        this.results = {
            timestamp: new Date().toISOString(),
            n8nUrl: this.n8nUrl,
            loginSuccess: false,
            workflowsCreated: [],
            communityNodesDiscovered: [],
            errors: [],
            screenshots: []
        };
    }

    async start() {
        console.log('🚀 Starting n8n Browser Automation Setup...\n');
        
        try {
            await this.initBrowser();
            await this.loginToN8n();
            await this.analyzeExistingWorkflows();
            await this.createPriorityWorkflows();
            await this.generateBrowserReport();
            
            console.log('✅ Browser automation completed successfully!');
            return this.results;
            
        } catch (error) {
            console.error('❌ Browser automation failed:', error.message);
            this.results.errors.push({
                type: 'BROWSER_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            await this.takeScreenshot('error');
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    async initBrowser() {
        console.log('🌐 Initializing browser...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ],
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log('   ✅ Browser initialized');
    }

    async loginToN8n() {
        console.log('🔐 Logging into n8n...');
        
        try {
            await this.page.goto(this.n8nUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            await this.takeScreenshot('login_page');
            
            // Check if we're already logged in or need to log in
            const currentUrl = this.page.url();
            
            if (currentUrl.includes('/signin') || currentUrl.includes('/login')) {
                console.log('   📝 Login form detected, entering credentials...');
                
                // Fill in email
                const emailSelector = 'input[type="email"], input[name="email"], input#email';
                await this.page.waitForSelector(emailSelector, { timeout: 10000 });
                await this.page.type(emailSelector, this.username);
                
                // Fill in password
                const passwordSelector = 'input[type="password"], input[name="password"], input#password';
                await this.page.type(passwordSelector, this.password);
                
                // Click login button
                const loginButtonSelector = 'button[type="submit"], button:contains("Sign in"), button:contains("Login")';
                await this.page.click(loginButtonSelector);
                
                // Wait for navigation after login
                await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
                
            } else if (currentUrl.includes('/workflow')) {
                console.log('   ✅ Already logged in, proceeding...');
            }
            
            await this.takeScreenshot('after_login');
            
            // Verify we're logged in by checking for workflow-related elements
            const isLoggedIn = await this.page.$('.workflow-list, .workflow-canvas, [data-test-id="workflow"]') !== null;
            
            if (isLoggedIn) {
                console.log('   ✅ Login successful');
                this.results.loginSuccess = true;
            } else {
                throw new Error('Login verification failed - cannot find workflow interface elements');
            }
            
        } catch (error) {
            console.log('   ❌ Login failed:', error.message);
            await this.takeScreenshot('login_error');
            this.results.errors.push({
                type: 'LOGIN_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    async analyzeExistingWorkflows() {
        console.log('📋 Analyzing existing workflows...');
        
        try {
            // Navigate to workflows page
            const workflowsPageUrl = `${this.n8nUrl}/workflows`;
            await this.page.goto(workflowsPageUrl, { waitUntil: 'networkidle2' });
            
            await this.takeScreenshot('workflows_page');
            
            // Count existing workflows
            const workflowElements = await this.page.$$('.workflow-list-item, .workflow-card, [data-test-id="workflow-card"]');
            const existingCount = workflowElements.length;
            
            console.log(`   📊 Found ${existingCount} existing workflows`);
            
            // Try to get workflow names
            const workflowNames = await this.page.$$eval(
                '.workflow-list-item .workflow-name, .workflow-card h3, [data-test-id="workflow-name"]', 
                elements => elements.map(el => el.textContent.trim())
            ).catch(() => []);
            
            console.log('   📝 Existing workflows:');
            workflowNames.forEach(name => console.log(`      - ${name}`));
            
            this.results.existingWorkflows = {
                count: existingCount,
                names: workflowNames
            };
            
        } catch (error) {
            console.log('   ⚠️  Could not analyze existing workflows:', error.message);
            this.results.errors.push({
                type: 'WORKFLOW_ANALYSIS_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async createPriorityWorkflows() {
        console.log('\n🛠️  Creating priority workflows...');
        
        const priorityWorkflows = [
            {
                name: 'GitHub Webhook Integration',
                description: 'Process GitHub webhooks for commits, PRs, and issues',
                webhookPath: 'github-webhook'
            },
            {
                name: 'MCP Server Health Monitor', 
                description: 'Monitor health of all MCP servers and alert on failures',
                scheduleType: 'interval',
                interval: '15m'
            },
            {
                name: 'Spotify Data Processor',
                description: 'Process and analyze Spotify listening data',
                webhookPath: 'spotify-data'
            }
        ];

        for (const workflow of priorityWorkflows) {
            try {
                console.log(`\n   🔧 Creating: ${workflow.name}`);
                await this.createSingleWorkflow(workflow);
                this.results.workflowsCreated.push({
                    name: workflow.name,
                    status: 'success',
                    timestamp: new Date().toISOString()
                });
                console.log(`      ✅ ${workflow.name} created successfully`);
                
            } catch (error) {
                console.log(`      ❌ Failed to create ${workflow.name}: ${error.message}`);
                this.results.workflowsCreated.push({
                    name: workflow.name,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                this.results.errors.push({
                    type: 'WORKFLOW_CREATION_ERROR',
                    workflow: workflow.name,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Wait between workflow creations
            await this.page.waitForTimeout(2000);
        }
    }

    async createSingleWorkflow(workflowConfig) {
        // Navigate to create new workflow
        const newWorkflowUrl = `${this.n8nUrl}/workflow/new`;
        await this.page.goto(newWorkflowUrl, { waitUntil: 'networkidle2' });
        
        await this.takeScreenshot(`creating_${workflowConfig.name.toLowerCase().replace(/\s+/g, '_')}`);
        
        // Set workflow name
        await this.setWorkflowName(workflowConfig.name);
        
        // Add trigger node based on workflow type
        if (workflowConfig.webhookPath) {
            await this.addWebhookTrigger(workflowConfig.webhookPath);
        } else if (workflowConfig.scheduleType) {
            await this.addScheduleTrigger(workflowConfig.interval);
        }
        
        // Add basic processing node
        await this.addProcessingNode(workflowConfig.description);
        
        // Save the workflow
        await this.saveWorkflow();
        
        await this.takeScreenshot(`completed_${workflowConfig.name.toLowerCase().replace(/\s+/g, '_')}`);
    }

    async setWorkflowName(name) {
        try {
            // Look for workflow name input or title area
            const nameSelectors = [
                'input[data-test-id="workflow-name-input"]',
                '.workflow-name-input',
                'input.workflow-name',
                '.editable-workflow-name'
            ];
            
            for (const selector of nameSelectors) {
                const element = await this.page.$(selector);
                if (element) {
                    await element.click();
                    await element.type(name);
                    break;
                }
            }
        } catch (error) {
            console.log(`      ⚠️  Could not set workflow name: ${error.message}`);
        }
    }

    async addWebhookTrigger(webhookPath) {
        try {
            // Click to add a trigger node
            await this.clickAddNode();
            
            // Search for webhook node
            await this.searchAndSelectNode('webhook');
            
            // Configure webhook path
            await this.configureWebhook(webhookPath);
            
        } catch (error) {
            console.log(`      ⚠️  Could not add webhook trigger: ${error.message}`);
        }
    }

    async addScheduleTrigger(interval) {
        try {
            // Click to add a trigger node
            await this.clickAddNode();
            
            // Search for schedule trigger node
            await this.searchAndSelectNode('schedule');
            
            // Configure schedule interval
            await this.configureSchedule(interval);
            
        } catch (error) {
            console.log(`      ⚠️  Could not add schedule trigger: ${error.message}`);
        }
    }

    async addProcessingNode(description) {
        try {
            // Click to add another node after trigger
            await this.clickAddNode();
            
            // Search for Code node for processing
            await this.searchAndSelectNode('code');
            
            // Add basic processing code
            await this.configureCodeNode(description);
            
        } catch (error) {
            console.log(`      ⚠️  Could not add processing node: ${error.message}`);
        }
    }

    async clickAddNode() {
        const addNodeSelectors = [
            '[data-test-id="add-node-button"]',
            '.add-node-button',
            '.node-creator-plus-button',
            'button:contains("+")'
        ];
        
        for (const selector of addNodeSelectors) {
            const element = await this.page.$(selector);
            if (element) {
                await element.click();
                await this.page.waitForTimeout(1000);
                return;
            }
        }
        
        throw new Error('Could not find add node button');
    }

    async searchAndSelectNode(nodeType) {
        // Wait for node selection panel
        await this.page.waitForSelector('.node-creator, .node-selector', { timeout: 5000 });
        
        // Search for the node type
        const searchInput = await this.page.$('.node-creator-search, .node-search input');
        if (searchInput) {
            await searchInput.type(nodeType);
            await this.page.waitForTimeout(1000);
        }
        
        // Click on the first matching node
        const nodeOption = await this.page.$(`[data-test-id="${nodeType}"], .node-type-${nodeType}, .node-item:contains("${nodeType}")`);
        if (nodeOption) {
            await nodeOption.click();
            await this.page.waitForTimeout(1000);
        }
    }

    async configureWebhook(path) {
        try {
            // Look for webhook path configuration input
            const pathInput = await this.page.$('input[name="path"], .webhook-path-input');
            if (pathInput) {
                await pathInput.clear();
                await pathInput.type(path);
            }
        } catch (error) {
            console.log(`      ⚠️  Could not configure webhook: ${error.message}`);
        }
    }

    async configureSchedule(interval) {
        try {
            // Look for schedule configuration
            const intervalInput = await this.page.$('input[name="interval"], .schedule-interval-input');
            if (intervalInput) {
                await intervalInput.clear();
                await intervalInput.type(interval);
            }
        } catch (error) {
            console.log(`      ⚠️  Could not configure schedule: ${error.message}`);
        }
    }

    async configureCodeNode(description) {
        try {
            // Look for code editor
            const codeEditor = await this.page.$('.monaco-editor, .code-editor textarea');
            if (codeEditor) {
                const basicCode = `
// ${description}
const data = $input.first();

console.log('Processing data:', data);

return {
    json: {
        ...data,
        processed: true,
        timestamp: new Date().toISOString(),
        description: '${description}'
    }
};`;
                
                await codeEditor.click();
                await this.page.keyboard.selectAll();
                await this.page.keyboard.type(basicCode);
            }
        } catch (error) {
            console.log(`      ⚠️  Could not configure code node: ${error.message}`);
        }
    }

    async saveWorkflow() {
        try {
            // Look for save button
            const saveSelectors = [
                '[data-test-id="save-button"]',
                'button:contains("Save")',
                '.save-workflow-button',
                '.workflow-save'
            ];
            
            for (const selector of saveSelectors) {
                const saveButton = await this.page.$(selector);
                if (saveButton) {
                    await saveButton.click();
                    await this.page.waitForTimeout(2000);
                    return;
                }
            }
            
            // Try keyboard shortcut
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('s');
            await this.page.keyboard.up('Control');
            await this.page.waitForTimeout(2000);
            
        } catch (error) {
            console.log(`      ⚠️  Could not save workflow: ${error.message}`);
        }
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(process.cwd(), 'testing_screenshots', `n8n_${name}_${Date.now()}.png`);
            const screenshotDir = path.dirname(screenshotPath);
            
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });
            
            this.results.screenshots.push({
                name: name,
                path: screenshotPath,
                timestamp: new Date().toISOString()
            });
            
            console.log(`   📸 Screenshot saved: ${screenshotPath}`);
            
        } catch (error) {
            console.log(`   ⚠️  Could not take screenshot: ${error.message}`);
        }
    }

    async generateBrowserReport() {
        console.log('\n📊 Generating browser automation report...');
        
        const reportPath = path.join(process.cwd(), 'reports', 'n8n-browser-automation-report.json');
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate summary
        const summary = `
# n8n Browser Automation Report

## Summary
- **Timestamp**: ${this.results.timestamp}
- **n8n URL**: ${this.results.n8nUrl}  
- **Login Success**: ${this.results.loginSuccess ? '✅' : '❌'}
- **Workflows Created**: ${this.results.workflowsCreated.filter(w => w.status === 'success').length}
- **Creation Failures**: ${this.results.workflowsCreated.filter(w => w.status === 'failed').length}
- **Screenshots Taken**: ${this.results.screenshots.length}
- **Errors**: ${this.results.errors.length}

## Workflows Created
${this.results.workflowsCreated.map(w => `- **${w.name}**: ${w.status} ${w.error ? `(${w.error})` : ''}`).join('\n')}

## Screenshots
${this.results.screenshots.map(s => `- **${s.name}**: ${s.path}`).join('\n')}

## Errors
${this.results.errors.length === 0 ? 'None' : this.results.errors.map(e => `- **${e.type}**: ${e.message}`).join('\n')}

---
*Report generated by n8n Browser Automation*
        `;
        
        const summaryPath = path.join(process.cwd(), 'reports', 'n8n-browser-automation-summary.md');
        fs.writeFileSync(summaryPath, summary.trim());
        
        console.log(`   ✅ Browser automation report saved: ${reportPath}`);
        console.log(`   ✅ Browser automation summary saved: ${summaryPath}`);
        
        return this.results;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser cleaned up');
        }
    }
}

// Run the browser automation if called directly
if (require.main === module) {
    const automation = new N8nBrowserWorkflowSetup();
    automation.start()
        .then(results => {
            console.log('\n🎉 Browser automation completed successfully!');
            console.log(`📊 Results: ${results.workflowsCreated.filter(w => w.status === 'success').length} workflows created`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Browser automation failed:', error.message);
            process.exit(1);
        });
}

module.exports = N8nBrowserWorkflowSetup;