import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Tooltip,
  Stack,
  Paper,
  alpha,
} from '@mui/material';
import {
  DragIndicator,
  Delete,
  Add,
  Share,
  PlayArrow,
  FavoriteBorder,
  Info,
  LibraryMusic,
  AccessTime,
} from '@mui/icons-material';

/**
 * Enhanced Playlist Builder with Drag & Drop, Explainable Recommendations
 */
const PlaylistBuilder = ({
  initialTracks = [],
  recommendations = [],
  onSave,
  onShare,
  onGetExplanation,
  onProvideFeedback,
}) => {
  const [tracks, setTracks] = useState(initialTracks);
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Calculate playlist statistics
  const totalDuration = tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
  const totalMinutes = Math.round(totalDuration / 60000);

  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();

      if (draggedItem === null) return;

      const newTracks = [...tracks];
      const draggedTrack = newTracks[draggedItem];

      // Remove the dragged item
      newTracks.splice(draggedItem, 1);

      // Insert at new position
      const actualDropIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
      newTracks.splice(actualDropIndex, 0, draggedTrack);

      setTracks(newTracks);
      setDraggedItem(null);
      setDragOverIndex(null);
    },
    [tracks, draggedItem]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const addTrackToPlaylist = useCallback(
    (track) => {
      if (!tracks.find((t) => t.id === track.id)) {
        setTracks((prev) => [...prev, track]);
      }
    },
    [tracks]
  );

  const removeTrackFromPlaylist = useCallback((trackId) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const handleExplanation = useCallback(
    async (track) => {
      if (onGetExplanation) {
        onGetExplanation(track);
      }
    },
    [onGetExplanation]
  );

  const handleFeedback = useCallback(
    (track, feedback) => {
      if (onProvideFeedback) {
        onProvideFeedback(track, feedback);
      }
    },
    [onProvideFeedback]
  );

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const PlaylistTrackItem = ({ track, index, isDragging, isRecommendation = false }) => (
    <ListItem
      draggable={!isRecommendation}
      onDragStart={(e) => !isRecommendation && handleDragStart(e, index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      sx={{
        border: dragOverIndex === index ? 2 : 1,
        borderColor: dragOverIndex === index ? 'primary.main' : 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        cursor: !isRecommendation ? 'grab' : 'default',
        '&:active': {
          cursor: !isRecommendation ? 'grabbing' : 'default',
        },
        transition: 'all 0.2s ease',
        transform: isDragging ? 'rotate(2deg)' : 'none',
      }}
    >
      {!isRecommendation && (
        <DragIndicator
          sx={{
            color: 'text.secondary',
            mr: 1,
            cursor: 'grab',
          }}
        />
      )}

      <Avatar src={track.album?.images?.[0]?.url} sx={{ width: 40, height: 40, mr: 2 }}>
        <LibraryMusic />
      </Avatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {track.name}
            </Typography>
            {track.explicit && <Chip label="E" size="small" variant="outlined" />}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {track.artists?.map((a) => a.name).join(', ') || track.artist}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <AccessTime sx={{ fontSize: 14 }} />
              <Typography variant="caption" color="text.secondary">
                {formatDuration(track.duration_ms || 200000)}
              </Typography>
              {track.popularity && (
                <Chip
                  label={`${track.popularity}% popular`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '10px', height: '20px' }}
                />
              )}
            </Box>
          </Box>
        }
      />

      <ListItemSecondaryAction>
        <Stack direction="row" spacing={1}>
          {isRecommendation ? (
            <>
              <Tooltip title="Add to Playlist">
                <IconButton onClick={() => addTrackToPlaylist(track)} color="primary">
                  <Add />
                </IconButton>
              </Tooltip>
              <Tooltip title="Why recommended?">
                <IconButton onClick={() => handleExplanation(track)} color="info">
                  <Info />
                </IconButton>
              </Tooltip>
              <Tooltip title="Like this recommendation">
                <IconButton onClick={() => handleFeedback(track, 'like')} color="success">
                  <FavoriteBorder />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Like this track">
                <IconButton onClick={() => handleFeedback(track, 'like')} color="error">
                  <FavoriteBorder />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove from playlist">
                <IconButton onClick={() => removeTrackFromPlaylist(track.id)} color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Box sx={{ display: 'flex', gap: 3, height: '100vh', overflow: 'hidden' }}>
      {/* Current Playlist */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <TextField
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              variant="standard"
              sx={{
                '& .MuiInput-input': {
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<PlayArrow />} size="small">
                Play
              </Button>
              <Button
                variant="outlined"
                startIcon={<Share />}
                onClick={() => setShareDialogOpen(true)}
                size="small"
              >
                Share
              </Button>
            </Stack>
          </Box>

          {/* Playlist Stats */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip label={`${tracks.length} tracks`} variant="outlined" size="small" />
            <Chip label={`${totalMinutes} min`} variant="outlined" size="small" />
            {tracks.length > 0 && <Chip label="Custom Playlist" color="primary" size="small" />}
          </Box>
        </CardContent>

        <Divider />

        <CardContent sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
          {tracks.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: alpha('#1976d2', 0.05),
                border: '2px dashed',
                borderColor: 'primary.main',
              }}
            >
              <LibraryMusic sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" color="primary">
                Start Building Your Playlist
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag tracks from recommendations or add them manually
              </Typography>
            </Paper>
          ) : (
            <List sx={{ p: 0 }}>
              {tracks.map((track, index) => (
                <PlaylistTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  isDragging={draggedItem === index}
                />
              ))}
            </List>
          )}
        </CardContent>

        <Divider />

        <CardContent sx={{ pt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => onSave && onSave({ name: playlistName, tracks })}
            disabled={tracks.length === 0}
          >
            Save Playlist ({tracks.length} tracks)
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations Panel */}
      <Card sx={{ width: 400, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ pb: 1 }}>
          <Typography variant="h6" gutterBottom>
            🎯 Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-curated tracks based on your taste
          </Typography>
        </CardContent>

        <Divider />

        <CardContent sx={{ flex: 1, overflow: 'auto', pt: 2 }}>
          {recommendations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No recommendations available
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {recommendations.map((track, index) => (
                <PlaylistTrackItem
                  key={`rec-${track.id}`}
                  track={track}
                  index={index}
                  isRecommendation={true}
                />
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Playlist</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Share &quot;{playlistName}&quot; with {tracks.length} tracks
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // Show toast notification
              }}
            >
              Copy Link
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => onShare && onShare({ name: playlistName, tracks })}
            >
              Export to Spotify
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlaylistBuilder;
