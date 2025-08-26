/**
 * Feature Flags System for EchoTune AI
 * Enables gradual rollouts and A/B testing
 */
class FeatureFlagManager {
  constructor(options = {}) {
    this.flags = new Map();
    this.providers = [];
    this.cache = new Map();
    this.cacheTTL = options.cacheTimeout || 300000; // 5 minutes default
    this.enableLogging = options.enableLogging !== false;
  }

  /**
   * Register a feature flag provider
   * @param {Object} provider - Feature flag provider
   */
  addProvider(provider) {
    this.providers.push(provider);
  }

  /**
   * Define a feature flag with default configuration
   * @param {string} name - Flag name
   * @param {Object} config - Flag configuration
   */
  defineFlag(name, config = {}) {
    const flagConfig = {
      name,
      enabled: config.enabled || false,
      rolloutPercentage: config.rolloutPercentage || 0,
      conditions: config.conditions || [],
      variants: config.variants || { control: 50, treatment: 50 },
      dependencies: config.dependencies || [],
      ...config
    };

    this.flags.set(name, flagConfig);
    
    if (this.enableLogging) {
      console.log(`✅ Feature flag '${name}' defined:`, flagConfig);
    }
  }

  /**
   * Check if a feature flag is enabled for a user/context
   * @param {string} flagName - Flag name
   * @param {Object} context - Evaluation context (user, request, etc.)
   * @returns {Promise<boolean>}
   */
  async isEnabled(flagName, context = {}) {
    const cacheKey = `${flagName}:${JSON.stringify(context)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.value;
      }
    }

    let enabled = false;

    try {
      // Check local flag definition first
      if (this.flags.has(flagName)) {
        enabled = await this._evaluateLocalFlag(flagName, context);
      }

      // Check external providers
      for (const provider of this.providers) {
        if (provider.hasFlag && await provider.hasFlag(flagName)) {
          enabled = await provider.isEnabled(flagName, context);
          break;
        }
      }

      // Cache result
      this.cache.set(cacheKey, {
        value: enabled,
        timestamp: Date.now()
      });

      if (this.enableLogging) {
        console.log(`🏁 Feature flag '${flagName}' evaluated: ${enabled}`, context);
      }

    } catch (error) {
      console.error(`❌ Error evaluating feature flag '${flagName}':`, error);
      enabled = false;
    }

    return enabled;
  }

  /**
   * Get the variant for a feature flag
   * @param {string} flagName - Flag name
   * @param {Object} context - Evaluation context
   * @returns {Promise<string>}
   */
  async getVariant(flagName, context = {}) {
    const isEnabled = await this.isEnabled(flagName, context);
    if (!isEnabled) {
      return 'control';
    }

    const flag = this.flags.get(flagName);
    if (!flag || !flag.variants) {
      return 'treatment';
    }

    // Simple hash-based variant assignment
    const hash = this._hashContext(context);
    const variants = Object.entries(flag.variants);
    let cumulativeWeight = 0;
    const hashValue = hash % 100;

    for (const [variant, weight] of variants) {
      cumulativeWeight += weight;
      if (hashValue < cumulativeWeight) {
        return variant;
      }
    }

    return 'control';
  }

  /**
   * Evaluate local flag configuration
   * @private
   */
  async _evaluateLocalFlag(flagName, context) {
    const flag = this.flags.get(flagName);
    if (!flag) {
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check dependencies
    if (flag.dependencies.length > 0) {
      for (const dependency of flag.dependencies) {
        if (!(await this.isEnabled(dependency, context))) {
          return false;
        }
      }
    }

    // Check conditions
    if (flag.conditions.length > 0) {
      for (const condition of flag.conditions) {
        if (!(await this._evaluateCondition(condition, context))) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this._hashContext(context);
      return (hash % 100) < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Evaluate a condition against context
   * @private
   */
  async _evaluateCondition(condition, context) {
    const { type, property, operator, value } = condition;

    if (type === 'user') {
      const userValue = context.user?.[property];
      return this._compareValues(userValue, operator, value);
    }

    if (type === 'request') {
      const requestValue = context.request?.[property];
      return this._compareValues(requestValue, operator, value);
    }

    if (type === 'environment') {
      const envValue = process.env[property];
      return this._compareValues(envValue, operator, value);
    }

    return false;
  }

  /**
   * Compare values using an operator
   * @private
   */
  _compareValues(actual, operator, expected) {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return Array.isArray(actual) ? actual.includes(expected) : String(actual).includes(expected);
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'regex':
        return new RegExp(expected).test(String(actual));
      default:
        return false;
    }
  }

  /**
   * Create a hash from context for consistent assignment
   * @private
   */
  _hashContext(context) {
    const key = context.userId || context.sessionId || context.ip || 'anonymous';
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get all defined flags
   */
  getAllFlags() {
    return Array.from(this.flags.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  /**
   * Export flag configuration
   */
  exportConfig() {
    const flags = {};
    for (const [name, config] of this.flags) {
      flags[name] = { ...config };
    }
    return flags;
  }

  /**
   * Import flag configuration
   */
  importConfig(config) {
    for (const [name, flagConfig] of Object.entries(config)) {
      this.defineFlag(name, flagConfig);
    }
  }
}

/**
 * Environment-based feature flag provider
 */
class EnvironmentProvider {
  async hasFlag(flagName) {
    return process.env[`FEATURE_${flagName.toUpperCase()}`] !== undefined;
  }

  async isEnabled(flagName, context) {
    const envVar = `FEATURE_${flagName.toUpperCase()}`;
    const value = process.env[envVar];
    
    if (value === 'true' || value === '1') {
      return true;
    }
    
    // Support percentage rollout via environment
    const percentage = parseInt(value, 10);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      const hash = this._hashContext(context);
      return (hash % 100) < percentage;
    }
    
    return false;
  }

  _hashContext(context) {
    const key = context.userId || context.sessionId || context.ip || 'anonymous';
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Global feature flag manager
const globalFeatureFlags = new FeatureFlagManager();

// Add environment provider
globalFeatureFlags.addProvider(new EnvironmentProvider());

/**
 * Configure default feature flags for EchoTune AI
 */
function configureDefaultFlags() {
  // Real-time features
  globalFeatureFlags.defineFlag('realtime_chat', {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Enable real-time chat features'
  });

  // Enhanced MCP features
  globalFeatureFlags.defineFlag('enhanced_mcp', {
    enabled: true,
    rolloutPercentage: 50,
    description: 'Enable enhanced MCP capabilities'
  });

  // New UI components
  globalFeatureFlags.defineFlag('new_ui_components', {
    enabled: false,
    rolloutPercentage: 10,
    description: 'Enable new UI components',
    variants: { control: 70, treatment_a: 15, treatment_b: 15 }
  });

  // Advanced analytics
  globalFeatureFlags.defineFlag('advanced_analytics', {
    enabled: true,
    rolloutPercentage: 75,
    conditions: [
      { type: 'environment', property: 'NODE_ENV', operator: 'not_equals', value: 'test' }
    ],
    description: 'Enable advanced analytics and monitoring'
  });

  // Experimental features
  globalFeatureFlags.defineFlag('experimental_recommendations', {
    enabled: false,
    rolloutPercentage: 5,
    description: 'Enable experimental recommendation algorithms'
  });

  // Performance optimizations
  globalFeatureFlags.defineFlag('performance_optimizations', {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Enable performance optimizations'
  });
}

/**
 * Get the global feature flag manager
 */
function getFeatureFlags() {
  return globalFeatureFlags;
}

/**
 * Express middleware for feature flags
 */
function featureFlagMiddleware() {
  return (req, res, next) => {
    req.featureFlags = globalFeatureFlags;
    req.isFeatureEnabled = (flagName, context = {}) => {
      const evalContext = {
        userId: req.user?.id,
        sessionId: req.sessionID,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        ...context
      };
      return globalFeatureFlags.isEnabled(flagName, evalContext);
    };
    next();
  };
}

module.exports = {
  FeatureFlagManager,
  EnvironmentProvider,
  getFeatureFlags,
  configureDefaultFlags,
  featureFlagMiddleware
};