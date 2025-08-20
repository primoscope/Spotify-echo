/**
 * Enhanced Provider Panel with Autonomous Health Monitoring
 * Includes research-driven improvements and real-time health metrics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Grid,
  Tooltip,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Speed,
  Memory,
  CloudQueue,
  Refresh,
  ExpandMore,
  ExpandLess,
  AutoMode,
  TrendingUp,
  Analytics,
  HealthAndSafety,
  MonetizationOn,
  SwapHoriz,
  Assessment,
  Timer,
  BugReport
} from '@mui/icons-material';
import { useLLM } from '../contexts/LLMContext';

/**
 * Enhanced Provider Panel with Autonomous Monitoring, Failover, and Cost Tracking
 */
const EnhancedProviderPanel = ({ onAutonomousRecommendation }) => {
  const {
    currentProvider,
    providers,
    providerHealth,
    refreshProviders,
    switchProviderEnhanced
  } = useLLM();

  // Enhanced state management
  const [expanded, setExpanded] = useState({});
  const [autonomousMonitoring, setAutonomousMonitoring] = useState(true);
  const [autoFailover, setAutoFailover] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState({});
  const [healthTrends, setHealthTrends] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [costTracking, setCostTracking] = useState({});
  const [benchmarkResults, setBenchmarkResults] = useState({});
  const [failoverHistory, setFailoverHistory] = useState([]);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);

  // Memoized provider statistics with cost analysis
  const providerStats = useMemo(() => {
    const stats = {
      total: Object.keys(providers).length,
      healthy: 0,
      warning: 0,
      error: 0,
      available: 0,
      totalCost24h: 0,
      avgLatency: 0,
      totalRequests24h: 0
    };

    let latencySum = 0;
    let latencyCount = 0;

    Object.entries(providers).forEach(([id, info]) => {
      if (info.available) stats.available++;
      
      const health = providerHealth[id];
      if (health?.health === 'healthy') stats.healthy++;
      else if (health?.health === 'recovering') stats.warning++;
      else stats.error++;

      // Cost tracking calculations
      const cost = costTracking[id];
      if (cost) {
        stats.totalCost24h += cost.cost24h || 0;
        stats.totalRequests24h += cost.requests24h || 0;
      }

      // Latency calculations
      if (health?.responseTime) {
        latencySum += health.responseTime;
        latencyCount++;
      }
    });

    if (latencyCount > 0) {
      stats.avgLatency = Math.round(latencySum / latencyCount);
    }

    return stats;
  }, [providers, providerHealth, costTracking]);

  // Enhanced cost tracking calculations
  const updateCostTracking = useCallback((providerId, tokens, latency) => {
    setCostTracking(prev => {
      const current = prev[providerId] || { cost24h: 0, requests24h: 0, tokens24h: 0 };
      
      // Estimate cost based on provider and token usage
      const costPer1kTokens = getCostPer1kTokens(providerId);
      const requestCost = (tokens / 1000) * costPer1kTokens;

      return {
        ...prev,
        [providerId]: {
          cost24h: current.cost24h + requestCost,
          requests24h: current.requests24h + 1,
          tokens24h: current.tokens24h + tokens,
          avgLatency: current.avgLatency ? 
            (current.avgLatency + latency) / 2 : latency,
          lastRequest: new Date(),
          efficiency: calculateEfficiency(latency, requestCost)
        }
      };
    });
  }, []);

  // Cost estimation helper
  const getCostPer1kTokens = useCallback((providerId) => {
    const costMap = {
      'openai': 0.03,      // GPT-4 pricing
      'gemini': 0.015,     // Gemini Pro pricing  
      'openrouter': 0.025, // Average OpenRouter pricing
      'mock': 0.001        // Mock provider
    };
    return costMap[providerId] || 0.02;
  }, []);

  // Efficiency calculation
  const calculateEfficiency = useCallback((latency, cost) => {
    // Higher efficiency = lower latency and cost
    const latencyScore = Math.max(0, 100 - (latency / 10));
    const costScore = Math.max(0, 100 - (cost * 1000));
    return Math.round((latencyScore + costScore) / 2);
  }, []);

  // Automatic failover logic
  const checkAndTriggerFailover = useCallback(async (currentProviderId) => {
    if (!autoFailover) return;

    const currentHealth = providerHealth[currentProviderId];
    const shouldFailover = 
      !currentHealth?.available ||
      currentHealth.health === 'unhealthy' ||
      (currentHealth.responseTime > 5000 && currentHealth.consecutiveFailures > 2);

    if (shouldFailover) {
      // Find best alternative provider
      const alternatives = Object.entries(providers)
        .filter(([id, info]) => 
          id !== currentProviderId && 
          info.available && 
          providerHealth[id]?.health === 'healthy'
        )
        .sort((a, b) => {
          const aHealth = providerHealth[a[0]];
          const bHealth = providerHealth[b[0]];
          
          // Sort by efficiency score
          const aEfficiency = costTracking[a[0]]?.efficiency || 0;
          const bEfficiency = costTracking[b[0]]?.efficiency || 0;
          
          return bEfficiency - aEfficiency;
        });

      if (alternatives.length > 0) {
        const [newProviderId] = alternatives[0];
        
        try {
          await switchProviderEnhanced(newProviderId);
          
          setFailoverHistory(prev => [...prev.slice(-4), {
            timestamp: new Date(),
            from: currentProviderId,
            to: newProviderId,
            reason: `Auto-failover: ${currentHealth.health} health`,
            success: true
          }]);

          setRecommendations(prev => [...prev, {
            id: `failover_${Date.now()}`,
            type: 'success',
            message: `Automatically switched from ${currentProviderId} to ${newProviderId}`,
            severity: 'info',
            timestamp: new Date(),
            action: 'view_metrics'
          }]);

        } catch (error) {
          setFailoverHistory(prev => [...prev.slice(-4), {
            timestamp: new Date(),
            from: currentProviderId,
            to: newProviderId,
            reason: 'Auto-failover attempted',
            success: false,
            error: error.message
          }]);
        }
      }
    }
  }, [autoFailover, providers, providerHealth, costTracking, switchProviderEnhanced]);

  // Benchmark all providers
  const runProviderBenchmark = useCallback(async () => {
    setIsRunningBenchmark(true);
    const testQuery = "Recommend 3 popular rock songs from the 2000s";
    const benchmarkPromises = [];

    Object.keys(providers).forEach(providerId => {
      if (providers[providerId].available) {
        benchmarkPromises.push(
          benchmarkProvider(providerId, testQuery)
        );
      }
    });

    try {
      const results = await Promise.allSettled(benchmarkPromises);
      const benchmarks = {};

      results.forEach((result, index) => {
        const providerId = Object.keys(providers)[index];
        if (result.status === 'fulfilled') {
          benchmarks[providerId] = result.value;
        } else {
          benchmarks[providerId] = {
            error: result.reason.message,
            latency: null,
            score: 0
          };
        }
      });

      setBenchmarkResults(benchmarks);
      
      setRecommendations(prev => [...prev, {
        id: `benchmark_${Date.now()}`,
        type: 'info',
        message: 'Provider benchmark completed',
        severity: 'success',
        timestamp: new Date(),
        data: benchmarks
      }]);

    } catch (error) {
      console.error('Benchmark error:', error);
    } finally {
      setIsRunningBenchmark(false);
    }
  }, [providers]);

  // Individual provider benchmark
  const benchmarkProvider = useCallback(async (providerId, testQuery) => {
    const startTime = performance.now();
    
    try {
      // This would call the actual provider API
      // For now, simulate with realistic timing
      const simulatedLatency = Math.random() * 2000 + 500;
      await new Promise(resolve => setTimeout(resolve, simulatedLatency));
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      return {
        latency: Math.round(latency),
        score: Math.round(Math.max(0, 100 - (latency / 20))),
        timestamp: new Date(),
        tokensUsed: Math.floor(Math.random() * 500) + 100,
        success: true
      };
    } catch (error) {
      return {
        latency: null,
        score: 0,
        error: error.message,
        success: false
      };
    }
  }, []);

  // Autonomous monitoring with enhanced recommendations
  useEffect(() => {
    if (!autonomousMonitoring) return;

    const interval = setInterval(async () => {
      // Check current provider health
      const health = providerHealth[currentProvider];
      
      if (health) {
        // Update performance history
        setPerformanceHistory(prev => ({
          ...prev,
          [currentProvider]: [
            ...(prev[currentProvider] || []).slice(-19), // Keep last 20 entries
            {
              timestamp: new Date(),
              responseTime: health.responseTime,
              success: health.available,
              health: health.health
            }
          ]
        }));

        // Generate recommendations based on performance
        if (health.responseTime > 2000) {
          setRecommendations(prev => {
            const existing = prev.find(r => r.type === 'performance');
            if (!existing) {
              return [...prev, {
                id: `perf_${Date.now()}`,
                type: 'performance',
                message: `Response time is high (${health.responseTime}ms). Consider switching providers.`,
                severity: 'warning',
                timestamp: new Date(),
                action: 'switch_provider',
                providerId: currentProvider
              }];
            }
            return prev;
          });
        }

        // Check for cost optimization opportunities
        const cost = costTracking[currentProvider];
        if (cost && cost.cost24h > 5) { // $5 threshold
          setRecommendations(prev => {
            const existing = prev.find(r => r.type === 'cost');
            if (!existing) {
              return [...prev, {
                id: `cost_${Date.now()}`,
                type: 'cost',
                message: `Daily cost is high ($${cost.cost24h.toFixed(2)}). Review usage patterns.`,
                severity: 'info',
                timestamp: new Date(),
                action: 'review_costs'
              }];
            }
            return prev;
          });
        }

        // Trigger failover check
        await checkAndTriggerFailover(currentProvider);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [autonomousMonitoring, currentProvider, providerHealth, costTracking, checkAndTriggerFailover]);

  // Performance trend analysis
  useEffect(() => {
    const trends = {};
    
    Object.entries(performanceHistory).forEach(([providerId, history]) => {
      if (history.length >= 5) {
        const recent = history.slice(-5);
        const avgLatency = recent.reduce((sum, h) => sum + h.responseTime, 0) / recent.length;
        const successRate = recent.filter(h => h.success).length / recent.length * 100;
        
        trends[providerId] = {
          avgLatency: Math.round(avgLatency),
          successRate: Math.round(successRate),
          trend: history.length >= 10 ? calculateTrend(history.slice(-10)) : 'stable'
        };
      }
    });

    setHealthTrends(trends);
  }, [performanceHistory]);

  // Trend calculation helper
  const calculateTrend = useCallback((history) => {
    if (history.length < 5) return 'stable';
    
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, h) => sum + h.responseTime, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, h) => sum + h.responseTime, 0) / secondHalf.length;
    
    const improvement = ((firstAvg - secondAvg) / firstAvg) * 100;
    
    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'degrading';
    return 'stable';
  }, []);

  // Provider switch handler with cost consideration
  const handleProviderSwitch = useCallback(async (providerId) => {
    try {
      await switchProviderEnhanced(providerId);
      
      // Log the switch for cost tracking
      setFailoverHistory(prev => [...prev.slice(-4), {
        timestamp: new Date(),
        from: currentProvider,
        to: providerId,
        reason: 'Manual switch',
        success: true
      }]);

    } catch (error) {
      console.error('Provider switch failed:', error);
    }
  }, [currentProvider, switchProviderEnhanced]);

  // Clear old recommendations
  useEffect(() => {
    const cleanup = setInterval(() => {
      setRecommendations(prev => 
        prev.filter(r => 
          new Date() - new Date(r.timestamp) < 300000 // Keep for 5 minutes
        )
      );
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanup);
  }, []);
    });

    return stats;
  }, [providers, providerHealth]);

  // Performance monitoring effect
  useEffect(() => {
    if (!autonomousMonitoring) return;

    const interval = setInterval(() => {
      Object.entries(providerHealth).forEach(([providerId, health]) => {
        if (health?.responseTime) {
          setPerformanceHistory(prev => ({
            ...prev,
            [providerId]: [
              ...(prev[providerId] || []).slice(-19), // Keep last 20 measurements
              {
                timestamp: Date.now(),
                responseTime: health.responseTime,
                errorRate: health.errorRate || 0
              }
            ]
          }));

          // Generate autonomous recommendations
          if (health.responseTime > 2000) {
            addRecommendation({
              type: 'performance',
              providerId,
              message: `${providers[providerId]?.name} response time is high (${health.responseTime}ms). Consider switching providers or implementing caching.`,
              severity: 'warning',
              action: 'switch_provider'
            });
          }

          if (health.errorRate > 0.1) {
            addRecommendation({
              type: 'reliability',
              providerId,
              message: `${providers[providerId]?.name} has high error rate (${Math.round(health.errorRate * 100)}%). Consider fallback strategies.`,
              severity: 'error',
              action: 'implement_fallback'
            });
          }
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [autonomousMonitoring, providerHealth, providers]);

  // Add recommendation helper
  const addRecommendation = useCallback((recommendation) => {
    const id = `${recommendation.type}_${recommendation.providerId}_${Date.now()}`;
    const newRecommendation = { ...recommendation, id, timestamp: Date.now() };
    
    setRecommendations(prev => {
      const filtered = prev.filter(r => 
        !(r.type === recommendation.type && r.providerId === recommendation.providerId)
      );
      return [newRecommendation, ...filtered].slice(0, 10); // Keep max 10 recommendations
    });

    // Notify parent component
    if (onAutonomousRecommendation) {
      onAutonomousRecommendation(newRecommendation);
    }
  }, [onAutonomousRecommendation]);

  // Provider switching with autonomous optimization
  const handleProviderSwitch = useCallback(async (providerId) => {
    const startTime = performance.now();
    
    try {
      await switchProviderEnhanced(providerId);
      const switchTime = performance.now() - startTime;
      
      // Record switch performance
      setPerformanceHistory(prev => ({
        ...prev,
        [`switch_${providerId}`]: [
          ...(prev[`switch_${providerId}`] || []).slice(-9), // Keep last 10 switches
          {
            timestamp: Date.now(),
            switchTime,
            success: true
          }
        ]
      }));

      if (autonomousMonitoring && switchTime > 1000) {
        addRecommendation({
          type: 'switch_performance',
          providerId,
          message: `Provider switching took ${Math.round(switchTime)}ms. Consider implementing connection pre-warming.`,
          severity: 'info',
          action: 'optimize_switching'
        });
      }

    } catch (error) {
      console.error('Provider switch failed:', error);
      
      if (autonomousMonitoring) {
        addRecommendation({
          type: 'switch_failure',
          providerId,
          message: `Failed to switch to ${providers[providerId]?.name}. Error: ${error.message}`,
          severity: 'error',
          action: 'check_configuration'
        });
      }
    }
  }, [switchProviderEnhanced, providers, autonomousMonitoring, addRecommendation]);

  // Toggle provider details
  const toggleExpanded = useCallback((providerId) => {
    setExpanded(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  }, []);

  // Get health color
  const getHealthColor = useCallback((health) => {
    if (health === 'healthy') return 'success';
    if (health === 'recovering') return 'warning';
    return 'error';
  }, []);

  // Get health icon
  const getHealthIcon = useCallback((health) => {
    if (health === 'healthy') return <CheckCircle />;
    if (health === 'recovering') return <Warning />;
    return <Error />;
  }, []);

  // Calculate performance trend
  const getPerformanceTrend = useCallback((providerId) => {
    const history = performanceHistory[providerId];
    if (!history || history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.reduce((sum, item) => sum + item.responseTime, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.responseTime, 0) / (older.length || 1);

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.2) return 'declining';
    if (change < -0.2) return 'improving';
    return 'stable';
  }, [performanceHistory]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Autonomous Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Provider Management</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autonomousMonitoring}
                onChange={(e) => setAutonomousMonitoring(e.target.checked)}
                color="primary"
              />
            }
            label="Autonomous Monitoring"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshProviders}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Provider Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {providerStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {providerStats.healthy}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Healthy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {providerStats.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warning
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {providerStats.available}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Autonomous Recommendations */}
      {autonomousMonitoring && recommendations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AutoMode sx={{ mr: 1, verticalAlign: 'middle' }} />
              Autonomous Recommendations
            </Typography>
            <List dense>
              {recommendations.slice(0, 5).map((rec) => (
                <ListItem key={rec.id}>
                  <ListItemIcon>
                    {rec.severity === 'error' ? <Error color="error" /> : 
                     rec.severity === 'warning' ? <Warning color="warning" /> : 
                     <TrendingUp color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={rec.message}
                    secondary={`${providers[rec.providerId]?.name} • ${new Date(rec.timestamp).toLocaleTimeString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Provider Cards */}
      <Grid container spacing={2}>
        {Object.entries(providers).map(([providerId, info]) => {
          const health = providerHealth[providerId];
          const trend = getPerformanceTrend(providerId);
          const isExpanded = expanded[providerId];

          return (
            <Grid item xs={12} md={6} key={providerId}>
              <Card sx={{ position: 'relative' }}>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{info.name}</Typography>
                      {providerId === currentProvider && (
                        <Chip label="Active" color="primary" size="small" />
                      )}
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      {autonomousMonitoring && trend !== 'stable' && (
                        <Tooltip title={`Performance trend: ${trend}`}>
                          <TrendingUp 
                            color={trend === 'improving' ? 'success' : 'warning'} 
                            sx={{ 
                              transform: trend === 'declining' ? 'rotate(180deg)' : 'none' 
                            }}
                          />
                        </Tooltip>
                      )}
                      
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(providerId)}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Provider Status */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      icon={getHealthIcon(health?.health)}
                      label={health?.health || 'unknown'}
                      color={getHealthColor(health?.health)}
                      size="small"
                    />
                    <Chip
                      label={info.available ? 'Available' : 'Unavailable'}
                      color={info.available ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {/* Quick Metrics */}
                  {health && (
                    <Box display="flex" gap={2} mb={2}>
                      {health.responseTime && (
                        <Typography variant="caption" color="text.secondary">
                          <Speed sx={{ fontSize: 14, mr: 0.5 }} />
                          {health.responseTime}ms
                        </Typography>
                      )}
                      {health.usage && (
                        <Typography variant="caption" color="text.secondary">
                          <Analytics sx={{ fontSize: 14, mr: 0.5 }} />
                          {health.usage} req/min
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Switch Button */}
                  <Button
                    variant={providerId === currentProvider ? "outlined" : "contained"}
                    onClick={() => handleProviderSwitch(providerId)}
                    disabled={providerId === currentProvider || !info.available}
                    size="small"
                    fullWidth
                  >
                    {providerId === currentProvider ? 'Currently Active' : 'Switch to This Provider'}
                  </Button>

                  {/* Expanded Details */}
                  <Collapse in={isExpanded}>
                    <Divider sx={{ my: 2 }} />
                    
                    {health && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Health Details
                        </Typography>
                        
                        {health.responseTime && (
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Response Time:</Typography>
                            <Typography variant="body2">{health.responseTime}ms</Typography>
                          </Box>
                        )}
                        
                        {health.errorRate !== undefined && (
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Error Rate:</Typography>
                            <Typography variant="body2">{Math.round(health.errorRate * 100)}%</Typography>
                          </Box>
                        )}
                        
                        {health.uptime !== undefined && (
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Uptime:</Typography>
                            <Typography variant="body2">{Math.round(health.uptime * 100)}%</Typography>
                          </Box>
                        )}

                        {/* Performance History Visualization */}
                        {autonomousMonitoring && performanceHistory[providerId] && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" gutterBottom>
                              Performance Trend
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, Math.max(0, 100 - (health.responseTime / 50)))}
                              color={health.responseTime < 1000 ? 'success' : health.responseTime < 2000 ? 'warning' : 'error'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Recent performance: {trend}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {info.model && (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          Model: {info.model}
                        </Typography>
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default EnhancedProviderPanel;