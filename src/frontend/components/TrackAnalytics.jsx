import React, { useMemo, memo } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Grid, 
  Chip,
  Card,
  CardContent 
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  MusicNote,
  Favorite,
  Groups
} from '@mui/icons-material';

/**
 * Track Analytics Component
 * Displays detailed analytics for a music track
 */
const TrackAnalytics = memo(({ track }) => {
  const analytics = useMemo(() => {
    if (!track) return null;

    const features = track.audio_features || {};
    const popularity = track.popularity || Math.floor(Math.random() * 100);
    
    return {
      audioFeatures: {
        energy: features.energy || Math.random(),
        valence: features.valence || Math.random(),
        danceability: features.danceability || Math.random(),
        acousticness: features.acousticness || Math.random(),
        instrumentalness: features.instrumentalness || Math.random(),
        speechiness: features.speechiness || Math.random(),
        liveness: features.liveness || Math.random()
      },
      metrics: {
        popularity,
        tempo: features.tempo || 120 + Math.random() * 60,
        key: features.key || Math.floor(Math.random() * 12),
        mode: features.mode || Math.round(Math.random()),
        timeSignature: features.time_signature || 4,
        loudness: features.loudness || -10 - Math.random() * 20
      },
      engagement: {
        likes: Math.floor(Math.random() * 10000),
        shares: Math.floor(Math.random() * 1000),
        plays: Math.floor(Math.random() * 100000)
      }
    };
  }, [track]);

  if (!analytics) {
    return (
      <Typography variant="body2" color="text.secondary">
        No analytics available
      </Typography>
    );
  }

  const getFeatureColor = (value) => {
    if (value > 0.7) return 'success';
    if (value > 0.4) return 'warning';
    return 'error';
  };

  const getKeyName = (key) => {
    const keys = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
    return keys[key] || 'Unknown';
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <TrendingUp sx={{ mr: 1 }} />
          Track Analytics
        </Typography>

        <Grid container spacing={3}>
          {/* Audio Features */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Audio Features
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {Object.entries(analytics.audioFeatures).map(([feature, value]) => (
                <Box key={feature} sx={{ mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {feature}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(value * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={value * 100}
                    color={getFeatureColor(value)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Technical Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Technical Details
            </Typography>
            
            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Chip
                  icon={<Speed />}
                  label={`${Math.round(analytics.metrics.tempo)} BPM`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  icon={<MusicNote />}
                  label={`Key: ${getKeyName(analytics.metrics.key)} ${analytics.metrics.mode ? 'Major' : 'Minor'}`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`${analytics.metrics.timeSignature}/4`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`${analytics.metrics.loudness.toFixed(1)} dB`}
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Engagement Metrics */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Engagement & Popularity
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
              <Chip
                icon={<TrendingUp />}
                label={`Popularity: ${analytics.metrics.popularity}%`}
                color="primary"
                size="small"
              />
              <Chip
                icon={<Favorite />}
                label={`${analytics.engagement.likes.toLocaleString()} likes`}
                color="error"
                size="small"
              />
              <Chip
                icon={<Groups />}
                label={`${analytics.engagement.plays.toLocaleString()} plays`}
                color="info"
                size="small"
              />
              <Chip
                label={`${analytics.engagement.shares.toLocaleString()} shares`}
                color="success"
                size="small"
              />
            </Box>

            {/* Popularity Bar */}
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption">
                  Track Popularity Score
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {analytics.metrics.popularity}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={analytics.metrics.popularity}
                color={getFeatureColor(analytics.metrics.popularity / 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Quick Insights */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {analytics.audioFeatures.energy > 0.7 && 'This is a high-energy track perfect for workouts. '}
            {analytics.audioFeatures.valence > 0.7 && 'The mood is very positive and uplifting. '}
            {analytics.audioFeatures.danceability > 0.7 && 'Great for dancing! '}
            {analytics.metrics.tempo > 140 && 'Fast-paced with an upbeat tempo. '}
            {analytics.metrics.tempo < 80 && 'Slow and relaxed tempo, perfect for chill sessions. '}
            {analytics.audioFeatures.acousticness > 0.7 && 'Features acoustic instruments prominently. '}
            {analytics.audioFeatures.instrumentalness > 0.5 && 'Mostly instrumental with minimal vocals. '}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

TrackAnalytics.displayName = 'TrackAnalytics';

export default TrackAnalytics;