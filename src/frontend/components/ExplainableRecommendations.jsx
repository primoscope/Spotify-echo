import { useState, useCallback } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Info,
  ExpandMore,
  Psychology,
  TrendingUp,
  MusicNote,
  Group,
  SmartToy,
  Schedule,
} from '@mui/icons-material';

/**
 * ExplainableRecommendations Component
 * Shows AI-powered music recommendations with human-readable explanations
 */
const ExplainableRecommendations = ({
  recommendations = [],
  onGetExplanation,
  onProvideFeedback,
  loading = false,
}) => {
  const [explanationDialog, setExplanationDialog] = useState({
    open: false,
    track: null,
    explanation: null,
  });
  const [feedbackStates, setFeedbackStates] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const handleGetExplanation = useCallback(
    async (track) => {
      setLoadingExplanation(true);
      setExplanationDialog({ open: true, track, explanation: null });

      try {
        if (onGetExplanation) {
          const explanation = await onGetExplanation(track.recommendationId, track.id);
          setExplanationDialog((prev) => ({ ...prev, explanation }));
        }
      } catch (error) {
        console.error('Error getting explanation:', error);
        setExplanationDialog((prev) => ({
          ...prev,
          explanation: {
            error: 'Failed to load explanation',
            summary: 'Unable to generate explanation at this time.',
          },
        }));
      } finally {
        setLoadingExplanation(false);
      }
    },
    [onGetExplanation]
  );

  const handleFeedback = useCallback(
    (track, feedback, rating = null) => {
      setFeedbackStates((prev) => ({
        ...prev,
        [track.id]: { feedback, rating, timestamp: Date.now() },
      }));

      if (onProvideFeedback) {
        onProvideFeedback(track, feedback, rating);
      }
    },
    [onProvideFeedback]
  );

  const getAlgorithmIcon = (algorithm) => {
    switch (algorithm) {
      case 'content_based':
        return <MusicNote color="primary" />;
      case 'collaborative':
        return <Group color="secondary" />;
      case 'hybrid':
        return <SmartToy color="success" />;
      default:
        return <Psychology color="info" />;
    }
  };

  const _getAlgorithmDescription = (algorithm) => {
    switch (algorithm) {
      case 'content_based':
        return 'Based on musical features and audio analysis';
      case 'collaborative':
        return 'Based on users with similar taste';
      case 'hybrid':
        return 'Combines multiple AI algorithms for best results';
      default:
        return 'AI-powered recommendation';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'primary';
    if (confidence >= 0.4) return 'warning';
    return 'error';
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Getting personalized recommendations...
        </Typography>
      </Box>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Recommendations Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate some personalized music recommendations to see explainable AI insights
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy color="primary" />
        Explainable Recommendations
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        AI-curated music with transparent reasoning behind each recommendation
      </Typography>

      <List sx={{ p: 0 }}>
        {recommendations.map((track, _index) => {
          const trackFeedback = feedbackStates[track.id];

          return (
            <Card key={track.id} sx={{ mb: 2 }}>
              <CardContent>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar src={track.album?.images?.[0]?.url} sx={{ width: 56, height: 56 }}>
                      <MusicNote />
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" component="span">
                          {track.name}
                        </Typography>
                        {track.explicit && <Chip label="E" size="small" variant="outlined" />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {track.artists?.map((a) => a.name).join(', ') || track.artist} •{' '}
                          {track.album?.name || 'Unknown Album'}
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip
                            icon={getAlgorithmIcon(track.algorithm)}
                            label={track.algorithm || 'AI'}
                            size="small"
                            variant="outlined"
                          />

                          {track.confidence && (
                            <Chip
                              icon={<TrendingUp />}
                              label={`${Math.round(track.confidence * 100)}% match`}
                              size="small"
                              color={getConfidenceColor(track.confidence)}
                              variant="outlined"
                            />
                          )}

                          <Chip
                            icon={<Schedule />}
                            label={formatDuration(track.duration_ms || 200000)}
                            size="small"
                            variant="outlined"
                          />

                          {track.popularity && (
                            <Chip
                              label={`${track.popularity}% popular`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>
                    }
                  />
                </ListItem>

                {/* AI Confidence Bar */}
                {track.confidence && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        AI Confidence Score
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(track.confidence * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={track.confidence * 100}
                      color={getConfidenceColor(track.confidence)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}

                {/* Quick Explanation Preview */}
                {track.quickReason && (
                  <Alert
                    icon={<Psychology />}
                    severity="info"
                    sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.04)' }}
                  >
                    <Typography variant="body2">{track.quickReason}</Typography>
                  </Alert>
                )}

                {/* Action Buttons */}
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Why was this recommended?">
                      <IconButton color="info" onClick={() => handleGetExplanation(track)}>
                        <Info />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Like this recommendation">
                      <IconButton
                        color={trackFeedback?.feedback === 'like' ? 'success' : 'default'}
                        onClick={() => handleFeedback(track, 'like')}
                      >
                        <ThumbUp />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Not interested">
                      <IconButton
                        color={trackFeedback?.feedback === 'dislike' ? 'error' : 'default'}
                        onClick={() => handleFeedback(track, 'dislike')}
                      >
                        <ThumbDown />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {trackFeedback && (
                    <Chip
                      label={`Feedback: ${trackFeedback.feedback}`}
                      size="small"
                      color={trackFeedback.feedback === 'like' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </List>

      {/* Explanation Dialog */}
      <Dialog
        open={explanationDialog.open}
        onClose={() => setExplanationDialog({ open: false, track: null, explanation: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology color="primary" />
          Why &quot;{explanationDialog.track?.name}&quot; was recommended
        </DialogTitle>

        <DialogContent>
          {loadingExplanation ? (
            <Box sx={{ display: 'flex', alignItems: 'center', p: 4 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Generating explanation...</Typography>
            </Box>
          ) : explanationDialog.explanation ? (
            <Box>
              {explanationDialog.explanation.error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {explanationDialog.explanation.error}
                </Alert>
              ) : (
                <>
                  {/* Summary */}
                  <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(25, 118, 210, 0.04)' }}>
                    <Typography variant="body1" paragraph>
                      <strong>Summary:</strong> {explanationDialog.explanation.summary}
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        icon={getAlgorithmIcon(explanationDialog.explanation.algorithm)}
                        label={`Algorithm: ${explanationDialog.explanation.algorithm}`}
                        variant="outlined"
                      />
                      <Chip
                        icon={<TrendingUp />}
                        label={`${Math.round((explanationDialog.explanation.confidence || 0.7) * 100)}% confidence`}
                        color={getConfidenceColor(explanationDialog.explanation.confidence || 0.7)}
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>

                  {/* Detailed Reasons */}
                  {explanationDialog.explanation.reasons && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Reasoning Factors</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {explanationDialog.explanation.reasons.map((reason, idx) => (
                            <ListItem key={idx} sx={{ pl: 0 }}>
                              <ListItemText
                                primary={reason}
                                sx={{ '& .MuiListItemText-primary': { fontSize: '0.95rem' } }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Algorithm Factors */}
                  {explanationDialog.explanation.factors && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Algorithm Breakdown</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          {explanationDialog.explanation.factors.map((factor, idx) => (
                            <Box key={idx}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {factor.description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {Math.round(factor.weight * 100)}% weight
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={factor.weight * 100}
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Track-Specific Explanation */}
                  {explanationDialog.explanation.trackSpecific && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Track Analysis</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Specific reasons for &quot;
                          {explanationDialog.explanation.trackSpecific.name}&quot;:
                        </Typography>
                        <List>
                          {explanationDialog.explanation.trackSpecific.reasons.map(
                            (reason, idx) => (
                              <ListItem key={idx} sx={{ pl: 0 }}>
                                <ListItemText
                                  primary={reason}
                                  sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                                />
                              </ListItem>
                            )
                          )}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </>
              )}
            </Box>
          ) : (
            <Typography>No explanation available</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Rating
            value={explanationDialog.explanation?.userRating || 0}
            onChange={(_, value) => {
              if (explanationDialog.track && value) {
                handleFeedback(explanationDialog.track, 'rate_explanation', value);
              }
            }}
            sx={{ mr: 'auto' }}
          />
          <Button
            onClick={() => setExplanationDialog({ open: false, track: null, explanation: null })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExplainableRecommendations;
