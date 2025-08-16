import { useState, useEffect, useCallback } from 'react';
import { Pagination, Tooltip, IconButton, Divider } from '@mui/material';
import { TrendingUp, TrendingDown, Refresh, Download, ClearAll, Cached } from '@mui/icons-material';

/**
 * Simple SVG-based Chart Component
 * Renders basic charts without external dependencies
 */
function SimpleChart({ data, type = 'line', width = 300, height = 200, color = '#1976d2' }) {
  if (!data || data.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height={height}>
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value || d));
  const minValue = Math.min(...data.map((d) => d.value || d));
  const range = maxValue - minValue || 1;

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * (width - 40) + 20;
      const value = typeof item === 'object' ? item.value : item;
      const y = height - 20 - ((value - minValue) / range) * (height - 40);
      return `${x},${y}`;
    })
    .join(' ');

  if (type === 'bar') {
    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {data.map((item, index) => {
          const value = typeof item === 'object' ? item.value : item;
          const barHeight = ((value - minValue) / range) * (height - 40);
          const x = (index / data.length) * (width - 40) + 20;
          const y = height - 20 - barHeight;
          const barWidth = Math.max((width - 40) / data.length - 2, 1);

          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              opacity={0.7}
            >
              <title>{typeof item === 'object' ? `${item.label}: ${item.value}` : value}</title>
            </rect>
          );
        })}
      </svg>
    );
  }

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      {data.map((item, index) => {
        const x = (index / (data.length - 1)) * (width - 40) + 20;
        const value = typeof item === 'object' ? item.value : item;
        const y = height - 20 - ((value - minValue) / range) * (height - 40);

        return (
          <circle key={index} cx={x} cy={y} r="4" fill={color}>
            <title>{typeof item === 'object' ? `${item.label}: ${item.value}` : value}</title>
          </circle>
        );
      })}
    </svg>
  );
}

/**
 * Audio Features Radar Chart Component
 */
function AudioFeaturesRadar({ features, size = 200 }) {
  if (!features) return null;

  const featureNames = ['energy', 'valence', 'danceability', 'acousticness', 'instrumentalness'];
  const center = size / 2;
  const radius = size / 2 - 20;

  const points = featureNames.map((feature, index) => {
    const angle = (index / featureNames.length) * 2 * Math.PI - Math.PI / 2;
    const value = features[feature] || 0;
    const x = center + Math.cos(angle) * radius * value;
    const y = center + Math.sin(angle) * radius * value;
    return `${x},${y}`;
  });

  const polygonPoints = points.join(' ');

  return (
    <Box position="relative">
      <svg width={size} height={size}>
        {/* Background circles */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {featureNames.map((_, index) => {
          const angle = (index / featureNames.length) * 2 * Math.PI - Math.PI / 2;
          const x2 = center + Math.cos(angle) * radius;
          const y2 = center + Math.sin(angle) * radius;
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="#1976d2"
          fillOpacity="0.3"
          stroke="#1976d2"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, index) => {
          const [x, y] = point.split(',').map(Number);
          return (
            <circle key={index} cx={x} cy={y} r="4" fill="#1976d2">
              <title>{`${featureNames[index]}: ${(features[featureNames[index]] || 0).toFixed(2)}`}</title>
            </circle>
          );
        })}
      </svg>

      {/* Labels */}
      {featureNames.map((feature, index) => {
        const angle = (index / featureNames.length) * 2 * Math.PI - Math.PI / 2;
        const labelRadius = radius + 15;
        const x = center + Math.cos(angle) * labelRadius;
        const y = center + Math.sin(angle) * labelRadius;

        return (
          <Typography
            key={feature}
            variant="caption"
            style={{
              position: 'absolute',
              left: x - 20,
              top: y - 6,
              textAlign: 'center',
              width: 40,
              fontSize: '0.7rem',
            }}
          >
            {feature}
          </Typography>
        );
      })}
    </Box>
  );
}

/**
 * Enhanced Insights Dashboard Component
 */
function InsightsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({});
  const [selectedFeatures, setSelectedFeatures] = useState(['energy', 'valence', 'danceability']);
  const [_cacheEnabled, _setCacheEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [cacheStats, setCacheStats] = useState({});

  const timeRanges = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 3 Months',
  };

  const audioFeatures = [
    'energy',
    'valence',
    'danceability',
    'acousticness',
    'instrumentalness',
    'speechiness',
    'tempo',
  ];

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50,
        timeRange,
        features: selectedFeatures.join(','),
      });

      const response = await fetch(`/api/insights/listening-trends?${params}`);
      const data = await response.json();

      if (data.success) {
        setInsights(data);
      } else {
        setError(data.message || 'Failed to load insights');
      }
    } catch (err) {
      setError('Network error loading insights');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, currentPage, selectedFeatures]);

  useEffect(() => {
    loadInsights();
    loadCacheStats();
  }, [loadInsights]);

  const loadCacheStats = async () => {
    try {
      const response = await fetch('/api/insights/cache/stats');
      const data = await response.json();
      if (data.success) {
        setCacheStats(data.cache);
      }
    } catch (err) {
      console.error('Error loading cache stats:', err);
    }
  };

  const clearCache = async () => {
    try {
      await fetch('/api/insights/cache/clear', { method: 'POST' });
      loadCacheStats();
      loadInsights();
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(insights, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insights-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTrendIndicator = (trend) => {
    if (!trend || trend === 'stable') return <Chip size="small" label="Stable" />;
    if (trend === 'increasing')
      return <Chip size="small" icon={<TrendingUp />} label="Rising" color="success" />;
    if (trend === 'decreasing')
      return <Chip size="small" icon={<TrendingDown />} label="Falling" color="warning" />;
    return <Chip size="small" label="Unknown" />;
  };

  const renderFeatureCard = (featureName, featureData) => {
    if (!featureData) return null;

    const chartData = Array.from({ length: 10 }, (_, i) => ({
      label: `Point ${i + 1}`,
      value: featureData.average + (Math.random() - 0.5) * 0.2,
    }));

    return (
      <Card key={featureName} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h3" textTransform="capitalize">
              {featureName}
            </Typography>
            {renderTrendIndicator(featureData.trend)}
          </Box>

          <Box mb={2}>
            <SimpleChart data={chartData} type="line" width={280} height={120} color="#1976d2" />
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Average
              </Typography>
              <Typography variant="body2">{featureData.average?.toFixed(3)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Min
              </Typography>
              <Typography variant="body2">{featureData.min?.toFixed(3)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Max
              </Typography>
              <Typography variant="body2">{featureData.max?.toFixed(3)}</Typography>
            </Grid>
          </Grid>

          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Data Points: {featureData.dataPoints}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading && Object.keys(insights).length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Music Insights Dashboard
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                {Object.entries(timeRanges).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Audio Features</InputLabel>
              <Select
                multiple
                value={selectedFeatures}
                onChange={(e) => setSelectedFeatures(e.target.value)}
                label="Audio Features"
              >
                {audioFeatures.map((feature) => (
                  <MenuItem key={feature} value={feature}>
                    <Box textTransform="capitalize">{feature}</Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <Tooltip title="Refresh insights">
              <IconButton onClick={loadInsights} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item>
            <Tooltip title="Export data">
              <IconButton onClick={exportData}>
                <Download />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item>
            <Tooltip title="Clear cache">
              <IconButton onClick={clearCache}>
                <ClearAll />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* Cache Statistics */}
      {Object.keys(cacheStats).length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Cached />
            <Typography variant="body2">
              Cache: {cacheStats.keys} keys, {Math.round(cacheStats.hitRate * 100)}% hit rate
              {insights.cached && ' (cached result)'}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Fallback Notice */}
      {insights.fallback && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">{insights.message}</Typography>
        </Alert>
      )}

      {/* Main Content */}
      {insights.trends && (
        <>
          {/* Audio Features Trends */}
          <Typography variant="h5" gutterBottom>
            Audio Features Trends
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {selectedFeatures.map((feature) =>
              renderFeatureCard(feature, insights.trends[feature])
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Data Summary */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Data Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Time Range
                      </Typography>
                      <Typography>{timeRanges[timeRange]}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Total Records
                      </Typography>
                      <Typography>{insights.pagination?.totalCount || 0}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Current Page
                      </Typography>
                      <Typography>{currentPage}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Generated At
                      </Typography>
                      <Typography variant="body2">
                        {insights.generatedAt
                          ? new Date(insights.generatedAt).toLocaleTimeString()
                          : '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Feature Analysis
                  </Typography>
                  {insights.trends && Object.keys(insights.trends).length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Average audio features for selected time range
                      </Typography>
                      <AudioFeaturesRadar
                        features={Object.fromEntries(
                          Object.entries(insights.trends).map(([key, data]) => [key, data.average])
                        )}
                        size={180}
                      />
                    </Box>
                  ) : (
                    <Typography color="text.secondary">No feature data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Pagination */}
      {insights.pagination && insights.pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={insights.pagination.totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
}

export default InsightsDashboard;
