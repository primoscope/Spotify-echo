import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Container,
    CssBaseline,
    ThemeProvider,
    createTheme,
    useMediaQuery,
    Fab,
    Badge,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home,
    Search,
    LibraryMusic,
    Favorite,
    Person,
    Settings,
    QueueMusic,
    TrendingUp,
    Mood,
    MusicNote,
    PlayArrow,
    Pause,
    SkipNext,
    SkipPrevious,
    VolumeUp
} from '@mui/icons-material';

// Lazy load components for better performance
const EnhancedMusicPlayer = React.lazy(() => import('./components/EnhancedMusicPlayer'));
const MusicDiscovery = React.lazy(() => import('./components/MusicDiscovery'));

/**
 * Main EchoTune AI Application
 * Features: Music discovery, enhanced player, AI recommendations, mood-based filtering
 */
const App = () => {
    // State management
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(80);
    const [queue, setQueue] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentView, setCurrentView] = useState('discovery');
    const [userProfile, setUserProfile] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Responsive design
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(max-width:960px)');

    // Custom theme
    const theme = createTheme({
        palette: {
            mode: 'dark',
            primary: {
                main: '#667eea',
                light: '#8b9df0',
                dark: '#4a5fd8'
            },
            secondary: {
                main: '#764ba2',
                light: '#9a6bb8',
                dark: '#5a3a7a'
            },
            background: {
                default: '#0a0a0a',
                paper: '#1a1a1a'
            },
            text: {
                primary: '#ffffff',
                secondary: '#b0b0b0'
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: {
                fontWeight: 700,
                fontSize: '2.5rem'
            },
            h2: {
                fontWeight: 600,
                fontSize: '2rem'
            },
            h3: {
                fontWeight: 600,
                fontSize: '1.5rem'
            }
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }
                }
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 100%)',
                        borderRight: '1px solid #333'
                    }
                }
            }
        }
    });

    // Sample user profile
    useEffect(() => {
        setUserProfile({
            id: 'user123',
            displayName: 'Music Explorer',
            email: 'user@echotune.ai',
            avatar: '/avatar.jpg',
            favoriteGenres: ['Electronic', 'Rock', 'Jazz'],
            preferredMoods: ['energetic', 'calm', 'mysterious'],
            totalListeningTime: 1250,
            averageSessionLength: 45
        });
    }, []);

    // Sample queue
    useEffect(() => {
        setQueue([
            {
                id: 1,
                title: 'Midnight Dreams',
                artist: 'Luna Echo',
                album: 'Night Vibes',
                albumArt: '/album1.jpg',
                duration: 240
            },
            {
                id: 2,
                title: 'Electric Storm',
                artist: 'Thunder Pulse',
                album: 'Energy Rush',
                albumArt: '/album2.jpg',
                duration: 195
            }
        ]);
    }, []);

    // Event handlers
    const handleTrackSelect = useCallback((track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        // Add to queue if not already there
        if (!queue.find(t => t.id === track.id)) {
            setQueue(prev => [...prev, track]);
        }
    }, [queue]);

    const handlePlayPause = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleNext = useCallback(() => {
        if (queue.length > 0) {
            const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
            const nextIndex = (currentIndex + 1) % queue.length;
            setCurrentTrack(queue[nextIndex]);
        }
    }, [queue, currentTrack]);

    const handlePrevious = useCallback(() => {
        if (queue.length > 0) {
            const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
            setCurrentTrack(queue[prevIndex]);
        }
    }, [queue, currentTrack]);

    const handleVolumeChange = useCallback((newVolume) => {
        setVolume(newVolume);
    }, []);

    const handleAddToPlaylist = useCallback((track) => {
        // Add to queue
        setQueue(prev => [...prev, track]);
        // Show notification
        setNotifications(prev => [...prev, {
            id: Date.now(),
            message: `Added "${track.title}" to queue`,
            type: 'success'
        }]);
    }, []);

    const handleFavorite = useCallback((track) => {
        setFavorites(prev => {
            const isAlreadyFavorite = prev.find(t => t.id === track.id);
            if (isAlreadyFavorite) {
                return prev.filter(t => t.id !== track.id);
            } else {
                return [...prev, track];
            }
        });
    }, []);

    const handleViewChange = useCallback((view) => {
        setCurrentView(view);
        if (isMobile) {
            setDrawerOpen(false);
        }
    }, [isMobile]);

    const toggleDrawer = useCallback(() => {
        setDrawerOpen(!drawerOpen);
    }, [drawerOpen]);

    // Navigation items
    const navigationItems = [
        { id: 'discovery', label: 'Discover', icon: <Search />, description: 'Find new music' },
        { id: 'library', label: 'Library', icon: <LibraryMusic />, description: 'Your music collection' },
        { id: 'favorites', label: 'Favorites', icon: <Favorite />, description: 'Liked tracks' },
        { id: 'trending', label: 'Trending', icon: <TrendingUp />, description: 'Popular music' },
        { id: 'mood', label: 'Mood', icon: <Mood />, description: 'Mood-based music' },
        { id: 'queue', label: 'Queue', icon: <QueueMusic />, description: 'Up next' },
        { id: 'profile', label: 'Profile', icon: <Person />, description: 'User settings' }
    ];

    // Render current view
    const renderCurrentView = () => {
        switch (currentView) {
            case 'discovery':
                return (
                    <MusicDiscovery
                        onTrackSelect={handleTrackSelect}
                        onAddToPlaylist={handleAddToPlaylist}
                        onFavorite={handleFavorite}
                    />
                );
            case 'library':
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            🎵 Your Music Library
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Your personal music collection will appear here
                        </Typography>
                    </Box>
                );
            case 'favorites':
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            ❤️ Your Favorites
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {favorites.length} favorite tracks
                        </Typography>
                    </Box>
                );
            case 'trending':
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            📈 Trending Now
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            See what's popular right now
                        </Typography>
                    </Box>
                );
            case 'mood':
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            😊 Mood Explorer
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Discover music based on your mood
                        </Typography>
                    </Box>
                );
            case 'queue':
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            📋 Your Queue
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {queue.length} tracks in queue
                        </Typography>
                    </Box>
                );
            case 'profile':
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            👤 User Profile
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your account and preferences
                        </Typography>
                    </Box>
                );
            default:
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            🎵 Welcome to EchoTune AI
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Your intelligent music companion
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                {/* App Bar */}
                <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={toggleDrawer}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            🎵 EchoTune AI
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton color="inherit">
                                <Badge badgeContent={notifications.length} color="secondary">
                                    <Settings />
                                </Badge>
                            </IconButton>
                            
                            {userProfile && (
                                <IconButton color="inherit">
                                    <Person />
                                </IconButton>
                            )}
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Navigation Drawer */}
                <Drawer
                    variant={isMobile ? "temporary" : "permanent"}
                    open={isMobile ? drawerOpen : true}
                    onClose={toggleDrawer}
                    sx={{
                        width: 240,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 240,
                            boxSizing: 'border-box',
                            top: 64
                        }
                    }}
                >
                    <Toolbar />
                    <Box sx={{ overflow: 'auto', mt: 2 }}>
                        <List>
                            {navigationItems.map((item) => (
                                <ListItem
                                    button
                                    key={item.id}
                                    selected={currentView === item.id}
                                    onClick={() => handleViewChange(item.id)}
                                    sx={{
                                        mx: 1,
                                        mb: 1,
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            background: 'rgba(102, 126, 234, 0.2)',
                                            '&:hover': {
                                                background: 'rgba(102, 126, 234, 0.3)'
                                            }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ color: 'inherit' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.label} 
                                        secondary={item.description}
                                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Drawer>

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 0,
                        width: { sm: `calc(100% - 240px)` },
                        ml: { sm: '240px' }
                    }}
                >
                    <Toolbar />
                    
                    {/* Content Area */}
                    <Container maxWidth="xl" sx={{ py: 2 }}>
                        <Suspense fallback={
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        }>
                            {renderCurrentView()}
                        </Suspense>
                    </Container>
                </Box>

                {/* Music Player (Fixed Bottom) */}
                {currentTrack && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: { sm: 240 },
                            right: 0,
                            zIndex: 1000,
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                            borderTop: '1px solid #333',
                            p: 2
                        }}
                    >
                        <EnhancedMusicPlayer
                            track={currentTrack}
                            onPlay={handlePlayPause}
                            onPause={handlePlayPause}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            onVolumeChange={handleVolumeChange}
                            isPlaying={isPlaying}
                            volume={volume}
                            showAdvanced={!isMobile}
                        />
                    </Box>
                )}

                {/* Floating Action Button for Mobile */}
                {isMobile && currentTrack && (
                    <Fab
                        color="primary"
                        aria-label="play"
                        onClick={handlePlayPause}
                        sx={{
                            position: 'fixed',
                            bottom: 80,
                            right: 16,
                            zIndex: 1000
                        }}
                    >
                        {isPlaying ? <Pause /> : <PlayArrow />}
                    </Fab>
                )}

                {/* Notifications */}
                <Snackbar
                    open={notifications.length > 0}
                    autoHideDuration={3000}
                    onClose={() => setNotifications([])}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert 
                        severity="success" 
                        sx={{ width: '100%' }}
                        onClose={() => setNotifications([])}
                    >
                        {notifications[0]?.message}
                    </Alert>
                </Snackbar>

                {/* Error Display */}
                {error && (
                    <Snackbar
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={() => setError(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert 
                            severity="error" 
                            sx={{ width: '100%' }}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    </Snackbar>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default App;