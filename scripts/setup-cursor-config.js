const fs = require('fs');
const path = require('path');

class CursorConfigSetup {
  constructor() {
    this.rootDir = process.cwd();
    this.cursorDir = path.join(this.rootDir, '.cursor');
    this.rulesDir = path.join(this.cursorDir, 'rules');
  }

  async setup() {
    console.log('Setting up Cursor configuration...');

    this.createDirectories();
    await this.createConfigFiles();
    await this.verifyMCPServers();

    console.log('✅ Cursor configuration setup complete!');
  }

  createDirectories() {
    [this.cursorDir, this.rulesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  async createConfigFiles() {
    const configs = [
      { dest: '.cursor/rules/core.mdc' },
      { dest: '.cursor/rules/automation.mdc' },
      { dest: '.cursor/mcp.json' },
      { dest: '.cursorignore' }
    ];

    configs.forEach(config => {
      const destPath = path.join(this.rootDir, config.dest);
      if (!fs.existsSync(destPath)) {
        console.log(`📄 Missing config (please create): ${config.dest}`);
      }
    });
  }

  async verifyMCPServers() {
    console.log('🔍 Verifying MCP server environment...');
    const requiredEnvVars = ['PERPLEXITY_API_KEY'];
    const missing = requiredEnvVars.filter((k) => !process.env[k]);
    if (missing.length) {
      console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
      console.log('Please set these variables in your .env file');
    } else {
      console.log('✅ Required environment variables are set');
    }
  }
}

if (require.main === module) {
  const setup = new CursorConfigSetup();
  setup.setup().catch(console.error);
}

module.exports = CursorConfigSetup;