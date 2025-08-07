import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  LinearProgress,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Share,
  Visibility,
  MusicNote,
  People,
  PlayArrow,
  Favorite,
  Timeline,
  PieChart,
  BarChart,
  Assessment
} from '@mui/icons-material';

/**
 * Enhanced Analytics Dashboard
 * Real-time music analytics with interactive charts and insights
 */
function EnhancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState({});
  const [realtimeData, setRealtimeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['listening', 'recommendations', 'engagement']);

  // Time range options
  const timeRanges = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 3 Months',
    '1y': 'Last Year',
    'all': 'All Time'
  };

  // Metric configurations
  const metricConfigs = {
    listening: {
      name: 'Listening Patterns',
      icon: <MusicNote />,
      color: '#1db954',
      description: 'Track plays, session duration, and listening habits'
    },
    recommendations: {
      name: 'Recommendation Performance',
      icon: <Assessment />,
      color: '#1976d2',
      description: 'AI recommendation accuracy and user feedback'
    },
    engagement: {
      name: 'User Engagement',
      icon: <People />,
      color: '#ed6c02',
      description: 'User interactions, retention, and activity patterns'
    },
    discovery: {
      name: 'Music Discovery',
      icon: <TrendingUp />,
      color: '#9c27b0',
      description: 'New music exploration and genre preferences'
    },
    social: {
      name: 'Social Activity',
      icon: <Share />,
      color: '#2e7d32',
      description: 'Playlist sharing, collaborations, and social features'
    }
  };

  // Load analytics data
  const loadAnalytics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}&metrics=${selectedMetrics.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
      
      // Mock data for demonstration
      setAnalytics({
        overview: {
          totalPlays: 15420,
          totalUsers: 1284,
          avgSessionDuration: 24.5,
          recommendationAccuracy: 87.3,
          trendsUp: true
        },
        listeningPatterns: {
          hourlyDistribution: generateHourlyData(),
          topGenres: [
            { genre: 'Pop', plays: 4250, percentage: 27.5 },
            { genre: 'Rock', plays: 3680, percentage: 23.8 },
            { genre: 'Electronic', plays: 2790, percentage: 18.1 },
            { genre: 'Hip-Hop', plays: 2340, percentage: 15.2 },
            { genre: 'Jazz', plays: 1560, percentage: 10.1 },
            { genre: 'Classical', plays: 800, percentage: 5.2 }
          ],
          deviceTypes: [
            { device: 'Mobile', count: 856, percentage: 66.7 },
            { device: 'Desktop', count: 312, percentage: 24.3 },
            { device: 'Tablet', count: 116, percentage: 9.0 }
          ]
        },
        recommendations: {
          accuracy: 87.3,
          totalRecommendations: 8760,
          acceptedRecommendations: 7647,
          topAlgorithms: [
            { algorithm: 'Hybrid', accuracy: 89.2, usage: 45 },
            { algorithm: 'Collaborative', accuracy: 85.1, usage: 30 },
            { algorithm: 'Content-Based', accuracy: 84.7, usage: 25 }
          ]
        },
        engagement: {
          dailyActiveUsers: 892,
          weeklyActiveUsers: 1156,
          monthlyActiveUsers: 1284,
          avgSessionsPerUser: 3.2,
          bounceRate: 12.4,
          retentionRate: 78.6
        },
        topTracks: [
          {
            id: '1',
            name: 'Blinding Lights',
            artist: 'The Weeknd',
            plays: 1247,
            trend: 'up'
          },
          {
            id: '2',
            name: 'As It Was',
            artist: 'Harry Styles',
            plays: 1108,
            trend: 'up'
          },
          {
            id: '3',
            name: 'Anti-Hero',
            artist: 'Taylor Swift',
            plays: 987,
            trend: 'down'
          }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, selectedMetrics]);

  // Generate mock hourly data
  function generateHourlyData() {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      plays: Math.floor(Math.random() * 500) + 100,
      users: Math.floor(Math.random() * 100) + 20
    }));
  }

  // Setup realtime updates
  useEffect(() => {
    if (realtimeEnabled) {
      const interval = setInterval(() => {
        updateRealtimeData();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [realtimeEnabled]);

  // Update realtime data
  const updateRealtimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime');
      if (response.ok) {
        const data = await response.json();
        setRealtimeData(data);
      }
    } catch (error) {
      console.error('Error updating realtime data:', error);
      // Mock realtime data
      setRealtimeData({
        activeUsers: Math.floor(Math.random() * 50) + 200,
        currentPlays: Math.floor(Math.random() * 20) + 80,
        recommendationsGenerated: Math.floor(Math.random() * 10) + 25,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Load initial data
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Export analytics data
  const exportData = async (format = 'csv') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeRange=${timeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-${timeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Render overview cards
  const renderOverviewCards = () => {
    const { overview } = analytics;
    if (!overview) return null;

    const cards = [
      {
        title: 'Total Plays',
        value: overview.totalPlays?.toLocaleString() || '0',
        change: overview.trendsUp ? '+12.5%' : '-3.2%',
        icon: <PlayArrow />,
        color: '#1db954'
      },
      {
        title: 'Active Users',
        value: overview.totalUsers?.toLocaleString() || '0',
        change: '+8.3%',
        icon: <People />,
        color: '#1976d2'
      },
      {
        title: 'Avg Session',
        value: `${overview.avgSessionDuration || 0}min`,
        change: '+5.7%',
        icon: <Timeline />,
        color: '#ed6c02'
      },
      {
        title: 'AI Accuracy',
        value: `${overview.recommendationAccuracy || 0}%`,
        change: '+2.1%',
        icon: <Assessment />,
        color: '#9c27b0'
      }
    ];

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {card.value}
                    </Typography>
                    <Chip
                      label={card.change}
                      size="small"
                      color={card.change.startsWith('+') ? 'success' : 'error'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Avatar sx={{ bgcolor: card.color, width: 48, height: 48 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render top genres chart
  const renderTopGenres = () => {
    const { listeningPatterns } = analytics;
    if (!listeningPatterns?.topGenres) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <PieChart sx={{ mr: 1 }} />
            Top Genres
          </Typography>
          {listeningPatterns.topGenres.map((genre, index) => (
            <Box key={genre.genre} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{genre.genre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {genre.plays.toLocaleString()} ({genre.percentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={genre.percentage}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Render top tracks table
  const renderTopTracks = () => {
    const { topTracks } = analytics;
    if (!topTracks) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <MusicNote sx={{ mr: 1 }} />
            Top Tracks
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Track</TableCell>
                  <TableCell align="right">Plays</TableCell>
                  <TableCell align="right">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topTracks.map((track) => (
                  <TableRow key={track.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{track.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {track.artist}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {track.plays.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {track.trend === 'up' ? (
                        <TrendingUp color="success" />
                      ) : (
                        <TrendingDown color="error" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            📊 Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time insights into music consumption and user behavior
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Realtime Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={realtimeEnabled}
                onChange={(e) => setRealtimeEnabled(e.target.checked)}
              />
            }
            label="Real-time"
          />
          
          {/* Time Range Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {Object.entries(timeRanges).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Actions */}
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => loadAnalytics(true)} disabled={refreshing}>
              <Refresh className={refreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Data">
            <IconButton onClick={() => exportData()}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Realtime Data */}
      {realtimeEnabled && realtimeData.activeUsers && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            🔴 Live Activity
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="h6">{realtimeData.activeUsers}</Typography>
              <Typography variant="caption" color="text.secondary">Active Users</Typography>
            </Box>
            <Box>
              <Typography variant="h6">{realtimeData.currentPlays}</Typography>
              <Typography variant="caption" color="text.secondary">Current Plays</Typography>
            </Box>
            <Box>
              <Typography variant="h6">{realtimeData.recommendationsGenerated}</Typography>
              <Typography variant="caption" color="text.secondary">Recommendations/min</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Main Analytics Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Listening Patterns Chart Placeholder */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <BarChart sx={{ mr: 1 }} />
                Listening Patterns
              </Typography>
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'action.hover',
                borderRadius: 1
              }}>
                <Typography color="text.secondary">
                  Chart.js/D3.js visualization would render here
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Top Tracks */}
          {renderTopTracks()}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Top Genres */}
          {renderTopGenres()}
          
          {/* Recommendation Performance */}
          {analytics.recommendations && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Assessment sx={{ mr: 1 }} />
                  AI Performance
                </Typography>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {analytics.recommendations.accuracy}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recommendation Accuracy
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analytics.recommendations.accuracy}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {analytics.recommendations.acceptedRecommendations?.toLocaleString()} out of{' '}
                  {analytics.recommendations.totalRecommendations?.toLocaleString()} recommendations accepted
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default EnhancedAnalyticsDashboard;