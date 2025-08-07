#!/usr/bin/env node

/**
 * Interactive Authentication Wizard
 * Guides users through setting up all required API keys and server authentications
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AuthWizard {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.credentials = {};
        this.envPath = path.join(__dirname, '..', '.env');
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async setupDigitalOcean() {
        this.log('\n🌊 DigitalOcean Setup', 'info');
        this.log('Get your token from: https://cloud.digitalocean.com/account/api/tokens', 'info');
        
        const token = await this.question('Enter your DigitalOcean API token: ');
        const email = await this.question('Enter your DigitalOcean account email: ');
        
        if (token && email) {
            this.credentials.DIGITALOCEAN_TOKEN = token;
            this.credentials.DIGITALOCEAN_EMAIL = email;
            
            try {
                // Test authentication
                execSync(`doctl auth init --access-token ${token}`, { stdio: 'ignore' });
                const account = execSync('doctl account get', { encoding: 'utf8' });
                this.log('✅ DigitalOcean authentication successful!', 'success');
                
                // Test registry login
                execSync(`echo "${token}" | docker login registry.digitalocean.com --username "${email}" --password-stdin`, { stdio: 'ignore' });
                this.log('✅ DigitalOcean Container Registry login successful!', 'success');
                
            } catch (error) {
                this.log('❌ DigitalOcean authentication failed. Please check your token.', 'error');
            }
        }
    }

    async setupDockerHub() {
        this.log('\n🐳 Docker Hub Setup', 'info');
        this.log('Optional: Configure Docker Hub for public container registry', 'info');
        
        const setup = await this.question('Setup Docker Hub? (y/n): ');
        if (setup.toLowerCase() === 'y') {
            const username = await this.question('Docker Hub username: ');
            const password = await this.question('Docker Hub password/token: ');
            
            if (username && password) {
                this.credentials.DOCKER_USERNAME = username;
                this.credentials.DOCKER_PASSWORD = password;
                
                try {
                    execSync(`echo "${password}" | docker login --username "${username}" --password-stdin`, { stdio: 'ignore' });
                    this.log('✅ Docker Hub login successful!', 'success');
                } catch (error) {
                    this.log('❌ Docker Hub login failed.', 'error');
                }
            }
        }
    }

    async setupGitHub() {
        this.log('\n😺 GitHub Container Registry Setup', 'info');
        this.log('Create token at: https://github.com/settings/tokens (needs packages:read, packages:write)', 'info');
        
        const setup = await this.question('Setup GitHub Container Registry? (y/n): ');
        if (setup.toLowerCase() === 'y') {
            const username = await this.question('GitHub username: ');
            const token = await this.question('GitHub personal access token: ');
            
            if (username && token) {
                this.credentials.GITHUB_USERNAME = username;
                this.credentials.GITHUB_TOKEN = token;
                
                try {
                    execSync(`echo "${token}" | docker login ghcr.io --username "${username}" --password-stdin`, { stdio: 'ignore' });
                    this.log('✅ GitHub Container Registry login successful!', 'success');
                } catch (error) {
                    this.log('❌ GitHub Container Registry login failed.', 'error');
                }
            }
        }
    }

    async setupSpotify() {
        this.log('\n🎵 Spotify API Setup', 'info');
        this.log('Create app at: https://developer.spotify.com/dashboard/', 'info');
        
        const clientId = await this.question('Spotify Client ID: ');
        const clientSecret = await this.question('Spotify Client Secret: ');
        const redirectUri = await this.question('Redirect URI (e.g., https://yourdomain.com/auth/callback): ');
        
        if (clientId && clientSecret && redirectUri) {
            this.credentials.SPOTIFY_CLIENT_ID = clientId;
            this.credentials.SPOTIFY_CLIENT_SECRET = clientSecret;
            this.credentials.SPOTIFY_REDIRECT_URI = redirectUri;
        }
    }

    async setupAI() {
        this.log('\n🤖 AI Provider Setup', 'info');
        
        const openai = await this.question('OpenAI API Key (sk-...): ');
        if (openai) {
            this.credentials.OPENAI_API_KEY = openai;
        }
        
        const gemini = await this.question('Google Gemini API Key (AIza...): ');
        if (gemini) {
            this.credentials.GEMINI_API_KEY = gemini;
        }
    }

    async setupDatabase() {
        this.log('\n📊 Database Setup', 'info');
        
        const mongodb = await this.question('MongoDB URI (mongodb+srv://...): ');
        if (mongodb) {
            this.credentials.MONGODB_URI = mongodb;
        }
        
        const supabaseUrl = await this.question('Supabase URL (optional): ');
        const supabaseKey = await this.question('Supabase Anon Key (optional): ');
        if (supabaseUrl && supabaseKey) {
            this.credentials.SUPABASE_URL = supabaseUrl;
            this.credentials.SUPABASE_ANON_KEY = supabaseKey;
        }
    }

    async saveCredentials() {
        let envContent = '';
        
        // Read existing .env if it exists
        if (fs.existsSync(this.envPath)) {
            envContent = fs.readFileSync(this.envPath, 'utf8');
        }
        
        // Update or add new credentials
        Object.entries(this.credentials).forEach(([key, value]) => {
            if (value) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                if (envContent.match(regex)) {
                    envContent = envContent.replace(regex, `${key}=${value}`);
                } else {
                    envContent += `\n${key}=${value}`;
                }
            }
        });
        
        // Write back to .env
        fs.writeFileSync(this.envPath, envContent);
        this.log('\n✅ Credentials saved to .env file', 'success');
    }

    async testAll() {
        this.log('\n🧪 Running comprehensive tests...', 'info');
        
        try {
            execSync('npm run test:servers', { stdio: 'inherit', cwd: path.dirname(this.envPath) });
            execSync('npm run validate:api-keys', { stdio: 'inherit', cwd: path.dirname(this.envPath) });
        } catch (error) {
            this.log('Some tests failed. Check the reports for details.', 'warning');
        }
    }

    async run() {
        this.log('🚀 EchoTune AI Authentication Wizard', 'info');
        this.log('This wizard will help you configure all required API keys and authentication.', 'info');
        
        const start = await this.question('\nReady to begin? (y/n): ');
        if (start.toLowerCase() !== 'y') {
            this.log('Setup cancelled.', 'warning');
            this.rl.close();
            return;
        }
        
        try {
            await this.setupDigitalOcean();
            await this.setupDockerHub();
            await this.setupGitHub();
            await this.setupSpotify();
            await this.setupAI();
            await this.setupDatabase();
            
            await this.saveCredentials();
            
            const testNow = await this.question('\nRun tests now? (y/n): ');
            if (testNow.toLowerCase() === 'y') {
                await this.testAll();
            }
            
            this.log('\n🎉 Authentication setup complete!', 'success');
            this.log('Next steps:', 'info');
            this.log('1. Run: npm run test:servers', 'info');
            this.log('2. Run: npm start', 'info');
            this.log('3. Visit: http://localhost:3000', 'info');
            
        } catch (error) {
            this.log(`Error during setup: ${error.message}`, 'error');
        }
        
        this.rl.close();
    }
}

// Run if called directly
if (require.main === module) {
    const wizard = new AuthWizard();
    wizard.run().catch(console.error);
}

module.exports = AuthWizard;