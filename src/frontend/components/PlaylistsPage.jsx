import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  PlaylistPlay,
  Add,
  TrendingUp,
  MusicNote,
  Share,
  Analytics,
  Refresh,
} from '@mui/icons-material';

/**
 * Playlist Trend Chart Component
 */
function PlaylistTrendChart({ trends, width = 300, height = 150 }) {
  if (!trends || !trends.audioFeatures) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={height}
        sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
      >
        <Typography color="text.secondary">No trend data available</Typography>
      </Box>
    );
  }

  const features = trends.audioFeatures;
  const featureNames = Object.keys(features);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Audio Features Distribution
      </Typography>
      <svg width={width} height={height}>
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((y) => (
          <line
            key={y}
            x1="40"
            y1={height - 30 - y * (height - 60)}
            x2={width - 20}
            y2={height - 30 - y * (height - 60)}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}

        {/* Bars */}
        {featureNames.map((feature, index) => {
          const barWidth = (width - 80) / featureNames.length;
          const x = 40 + index * barWidth + barWidth * 0.1;
          const actualBarWidth = barWidth * 0.8;
          const average = features[feature]?.average || 0;
          const barHeight = average * (height - 60);
          const y = height - 30 - barHeight;

          return (
            <g key={feature}>
              <rect
                x={x}
                y={y}
                width={actualBarWidth}
                height={barHeight}
                fill="#1976d2"
                opacity="0.7"
              >
                <title>{`${feature}: ${average.toFixed(3)}`}</title>
              </rect>
              <text
                x={x + actualBarWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {feature.substring(0, 4)}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1.0].map((value) => (
          <text
            key={value}
            x="35"
            y={height - 30 - value * (height - 60) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#666"
          >
            {value}
          </text>
        ))}
      </svg>
    </Box>
  );
}

/**
 * Playlist Creation Dialog
 */
function CreatePlaylistDialog({ open, onClose, onCreatePlaylist }) {
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playlistName.trim()) return;

    setLoading(true);
    try {
      await onCreatePlaylist({
        name: playlistName.trim(),
        description: description.trim(),
        tracks: [], // Empty playlist to start
        public: false,
      });

      setPlaylistName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Playlist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Playlist Name"
          fullWidth
          variant="outlined"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Description (Optional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!playlistName.trim() || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Enhanced Playlists Page Component
 */
function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playlistInsights, setPlaylistInsights] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load playlists from the database
      const response = await fetch('/api/playlists/list');
      const data = await response.json();

      if (data.success) {
        setPlaylists(data.playlists || []);

        // Load insights for each playlist
        if (data.playlists && data.playlists.length > 0) {
          loadPlaylistsInsights(data.playlists);
        }
      } else {
        // Create some sample playlists if none exist
        const samplePlaylists = [
          {
            id: 'sample-1',
            name: 'My Favorites',
            description: 'All-time favorite tracks',
            trackCount: 25,
            createdAt: new Date().toISOString(),
            tracks: [],
          },
          {
            id: 'sample-2',
            name: 'Workout Mix',
            description: 'High energy tracks for exercise',
            trackCount: 18,
            createdAt: new Date().toISOString(),
            tracks: [],
          },
        ];
        setPlaylists(samplePlaylists);
      }
    } catch (err) {
      setError('Failed to load playlists');
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlaylistsInsights = async (playlistList) => {
    const insights = {};

    // Load insights for each playlist
    for (const playlist of playlistList.slice(0, 5)) {
      // Limit to first 5 for performance
      try {
        const response = await fetch(`/api/insights/playlist/${playlist.id}`);
        const data = await response.json();

        if (data.success) {
          insights[playlist.id] = data;
        }
      } catch (err) {
        console.error(`Error loading insights for playlist ${playlist.id}:`, err);
      }
    }

    setPlaylistInsights(insights);
  };

  const createPlaylist = async (playlistData) => {
    try {
      const response = await fetch('/api/playlists/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...playlistData,
          userId: 'user123', // This would come from auth context
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh playlists list
        loadPlaylists();
      } else {
        throw new Error(data.error || 'Failed to create playlist');
      }
    } catch (err) {
      setError('Failed to create playlist');
      throw err;
    }
  };

  const getPlaylistMoodDescription = (insights) => {
    if (!insights || !insights.audioFeatures) return 'Unknown mood';

    const valence = insights.audioFeatures.valence?.average || 0;
    const energy = insights.audioFeatures.energy?.average || 0;

    if (valence > 0.7 && energy > 0.7) return 'Upbeat & Energetic';
    if (valence > 0.7) return 'Happy & Positive';
    if (energy > 0.7) return 'High Energy';
    if (valence < 0.3 && energy < 0.3) return 'Mellow & Calm';
    if (valence < 0.3) return 'Melancholic';
    return 'Balanced';
  };

  const getTrendingIndicator = (insights) => {
    if (!insights || !insights.trends) return null;

    const frequency = insights.trends.changeFrequency;
    if (frequency === 'very_active')
      return { icon: <TrendingUp />, label: 'Very Active', color: 'success' };
    if (frequency === 'active') return { icon: <TrendingUp />, label: 'Active', color: 'info' };
    if (frequency === 'moderate') return { label: 'Moderate', color: 'default' };
    return { label: 'Static', color: 'default' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Playlists & Analytics
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" color="text.secondary">
            Analyze your playlists with detailed insights and trends
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadPlaylists}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Playlist
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="All Playlists" />
          <Tab label="Analytics" />
          <Tab label="Trends" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {playlists.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No playlists found. Create your first playlist to get started!
              </Alert>
            </Grid>
          ) : (
            playlists.map((playlist) => {
              const insights = playlistInsights[playlist.id];
              const trending = getTrendingIndicator(insights);

              return (
                <Grid item xs={12} md={6} lg={4} key={playlist.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Avatar sx={{ bgcolor: '#1976d2' }}>
                          <PlaylistPlay />
                        </Avatar>
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small">
                            <Share fontSize="small" />
                          </IconButton>
                          <IconButton size="small">
                            <Analytics fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="h6" component="h3" gutterBottom>
                        {playlist.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {playlist.description || 'No description'}
                      </Typography>

                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2">
                          {playlist.trackCount || playlist.tracks?.length || 0} tracks
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {playlist.createdAt
                            ? new Date(playlist.createdAt).toLocaleDateString()
                            : ''}
                        </Typography>
                      </Box>

                      {/* Insights Chips */}
                      <Box mb={2}>
                        <Chip
                          label={getPlaylistMoodDescription(insights)}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        {trending && (
                          <Chip
                            icon={trending.icon}
                            label={trending.label}
                            size="small"
                            color={trending.color}
                            sx={{ mb: 1 }}
                          />
                        )}
                      </Box>

                      {/* Audio Features Trend Chart */}
                      {insights && insights.audioFeatures && (
                        <Box mt={2}>
                          <PlaylistTrendChart trends={insights} width={250} height={120} />
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" justifyContent="space-between">
                        <Button size="small" startIcon={<MusicNote />} disabled>
                          View Tracks
                        </Button>
                        <Button size="small" startIcon={<Analytics />}>
                          Analyze
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Playlist Analytics Overview
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {playlists.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Playlists
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {playlists.reduce(
                          (sum, p) => sum + (p.trackCount || p.tracks?.length || 0),
                          0
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tracks
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {Math.round(
                          playlists.reduce(
                            (sum, p) => sum + (p.trackCount || p.tracks?.length || 0),
                            0
                          ) / Math.max(playlists.length, 1)
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Tracks/Playlist
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {Object.keys(playlistInsights).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Analyzed Playlists
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info">
              Playlist trends analysis shows how your music taste and playlist composition changes
              over time.
            </Alert>
          </Grid>
          {Object.entries(playlistInsights).map(([playlistId, insights]) => {
            const playlist = playlists.find((p) => p.id === playlistId);
            if (!playlist) return null;

            return (
              <Grid item xs={12} md={6} key={playlistId}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {playlist.name} - Trends
                    </Typography>

                    {insights.trends ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Change Frequency: {insights.trends.changeFrequency}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Changes: {insights.trends.totalChanges}
                        </Typography>
                        {insights.trends.lastModified && (
                          <Typography variant="body2" color="text.secondary">
                            Last Modified:{' '}
                            {new Date(insights.trends.lastModified).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography color="text.secondary">No trend data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreatePlaylist={createPlaylist}
      />
    </Box>
  );
}

export default PlaylistsPage;
