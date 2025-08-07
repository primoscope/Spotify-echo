#!/usr/bin/env node

/**
 * DigitalOcean Manager - Enhanced doctl integration
 * Implements advanced DigitalOcean functionality using doctl CLI
 * 
 * Usage: 
 *   npm run do:status         - Get account status
 *   npm run do:apps           - List apps  
 *   npm run do:droplets       - List droplets
 *   npm run do:deploy         - Deploy to App Platform
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DigitalOceanManager {
    constructor() {
        this.credentials = {
            token: 'dop_v1_09dc79ed930e1cc77ffe866d78a3c5eae14ab6f8fa47389beef94e19cb049eae',
            dockerEmail: 'barrunmail@gmail.com',
            dockerToken: 'dop_v1_be1d6c7989e8f51fefbae284c017fa7eaeea5d230e59d7c399b220d4677652c7'
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async authenticate() {
        try {
            this.log('🔐 Authenticating with DigitalOcean...', 'info');
            execSync(`doctl auth init --access-token ${this.credentials.token}`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            const account = execSync('doctl account get', { encoding: 'utf8' });
            this.log('✅ Authentication successful', 'success');
            return account.trim();
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    async getAccountStatus() {
        try {
            await this.authenticate();
            
            const account = execSync('doctl account get', { encoding: 'utf8' });
            const balance = execSync('doctl account get --format Balance,MonthToDateUsage', { encoding: 'utf8' });
            
            this.log('📊 Account Status:', 'info');
            console.log(account);
            console.log('\n💰 Billing Info:');
            console.log(balance);
            
            return { account, balance };
        } catch (error) {
            this.log(`❌ Failed to get account status: ${error.message}`, 'error');
            throw error;
        }
    }

    async listApps() {
        try {
            await this.authenticate();
            
            const apps = execSync('doctl apps list', { encoding: 'utf8' });
            
            this.log('🚀 App Platform Applications:', 'info');
            console.log(apps);
            
            return apps;
        } catch (error) {
            this.log(`❌ Failed to list apps: ${error.message}`, 'error');
            throw error;
        }
    }

    async listDroplets() {
        try {
            await this.authenticate();
            
            const droplets = execSync('doctl compute droplet list', { encoding: 'utf8' });
            
            this.log('💧 Droplets:', 'info');
            console.log(droplets);
            
            return droplets;
        } catch (error) {
            this.log(`❌ Failed to list droplets: ${error.message}`, 'error');
            throw error;
        }
    }

    async listRegistries() {
        try {
            await this.authenticate();
            
            const registries = execSync('doctl registry list', { encoding: 'utf8' });
            
            this.log('📦 Container Registries:', 'info');
            console.log(registries);
            
            return registries;
        } catch (error) {
            this.log(`❌ Failed to list registries: ${error.message}`, 'error');
            throw error;
        }
    }

    async listKubernetesClusters() {
        try {
            await this.authenticate();
            
            const clusters = execSync('doctl kubernetes cluster list', { encoding: 'utf8' });
            
            this.log('☸️ Kubernetes Clusters:', 'info');
            console.log(clusters);
            
            return clusters;
        } catch (error) {
            this.log(`❌ Failed to list k8s clusters: ${error.message}`, 'error');
            throw error;
        }
    }

    async dockerLogin() {
        try {
            await this.authenticate();
            
            this.log('🐳 Logging into DigitalOcean Container Registry...', 'info');
            
            execSync(`echo "${this.credentials.dockerToken}" | docker login registry.digitalocean.com --username "${this.credentials.dockerEmail}" --password-stdin`, {
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            this.log('✅ Docker login successful', 'success');
            return true;
        } catch (error) {
            this.log(`❌ Docker login failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async createAppPlatformSpec() {
        const appSpec = {
            name: 'echotune-ai',
            services: [
                {
                    name: 'web',
                    source_dir: '/',
                    github: {
                        repo: 'dzp5103/Spotify-echo',
                        branch: 'main'
                    },
                    run_command: 'npm start',
                    environment_slug: 'node-js',
                    instance_count: 1,
                    instance_size_slug: 'basic-xxs',
                    routes: [
                        {
                            path: '/'
                        }
                    ],
                    envs: [
                        {
                            key: 'NODE_ENV',
                            value: 'production'
                        },
                        {
                            key: 'PORT',
                            value: '8080'
                        }
                    ]
                }
            ]
        };

        const specPath = path.join(__dirname, '..', 'app-platform-spec.yaml');
        const yamlSpec = `name: echotune-ai
services:
- name: web
  source_dir: /
  github:
    repo: dzp5103/Spotify-echo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: "/"
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "8080"
`;

        fs.writeFileSync(specPath, yamlSpec);
        this.log(`📋 App Platform spec created: ${specPath}`, 'success');
        
        return specPath;
    }

    async deployToAppPlatform() {
        try {
            await this.authenticate();
            
            const specPath = await this.createAppPlatformSpec();
            
            this.log('🚀 Deploying to DigitalOcean App Platform...', 'info');
            
            const deployment = execSync(`doctl apps create --spec ${specPath}`, { 
                encoding: 'utf8',
                timeout: 60000
            });
            
            this.log('✅ Deployment initiated', 'success');
            console.log(deployment);
            
            return deployment;
        } catch (error) {
            this.log(`❌ Deployment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateComprehensiveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            account: null,
            resources: {
                apps: null,
                droplets: null,
                registries: null,
                clusters: null
            },
            authentication: null,
            docker: null
        };

        try {
            // Test authentication
            report.account = await this.getAccountStatus();
            report.authentication = { status: 'success', authenticated: true };

            // Test Docker login
            await this.dockerLogin();
            report.docker = { status: 'success', authenticated: true };

            // Get all resources
            try {
                report.resources.apps = await this.listApps();
            } catch (error) {
                report.resources.apps = { error: error.message };
            }

            try {
                report.resources.droplets = await this.listDroplets();
            } catch (error) {
                report.resources.droplets = { error: error.message };
            }

            try {
                report.resources.registries = await this.listRegistries();
            } catch (error) {
                report.resources.registries = { error: error.message };
            }

            try {
                report.resources.clusters = await this.listKubernetesClusters();
            } catch (error) {
                report.resources.clusters = { error: error.message };
            }

        } catch (error) {
            report.authentication = { status: 'failed', error: error.message };
        }

        // Save report
        const reportPath = path.join(__dirname, '..', 'DIGITALOCEAN_COMPREHENSIVE_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`📊 Comprehensive report generated: ${reportPath}`, 'success');
        return report;
    }

    async runCommand(command) {
        const commands = {
            'status': () => this.getAccountStatus(),
            'apps': () => this.listApps(),
            'droplets': () => this.listDroplets(),
            'registries': () => this.listRegistries(),
            'k8s': () => this.listKubernetesClusters(),
            'clusters': () => this.listKubernetesClusters(),
            'docker-login': () => this.dockerLogin(),
            'deploy': () => this.deployToAppPlatform(),
            'report': () => this.generateComprehensiveReport(),
            'auth': () => this.authenticate()
        };

        if (!commands[command]) {
            this.log(`❌ Unknown command: ${command}`, 'error');
            this.log('Available commands: ' + Object.keys(commands).join(', '), 'info');
            return;
        }

        try {
            const result = await commands[command]();
            this.log(`✅ Command '${command}' completed successfully`, 'success');
            return result;
        } catch (error) {
            this.log(`❌ Command '${command}' failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Main execution
if (require.main === module) {
    const manager = new DigitalOceanManager();
    const command = process.argv[2] || 'status';
    
    manager.runCommand(command).catch(error => {
        console.error('❌ DigitalOcean Manager failed:', error);
        process.exit(1);
    });
}

module.exports = DigitalOceanManager;