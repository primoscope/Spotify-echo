/**
 * Enhanced Design System Theme Provider
 * Integrates design tokens with Material-UI theme
 */

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createContext, useContext, useState, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import tokens from './tokens.json';

// Theme context
const ThemeContext = createContext();

// Theme types
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Helper function to create Material-UI theme from design tokens
const createDesignSystemTheme = (mode) => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.colors.primary[500],
        light: tokens.colors.primary[300],
        dark: tokens.colors.primary[700],
        contrastText: isDark ? tokens.colors.neutral[50] : tokens.colors.neutral[900]
      },
      secondary: {
        main: tokens.colors.accent[500],
        light: tokens.colors.accent[300],
        dark: tokens.colors.accent[700],
        contrastText: isDark ? tokens.colors.neutral[50] : tokens.colors.neutral[900]
      },
      background: {
        default: isDark ? tokens.colors.neutral[900] : tokens.colors.neutral[50],
        paper: isDark ? tokens.colors.neutral[800] : tokens.colors.neutral[100]
      },
      text: {
        primary: isDark ? tokens.colors.neutral[100] : tokens.colors.neutral[900],
        secondary: isDark ? tokens.colors.neutral[300] : tokens.colors.neutral[600]
      },
      success: {
        main: tokens.colors.semantic.success
      },
      warning: {
        main: tokens.colors.semantic.warning
      },
      error: {
        main: tokens.colors.semantic.error
      },
      info: {
        main: tokens.colors.semantic.info
      },
      // Music-specific colors
      music: {
        primary: tokens.music.visualizer.primary,
        secondary: tokens.music.visualizer.secondary,
        accent: tokens.music.visualizer.accent,
        player: {
          background: tokens.music.player.background,
          surface: tokens.music.player.surface,
          controls: tokens.music.player.controls
        }
      }
    },
    typography: {
      fontFamily: tokens.typography.fontFamily.sans.join(', '),
      h1: {
        fontSize: tokens.typography.fontSize['5xl'],
        fontWeight: tokens.typography.fontWeight.bold,
        lineHeight: tokens.typography.lineHeight.tight
      },
      h2: {
        fontSize: tokens.typography.fontSize['4xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        lineHeight: tokens.typography.lineHeight.tight
      },
      h3: {
        fontSize: tokens.typography.fontSize['3xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        lineHeight: tokens.typography.lineHeight.normal
      },
      h4: {
        fontSize: tokens.typography.fontSize['2xl'],
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal
      },
      h5: {
        fontSize: tokens.typography.fontSize.xl,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal
      },
      h6: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal
      },
      body1: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.normal,
        lineHeight: tokens.typography.lineHeight.normal
      },
      body2: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.normal,
        lineHeight: tokens.typography.lineHeight.normal
      },
      caption: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.normal,
        lineHeight: tokens.typography.lineHeight.tight
      }
    },
    spacing: 8, // Base spacing unit (8px)
    shape: {
      borderRadius: parseInt(tokens.borderRadius.base.replace('rem', '')) * 16 // Convert rem to px
    },
    shadows: [
      'none',
      tokens.shadows.sm,
      tokens.shadows.base,
      tokens.shadows.md,
      tokens.shadows.lg,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl,
      tokens.shadows.xl
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            fontSize: '16px'
          },
          body: {
            fontFamily: tokens.typography.fontFamily.sans.join(', ')
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            textTransform: 'none',
            fontWeight: tokens.typography.fontWeight.medium
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.lg,
            boxShadow: tokens.shadows.base
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.base
          }
        }
      }
    }
  });
};

// System theme detection
const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState(
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return systemTheme;
};

// Enhanced Theme Provider
export const EnhancedThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || THEME_MODES.SYSTEM;
  });
  
  const systemTheme = useSystemTheme();
  
  // Determine actual theme
  const actualTheme = themeMode === THEME_MODES.SYSTEM ? systemTheme : themeMode;
  
  // Create Material-UI theme
  const muiTheme = createDesignSystemTheme(actualTheme);
  
  // Save theme preference
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);
  
  const contextValue = {
    themeMode,
    actualTheme,
    setThemeMode,
    tokens,
    muiTheme,
    isDark: actualTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useDesignSystemTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDesignSystemTheme must be used within EnhancedThemeProvider');
  }
  return context;
};

// Legacy theme provider for backward compatibility
export default EnhancedThemeProvider;