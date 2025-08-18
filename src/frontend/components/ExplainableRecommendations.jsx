import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Stack,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Psychology,
  SmartToy,
  Speed,
  TrendingUp,
  Info,
} from '@mui/icons-material';

/**
 * ExplainableRecommendations Component
 * Shows AI model metadata, reasoning, and key features for recommendations
 */
const ExplainableRecommendations = ({ 
  recommendations, 
  explanation, 
  provider, 
  model, 
  metadata = {},
  showPanel = false,
  onTogglePanel 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handleCopyReasoning = async () => {
    try {
      const reasoningText = `
AI Music Recommendations - ${provider} (${model})

Reasoning Summary:
${explanation?.summary || 'No summary available'}

Key Factors:
${explanation?.reasoning?.map(r => `• ${r}`).join('\n') || 'No reasoning available'}

Context Factors:
${explanation?.contextFactors?.map(f => `• ${f.factor}: ${f.value} (influence: ${f.influence})`).join('\n') || 'No context factors'}

Conversation Flow:
${explanation?.conversationFlow || 'No conversation flow data'}

Generated at: ${new Date().toLocaleString()}
      `.trim();

      await navigator.clipboard.writeText(reasoningText);
      setCopySuccess(true);
    } catch (error) {
      console.error('Failed to copy reasoning:', error);
    }
  };

  const getProviderIcon = (providerName) => {
    const lowerProvider = providerName?.toLowerCase() || '';
    if (lowerProvider.includes('gemini')) return <SmartToy />;
    if (lowerProvider.includes('openai')) return <Psychology />;
    if (lowerProvider.includes('mock')) return <Info />;
    return <SmartToy />;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence === 'high') return 'success';
    if (confidence === 'medium') return 'warning';
    if (confidence === 'low') return 'error';
    return 'default';
  };

  return (
    <>
      {/* Toggle Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <IconButton
          onClick={onTogglePanel}
          color="primary"
          size="small"
          sx={{ 
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          <Psychology sx={{ mr: 1 }} />
          <Typography variant="body2">
            {showPanel ? 'Hide' : 'Show'} AI Explanation
          </Typography>
        </IconButton>
      </Box>

      {/* Explainability Panel */}
      <Collapse in={showPanel}>
        <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
          <CardContent>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getProviderIcon(provider)}
                <Typography variant="h6" component="h3">
                  AI Explanation
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  size="small"
                  label={provider || 'Unknown'}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={model || 'Unknown Model'}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Model Metadata */}
            {metadata && Object.keys(metadata).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info fontSize="small" />
                  Model Metadata
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {Object.entries(metadata).map(([key, value]) => (
                    <Chip
                      key={key}
                      size="small"
                      label={`${key}: ${value}`}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Reasoning Summary */}
            {explanation?.summary && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology fontSize="small" />
                  Reasoning Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {explanation.summary}
                </Typography>
              </Box>
            )}

            {/* Key Factors */}
            {explanation?.reasoning && explanation.reasoning.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp fontSize="small" />
                  Key Factors
                </Typography>
                <Stack spacing={1}>
                  {explanation.reasoning.map((reason, index) => (
                    <Chip
                      key={index}
                      size="small"
                      label={reason}
                      variant="filled"
                      color="primary"
                      sx={{ fontSize: '0.8rem', alignSelf: 'flex-start' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Context Factors */}
            {explanation?.contextFactors && explanation.contextFactors.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed fontSize="small" />
                  Context Factors
                </Typography>
                <Stack spacing={1}>
                  {explanation.contextFactors.map((factor, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={factor.factor}
                        variant="outlined"
                        color="secondary"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {factor.value}
                      </Typography>
                      <Chip
                        size="small"
                        label={factor.influence}
                        color={getConfidenceColor(factor.influence)}
                        variant="filled"
                        sx={{ fontSize: '0.6rem' }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Conversation Flow */}
            {explanation?.conversationFlow && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology fontSize="small" />
                  Conversation Flow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {explanation.conversationFlow}
                </Typography>
              </Box>
            )}

            {/* Copy Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Tooltip title="Copy reasoning to clipboard">
                <IconButton
                  onClick={handleCopyReasoning}
                  color="primary"
                  size="small"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    px: 2,
                    py: 1
                  }}
                >
                  <ContentCopy sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Copy Reasoning
                  </Typography>
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Success Notification */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopySuccess(false)} severity="success" sx={{ width: '100%' }}>
          Reasoning copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExplainableRecommendations;
