import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Rating,
  TextField,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Avatar,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Favorite,
  FavoriteBorder,
  SkipNext,
  Report,
  Send,
  Close,
  CheckCircle,
  MusicNote,
  Chat,
} from '@mui/icons-material';

/**
 * Universal Feedback System Component
 * Handles feedback for recommendations, chat responses, and other content
 */
const FeedbackSystem = ({ 
  type = 'recommendation', // 'recommendation' | 'chat' | 'track'
  targetId,
  trackId,
  onSubmitFeedback,
  showInline = true,
  showDetailed = false,
  disabled = false
}) => {
  const [feedbackState, setFeedbackState] = useState({
    feedback: null,
    rating: 0,
    comment: '',
    submitted: false,
    loading: false
  });
  
  const [detailedFeedbackDialog, setDetailedFeedbackDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleQuickFeedback = useCallback(async (feedback) => {
    if (disabled || feedbackState.submitted) return;

    setFeedbackState(prev => ({ ...prev, loading: true }));

    try {
      await submitFeedback({ feedback });
      setFeedbackState(prev => ({ 
        ...prev, 
        feedback, 
        submitted: true, 
        loading: false 
      }));
      
      showSnackbar('Thank you for your feedback!', 'success');
    } catch (error) {
      setFeedbackState(prev => ({ ...prev, loading: false }));
      showSnackbar('Failed to submit feedback', 'error');
    }
  }, [disabled, feedbackState.submitted]);

  const handleRating = useCallback(async (rating) => {
    if (disabled || feedbackState.submitted) return;

    setFeedbackState(prev => ({ ...prev, loading: true }));

    try {
      await submitFeedback({ rating });
      setFeedbackState(prev => ({ 
        ...prev, 
        rating, 
        submitted: true, 
        loading: false 
      }));
      
      showSnackbar('Rating submitted!', 'success');
    } catch (error) {
      setFeedbackState(prev => ({ ...prev, loading: false }));
      showSnackbar('Failed to submit rating', 'error');
    }
  }, [disabled, feedbackState.submitted]);

  const handleDetailedFeedback = useCallback(async () => {
    if (!feedbackState.comment.trim()) return;

    setFeedbackState(prev => ({ ...prev, loading: true }));

    try {
      await submitFeedback({
        feedback: feedbackState.feedback,
        rating: feedbackState.rating,
        comment: feedbackState.comment
      });
      
      setFeedbackState(prev => ({ 
        ...prev, 
        submitted: true, 
        loading: false 
      }));
      
      setDetailedFeedbackDialog(false);
      showSnackbar('Detailed feedback submitted!', 'success');
    } catch (error) {
      setFeedbackState(prev => ({ ...prev, loading: false }));
      showSnackbar('Failed to submit feedback', 'error');
    }
  }, [feedbackState]);

  const submitFeedback = async (feedbackData) => {
    if (!onSubmitFeedback) {
      throw new Error('No feedback handler provided');
    }

    const payload = {
      type,
      targetId,
      trackId,
      ...feedbackData,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: 'feedback_system'
      }
    };

    return await onSubmitFeedback(payload);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getFeedbackIcon = (feedbackType) => {
    switch (feedbackType) {
      case 'like':
        return <ThumbUp />;
      case 'dislike':
        return <ThumbDown />;
      case 'love':
        return <Favorite />;
      case 'skip':
        return <SkipNext />;
      default:
        return <ThumbUp />;
    }
  };

  const getFeedbackColor = (feedbackType) => {
    switch (feedbackType) {
      case 'like':
      case 'love':
        return 'success';
      case 'dislike':
        return 'error';
      case 'skip':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getFeedbackOptions = () => {
    switch (type) {
      case 'recommendation':
        return [
          { id: 'like', label: 'Like', icon: <ThumbUp />, tooltip: 'I like this recommendation' },
          { id: 'dislike', label: 'Dislike', icon: <ThumbDown />, tooltip: 'Not my taste' },
          { id: 'love', label: 'Love', icon: <Favorite />, tooltip: 'Perfect recommendation!' },
          { id: 'skip', label: 'Skip', icon: <SkipNext />, tooltip: 'Skip this track' },
        ];
      case 'chat':
        return [
          { id: 'helpful', label: 'Helpful', icon: <ThumbUp />, tooltip: 'This response was helpful' },
          { id: 'not_helpful', label: 'Not Helpful', icon: <ThumbDown />, tooltip: 'This response was not helpful' },
        ];
      case 'track':
        return [
          { id: 'like', label: 'Like', icon: <FavoriteBorder />, tooltip: 'Add to liked songs' },
          { id: 'dislike', label: 'Dislike', icon: <ThumbDown />, tooltip: 'Not interested' },
        ];
      default:
        return [];
    }
  };

  if (!showInline && !showDetailed) {
    return null;
  }

  return (
    <Box>
      {/* Inline Feedback */}
      {showInline && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* Quick Action Buttons */}
          <Stack direction="row" spacing={0.5}>
            {getFeedbackOptions().map((option) => (
              <Tooltip key={option.id} title={option.tooltip}>
                <IconButton
                  size="small"
                  color={feedbackState.feedback === option.id ? getFeedbackColor(option.id) : 'default'}
                  onClick={() => handleQuickFeedback(option.id)}
                  disabled={disabled || feedbackState.submitted || feedbackState.loading}
                  sx={{
                    opacity: feedbackState.submitted && feedbackState.feedback !== option.id ? 0.5 : 1,
                    transform: feedbackState.feedback === option.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {feedbackState.loading && feedbackState.feedback === option.id ? (
                    <CircularProgress size={16} />
                  ) : (
                    option.icon
                  )}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>

          {/* Rating */}
          <Rating
            size="small"
            value={feedbackState.rating}
            onChange={(_, value) => handleRating(value)}
            disabled={disabled || feedbackState.submitted}
            sx={{ 
              opacity: feedbackState.submitted && feedbackState.rating === 0 ? 0.5 : 1 
            }}
          />

          {/* Detailed Feedback Button */}
          {showDetailed && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setDetailedFeedbackDialog(true)}
              disabled={disabled || feedbackState.submitted}
              sx={{ fontSize: '0.75rem' }}
            >
              Comment
            </Button>
          )}

          {/* Submitted Indicator */}
          {feedbackState.submitted && (
            <Fade in={feedbackState.submitted}>
              <Chip
                icon={<CheckCircle />}
                label="Thank you!"
                size="small"
                color="success"
                variant="outlined"
              />
            </Fade>
          )}
        </Box>
      )}

      {/* Detailed Feedback Dialog */}
      <Dialog
        open={detailedFeedbackDialog}
        onClose={() => setDetailedFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {type === 'chat' ? <Chat /> : <MusicNote />}
          Share Your Thoughts
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your feedback helps us improve our {type === 'chat' ? 'AI responses' : 'recommendations'}.
          </Typography>

          {/* Current Feedback Summary */}
          {(feedbackState.feedback || feedbackState.rating > 0) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Current feedback: {feedbackState.feedback && (
                  <Chip 
                    size="small" 
                    label={feedbackState.feedback}
                    color={getFeedbackColor(feedbackState.feedback)}
                    sx={{ mx: 1 }}
                  />
                )}
                {feedbackState.rating > 0 && `${feedbackState.rating}/5 stars`}
              </Typography>
            </Alert>
          )}

          {/* Quick Actions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Feedback:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {getFeedbackOptions().map((option) => (
                <Button
                  key={option.id}
                  variant={feedbackState.feedback === option.id ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={option.icon}
                  onClick={() => setFeedbackState(prev => ({ ...prev, feedback: option.id }))}
                  color={getFeedbackColor(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Rating */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rating:
            </Typography>
            <Rating
              value={feedbackState.rating}
              onChange={(_, value) => setFeedbackState(prev => ({ ...prev, rating: value || 0 }))}
              size="large"
            />
          </Box>

          {/* Comment */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Comments (Optional)"
            value={feedbackState.comment}
            onChange={(e) => setFeedbackState(prev => ({ ...prev, comment: e.target.value }))}
            placeholder={`Tell us more about this ${type}...`}
            variant="outlined"
          />
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setDetailedFeedbackDialog(false)}
            disabled={feedbackState.loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={feedbackState.loading ? <CircularProgress size={16} /> : <Send />}
            onClick={handleDetailedFeedback}
            disabled={feedbackState.loading || (!feedbackState.feedback && !feedbackState.rating && !feedbackState.comment.trim())}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

/**
 * Feedback Analytics Component
 * Shows feedback statistics and insights
 */
const FeedbackAnalytics = ({ analytics, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading feedback analytics...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No feedback analytics available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Feedback Summary
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2}>
            <Chip 
              label={`${analytics.summary?.totalFeedback || 0} Total`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`${(analytics.summary?.averageRating || 0).toFixed(1)} ⭐ Avg`}
              color="success"
              variant="outlined"
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Feedback Distribution */}
        {analytics.distribution && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Feedback Distribution:
            </Typography>
            <Stack spacing={1}>
              {Object.entries(analytics.distribution.byFeedback || {}).map(([feedback, count]) => (
                <Box key={feedback} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {feedback}
                  </Typography>
                  <Chip size="small" label={count} />
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export { FeedbackSystem as default, FeedbackAnalytics };