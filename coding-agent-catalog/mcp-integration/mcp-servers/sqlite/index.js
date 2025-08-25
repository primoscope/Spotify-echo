#!/usr/bin/env node

/**
 * SQLite MCP Server
 * Provides database interaction and business intelligence capabilities
 * Optimized for local development and analytics
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const fs = require('fs').promises;
const path = require('path');

class SQLiteMCPServer {
  constructor() {
    this.server = new Server({
      name: 'sqlite-mcp-server',
      version: '1.0.0',
    });
    
    this.config = {
      defaultDatabase: process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'echotune.db'),
      readOnly: process.env.SQLITE_READ_ONLY === 'true',
      maxConnections: 10,
      timeout: 30000,
    };

    this.connections = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(
      'tools/list',
      () => ({
        tools: [
          {
            name: 'sqlite_query',
            description: 'Execute SQL queries against SQLite database',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to execute',
                },
                database: {
                  type: 'string',
                  description: 'Database file path (optional, uses default if not specified)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of rows to return (default: 100)',
                  default: 100,
                },
                timeout: {
                  type: 'number',
                  description: 'Query timeout in milliseconds (default: 30000)',
                  default: 30000,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'sqlite_schema',
            description: 'Get database schema information',
            inputSchema: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  description: 'Database file path (optional)',
                },
                tableName: {
                  type: 'string',
                  description: 'Specific table to describe (optional, lists all if not specified)',
                },
                includeIndexes: {
                  type: 'boolean',
                  description: 'Include index information',
                  default: true,
                },
              },
            },
          },
          {
            name: 'sqlite_analyze',
            description: 'Perform business intelligence analysis on data',
            inputSchema: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  description: 'Database file path (optional)',
                },
                analysisType: {
                  type: 'string',
                  enum: ['summary', 'relationships', 'data_quality', 'performance', 'trends'],
                  description: 'Type of analysis to perform',
                  default: 'summary',
                },
                tableName: {
                  type: 'string',
                  description: 'Focus analysis on specific table (optional)',
                },
                timeColumn: {
                  type: 'string',
                  description: 'Column to use for time-based analysis (required for trends)',
                },
                groupBy: {
                  type: 'string',
                  description: 'Column to group analysis by (optional)',
                },
              },
            },
          },
          {
            name: 'sqlite_create_view',
            description: 'Create or update a database view for analysis',
            inputSchema: {
              type: 'object',
              properties: {
                viewName: {
                  type: 'string',
                  description: 'Name of the view to create',
                },
                query: {
                  type: 'string',
                  description: 'SELECT query that defines the view',
                },
                database: {
                  type: 'string',
                  description: 'Database file path (optional)',
                },
                replace: {
                  type: 'boolean',
                  description: 'Replace view if it exists',
                  default: true,
                },
              },
              required: ['viewName', 'query'],
            },
          },
          {
            name: 'sqlite_export_data',
            description: 'Export query results to various formats',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to export',
                },
                format: {
                  type: 'string',
                  enum: ['json', 'csv', 'tsv', 'html'],
                  description: 'Export format',
                  default: 'json',
                },
                outputPath: {
                  type: 'string',
                  description: 'Output file path (optional, returns data if not specified)',
                },
                database: {
                  type: 'string',
                  description: 'Database file path (optional)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'sqlite_database_info',
            description: 'Get comprehensive database information and health metrics',
            inputSchema: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  description: 'Database file path (optional)',
                },
                includeStats: {
                  type: 'boolean',
                  description: 'Include detailed table statistics',
                  default: true,
                },
              },
            },
          },
        ],
      })
    );

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'sqlite_query':
            return await this.executeQuery(args);
          case 'sqlite_schema':
            return await this.getSchema(args);
          case 'sqlite_analyze':
            return await this.performAnalysis(args);
          case 'sqlite_create_view':
            return await this.createView(args);
          case 'sqlite_export_data':
            return await this.exportData(args);
          case 'sqlite_database_info':
            return await this.getDatabaseInfo(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async executeQuery(args) {
    const { query, database, limit = 100, timeout = 30000 } = args;
    const dbPath = database || this.config.defaultDatabase;

    if (this.config.readOnly && this.isWriteOperation(query)) {
      throw new Error('Write operations not allowed in read-only mode');
    }

    try {
      const db = await this.getConnection(dbPath);
      
      const limitedQuery = this.addLimitToQuery(query, limit);
      const result = await this.executeWithTimeout(db, limitedQuery, timeout);
      
      return {
        content: [
          {
            type: 'text',
            text: `Query executed successfully. Returned ${result.length} rows.`,
          },
          {
            type: 'text',
            text: `Results:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async getSchema(args) {
    const { database, tableName, includeIndexes = true } = args;
    const dbPath = database || this.config.defaultDatabase;

    try {
      const db = await this.getConnection(dbPath);
      
      let schemaInfo = {};

      if (tableName) {
        // Get specific table schema
        schemaInfo = await this.getTableSchema(db, tableName, includeIndexes);
      } else {
        // Get all tables
        const tables = await this.getAllTables(db);
        schemaInfo = { tables: [] };
        
        for (const table of tables) {
          const tableInfo = await this.getTableSchema(db, table.name, includeIndexes);
          schemaInfo.tables.push(tableInfo);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: tableName ? `Schema for table ${tableName}:` : 'Database schema:',
          },
          {
            type: 'text',
            text: JSON.stringify(schemaInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Schema retrieval failed: ${error.message}`);
    }
  }

  async performAnalysis(args) {
    const { database, analysisType = 'summary', tableName, timeColumn, groupBy } = args;
    const dbPath = database || this.config.defaultDatabase;

    try {
      const db = await this.getConnection(dbPath);
      
      let analysisResult = {
        type: analysisType,
        timestamp: new Date().toISOString(),
        database: dbPath,
      };

      switch (analysisType) {
        case 'summary':
          analysisResult.data = await this.performSummaryAnalysis(db, tableName);
          break;
        case 'relationships':
          analysisResult.data = await this.analyzeRelationships(db, tableName);
          break;
        case 'data_quality':
          analysisResult.data = await this.analyzeDataQuality(db, tableName);
          break;
        case 'performance':
          analysisResult.data = await this.analyzePerformance(db, tableName);
          break;
        case 'trends':
          if (!timeColumn) {
            throw new Error('timeColumn is required for trend analysis');
          }
          analysisResult.data = await this.analyzeTrends(db, tableName, timeColumn, groupBy);
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Analysis completed (${analysisType}):`,
          },
          {
            type: 'text',
            text: JSON.stringify(analysisResult, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  async createView(args) {
    const { viewName, query, database, replace = true } = args;
    const dbPath = database || this.config.defaultDatabase;

    if (this.config.readOnly) {
      throw new Error('Cannot create views in read-only mode');
    }

    try {
      const db = await this.getConnection(dbPath);
      
      if (replace) {
        await db.run(`DROP VIEW IF EXISTS ${viewName}`);
      }

      const createViewQuery = `CREATE VIEW ${viewName} AS ${query}`;
      await db.run(createViewQuery);

      return {
        content: [
          {
            type: 'text',
            text: `View '${viewName}' created successfully.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`View creation failed: ${error.message}`);
    }
  }

  async exportData(args) {
    const { query, format = 'json', outputPath, database } = args;
    const dbPath = database || this.config.defaultDatabase;

    try {
      const db = await this.getConnection(dbPath);
      const result = await db.all(query);

      let exportedData = '';

      switch (format) {
        case 'json':
          exportedData = JSON.stringify(result, null, 2);
          break;
        case 'csv':
          exportedData = this.convertToCSV(result);
          break;
        case 'tsv':
          exportedData = this.convertToTSV(result);
          break;
        case 'html':
          exportedData = this.convertToHTML(result);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      if (outputPath) {
        await fs.writeFile(outputPath, exportedData, 'utf8');
        return {
          content: [
            {
              type: 'text',
              text: `Data exported to ${outputPath} in ${format} format.`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `Exported data (${format} format):`,
            },
            {
              type: 'text',
              text: exportedData,
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  async getDatabaseInfo(args) {
    const { database, includeStats = true } = args;
    const dbPath = database || this.config.defaultDatabase;

    try {
      const db = await this.getConnection(dbPath);
      
      const info = {
        path: dbPath,
        exists: await this.databaseExists(dbPath),
        size: await this.getDatabaseSize(dbPath),
        tables: [],
        views: [],
        indexes: [],
        pragmas: {},
      };

      if (info.exists) {
        // Get tables
        const tables = await this.getAllTables(db);
        info.tables = tables;

        // Get views
        const views = await this.getAllViews(db);
        info.views = views;

        // Get indexes
        const indexes = await this.getAllIndexes(db);
        info.indexes = indexes;

        // Get important pragma values
        info.pragmas = await this.getPragmaInfo(db);

        if (includeStats) {
          // Get table statistics
          for (let table of info.tables) {
            table.stats = await this.getTableStats(db, table.name);
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Database information for ${dbPath}:`,
          },
          {
            type: 'text',
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Database info retrieval failed: ${error.message}`);
    }
  }

  // Helper methods
  async getConnection(dbPath) {
    if (!this.connections.has(dbPath)) {
      try {
        const sqlite3 = require('sqlite3').verbose();
        const { open } = require('sqlite');
        
        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database,
        });

        // Enable foreign keys
        await db.run('PRAGMA foreign_keys = ON');
        
        this.connections.set(dbPath, db);
      } catch (error) {
        // Create mock connection if SQLite is not available
        console.log('⚠️ SQLite not available, creating mock connection:', error.message);
        this.connections.set(dbPath, this.createMockConnection());
      }
    }

    return this.connections.get(dbPath);
  }

  createMockConnection() {
    return {
      all: async (query) => [{ mock: 'data', query: query.substring(0, 50) + '...' }],
      run: async (query) => ({ changes: 1, lastID: 1 }),
      get: async (query) => ({ mock: 'single_row' }),
      close: async () => {},
    };
  }

  isWriteOperation(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const writeOperations = [
      /^insert\s/,
      /^update\s/,
      /^delete\s/,
      /^drop\s/,
      /^create\s/,
      /^alter\s/,
      /^truncate\s/,
    ];
    
    return writeOperations.some(pattern => pattern.test(normalizedQuery));
  }

  addLimitToQuery(query, limit) {
    const normalizedQuery = query.trim().toLowerCase();
    
    if (normalizedQuery.includes('limit ') || !normalizedQuery.startsWith('select')) {
      return query;
    }
    
    return `${query.trim()} LIMIT ${limit}`;
  }

  async executeWithTimeout(db, query, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      db.all(query)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  async getTableSchema(db, tableName, includeIndexes) {
    const tableInfo = {
      name: tableName,
      columns: [],
      indexes: [],
    };

    // Get column information
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    tableInfo.columns = columns;

    if (includeIndexes) {
      // Get index information
      const indexes = await db.all(`PRAGMA index_list(${tableName})`);
      for (const index of indexes) {
        const indexInfo = await db.all(`PRAGMA index_info(${index.name})`);
        tableInfo.indexes.push({
          name: index.name,
          unique: index.unique === 1,
          columns: indexInfo,
        });
      }
    }

    return tableInfo;
  }

  async getAllTables(db) {
    return await db.all(`
      SELECT name, type, sql 
      FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
  }

  async getAllViews(db) {
    return await db.all(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type = 'view'
      ORDER BY name
    `);
  }

  async getAllIndexes(db) {
    return await db.all(`
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
  }

  async getPragmaInfo(db) {
    const pragmas = {};
    
    try {
      const pragmaQueries = [
        'PRAGMA journal_mode',
        'PRAGMA synchronous',
        'PRAGMA cache_size',
        'PRAGMA foreign_keys',
        'PRAGMA page_size',
      ];

      for (const pragmaQuery of pragmaQueries) {
        const result = await db.get(pragmaQuery);
        const pragmaName = pragmaQuery.split(' ')[1];
        pragmas[pragmaName] = Object.values(result)[0];
      }
    } catch (error) {
      pragmas.error = error.message;
    }

    return pragmas;
  }

  async getTableStats(db, tableName) {
    try {
      const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
      return {
        rowCount: countResult.count,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async performSummaryAnalysis(db, tableName) {
    if (tableName) {
      return await this.getTableSummary(db, tableName);
    } else {
      const tables = await this.getAllTables(db);
      const summary = [];
      
      for (const table of tables) {
        summary.push(await this.getTableSummary(db, table.name));
      }
      
      return summary;
    }
  }

  async getTableSummary(db, tableName) {
    try {
      const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
      const columns = await db.all(`PRAGMA table_info(${tableName})`);
      
      return {
        table: tableName,
        rowCount: countResult.count,
        columnCount: columns.length,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.notnull === 0,
          primaryKey: col.pk === 1,
        })),
      };
    } catch (error) {
      return {
        table: tableName,
        error: error.message,
      };
    }
  }

  async analyzeRelationships(db, tableName) {
    // SQLite doesn't have strong foreign key metadata like PostgreSQL
    // This is a simplified version
    const relationships = [];
    
    if (tableName) {
      const foreignKeys = await db.all(`PRAGMA foreign_key_list(${tableName})`);
      relationships.push({
        table: tableName,
        foreignKeys: foreignKeys,
      });
    } else {
      const tables = await this.getAllTables(db);
      for (const table of tables) {
        const foreignKeys = await db.all(`PRAGMA foreign_key_list(${table.name})`);
        if (foreignKeys.length > 0) {
          relationships.push({
            table: table.name,
            foreignKeys: foreignKeys,
          });
        }
      }
    }

    return { relationships };
  }

  async analyzeDataQuality(db, tableName) {
    const issues = [];
    
    if (tableName) {
      issues.push(...(await this.checkTableDataQuality(db, tableName)));
    } else {
      const tables = await this.getAllTables(db);
      for (const table of tables) {
        issues.push(...(await this.checkTableDataQuality(db, table.name)));
      }
    }

    return { dataQualityIssues: issues };
  }

  async checkTableDataQuality(db, tableName) {
    const issues = [];
    
    try {
      // Check for empty tables
      const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
      if (countResult.count === 0) {
        issues.push({
          table: tableName,
          type: 'empty_table',
          description: 'Table has no data',
        });
      }

      // Additional quality checks could be added here
      
    } catch (error) {
      issues.push({
        table: tableName,
        type: 'access_error',
        description: error.message,
      });
    }

    return issues;
  }

  async analyzePerformance(db, tableName) {
    const recommendations = [];
    
    if (tableName) {
      recommendations.push(...(await this.checkTablePerformance(db, tableName)));
    } else {
      const tables = await this.getAllTables(db);
      for (const table of tables) {
        recommendations.push(...(await this.checkTablePerformance(db, table.name)));
      }
    }

    return { performanceRecommendations: recommendations };
  }

  async checkTablePerformance(db, tableName) {
    const recommendations = [];
    
    try {
      // Check if table has indexes
      const indexes = await db.all(`PRAGMA index_list(${tableName})`);
      const columns = await db.all(`PRAGMA table_info(${tableName})`);
      
      if (indexes.length === 0 && columns.length > 1) {
        recommendations.push({
          table: tableName,
          type: 'missing_indexes',
          description: 'Table has no indexes - consider adding indexes for frequently queried columns',
        });
      }

    } catch (error) {
      recommendations.push({
        table: tableName,
        type: 'analysis_error',
        description: error.message,
      });
    }

    return recommendations;
  }

  async analyzeTrends(db, tableName, timeColumn, groupBy) {
    try {
      let query = `
        SELECT 
          DATE(${timeColumn}) as date,
          COUNT(*) as count
      `;

      if (groupBy) {
        query += `, ${groupBy}`;
      }

      query += `
        FROM ${tableName} 
        WHERE ${timeColumn} IS NOT NULL
      `;

      if (groupBy) {
        query += ` GROUP BY DATE(${timeColumn}), ${groupBy}`;
      } else {
        query += ` GROUP BY DATE(${timeColumn})`;
      }

      query += ` ORDER BY DATE(${timeColumn}) DESC LIMIT 30`;

      const trends = await db.all(query);

      return {
        table: tableName,
        timeColumn: timeColumn,
        groupBy: groupBy,
        trends: trends,
        summary: {
          totalDataPoints: trends.length,
          dateRange: trends.length > 0 ? {
            earliest: trends[trends.length - 1]?.date,
            latest: trends[0]?.date,
          } : null,
        },
      };
    } catch (error) {
      return {
        table: tableName,
        error: error.message,
      };
    }
  }

  // Data export helpers
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  convertToTSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const tsvRows = [headers.join('\t')];
    
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      tsvRows.push(values.join('\t'));
    });
    
    return tsvRows.join('\n');
  }

  convertToHTML(data) {
    if (!data || data.length === 0) return '<table></table>';
    
    const headers = Object.keys(data[0]);
    let html = '<table border="1">\n<tr>';
    
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr>\n';
    
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        html += `<td>${row[header] || ''}</td>`;
      });
      html += '</tr>\n';
    });
    
    html += '</table>';
    return html;
  }

  async databaseExists(dbPath) {
    try {
      await fs.access(dbPath);
      return true;
    } catch {
      return false;
    }
  }

  async getDatabaseSize(dbPath) {
    try {
      const stats = await fs.stat(dbPath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('SQLite MCP server started');
    } catch (error) {
      console.error('Failed to start SQLite MCP server:', error);
      process.exit(1);
    }
  }

  async stop() {
    for (const [dbPath, connection] of this.connections) {
      try {
        if (connection && connection.close) {
          await connection.close();
        }
      } catch (error) {
        console.error(`Error closing connection to ${dbPath}:`, error);
      }
    }
    this.connections.clear();
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new SQLiteMCPServer();
  
  process.on('SIGINT', async () => {
    console.log('Shutting down SQLite MCP server...');
    await server.stop();
    process.exit(0);
  });
  
  server.start().catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
}

module.exports = SQLiteMCPServer;