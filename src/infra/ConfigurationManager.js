/**
 * Configuration Management Service
 * 
 * Centralized configuration management with environment-aware settings,
 * validation, hot-reloading, and distributed configuration support
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class ConfigurationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = new Map(); // Configuration store
    this.watchers = new Map(); // File watchers
    this.validators = new Map(); // Configuration validators
    this.transformers = new Map(); // Configuration transformers
    this.environment = process.env.NODE_ENV || 'development';
    this.configPaths = options.configPaths || [
      path.join(process.cwd(), 'config'),
      path.join(process.cwd(), '.config'),
      path.join(process.cwd())
    ];
    this.hotReload = options.hotReload !== false;
    this.encryptionKey = options.encryptionKey || process.env.CONFIG_ENCRYPTION_KEY;
    this.remoteConfig = options.remoteConfig;
    this.initialized = false;
  }

  /**
   * Initialize configuration manager
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration files
      await this.loadConfigurations();
      
      // Setup file watchers for hot reload
      if (this.hotReload) {
        await this.setupFileWatchers();
      }

      // Load remote configuration if configured
      if (this.remoteConfig) {
        await this.loadRemoteConfiguration();
      }

      this.initialized = true;
      console.log('⚙️ Configuration manager initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Configuration manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load all configuration files
   */
  async loadConfigurations() {
    const configFiles = [
      'default.json',
      'default.js',
      `${this.environment}.json`,
      `${this.environment}.js`,
      'local.json',
      'local.js',
      '.env',
      '.env.local',
      `.env.${this.environment}`
    ];

    for (const configPath of this.configPaths) {
      for (const configFile of configFiles) {
        const fullPath = path.join(configPath, configFile);
        await this.loadConfigurationFile(fullPath);
      }
    }

    // Load environment variables
    this.loadEnvironmentVariables();
    
    // Apply transformations
    this.applyTransformations();
    
    // Validate configuration
    await this.validateConfiguration();
  }

  /**
   * Load a specific configuration file
   */
  async loadConfigurationFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return;
      }

      const ext = path.extname(filePath);
      let config = {};

      if (ext === '.json') {
        const content = await fs.readFile(filePath, 'utf8');
        config = JSON.parse(content);
      } else if (ext === '.js') {
        // Clear require cache for hot reload
        delete require.cache[require.resolve(filePath)];
        config = require(filePath);
      } else if (filePath.includes('.env')) {
        config = await this.loadEnvFile(filePath);
      }

      // Merge configuration
      this.mergeConfiguration(config, path.basename(filePath));
      
      console.log(`⚙️ Loaded configuration: ${filePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`⚠️ Failed to load configuration file ${filePath}:`, error.message);
      }
    }
  }

  /**
   * Load environment file (.env format)
   */
  async loadEnvFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const config = {};
      
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            config[key.trim()] = value;
          }
        }
      });
      
      return config;
    } catch (error) {
      console.warn(`⚠️ Failed to load env file ${filePath}:`, error.message);
      return {};
    }
  }

  /**
   * Load environment variables
   */
  loadEnvironmentVariables() {
    const envConfig = {};
    
    // Copy all environment variables
    for (const [key, value] of Object.entries(process.env)) {
      envConfig[key] = value;
    }
    
    this.mergeConfiguration(envConfig, 'environment');
  }

  /**
   * Merge configuration into the main config store
   */
  mergeConfiguration(newConfig, source) {
    // Deep merge configuration
    const merged = this.deepMerge(this.configToObject(), newConfig);
    
    // Store in Map format for efficient access
    this.objectToConfig(merged);
    
    this.emit('configurationLoaded', { source, config: newConfig });
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Convert config Map to plain object
   */
  configToObject() {
    const obj = {};
    
    for (const [key, value] of this.config.entries()) {
      this.setNestedProperty(obj, key, value);
    }
    
    return obj;
  }

  /**
   * Convert plain object to config Map
   */
  objectToConfig(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.objectToConfig(value, fullKey);
      } else {
        this.config.set(fullKey, value);
      }
    }
  }

  /**
   * Set nested property in object
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = undefined) {
    if (this.config.has(key)) {
      return this.config.get(key);
    }

    // Try nested key access
    const value = this.getNestedValue(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get nested configuration value
   */
  getNestedValue(key) {
    const obj = this.configToObject();
    const keys = key.split('.');
    
    let current = obj;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Set configuration value
   */
  set(key, value) {
    const oldValue = this.config.get(key);
    this.config.set(key, value);
    
    if (oldValue !== value) {
      this.emit('configurationChanged', { key, value, oldValue });
    }
    
    return this;
  }

  /**
   * Check if configuration key exists
   */
  has(key) {
    return this.config.has(key) || this.getNestedValue(key) !== undefined;
  }

  /**
   * Get all configuration as object
   */
  getAll() {
    return this.configToObject();
  }

  /**
   * Register configuration validator
   */
  registerValidator(key, validator) {
    this.validators.set(key, validator);
    return this;
  }

  /**
   * Register configuration transformer
   */
  registerTransformer(key, transformer) {
    this.transformers.set(key, transformer);
    return this;
  }

  /**
   * Apply transformations to configuration
   */
  applyTransformations() {
    for (const [key, transformer] of this.transformers.entries()) {
      if (this.has(key)) {
        const value = this.get(key);
        const transformedValue = transformer(value);
        this.set(key, transformedValue);
      }
    }
  }

  /**
   * Validate configuration
   */
  async validateConfiguration() {
    const errors = [];
    
    for (const [key, validator] of this.validators.entries()) {
      try {
        const value = this.get(key);
        const isValid = await validator(value);
        
        if (!isValid) {
          errors.push(`Configuration validation failed for key: ${key}`);
        }
      } catch (error) {
        errors.push(`Configuration validation error for key ${key}: ${error.message}`);
      }
    }
    
    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      console.error('❌ Configuration validation failed:', errors);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Configuration validation passed');
  }

  /**
   * Setup file watchers for hot reload
   */
  async setupFileWatchers() {
    const configFiles = [];
    
    for (const configPath of this.configPaths) {
      try {
        const files = await fs.readdir(configPath);
        const relevantFiles = files.filter(file => 
          file.endsWith('.json') || 
          file.endsWith('.js') || 
          file.startsWith('.env')
        );
        
        relevantFiles.forEach(file => {
          configFiles.push(path.join(configPath, file));
        });
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
    
    for (const filePath of configFiles) {
      try {
        const { watch } = require('fs');
        const watcher = watch(filePath, async (eventType) => {
          if (eventType === 'change') {
            console.log(`⚙️ Configuration file changed: ${filePath}`);
            await this.reloadConfiguration();
          }
        });
        
        this.watchers.set(filePath, watcher);
      } catch (error) {
        console.warn(`⚠️ Failed to watch configuration file ${filePath}:`, error.message);
      }
    }
    
    console.log(`⚙️ File watchers setup for ${this.watchers.size} configuration files`);
  }

  /**
   * Reload configuration
   */
  async reloadConfiguration() {
    try {
      const oldConfig = this.configToObject();
      
      // Clear current configuration
      this.config.clear();
      
      // Reload all configurations
      await this.loadConfigurations();
      
      const newConfig = this.configToObject();
      
      console.log('⚙️ Configuration reloaded');
      this.emit('configurationReloaded', { oldConfig, newConfig });
    } catch (error) {
      console.error('❌ Configuration reload failed:', error);
      this.emit('configurationReloadError', error);
    }
  }

  /**
   * Load remote configuration
   */
  async loadRemoteConfiguration() {
    try {
      // This would integrate with external config services like Consul, etcd, etc.
      console.log('⚙️ Remote configuration support not implemented yet');
    } catch (error) {
      console.warn('⚠️ Remote configuration load failed:', error.message);
    }
  }

  /**
   * Get configuration schema (for validation and documentation)
   */
  getSchema() {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };
    
    // Generate schema from current configuration
    const config = this.configToObject();
    this.generateSchemaFromObject(config, schema.properties);
    
    return schema;
  }

  /**
   * Generate schema from configuration object
   */
  generateSchemaFromObject(obj, schemaProps) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        schemaProps[key] = { type: 'null' };
      } else if (typeof value === 'boolean') {
        schemaProps[key] = { type: 'boolean' };
      } else if (typeof value === 'number') {
        schemaProps[key] = { type: 'number' };
      } else if (typeof value === 'string') {
        schemaProps[key] = { type: 'string' };
      } else if (Array.isArray(value)) {
        schemaProps[key] = { type: 'array' };
      } else if (typeof value === 'object') {
        schemaProps[key] = {
          type: 'object',
          properties: {}
        };
        this.generateSchemaFromObject(value, schemaProps[key].properties);
      }
    }
  }

  /**
   * Export configuration to file
   */
  async exportConfiguration(filePath, format = 'json') {
    const config = this.configToObject();
    
    let content;
    if (format === 'json') {
      content = JSON.stringify(config, null, 2);
    } else if (format === 'yaml') {
      // Would need yaml library
      throw new Error('YAML export not implemented');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`⚙️ Configuration exported to: ${filePath}`);
  }

  /**
   * Get configuration statistics
   */
  getStatistics() {
    return {
      totalKeys: this.config.size,
      validators: this.validators.size,
      transformers: this.transformers.size,
      watchers: this.watchers.size,
      environment: this.environment,
      hotReload: this.hotReload,
      initialized: this.initialized,
      configPaths: this.configPaths
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Close file watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    
    // Clear configuration
    this.config.clear();
    this.validators.clear();
    this.transformers.clear();
    
    this.initialized = false;
    console.log('⚙️ Configuration manager cleaned up');
  }
}

// Default configuration manager instance
let defaultInstance = null;

/**
 * Get or create default configuration manager instance
 */
function getConfigurationManager(options) {
  if (!defaultInstance) {
    defaultInstance = new ConfigurationManager(options);
  }
  return defaultInstance;
}

/**
 * Initialize default configuration manager
 */
async function initializeConfiguration(options) {
  const manager = getConfigurationManager(options);
  await manager.initialize();
  return manager;
}

module.exports = {
  ConfigurationManager,
  getConfigurationManager,
  initializeConfiguration
};