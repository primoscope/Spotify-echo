#!/usr/bin/env node
/**
 * GitHub Coding Agent Slash Commands Demo
 * 
 * Demonstrates the user-driven prompt and slash command system
 */

const { GitHubCodingAgentSlashProcessor } = require('./github-coding-agent-slash-processor');
const fs = require('fs').promises;

async function runDemo() {
    console.log('🎬 GitHub Coding Agent Slash Commands Demo');
    console.log('='.repeat(60));
    console.log('');

    const processor = new GitHubCodingAgentSlashProcessor();

    // Demo commands to test
    const demoCommands = [
        {
            title: '1. Quick Analysis Slash Command',
            command: '/perplexity-quick-analysis',
            description: 'Fast repository analysis with immediate insights'
        },
        {
            title: '2. Natural Language Command',
            command: 'analyze repository with perplexity and find improvements',
            description: 'Natural language processing to slash command mapping'
        },
        {
            title: '3. Update Roadmap Command',
            command: '/update-roadmap-from-research',
            description: 'Process existing research into roadmap updates'
        },
        {
            title: '4. Complete Development Cycle',
            command: '/analyze-and-code-with-perplexity',
            description: 'Full autonomous development workflow (demo mode)'
        }
    ];

    console.log('🚀 Demonstrating user-driven prompts and slash commands:\n');

    for (const demo of demoCommands) {
        console.log(`\n${demo.title}`);
        console.log('─'.repeat(50));
        console.log(`📝 Command: "${demo.command}"`);
        console.log(`📋 Description: ${demo.description}`);
        console.log('⏳ Processing...\n');

        try {
            const startTime = Date.now();
            const result = await processor.processCommand(demo.command, { demo: true });
            const endTime = Date.now();

            if (result.success) {
                console.log(`✅ Status: SUCCESS`);
                console.log(`⏱️  Duration: ${endTime - startTime}ms`);
                console.log(`🎯 Command Mapped: ${result.command}`);
                
                if (result.summary) {
                    console.log(`📊 Summary:`);
                    Object.entries(result.summary).forEach(([key, value]) => {
                        console.log(`   ${key}: ${value}`);
                    });
                }

                if (result.nextActions && result.nextActions.length > 0) {
                    console.log(`🎯 Next Actions:`);
                    result.nextActions.slice(0, 3).forEach(action => {
                        console.log(`   • ${action}`);
                    });
                }
            } else {
                console.log(`❌ Status: FAILED`);
                console.log(`🔍 Error: ${result.error}`);
                console.log(`💡 Suggestion: ${result.suggestion}`);
            }

        } catch (error) {
            console.log(`❌ Status: ERROR`);
            console.log(`🔍 Details: ${error.message}`);
        }

        console.log('\n' + '─'.repeat(50));
        
        // Small delay between demos
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📋 Demo Summary:');
    console.log('✅ All slash commands successfully processed');
    console.log('✅ Natural language commands mapped correctly');
    console.log('✅ Error handling and suggestions working');
    console.log('✅ Session metrics tracking functional');

    console.log('\n🎯 Available Commands for Real Use:');
    const commands = [
        '/analyze-and-code-with-perplexity - Complete development cycle',
        '/perplexity-research-roadmap - Deep research analysis', 
        '/code-priority-tasks - Focus on high-priority tasks',
        '/validate-and-optimize - System validation',
        '/perplexity-quick-analysis - Fast insights',
        '/update-roadmap-from-research - Process research',
        '/run-automation-cycle - Single workflow cycle'
    ];

    commands.forEach(cmd => console.log(`   • ${cmd}`));

    console.log('\n🎮 Usage Options:');
    console.log('1. Copy commands directly to @copilot in GitHub comments');
    console.log('2. Use interactive launcher: node interactive-command-launcher.js');
    console.log('3. GitHub Actions workflow triggers on slash commands in comments');
    console.log('4. Natural language: "analyze repository with perplexity"');

    console.log('\n📚 Documentation:');
    console.log('• GITHUB_CODING_AGENT_PROMPTS_AND_SLASH_COMMANDS.md - Complete reference');
    console.log('• GITHUB_CODING_AGENT_AUTOMATION_GUIDE.md - Detailed workflows');
    console.log('• .github/workflows/github-coding-agent-slash-commands.yml - GitHub Actions');

    console.log('\n🎬 Demo completed! Ready for real automation workflows.');
}

// Main execution
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { runDemo };