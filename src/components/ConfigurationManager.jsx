/**
 * Enhanced Configuration Manager
 * Synchronizes frontend and backend configurations with real-time updates
 * Integrates with MCP servers for automated configuration validation
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Smart as SmartIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Download as ExportIcon,
  Upload as ImportIcon
} from '@mui/icons-material';

const ConfigurationManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [configuration, setConfiguration] = useState({
    application: {
      name: 'EchoTune AI',
      version: '2.1.0',
      environment: 'development',
      debug: true,
      port: 3000,
      domain: 'localhost'
    },
    ai_providers: {
      primary_provider: 'mock',
      openai: {
        enabled: false,
        api_key: '',
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000
      },
      gemini: {
        enabled: false,
        api_key: '',
        model: 'gemini-pro',
        temperature: 0.7,
        safety_settings: 'default'
      },
      mock: {
        enabled: true,
        response_delay: 1000,
        sample_responses: true
      }
    },
    database: {
      mongodb: {
        enabled: true,
        uri: '',
        database_name: 'echotune',
        connection_timeout: 5000,
        max_pool_size: 10
      },
      redis: {
        enabled: false,
        host: 'localhost',
        port: 6379,
        password: '',
        ttl: 3600
      },
      sqlite: {
        enabled: true,
        path: './data/echotune.db',
        backup_enabled: true
      }
    },
    security: {
      rate_limiting: {
        enabled: true,
        window_ms: 900000,
        max_requests: 100
      },
      cors: {
        enabled: true,
        origin: '*',
        credentials: true
      },
      ssl: {
        enabled: false,
        cert_path: '',
        key_path: '',
        auto_renewal: true
      },
      session: {
        secret: '',
        max_age: 86400000,
        secure: false
      }
    },
    performance: {
      caching: {
        enabled: true,
        strategy: 'memory',
        ttl: 3600
      },
      compression: {
        enabled: true,
        level: 6
      },
      clustering: {
        enabled: false,
        workers: 'auto'
      },
      monitoring: {
        enabled: true,
        metrics_interval: 60000,
        health_checks: true
      }
    },
    mcp_servers: {
      orchestrator_enabled: true,
      servers: {
        filesystem: { enabled: true, port: null },
        puppeteer: { enabled: true, port: null },
        mermaid: { enabled: true, port: null },
        browserbase: { enabled: false, api_key: '' },
        spotify: { enabled: false, client_id: '', client_secret: '' }
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [healthStatus, setHealthStatus] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
    loadHealthStatus();
    // Set up periodic health status updates
    const interval = setInterval(loadHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setConfiguration(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setSaveStatus({ type: 'error', message: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const loadHealthStatus = async () => {
    try {
      const [appHealth, mcpHealth] = await Promise.all([
        fetch('/health').then(r => r.json()).catch(() => ({})),
        fetch('http://localhost:3001/health').then(r => r.json()).catch(() => ({}))
      ]);
      
      setHealthStatus({
        application: appHealth,
        mcp_server: mcpHealth
      });
    } catch (error) {
      console.error('Failed to load health status:', error);
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    setValidationErrors([]);

    try {
      // Validate configuration
      const errors = validateConfiguration(configuration);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setSaveStatus({ type: 'error', message: 'Configuration validation failed' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configuration)
      });

      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Configuration saved successfully' });
        
        // Trigger MCP workflow automation
        await triggerMCPAutomation();
      } else {
        const error = await response.text();
        setSaveStatus({ type: 'error', message: `Failed to save: ${error}` });
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus({ type: 'error', message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const validateConfiguration = (config) => {
    const errors = [];

    // Validate ports
    if (config.application.port < 1000 || config.application.port > 65535) {
      errors.push('Application port must be between 1000 and 65535');
    }

    // Validate database configuration
    if (config.database.mongodb.enabled && !config.database.mongodb.uri) {
      errors.push('MongoDB URI is required when MongoDB is enabled');
    }

    // Validate AI provider configuration
    const enabledProviders = Object.entries(config.ai_providers)
      .filter(([key, provider]) => key !== 'primary_provider' && provider.enabled);
    
    if (enabledProviders.length === 0 && config.ai_providers.primary_provider !== 'mock') {
      errors.push('At least one AI provider must be enabled or use mock provider');
    }

    // Validate SSL configuration
    if (config.security.ssl.enabled) {
      if (!config.security.ssl.cert_path || !config.security.ssl.key_path) {
        errors.push('SSL certificate and key paths are required when SSL is enabled');
      }
    }

    return errors;
  };

  const triggerMCPAutomation = async () => {
    try {
      // Trigger the MCP workflow automation system
      const response = await fetch('/api/mcp/trigger-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'configuration_update' })
      });
      
      if (response.ok) {
        console.log('MCP automation triggered successfully');
      }
    } catch (error) {
      console.error('Failed to trigger MCP automation:', error);
    }
  };

  const updateConfiguration = (path, value) => {
    setConfiguration(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const exportConfiguration = () => {
    const dataStr = JSON.stringify(configuration, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `echotune-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfiguration = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);
          setConfiguration(prev => ({ ...prev, ...importedConfig }));
          setSaveStatus({ type: 'success', message: 'Configuration imported successfully' });
        } catch (error) {
          setSaveStatus({ type: 'error', message: 'Invalid configuration file' });
        }
      };
      reader.readAsText(file);
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const StatusChip = ({ status, label }) => {
    const getColor = () => {
      switch (status) {
        case 'healthy': case 'running': case 'available': return 'success';
        case 'warning': case 'needs_credentials': return 'warning';
        case 'error': case 'failed': case 'unhealthy': return 'error';
        default: return 'default';
      }
    };

    return (
      <Chip 
        label={label || status} 
        color={getColor()} 
        size="small" 
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', p: 2 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Configuration Manager
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Enhanced configuration management with real-time synchronization and MCP integration
              </Typography>
            </Box>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh health status">
                <IconButton onClick={loadHealthStatus} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export configuration">
                <IconButton onClick={exportConfiguration}>
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Import configuration">
                <IconButton component="label">
                  <ImportIcon />
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={importConfiguration}
                  />
                </IconButton>
              </Tooltip>
              <Button 
                variant="contained" 
                onClick={saveConfiguration}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Box>
          </Box>

          {/* Health Status */}
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>System Health</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">Application:</Typography>
                  <StatusChip status={healthStatus.application?.status} />
                  {healthStatus.application?.uptime && (
                    <Typography variant="caption" color="text.secondary">
                      Uptime: {Math.round(healthStatus.application.uptime)}s
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">MCP Server:</Typography>
                  <StatusChip status={healthStatus.mcp_server?.status} />
                  {healthStatus.mcp_server?.totalServers && (
                    <Typography variant="caption" color="text.secondary">
                      {healthStatus.mcp_server.totalServers} servers
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Configuration Errors:</Typography>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Application" icon={<SettingsIcon />} />
          <Tab label="AI Providers" icon={<SmartIcon />} />
          <Tab label="Database" icon={<StorageIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
          <Tab label="Performance" icon={<SpeedIcon />} />
        </Tabs>

        {/* Application Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Application Name"
                value={configuration.application.name}
                onChange={(e) => updateConfiguration('application.name', e.target.value)}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Version"
                value={configuration.application.version}
                onChange={(e) => updateConfiguration('application.version', e.target.value)}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Port"
                type="number"
                value={configuration.application.port}
                onChange={(e) => updateConfiguration('application.port', parseInt(e.target.value))}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Domain"
                value={configuration.application.domain}
                onChange={(e) => updateConfiguration('application.domain', e.target.value)}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configuration.application.debug}
                    onChange={(e) => updateConfiguration('application.debug', e.target.checked)}
                  />
                }
                label="Debug Mode"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* AI Providers Tab */}
        <TabPanel value={activeTab} index={1}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">OpenAI Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.ai_providers.openai.enabled}
                        onChange={(e) => updateConfiguration('ai_providers.openai.enabled', e.target.checked)}
                      />
                    }
                    label="Enable OpenAI"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="API Key"
                    type="password"
                    value={configuration.ai_providers.openai.api_key}
                    onChange={(e) => updateConfiguration('ai_providers.openai.api_key', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Model"
                    value={configuration.ai_providers.openai.model}
                    onChange={(e) => updateConfiguration('ai_providers.openai.model', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Google Gemini Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.ai_providers.gemini.enabled}
                        onChange={(e) => updateConfiguration('ai_providers.gemini.enabled', e.target.checked)}
                      />
                    }
                    label="Enable Google Gemini"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="API Key"
                    type="password"
                    value={configuration.ai_providers.gemini.api_key}
                    onChange={(e) => updateConfiguration('ai_providers.gemini.api_key', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Model"
                    value={configuration.ai_providers.gemini.model}
                    onChange={(e) => updateConfiguration('ai_providers.gemini.model', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Database Tab */}
        <TabPanel value={activeTab} index={2}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">MongoDB Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.database.mongodb.enabled}
                        onChange={(e) => updateConfiguration('database.mongodb.enabled', e.target.checked)}
                      />
                    }
                    label="Enable MongoDB"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="MongoDB URI"
                    value={configuration.database.mongodb.uri}
                    onChange={(e) => updateConfiguration('database.mongodb.uri', e.target.value)}
                    fullWidth
                    margin="normal"
                    placeholder="mongodb://localhost:27017/echotune"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Redis Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.database.redis.enabled}
                        onChange={(e) => updateConfiguration('database.redis.enabled', e.target.checked)}
                      />
                    }
                    label="Enable Redis"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Host"
                    value={configuration.database.redis.host}
                    onChange={(e) => updateConfiguration('database.redis.host', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Port"
                    type="number"
                    value={configuration.database.redis.port}
                    onChange={(e) => updateConfiguration('database.redis.port', parseInt(e.target.value))}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={3}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Rate Limiting</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.security.rate_limiting.enabled}
                        onChange={(e) => updateConfiguration('security.rate_limiting.enabled', e.target.checked)}
                      />
                    }
                    label="Enable Rate Limiting"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Window (ms)"
                    type="number"
                    value={configuration.security.rate_limiting.window_ms}
                    onChange={(e) => updateConfiguration('security.rate_limiting.window_ms', parseInt(e.target.value))}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Max Requests"
                    type="number"
                    value={configuration.security.rate_limiting.max_requests}
                    onChange={(e) => updateConfiguration('security.rate_limiting.max_requests', parseInt(e.target.value))}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={activeTab} index={4}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Caching</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.performance.caching.enabled}
                        onChange={(e) => updateConfiguration('performance.caching.enabled', e.target.checked)}
                      />
                    }
                    label="Enable Caching"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Monitoring</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.performance.monitoring.enabled}
                        onChange={(e) => updateConfiguration('performance.monitoring.enabled', e.target.checked)}
                      />
                    }
                    label="Enable Monitoring"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>
      </Card>

      {/* Save Status Snackbar */}
      <Snackbar
        open={!!saveStatus}
        autoHideDuration={6000}
        onClose={() => setSaveStatus(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {saveStatus && (
          <Alert 
            onClose={() => setSaveStatus(null)} 
            severity={saveStatus.type}
            variant="filled"
          >
            {saveStatus.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default ConfigurationManager;