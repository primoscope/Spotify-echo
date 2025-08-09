#!/usr/bin/env node

/**
 * Environment Configuration Update Tool for EchoTune AI
 * 
 * This tool helps update the .env file with missing configuration keys
 * based on the list provided in the GitHub comment.
 * 
 * Usage:
 *   node scripts/update-env-config.js [options]
 *   
 * Options:
 *   --add-missing     Add all missing keys with default values
 *   --interactive     Interactive mode to add keys one by one
 *   --backup         Create backup before modifying .env
 *   --dry-run        Show what would be added without making changes
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class EnvironmentConfigUpdater {
    constructor() {
        this.envPath = path.join(process.cwd(), '.env');
        this.envExamplePath = path.join(process.cwd(), '.env.example');
        this.backupPath = path.join(process.cwd(), '.env.backup');
        
        this.missingKeys = [
            "SSL_ENABLED", "SSL_CHAIN_PATH", "SSL_EMAIL",
            "NGINX_WORKER_PROCESSES", "NGINX_WORKER_CONNECTIONS",
            "BACKEND_HOST", "BACKEND_PORT",
            "MONGODB_DB_NAME", "MONGODB_MAX_POOL_SIZE", "MONGODB_MIN_POOL_SIZE",
            "MONGODB_MAX_IDLE_TIME", "MONGODB_CONNECT_TIMEOUT", "MONGODB_SOCKET_TIMEOUT",
            "MONGODB_COLLECTIONS_PREFIX", "ENABLE_MONGODB_ANALYTICS", "MONGODB_ANALYTICS_RETENTION_DAYS",
            "REDIS_DB_INDEX", "REDIS_KEY_PREFIX", "REDIS_DEFAULT_TTL",
            "ENABLE_DATABASE_ANALYTICS", "ENABLE_QUERY_LOGGING",
            "DATABASE_BACKUP_ENABLED", "DATABASE_BACKUP_INTERVAL",
            "LLM_PROVIDER_FALLBACK", "OPENAI_RATE_LIMIT", "GEMINI_RATE_LIMIT",
            "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "OPENROUTER_SITE_URL", "OPENROUTER_APP_NAME",
            "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "ANTHROPIC_MAX_TOKENS",
            "ENABLE_PROVIDER_SWITCHING", "ENABLE_MODEL_SELECTION", "LLM_RESPONSE_CACHE_TTL",
            "LLM_RETRY_ATTEMPTS", "LLM_TIMEOUT",
            "DOCKER_HUB_USERNAME", "DOCKER_HUB_TOKEN", "DOCKER_REGISTRY", "DOCKER_REPOSITORY",
            "RATE_LIMIT_ENABLED", "CLUSTER_ENABLED", "WORKER_PROCESSES",
            "PROMETHEUS_ENABLED", "PROMETHEUS_PORT",
            "LOG_FORMAT", "ENABLE_REQUEST_LOGGING", "ENABLE_ERROR_TRACKING", "LOG_ROTATION_ENABLED",
            "ENABLE_ANALYTICS_DASHBOARD", "ENABLE_REALTIME_UPDATES", "ENABLE_BACKGROUND_TASKS",
            "ENABLE_FILE_UPLOADS", "MAX_FILE_SIZE",
            "GITHUB_PAT", "GITHUB_API_URL", "DATABASE_URL", "SQLITE_DB_PATH",
            "BRAVE_API_KEY", "YOUTUBE_API_KEY",
            "BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID", "BROWSERBASE_SESSION_ID",
            "INFLUXDB_URL", "INFLUXDB_TOKEN", "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY",
            "MCP_SERVER_PORT", "MCP_SERVER_HOST", "ENABLE_MCP_LOGGING", "MCP_TIMEOUT",
            "ANALYTICS_RETENTION_DAYS", "TRACK_USER_BEHAVIOR", "ENABLE_LISTENING_INSIGHTS",
            "ENABLE_MUSIC_ANALYTICS", "TRACK_PLAY_COUNTS", "ANALYZE_LISTENING_PATTERNS",
            "GENERATE_RECOMMENDATIONS_INSIGHTS", "DASHBOARD_REFRESH_INTERVAL",
            "ENABLE_REAL_TIME_CHARTS", "CHART_DATA_POINTS", "ENABLE_DATA_EXPORT"
        ];

        this.keyDefaults = {
            // SSL Configuration
            "SSL_ENABLED": "true",
            "SSL_CHAIN_PATH": "/etc/nginx/ssl/chain.pem", 
            "SSL_EMAIL": "admin@your-domain.com",

            // NGINX Configuration
            "NGINX_WORKER_PROCESSES": "auto",
            "NGINX_WORKER_CONNECTIONS": "1024",

            // Backend Configuration
            "BACKEND_HOST": "app",
            "BACKEND_PORT": "3000",

            // MongoDB Configuration
            "MONGODB_DB_NAME": "echotune",
            "MONGODB_MAX_POOL_SIZE": "10",
            "MONGODB_MIN_POOL_SIZE": "5", 
            "MONGODB_MAX_IDLE_TIME": "30000",
            "MONGODB_CONNECT_TIMEOUT": "10000",
            "MONGODB_SOCKET_TIMEOUT": "0",
            "MONGODB_COLLECTIONS_PREFIX": "echotune_",
            "ENABLE_MONGODB_ANALYTICS": "true",
            "MONGODB_ANALYTICS_RETENTION_DAYS": "90",

            // Redis Configuration
            "REDIS_DB_INDEX": "0",
            "REDIS_KEY_PREFIX": "echotune:",
            "REDIS_DEFAULT_TTL": "3600",

            // Database Features
            "ENABLE_DATABASE_ANALYTICS": "true",
            "ENABLE_QUERY_LOGGING": "false",
            "DATABASE_BACKUP_ENABLED": "true", 
            "DATABASE_BACKUP_INTERVAL": "24h",

            // LLM Configuration
            "LLM_PROVIDER_FALLBACK": "gemini,mock",
            "OPENAI_RATE_LIMIT": "60",
            "GEMINI_RATE_LIMIT": "60",
            "OPENROUTER_API_KEY": "sk-or-your_openrouter_api_key_here",
            "OPENROUTER_MODEL": "anthropic/claude-3.5-sonnet",
            "OPENROUTER_SITE_URL": "https://your-domain.com",
            "OPENROUTER_APP_NAME": "EchoTune AI",
            "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_api_key_here",
            "ANTHROPIC_MODEL": "claude-3-sonnet-20240229",
            "ANTHROPIC_MAX_TOKENS": "2000",
            "ENABLE_PROVIDER_SWITCHING": "true",
            "ENABLE_MODEL_SELECTION": "true",
            "LLM_RESPONSE_CACHE_TTL": "300",
            "LLM_RETRY_ATTEMPTS": "3",
            "LLM_TIMEOUT": "30000",

            // Docker Configuration
            "DOCKER_HUB_USERNAME": "your_dockerhub_username",
            "DOCKER_HUB_TOKEN": "your_dockerhub_access_token",
            "DOCKER_REGISTRY": "docker.io",
            "DOCKER_REPOSITORY": "your_username/echotune-ai",

            // Performance Configuration
            "RATE_LIMIT_ENABLED": "true",
            "CLUSTER_ENABLED": "false", 
            "WORKER_PROCESSES": "auto",
            "PROMETHEUS_ENABLED": "false",
            "PROMETHEUS_PORT": "9090",

            // Logging Configuration
            "LOG_FORMAT": "combined",
            "ENABLE_REQUEST_LOGGING": "true",
            "ENABLE_ERROR_TRACKING": "true",
            "LOG_ROTATION_ENABLED": "true",

            // Application Features
            "ENABLE_ANALYTICS_DASHBOARD": "true",
            "ENABLE_REALTIME_UPDATES": "true",
            "ENABLE_BACKGROUND_TASKS": "true",
            "ENABLE_FILE_UPLOADS": "true",
            "MAX_FILE_SIZE": "50MB",

            // MCP Server Integrations
            "GITHUB_PAT": "your_github_personal_access_token",
            "GITHUB_API_URL": "https://api.github.com",
            "DATABASE_URL": "postgresql://username:password@localhost:5432/echotune",
            "SQLITE_DB_PATH": "data/echotune.db",
            "BRAVE_API_KEY": "your_brave_search_api_key",
            "YOUTUBE_API_KEY": "your_youtube_api_key",
            "BROWSERBASE_API_KEY": "your_browserbase_api_key",
            "BROWSERBASE_PROJECT_ID": "your_browserbase_project_id",
            "BROWSERBASE_SESSION_ID": "your_browserbase_session_id",
            "INFLUXDB_URL": "http://localhost:8086",
            "INFLUXDB_TOKEN": "your_influxdb_token",
            "LANGFUSE_PUBLIC_KEY": "pk_your_langfuse_public_key",
            "LANGFUSE_SECRET_KEY": "sk_your_langfuse_secret_key",

            // MCP Server Configuration
            "MCP_SERVER_PORT": "3001",
            "MCP_SERVER_HOST": "localhost",
            "ENABLE_MCP_LOGGING": "true",
            "MCP_TIMEOUT": "30000",

            // Analytics Configuration
            "ANALYTICS_RETENTION_DAYS": "365",
            "TRACK_USER_BEHAVIOR": "true",
            "ENABLE_LISTENING_INSIGHTS": "true",
            "ENABLE_MUSIC_ANALYTICS": "true",
            "TRACK_PLAY_COUNTS": "true",
            "ANALYZE_LISTENING_PATTERNS": "true",
            "GENERATE_RECOMMENDATIONS_INSIGHTS": "true",
            "DASHBOARD_REFRESH_INTERVAL": "30000",
            "ENABLE_REAL_TIME_CHARTS": "true",
            "CHART_DATA_POINTS": "100",
            "ENABLE_DATA_EXPORT": "true"
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toTimeString().split(' ')[0];
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    // Read current .env file
    readEnvFile() {
        if (!fs.existsSync(this.envPath)) {
            throw new Error('.env file not found. Create one from .env.example first.');
        }

        const content = fs.readFileSync(this.envPath, 'utf8');
        const lines = content.split('\n');
        
        const envVars = {};
        const comments = [];
        const structure = [];

        lines.forEach((line, index) => {
            if (line.trim().startsWith('#') || line.trim() === '') {
                comments.push({ line, index });
                structure.push({ type: 'comment', content: line });
            } else if (line.includes('=')) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                envVars[key.trim()] = value;
                structure.push({ type: 'variable', key: key.trim(), value, content: line });
            } else {
                structure.push({ type: 'other', content: line });
            }
        });

        return { envVars, comments, structure, content };
    }

    // Create backup of current .env
    createBackup() {
        if (fs.existsSync(this.envPath)) {
            fs.copyFileSync(this.envPath, this.backupPath);
            this.log(`Backup created: ${this.backupPath}`, 'success');
        }
    }

    // Find missing keys
    findMissingKeys() {
        const { envVars } = this.readEnvFile();
        const currentKeys = Object.keys(envVars);
        
        const missing = this.missingKeys.filter(key => !currentKeys.includes(key));
        const existing = this.missingKeys.filter(key => currentKeys.includes(key));
        
        return { missing, existing };
    }

    // Add missing keys to .env file
    addMissingKeys(keysToAdd, dryRun = false) {
        const { structure, content } = this.readEnvFile();
        
        if (dryRun) {
            this.log('DRY RUN - The following keys would be added:', 'warning');
            keysToAdd.forEach(key => {
                const defaultValue = this.keyDefaults[key] || 'your_value_here';
                console.log(`  ${key}=${defaultValue}`);
            });
            return;
        }

        // Group keys by category for better organization
        const keysByCategory = this.groupKeysByCategory(keysToAdd);
        
        let newContent = content;
        
        // Add keys by category
        Object.entries(keysByCategory).forEach(([category, keys]) => {
            newContent += `\n# =============================================================================\n`;
            newContent += `# ${category.toUpperCase()}\n`;
            newContent += `# =============================================================================\n\n`;
            
            keys.forEach(key => {
                const defaultValue = this.keyDefaults[key] || 'your_value_here';
                newContent += `${key}=${defaultValue}\n`;
            });
        });

        fs.writeFileSync(this.envPath, newContent);
        this.log(`Added ${keysToAdd.length} missing keys to .env file`, 'success');
    }

    // Group keys by category
    groupKeysByCategory(keys) {
        const categories = {
            'SSL & Security Configuration': keys.filter(k => k.startsWith('SSL_')),
            'NGINX Configuration': keys.filter(k => k.startsWith('NGINX_')),
            'Backend Configuration': keys.filter(k => k.startsWith('BACKEND_')),
            'MongoDB Configuration': keys.filter(k => k.startsWith('MONGODB_') || k.includes('MONGO')),
            'Redis Configuration': keys.filter(k => k.startsWith('REDIS_')),
            'Database Configuration': keys.filter(k => k.startsWith('DATABASE_') || k.includes('_DB_') || k.includes('QUERY_')),
            'LLM Providers Configuration': keys.filter(k => k.startsWith('LLM_') || k.startsWith('OPENAI_') || k.startsWith('GEMINI_') || k.startsWith('OPENROUTER_') || k.startsWith('ANTHROPIC_')),
            'Docker Configuration': keys.filter(k => k.startsWith('DOCKER_')),
            'Performance & Monitoring': keys.filter(k => k.includes('RATE_LIMIT') || k.includes('CLUSTER') || k.includes('WORKER') || k.includes('PROMETHEUS')),
            'Logging Configuration': keys.filter(k => k.startsWith('LOG_') || k.includes('LOGGING')),
            'Application Features': keys.filter(k => k.includes('ENABLE_') && !k.includes('DATABASE') && !k.includes('MONGO') && !k.includes('MCP')),
            'External API Keys': keys.filter(k => k.includes('_API_KEY') || k.startsWith('GITHUB_') || k.startsWith('BRAVE_') || k.startsWith('YOUTUBE_') || k.startsWith('BROWSERBASE_')),
            'Analytics & Monitoring': keys.filter(k => k.startsWith('INFLUXDB_') || k.startsWith('LANGFUSE_') || k.includes('ANALYTICS') || k.includes('TRACK_') || k.includes('DASHBOARD_')),
            'MCP Server Configuration': keys.filter(k => k.startsWith('MCP_') || k.includes('MCP')),
            'Music Analytics': keys.filter(k => k.includes('MUSIC') || k.includes('LISTENING') || k.includes('RECOMMENDATIONS') || k.includes('CHART_'))
        };

        // Remove empty categories and uncategorized keys
        const result = {};
        const categorizedKeys = [];
        
        Object.entries(categories).forEach(([category, categoryKeys]) => {
            if (categoryKeys.length > 0) {
                result[category] = categoryKeys;
                categorizedKeys.push(...categoryKeys);
            }
        });

        // Add uncategorized keys
        const uncategorized = keys.filter(k => !categorizedKeys.includes(k));
        if (uncategorized.length > 0) {
            result['Other Configuration'] = uncategorized;
        }

        return result;
    }

    // Interactive mode
    async runInteractiveMode() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (text) => new Promise(resolve => rl.question(text, resolve));

        const { missing } = this.findMissingKeys();
        
        console.log(`\n🔧 Interactive Configuration Mode`);
        console.log(`Found ${missing.length} missing configuration keys.\n`);

        const keysByCategory = this.groupKeysByCategory(missing);
        const selectedKeys = [];

        for (const [category, keys] of Object.entries(keysByCategory)) {
            console.log(`\n📁 ${category} (${keys.length} keys)`);
            const addCategory = await question(`Add all keys from this category? [y/N]: `);
            
            if (addCategory.toLowerCase() === 'y') {
                selectedKeys.push(...keys);
                console.log(`✅ Added ${keys.length} keys from ${category}`);
            } else {
                console.log(`Keys in this category:`);
                keys.forEach(key => console.log(`  - ${key}`));
                
                for (const key of keys) {
                    const defaultValue = this.keyDefaults[key] || 'your_value_here';
                    const addKey = await question(`Add ${key}=${defaultValue}? [y/N]: `);
                    if (addKey.toLowerCase() === 'y') {
                        selectedKeys.push(key);
                    }
                }
            }
        }

        if (selectedKeys.length > 0) {
            console.log(`\n📝 Summary: Adding ${selectedKeys.length} keys to .env file`);
            const confirm = await question(`Proceed? [y/N]: `);
            
            if (confirm.toLowerCase() === 'y') {
                this.createBackup();
                this.addMissingKeys(selectedKeys);
                console.log(`\n✅ Configuration updated successfully!`);
                console.log(`💡 Remember to update the placeholder values with your actual API keys and settings.`);
            }
        } else {
            console.log(`\n⚠️ No keys selected for addition.`);
        }

        rl.close();
    }

    // Generate configuration report
    generateReport() {
        const { missing, existing } = this.findMissingKeys();
        const { envVars } = this.readEnvFile();
        
        console.log('\n📊 CONFIGURATION ANALYSIS REPORT');
        console.log('═'.repeat(80));
        console.log(`Total .env keys: ${Object.keys(envVars).length}`);
        console.log(`Missing keys: ${missing.length}`);
        console.log(`Keys from missing list already present: ${existing.length}`);
        console.log(`Configuration completeness: ${Math.round((existing.length / this.missingKeys.length) * 100)}%`);
        
        if (missing.length > 0) {
            console.log('\n❌ MISSING KEYS:');
            const keysByCategory = this.groupKeysByCategory(missing);
            Object.entries(keysByCategory).forEach(([category, keys]) => {
                console.log(`\n📁 ${category} (${keys.length} keys):`);
                keys.forEach(key => {
                    const defaultValue = this.keyDefaults[key] || 'your_value_here';
                    console.log(`  - ${key}=${defaultValue}`);
                });
            });
        }

        if (existing.length > 0) {
            console.log('\n✅ ALREADY CONFIGURED:');
            existing.forEach(key => {
                const value = envVars[key];
                const maskedValue = this.maskSensitiveValue(key, value);
                console.log(`  - ${key}=${maskedValue}`);
            });
        }

        console.log('\n💡 RECOMMENDATIONS:');
        console.log('  1. Start with essential keys: SPOTIFY_*, OPENAI_API_KEY, SESSION_SECRET, JWT_SECRET');
        console.log('  2. Add database configuration: MONGODB_* or DATABASE_URL');
        console.log('  3. Configure SSL for production: SSL_* keys');  
        console.log('  4. Add monitoring and analytics: MCP_*, ANALYTICS_*');
        console.log('  5. Use: npm run validate:api-keys to test your configuration');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('  - Run: node scripts/update-env-config.js --add-missing');
        console.log('  - Or: node scripts/update-env-config.js --interactive');
        console.log('  - Then: npm run validate:api-keys');
    }

    // Mask sensitive values in output
    maskSensitiveValue(key, value) {
        if (key.includes('') || key.includes('TOKEN') || key.includes('API_KEY') || key.includes('PASSWORD')) {
            if (value.length > 8) {
                return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
            }
            return '*'.repeat(value.length);
        }
        return value;
    }
}

// CLI interface
async function main() {
    const updater = new EnvironmentConfigUpdater();
    const args = process.argv.slice(2);

    console.log('🔧 EchoTune AI Environment Configuration Updater');
    console.log('═'.repeat(60));

    try {
        if (args.includes('--add-missing')) {
            const { missing } = updater.findMissingKeys();
            if (missing.length === 0) {
                updater.log('No missing keys found! Your configuration is complete.', 'success');
                return;
            }

            if (args.includes('--backup')) {
                updater.createBackup();
            }

            const dryRun = args.includes('--dry-run');
            updater.addMissingKeys(missing, dryRun);
            
            if (!dryRun) {
                updater.log('💡 Remember to update placeholder values with your actual API keys!', 'warning');
                console.log('\nNext steps:');
                console.log('1. Edit .env file and replace placeholder values');
                console.log('2. Run: npm run validate:api-keys');
                console.log('3. Review: API_SECRETS_CONFIGURATION_GUIDE.md for API key sources');
            }

        } else if (args.includes('--interactive')) {
            await updater.runInteractiveMode();

        } else {
            updater.generateReport();
            console.log('\nUsage:');
            console.log('  --add-missing     Add all missing keys with default values');
            console.log('  --interactive     Interactive mode to select keys');
            console.log('  --backup         Create backup before modifying');
            console.log('  --dry-run        Show what would be added');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Handle CLI execution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Configuration update failed:', error);
        process.exit(1);
    });
}

module.exports = EnvironmentConfigUpdater;