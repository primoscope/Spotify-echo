import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Paper,
  Divider,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  SmartToy as SmartToyIcon,
  Architecture as ArchitectureIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  MusicNote as MusicNoteIcon,
  Widgets as WidgetsIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Layers as LayersIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

/**
 * AI Integration Architecture Dashboard
 * 
 * Demonstrates clean separation between:
 * A) Internal AI tooling / model orchestration / agent automation
 * B) The production EchoTune Spotify music app
 * 
 * Features:
 * - Real-time monitoring of AI services
 * - Architecture visualization
 * - Performance metrics
 * - Security boundaries
 * - Integration health checks
 */
const AIIntegrationDashboard = () => {
  // State management
  const [architectureView, setArchitectureView] = useState('overview');
  const [aiServices, setAiServices] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [securityStatus, setSecurityStatus] = useState({});
  const [separationCompliance, setSeparationCompliance] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);

  // Simulated AI services data
  const mockAIServices = useMemo(() => [
    {
      id: 'claude-opus-4.1',
      name: 'Claude Opus 4.1',
      category: 'internal_tooling',
      status: 'active',
      type: 'text_generation',
      provider: 'anthropic',
      performance: {
        latency: 1240,
        throughput: 45,
        accuracy: 0.96,
        uptime: 99.8
      },
      integration: {
        endpoint: '/agent/ai/claude-opus',
        isolation: 'complete',
        separation_score: 1.0
      },
      usage: {
        requests_today: 1247,
        tokens_processed: 892340,
        cost_today: 23.45
      }
    },
    {
      id: 'vertex-ai-gemini',
      name: 'Vertex AI Gemini 2.5 Pro',
      category: 'internal_tooling',
      status: 'active',
      type: 'multimodal',
      provider: 'google_cloud',
      performance: {
        latency: 890,
        throughput: 78,
        accuracy: 0.94,
        uptime: 99.9
      },
      integration: {
        endpoint: '/agent/ai/vertex-gemini',
        isolation: 'complete',
        separation_score: 1.0
      },
      usage: {
        requests_today: 923,
        tokens_processed: 654230,
        cost_today: 18.90
      }
    },
    {
      id: 'openai-gpt4',
      name: 'OpenAI GPT-4 Turbo',
      category: 'internal_tooling',
      status: 'active',
      type: 'text_generation',
      provider: 'openai',
      performance: {
        latency: 1120,
        throughput: 52,
        accuracy: 0.93,
        uptime: 99.7
      },
      integration: {
        endpoint: '/agent/ai/openai-gpt4',
        isolation: 'complete',
        separation_score: 1.0
      },
      usage: {
        requests_today: 756,
        tokens_processed: 423180,
        cost_today: 15.67
      }
    },
    {
      id: 'spotify-recommendation',
      name: 'Music Recommendation Engine',
      category: 'production_app',
      status: 'active',
      type: 'recommendation',
      provider: 'internal',
      performance: {
        latency: 240,
        throughput: 1250,
        accuracy: 0.89,
        uptime: 99.95
      },
      integration: {
        endpoint: '/api/recommendations',
        isolation: 'production',
        separation_score: 1.0
      },
      usage: {
        requests_today: 45670,
        recommendations_served: 234500,
        user_satisfaction: 0.87
      }
    }
  ], []);

  // System architecture boundaries
  const architectureBoundaries = useMemo(() => ({
    internal_ai_tooling: {
      name: 'Internal AI Tooling',
      description: 'Agent automation, model orchestration, and development assistance',
      components: [
        'Claude Opus 4.1 Deep Reasoning',
        'Vertex AI Gemini Analysis',
        'OpenAI GPT-4 Generation',
        'MCP Server Orchestration',
        'Agent Workflow Management'
      ],
      isolation: 'complete',
      access_pattern: 'development_only',
      data_flow: 'isolated'
    },
    production_music_app: {
      name: 'Production Music App',
      description: 'EchoTune Spotify music recommendation product',
      components: [
        'Music Recommendation Engine',
        'Spotify API Integration',
        'User Interface Components',
        'Playlist Management',
        'User Authentication'
      ],
      isolation: 'production',
      access_pattern: 'user_facing',
      data_flow: 'optimized'
    }
  }), []);

  // Load initial data
  useEffect(() => {
    setAiServices(mockAIServices);
    
    // Simulate system metrics
    setSystemMetrics({
      total_services: mockAIServices.length,
      active_services: mockAIServices.filter(s => s.status === 'active').length,
      avg_latency: mockAIServices.reduce((sum, s) => sum + s.performance.latency, 0) / mockAIServices.length,
      total_requests_today: mockAIServices.reduce((sum, s) => sum + (s.usage.requests_today || 0), 0),
      separation_compliance: 100
    });

    // Security status
    setSecurityStatus({
      isolation_verified: true,
      api_boundaries_secure: true,
      data_separation_complete: true,
      access_controls_active: true,
      audit_compliance: 98.5
    });

    // Separation compliance
    setSeparationCompliance({
      architectural_separation: 100,
      data_isolation: 100,
      api_segregation: 100,
      deployment_isolation: 100,
      monitoring_separation: 95
    });
  }, [mockAIServices]);

  // Real-time monitoring simulation
  useEffect(() => {
    if (!realTimeMonitoring) return;

    const interval = setInterval(() => {
      setAiServices(current => 
        current.map(service => ({
          ...service,
          performance: {
            ...service.performance,
            latency: service.performance.latency + (Math.random() - 0.5) * 100,
            throughput: service.performance.throughput + (Math.random() - 0.5) * 10
          },
          usage: {
            ...service.usage,
            requests_today: service.usage.requests_today + Math.floor(Math.random() * 5)
          }
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeMonitoring]);

  // Handle service details view
  const handleServiceDetails = useCallback((service) => {
    setSelectedService(service);
    setDialogOpen(true);
  }, []);

  // Get status color
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'active': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  }, []);

  // Get category icon
  const getCategoryIcon = useCallback((category) => {
    switch (category) {
      case 'internal_tooling': return <PsychologyIcon />;
      case 'production_app': return <MusicNoteIcon />;
      default: return <SmartToyIcon />;
    }
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          <ArchitectureIcon sx={{ fontSize: 40, color: '#2196F3' }} />
          AI Integration Architecture
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Clean separation between internal AI tooling and production music application
        </Typography>
      </Box>

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {systemMetrics.active_services}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active AI Services
                  </Typography>
                </Box>
                <SmartToyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {Math.round(systemMetrics.avg_latency || 0)}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Latency
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {systemMetrics.total_requests_today?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requests Today
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {systemMetrics.separation_compliance}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Separation Compliance
                  </Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Architecture Separation Visualization */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon />
            Architecture Boundaries
          </Typography>
          <FormControlLabel
            control={
              <Switch 
                checked={realTimeMonitoring}
                onChange={(e) => setRealTimeMonitoring(e.target.checked)}
              />
            }
            label="Real-time Monitoring"
          />
        </Box>

        <Grid container spacing={3}>
          {Object.entries(architectureBoundaries).map(([key, boundary]) => (
            <Grid item xs={12} md={6} key={key}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: boundary.isolation === 'complete' ? '2px solid' : '1px solid',
                  borderColor: boundary.isolation === 'complete' ? 'primary.main' : 'divider',
                  bgcolor: boundary.isolation === 'complete' 
                    ? alpha('#2196F3', 0.05) 
                    : alpha('#4CAF50', 0.05)
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {boundary.isolation === 'complete' ? <PsychologyIcon /> : <MusicNoteIcon />}
                    {boundary.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {boundary.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Components:</Typography>
                    {boundary.components.map((component, index) => (
                      <Chip 
                        key={index}
                        label={component}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        variant="outlined"
                        color={boundary.isolation === 'complete' ? 'primary' : 'success'}
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Isolation: ${boundary.isolation}`}
                      color={boundary.isolation === 'complete' ? 'primary' : 'success'}
                      size="small"
                    />
                    <Chip 
                      label={`Access: ${boundary.access_pattern}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={`Data: ${boundary.data_flow}`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* AI Services Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon />
          AI Services Status
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Latency</TableCell>
                <TableCell align="right">Throughput</TableCell>
                <TableCell align="right">Requests Today</TableCell>
                <TableCell align="center">Separation</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aiServices.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: service.category === 'internal_tooling' ? 'primary.main' : 'success.main',
                        width: 32,
                        height: 32
                      }}>
                        {getCategoryIcon(service.category)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{service.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {service.provider}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={service.category.replace('_', ' ')}
                      color={service.category === 'internal_tooling' ? 'primary' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip 
                      label={service.status}
                      color={getStatusColor(service.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    {Math.round(service.performance.latency)}ms
                  </TableCell>
                  
                  <TableCell align="right">
                    {Math.round(service.performance.throughput)}/min
                  </TableCell>
                  
                  <TableCell align="right">
                    {service.usage.requests_today?.toLocaleString() || 0}
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip 
                      label={`${Math.round(service.integration.separation_score * 100)}%`}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={() => handleServiceDetails(service)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Security & Compliance Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              Security Status
            </Typography>
            
            <List>
              {Object.entries(securityStatus).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemIcon>
                    {typeof value === 'boolean' ? (
                      value ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />
                    ) : (
                      <InfoIcon color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    secondary={typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : `${value}%`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LayersIcon />
              Separation Compliance
            </Typography>
            
            {Object.entries(separationCompliance).map(([key, value]) => (
              <Box key={key} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={value} 
                  color={value >= 95 ? 'success' : value >= 80 ? 'warning' : 'error'}
                />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Service Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedService && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: selectedService.category === 'internal_tooling' ? 'primary.main' : 'success.main'
              }}>
                {getCategoryIcon(selectedService.category)}
              </Avatar>
              {selectedService.name}
            </Box>
          )}
        </DialogTitle>
        
        <DialogContent>
          {selectedService && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Latency" 
                      secondary={`${Math.round(selectedService.performance.latency)}ms`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Throughput" 
                      secondary={`${Math.round(selectedService.performance.throughput)}/min`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Accuracy" 
                      secondary={`${Math.round(selectedService.performance.accuracy * 100)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Uptime" 
                      secondary={`${selectedService.performance.uptime}%`}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Integration Details</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Endpoint" 
                      secondary={selectedService.integration.endpoint}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Isolation Level" 
                      secondary={selectedService.integration.isolation}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Separation Score" 
                      secondary={`${Math.round(selectedService.integration.separation_score * 100)}%`}
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Usage Statistics</Typography>
                <Grid container spacing={2}>
                  {Object.entries(selectedService.usage).map(([key, value]) => (
                    <Grid item xs={6} sm={4} key={key}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIIntegrationDashboard;