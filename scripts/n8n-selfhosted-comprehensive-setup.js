#!/usr/bin/env node

/**
 * Comprehensive n8n Self-Hosted Setup & Deployment Script
 * Complete automation for setting up self-hosted n8n with GitHub integration
 * Includes community nodes, MCP servers, Docker configuration, and workflow deployment
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

// Load environment variables from .env file
try {
    const envContent = require('fs').readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key]) {
            process.env[key] = value;
        }
    });
} catch (error) {
    console.warn('⚠️ Could not load .env file');
}

class N8nSelfHostedSetup {
    constructor() {
        this.config = {
            n8nInstance: process.env.N8N_API_URL || 'https://primosphere.ninja',
            apiKey: process.env.N8N_API_KEY,
            workingDir: process.cwd(),
            setupSteps: [
                'validateEnvironment',
                'setupDirectoryStructure', 
                'createDockerConfiguration',
                'setupNginxConfiguration',
                'createMCPServers',
                'installCommunityNodes',
                'deployWorkflows',
                'configureGitHubIntegration',
                'setupMonitoring',
                'runHealthChecks'
            ]
        };
        
        this.requiredDirs = [
            'volumes/n8n_data',
            'volumes/n8n_files',
            'volumes/postgres_data',
            'volumes/redis_data',
            'volumes/prometheus_data',
            'volumes/grafana_data',
            'volumes/loki_data',
            'nginx/conf.d',
            'ssl',
            'backups',
            'scripts/database',
            'mcp-servers/filesystem',
            'mcp-servers/puppeteer',
            'mcp-servers/analytics',
            'monitoring',
            'config',
            'logs'
        ];
        
        this.communityNodes = [
            '@kenkaiii/n8n-nodes-supercode',
            'n8n-nodes-deepseek', 
            'n8n-nodes-mcp'
        ];
    }

    async runSetup() {
        console.log('🚀 Starting comprehensive n8n self-hosted setup...');
        console.log(`📍 Working directory: ${this.config.workingDir}`);
        console.log(`🌐 Target n8n instance: ${this.config.n8nInstance}`);
        
        const startTime = Date.now();
        const results = {};
        
        for (const step of this.config.setupSteps) {
            try {
                console.log(`\n🔄 Executing step: ${step}`);
                const stepStart = Date.now();
                
                const result = await this[step]();
                const stepDuration = Date.now() - stepStart;
                
                results[step] = {
                    status: 'success',
                    duration: stepDuration,
                    result: result
                };
                
                console.log(`✅ Completed ${step} in ${stepDuration}ms`);
                
            } catch (error) {
                console.error(`❌ Failed step ${step}:`, error.message);
                results[step] = {
                    status: 'failed',
                    error: error.message
                };
                
                // Continue with next step unless critical
                if (this.isCriticalStep(step)) {
                    throw error;
                }
            }
        }
        
        const totalDuration = Date.now() - startTime;
        const report = await this.generateSetupReport(results, totalDuration);
        
        console.log('\n🎉 n8n self-hosted setup completed!');
        console.log(`⏱️  Total duration: ${totalDuration}ms`);
        
        return report;
    }

    async validateEnvironment() {
        console.log('🔍 Validating environment and prerequisites...');
        
        const checks = {
            docker: { required: true, checked: false },
            dockerCompose: { required: true, checked: false },
            node: { required: true, checked: false, minVersion: '16.0.0' },
            npm: { required: true, checked: false },
            git: { required: true, checked: false },
            curl: { required: true, checked: false },
            envFile: { required: true, checked: false },
            apiKey: { required: true, checked: false }
        };
        
        // Check Docker
        try {
            execSync('docker --version', { stdio: 'pipe' });
            checks.docker.checked = true;
            checks.docker.version = execSync('docker --version', { encoding: 'utf8' }).trim();
        } catch (error) {
            throw new Error('Docker is not installed or not accessible');
        }
        
        // Check Docker Compose
        try {
            execSync('docker-compose --version', { stdio: 'pipe' });
            checks.dockerCompose.checked = true;
            checks.dockerCompose.version = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
        } catch (error) {
            try {
                execSync('docker compose version', { stdio: 'pipe' });
                checks.dockerCompose.checked = true;
                checks.dockerCompose.version = execSync('docker compose version', { encoding: 'utf8' }).trim();
            } catch (e) {
                throw new Error('Docker Compose is not installed');
            }
        }
        
        // Check Node.js
        try {
            const nodeVersion = process.version;
            checks.node.checked = true;
            checks.node.version = nodeVersion;
            
            const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
            if (majorVersion < 16) {
                throw new Error(`Node.js version ${nodeVersion} is too old. Minimum required: 16.0.0`);
            }
        } catch (error) {
            throw new Error('Node.js is not installed or version is too old');
        }
        
        // Check npm
        try {
            checks.npm.version = execSync('npm --version', { encoding: 'utf8' }).trim();
            checks.npm.checked = true;
        } catch (error) {
            throw new Error('npm is not installed');
        }
        
        // Check Git
        try {
            checks.git.version = execSync('git --version', { encoding: 'utf8' }).trim();
            checks.git.checked = true;
        } catch (error) {
            throw new Error('Git is not installed');
        }
        
        // Check curl
        try {
            execSync('curl --version', { stdio: 'pipe' });
            checks.curl.checked = true;
        } catch (error) {
            console.warn('⚠️ curl not found - some features may not work');
        }
        
        // Check environment file
        try {
            await fs.access('.env');
            checks.envFile.checked = true;
        } catch (error) {
            console.warn('⚠️ .env file not found - using template');
            await this.createEnvironmentFile();
            checks.envFile.checked = true;
        }
        
        // Check API key
        if (this.config.apiKey && this.config.apiKey.length > 50) {
            checks.apiKey.checked = true;
        } else {
            console.warn('⚠️ N8N_API_KEY not configured or invalid');
        }
        
        const failedChecks = Object.entries(checks)
            .filter(([_, check]) => check.required && !check.checked)
            .map(([name, _]) => name);
        
        if (failedChecks.length > 0) {
            throw new Error(`Required dependencies missing: ${failedChecks.join(', ')}`);
        }
        
        console.log('✅ Environment validation passed');
        return checks;
    }

    async setupDirectoryStructure() {
        console.log('📁 Setting up directory structure...');
        
        const created = [];
        const existing = [];
        
        for (const dir of this.requiredDirs) {
            const dirPath = path.join(this.config.workingDir, dir);
            
            try {
                await fs.access(dirPath);
                existing.push(dir);
            } catch (error) {
                await fs.mkdir(dirPath, { recursive: true });
                created.push(dir);
            }
        }
        
        // Set proper permissions for volume directories
        const volumeDirs = this.requiredDirs.filter(dir => dir.startsWith('volumes/'));
        for (const dir of volumeDirs) {
            const dirPath = path.join(this.config.workingDir, dir);
            try {
                execSync(`chmod 755 "${dirPath}"`, { stdio: 'pipe' });
            } catch (error) {
                console.warn(`⚠️ Could not set permissions for ${dir}`);
            }
        }
        
        console.log(`📁 Created ${created.length} directories, ${existing.length} already existed`);
        return { created, existing };
    }

    async createDockerConfiguration() {
        console.log('🐳 Creating Docker configuration files...');
        
        // Docker Compose file already exists, so let's create supporting files
        
        // Create .dockerignore
        const dockerignore = `
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
*.log
logs
*.tmp
.vscode
.idea
`;
        
        await fs.writeFile('.dockerignore', dockerignore.trim());
        
        // Create database init script
        const dbInitScript = `
-- n8n Database Initialization Script
-- Creates optimized database configuration for n8n

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS n8n_production;

-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'n8n_user') THEN
        CREATE ROLE n8n_user LOGIN PASSWORD 'secure_password';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE n8n_production TO n8n_user;

-- Connect to n8n database
\\c n8n_production;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set optimized configuration
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
`;
        
        await fs.writeFile('scripts/database/init.sql', dbInitScript.trim());
        
        // Create Redis configuration
        const redisConfig = `
# Redis configuration for n8n
bind 0.0.0.0
protected-mode yes
port 6379
tcp-backlog 511
timeout 300
tcp-keepalive 60
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
always-show-logo yes
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-ping-replica-period 10
repl-timeout 60
repl-disable-tcp-nodelay no
replica-priority 100
maxmemory 512mb
maxmemory-policy allkeys-lru
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
`;
        
        await fs.writeFile('config/redis.conf', redisConfig.trim());
        
        console.log('✅ Docker configuration files created');
        return { dockerignore: true, dbInit: true, redisConfig: true };
    }

    async setupNginxConfiguration() {
        console.log('🌐 Setting up Nginx configuration...');
        
        // Main nginx.conf
        const nginxConf = `
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=30r/s;
    
    include /etc/nginx/conf.d/*.conf;
}
`;
        
        await fs.writeFile('nginx/nginx.conf', nginxConf.trim());
        
        // n8n site configuration
        const siteConf = `
upstream n8n {
    server n8n:5678;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${process.env.N8N_HOST || 'localhost'};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${process.env.N8N_HOST || 'localhost'};
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA;
    ssl_prefer_server_ciphers off;
    ssl_dhparam /etc/nginx/ssl/dhparam.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # n8n editor
    location / {
        proxy_pass http://n8n;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Webhooks with rate limiting
    location /webhook/ {
        limit_req zone=webhook burst=50 nodelay;
        
        proxy_pass http://n8n;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for webhook processing
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://n8n;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
`;
        
        await fs.writeFile('nginx/conf.d/n8n.conf', siteConf.trim());
        
        console.log('✅ Nginx configuration created');
        return { nginxConf: true, siteConf: true };
    }

    async createMCPServers() {
        console.log('🔧 Creating MCP server configurations...');
        
        // Filesystem MCP Server Dockerfile
        const filesystemDockerfile = `
FROM node:18-alpine

WORKDIR /app

# Install MCP filesystem server
RUN npm install -g @modelcontextprotocol/server-filesystem

# Create startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3001

CMD ["/app/start.sh"]
`;
        
        const filesystemStartScript = `
#!/bin/sh
exec npx @modelcontextprotocol/server-filesystem /workspace
`;
        
        await fs.writeFile('mcp-servers/filesystem/Dockerfile', filesystemDockerfile.trim());
        await fs.writeFile('mcp-servers/filesystem/start.sh', filesystemStartScript.trim());
        
        // Puppeteer MCP Server Dockerfile
        const puppeteerDockerfile = `
FROM node:18-alpine

# Install Chrome dependencies
RUN apk add --no-cache \\
    chromium \\
    nss \\
    freetype \\
    freetype-dev \\
    harfbuzz \\
    ca-certificates \\
    ttf-freefont

WORKDIR /app

# Install MCP puppeteer server
RUN npm install -g @modelcontextprotocol/server-puppeteer

# Set Chrome path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3002

CMD ["/app/start.sh"]
`;
        
        const puppeteerStartScript = `
#!/bin/sh
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
exec npx @modelcontextprotocol/server-puppeteer
`;
        
        await fs.writeFile('mcp-servers/puppeteer/Dockerfile', puppeteerDockerfile.trim());
        await fs.writeFile('mcp-servers/puppeteer/start.sh', puppeteerStartScript.trim());
        
        // Analytics MCP Server
        const analyticsDockerfile = `
FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package.json /app/
RUN npm install

# Copy source code
COPY . /app/

EXPOSE 3004

CMD ["node", "server.js"]
`;
        
        const analyticsPackageJson = {
            "name": "mcp-analytics-server",
            "version": "1.0.0",
            "description": "MCP Analytics Server for EchoTune AI",
            "main": "server.js",
            "dependencies": {
                "@modelcontextprotocol/sdk": "^0.4.0",
                "express": "^4.18.2",
                "axios": "^1.6.0"
            }
        };
        
        const analyticsServer = `
const express = require('express');
const { MCPServer } = require('@modelcontextprotocol/sdk');

const app = express();
const port = process.env.MCP_SERVER_PORT || 3004;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Analytics logging endpoint
app.post('/log', (req, res) => {
    const { event, data, timestamp } = req.body;
    
    console.log('Analytics Event:', {
        event,
        data,
        timestamp: timestamp || new Date().toISOString()
    });
    
    res.json({ status: 'logged', eventId: Date.now() });
});

// MCP Server setup
const mcpServer = new MCPServer('analytics-server', '1.0.0');

mcpServer.setRequestHandler('logEvent', async (params) => {
    const { event, data } = params;
    
    // Log to console and potentially external services
    console.log('MCP Analytics Event:', { event, data, timestamp: new Date().toISOString() });
    
    return { status: 'success', eventId: Date.now() };
});

app.listen(port, () => {
    console.log(\`Analytics MCP Server running on port \${port}\`);
});
`;
        
        await fs.writeFile('mcp-servers/analytics/Dockerfile', analyticsDockerfile.trim());
        await fs.writeFile('mcp-servers/analytics/package.json', JSON.stringify(analyticsPackageJson, null, 2));
        await fs.writeFile('mcp-servers/analytics/server.js', analyticsServer.trim());
        
        console.log('✅ MCP server configurations created');
        return { filesystem: true, puppeteer: true, analytics: true };
    }

    async installCommunityNodes() {
        console.log('🧩 Installing community nodes...');
        
        // Since we're working with an existing n8n instance, we'll create installation instructions
        const installScript = `
#!/bin/bash
# Community Nodes Installation Script for n8n

echo "🧩 Installing n8n community nodes..."

# Install SuperCode node
echo "Installing @kenkaiii/n8n-nodes-supercode..."
docker exec echotune-n8n npm install @kenkaiii/n8n-nodes-supercode

# Install DeepSeek node  
echo "Installing n8n-nodes-deepseek..."
docker exec echotune-n8n npm install n8n-nodes-deepseek

# Install MCP node
echo "Installing n8n-nodes-mcp..."
docker exec echotune-n8n npm install n8n-nodes-mcp

# Restart n8n to load new nodes
echo "Restarting n8n container..."
docker restart echotune-n8n

echo "✅ Community nodes installation completed!"
echo "Please verify nodes are available in the n8n interface."
`;
        
        await fs.writeFile('scripts/install-community-nodes.sh', installScript.trim());
        
        // Make script executable
        try {
            execSync('chmod +x scripts/install-community-nodes.sh', { stdio: 'pipe' });
        } catch (error) {
            console.warn('⚠️ Could not make script executable');
        }
        
        console.log('✅ Community nodes installation script created');
        return { scriptCreated: true, nodes: this.communityNodes };
    }

    async deployWorkflows() {
        console.log('⚡ Deploying workflow templates...');
        
        // For now, create a deployment script since we need the n8n instance running
        const deployScript = `
#!/bin/bash
# Workflow Deployment Script

echo "⚡ Deploying n8n workflow templates..."

# Load and deploy comprehensive workflow templates
node scripts/n8n-comprehensive-workflow-templates.js

# Deploy GitHub coding agent workflows
node scripts/n8n-github-coding-agent-comprehensive.js

echo "✅ Workflow deployment completed!"
`;
        
        await fs.writeFile('scripts/deploy-workflows.sh', deployScript.trim());
        
        try {
            execSync('chmod +x scripts/deploy-workflows.sh', { stdio: 'pipe' });
        } catch (error) {
            console.warn('⚠️ Could not make script executable');
        }
        
        console.log('✅ Workflow deployment script created');
        return { deploymentScript: true };
    }

    async configureGitHubIntegration() {
        console.log('🔗 Configuring GitHub integration...');
        
        const githubConfig = {
            webhooks: [
                {
                    name: 'Pull Request Reviews',
                    url: `${this.config.n8nInstance}/webhook/github-advanced-code-review`,
                    events: ['pull_request'],
                    contentType: 'json'
                },
                {
                    name: 'Issues Auto-Triage',
                    url: `${this.config.n8nInstance}/webhook/github-issues-triage`,
                    events: ['issues'],
                    contentType: 'json'
                },
                {
                    name: 'CI/CD Pipeline',
                    url: `${this.config.n8nInstance}/webhook/github-cicd-pipeline`,
                    events: ['push'],
                    contentType: 'json'
                }
            ],
            requiredPermissions: [
                'repo',
                'workflow',
                'write:repo_hook',
                'read:org'
            ]
        };
        
        await fs.writeFile('config/github-integration.json', JSON.stringify(githubConfig, null, 2));
        
        console.log('✅ GitHub integration configuration created');
        return githubConfig;
    }

    async setupMonitoring() {
        console.log('📊 Setting up monitoring configuration...');
        
        // Prometheus configuration
        const prometheusConfig = `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'n8n'
    static_configs:
      - targets: ['n8n:5678']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']

  - job_name: 'mcp-servers'
    static_configs:
      - targets: ['mcp-filesystem:3001', 'mcp-puppeteer:3002', 'mcp-analytics:3004']
`;
        
        await fs.writeFile('monitoring/prometheus.yml', prometheusConfig.trim());
        
        // Loki configuration
        const lokiConfig = `
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 1h
  max_chunk_age: 1h
  chunk_target_size: 1048576
  chunk_retain_period: 30s
  max_transfer_retries: 0

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s

ruler:
  storage:
    type: local
    local:
      directory: /loki/rules
  rule_path: /loki/rules-temp
  alertmanager_url: http://localhost:9093
  ring:
    kvstore:
      store: inmemory
  enable_api: true
`;
        
        await fs.writeFile('monitoring/loki-config.yml', lokiConfig.trim());
        
        // Promtail configuration
        const promtailConfig = `
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log

  - job_name: nginx
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          __path__: /var/log/nginx/*log

  - job_name: n8n
    static_configs:
      - targets:
          - localhost
        labels:
          job: n8n
          __path__: /var/log/n8n/*log
`;
        
        await fs.writeFile('monitoring/promtail-config.yml', promtailConfig.trim());
        
        console.log('✅ Monitoring configuration created');
        return { prometheus: true, loki: true, promtail: true };
    }

    async runHealthChecks() {
        console.log('🔍 Running health checks...');
        
        const healthChecks = {
            environment: true,
            directories: true,
            configurations: true
        };
        
        // Check if all required directories exist
        for (const dir of this.requiredDirs) {
            try {
                await fs.access(path.join(this.config.workingDir, dir));
            } catch (error) {
                healthChecks.directories = false;
                break;
            }
        }
        
        // Check if configuration files exist
        const requiredFiles = [
            'docker-compose.n8n-selfhosted.yml',
            'nginx/nginx.conf',
            'nginx/conf.d/n8n.conf',
            'scripts/install-community-nodes.sh',
            'config/github-integration.json',
            'monitoring/prometheus.yml'
        ];
        
        for (const file of requiredFiles) {
            try {
                await fs.access(path.join(this.config.workingDir, file));
            } catch (error) {
                healthChecks.configurations = false;
                break;
            }
        }
        
        console.log('✅ Health checks completed');
        return healthChecks;
    }

    async createEnvironmentFile() {
        console.log('📝 Creating environment file from template...');
        
        try {
            await fs.copyFile('.env.comprehensive.template', '.env');
            console.log('✅ Environment file created from comprehensive template');
        } catch (error) {
            console.warn('⚠️ Could not copy template, creating basic .env file');
            
            const basicEnv = `
# Basic n8n Configuration
N8N_API_URL=https://primosphere.ninja
N8N_API_KEY=your-api-key-here
N8N_USERNAME=admin
N8N_PASSWORD=secure-password-here
N8N_ENCRYPTION_KEY=your-32-character-encryption-key

# Database
DB_POSTGRESDB_PASSWORD=secure-db-password
REDIS_PASSWORD=secure-redis-password

# GitHub
GITHUB_TOKEN=your-github-token
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# AI Services
DEEPSEEK_API_KEY=your-deepseek-key
OPENAI_API_KEY=your-openai-key
`;
            
            await fs.writeFile('.env', basicEnv.trim());
        }
    }

    isCriticalStep(step) {
        const criticalSteps = [
            'validateEnvironment',
            'setupDirectoryStructure'
        ];
        return criticalSteps.includes(step);
    }

    async generateSetupReport(results, duration) {
        const report = {
            timestamp: new Date().toISOString(),
            duration: duration,
            workingDirectory: this.config.workingDir,
            targetInstance: this.config.n8nInstance,
            results: results,
            summary: {
                totalSteps: this.config.setupSteps.length,
                successfulSteps: Object.values(results).filter(r => r.status === 'success').length,
                failedSteps: Object.values(results).filter(r => r.status === 'failed').length
            },
            nextSteps: [
                'Review and update .env file with your actual credentials',
                'Run: docker-compose -f docker-compose.n8n-selfhosted.yml up -d',
                'Execute: ./scripts/install-community-nodes.sh',
                'Execute: ./scripts/deploy-workflows.sh',
                'Configure GitHub webhooks using config/github-integration.json',
                'Access n8n interface and verify workflows are loaded',
                'Set up SSL certificates for production use'
            ],
            files: {
                dockerCompose: 'docker-compose.n8n-selfhosted.yml',
                nginx: 'nginx/nginx.conf',
                environment: '.env',
                scripts: [
                    'scripts/install-community-nodes.sh',
                    'scripts/deploy-workflows.sh'
                ],
                monitoring: [
                    'monitoring/prometheus.yml',
                    'monitoring/loki-config.yml',
                    'monitoring/promtail-config.yml'
                ]
            }
        };
        
        await fs.writeFile(
            path.join(this.config.workingDir, 'n8n-setup-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📊 SETUP REPORT');
        console.log('================');
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`✅ Successful: ${report.summary.successfulSteps}/${report.summary.totalSteps} steps`);
        console.log(`❌ Failed: ${report.summary.failedSteps} steps`);
        console.log(`📍 Working Dir: ${report.workingDirectory}`);
        console.log(`🌐 Target Instance: ${report.targetInstance}`);
        console.log(`📄 Report saved: n8n-setup-report.json`);
        
        return report;
    }
}

// Main execution
async function main() {
    try {
        const setup = new N8nSelfHostedSetup();
        const report = await setup.runSetup();
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next Steps:');
        report.nextSteps.forEach((step, index) => {
            console.log(`${index + 1}. ${step}`);
        });
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error('Please check the error and run the setup again.');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { N8nSelfHostedSetup };