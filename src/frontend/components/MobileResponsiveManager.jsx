import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Alert,
  Chip,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar,
  Collapse,
  Grid
} from '@mui/material';
import {
  PhoneIphone,
  Tablet,
  Computer,
  TouchApp,
  Visibility,
  Speed,
  Settings,
  ExpandMore,
  ExpandLess,
  Menu as MenuIcon
} from '@mui/icons-material';

/**
 * Enhanced Mobile Responsive Manager
 * Provides comprehensive mobile optimization and responsive design controls
 */
function MobileResponsiveManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [mobileSettings, setMobileSettings] = useState({
    touchOptimization: true,
    gestureNavigation: true,
    compactUI: true,
    fastScrolling: true,
    autoRotation: false,
    mobileFriendlyFonts: true,
    reduceAnimations: false,
    highContrastMode: false,
    offlineMode: false,
    dataSaver: false
  });

  const [responsiveInfo, setResponsiveInfo] = useState({
    currentBreakpoint: 'unknown',
    screenSize: { width: 0, height: 0 },
    orientation: 'unknown',
    touchCapability: false,
    pixelRatio: 1,
    connectionType: 'unknown'
  });

  const [expandedSections, setExpandedSections] = useState({
    optimization: true,
    responsive: false,
    performance: false
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const updateResponsiveInfo = useCallback(() => {
    const info = {
      currentBreakpoint: getCurrentBreakpoint(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      touchCapability: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pixelRatio: window.devicePixelRatio || 1,
      connectionType: getConnectionType()
    };
    
    setResponsiveInfo(info);
    
    // Update CSS classes for responsive optimization
    document.body.className = document.body.className
      .replace(/\b(mobile|tablet|desktop)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    document.body.classList.add(info.currentBreakpoint);
  }, [getCurrentBreakpoint, getConnectionType]);

  useEffect(() => {
    updateResponsiveInfo();
    window.addEventListener('resize', updateResponsiveInfo);
    window.addEventListener('orientationchange', updateResponsiveInfo);
    
    return () => {
      window.removeEventListener('resize', updateResponsiveInfo);
      window.removeEventListener('orientationchange', updateResponsiveInfo);
    };
  }, [updateResponsiveInfo]);

  const getCurrentBreakpoint = () => {
    if (isMobile) return 'Mobile (< 600px)';
    if (isTablet) return 'Tablet (600px - 960px)';
    if (isDesktop) return 'Desktop (> 960px)';
    return 'Unknown';
  };

  const getConnectionType = () => {
    if (navigator.connection) {
      return navigator.connection.effectiveType || navigator.connection.type || 'Unknown';
    }
    return 'Unknown';
  };

  const handleSettingChange = (setting, value) => {
    setMobileSettings(prev => ({ ...prev, [setting]: value }));
    
    // Apply settings immediately
    applyMobileSetting(setting, value);
  };

  const applyMobileSetting = (setting, value) => {
    const body = document.body;
    
    switch (setting) {
      case 'compactUI':
        body.classList.toggle('compact-ui', value);
        break;
      case 'reduceAnimations':
        body.classList.toggle('reduce-animations', value);
        break;
      case 'highContrastMode':
        body.classList.toggle('high-contrast', value);
        break;
      case 'mobileFriendlyFonts':
        body.classList.toggle('mobile-fonts', value);
        break;
      case 'touchOptimization':
        body.classList.toggle('touch-optimized', value);
        break;
      default:
        break;
    }
  };

  const saveMobileSettings = async () => {
    try {
      const response = await fetch('/api/settings/mobile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: mobileSettings })
      });
      
      if (response.ok) {
        console.log('Mobile settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving mobile settings:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getDeviceIcon = () => {
    if (isMobile) return <PhoneIphone color="primary" />;
    if (isTablet) return <Tablet color="secondary" />;
    return <Computer color="success" />;
  };

  const MobileSidebar = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      sx={{ display: { xs: 'block', md: 'none' } }}
    >
      <List sx={{ width: 280 }}>
        <ListItem>
          <ListItemIcon>{getDeviceIcon()}</ListItemIcon>
          <ListItemText primary="Mobile Settings" secondary={responsiveInfo.currentBreakpoint} />
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <Box>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="static" sx={{ mb: 2 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Mobile Settings
            </Typography>
            {getDeviceIcon()}
          </Toolbar>
        </AppBar>
      )}

      <MobileSidebar />

      <Box sx={{ p: isMobile ? 2 : 3 }}>
        {/* Device Status Header */}
        <Card sx={{ mb: 3, background: theme.palette.mode === 'dark' ? 'rgba(0,100,0,0.1)' : 'rgba(0,100,0,0.05)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {getDeviceIcon()}
              <Box>
                <Typography variant="h6">
                  Current Device: {responsiveInfo.currentBreakpoint}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {responsiveInfo.screenSize.width} × {responsiveInfo.screenSize.height} • {responsiveInfo.orientation}
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={1}>
              <Grid item xs={6} sm={3}>
                <Chip 
                  label={`Touch: ${responsiveInfo.touchCapability ? 'Yes' : 'No'}`}
                  color={responsiveInfo.touchCapability ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  label={`DPR: ${responsiveInfo.pixelRatio}x`}
                  color="info"
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  label={`Network: ${responsiveInfo.connectionType}`}
                  color="secondary"
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  label={responsiveInfo.orientation}
                  color="primary"
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Touch & Mobile Optimization */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => toggleSection('optimization')}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TouchApp /> Touch & Mobile Optimization
              </Typography>
              {expandedSections.optimization ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSections.optimization}>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Touch Optimization</Typography>
                      <Switch
                        checked={mobileSettings.touchOptimization}
                        onChange={(e) => handleSettingChange('touchOptimization', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Gesture Navigation</Typography>
                      <Switch
                        checked={mobileSettings.gestureNavigation}
                        onChange={(e) => handleSettingChange('gestureNavigation', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Compact UI</Typography>
                      <Switch
                        checked={mobileSettings.compactUI}
                        onChange={(e) => handleSettingChange('compactUI', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Mobile-Friendly Fonts</Typography>
                      <Switch
                        checked={mobileSettings.mobileFriendlyFonts}
                        onChange={(e) => handleSettingChange('mobileFriendlyFonts', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Responsive Design */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => toggleSection('responsive')}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility /> Responsive Design
              </Typography>
              {expandedSections.responsive ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSections.responsive}>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Auto Rotation</Typography>
                      <Switch
                        checked={mobileSettings.autoRotation}
                        onChange={(e) => handleSettingChange('autoRotation', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>High Contrast Mode</Typography>
                      <Switch
                        checked={mobileSettings.highContrastMode}
                        onChange={(e) => handleSettingChange('highContrastMode', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                </Grid>
                
                {isMobile && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Mobile device detected! Touch optimizations are automatically enabled.
                  </Alert>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Performance Settings */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => toggleSection('performance')}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed /> Performance Settings
              </Typography>
              {expandedSections.performance ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSections.performance}>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Reduce Animations</Typography>
                      <Switch
                        checked={mobileSettings.reduceAnimations}
                        onChange={(e) => handleSettingChange('reduceAnimations', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Fast Scrolling</Typography>
                      <Switch
                        checked={mobileSettings.fastScrolling}
                        onChange={(e) => handleSettingChange('fastScrolling', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Data Saver Mode</Typography>
                      <Switch
                        checked={mobileSettings.dataSaver}
                        onChange={(e) => handleSettingChange('dataSaver', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <Typography>Offline Mode</Typography>
                      <Switch
                        checked={mobileSettings.offlineMode}
                        onChange={(e) => handleSettingChange('offlineMode', e.target.checked)}
                      />
                    </Box>
                  </Grid>
                </Grid>
                
                {(mobileSettings.dataSaver || mobileSettings.offlineMode) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Performance mode is active. Some features may be limited to save bandwidth and battery.
                  </Alert>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={saveMobileSettings}
            startIcon={<Settings />}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? 'auto' : 200 }}
          >
            Save Mobile Settings
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default MobileResponsiveManager;