import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
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
  Typography,
  Button,
  Chip,
  Box,
  Rating,
  Collapse,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Info,
  ExpandMore,
  ExpandLess,
  Psychology,
  TrendingUp,
  MusicNote,
  Group,
  SmartToy,
  Schedule,
  ContentCopy,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

/**
 * Enhanced ExplainableRecommendations Component
 * Shows AI-powered music recommendations with human-readable explanations
 * and integrated streaming chat reasoning
 */
const ExplainableRecommendations = ({
  recommendations = [],
  onGetExplanation,
  onProvideFeedback,
  loading = false,
  // New props for streaming integration
  explainabilityData = null,
  visible = false,
  onToggleVisibility,
  onCopyToClipboard,
}) => {
  const [explanationDialog, setExplanationDialog] = useState({
    open: false,
    track: null,
    explanation: null,
  });
  const [feedbackStates, setFeedbackStates] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    reasoning: true,
    features: false,
    confidence: false
  });

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
        {explainabilityData && (
          <Tooltip title={visible ? 'Hide explainability panel' : 'Show explainability panel'}>
            <IconButton onClick={onToggleVisibility} size="small">
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        )}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        AI-curated music with transparent reasoning behind each recommendation
      </Typography>

      {/* Streaming Chat Explainability Panel */}
      {explainabilityData && (
        <Collapse in={visible}>
          <Card sx={{ mb: 3, border: 2, borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="primary" />
                  AI Reasoning
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={() => onCopyToClipboard && onCopyToClipboard(JSON.stringify(explainabilityData, null, 2))}
                >
                  Copy Debug Info
                </Button>
              </Box>

              <Accordion 
                expanded={expandedSections.reasoning}
                onChange={() => setExpandedSections(prev => ({ ...prev, reasoning: !prev.reasoning }))}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Model & Reasoning</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Model:</strong> {explainabilityData.model}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Prompt Summary:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                        {explainabilityData.prompt}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Reasoning Process:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {explainabilityData.reasoning}
                      </Typography>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion 
                expanded={expandedSections.confidence}
                onChange={() => setExpandedSections(prev => ({ ...prev, confidence: !prev.confidence }))}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    Confidence Score: {(explainabilityData.confidence * 100).toFixed(1)}%
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Rating
                      value={explainabilityData.confidence * 5}
                      readOnly
                      precision={0.1}
                      max={5}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({(explainabilityData.confidence * 100).toFixed(1)}% confident)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    This score indicates how confident the AI model is in its response based on available data and context.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion 
                expanded={expandedSections.features}
                onChange={() => setExpandedSections(prev => ({ ...prev, features: !prev.features }))}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Key Features Used</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {explainabilityData.features?.map((feature) => (
                      <Chip 
                        key={feature} 
                        label={feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    These data points were most influential in generating the response.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {explainabilityData.metadata && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Request ID:</strong> {explainabilityData.metadata.requestId} • 
                    <strong> Response Time:</strong> {explainabilityData.metadata.totalTime}ms
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Collapse>
      )}

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
