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
  Divider
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
  HealthAndSafety
} from '@mui/icons-material';
import { useLLM } from '../contexts/LLMContext';

/**
 * Enhanced Provider Panel with Autonomous Monitoring
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
  const [autonomousMonitoring, setAutonomousMonitoring] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState({});
  const [healthTrends, setHealthTrends] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  // Memoized provider statistics
  const providerStats = useMemo(() => {
    const stats = {
      total: Object.keys(providers).length,
      healthy: 0,
      warning: 0,
      error: 0,
      available: 0
    };

    Object.entries(providers).forEach(([id, info]) => {
      if (info.available) stats.available++;
      
      const health = providerHealth[id];
      if (health?.health === 'healthy') stats.healthy++;
      else if (health?.health === 'recovering') stats.warning++;
      else stats.error++;
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