/**
 * Enhanced Real-time Analytics Dashboard
 * 
 * Advanced analytics dashboard with real-time data updates, interactive charts,
 * and comprehensive user behavior insights as outlined in the strategic roadmap.
 * 
 * Features:
 * - Real-time data updates with WebSocket integration
 * - Interactive charts and visualizations
 * - User behavior analysis and insights
 * - Performance metrics and system health
 * - Export functionality for analytics data
 * - Customizable dashboard widgets
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './EnhancedAnalyticsDashboard.css';

const EnhancedAnalyticsDashboard = ({ userId, isAdmin = false }) => {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    listeningActivity: [],
    genreDistribution: [],
    timePatterns: [],
    recommendationEffectiveness: {},
    systemMetrics: {},
    userEngagement: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetrics, setSelectedMetrics] = useState([
    'listening_activity',
    'genre_distribution',
    'recommendation_effectiveness',
    'time_patterns'
  ]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    let ws = null;
    
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://localhost:3000/analytics-ws?userId=${userId}&token=${localStorage.getItem('token')}`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('📊 Analytics WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            handleRealTimeUpdate(update);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('📊 Analytics WebSocket disconnected');
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error('Analytics WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to connect to analytics WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [userId, realTimeEnabled]);

  // Initial data load
  useEffect(() => {
    loadAnalyticsData();
  }, [userId, timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = useCallback((update) => {
    setAnalyticsData(prev => {
      const newData = { ...prev };
      
      switch (update.type) {
        case 'listening_activity':
          newData.listeningActivity = [...(prev.listeningActivity || []), update.data].slice(-50);
          break;
        case 'genre_update':
          newData.genreDistribution = update.data;
          break;
        case 'recommendation_feedback':
          newData.recommendationEffectiveness = {
            ...prev.recommendationEffectiveness,
            ...update.data
          };
          break;
        case 'system_metrics':
          newData.systemMetrics = { ...prev.systemMetrics, ...update.data };
          break;
        default:
          console.log('Unknown update type:', update.type);
      }

      return newData;
    });
    
    setLastUpdated(new Date());
  }, []);

  const exportAnalyticsData = async (format = 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Failed to export analytics data');
    }
  };

  const chartColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f093fb',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#ef4444'
  };

  const MetricWidget = ({ title, value, change, icon, color = 'primary' }) => (
    <motion.div 
      className="metric-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="metric-header">
        <span className="metric-icon" style={{ color: chartColors[color] }}>
          {icon}
        </span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
        </div>
      )}
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !analyticsData.overview.totalTracks) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>❌ Error loading analytics: {error}</p>
        <button onClick={loadAnalyticsData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="enhanced-analytics-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>📊 Enhanced Analytics Dashboard</h2>
          <p className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {realTimeEnabled && <span className="real-time-indicator">🔴 LIVE</span>}
          </p>
        </div>
        
        <div className="header-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last Year</option>
          </select>

          <button
            className={`real-time-toggle ${realTimeEnabled ? 'active' : ''}`}
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            {realTimeEnabled ? '🔴 Live' : '⏸️ Paused'}
          </button>

          <div className="export-controls">
            <button onClick={() => exportAnalyticsData('json')}>
              📄 Export JSON
            </button>
            <button onClick={() => exportAnalyticsData('csv')}>
              📊 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="overview-metrics">
        <MetricWidget
          title="Total Tracks Played"
          value={analyticsData.overview.totalTracks?.toLocaleString() || '0'}
          change={analyticsData.overview.tracksChange}
          icon="🎵"
          color="primary"
        />
        <MetricWidget
          title="Listening Time"
          value={`${Math.round((analyticsData.overview.totalMinutes || 0) / 60)}h`}
          change={analyticsData.overview.timeChange}
          icon="⏱️"
          color="secondary"
        />
        <MetricWidget
          title="Recommendations Used"
          value={analyticsData.overview.recommendationsUsed || '0'}
          change={analyticsData.overview.recommendationsChange}
          icon="🤖"
          color="accent"
        />
        <MetricWidget
          title="Discovery Rate"
          value={`${Math.round(analyticsData.overview.discoveryRate || 0)}%`}
          change={analyticsData.overview.discoveryChange}
          icon="🔍"
          color="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Listening Activity Chart */}
        {selectedMetrics.includes('listening_activity') && (
          <motion.div 
            className="chart-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="chart-header">
              <h3>🎵 Listening Activity</h3>
              <div className="chart-controls">
                <button className="chart-control active">Tracks</button>
                <button className="chart-control">Minutes</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.listeningActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tracks"
                  stroke={chartColors.primary}
                  fill={`url(#colorTracks)`}
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorTracks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Genre Distribution */}
        {selectedMetrics.includes('genre_distribution') && (
          <motion.div 
            className="chart-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="chart-header">
              <h3>🎭 Genre Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.genreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.genreDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.keys(chartColors).length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Time Patterns */}
        {selectedMetrics.includes('time_patterns') && (
          <motion.div 
            className="chart-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="chart-header">
              <h3>⏰ Listening Patterns</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.timePatterns}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="hour" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="activity"
                  fill={chartColors.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recommendation Effectiveness */}
        {selectedMetrics.includes('recommendation_effectiveness') && (
          <motion.div 
            className="chart-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="chart-header">
              <h3>🤖 AI Recommendation Performance</h3>
            </div>
            <div className="recommendation-metrics">
              <div className="rec-metric">
                <div className="rec-metric-label">Success Rate</div>
                <div className="rec-metric-value">
                  {Math.round(analyticsData.recommendationEffectiveness.successRate || 0)}%
                </div>
                <div className="rec-metric-bar">
                  <div 
                    className="rec-metric-fill"
                    style={{ 
                      width: `${analyticsData.recommendationEffectiveness.successRate || 0}%`,
                      backgroundColor: chartColors.success
                    }}
                  ></div>
                </div>
              </div>

              <div className="rec-metric">
                <div className="rec-metric-label">Click-through Rate</div>
                <div className="rec-metric-value">
                  {Math.round(analyticsData.recommendationEffectiveness.clickThroughRate || 0)}%
                </div>
                <div className="rec-metric-bar">
                  <div 
                    className="rec-metric-fill"
                    style={{ 
                      width: `${analyticsData.recommendationEffectiveness.clickThroughRate || 0}%`,
                      backgroundColor: chartColors.primary
                    }}
                  ></div>
                </div>
              </div>

              <div className="rec-metric">
                <div className="rec-metric-label">Diversity Score</div>
                <div className="rec-metric-value">
                  {Math.round(analyticsData.recommendationEffectiveness.diversityScore || 0)}%
                </div>
                <div className="rec-metric-bar">
                  <div 
                    className="rec-metric-fill"
                    style={{ 
                      width: `${analyticsData.recommendationEffectiveness.diversityScore || 0}%`,
                      backgroundColor: chartColors.accent
                    }}
                  ></div>
                </div>
              </div>

              <div className="rec-model-performance">
                <h4>Model Performance</h4>
                {Object.entries(analyticsData.recommendationEffectiveness.modelPerformance || {}).map(([model, score]) => (
                  <div key={model} className="model-score">
                    <span className="model-name">{model}</span>
                    <div className="model-bar">
                      <div 
                        className="model-fill"
                        style={{ 
                          width: `${score * 100}%`,
                          backgroundColor: chartColors[Object.keys(chartColors)[Math.abs(model.charCodeAt(0)) % Object.keys(chartColors).length]]
                        }}
                      ></div>
                    </div>
                    <span className="model-value">{Math.round(score * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* System Health (Admin Only) */}
        {isAdmin && (
          <motion.div 
            className="chart-container system-health"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="chart-header">
              <h3>🔧 System Health</h3>
            </div>
            <div className="system-metrics">
              <div className="system-metric">
                <span className="system-label">API Response Time</span>
                <span className="system-value">{analyticsData.systemMetrics.avgResponseTime || 0}ms</span>
                <div className={`system-status ${analyticsData.systemMetrics.avgResponseTime < 200 ? 'good' : analyticsData.systemMetrics.avgResponseTime < 500 ? 'warning' : 'error'}`}></div>
              </div>
              
              <div className="system-metric">
                <span className="system-label">Database Connections</span>
                <span className="system-value">{analyticsData.systemMetrics.dbConnections || 0}</span>
                <div className="system-status good"></div>
              </div>
              
              <div className="system-metric">
                <span className="system-label">Memory Usage</span>
                <span className="system-value">{analyticsData.systemMetrics.memoryUsage || 0}%</span>
                <div className={`system-status ${analyticsData.systemMetrics.memoryUsage < 70 ? 'good' : analyticsData.systemMetrics.memoryUsage < 90 ? 'warning' : 'error'}`}></div>
              </div>
              
              <div className="system-metric">
                <span className="system-label">Active Users</span>
                <span className="system-value">{analyticsData.systemMetrics.activeUsers || 0}</span>
                <div className="system-status good"></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Insights Panel */}
      <motion.div 
        className="insights-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3>🔍 AI-Generated Insights</h3>
        <div className="insights-list">
          {analyticsData.insights?.map((insight, index) => (
            <div key={index} className="insight-item">
              <div className="insight-icon">{insight.icon}</div>
              <div className="insight-content">
                <div className="insight-title">{insight.title}</div>
                <div className="insight-description">{insight.description}</div>
                {insight.action && (
                  <button className="insight-action">{insight.action}</button>
                )}
              </div>
            </div>
          )) || (
            <div className="insight-item">
              <div className="insight-icon">🤖</div>
              <div className="insight-content">
                <div className="insight-title">Analysis in Progress</div>
                <div className="insight-description">AI is analyzing your listening patterns to generate personalized insights.</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;