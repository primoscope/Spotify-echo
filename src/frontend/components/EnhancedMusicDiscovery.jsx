import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  TextField,
  Slider,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Mood as MoodIcon,
  TrendingUp as TrendingIcon,
  People as SocialIcon,
  Radio as RadioIcon,
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

/**
 * Enhanced Music Discovery Engine
 * Advanced AI-powered music discovery with multiple discovery modes
 */
function EnhancedMusicDiscovery() {
  const [discoveryMode, setDiscoveryMode] = useState('smart');
  const [searchQuery, setSearchQuery] = useState('');
  const [moodSettings, setMoodSettings] = useState({
    energy: 50,
    valence: 50,
    danceability: 50,
    acousticness: 50,
  });
  const [discoveries, setDiscoveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trends, setTrends] = useState([]);
  const [socialActivity, setSocialActivity] = useState([]);

  // Discovery modes configuration
  const discoveryModes = {
    smart: {
      name: 'Smart Discovery',
      icon: <SearchIcon />,
      description: 'AI-powered recommendations based on your listening history',
    },
    mood: {
      name: 'Mood-Based',
      icon: <MoodIcon />,
      description: 'Discover music that matches your current mood and energy',
    },
    trending: {
      name: 'Trending Now',
      icon: <TrendingIcon />,
      description: 'Popular tracks and emerging artists in your genres',
    },
    social: {
      name: 'Social Discovery',
      icon: <SocialIcon />,
      description: 'Music your friends and similar users are enjoying',
    },
    radio: {
      name: 'AI Radio',
      icon: <RadioIcon />,
      description: 'Personalized radio stations with infinite discovery',
    },
  };

  // Load initial data
  useEffect(() => {
    loadTrendingMusic();
    loadSocialActivity();
  }, [loadTrendingMusic, loadSocialActivity]);

  // Load trending music data
  const loadTrendingMusic = useCallback(async () => {
    try {
      const response = await fetch('/api/music/trending');
      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error('Error loading trending music:', error);
    }
  }, []);

  // Load social activity
  const loadSocialActivity = useCallback(async () => {
    try {
      const response = await fetch('/api/social/activity');
      if (response.ok) {
        const data = await response.json();
        setSocialActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Error loading social activity:', error);
    }
  }, []);

  // Discover music based on current mode
  const discoverMusic = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '/api/music/discover';
      let payload = {
        mode: discoveryMode,
        limit: 20,
      };

      // Add mode-specific parameters
      switch (discoveryMode) {
        case 'smart':
          payload.query = searchQuery;
          break;
        case 'mood':
          payload.moodSettings = moodSettings;
          break;
        case 'trending':
          payload.timeframe = '24h';
          break;
        case 'social':
          payload.includeFollowing = true;
          break;
        case 'radio':
          payload.stationType = 'discovery';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.status}`);
      }

      const data = await response.json();
      setDiscoveries(data.tracks || []);
    } catch (error) {
      console.error('Discovery error:', error);
      setError('Failed to discover new music. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [discoveryMode, searchQuery, moodSettings]);

  // Handle mood slider changes
  const handleMoodChange = (attribute, value) => {
    setMoodSettings((prev) => ({
      ...prev,
      [attribute]: value,
    }));
  };

  // Inline mini visualization (client-only)
  const MoodMiniViz = () => {
    const entries = Object.entries(moodSettings);
    const width = 200;
    const height = 60;
    const barGap = 6;
    const barWidth = (width - barGap * (entries.length - 1)) / entries.length;
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Current Mood Profile
        </Typography>
        <svg width={width} height={height} role="img" aria-label="Mood profile spark bars">
          {entries.map(([k, v], idx) => {
            const h = Math.max(2, Math.round((v / 100) * (height - 12)));
            const x = idx * (barWidth + barGap);
            const y = height - h;
            return (
              <g key={k}>
                <rect x={x} y={y} width={barWidth} height={h} fill="#1976d2" rx={2} />
                <title>{`${k}: ${v}`}</title>
              </g>
            );
          })}
        </svg>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          {entries.map(([k]) => (
            <Typography key={k} variant="caption" color="text.secondary">
              {k}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  };

  // Mood preset chips
  const moodPresets = [
    { id: 'chill', label: 'Chill', values: { energy: 30, valence: 60, danceability: 40, acousticness: 70 } },
    { id: 'party', label: 'Party', values: { energy: 80, valence: 75, danceability: 85, acousticness: 20 } },
    { id: 'focus', label: 'Focus', values: { energy: 35, valence: 40, danceability: 30, acousticness: 60 } },
    { id: 'happy', label: 'Happy', values: { energy: 65, valence: 85, danceability: 70, acousticness: 40 } },
  ];
  const applyPreset = (preset) => setMoodSettings(preset.values);

  // Add track to playlist
  const addToPlaylist = async (track) => {
    try {
      const response = await fetch('/api/playlists/add-track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: track.id,
          playlistId: 'discovery', // Default discovery playlist
        }),
      });

      if (response.ok) {
        // Show success notification
        setError(null);
      }
    } catch (error) {
      setError('Failed to add track to playlist');
    }
  };

  // Like track
  const likeTrack = async (track) => {
    try {
      await fetch('/api/user/like-track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId: track.id }),
      });
    } catch (error) {
      console.error('Error liking track:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          🎵 Music Discovery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore new music with AI-powered discovery modes
        </Typography>
      </Box>

      {/* Discovery Mode Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Discovery Mode
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(discoveryModes).map(([key, mode]) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={key}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: discoveryMode === key ? 2 : 0,
                    borderColor: 'primary.main',
                    '&:hover': { elevation: 4 },
                  }}
                  onClick={() => setDiscoveryMode(key)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box
                      sx={{
                        mb: 1,
                        color: discoveryMode === key ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {mode.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {mode.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mode.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Mode-Specific Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {discoveryMode === 'smart' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Smart Search
              </Typography>
              <TextField
                fullWidth
                placeholder="Describe the music you want to discover..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && discoverMusic()}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={discoverMusic}>
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          )}

          {discoveryMode === 'mood' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Mood Settings
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {moodPresets.map((p) => (
                  <Chip key={p.id} size="small" label={p.label} onClick={() => applyPreset(p)} />
                ))}
              </Box>
              <Grid container spacing={3}>
                {Object.entries(moodSettings).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography gutterBottom>
                      {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                    </Typography>
                    <Slider
                      value={value}
                      onChange={(_, newValue) => handleMoodChange(key, newValue)}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                ))}
              </Grid>
              <MoodMiniViz />
            </Box>
          )}

          {discoveryMode === 'trending' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Trending Music
              </Typography>
              <Grid container spacing={2}>
                {trends.slice(0, 5).map((trend, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Chip
                      label={trend.genre || trend.name}
                      variant="outlined"
                      size="small"
                      icon={<TrendingIcon />}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {discoveryMode === 'social' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Social Activity
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {socialActivity.slice(0, 4).map((activity, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {activity.username?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="caption">
                      {activity.action || 'Listening to'} {activity.track || 'new music'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={discoverMusic}
              disabled={loading}
              startIcon={loading ? <RefreshIcon className="animate-spin" /> : <SearchIcon />}
            >
              {loading ? 'Discovering...' : 'Discover Music'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setDiscoveries([])}
              disabled={discoveries.length === 0}
            >
              Clear Results
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Discovering amazing music for you...
          </Typography>
        </Box>
      )}

      {/* Discovery Results */}
      {discoveries.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Discovered Music ({discoveries.length} tracks)
            </Typography>
            <Grid container spacing={2}>
              {discoveries.map((track, index) => (
                <Grid item xs={12} sm={6} md={4} key={track.id || index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{ mr: 2, bgcolor: 'primary.main' }}
                          src={track.album?.images?.[0]?.url}
                        >
                          🎵
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {track.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {track.artists?.[0]?.name || track.artist}
                          </Typography>
                        </Box>
                      </Box>

                      {track.confidence && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Match: {Math.round(track.confidence * 100)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={track.confidence * 100}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                        <Tooltip title="Play Preview">
                          <IconButton size="small" color="primary">
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Like Track">
                          <IconButton size="small" onClick={() => likeTrack(track)}>
                            <FavoriteIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add to Playlist">
                          <IconButton size="small" onClick={() => addToPlaylist(track)}>
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share Track">
                          <IconButton size="small">
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && discoveries.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Ready to discover new music?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a discovery mode and start exploring personalized recommendations
            </Typography>
            <Button variant="contained" onClick={discoverMusic} startIcon={<SearchIcon />}>
              Start Discovering
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button for Quick Discovery */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={discoverMusic}
        disabled={loading}
      >
        {loading ? <RefreshIcon className="animate-spin" /> : <SearchIcon />}
      </Fab>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EnhancedMusicDiscovery;
