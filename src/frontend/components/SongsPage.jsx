import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  MusicNote,
  Search,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Assessment,
} from '@mui/icons-material';

/**
 * Audio Feature Gauge Component
 */
function AudioFeatureGauge({ label, value, color = '#1976d2', size = 100 }) {
  if (value === undefined || value === null) {
    return (
      <Box textAlign="center">
        <Typography variant="caption">{label}</Typography>
        <Box>-</Box>
      </Box>
    );
  }

  const percentage = Math.round(value * 100);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - value * circumference;

  return (
    <Box textAlign="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box position="relative" display="inline-flex">
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r="35"
            fill="transparent"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r="35"
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {percentage}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {value.toFixed(3)}
      </Typography>
    </Box>
  );
}

/**
 * Song Detail Modal Component
 */
function SongDetailCard({ trackId, expanded, _onToggle }) {
  const [songInsights, setSongInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSongInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/insights/song/${trackId}`);
      const data = await response.json();

      if (data.success) {
        setSongInsights(data);
      } else {
        setError(data.message || 'Failed to load song insights');
      }
    } catch (err) {
      setError('Network error loading song insights');
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    if (expanded && trackId && !songInsights) {
      loadSongInsights();
    }
  }, [expanded, trackId, songInsights, loadSongInsights]);

  if (!expanded) return null;

  if (loading) {
    return (
      <Box p={2} textAlign="center">
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading song analysis...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!songInsights || !songInsights.audioFeatures) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No audio features available for this track
      </Alert>
    );
  }

  const features = songInsights.audioFeatures;
  const analysis = songInsights.analysis || {};

  const featureColors = {
    energy: '#f44336',
    valence: '#4caf50',
    danceability: '#ff9800',
    acousticness: '#9c27b0',
    instrumentalness: '#607d8b',
    speechiness: '#795548',
  };

  return (
    <Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
      <Grid container spacing={3}>
        {/* Audio Features Gauges */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Audio Features Analysis
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {Object.entries(featureColors).map(([feature, color]) => (
              <Grid item key={feature}>
                <AudioFeatureGauge
                  label={feature.charAt(0).toUpperCase() + feature.slice(1)}
                  value={features[feature]}
                  color={color}
                  size={80}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Technical Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Technical Details
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Tempo</TableCell>
                    <TableCell>{features.tempo?.toFixed(1)} BPM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>{features.key !== undefined ? features.key : 'Unknown'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Time Signature</TableCell>
                    <TableCell>{features.time_signature}/4</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Duration</TableCell>
                    <TableCell>
                      {features.duration_ms
                        ? `${Math.round(features.duration_ms / 1000)}s`
                        : 'Unknown'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Loudness</TableCell>
                    <TableCell>{features.loudness?.toFixed(2)} dB</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Analysis Summary
              </Typography>
              <Box>
                <Chip
                  label={`Energy: ${analysis.energy_level || 'Unknown'}`}
                  color={
                    analysis.energy_level === 'high'
                      ? 'success'
                      : analysis.energy_level === 'medium'
                        ? 'warning'
                        : 'default'
                  }
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Mood: ${analysis.mood || 'Unknown'}`}
                  color={
                    analysis.mood === 'happy'
                      ? 'success'
                      : analysis.mood === 'sad'
                        ? 'error'
                        : 'default'
                  }
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Danceability: ${analysis.danceability_level || 'Unknown'}`}
                  color={analysis.danceability_level === 'high' ? 'success' : 'default'}
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Tempo: ${analysis.tempo_category || 'Unknown'}`}
                  sx={{ mr: 1, mb: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Listening Statistics */}
        {songInsights.listening && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Listening Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Total Plays
                    </Typography>
                    <Typography variant="h6">{songInsights.listening.totalPlays || 0}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Unique Listeners
                    </Typography>
                    <Typography variant="h6">
                      {songInsights.listening.uniqueListeners
                        ? songInsights.listening.uniqueListeners.length
                        : 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      First Played
                    </Typography>
                    <Typography variant="body2">
                      {songInsights.listening.firstPlayed
                        ? new Date(songInsights.listening.firstPlayed).toLocaleDateString()
                        : 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">
                      Last Played
                    </Typography>
                    <Typography variant="body2">
                      {songInsights.listening.lastPlayed
                        ? new Date(songInsights.listening.lastPlayed).toLocaleDateString()
                        : 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Similar Tracks */}
        {songInsights.similarTracks && songInsights.similarTracks.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Similar Tracks
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Based on audio feature similarity
                </Typography>
                <List dense>
                  {songInsights.similarTracks.slice(0, 5).map((track, index) => (
                    <ListItem key={track.trackId || index}>
                      <ListItemAvatar>
                        <Avatar>
                          <MusicNote />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={track.trackId}
                        secondary={`Energy: ${track.energy?.toFixed(2)}, Valence: ${track.valence?.toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

/**
 * Songs Page Component - Detailed Audio Feature Analysis
 */
function SongsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSong, setExpandedSong] = useState(null);

  useEffect(() => {
    // Load some sample songs or recent tracks
    loadRecentTracks();
  }, []);

  const loadRecentTracks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get recent listening history to populate songs list
      const response = await fetch('/api/insights/listening-trends?limit=20&page=1&timeRange=7d');
      const data = await response.json();

      if (data.success && data.data) {
        // Extract unique tracks from listening data
        const uniqueTracks = [];
        const trackIds = new Set();

        data.data.forEach((item) => {
          if (item.trackId && !trackIds.has(item.trackId)) {
            trackIds.add(item.trackId);
            uniqueTracks.push({
              trackId: item.trackId,
              trackName: item.trackName || item.trackId,
              artist: item.artist || 'Unknown Artist',
              playedAt: item.playedAt,
              audioFeatures: item.audioFeatures,
            });
          }
        });

        setSongs(uniqueTracks);
      }
    } catch (err) {
      setError('Failed to load songs');
      console.error('Error loading recent tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchSongs = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // This would typically search your music database
      // For now, we'll filter the existing songs
      const filteredSongs = songs.filter(
        (song) =>
          song.trackName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSongs(filteredSongs);
    } catch (err) {
      setError('Failed to search songs');
    } finally {
      setLoading(false);
    }
  };

  const toggleSongDetails = (trackId) => {
    setExpandedSong(expandedSong === trackId ? null : trackId);
  };

  const getAudioFeatureSummary = (features) => {
    if (!features) return 'No audio features available';

    const energy = features.energy ? Math.round(features.energy * 100) : 0;
    const valence = features.valence ? Math.round(features.valence * 100) : 0;
    const danceability = features.danceability ? Math.round(features.danceability * 100) : 0;

    return `Energy: ${energy}% • Mood: ${valence}% • Dance: ${danceability}%`;
  };

  if (loading && songs.length === 0) {
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
          Songs & Audio Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Explore detailed audio features and insights for your music collection
        </Typography>

        {/* Search */}
        <Box display="flex" gap={1} mt={2}>
          <TextField
            fullWidth
            placeholder="Search for songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchSongs()}
            InputProps={{
              startAdornment: <Search color="action" sx={{ mr: 1 }} />,
            }}
          />
          <Button variant="contained" onClick={searchSongs}>
            Search
          </Button>
          <Button variant="outlined" onClick={loadRecentTracks}>
            Recent
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Songs List */}
      {songs.length === 0 && !loading ? (
        <Alert severity="info">No songs found. Try searching or loading recent tracks.</Alert>
      ) : (
        <Grid container spacing={2}>
          {songs.map((song, index) => (
            <Grid item xs={12} key={song.trackId || index}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box flex={1}>
                      <Typography variant="h6" component="h3">
                        {song.trackName}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        {song.artist}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {getAudioFeatureSummary(song.audioFeatures)}
                      </Typography>
                      {song.playedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Last played: {new Date(song.playedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>

                    <Box display="flex" alignItems="center">
                      <Tooltip title="Play track">
                        <IconButton>
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View analysis">
                        <IconButton>
                          <Assessment />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        onClick={() => toggleSongDetails(song.trackId)}
                        aria-expanded={expandedSong === song.trackId}
                      >
                        {expandedSong === song.trackId ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>

                <Collapse in={expandedSong === song.trackId}>
                  <Divider />
                  <SongDetailCard
                    trackId={song.trackId}
                    expanded={expandedSong === song.trackId}
                    onToggle={() => toggleSongDetails(song.trackId)}
                  />
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Loading Indicator */}
      {loading && songs.length > 0 && (
        <Box mt={2}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}

export default SongsPage;
