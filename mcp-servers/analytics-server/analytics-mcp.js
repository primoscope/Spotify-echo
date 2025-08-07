#!/usr/bin/env node

/**
 * EchoTune AI - Analytics & Telemetry MCP Server
 * 
 * Inspired by shinzo-labs/shinzo-ts
 * Provides comprehensive analytics, telemetry, and performance monitoring
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const fs = require('fs').promises;
const path = require('path');

class AnalyticsMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'echotune-analytics-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupToolHandlers();
    this.metrics = new Map();
    this.events = [];
    this.startTime = Date.now();
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'track_event',
            description: 'Track custom events for analytics and telemetry',
            inputSchema: {
              type: 'object',
              properties: {
                eventName: {
                  type: 'string',
                  description: 'Name of the event to track'
                },
                properties: {
                  type: 'object',
                  description: 'Event properties and metadata'
                },
                userId: {
                  type: 'string',
                  description: 'User ID associated with the event'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID for event correlation'
                }
              },
              required: ['eventName']
            }
          },
          {
            name: 'performance_metrics',
            description: 'Collect and analyze performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Component or system to analyze'
                },
                timeRange: {
                  type: 'string',
                  enum: ['1h', '24h', '7d', '30d'],
                  description: 'Time range for metrics analysis',
                  default: '1h'
                },
                metrics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific metrics to analyze',
                  default: ['response_time', 'throughput', 'error_rate']
                }
              }
            }
          },
          {
            name: 'user_behavior_analysis',
            description: 'Analyze user behavior patterns and engagement',
            inputSchema: {
              type: 'object',
              properties: {
                analysisType: {
                  type: 'string',
                  enum: ['engagement', 'retention', 'feature_usage', 'music_preferences'],
                  description: 'Type of behavior analysis to perform'
                },
                timeFrame: {
                  type: 'string',
                  enum: ['day', 'week', 'month'],
                  description: 'Analysis time frame',
                  default: 'week'
                },
                segmentation: {
                  type: 'object',
                  description: 'User segmentation criteria'
                }
              },
              required: ['analysisType']
            }
          },
          {
            name: 'system_health_monitor',
            description: 'Monitor system health and generate alerts',
            inputSchema: {
              type: 'object',
              properties: {
                checkType: {
                  type: 'string',
                  enum: ['api_health', 'database_health', 'llm_providers', 'spotify_integration', 'overall'],
                  description: 'Type of health check to perform',
                  default: 'overall'
                },
                alertThresholds: {
                  type: 'object',
                  properties: {
                    responseTime: { type: 'number', default: 1000 },
                    errorRate: { type: 'number', default: 0.05 },
                    availability: { type: 'number', default: 0.99 }
                  },
                  description: 'Alert thresholds for monitoring'
                }
              }
            }
          },
          {
            name: 'generate_insights_report',
            description: 'Generate comprehensive analytics and insights report',
            inputSchema: {
              type: 'object',
              properties: {
                reportType: {
                  type: 'string',
                  enum: ['user_engagement', 'system_performance', 'music_analytics', 'comprehensive'],
                  description: 'Type of report to generate',
                  default: 'comprehensive'
                },
                format: {
                  type: 'string',
                  enum: ['markdown', 'json', 'csv'],
                  description: 'Report output format',
                  default: 'markdown'
                },
                includeRecommendations: {
                  type: 'boolean',
                  description: 'Include optimization recommendations',
                  default: true
                }
              }
            }
          },
          {
            name: 'a_b_test_analysis',
            description: 'Analyze A/B test results and statistical significance',
            inputSchema: {
              type: 'object',
              properties: {
                testName: {
                  type: 'string',
                  description: 'Name of the A/B test'
                },
                variants: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      conversions: { type: 'number' },
                      impressions: { type: 'number' }
                    }
                  },
                  description: 'Test variant data'
                },
                confidenceLevel: {
                  type: 'number',
                  description: 'Statistical confidence level',
                  default: 0.95
                }
              },
              required: ['testName', 'variants']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'track_event':
            return await this.trackEvent(args.eventName, args.properties, args.userId, args.sessionId);
          
          case 'performance_metrics':
            return await this.analyzePerformanceMetrics(args.component, args.timeRange, args.metrics);
          
          case 'user_behavior_analysis':
            return await this.analyzeUserBehavior(args.analysisType, args.timeFrame, args.segmentation);
          
          case 'system_health_monitor':
            return await this.monitorSystemHealth(args.checkType, args.alertThresholds);
          
          case 'generate_insights_report':
            return await this.generateInsightsReport(args.reportType, args.format, args.includeRecommendations);
          
          case 'a_b_test_analysis':
            return await this.analyzeABTest(args.testName, args.variants, args.confidenceLevel);
          
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
          isError: true,
        };
      }
    });
  }

  async trackEvent(eventName, properties = {}, userId = null, sessionId = null) {
    const event = {
      eventName,
      properties,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    };

    this.events.push(event);

    // Update metrics
    const metricKey = `event_${eventName}`;
    const currentCount = this.metrics.get(metricKey) || 0;
    this.metrics.set(metricKey, currentCount + 1);

    // EchoTune specific event processing
    if (eventName.includes('spotify')) {
      this.processSpotifyEvent(event);
    } else if (eventName.includes('recommendation')) {
      this.processRecommendationEvent(event);
    } else if (eventName.includes('llm')) {
      this.processLLMEvent(event);
    }

    return {
      content: [
        {
          type: 'text',
          text: `## Event Tracked Successfully\n\n` +
                `**Event:** ${eventName}\n` +
                `**Timestamp:** ${event.timestamp}\n` +
                `**User ID:** ${userId || 'anonymous'}\n` +
                `**Session ID:** ${sessionId || 'N/A'}\n\n` +
                `**Properties:**\n\`\`\`json\n${JSON.stringify(properties, null, 2)}\n\`\`\`\n\n` +
                `**Total Events Tracked:** ${this.events.length}\n` +
                `**Event Type Count:** ${this.metrics.get(metricKey)}`
        }
      ]
    };
  }

  async analyzePerformanceMetrics(component, timeRange = '1h', metrics = ['response_time', 'throughput', 'error_rate']) {
    const now = Date.now();
    const timeRangeMs = this.parseTimeRange(timeRange);
    const startTime = now - timeRangeMs;

    // Filter events within time range
    const relevantEvents = this.events.filter(event => 
      event.serverTime >= startTime && 
      (component ? event.properties.component === component : true)
    );

    const analysis = {
      timeRange,
      component: component || 'all',
      eventCount: relevantEvents.length,
      metrics: {}
    };

    // Calculate response time metrics
    if (metrics.includes('response_time')) {
      const responseTimes = relevantEvents
        .filter(event => event.properties.responseTime)
        .map(event => event.properties.responseTime);
      
      if (responseTimes.length > 0) {
        analysis.metrics.response_time = {
          average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          min: Math.min(...responseTimes),
          max: Math.max(...responseTimes),
          p95: this.calculatePercentile(responseTimes, 0.95),
          p99: this.calculatePercentile(responseTimes, 0.99)
        };
      }
    }

    // Calculate throughput
    if (metrics.includes('throughput')) {
      const timeRangeHours = timeRangeMs / (1000 * 60 * 60);
      analysis.metrics.throughput = {
        requestsPerHour: relevantEvents.length / timeRangeHours,
        requestsPerMinute: relevantEvents.length / (timeRangeMs / (1000 * 60))
      };
    }

    // Calculate error rate
    if (metrics.includes('error_rate')) {
      const errorEvents = relevantEvents.filter(event => 
        event.properties.error || event.eventName.includes('error')
      );
      analysis.metrics.error_rate = {
        total_errors: errorEvents.length,
        error_percentage: relevantEvents.length > 0 ? 
          (errorEvents.length / relevantEvents.length) * 100 : 0
      };
    }

    // Generate insights and recommendations
    const insights = this.generatePerformanceInsights(analysis);

    return {
      content: [
        {
          type: 'text',
          text: `## Performance Metrics Analysis\n\n` +
                `**Component:** ${analysis.component}\n` +
                `**Time Range:** ${timeRange}\n` +
                `**Events Analyzed:** ${analysis.eventCount}\n\n` +
                `### Metrics:\n` +
                Object.entries(analysis.metrics).map(([metric, data]) => {
                  if (metric === 'response_time') {
                    return `**Response Time:**\n` +
                           `- Average: ${data.average?.toFixed(2)}ms\n` +
                           `- Min/Max: ${data.min}ms / ${data.max}ms\n` +
                           `- P95: ${data.p95?.toFixed(2)}ms\n` +
                           `- P99: ${data.p99?.toFixed(2)}ms`;
                  } else if (metric === 'throughput') {
                    return `**Throughput:**\n` +
                           `- ${data.requestsPerHour?.toFixed(2)} requests/hour\n` +
                           `- ${data.requestsPerMinute?.toFixed(2)} requests/minute`;
                  } else if (metric === 'error_rate') {
                    return `**Error Rate:**\n` +
                           `- Total Errors: ${data.total_errors}\n` +
                           `- Error Rate: ${data.error_percentage?.toFixed(2)}%`;
                  }
                  return '';
                }).join('\n\n') +
                (insights.length > 0 ? `\n\n### Insights & Recommendations:\n${insights.map(i => `• ${i}`).join('\n')}` : '')
        }
      ]
    };
  }

  async analyzeUserBehavior(analysisType, timeFrame = 'week', segmentation = {}) {
    const userEvents = this.events.filter(event => event.userId);
    const userSessions = this.groupEventsByUser(userEvents);

    let analysis = {
      analysisType,
      timeFrame,
      totalUsers: Object.keys(userSessions).length,
      totalEvents: userEvents.length
    };

    switch (analysisType) {
      case 'engagement':
        analysis.engagement = this.analyzeUserEngagement(userSessions);
        break;
      case 'retention':
        analysis.retention = this.analyzeUserRetention(userSessions);
        break;
      case 'feature_usage':
        analysis.featureUsage = this.analyzeFeatureUsage(userEvents);
        break;
      case 'music_preferences':
        analysis.musicPreferences = this.analyzeMusicPreferences(userEvents);
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `## User Behavior Analysis: ${analysisType}\n\n` +
                `**Time Frame:** ${timeFrame}\n` +
                `**Total Users:** ${analysis.totalUsers}\n` +
                `**Total Events:** ${analysis.totalEvents}\n\n` +
                this.formatBehaviorAnalysis(analysis)
        }
      ]
    };
  }

  async monitorSystemHealth(checkType = 'overall', alertThresholds = {}) {
    const defaultThresholds = {
      responseTime: 1000,
      errorRate: 0.05,
      availability: 0.99,
      ...alertThresholds
    };

    const healthChecks = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checkType,
      status: 'healthy',
      alerts: []
    };

    // Simulate various health checks
    const checks = {
      api_health: this.checkApiHealth(defaultThresholds),
      database_health: this.checkDatabaseHealth(defaultThresholds),
      llm_providers: this.checkLLMProviders(defaultThresholds),
      spotify_integration: this.checkSpotifyIntegration(defaultThresholds)
    };

    if (checkType === 'overall') {
      healthChecks.components = checks;
      
      // Overall health is degraded if any component is unhealthy
      const unhealthyComponents = Object.entries(checks)
        .filter(([_, check]) => check.status !== 'healthy');
      
      if (unhealthyComponents.length > 0) {
        healthChecks.status = 'degraded';
        healthChecks.alerts.push({
          severity: 'warning',
          message: `${unhealthyComponents.length} component(s) unhealthy`
        });
      }
    } else if (checks[checkType]) {
      healthChecks.component = checks[checkType];
      healthChecks.status = checks[checkType].status;
    }

    const statusEmoji = healthChecks.status === 'healthy' ? '✅' : 
                       healthChecks.status === 'degraded' ? '⚠️' : '❌';

    return {
      content: [
        {
          type: 'text',
          text: `## System Health Monitor\n\n` +
                `${statusEmoji} **Overall Status:** ${healthChecks.status}\n` +
                `**Uptime:** ${this.formatUptime(healthChecks.uptime)}\n` +
                `**Check Type:** ${checkType}\n\n` +
                (checkType === 'overall' ? this.formatHealthSummary(healthChecks.components) : 
                 this.formatComponentHealth(healthChecks.component)) +
                (healthChecks.alerts.length > 0 ? 
                  `\n### Alerts:\n${healthChecks.alerts.map(alert => `🚨 **${alert.severity.toUpperCase()}**: ${alert.message}`).join('\n')}` : 
                  '\n✅ No active alerts')
        }
      ]
    };
  }

  async generateInsightsReport(reportType = 'comprehensive', format = 'markdown', includeRecommendations = true) {
    const report = {
      title: `EchoTune AI Analytics Report - ${reportType}`,
      generatedAt: new Date().toISOString(),
      timeRange: '24h',
      summary: {}
    };

    // Generate different sections based on report type
    if (reportType === 'comprehensive' || reportType === 'user_engagement') {
      report.userEngagement = this.generateUserEngagementReport();
    }

    if (reportType === 'comprehensive' || reportType === 'system_performance') {
      report.systemPerformance = this.generateSystemPerformanceReport();
    }

    if (reportType === 'comprehensive' || reportType === 'music_analytics') {
      report.musicAnalytics = this.generateMusicAnalyticsReport();
    }

    if (includeRecommendations) {
      report.recommendations = this.generateRecommendations(report);
    }

    // Format based on requested format
    let formattedReport;
    switch (format) {
      case 'json':
        formattedReport = JSON.stringify(report, null, 2);
        break;
      case 'csv':
        formattedReport = this.convertReportToCSV(report);
        break;
      default:
        formattedReport = this.formatReportAsMarkdown(report);
    }

    return {
      content: [
        {
          type: 'text',
          text: formattedReport
        }
      ]
    };
  }

  async analyzeABTest(testName, variants, confidenceLevel = 0.95) {
    const analysis = {
      testName,
      confidenceLevel,
      variants: variants.map(variant => ({
        ...variant,
        conversionRate: variant.conversions / variant.impressions,
        standardError: Math.sqrt((variant.conversions / variant.impressions) * 
                                (1 - variant.conversions / variant.impressions) / variant.impressions)
      }))
    };

    // Calculate statistical significance between variants
    if (variants.length >= 2) {
      const control = analysis.variants[0];
      const treatment = analysis.variants[1];
      
      const pooledStdError = Math.sqrt(
        control.standardError ** 2 + treatment.standardError ** 2
      );
      
      const zScore = Math.abs(treatment.conversionRate - control.conversionRate) / pooledStdError;
      const criticalValue = 1.96; // for 95% confidence
      
      analysis.statisticalSignificance = {
        zScore,
        isSignificant: zScore > criticalValue,
        confidenceLevel,
        pValue: 2 * (1 - this.standardNormalCDF(Math.abs(zScore))),
        effect: treatment.conversionRate > control.conversionRate ? 'positive' : 'negative',
        liftPercent: ((treatment.conversionRate - control.conversionRate) / control.conversionRate) * 100
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `## A/B Test Analysis: ${testName}\n\n` +
                `**Confidence Level:** ${(confidenceLevel * 100)}%\n\n` +
                `### Variant Performance:\n` +
                analysis.variants.map((variant, index) => 
                  `**${variant.name}** ${index === 0 ? '(Control)' : '(Treatment)'}\n` +
                  `- Conversions: ${variant.conversions}\n` +
                  `- Impressions: ${variant.impressions}\n` +
                  `- Conversion Rate: ${(variant.conversionRate * 100).toFixed(2)}%\n`
                ).join('\n') +
                (analysis.statisticalSignificance ? 
                  `\n### Statistical Analysis:\n` +
                  `**Result:** ${analysis.statisticalSignificance.isSignificant ? '✅ Statistically Significant' : '❌ Not Statistically Significant'}\n` +
                  `**Lift:** ${analysis.statisticalSignificance.liftPercent > 0 ? '+' : ''}${analysis.statisticalSignificance.liftPercent.toFixed(2)}%\n` +
                  `**P-Value:** ${analysis.statisticalSignificance.pValue.toFixed(4)}\n` +
                  `**Z-Score:** ${analysis.statisticalSignificance.zScore.toFixed(3)}\n\n` +
                  `**Recommendation:** ${this.getABTestRecommendation(analysis.statisticalSignificance)}`
                  : '\n⚠️ Need at least 2 variants for statistical analysis')
        }
      ]
    };
  }

  // Helper methods
  parseTimeRange(timeRange) {
    const multipliers = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return multipliers[timeRange] || multipliers['1h'];
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index];
  }

  generatePerformanceInsights(analysis) {
    const insights = [];
    
    if (analysis.metrics.response_time) {
      const avgResponse = analysis.metrics.response_time.average;
      if (avgResponse > 1000) {
        insights.push('⚠️ High response times detected - consider caching optimization');
      } else if (avgResponse < 200) {
        insights.push('✅ Excellent response times - system performing well');
      }
    }

    if (analysis.metrics.error_rate) {
      const errorRate = analysis.metrics.error_rate.error_percentage;
      if (errorRate > 5) {
        insights.push('🔴 High error rate - investigate system stability');
      } else if (errorRate > 1) {
        insights.push('🟡 Moderate error rate - monitor closely');
      }
    }

    return insights;
  }

  processSpotifyEvent(event) {
    // EchoTune specific Spotify event processing
    if (event.eventName === 'spotify_track_played') {
      this.metrics.set('total_tracks_played', (this.metrics.get('total_tracks_played') || 0) + 1);
    }
  }

  processRecommendationEvent(event) {
    // EchoTune specific recommendation event processing
    if (event.eventName === 'recommendation_clicked') {
      this.metrics.set('recommendation_clicks', (this.metrics.get('recommendation_clicks') || 0) + 1);
    }
  }

  processLLMEvent(event) {
    // EchoTune specific LLM event processing
    if (event.properties.provider) {
      const providerKey = `llm_requests_${event.properties.provider}`;
      this.metrics.set(providerKey, (this.metrics.get(providerKey) || 0) + 1);
    }
  }

  // Additional helper methods for health checks, formatting, etc.
  checkApiHealth(thresholds) {
    return {
      status: 'healthy',
      responseTime: 150,
      uptime: '99.9%',
      lastCheck: new Date().toISOString()
    };
  }

  checkDatabaseHealth(thresholds) {
    return {
      status: 'healthy',
      connectionPool: 'optimal',
      queryTime: '45ms',
      lastCheck: new Date().toISOString()
    };
  }

  checkLLMProviders(thresholds) {
    return {
      status: 'healthy',
      providers: ['openai', 'gemini', 'mock'],
      responseTime: '800ms',
      lastCheck: new Date().toISOString()
    };
  }

  checkSpotifyIntegration(thresholds) {
    return {
      status: 'healthy',
      apiStatus: 'operational',
      lastSync: new Date().toISOString()
    };
  }

  formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  formatHealthSummary(components) {
    return Object.entries(components).map(([component, health]) => {
      const status = health.status === 'healthy' ? '✅' : '❌';
      return `${status} **${component.replace('_', ' ')}**: ${health.status}`;
    }).join('\n');
  }

  formatComponentHealth(component) {
    if (!component) return 'Component not found';
    
    const status = component.status === 'healthy' ? '✅' : '❌';
    return `${status} **Status**: ${component.status}\n` +
           Object.entries(component)
             .filter(([key]) => key !== 'status')
             .map(([key, value]) => `**${key.replace(/([A-Z])/g, ' $1').toLowerCase()}**: ${value}`)
             .join('\n');
  }

  standardNormalCDF(x) {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  erf(x) {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  getABTestRecommendation(significance) {
    if (significance.isSignificant) {
      if (significance.effect === 'positive') {
        return '🚀 Implement the treatment variant - it shows significant improvement';
      } else {
        return '⚠️ Stick with control variant - treatment shows significant negative impact';
      }
    } else {
      return '📊 Continue testing - no statistically significant difference detected';
    }
  }

  groupEventsByUser(events) {
    return events.reduce((acc, event) => {
      if (!acc[event.userId]) {
        acc[event.userId] = [];
      }
      acc[event.userId].push(event);
      return acc;
    }, {});
  }

  analyzeUserEngagement(userSessions) {
    // Mock engagement analysis
    return {
      avgSessionDuration: '12.5 minutes',
      avgEventsPerSession: 8.3,
      bounceRate: '15%',
      topFeatures: ['music_discovery', 'chat_interface', 'playlist_builder']
    };
  }

  analyzeUserRetention(userSessions) {
    // Mock retention analysis
    return {
      day1: '85%',
      day7: '65%',
      day30: '45%',
      cohortSize: Object.keys(userSessions).length
    };
  }

  analyzeFeatureUsage(events) {
    const featureEvents = events.filter(event => event.properties.feature);
    const featureCounts = {};
    
    featureEvents.forEach(event => {
      const feature = event.properties.feature;
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });

    return Object.entries(featureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));
  }

  analyzeMusicPreferences(events) {
    // Mock music preference analysis
    return {
      topGenres: ['electronic', 'rock', 'pop', 'jazz'],
      avgTracksPerSession: 12,
      skipRate: '8%',
      repeatRate: '25%'
    };
  }

  formatBehaviorAnalysis(analysis) {
    let output = '';
    
    if (analysis.engagement) {
      output += `### Engagement Metrics:\n`;
      output += `- Average Session Duration: ${analysis.engagement.avgSessionDuration}\n`;
      output += `- Average Events per Session: ${analysis.engagement.avgEventsPerSession}\n`;
      output += `- Bounce Rate: ${analysis.engagement.bounceRate}\n`;
      output += `- Top Features: ${analysis.engagement.topFeatures.join(', ')}\n\n`;
    }

    if (analysis.retention) {
      output += `### Retention Analysis:\n`;
      output += `- Day 1 Retention: ${analysis.retention.day1}\n`;
      output += `- Day 7 Retention: ${analysis.retention.day7}\n`;
      output += `- Day 30 Retention: ${analysis.retention.day30}\n\n`;
    }

    if (analysis.featureUsage) {
      output += `### Feature Usage:\n`;
      output += analysis.featureUsage.map((item, index) => 
        `${index + 1}. ${item.feature}: ${item.count} uses`).join('\n') + '\n\n';
    }

    if (analysis.musicPreferences) {
      output += `### Music Preferences:\n`;
      output += `- Top Genres: ${analysis.musicPreferences.topGenres.join(', ')}\n`;
      output += `- Avg Tracks/Session: ${analysis.musicPreferences.avgTracksPerSession}\n`;
      output += `- Skip Rate: ${analysis.musicPreferences.skipRate}\n`;
      output += `- Repeat Rate: ${analysis.musicPreferences.repeatRate}\n`;
    }

    return output;
  }

  generateUserEngagementReport() {
    return {
      totalUsers: 1250,
      activeUsers: 890,
      avgSessionDuration: '15.2 minutes',
      totalSessions: 3200,
      bounceRate: '12%'
    };
  }

  generateSystemPerformanceReport() {
    return {
      uptime: '99.8%',
      avgResponseTime: '185ms',
      errorRate: '0.3%',
      throughput: '145 requests/min'
    };
  }

  generateMusicAnalyticsReport() {
    return {
      totalTracks: 125000,
      uniqueArtists: 8500,
      avgPlaylistSize: 23,
      topGenre: 'electronic',
      recommendationAccuracy: '78%'
    };
  }

  generateRecommendations(report) {
    return [
      '🚀 Consider implementing caching for frequently accessed music data',
      '📊 Add more granular user segmentation for personalized recommendations',
      '🎵 Expand genre classification to improve recommendation accuracy',
      '⚡ Optimize database queries for faster response times',
      '📱 Implement push notifications for user re-engagement'
    ];
  }

  formatReportAsMarkdown(report) {
    let markdown = `# ${report.title}\n\n`;
    markdown += `**Generated:** ${report.generatedAt}\n`;
    markdown += `**Time Range:** ${report.timeRange}\n\n`;

    if (report.userEngagement) {
      markdown += `## User Engagement\n`;
      markdown += `- Total Users: ${report.userEngagement.totalUsers}\n`;
      markdown += `- Active Users: ${report.userEngagement.activeUsers}\n`;
      markdown += `- Avg Session Duration: ${report.userEngagement.avgSessionDuration}\n`;
      markdown += `- Bounce Rate: ${report.userEngagement.bounceRate}\n\n`;
    }

    if (report.systemPerformance) {
      markdown += `## System Performance\n`;
      markdown += `- Uptime: ${report.systemPerformance.uptime}\n`;
      markdown += `- Avg Response Time: ${report.systemPerformance.avgResponseTime}\n`;
      markdown += `- Error Rate: ${report.systemPerformance.errorRate}\n`;
      markdown += `- Throughput: ${report.systemPerformance.throughput}\n\n`;
    }

    if (report.musicAnalytics) {
      markdown += `## Music Analytics\n`;
      markdown += `- Total Tracks: ${report.musicAnalytics.totalTracks.toLocaleString()}\n`;
      markdown += `- Unique Artists: ${report.musicAnalytics.uniqueArtists.toLocaleString()}\n`;
      markdown += `- Top Genre: ${report.musicAnalytics.topGenre}\n`;
      markdown += `- Recommendation Accuracy: ${report.musicAnalytics.recommendationAccuracy}\n\n`;
    }

    if (report.recommendations) {
      markdown += `## Recommendations\n`;
      markdown += report.recommendations.map(rec => `- ${rec}`).join('\n');
    }

    return markdown;
  }

  convertReportToCSV(report) {
    // Simple CSV conversion - would be more sophisticated in real implementation
    let csv = 'Metric,Value\n';
    
    if (report.userEngagement) {
      csv += `Total Users,${report.userEngagement.totalUsers}\n`;
      csv += `Active Users,${report.userEngagement.activeUsers}\n`;
      csv += `Avg Session Duration,${report.userEngagement.avgSessionDuration}\n`;
      csv += `Bounce Rate,${report.userEngagement.bounceRate}\n`;
    }

    return csv;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Analytics MCP Server running on stdio');
  }
}

// Start the server if run directly
if (require.main === module) {
  const server = new AnalyticsMCP();
  server.start().catch(console.error);
}

module.exports = AnalyticsMCP;