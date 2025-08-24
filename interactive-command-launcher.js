#!/usr/bin/env node
/**
 * Interactive GitHub Coding Agent Command Launcher
 * 
 * Easy-to-use interface for launching slash commands and automation workflows
 * Perfect for testing and demonstrating the command system
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class InteractiveCommandLauncher {
    constructor() {
        this.commands = {
            '1': {
                name: '/analyze-and-code-with-perplexity',
                description: 'Complete autonomous development cycle with Perplexity research',
                duration: '45-60 minutes',
                icon: '🎯',
                workflow: 'Coding → Research → Roadmap Update → Commit'
            },
            '2': {
                name: '/perplexity-research-roadmap',
                description: 'Deep research analysis using Perplexity sonar-pro model',
                duration: '15-20 minutes',
                icon: '🔬',
                workflow: 'Repository analysis → Task generation → Roadmap updates'
            },
            '3': {
                name: '/code-priority-tasks',
                description: 'Focus on high-priority task completion from roadmap',
                duration: '30-45 minutes',
                icon: '💻',
                workflow: 'Task identification → Implementation → Testing → Documentation'
            },
            '4': {
                name: '/validate-and-optimize',
                description: 'Comprehensive system validation and performance optimization',
                duration: '20-30 minutes',
                icon: '✅',
                workflow: 'Testing → Analysis → Optimization → Reporting'
            },
            '5': {
                name: '/perplexity-quick-analysis',
                description: 'Fast repository analysis with immediate insights',
                duration: '3-5 minutes',
                icon: '⚡',
                workflow: 'Quick analysis → Recommendations'
            },
            '6': {
                name: '/update-roadmap-from-research',
                description: 'Process latest Perplexity research into roadmap updates',
                duration: '5-10 minutes',
                icon: '📈',
                workflow: 'Research processing → Roadmap update → Commit'
            },
            '7': {
                name: '/run-automation-cycle',
                description: 'Execute one complete automation workflow cycle',
                duration: '10-15 minutes',
                icon: '🔄',
                workflow: 'Task progression → Reporting → Commit'
            },
            '8': {
                name: 'custom',
                description: 'Enter custom natural language command',
                duration: 'Variable',
                icon: '💭',
                workflow: 'Natural language processing → Command execution'
            }
        };

        this.templates = {
            'dev-session': 'I need you to run a complete autonomous development session. Start by analyzing the current roadmap, complete 3-5 high-priority tasks with real implementation, then use Perplexity API to research improvements and update the roadmap.',
            'research-focus': 'Use Perplexity API with sonar-pro model to research the current repository, analyze technology stack, identify improvement opportunities, and generate new tasks for the roadmap.',
            'coding-focus': 'Focus on completing high-priority tasks from the roadmap. Look for [P0] and [P1] items, implement them following existing code patterns, then update task statuses.',
            'optimization': 'Run comprehensive validation and optimization. Check system performance, security, run tests, and implement improvements.',
            'music-enhancement': 'Analyze the Spotify integration and music recommendation system. Identify improvement areas and implement enhancements with real API testing.',
            'mcp-optimization': 'Review MCP server implementation and automation workflows. Optimize orchestration system and enhance automation reporting.'
        };

        this.rl = null;
        this.sessionStats = {
            commandsRun: 0,
            startTime: Date.now(),
            lastCommand: null
        };
    }

    start() {
        console.clear();
        this.displayHeader();
        this.displayMainMenu();
        this.startInteractiveSession();
    }

    displayHeader() {
        console.log('\n' + '='.repeat(80));
        console.log('🤖 GitHub Coding Agent Interactive Command Launcher');
        console.log('='.repeat(80));
        console.log('');
        console.log('🚀 Launch autonomous development workflows with simple commands');
        console.log('⚡ Real Perplexity API integration for research and analysis');
        console.log('🎯 Automated coding, testing, and roadmap management');
        console.log('');
        console.log('Environment Status:');
        console.log(`✅ Perplexity API: ${process.env.PERPLEXITY_API_KEY ? 'Configured' : '❌ Missing'}`);
        console.log(`✅ Repository: ${fs.existsSync('package.json') ? 'Detected' : '❌ Not found'}`);
        console.log(`✅ Roadmap: ${fs.existsSync('AUTONOMOUS_DEVELOPMENT_ROADMAP.md') ? 'Found' : '📝 Will be created'}`);
        console.log('');
    }

    displayMainMenu() {
        console.log('📋 Available Commands:');
        console.log('');
        
        Object.entries(this.commands).forEach(([key, cmd]) => {
            console.log(`${key}. ${cmd.icon} ${cmd.name}`);
            console.log(`   Description: ${cmd.description}`);
            console.log(`   Duration: ${cmd.duration}`);
            console.log(`   Workflow: ${cmd.workflow}`);
            console.log('');
        });

        console.log('⚙️  Quick Actions:');
        console.log('s. Show session statistics');
        console.log('h. Display help and examples');
        console.log('t. Show command templates');
        console.log('q. Quit launcher');
        console.log('');
    }

    startInteractiveSession() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.promptUser();
    }

    promptUser() {
        this.rl.question('🎯 Select command (1-8) or action (s/h/t/q): ', (input) => {
            this.handleUserInput(input.trim());
        });
    }

    async handleUserInput(input) {
        try {
            switch (input.toLowerCase()) {
                case 'q':
                case 'quit':
                case 'exit':
                    this.displaySessionSummary();
                    this.rl.close();
                    process.exit(0);
                    break;

                case 's':
                case 'stats':
                    this.displaySessionStats();
                    this.promptUser();
                    break;

                case 'h':
                case 'help':
                    this.displayHelp();
                    this.promptUser();
                    break;

                case 't':
                case 'templates':
                    this.displayTemplates();
                    this.promptUser();
                    break;

                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                    await this.executeSlashCommand(this.commands[input].name);
                    this.promptUser();
                    break;

                case '8':
                    this.promptCustomCommand();
                    break;

                default:
                    if (input.startsWith('/')) {
                        await this.executeSlashCommand(input);
                        this.promptUser();
                    } else if (input.length > 10) {
                        await this.executeNaturalLanguageCommand(input);
                        this.promptUser();
                    } else {
                        console.log('❌ Invalid input. Please select 1-8 or use s/h/t/q');
                        this.promptUser();
                    }
            }
        } catch (error) {
            console.error('❌ Error handling input:', error.message);
            this.promptUser();
        }
    }

    promptCustomCommand() {
        console.log('\n💭 Custom Command Options:');
        console.log('1. Enter slash command (e.g., /perplexity-quick-analysis)');
        console.log('2. Enter natural language command');
        console.log('3. Select from templates (type "template")');
        console.log('');

        this.rl.question('💬 Enter your command: ', async (input) => {
            if (input.toLowerCase() === 'template') {
                this.selectTemplate();
            } else if (input.trim()) {
                if (input.startsWith('/')) {
                    await this.executeSlashCommand(input.trim());
                } else {
                    await this.executeNaturalLanguageCommand(input.trim());
                }
                this.promptUser();
            } else {
                console.log('❌ No command entered');
                this.promptUser();
            }
        });
    }

    selectTemplate() {
        console.log('\n📝 Command Templates:');
        console.log('');

        Object.entries(this.templates).forEach(([key, description]) => {
            console.log(`• ${key}: ${description.substring(0, 80)}...`);
        });

        console.log('');
        this.rl.question('Select template key or press Enter to cancel: ', async (input) => {
            if (input.trim() && this.templates[input.trim()]) {
                console.log(`\n📋 Using template: ${input}`);
                console.log(`Command: ${this.templates[input.trim()]}`);
                console.log('');
                await this.executeNaturalLanguageCommand(this.templates[input.trim()]);
            } else if (input.trim()) {
                console.log('❌ Template not found');
            }
            this.promptUser();
        });
    }

    async executeSlashCommand(command) {
        console.log(`\n🚀 Executing: ${command}`);
        console.log('⏳ Starting command processor...\n');

        const startTime = Date.now();
        
        try {
            // Execute the slash command processor
            const result = execSync(`node github-coding-agent-slash-processor.js "${command}"`, {
                encoding: 'utf8',
                timeout: 300000, // 5 minutes
                stdio: ['pipe', 'pipe', 'pipe']
            });

            const executionTime = Date.now() - startTime;
            this.sessionStats.commandsRun++;
            this.sessionStats.lastCommand = command;

            console.log('✅ Command completed successfully!');
            console.log(`⏱️ Execution time: ${executionTime}ms`);
            
            // Try to parse and display result summary
            try {
                const resultObj = JSON.parse(result);
                if (resultObj.summary) {
                    console.log('\n📊 Summary:');
                    Object.entries(resultObj.summary).forEach(([key, value]) => {
                        console.log(`   ${key}: ${value}`);
                    });
                }
                if (resultObj.nextActions && resultObj.nextActions.length > 0) {
                    console.log('\n🎯 Next Actions:');
                    resultObj.nextActions.forEach(action => {
                        console.log(`   • ${action}`);
                    });
                }
            } catch (parseError) {
                console.log('\n📄 Raw output:');
                console.log(result);
            }

        } catch (error) {
            console.error('❌ Command failed:', error.message);
            if (error.stdout) {
                console.log('\n📄 Output:', error.stdout);
            }
            if (error.stderr) {
                console.error('\n🔍 Error details:', error.stderr);
            }
        }

        console.log('\n' + '-'.repeat(60));
    }

    async executeNaturalLanguageCommand(command) {
        console.log(`\n💬 Processing natural language: "${command}"`);
        console.log('🧠 Analyzing intent and mapping to appropriate workflow...\n');

        await this.executeSlashCommand(command);
    }

    displaySessionStats() {
        const sessionDuration = Math.round((Date.now() - this.sessionStats.startTime) / 1000);
        
        console.log('\n📊 Session Statistics:');
        console.log(`   Commands run: ${this.sessionStats.commandsRun}`);
        console.log(`   Session duration: ${sessionDuration}s`);
        console.log(`   Last command: ${this.sessionStats.lastCommand || 'None'}`);
        console.log(`   Average per command: ${this.sessionStats.commandsRun > 0 ? Math.round(sessionDuration / this.sessionStats.commandsRun) : 0}s`);
        
        // Check for generated files
        const analysisFiles = this.findFiles('perplexity-*-analysis-*.md');
        const reportFiles = this.findFiles('*report*.md');
        
        console.log('\n📁 Generated Files:');
        console.log(`   Analysis files: ${analysisFiles.length}`);
        console.log(`   Report files: ${reportFiles.length}`);
        
        if (analysisFiles.length > 0) {
            console.log('   Latest analysis:', analysisFiles[analysisFiles.length - 1]);
        }
        console.log('');
    }

    displayHelp() {
        console.log('\n📚 Help & Examples:');
        console.log('');
        console.log('🎯 Slash Commands (exact syntax):');
        console.log('   /analyze-and-code-with-perplexity');
        console.log('   /perplexity-research-roadmap');
        console.log('   /code-priority-tasks');
        console.log('   /validate-and-optimize');
        console.log('   /perplexity-quick-analysis');
        console.log('');
        console.log('💬 Natural Language Examples:');
        console.log('   "analyze repository with perplexity and find improvements"');
        console.log('   "complete high priority tasks from roadmap"');
        console.log('   "run comprehensive validation and optimization"');
        console.log('   "research new features and update roadmap"');
        console.log('');
        console.log('⚙️ Environment Setup:');
        console.log('   • Ensure PERPLEXITY_API_KEY is set in environment');
        console.log('   • Run from project root directory');
        console.log('   • All dependencies should be installed (npm ci)');
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   • If command fails, check the error details');
        console.log('   • Try simpler commands first (e.g., option 5)');
        console.log('   • Verify API keys and network connectivity');
        console.log('');
    }

    displayTemplates() {
        console.log('\n📝 Command Templates:');
        console.log('');
        
        Object.entries(this.templates).forEach(([key, command]) => {
            console.log(`🔹 ${key}:`);
            console.log(`   ${command}`);
            console.log('');
        });
        
        console.log('💡 Usage: Select option 8, then type "template" to use these');
        console.log('');
    }

    displaySessionSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 Session Summary');
        console.log('='.repeat(60));
        
        const sessionDuration = Math.round((Date.now() - this.sessionStats.startTime) / 1000);
        
        console.log(`🕐 Session Duration: ${sessionDuration}s`);
        console.log(`🎯 Commands Executed: ${this.sessionStats.commandsRun}`);
        console.log(`⚡ Last Command: ${this.sessionStats.lastCommand || 'None'}`);
        
        // Check for generated files
        const analysisFiles = this.findFiles('perplexity-*-analysis-*.md');
        const reportFiles = this.findFiles('*report*.md');
        
        console.log(`📁 Files Generated: ${analysisFiles.length + reportFiles.length}`);
        
        if (analysisFiles.length > 0 || reportFiles.length > 0) {
            console.log('\n📄 Generated Files:');
            [...analysisFiles, ...reportFiles].forEach(file => {
                console.log(`   • ${file}`);
            });
        }
        
        console.log('\n👋 Thank you for using GitHub Coding Agent Launcher!');
        console.log('');
    }

    findFiles(pattern) {
        try {
            const { execSync } = require('child_process');
            const result = execSync(`ls ${pattern} 2>/dev/null || echo ""`, { encoding: 'utf8' });
            return result.trim() ? result.trim().split('\n') : [];
        } catch (error) {
            return [];
        }
    }
}

// Main execution
function main() {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
        console.error('❌ Please run this from the project root directory (where package.json is located)');
        process.exit(1);
    }

    // Check for required processor file
    if (!fs.existsSync('github-coding-agent-slash-processor.js')) {
        console.error('❌ github-coding-agent-slash-processor.js not found. Please ensure all files are in place.');
        process.exit(1);
    }

    const launcher = new InteractiveCommandLauncher();
    launcher.start();
}

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n\n👋 Goodbye!');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Session terminated!');
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = { InteractiveCommandLauncher };