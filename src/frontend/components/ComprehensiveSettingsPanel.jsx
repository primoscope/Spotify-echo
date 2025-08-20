import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Settings,
  Psychology,
  Storage,
  Security,
  Api,
  Speed,
  ExpandMore,
  Save,
  Refresh,
  TestTube,
  MusicNote,
  Analytics,
  CloudCircle,
  Check,
  Warning,
  Error,
  Info,
  Visibility,
  VisibilityOff,
  Edit,
  Delete,
  Add,
} from '@mui/icons-material';

/**
 * Comprehensive Settings Panel
 * Full configuration interface for EchoTune AI with:
 * - Complete LLM provider configuration
 * - Advanced model parameter tuning
 * - Spotify API integration settings
 * - MongoDB database management
 * - Real-time system monitoring
 * - Backend service configuration
 * - Security and performance optimization
 */
const ComprehensiveSettingsPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState({});
  
  // LLM Provider configurations
  const [llmConfig, setLlmConfig] = useState({
    providers: {
      openai: {
        name: 'OpenAI',
        enabled: false,
        apiKey: '',
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4o',
        parameters: {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        },
        rateLimit: { requests: 3500, window: 60 },
        cost: { input: 0.0025, output: 0.01 },
      },
      gemini: {
        name: 'Google Gemini',
        enabled: true,
        apiKey: '',
        baseURL: 'https://generativelanguage.googleapis.com/v1',
        models: ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        defaultModel: 'gemini-2.0-flash',
        parameters: {
          temperature: 0.7,
          maxTokens: 4096,
          topK: 40,
          topP: 0.95,
        },
        rateLimit: { requests: 1500, window: 60 },
        cost: { input: 0.00075, output: 0.003 },
      },
      openrouter: {
        name: 'OpenRouter',
        enabled: false,
        apiKey: '',
        baseURL: 'https://openrouter.ai/api/v1',
        models: [
          'anthropic/claude-3.5-sonnet',
          'anthropic/claude-3-opus',
          'openai/gpt-4o',
          'google/gemini-pro-1.5',
          'meta-llama/llama-3.1-405b-instruct',
          'mistralai/mixtral-8x7b-instruct',
        ],
        defaultModel: 'anthropic/claude-3.5-sonnet',
        parameters: {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 1.0,
        },
        siteURL: '',
        appName: 'EchoTune AI',
        rateLimit: { requests: 200, window: 60 },
        cost: { input: 0.003, output: 0.015 },
      },
    },
    currentProvider: 'gemini',
    fallbackProvider: 'mock',
    autoFailover: true,
    failoverThreshold: 3,
  });

  // Spotify API configuration
  const [spotifyConfig, setSpotifyConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [
      'user-read-private',
      'user-read-email',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
    market: 'US',
    limit: 50,
    timeRange: 'medium_term',
  });

  // Database configuration
  const [databaseConfig, setDatabaseConfig] = useState({
    mongodb: {
      uri: '',
      database: 'echotune',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
      },
      collections: {
        users: { ttl: null, indexes: ['userId', 'email'] },
        listening_history: { ttl: 2592000, indexes: ['userId', 'timestamp'] }, // 30 days
        recommendations: { ttl: 604800, indexes: ['userId', 'score'] }, // 7 days
        analytics: { ttl: 86400, indexes: ['timestamp', 'event'] }, // 1 day
      },
    },
    sqlite: {
      enabled: true,
      file: './data/echotune.db',
      fallback: true,
    },
    redis: {
      enabled: false,
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0,
      ttl: 3600,
    },
  });

  // System configuration
  const [systemConfig, setSystemConfig] = useState({
    environment: 'production',
    port: 3000,
    cors: {
      enabled: true,
      origin: ['http://localhost:3000', 'https://your-domain.com'],
      credentials: true,
    },
    security: {
      helmet: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
      },
      csrf: true,
      ssl: true,
    },
    performance: {
      compression: true,
      caching: true,
      clustering: false,
      workers: 'auto',
    },
    logging: {
      level: 'info',
      file: true,
      console: true,
      format: 'combined',
    },
  });

  // System status
  const [systemStatus, setSystemStatus] = useState({
    health: 'unknown',
    uptime: 0,
    memory: { used: 0, total: 0 },
    cpu: 0,
    database: { status: 'unknown', latency: 0 },
    providers: {},
    lastCheck: null,
  });

  // Load all configurations on mount
  useEffect(() => {
    loadAllConfigurations();
    loadSystemStatus();
  }, []);

  const loadAllConfigurations = async () => {
    setLoading(true);
    try {
      const [llm, spotify, database, system] = await Promise.all([
        fetch('/api/settings/llm').then(r => r.json()),
        fetch('/api/settings/spotify').then(r => r.json()),
        fetch('/api/settings/database').then(r => r.json()),
        fetch('/api/settings/system').then(r => r.json()),
      ]);

      if (llm.success) setLlmConfig(prev => ({ ...prev, ...llm.config }));
      if (spotify.success) setSpotifyConfig(prev => ({ ...prev, ...spotify.config }));
      if (database.success) setDatabaseConfig(prev => ({ ...prev, ...database.config }));
      if (system.success) setSystemConfig(prev => ({ ...prev, ...system.config }));
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load configurations' });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status');
      const data = await response.json();
      if (data.success) {
        setSystemStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const saveConfiguration = async (section) => {
    setSaving(true);
    try {
      const configs = {
        llm: llmConfig,
        spotify: spotifyConfig,
        database: databaseConfig,
        system: systemConfig,
      };

      const response = await fetch(`/api/settings/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configs[section] }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `${section} configuration saved successfully` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (providerId) => {
    try {
      const response = await fetch('/api/llm/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          config: llmConfig.providers[providerId],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `${providerId} test successful` });
      } else {
        setMessage({ type: 'error', text: `${providerId} test failed: ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Provider test failed' });
    }
  };

  const testSpotifyConnection = async () => {
    try {
      const response = await fetch('/api/spotify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spotifyConfig),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Spotify connection test successful' });
      } else {
        setMessage({ type: 'error', text: 'Spotify connection test failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Spotify test failed' });
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/database/test', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Database connection successful' });
        loadSystemStatus();
      } else {
        setMessage({ type: 'error', text: 'Database connection failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Database test failed' });
    }
  };

  // Tab panels
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  // LLM Provider Settings Panel
  const renderLLMSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology /> AI Language Model Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure multiple LLM providers with advanced parameter tuning and automatic failover
        </Typography>
      </Grid>

      {Object.entries(llmConfig.providers).map(([providerId, config]) => (
        <Grid item xs={12} key={providerId}>
          <Accordion defaultExpanded={config.enabled}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="h6">{config.name}</Typography>
                <Chip
                  label={config.enabled ? 'Enabled' : 'Disabled'}
                  color={config.enabled ? 'success' : 'default'}
                  size="small"
                />
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Test Connection">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      testProvider(providerId);
                    }}
                    disabled={!config.enabled}
                  >
                    <TestTube />
                  </IconButton>
                </Tooltip>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => setLlmConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [providerId]: { ...config, enabled: e.target.checked }
                          }
                        }))}
                      />
                    }
                    label="Enable Provider"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type={showApiKeys[providerId] ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setLlmConfig(prev => ({
                      ...prev,
                      providers: {
                        ...prev.providers,
                        [providerId]: { ...config, apiKey: e.target.value }
                      }
                    }))}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowApiKeys(prev => ({
                            ...prev,
                            [providerId]: !prev[providerId]
                          }))}
                        >
                          {showApiKeys[providerId] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Base URL"
                    value={config.baseURL}
                    onChange={(e) => setLlmConfig(prev => ({
                      ...prev,
                      providers: {
                        ...prev.providers,
                        [providerId]: { ...config, baseURL: e.target.value }
                      }
                    }))}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Model</InputLabel>
                    <Select
                      value={config.defaultModel}
                      onChange={(e) => setLlmConfig(prev => ({
                        ...prev,
                        providers: {
                          ...prev.providers,
                          [providerId]: { ...config, defaultModel: e.target.value }
                        }
                      }))}
                    >
                      {config.models.map(model => (
                        <MenuItem key={model} value={model}>{model}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Advanced Parameters */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Advanced Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography gutterBottom>Temperature: {config.parameters.temperature}</Typography>
                      <Slider
                        value={config.parameters.temperature}
                        min={0}
                        max={2}
                        step={0.1}
                        onChange={(_, value) => setLlmConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [providerId]: {
                              ...config,
                              parameters: { ...config.parameters, temperature: value }
                            }
                          }
                        }))}
                        valueLabelDisplay="auto"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Max Tokens"
                        type="number"
                        value={config.parameters.maxTokens}
                        onChange={(e) => setLlmConfig(prev => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            [providerId]: {
                              ...config,
                              parameters: { ...config.parameters, maxTokens: parseInt(e.target.value) }
                            }
                          }
                        }))}
                      />
                    </Grid>

                    {config.parameters.topP !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography gutterBottom>Top P: {config.parameters.topP}</Typography>
                        <Slider
                          value={config.parameters.topP}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(_, value) => setLlmConfig(prev => ({
                            ...prev,
                            providers: {
                              ...prev.providers,
                              [providerId]: {
                                ...config,
                                parameters: { ...config.parameters, topP: value }
                              }
                            }
                          }))}
                          valueLabelDisplay="auto"
                        />
                      </Grid>
                    )}

                    {config.parameters.topK !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          fullWidth
                          label="Top K"
                          type="number"
                          value={config.parameters.topK}
                          onChange={(e) => setLlmConfig(prev => ({
                            ...prev,
                            providers: {
                              ...prev.providers,
                              [providerId]: {
                                ...config,
                                parameters: { ...config.parameters, topK: parseInt(e.target.value) }
                              }
                            }
                          }))}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                {/* Cost and Rate Limit Info */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Rate Limit: {config.rateLimit.requests} req/{config.rateLimit.window}s
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Input Cost: ${config.cost.input}/1K tokens
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Output Cost: ${config.cost.output}/1K tokens
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      ))}

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => saveConfiguration('llm')}
            disabled={saving}
            startIcon={<Save />}
          >
            Save LLM Configuration
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  // Spotify Settings Panel
  const renderSpotifySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MusicNote /> Spotify API Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure Spotify Web API integration for music discovery and playback control
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Client ID"
          value={spotifyConfig.clientId}
          onChange={(e) => setSpotifyConfig(prev => ({ ...prev, clientId: e.target.value }))}
          placeholder="Your Spotify Client ID"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Client Secret"
          type={showApiKeys.spotify ? 'text' : 'password'}
          value={spotifyConfig.clientSecret}
          onChange={(e) => setSpotifyConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
          placeholder="Your Spotify Client Secret"
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={() => setShowApiKeys(prev => ({ ...prev, spotify: !prev.spotify }))}
              >
                {showApiKeys.spotify ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Redirect URI"
          value={spotifyConfig.redirectUri}
          onChange={(e) => setSpotifyConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
          placeholder="http://localhost:3000/auth/callback"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          API Scopes
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {spotifyConfig.scopes.map(scope => (
            <Chip
              key={scope}
              label={scope}
              onDelete={() => setSpotifyConfig(prev => ({
                ...prev,
                scopes: prev.scopes.filter(s => s !== scope)
              }))}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth>
          <InputLabel>Market</InputLabel>
          <Select
            value={spotifyConfig.market}
            onChange={(e) => setSpotifyConfig(prev => ({ ...prev, market: e.target.value }))}
          >
            <MenuItem value="US">United States</MenuItem>
            <MenuItem value="GB">United Kingdom</MenuItem>
            <MenuItem value="CA">Canada</MenuItem>
            <MenuItem value="AU">Australia</MenuItem>
            <MenuItem value="DE">Germany</MenuItem>
            <MenuItem value="FR">France</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Default Limit"
          type="number"
          value={spotifyConfig.limit}
          onChange={(e) => setSpotifyConfig(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
          inputProps={{ min: 1, max: 50 }}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <FormControl fullWidth>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={spotifyConfig.timeRange}
            onChange={(e) => setSpotifyConfig(prev => ({ ...prev, timeRange: e.target.value }))}
          >
            <MenuItem value="short_term">Last 4 weeks</MenuItem>
            <MenuItem value="medium_term">Last 6 months</MenuItem>
            <MenuItem value="long_term">All time</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={testSpotifyConnection}
            startIcon={<TestTube />}
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            onClick={() => saveConfiguration('spotify')}
            disabled={saving}
            startIcon={<Save />}
          >
            Save Spotify Configuration
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  // Database Settings Panel
  const renderDatabaseSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storage /> Database Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure MongoDB, SQLite, and Redis database connections and optimization settings
        </Typography>
      </Grid>

      {/* MongoDB Configuration */}
      <Grid item xs={12}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">MongoDB Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="MongoDB URI"
                  type={showApiKeys.mongodb ? 'text' : 'password'}
                  value={databaseConfig.mongodb.uri}
                  onChange={(e) => setDatabaseConfig(prev => ({
                    ...prev,
                    mongodb: { ...prev.mongodb, uri: e.target.value }
                  }))}
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowApiKeys(prev => ({ ...prev, mongodb: !prev.mongodb }))}
                      >
                        {showApiKeys.mongodb ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Database Name"
                  value={databaseConfig.mongodb.database}
                  onChange={(e) => setDatabaseConfig(prev => ({
                    ...prev,
                    mongodb: { ...prev.mongodb, database: e.target.value }
                  }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Pool Size"
                  type="number"
                  value={databaseConfig.mongodb.options.maxPoolSize}
                  onChange={(e) => setDatabaseConfig(prev => ({
                    ...prev,
                    mongodb: {
                      ...prev.mongodb,
                      options: { ...prev.mongodb.options, maxPoolSize: parseInt(e.target.value) }
                    }
                  }))}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Collection TTL Settings (seconds)
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(databaseConfig.mongodb.collections).map(([collection, config]) => (
                    <Grid item xs={12} sm={6} md={3} key={collection}>
                      <TextField
                        fullWidth
                        label={collection.replace('_', ' ').toUpperCase()}
                        type="number"
                        value={config.ttl || ''}
                        onChange={(e) => setDatabaseConfig(prev => ({
                          ...prev,
                          mongodb: {
                            ...prev.mongodb,
                            collections: {
                              ...prev.mongodb.collections,
                              [collection]: {
                                ...config,
                                ttl: e.target.value ? parseInt(e.target.value) : null
                              }
                            }
                          }
                        }))}
                        placeholder="Never expire"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={testDatabaseConnection}
            startIcon={<TestTube />}
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            onClick={() => saveConfiguration('database')}
            disabled={saving}
            startIcon={<Save />}
          >
            Save Database Configuration
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  // System Monitor Panel
  const renderSystemMonitor = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Analytics /> System Status & Performance
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Real-time system health monitoring and performance metrics
          </Typography>
          <Button startIcon={<Refresh />} onClick={loadSystemStatus}>
            Refresh
          </Button>
        </Box>
      </Grid>

      {/* System Health Overview */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {systemStatus.health === 'healthy' ? (
                <Check color="success" />
              ) : systemStatus.health === 'warning' ? (
                <Warning color="warning" />
              ) : (
                <Error color="error" />
              )}
              <Typography variant="h5">{systemStatus.health.toUpperCase()}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Uptime: {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Check: {systemStatus.lastCheck ? new Date(systemStatus.lastCheck).toLocaleString() : 'Never'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Resource Usage */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resource Usage
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Memory: {Math.round(systemStatus.memory.used / 1024 / 1024)}MB / {Math.round(systemStatus.memory.total / 1024 / 1024)}MB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(systemStatus.memory.used / systemStatus.memory.total) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>
                CPU: {systemStatus.cpu}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemStatus.cpu}
                sx={{ height: 8, borderRadius: 4 }}
                color={systemStatus.cpu > 80 ? 'error' : systemStatus.cpu > 60 ? 'warning' : 'success'}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Provider Status */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Provider Status
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(systemStatus.providers).map(([providerId, status]) => (
                <Grid item xs={12} sm={6} md={4} key={providerId}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {providerId.toUpperCase()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {status.available ? <Check color="success" /> : <Error color="error" />}
                      <Typography variant="body2">
                        {status.available ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                    {status.latency && (
                      <Typography variant="caption" color="text.secondary">
                        {status.latency}ms
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Message Alert */}
      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="AI Providers" icon={<Psychology />} />
          <Tab label="Spotify API" icon={<MusicNote />} />
          <Tab label="Database" icon={<Storage />} />
          <Tab label="System Monitor" icon={<Analytics />} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderLLMSettings()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderSpotifySettings()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderDatabaseSettings()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderSystemMonitor()}
      </TabPanel>

      {/* Loading Overlay */}
      {saving && (
        <Dialog open={saving}>
          <DialogContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Saving configuration...</Typography>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default ComprehensiveSettingsPanel;