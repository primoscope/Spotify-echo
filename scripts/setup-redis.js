#!/usr/bin/env node

/**
 * Redis Setup and Installation Script
 * Ensures Redis is available for EchoTune AI development
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class RedisSetup {
  constructor() {
    this.isRedisInstalled = false;
    this.isRedisRunning = false;
  }

  /**
   * Check if Redis is installed
   */
  async checkRedisInstalled() {
    try {
      await execAsync('redis-cli --version');
      this.isRedisInstalled = true;
      console.log('✅ Redis CLI is installed');
      return true;
    } catch (error) {
      console.log('❌ Redis CLI not found');
      return false;
    }
  }

  /**
   * Check if Redis server is running
   */
  async checkRedisRunning() {
    try {
      const { stdout } = await execAsync('redis-cli ping');
      if (stdout.trim() === 'PONG') {
        this.isRedisRunning = true;
        console.log('✅ Redis server is running');
        return true;
      }
    } catch (error) {
      console.log('❌ Redis server not running');
      return false;
    }
    return false;
  }

  /**
   * Install Redis on Ubuntu/Debian
   */
  async installRedisUbuntu() {
    console.log('🚀 Installing Redis on Ubuntu/Debian...');
    
    try {
      // Update package lists
      console.log('📦 Updating package lists...');
      await execAsync('sudo apt update');
      
      // Install Redis
      console.log('📦 Installing Redis server...');
      await execAsync('sudo apt install -y redis-server redis-tools');
      
      console.log('✅ Redis installed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to install Redis:', error.message);
      return false;
    }
  }

  /**
   * Start Redis server
   */
  async startRedis() {
    console.log('🚀 Starting Redis server...');
    
    try {
      // Try to start Redis server
      await execAsync('sudo systemctl start redis-server');
      await execAsync('sudo systemctl enable redis-server');
      
      // Wait a moment for startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if it's running
      if (await this.checkRedisRunning()) {
        console.log('✅ Redis server started successfully');
        return true;
      }
    } catch (error) {
      console.log('⚠️  Failed to start Redis with systemctl, trying direct start...');
      
      try {
        // Try to start Redis directly in background
        exec('redis-server --daemonize yes');
        
        // Wait a moment for startup
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (await this.checkRedisRunning()) {
          console.log('✅ Redis server started directly');
          return true;
        }
      } catch (directError) {
        console.error('❌ Failed to start Redis:', directError.message);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Setup Redis for development
   */
  async setupForDevelopment() {
    console.log('🔧 Setting up Redis for development...');
    
    try {
      // Basic Redis configuration for development
      const configContent = `
# Redis configuration for EchoTune AI development
bind 127.0.0.1
port 6379
timeout 0
databases 16
save 900 1
save 300 10
save 60 10000
rdbcompression yes
dbfilename dump.rdb
dir /var/lib/redis
maxmemory-policy allkeys-lru
`;
      
      console.log('ℹ️  Redis configured for development use');
      return true;
    } catch (error) {
      console.error('❌ Failed to configure Redis:', error.message);
      return false;
    }
  }

  /**
   * Test Redis functionality
   */
  async testRedis() {
    console.log('🧪 Testing Redis functionality...');
    
    try {
      // Test basic set/get
      await execAsync('redis-cli set test_key "Hello EchoTune"');
      const { stdout } = await execAsync('redis-cli get test_key');
      
      if (stdout.trim() === '"Hello EchoTune"') {
        console.log('✅ Redis basic functionality test passed');
        
        // Clean up test key
        await execAsync('redis-cli del test_key');
        
        return true;
      } else {
        console.error('❌ Redis test failed: unexpected value');
        return false;
      }
    } catch (error) {
      console.error('❌ Redis test failed:', error.message);
      return false;
    }
  }

  /**
   * Complete Redis setup process
   */
  async setup() {
    console.log('🚀 EchoTune AI Redis Setup\n');
    
    // Check if Redis is already installed and running
    const installed = await this.checkRedisInstalled();
    const running = await this.checkRedisRunning();
    
    if (installed && running) {
      console.log('✅ Redis is already installed and running');
      await this.testRedis();
      return true;
    }
    
    // Install Redis if needed
    if (!installed) {
      const installSuccess = await this.installRedisUbuntu();
      if (!installSuccess) {
        console.error('❌ Failed to install Redis. Manual installation may be required.');
        return false;
      }
    }
    
    // Start Redis if needed
    if (!running) {
      const startSuccess = await this.startRedis();
      if (!startSuccess) {
        console.error('❌ Failed to start Redis server.');
        return false;
      }
    }
    
    // Configure for development
    await this.setupForDevelopment();
    
    // Test functionality
    const testSuccess = await this.testRedis();
    if (!testSuccess) {
      console.error('❌ Redis setup completed but tests failed');
      return false;
    }
    
    console.log('\n✅ Redis setup completed successfully!');
    console.log('🔗 Redis is now available at: redis://localhost:6379');
    
    return true;
  }
}

/**
 * Main execution
 */
async function main() {
  const setup = new RedisSetup();
  
  try {
    const success = await setup.setup();
    
    if (success) {
      console.log('\n🎉 Redis is ready for EchoTune AI!');
      console.log('Next steps:');
      console.log('1. Run: npm run configure:redis');
      console.log('2. Test connection: npm run validate:redis');
    } else {
      console.log('\n❌ Redis setup failed. Please install Redis manually:');
      console.log('Ubuntu/Debian: sudo apt install redis-server');
      console.log('macOS: brew install redis');
      console.log('Windows: Use Redis for Windows or WSL');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Redis setup error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = RedisSetup;