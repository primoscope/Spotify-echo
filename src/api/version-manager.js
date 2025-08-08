const express = require('express');

/**
 * API Version Manager for EchoTune AI
 *
 * Provides version detection and routing for API backwards compatibility
 * Supports multiple versioning strategies:
 * - URL path versioning (/api/v2/endpoint)
 * - Header versioning (Accept: application/vnd.echotune.v2+json)
 * - Query parameter versioning (?version=2)
 */

class APIVersionManager {
  constructor() {
    this.versions = {
      v1: {
        deprecated: false,
        sunset_date: null,
        routes_path: '../routes',
        description: 'Original API version',
      },
      v2: {
        deprecated: false,
        sunset_date: null,
        routes_path: '../v2/routes',
        description: 'Enhanced API with caching and performance improvements',
      },
    };

    this.defaultVersion = 'v2';
    this.deprecatedVersions = new Set();
  }

  /**
   * Middleware to detect and set API version
   */
  versionDetection() {
    return (req, res, next) => {
      let version = this.defaultVersion;

      // 1. Check URL path version (/api/v2/...)
      const urlVersion = req.path.match(/^\/api\/v(\d+)\//);
      if (urlVersion) {
        version = `v${urlVersion[1]}`;
        // Remove version from path for routing
        req.originalUrl = req.originalUrl.replace(`/v${urlVersion[1]}`, '');
        req.url = req.url.replace(`/v${urlVersion[1]}`, '');
      }

      // 2. Check Accept header version
      const acceptHeader = req.headers.accept;
      if (acceptHeader) {
        const headerVersion = acceptHeader.match(/application\/vnd\.echotune\.v(\d+)\+json/);
        if (headerVersion) {
          version = `v${headerVersion[1]}`;
        }
      }

      // 3. Check query parameter version
      if (req.query.version) {
        const queryVersion = parseInt(req.query.version);
        if (queryVersion && queryVersion > 0) {
          version = `v${queryVersion}`;
        }
      }

      // Validate version exists
      if (!this.versions[version]) {
        return res.status(400).json({
          error: 'Unsupported API version',
          supported_versions: Object.keys(this.versions),
          requested_version: version,
        });
      }

      // Check if version is deprecated
      if (this.versions[version].deprecated) {
        res.setHeader('Sunset', this.versions[version].sunset_date);
        res.setHeader('Deprecation', 'true');
        res.setHeader('Link', '</api/versions>; rel="help"');
      }

      // Set version info in request
      req.apiVersion = version;
      req.versionInfo = this.versions[version];

      // Set response headers
      res.setHeader('API-Version', version);
      res.setHeader('Vary', 'Accept, Accept-Version');

      next();
    };
  }

  /**
   * Create versioned router
   */
  createVersionedRouter() {
    const router = express.Router();

    // Add version detection middleware
    router.use(this.versionDetection());

    // Version info endpoint
    router.get('/versions', (req, res) => {
      res.json({
        versions: this.versions,
        default_version: this.defaultVersion,
        current_version: req.apiVersion,
        versioning_strategies: [
          'URL path: /api/v2/endpoint',
          'Accept header: Accept: application/vnd.echotune.v2+json',
          'Query parameter: ?version=2',
        ],
      });
    });

    return router;
  }

  /**
   * Deprecate a version
   */
  deprecateVersion(version, sunsetDate = null) {
    if (this.versions[version]) {
      this.versions[version].deprecated = true;
      this.versions[version].sunset_date =
        sunsetDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 months from now
      this.deprecatedVersions.add(version);

      console.warn(
        `API version ${version} deprecated. Sunset date: ${this.versions[version].sunset_date}`
      );
    }
  }

  /**
   * Remove a version
   */
  removeVersion(version) {
    if (this.versions[version] && version !== this.defaultVersion) {
      delete this.versions[version];
      this.deprecatedVersions.delete(version);
      console.info(`API version ${version} removed`);
    }
  }

  /**
   * Get version compatibility matrix
   */
  getCompatibilityMatrix() {
    return {
      breaking_changes: {
        v1_to_v2: [
          'Enhanced response format with caching metadata',
          'Additional performance metrics in responses',
          'Improved error handling with detailed error codes',
          'New rate limiting headers',
        ],
      },
      feature_additions: {
        v2: [
          'Response caching with cache metadata',
          'Performance monitoring integration',
          'Enhanced security headers',
          'Request validation improvements',
          'OpenAPI 3.0 specification compliance',
        ],
      },
      migration_guide: {
        v1_to_v2: '/api/docs/migration/v1-to-v2',
      },
    };
  }
}

module.exports = APIVersionManager;
