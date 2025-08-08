#!/usr/bin/env node

/**
 * @fileoverview Run all MCP candidate implementations
 * Orchestrates the execution of all implemented MCP candidates
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class MCPCandidatesRunner {
    constructor() {
        this.rootDir = process.cwd();
        this.candidatesDir = path.join(this.rootDir, 'mcp-servers', 'new-candidates');
        this.runningServers = [];
    }

    async run() {
        console.log('🚀 Starting all MCP candidate implementations...\n');
        
        try {
            const candidates = await this.discoverCandidates();
            
            if (candidates.length === 0) {
                console.log('ℹ️ No implemented candidates found. Run the implementation script first.');
                return;
            }
            
            console.log(`📋 Found ${candidates.length} implemented candidates:\n`);
            
            for (const candidate of candidates) {
                await this.startCandidate(candidate);
            }
            
            this.setupGracefulShutdown();
            
            console.log('\n🎉 All MCP candidates are running');
            console.log('Press Ctrl+C to stop all servers');
            
            // Keep the process alive
            await this.keepAlive();
            
        } catch (error) {
            console.error('❌ Failed to run candidates:', error.message);
            process.exit(1);
        }
    }

    async discoverCandidates() {
        const candidates = [];
        
        try {
            const candidateDirs = await fs.readdir(this.candidatesDir);
            
            for (const dir of candidateDirs) {
                const candidateDir = path.join(this.candidatesDir, dir);
                const stat = await fs.stat(candidateDir);
                
                if (stat.isDirectory()) {
                    const configPath = path.join(candidateDir, 'config.json');
                    const integrationPath = path.join(candidateDir, 'integration.js');
                    
                    try {
                        await fs.access(configPath);
                        await fs.access(integrationPath);
                        
                        const configContent = await fs.readFile(configPath, 'utf8');
                        const config = JSON.parse(configContent);
                        
                        candidates.push({
                            name: dir,
                            path: candidateDir,
                            config: config,
                            integrationScript: integrationPath
                        });
                        
                    } catch (error) {
                        console.log(`   ⚠️ Skipping ${dir}: missing required files`);
                    }
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('ℹ️ Candidates directory not found. Run implementation script first.');
                return [];
            }
            throw error;
        }
        
        return candidates;
    }

    async startCandidate(candidate) {
        console.log(`🔧 Starting ${candidate.name}...`);
        console.log(`   Priority: ${candidate.config.priority}`);
        console.log(`   Description: ${candidate.config.description}`);
        
        try {
            const process = spawn('node', [candidate.integrationScript], {
                cwd: candidate.path,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, NODE_ENV: 'development' }
            });
            
            this.runningServers.push({
                name: candidate.name,
                process: process,
                pid: process.pid
            });
            
            // Handle output
            process.stdout.on('data', (data) => {
                console.log(`   [${candidate.name}] ${data.toString().trim()}`);
            });
            
            process.stderr.on('data', (data) => {
                console.error(`   [${candidate.name}] ERROR: ${data.toString().trim()}`);
            });
            
            process.on('close', (code) => {
                console.log(`   [${candidate.name}] Process exited with code ${code}`);
                this.runningServers = this.runningServers.filter(s => s.name !== candidate.name);
            });
            
            // Give it a moment to start
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log(`   ✅ ${candidate.name} started (PID: ${process.pid})`);
            
        } catch (error) {
            console.error(`   ❌ Failed to start ${candidate.name}:`, error.message);
        }
    }

    setupGracefulShutdown() {
        const shutdown = () => {
            console.log('\n🛑 Shutting down all MCP candidates...');
            
            for (const server of this.runningServers) {
                console.log(`   Stopping ${server.name} (PID: ${server.pid})`);
                try {
                    server.process.kill('SIGTERM');
                } catch (error) {
                    console.error(`   Error stopping ${server.name}:`, error.message);
                }
            }
            
            setTimeout(() => {
                console.log('✅ All candidates stopped');
                process.exit(0);
            }, 2000);
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }

    async keepAlive() {
        return new Promise(() => {
            // Keep process alive until manual termination
        });
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new MCPCandidatesRunner();
    runner.run().catch(console.error);
}

module.exports = MCPCandidatesRunner;