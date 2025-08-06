import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { deepPurple, green, orange, red } from '@mui/material/colors';

const ThemeContext = createContext();

/**
 * Custom Theme Provider with Dark/Light Mode Support
 * Provides EchoTune AI branded themes and mode switching
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const createEchoTuneTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#1db954' : '#1ed760', // Spotify-inspired green
        light: isDark ? '#4ac776' : '#4df884',
        dark: isDark ? '#148a3d' : '#16a34a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? deepPurple[300] : deepPurple[600],
        light: isDark ? deepPurple[200] : deepPurple[400],
        dark: isDark ? deepPurple[500] : deepPurple[800],
      },
      success: {
        main: green[500],
        light: green[300],
        dark: green[700],
      },
      warning: {
        main: orange[500],
        light: orange[300],
        dark: orange[700],
      },
      error: {
        main: red[500],
        light: red[300],
        dark: red[700],
      },
      background: {
        default: isDark ? '#121212' : '#fafafa',
        paper: isDark ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#333333',
        secondary: isDark ? '#b3b3b3' : '#666666',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.1rem',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark 
              ? '0 4px 12px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 12,
            '&:hover': {
              boxShadow: isDark 
                ? '0 6px 16px rgba(0,0,0,0.4)' 
                : '0 4px 16px rgba(0,0,0,0.15)',
            },
            transition: 'box-shadow 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: isDark 
              ? '0 2px 4px rgba(0,0,0,0.3)' 
              : '0 1px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            color: isDark ? '#ffffff' : '#333333',
            boxShadow: isDark 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 1px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 8px',
            '&:hover': {
              backgroundColor: isDark 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(0,0,0,0.05)',
            },
            '&.Mui-selected': {
              backgroundColor: isDark 
                ? 'rgba(29,185,84,0.2)' 
                : 'rgba(29,185,84,0.1)',
              '&:hover': {
                backgroundColor: isDark 
                  ? 'rgba(29,185,84,0.3)' 
                  : 'rgba(29,185,84,0.15)',
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover': {
              backgroundColor: isDark 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.05)',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
    // Custom EchoTune specific values
    custom: {
      musicPlayer: {
        background: isDark 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)' 
          : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        controls: isDark ? '#1db954' : '#1ed760',
      },
      chat: {
        userBubble: isDark ? '#1db954' : '#1ed760',
        aiBubble: isDark ? '#2a2a2a' : '#f0f0f0',
      },
      recommendation: {
        confidence: {
          high: green[500],
          medium: orange[500],
          low: red[500],
        },
      },
    },
  });
};

const ThemeProvider = ({ children }) => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(() => {
    // Try to get saved theme from localStorage
    const saved = localStorage.getItem('echotune-theme');
    return saved || (prefersDark ? 'dark' : 'light');
  });

  const [customizations, setCustomizations] = useState(() => {
    const saved = localStorage.getItem('echotune-theme-customizations');
    return saved ? JSON.parse(saved) : {
      primaryColor: '#1db954',
      accentColor: '#9c27b0',
      borderRadius: 12,
      fontScale: 1,
    };
  });

  const theme = createEchoTuneTheme(mode);

  useEffect(() => {
    localStorage.setItem('echotune-theme', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('echotune-theme-customizations', JSON.stringify(customizations));
  }, [customizations]);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (newMode) => {
    setMode(newMode);
  };

  const updateCustomization = (key, value) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetCustomizations = () => {
    setCustomizations({
      primaryColor: '#1db954',
      accentColor: '#9c27b0',
      borderRadius: 12,
      fontScale: 1,
    });
  };

  const contextValue = {
    mode,
    theme,
    customizations,
    toggleMode,
    setThemeMode,
    updateCustomization,
    resetCustomizations,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Theme Toggle Component
 * Provides a UI control for switching between light/dark modes
 */
import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Brightness4, Brightness7, Palette, Settings, AutoMode } from '@mui/icons-material';

export const ThemeToggle = ({ showCustomization = false }) => {
  const { mode, toggleMode, setThemeMode, isDark } = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  if (!showCustomization) {
    return (
      <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        <IconButton onClick={toggleMode} color="inherit">
          {isDark ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title="Theme settings">
        <IconButton 
          onClick={(e) => setMenuAnchor(e.currentTarget)} 
          color="inherit"
        >
          <Palette />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { setThemeMode('light'); handleMenuClose(); }}>
          <ListItemIcon>
            <Brightness7 />
          </ListItemIcon>
          <ListItemText>Light Mode</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { setThemeMode('dark'); handleMenuClose(); }}>
          <ListItemIcon>
            <Brightness4 />
          </ListItemIcon>
          <ListItemText>Dark Mode</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { setThemeMode('auto'); handleMenuClose(); }}>
          <ListItemIcon>
            <AutoMode />
          </ListItemIcon>
          <ListItemText>Auto (System)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeProvider;