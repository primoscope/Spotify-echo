const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get deployment status and available options
router.get('/status', async (req, res) => {
    try {
        const deploymentInfo = {
            status: 'ready',
            availableOptions: [
                {
                    id: 'digitalocean',
                    name: 'DigitalOcean App Platform',
                    description: 'Managed platform with automatic scaling',
                    url: 'https://cloud.digitalocean.com/apps/new?repo=https://github.com/dzp5103/Spotify-echo/tree/main&refcode=echotuneai',
                    type: 'external',
                    time: '< 3 minutes',
                    features: ['Auto SSL', 'Global CDN', 'Auto Scaling', 'Zero Config']
                },
                {
                    id: 'docker',
                    name: 'Docker Container',
                    description: 'Containerized deployment for any Docker host',
                    type: 'script',
                    script: 'docker',
                    time: '< 5 minutes',
                    features: ['Multi-platform', 'Isolated Environment', 'Easy Scaling', 'Production Ready']
                },
                {
                    id: 'doctl',
                    name: 'DigitalOcean CLI (doctl)',
                    description: 'Advanced deployment with custom configuration',
                    type: 'script',
                    script: 'doctl',
                    time: '< 10 minutes',
                    features: ['Custom Domains', 'Managed Databases', 'Advanced Monitoring', 'Full Control']
                },
                {
                    id: 'dotcl',
                    name: 'Enhanced CLI (dotcl)',
                    description: 'Enterprise-grade deployment with advanced features',
                    type: 'script',
                    script: 'dotcl',
                    time: '< 15 minutes',
                    features: ['Security Scanning', 'Cost Optimization', 'Real-time Monitoring', 'Auto Backup']
                },
                {
                    id: 'local',
                    name: 'Local Development',
                    description: 'Set up for local development and testing',
                    type: 'script',
                    script: 'local',
                    time: '< 5 minutes',
                    features: ['Hot Reload', 'Debug Mode', 'Mock Providers', 'Fast Setup']
                }
            ],
            environment: {
                node: process.version,
                platform: process.platform,
                docker: await checkDockerAvailability(),
                git: await checkGitAvailability()
            }
        };

        res.json(deploymentInfo);
    } catch (error) {
        console.error('Error getting deployment status:', error);
        res.status(500).json({
            error: 'Failed to get deployment status',
            message: error.message
        });
    }
});

// Generate deployment commands for a specific method
router.post('/generate', async (req, res) => {
    try {
        const { method, options = {} } = req.body;
        
        if (!method) {
            return res.status(400).json({
                error: 'Deployment method is required'
            });
        }

        const commands = generateDeploymentCommands(method, options);
        
        res.json({
            method,
            commands,
            downloadUrl: `/api/deploy/download/${method}`,
            estimatedTime: getEstimatedTime(method),
            requirements: getRequirements(method)
        });
    } catch (error) {
        console.error('Error generating deployment commands:', error);
        res.status(500).json({
            error: 'Failed to generate deployment commands',
            message: error.message
        });
    }
});

// Download deployment script
router.get('/download/:method', (req, res) => {
    try {
        const { method } = req.params;
        const commands = generateDeploymentCommands(method);
        
        const filename = `deploy-${method}-commands.txt`;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(commands.join('\n'));
    } catch (error) {
        console.error('Error downloading deployment script:', error);
        res.status(500).json({
            error: 'Failed to download deployment script',
            message: error.message
        });
    }
});

// Get deployment guides
router.get('/guides/:method', (req, res) => {
    try {
        const { method } = req.params;
        const guide = getDeploymentGuide(method);
        
        res.json(guide);
    } catch (error) {
        console.error('Error getting deployment guide:', error);
        res.status(500).json({
            error: 'Failed to get deployment guide',
            message: error.message
        });
    }
});

// Helper functions
async function checkDockerAvailability() {
    return new Promise((resolve) => {
        exec('docker --version', (error, stdout) => {
            resolve(!error && stdout.includes('Docker'));
        });
    });
}

async function checkGitAvailability() {
    return new Promise((resolve) => {
        exec('git --version', (error, stdout) => {
            resolve(!error && stdout.includes('git'));
        });
    });
}

function generateDeploymentCommands(method, options = {}) {
    const baseCommands = [
        '# EchoTune AI Deployment Commands',
        '# Generated automatically for your convenience',
        '',
        '# 1. Clone the repository',
        'git clone https://github.com/dzp5103/Spotify-echo.git',
        'cd Spotify-echo',
        '',
        '# 2. Copy environment template',
        'cp .env.example .env',
        '',
        '# 3. Edit .env with your configuration:',
        '# SPOTIFY_CLIENT_ID=your_spotify_client_id',
        '# SPOTIFY_CLIENT_SECRET=your_spotify_client_secret',
        '# Add other required environment variables',
        ''
    ];

    switch (method) {
        case 'docker':
            return [
                ...baseCommands,
                '# 4. Deploy with Docker Compose',
                'docker-compose up -d --build',
                '',
                '# 5. Check deployment status',
                'docker-compose ps',
                'docker-compose logs -f',
                '',
                '# 6. Access your application',
                'echo "Application available at: http://localhost:3000"',
                '',
                '# Optional: View logs',
                'docker-compose logs -f echotune-ai'
            ];

        case 'doctl':
            return [
                ...baseCommands,
                '# 4. Set DigitalOcean API token',
                'export DO_API_TOKEN="your_digitalocean_api_token"',
                '',
                '# 5. Run doctl deployment script',
                './deploy-doctl.sh',
                '',
                '# For custom domain:',
                '# ./deploy-doctl.sh --domain yourdomain.com --email admin@yourdomain.com',
                '',
                '# For Droplet deployment:',
                '# ./deploy-doctl.sh --droplet --size s-4vcpu-8gb --region fra1'
            ];

        case 'dotcl':
            return [
                ...baseCommands,
                '# 4. Set DigitalOcean API token',
                'export DO_API_TOKEN="your_digitalocean_api_token"',
                '',
                '# 5. Interactive deployment wizard',
                './deploy-dotcl.sh --interactive',
                '',
                '# Or full production deployment:',
                './deploy-dotcl.sh deploy --monitoring --auto-scale --security --backup',
                '',
                '# 6. Monitor deployment',
                './deploy-dotcl.sh monitor --real-time',
                '',
                '# 7. Security and optimization',
                './deploy-dotcl.sh security --scan --harden',
                './deploy-dotcl.sh optimize --analyze-costs --performance-tuning'
            ];

        case 'local':
            return [
                ...baseCommands,
                '# 4. Install dependencies',
                'npm install',
                'pip install -r requirements.txt',
                '',
                '# 5. Start development server',
                'npm run dev',
                '',
                '# 6. In another terminal, start MCP server',
                'npm run mcp-server',
                '',
                '# 7. Open browser',
                'echo "Application available at: http://localhost:3000"',
                '',
                '# Additional development commands:',
                '# npm test              # Run tests',
                '# npm run lint          # Check code style',
                '# npm run health-check  # Verify setup'
            ];

        case 'universal':
            return [
                ...baseCommands,
                '# 4. Run universal deployment script',
                'curl -fsSL https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-universal.sh | bash',
                '',
                '# Or download and run manually:',
                'wget https://raw.githubusercontent.com/dzp5103/Spotify-echo/main/deploy-universal.sh',
                'chmod +x deploy-universal.sh',
                './deploy-universal.sh --production --domain yourdomain.com',
                '',
                '# For demo/testing:',
                './deploy-universal.sh --demo'
            ];

        default:
            return [
                ...baseCommands,
                '# 4. Choose your deployment method:',
                '# - For Docker: docker-compose up -d --build',
                '# - For DigitalOcean CLI: ./deploy-doctl.sh',
                '# - For Enhanced CLI: ./deploy-dotcl.sh --interactive',
                '# - For Local Dev: npm run dev',
                '',
                '# See https://github.com/dzp5103/Spotify-echo for more options'
            ];
    }
}

function getEstimatedTime(method) {
    const times = {
        docker: '< 5 minutes',
        doctl: '< 10 minutes',
        dotcl: '< 15 minutes',
        local: '< 5 minutes',
        universal: '< 10 minutes'
    };
    return times[method] || '< 10 minutes';
}

function getRequirements(method) {
    const requirements = {
        docker: ['Docker', 'Docker Compose'],
        doctl: ['DigitalOcean API Token', 'Linux/Unix system'],
        dotcl: ['DigitalOcean API Token', 'Linux/Unix system'],
        local: ['Node.js 20+', 'Python 3.8+', 'Git'],
        universal: ['Linux/Unix system', 'Internet connection']
    };
    return requirements[method] || ['Git', 'Internet connection'];
}

function getDeploymentGuide(method) {
    const guides = {
        docker: {
            title: 'Docker Deployment Guide',
            description: 'Deploy EchoTune AI using Docker containers',
            steps: [
                'Install Docker and Docker Compose',
                'Clone the repository',
                'Configure environment variables',
                'Run docker-compose up -d --build',
                'Access your application at http://localhost:3000'
            ],
            troubleshooting: [
                'Check Docker is running: docker --version',
                'View logs: docker-compose logs -f',
                'Restart containers: docker-compose restart'
            ]
        },
        doctl: {
            title: 'DigitalOcean CLI Deployment',
            description: 'Deploy using DigitalOcean CLI tools',
            steps: [
                'Get DigitalOcean API token',
                'Clone the repository',
                'Run ./deploy-doctl.sh',
                'Follow the interactive prompts',
                'Access your deployed application'
            ],
            troubleshooting: [
                'Verify API token: doctl auth init',
                'Check deployment status: doctl apps list',
                'View deployment logs in DigitalOcean console'
            ]
        }
    };
    return guides[method] || {
        title: 'General Deployment Guide',
        description: 'General deployment instructions',
        steps: ['Clone repository', 'Configure environment', 'Deploy']
    };
}

module.exports = router;