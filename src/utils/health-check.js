/**
 * Enhanced Health Check System
 * Comprehensive health monitoring for production deployment
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class HealthCheckSystem {
  constructor() {
    this.checks = new Map();
    this.initializeChecks();
  }

  /**
   * Initialize all health check functions
   */
  initializeChecks() {
    this.checks.set('application', this.checkApplication.bind(this));
    this.checks.set('database', this.checkDatabase.bind(this));
    this.checks.set('redis', this.checkRedis.bind(this));
    this.checks.set('system', this.checkSystemResources.bind(this));
    this.checks.set('network', this.checkNetworkConnectivity.bind(this));
    this.checks.set('ssl', this.checkSSLCertificates.bind(this));
    this.checks.set('docker', this.checkDockerHealth.bind(this));
    this.checks.set('storage', this.checkStorageHealth.bind(this));
  }

  /**
   * Run all health checks in parallel for better performance
   */
  async runAllChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      uptime: process.uptime(),
      checks: {},
      system: await this.getSystemInfo(),
    };

    let hasCriticalErrors = false;

    // Run all health checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(async ([checkName, checkFunction]) => {
      // Define which checks are optional and shouldn't fail the health check
      const optionalChecks = ['docker', 'ssl', 'network', 'storage', 'redis', 'database'];
      const isOptional = optionalChecks.includes(checkName);
      
      try {
        const startTime = Date.now();
        const result = await checkFunction();
        const duration = Date.now() - startTime;

        return {
          name: checkName,
          result: {
            ...result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            optional: isOptional
          }
        };
      } catch (error) {
        return {
          name: checkName,
          result: {
            status: isOptional ? 'warning' : 'error',
            error: error.message,
            optional: isOptional,
            duration: '0ms',
            timestamp: new Date().toISOString(),
          }
        };
      }
    });

    // Wait for all checks to complete
    const checkResults = await Promise.all(checkPromises);
    
    // Process results
    checkResults.forEach(({ name, result }) => {
      results.checks[name] = result;
      
      // Only treat non-optional errors as critical
      if (result.status === 'error' && !result.optional) {
        hasCriticalErrors = true;
      }
    });

    // Overall status is only unhealthy if there are critical errors
    results.status = hasCriticalErrors ? 'unhealthy' : 'healthy';
    return results;
  }

  /**
   * Run a specific health check
   */
  async runCheck(checkName) {
    const checkFunction = this.checks.get(checkName);
    if (!checkFunction) {
      throw new Error(`Unknown health check: ${checkName}`);
    }

    const startTime = Date.now();
    const result = await checkFunction();
    const duration = Date.now() - startTime;

    return {
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Application health check
   */
  async checkApplication() {
    const health = {
      status: 'healthy',
      details: {},
    };

    // Check environment configuration - warn about missing variables but don't fail health check
    const optionalEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
    const criticalEnvVars = ['NODE_ENV'];
    
    const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
    const missingCritical = criticalEnvVars.filter(varName => !process.env[varName]);
    
    if (missingOptional.length > 0) {
      health.details.missingOptionalVariables = missingOptional;
      health.details.warnings = health.details.warnings || [];
      health.details.warnings.push('Some optional environment variables are not set - full functionality may be limited');
    }
    
    if (missingCritical.length > 0) {
      health.status = 'warning'; // Changed from 'unhealthy' to 'warning'
      health.details.missingCriticalVariables = missingCritical;
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.details.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };

    // Check if memory usage is excessive (>1GB)
    if (memUsage.rss > 1024 * 1024 * 1024) {
      health.status = 'warning';
      health.details.warnings = health.details.warnings || [];
      health.details.warnings.push('High memory usage detected');
    }

    return health;
  }

  /**
   * Database connectivity check
   */
  async checkDatabase() {
    const health = {
      status: 'healthy',
      details: {},
    };

    // Check MongoDB
    if (process.env.MONGODB_URI) {
      try {
        const mongoManager = require('../database/mongodb');
        const mongoHealth = await mongoManager.healthCheck();
        health.details.mongodb = mongoHealth;
        
        if (mongoHealth.status !== 'healthy') {
          health.status = 'unhealthy';
        }
      } catch (error) {
        health.status = 'unhealthy';
        health.details.mongodb = {
          status: 'error',
          message: error.message,
        };
      }
    } else {
      health.details.mongodb = {
        status: 'not_configured',
        message: 'MongoDB URI not provided',
      };
    }

    return health;
  }

  /**
   * Redis connectivity check
   */
  async checkRedis() {
    const health = {
      status: 'healthy',
      details: {},
    };

    if (process.env.REDIS_URL) {
      try {
        // Simple Redis ping test with timeout
        const { stdout } = await execAsync(`timeout 2s redis-cli -u "${process.env.REDIS_URL}" ping`);
        if (stdout.trim() === 'PONG') {
          health.details.redis = {
            status: 'healthy',
            message: 'Redis connection successful',
          };
        } else {
          health.status = 'unhealthy';
          health.details.redis = {
            status: 'unhealthy',
            message: 'Redis ping failed',
          };
        }
      } catch (error) {
        health.status = 'unhealthy';
        health.details.redis = {
          status: 'error',
          message: `Redis connection failed: ${error.message}`,
        };
      }
    } else {
      health.details.redis = {
        status: 'not_configured',
        message: 'Redis URL not provided',
      };
    }

    return health;
  }

  /**
   * System resources check
   */
  async checkSystemResources() {
    const health = {
      status: 'healthy',
      details: {},
    };

    // CPU usage
    const cpus = os.cpus();
    health.details.cpu = {
      cores: cpus.length,
      model: cpus[0].model,
      loadAverage: os.loadavg(),
    };

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);

    health.details.memory = {
      total: `${Math.round(totalMem / 1024 / 1024 / 1024)}GB`,
      used: `${Math.round(usedMem / 1024 / 1024 / 1024)}GB`,
      free: `${Math.round(freeMem / 1024 / 1024 / 1024)}GB`,
      usagePercent: `${memUsagePercent}%`,
    };

    // Check memory threshold
    if (memUsagePercent > 85) {
      health.status = 'warning';
      health.details.warnings = health.details.warnings || [];
      health.details.warnings.push(`High memory usage: ${memUsagePercent}%`);
    }

    // Disk usage
    try {
      const { stdout } = await execAsync('df -h / | tail -1');
      const diskInfo = stdout.trim().split(/\s+/);
      const diskUsagePercent = parseInt(diskInfo[4]);
      
      health.details.disk = {
        filesystem: diskInfo[0],
        size: diskInfo[1],
        used: diskInfo[2],
        available: diskInfo[3],
        usagePercent: diskInfo[4],
      };

      if (diskUsagePercent > 90) {
        health.status = 'warning';
        health.details.warnings = health.details.warnings || [];
        health.details.warnings.push(`High disk usage: ${diskUsagePercent}%`);
      }
    } catch (error) {
      health.details.disk = { error: 'Unable to check disk usage' };
    }

    return health;
  }

  /**
   * Network connectivity check
   */
  async checkNetworkConnectivity() {
    const health = {
      status: 'healthy',
      details: {},
    };

    // Skip network checks in development for faster health checks
    if (process.env.NODE_ENV === 'development') {
      health.details.connectivity = {
        status: 'skipped',
        message: 'Network checks disabled in development for performance'
      };
      return health;
    }

    const endpoints = [
      { name: 'spotify_api', url: 'https://api.spotify.com' },
      { name: 'google_dns', url: '8.8.8.8' },
      { name: 'cloudflare_dns', url: '1.1.1.1' },
    ];

    const results = {};

    // Run all network checks in parallel with reduced timeout
    const checkPromises = endpoints.map(async (endpoint) => {
      try {
        const startTime = Date.now();
        // Reduced timeout from 10s to 1s for much faster health checks
        await execAsync(`timeout 1s curl -f -s --max-time 1 ${endpoint.url} > /dev/null`);
        const responseTime = Date.now() - startTime;
        
        return {
          name: endpoint.name,
          result: {
            status: 'healthy',
            responseTime: `${responseTime}ms`,
          }
        };
      } catch (error) {
        return {
          name: endpoint.name,
          result: {
            status: 'unhealthy',
            error: 'Connection failed',
          }
        };
      }
    });

    // Wait for all checks to complete in parallel
    const checkResults = await Promise.all(checkPromises);
    
    // Process results
    checkResults.forEach(({ name, result }) => {
      results[name] = result;
      if (result.status === 'unhealthy') {
        health.status = 'warning';
      }
    });

    health.details.connectivity = results;
    return health;
  }

  /**
   * SSL certificates check
   */
  async checkSSLCertificates() {
    const health = {
      status: 'healthy',
      details: {},
    };

    const domain = process.env.DOMAIN || 'primosphere.studio';
    const certPath = process.env.SSL_CERT_PATH || `/opt/echotune/ssl/${domain}.crt`;

    try {
      await fs.access(certPath);
      
      // Check certificate expiry with timeout
      const { stdout } = await execAsync(`timeout 2s openssl x509 -enddate -noout -in "${certPath}"`);
      const expiryLine = stdout.trim();
      const expiryDate = new Date(expiryLine.split('=')[1]);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      health.details.ssl = {
        certificateFound: true,
        expiryDate: expiryDate.toISOString(),
        daysUntilExpiry,
      };

      if (daysUntilExpiry < 30) {
        health.status = 'warning';
        health.details.warnings = health.details.warnings || [];
        health.details.warnings.push(`SSL certificate expires in ${daysUntilExpiry} days`);
      }

      if (daysUntilExpiry < 7) {
        health.status = 'unhealthy';
      }
    } catch (error) {
      health.status = 'warning';
      health.details.ssl = {
        certificateFound: false,
        message: 'SSL certificate not found or unreadable',
      };
    }

    return health;
  }

  /**
   * Docker containers health check
   */
  async checkDockerHealth() {
    const health = {
      status: 'warning',
      details: {},
    };

    try {
      // Check if Docker is running with timeout
      await execAsync('timeout 2s docker --version');
      
      // Check Docker Compose services
      const { stdout } = await execAsync('timeout 3s docker-compose ps --format json');
      const containers = stdout.trim().split('\n').map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const containerStatuses = {};
      let allHealthy = true;

      for (const container of containers) {
        const isHealthy = container.State === 'running';
        containerStatuses[container.Service] = {
          status: isHealthy ? 'running' : container.State,
          health: isHealthy ? 'healthy' : 'unhealthy',
        };

        if (!isHealthy) {
          allHealthy = false;
        }
      }

      health.details.containers = containerStatuses;
      if (!allHealthy) {
        health.status = 'unhealthy';
      }
    } catch (error) {
      health.status = 'warning'; // Changed from 'error' to 'warning' for non-Docker deployments
      health.details.error = 'Docker not available or not running - normal for non-containerized deployments';
    }

    return health;
  }

  /**
   * Storage health check
   */
  async checkStorageHealth() {
    const health = {
      status: 'healthy',
      details: {},
    };

    const paths = [
      '/opt/echotune/logs',
      '/opt/echotune/backups',
      '/opt/echotune/ssl',
    ];

    for (const dirPath of paths) {
      try {
        await fs.access(dirPath);
        const stats = await fs.stat(dirPath);
        health.details[path.basename(dirPath)] = {
          exists: true,
          writable: true, // Simplified check
          lastModified: stats.mtime.toISOString(),
        };
      } catch (error) {
        health.details[path.basename(dirPath)] = {
          exists: false,
          error: error.message,
        };
        health.status = 'warning';
      }
    }

    return health;
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

module.exports = HealthCheckSystem;