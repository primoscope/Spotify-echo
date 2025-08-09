const express = require('express');
const router = express.Router();
const mongoDBManager = require('../../database/mongodb-manager');

/**
 * MongoDB Admin API Routes
 * Provides comprehensive database insights and administration tools
 * All operations are read-only for safety
 */

/**
 * Get comprehensive MongoDB dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.json({
        success: false,
        error: 'MongoDB not connected',
        dashboard: {
          overview: {
            database: 'N/A',
            totalCollections: 0,
            totalDocuments: 0,
            totalDataSize: 0,
            totalIndexSize: 0,
            uptime: 0,
            connections: { current: 0, available: 0 }
          },
          collections: [],
          indexHealth: {
            healthy: 0,
            problematic: 0,
            unused: 0,
            recommendations: ['MongoDB connection required for index analysis']
          },
          performance: {
            operations: { query: 0, insert: 0, update: 0, delete: 0 },
            memory: { resident: 0, virtual: 0 }
          },
          permissions: {
            connection: false,
            readAccess: false,
            adminAccess: false,
            profilingAccess: false,
            indexAccess: false
          },
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Collect data with individual error handling
    const results = await Promise.allSettled([
      mongoDBManager.getCollectionStats().catch(err => ({ error: err.message, collections: [], totalCollections: 0, totalDocuments: 0, totalDataSize: 0, totalIndexSize: 0 })),
      mongoDBManager.analyzeIndexHealth().catch(err => ({ error: err.message, healthyIndexes: 0, problematicIndexes: 0, unusedIndexes: 0, recommendations: [`Index analysis failed: ${err.message}`] })),
      mongoDBManager.getDatabaseStats().catch(err => ({ error: err.message, database: 'Unknown', uptime: 0, connections: { current: 0, available: 0 }, operations: { query: 0, insert: 0, update: 0, delete: 0 }, memory: { resident: 0, virtual: 0 } })),
      mongoDBManager.validateAdminAccess().catch(err => ({ error: err.message, permissions: { connection: false, readAccess: false, adminAccess: false, profilingAccess: false, indexAccess: false } }))
    ]);

    const collectionStats = results[0].status === 'fulfilled' ? results[0].value : results[0].reason || { collections: [], totalCollections: 0, totalDocuments: 0, totalDataSize: 0, totalIndexSize: 0 };
    const indexHealth = results[1].status === 'fulfilled' ? results[1].value : results[1].reason || { healthyIndexes: 0, problematicIndexes: 0, unusedIndexes: 0, recommendations: ['Index analysis unavailable'] };
    const dbStats = results[2].status === 'fulfilled' ? results[2].value : results[2].reason || { database: 'Unknown', uptime: 0, connections: { current: 0, available: 0 }, operations: { query: 0, insert: 0, update: 0, delete: 0 }, memory: { resident: 0, virtual: 0 } };
    const adminAccess = results[3].status === 'fulfilled' ? results[3].value : results[3].reason || { permissions: { connection: false, readAccess: false, adminAccess: false, profilingAccess: false, indexAccess: false } };

    const dashboard = {
      overview: {
        database: dbStats.database,
        totalCollections: collectionStats.totalCollections,
        totalDocuments: collectionStats.totalDocuments,
        totalDataSize: collectionStats.totalDataSize,
        totalIndexSize: collectionStats.totalIndexSize,
        uptime: dbStats.uptime,
        connections: dbStats.connections
      },
      collections: collectionStats.collections ? collectionStats.collections.map(col => ({
        name: col.name,
        count: col.count,
        size: col.size,
        avgSize: col.avgObjSize,
        indexCount: col.indexCount,
        hasErrors: !!col.error
      })) : [],
      indexHealth: {
        healthy: indexHealth.healthyIndexes || 0,
        problematic: indexHealth.problematicIndexes || 0,
        unused: indexHealth.unusedIndexes || 0,
        recommendations: indexHealth.recommendations || []
      },
      performance: {
        operations: dbStats.operations || { query: 0, insert: 0, update: 0, delete: 0 },
        memory: dbStats.memory || { resident: 0, virtual: 0 }
      },
      permissions: adminAccess.permissions || {
        connection: false,
        readAccess: false,
        adminAccess: false,
        profilingAccess: false,
        indexAccess: false
      },
      lastUpdated: new Date().toISOString(),
      warnings: [
        ...(collectionStats.error ? [`Collection stats: ${collectionStats.error}`] : []),
        ...(indexHealth.error ? [`Index health: ${indexHealth.error}`] : []),
        ...(dbStats.error ? [`Database stats: ${dbStats.error}`] : []),
        ...(adminAccess.error ? [`Admin access: ${adminAccess.error}`] : [])
      ]
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.warn('Dashboard error:', error.message);
    res.json({
      success: false,
      error: 'Failed to load dashboard data',
      details: error.message,
      dashboard: null
    });
  }
});

/**
 * Get detailed collection statistics
 */
router.get('/collections', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const stats = await mongoDBManager.getCollectionStats();
    
    res.json({
      success: true,
      collections: stats.collections,
      summary: {
        totalCollections: stats.totalCollections,
        totalDocuments: stats.totalDocuments,
        totalDataSize: stats.totalDataSize,
        totalIndexSize: stats.totalIndexSize
      }
    });
  } catch (error) {
    console.error('Collections stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection statistics',
      details: error.message
    });
  }
});

/**
 * Get index health analysis
 */
router.get('/indexes', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const analysis = await mongoDBManager.analyzeIndexHealth();
    
    res.json({
      success: true,
      indexAnalysis: analysis
    });
  } catch (error) {
    console.error('Index analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze indexes',
      details: error.message
    });
  }
});

/**
 * Get slow query analysis
 */
router.get('/slow-queries', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const { threshold = 100, limit = 50 } = req.query;
    const analysis = await mongoDBManager.analyzeSlowQueries({ 
      threshold: parseInt(threshold), 
      limit: parseInt(limit) 
    });
    
    res.json({
      success: true,
      slowQueries: analysis
    });
  } catch (error) {
    console.error('Slow query analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze slow queries',
      details: error.message,
      note: 'Query profiling may need to be enabled'
    });
  }
});

/**
 * Get database performance statistics
 */
router.get('/stats', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const stats = await mongoDBManager.getDatabaseStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics',
      details: error.message
    });
  }
});

/**
 * Get export metadata for a collection
 */
router.get('/collections/:name/export-info', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const { name } = req.params;
    const metadata = await mongoDBManager.getExportMetadata(name);
    
    res.json({
      success: true,
      exportMetadata: metadata
    });
  } catch (error) {
    console.error(`Export metadata error for ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get export metadata',
      details: error.message
    });
  }
});

/**
 * Export collection data (read-only, safe)
 */
router.post('/collections/:name/export', async (req, res) => {
  try {
    const { name } = req.params;
    const {
      limit = 1000,
      skip = 0,
      query = {},
      projection = {},
      format = 'json',
      sanitize = true
    } = req.body;

    // Validate input limits for safety
    if (limit > 10000) {
      return res.json({
        success: false,
        error: 'Export limit cannot exceed 10,000 documents for safety'
      });
    }

    // Always try to export - our improved method handles disconnected state gracefully
    const exportData = await mongoDBManager.exportCollectionData(name, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      query,
      projection,
      format,
      sanitize: sanitize !== false
    });

    // Check if export returned error state
    if (exportData.error) {
      return res.json({
        success: false,
        error: exportData.error,
        details: exportData.recommendations?.join(', ') || 'Export failed',
        exportData: exportData
      });
    }

    // Set appropriate headers for successful download
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${name}_export.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${name}_export.json"`);
    }
    
    res.json({
      success: true,
      export: exportData
    });
  } catch (error) {
    console.warn(`Export error for ${req.params.name}:`, error.message);
    res.json({
      success: false,
      error: 'Failed to export collection data',
      details: error.message
    });
  }
});

/**
 * Validate admin access and permissions
 */
router.get('/access-check', async (req, res) => {
  try {
    const validation = await mongoDBManager.validateAdminAccess();
    
    res.json({
      success: true,
      access: validation
    });
  } catch (error) {
    console.error('Access validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate admin access',
      details: error.message
    });
  }
});

/**
 * Get health status for admin monitoring
 */
router.get('/health', async (req, res) => {
  try {
    const isConnected = mongoDBManager.isConnected();
    let health = {
      status: 'unhealthy',
      message: 'Not connected to MongoDB'
    };
    
    if (isConnected) {
      try {
        health = await mongoDBManager.healthCheck();
      } catch (error) {
        console.warn('Health check failed:', error.message);
        health = {
          status: 'unhealthy',
          message: error.message
        };
      }
    }
    
    res.json({
      success: isConnected && health.status === 'healthy',
      mongodb: {
        connected: isConnected,
        status: health.status,
        message: health.message,
        responseTime: health.responseTime,
        database: health.database
      },
      adminTools: {
        available: isConnected,
        readOnly: true,
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Admin health check error:', error.message);
    res.json({
      success: false,
      mongodb: {
        connected: false,
        status: 'unhealthy',
        message: `Health check failed: ${error.message}`
      },
      adminTools: {
        available: false,
        readOnly: true,
        version: '1.0.0'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get comprehensive system recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    if (!mongoDBManager.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB not connected'
      });
    }

    const [indexHealth, slowQueries] = await Promise.all([
      mongoDBManager.analyzeIndexHealth(),
      mongoDBManager.analyzeSlowQueries({ threshold: 100, limit: 10 }).catch(() => ({ recommendations: [] }))
    ]);

    const allRecommendations = [
      ...indexHealth.recommendations,
      ...slowQueries.recommendations
    ];

    // Categorize recommendations
    const categorized = {
      critical: allRecommendations.filter(r => r.severity === 'high'),
      important: allRecommendations.filter(r => r.severity === 'medium'),
      suggestions: allRecommendations.filter(r => r.severity === 'low' || !r.severity),
      performance: allRecommendations.filter(r => r.type === 'performance'),
      indexOptimization: allRecommendations.filter(r => r.type === 'missing_index' || r.type === 'unused_index')
    };

    res.json({
      success: true,
      recommendations: {
        total: allRecommendations.length,
        categories: categorized,
        summary: {
          criticalCount: categorized.critical.length,
          importantCount: categorized.important.length,
          performanceCount: categorized.performance.length,
          indexCount: categorized.indexOptimization.length
        }
      }
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
});

module.exports = router;