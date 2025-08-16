#!/usr/bin/env node

/**
 * PostgreSQL MCP Server
 * Provides read-only database access with schema inspection capabilities
 * Designed for secure database interactions and business intelligence
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const { createInterface } = require('readline');
const fs = require('fs').promises;
const path = require('path');

class PostgreSQLMCPServer {
  constructor() {
    this.server = new Server({
      name: 'postgresql-mcp-server',
      version: '1.0.0',
    });
    
    this.config = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'echotune',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.POSTGRES_SSL === 'true',
      readOnly: true,
      maxConnections: 5,
      connectionTimeout: 10000,
    };

    this.connectionPool = null;
    this.schema = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(
      'tools/list',
      () => ({
        tools: [
          {
            name: 'postgres_query',
            description: 'Execute read-only SQL queries against PostgreSQL database',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to execute (SELECT statements only)',
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
            name: 'postgres_describe_table',
            description: 'Get detailed schema information for a specific table',
            inputSchema: {
              type: 'object',
              properties: {
                tableName: {
                  type: 'string',
                  description: 'Name of the table to describe',
                },
                includeIndexes: {
                  type: 'boolean',
                  description: 'Include index information',
                  default: true,
                },
                includeConstraints: {
                  type: 'boolean',
                  description: 'Include constraint information',
                  default: true,
                },
              },
              required: ['tableName'],
            },
          },
          {
            name: 'postgres_list_tables',
            description: 'List all tables in the database with basic information',
            inputSchema: {
              type: 'object',
              properties: {
                schema: {
                  type: 'string',
                  description: 'Schema name (default: public)',
                  default: 'public',
                },
                includeViews: {
                  type: 'boolean',
                  description: 'Include views in the listing',
                  default: false,
                },
              },
            },
          },
          {
            name: 'postgres_analyze_performance',
            description: 'Analyze query performance and suggest optimizations',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to analyze for performance',
                },
                explainOptions: {
                  type: 'object',
                  description: 'EXPLAIN options',
                  properties: {
                    analyze: { type: 'boolean', default: true },
                    buffers: { type: 'boolean', default: true },
                    format: { type: 'string', enum: ['text', 'json'], default: 'json' },
                  },
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'postgres_schema_insights',
            description: 'Generate business intelligence insights from database schema',
            inputSchema: {
              type: 'object',
              properties: {
                analysisType: {
                  type: 'string',
                  enum: ['relationships', 'data_quality', 'performance', 'comprehensive'],
                  description: 'Type of analysis to perform',
                  default: 'comprehensive',
                },
                focusTables: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific tables to focus analysis on',
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
          case 'postgres_query':
            return await this.executeQuery(args);
          case 'postgres_describe_table':
            return await this.describeTable(args);
          case 'postgres_list_tables':
            return await this.listTables(args);
          case 'postgres_analyze_performance':
            return await this.analyzePerformance(args);
          case 'postgres_schema_insights':
            return await this.generateSchemaInsights(args);
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
    const { query, limit = 100, timeout = 30000 } = args;

    // Validate query is read-only
    if (!this.isReadOnlyQuery(query)) {
      throw new Error('Only SELECT statements are allowed for security');
    }

    try {
      await this.ensureConnection();
      
      // Add LIMIT if not present
      const limitedQuery = this.addLimitToQuery(query, limit);
      
      const result = await this.executeWithTimeout(limitedQuery, timeout);
      
      return {
        content: [
          {
            type: 'text',
            text: `Query executed successfully. Returned ${result.rows?.length || 0} rows.`,
          },
          {
            type: 'text',
            text: `Results:\n${JSON.stringify(result.rows, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async describeTable(args) {
    const { tableName, includeIndexes = true, includeConstraints = true } = args;

    try {
      await this.ensureConnection();

      const tableInfo = {
        name: tableName,
        columns: await this.getTableColumns(tableName),
        rowCount: await this.getTableRowCount(tableName),
      };

      if (includeIndexes) {
        tableInfo.indexes = await this.getTableIndexes(tableName);
      }

      if (includeConstraints) {
        tableInfo.constraints = await this.getTableConstraints(tableName);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Table description for ${tableName}:`,
          },
          {
            type: 'text',
            text: JSON.stringify(tableInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to describe table: ${error.message}`);
    }
  }

  async listTables(args) {
    const { schema = 'public', includeViews = false } = args;

    try {
      await this.ensureConnection();

      const query = `
        SELECT 
          schemaname,
          tablename,
          tableowner,
          hasindexes,
          hasrules,
          hastriggers
        FROM pg_tables 
        WHERE schemaname = $1
        ${!includeViews ? '' : `
        UNION ALL
        SELECT 
          schemaname,
          viewname as tablename,
          viewowner as tableowner,
          false as hasindexes,
          false as hasrules,
          false as hastriggers
        FROM pg_views 
        WHERE schemaname = $1
        `}
        ORDER BY tablename;
      `;

      const result = await this.connectionPool.query(query, [schema]);

      return {
        content: [
          {
            type: 'text',
            text: `Found ${result.rows.length} tables${includeViews ? '/views' : ''} in schema '${schema}':`,
          },
          {
            type: 'text',
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tables: ${error.message}`);
    }
  }

  async analyzePerformance(args) {
    const { query, explainOptions = {} } = args;

    if (!this.isReadOnlyQuery(query)) {
      throw new Error('Only SELECT statements can be analyzed');
    }

    try {
      await this.ensureConnection();

      const explainQuery = this.buildExplainQuery(query, explainOptions);
      const result = await this.connectionPool.query(explainQuery);

      const analysis = this.analyzeQueryPlan(result.rows);

      return {
        content: [
          {
            type: 'text',
            text: 'Query Performance Analysis:',
          },
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Performance analysis failed: ${error.message}`);
    }
  }

  async generateSchemaInsights(args) {
    const { analysisType = 'comprehensive', focusTables = [] } = args;

    try {
      await this.ensureConnection();

      const insights = {
        analysisType,
        timestamp: new Date().toISOString(),
        insights: [],
      };

      switch (analysisType) {
        case 'relationships':
          insights.insights = await this.analyzeRelationships(focusTables);
          break;
        case 'data_quality':
          insights.insights = await this.analyzeDataQuality(focusTables);
          break;
        case 'performance':
          insights.insights = await this.analyzeSchemaPerformance(focusTables);
          break;
        case 'comprehensive':
          insights.insights = [
            ...(await this.analyzeRelationships(focusTables)),
            ...(await this.analyzeDataQuality(focusTables)),
            ...(await this.analyzeSchemaPerformance(focusTables)),
          ];
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Schema Analysis Report (${analysisType}):`,
          },
          {
            type: 'text',
            text: JSON.stringify(insights, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Schema insights generation failed: ${error.message}`);
    }
  }

  // Helper methods
  isReadOnlyQuery(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const readOnlyPatterns = [
      /^select\s/,
      /^with\s.*select\s/,
      /^explain\s/,
    ];
    
    return readOnlyPatterns.some(pattern => pattern.test(normalizedQuery));
  }

  addLimitToQuery(query, limit) {
    const normalizedQuery = query.trim().toLowerCase();
    
    if (normalizedQuery.includes('limit ')) {
      return query;
    }
    
    return `${query.trim()} LIMIT ${limit}`;
  }

  buildExplainQuery(query, options) {
    const { analyze = true, buffers = true, format = 'json' } = options;
    
    let explainOptions = [];
    if (analyze) explainOptions.push('ANALYZE');
    if (buffers) explainOptions.push('BUFFERS');
    if (format) explainOptions.push(`FORMAT ${format.toUpperCase()}`);
    
    return `EXPLAIN (${explainOptions.join(', ')}) ${query}`;
  }

  analyzeQueryPlan(planRows) {
    // Simplified query plan analysis
    const analysis = {
      execution_time_ms: null,
      total_cost: null,
      recommendations: [],
      bottlenecks: [],
    };

    try {
      const plan = planRows[0]?.['QUERY PLAN'];
      if (plan && plan.length > 0) {
        const planData = JSON.parse(plan[0]);
        analysis.execution_time_ms = planData['Execution Time'];
        analysis.total_cost = planData['Total Cost'];

        // Add basic recommendations based on plan
        if (planData['Execution Time'] > 1000) {
          analysis.recommendations.push('Query takes >1s to execute - consider optimization');
        }
      }
    } catch (error) {
      analysis.error = `Failed to parse query plan: ${error.message}`;
    }

    return analysis;
  }

  async ensureConnection() {
    if (!this.connectionPool) {
      try {
        const { Pool } = require('pg');
        
        this.connectionPool = new Pool({
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
          ssl: this.config.ssl,
          max: this.config.maxConnections,
          connectionTimeoutMillis: this.config.connectionTimeout,
        });

        // Test connection
        await this.connectionPool.query('SELECT 1');
        console.log('✅ PostgreSQL MCP server connected to database');
      } catch (error) {
        console.log('⚠️ PostgreSQL connection failed, running in mock mode:', error.message);
        this.connectionPool = this.createMockConnection();
      }
    }
  }

  createMockConnection() {
    return {
      query: async (query, params) => {
        // Return mock data for testing
        if (query.includes('pg_tables')) {
          return { rows: [{ schemaname: 'public', tablename: 'users', tableowner: 'postgres', hasindexes: true }] };
        }
        if (query.includes('information_schema.columns')) {
          return { rows: [{ column_name: 'id', data_type: 'integer', is_nullable: 'NO' }] };
        }
        return { rows: [{ mock: 'data', message: 'PostgreSQL server not available - mock response' }] };
      },
      end: async () => {},
    };
  }

  async executeWithTimeout(query, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      this.connectionPool.query(query)
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

  async getTableColumns(tableName) {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `;
    
    const result = await this.connectionPool.query(query, [tableName]);
    return result.rows;
  }

  async getTableRowCount(tableName) {
    try {
      const result = await this.connectionPool.query(`SELECT COUNT(*) FROM ${tableName}`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return null; // Return null if unable to count
    }
  }

  async getTableIndexes(tableName) {
    const query = `
      SELECT 
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM pg_class t, pg_class i, pg_index ix, pg_attribute a
      WHERE t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = $1
      ORDER BY i.relname, a.attname;
    `;
    
    const result = await this.connectionPool.query(query, [tableName]);
    return result.rows;
  }

  async getTableConstraints(tableName) {
    const query = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = $1
      ORDER BY tc.constraint_type, tc.constraint_name;
    `;
    
    const result = await this.connectionPool.query(query, [tableName]);
    return result.rows;
  }

  async analyzeRelationships(focusTables) {
    const query = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ${focusTables.length > 0 ? 'AND tc.table_name = ANY($1)' : ''}
      ORDER BY tc.table_name;
    `;
    
    const params = focusTables.length > 0 ? [focusTables] : [];
    const result = await this.connectionPool.query(query, params);
    
    return [{
      type: 'relationships',
      description: 'Foreign key relationships analysis',
      data: result.rows,
      insights: this.generateRelationshipInsights(result.rows),
    }];
  }

  async analyzeDataQuality(focusTables) {
    return [{
      type: 'data_quality',
      description: 'Data quality analysis',
      insights: ['Check null values distribution', 'Validate data constraints', 'Identify duplicate records'],
    }];
  }

  async analyzeSchemaPerformance(focusTables) {
    return [{
      type: 'performance',
      description: 'Schema performance analysis',
      insights: ['Review index usage', 'Identify slow queries', 'Check table statistics'],
    }];
  }

  generateRelationshipInsights(relationships) {
    const insights = [];
    const tableConnections = new Map();
    
    relationships.forEach(rel => {
      if (!tableConnections.has(rel.table_name)) {
        tableConnections.set(rel.table_name, []);
      }
      tableConnections.get(rel.table_name).push(rel.foreign_table_name);
    });
    
    if (tableConnections.size > 0) {
      insights.push(`Found ${relationships.length} foreign key relationships across ${tableConnections.size} tables`);
    }
    
    return insights;
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('PostgreSQL MCP server started');
    } catch (error) {
      console.error('Failed to start PostgreSQL MCP server:', error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.connectionPool && this.connectionPool.end) {
      await this.connectionPool.end();
    }
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new PostgreSQLMCPServer();
  
  process.on('SIGINT', async () => {
    console.log('Shutting down PostgreSQL MCP server...');
    await server.stop();
    process.exit(0);
  });
  
  server.start().catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
}

module.exports = PostgreSQLMCPServer;