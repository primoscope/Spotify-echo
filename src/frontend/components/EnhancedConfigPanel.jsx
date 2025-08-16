import { useState, useEffect } from 'react';
import { Switch, Slider } from '@mui/material';
import {
  Settings,
  MusicNote,
  Analytics,
  Security,
  Api,
  Speed,
  Save,
  Refresh,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';

/**
 * Enhanced Configuration Panel
 * Provides comprehensive settings management for EchoTune AI
 */
function EnhancedConfigPanel() {
  // Configuration state
  const [config, setConfig] = useState({
    // Music Settings
    recommendationEngine: 'collaborative',
    audioQuality: 'high',
    discoveryMode: 'smart',

    // UI Settings
    theme: 'auto',
    animations: true,
    compactMode: false,

    // Performance Settings
    cacheSize: 100,
    requestTimeout: 30,
    batchSize: 20,

    // Privacy Settings
    anonymousMode: false,
    dataCollection: true,
    analytics: true,

    // MCP Server Settings
    mcpEnabled: true,
    mcpServers: {
      mermaid: true,
      filesystem: true,
      browserbase: false,
      spotify: true,
      github: false,
    },
  });

  const [systemStatus, setSystemStatus] = useState({
    health: 'unknown',
    mcpHealth: 'unknown',
    lastCheck: null,
    issues: [],
  });

  const [saveDialog, setSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
    checkSystemHealth();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/settings/config');
      if (response.ok) {
        const data = await response.json();
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      setLoading(true);

      // Check main app health
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();

      // Check MCP server health
      const mcpResponse = await fetch('http://localhost:3001/health');
      const mcpData = await mcpResponse.json();

      setSystemStatus({
        health: healthData.status,
        mcpHealth: mcpData.status,
        lastCheck: new Date().toLocaleString(),
        issues: [],
      });
    } catch (error) {
      setSystemStatus((prev) => ({
        ...prev,
        issues: [...prev.issues, error.message],
        lastCheck: new Date().toLocaleString(),
      }));
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/settings/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        setSaveDialog(true);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
      case 'unhealthy':
        return <Error color="error" />;
      default:
        return <Refresh color="action" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings /> Enhanced Configuration
      </Typography>

      {/* System Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getStatusIcon(systemStatus.health)}
                <Typography>Main Application: {systemStatus.health}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {getStatusIcon(systemStatus.mcpHealth)}
                <Typography>MCP Server: {systemStatus.mcpHealth}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Last Check: {systemStatus.lastCheck || 'Never'}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={checkSystemHealth}
              disabled={loading}
              startIcon={<Refresh />}
            >
              Refresh Status
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Music Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <MusicNote /> Music Settings
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Recommendation Engine</InputLabel>
                <Select
                  value={config.recommendationEngine}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, recommendationEngine: e.target.value }))
                  }
                >
                  <MenuItem value="collaborative">Collaborative Filtering</MenuItem>
                  <MenuItem value="content-based">Content-Based</MenuItem>
                  <MenuItem value="hybrid">Hybrid (Recommended)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Discovery Mode</InputLabel>
                <Select
                  value={config.discoveryMode}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, discoveryMode: e.target.value }))
                  }
                >
                  <MenuItem value="smart">Smart Discovery</MenuItem>
                  <MenuItem value="mood-based">Mood-Based</MenuItem>
                  <MenuItem value="trending">Trending</MenuItem>
                  <MenuItem value="social">Social</MenuItem>
                </Select>
              </FormControl>

              <Typography gutterBottom sx={{ mt: 2 }}>
                Audio Quality
              </Typography>
              <Slider
                value={
                  config.audioQuality === 'high' ? 100 : config.audioQuality === 'medium' ? 50 : 25
                }
                onChange={(e, value) => {
                  const quality = value >= 75 ? 'high' : value >= 50 ? 'medium' : 'low';
                  setConfig((prev) => ({ ...prev, audioQuality: quality }));
                }}
                marks={[
                  { value: 25, label: 'Low' },
                  { value: 50, label: 'Medium' },
                  { value: 100, label: 'High' },
                ]}
                step={25}
                min={25}
                max={100}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Speed /> Performance Settings
              </Typography>

              <Typography gutterBottom>Cache Size (MB): {config.cacheSize}</Typography>
              <Slider
                value={config.cacheSize}
                onChange={(e, value) => setConfig((prev) => ({ ...prev, cacheSize: value }))}
                min={50}
                max={500}
                step={25}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom sx={{ mt: 2 }}>
                Request Timeout (seconds): {config.requestTimeout}
              </Typography>
              <Slider
                value={config.requestTimeout}
                onChange={(e, value) => setConfig((prev) => ({ ...prev, requestTimeout: value }))}
                min={5}
                max={60}
                step={5}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom sx={{ mt: 2 }}>
                Batch Size: {config.batchSize}
              </Typography>
              <Slider
                value={config.batchSize}
                onChange={(e, value) => setConfig((prev) => ({ ...prev, batchSize: value }))}
                min={10}
                max={100}
                step={10}
                valueLabelDisplay="auto"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* MCP Server Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Api /> MCP Server Configuration
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Enable or disable individual MCP servers for automation capabilities
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {Object.entries(config.mcpServers).map(([server, enabled]) => (
                  <Grid item xs={12} sm={6} md={4} key={server}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {server.charAt(0).toUpperCase() + server.slice(1)}
                        </Typography>
                        <Chip
                          label={enabled ? 'Enabled' : 'Disabled'}
                          color={enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Switch
                        checked={enabled}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            mcpServers: { ...prev.mcpServers, [server]: e.target.checked },
                          }))
                        }
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Security */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Security /> Privacy & Security
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography>Anonymous Mode</Typography>
                <Switch
                  checked={config.anonymousMode}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, anonymousMode: e.target.checked }))
                  }
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography>Data Collection</Typography>
                <Switch
                  checked={config.dataCollection}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, dataCollection: e.target.checked }))
                  }
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Analytics</Typography>
                <Switch
                  checked={config.analytics}
                  onChange={(e) => setConfig((prev) => ({ ...prev, analytics: e.target.checked }))}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* UI Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Analytics /> UI Settings
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={config.theme}
                  onChange={(e) => setConfig((prev) => ({ ...prev, theme: e.target.value }))}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto (System)</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography>Animations</Typography>
                <Switch
                  checked={config.animations}
                  onChange={(e) => setConfig((prev) => ({ ...prev, animations: e.target.checked }))}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Compact Mode</Typography>
                <Switch
                  checked={config.compactMode}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, compactMode: e.target.checked }))
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          onClick={saveConfiguration}
          disabled={loading}
          startIcon={<Save />}
          sx={{ minWidth: 120 }}
        >
          {loading ? <LinearProgress sx={{ width: '100%' }} /> : 'Save Configuration'}
        </Button>
      </Box>

      {/* Save Confirmation Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)}>
        <DialogTitle>Configuration Saved</DialogTitle>
        <DialogContent>
          <Alert severity="success">
            Your configuration has been saved successfully. Some changes may require an application
            restart to take effect.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EnhancedConfigPanel;
