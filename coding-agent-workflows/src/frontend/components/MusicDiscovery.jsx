import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Box,
    TextField,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Chip,
    Grid,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    LinearProgress,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import {
    Search,
    FilterList,
    Favorite,
    FavoriteBorder,
    PlayArrow,
    Add,
    QueueMusic,
    TrendingUp,
    MusicNote,
    Mood,
    Speed
} from '@mui/icons-material';

/**
 * Music Discovery Component
 * Features: Advanced search, mood-based filtering, genre exploration, AI recommendations
 */
const MusicDiscovery = ({ onTrackSelect, onAddToPlaylist, onFavorite }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [selectedMood, setSelectedMood] = useState('all');
    const [energyLevel, setEnergyLevel] = useState([0, 1]);
    const [tempoRange, setTempoRange] = useState([60, 200]);
    const [activeTab, setActiveTab] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [discoveredTracks, setDiscoveredTracks] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [trendingTracks, setTrendingTracks] = useState([]);

    // Sample data for demonstration
    const sampleTracks = [
        {
            id: 1,
            title: 'Midnight Dreams',
            artist: 'Luna Echo',
            album: 'Night Vibes',
            albumArt: '/album1.jpg',
            genre: 'Electronic',
            mood: 'calm',
            energy: 0.3,
            tempo: 85,
            duration: 240,
            popularity: 95
        },
        {
            id: 2,
            title: 'Electric Storm',
            artist: 'Thunder Pulse',
            album: 'Energy Rush',
            albumArt: '/album2.jpg',
            genre: 'Rock',
            mood: 'energetic',
            energy: 0.9,
            tempo: 140,
            duration: 195,
            popularity: 88
        },
        {
            id: 3,
            title: 'Sunset Serenade',
            artist: 'Acoustic Harmony',
            album: 'Peaceful Moments',
            albumArt: '/album3.jpg',
            genre: 'Folk',
            mood: 'peaceful',
            energy: 0.4,
            tempo: 72,
            duration: 280,
            popularity: 92
        }
    ];

    // Available genres and moods
    const genres = ['all', 'Electronic', 'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Folk', 'Country', 'R&B'];
    const moods = ['all', 'happy', 'sad', 'energetic', 'calm', 'romantic', 'mysterious', 'peaceful', 'melancholic'];

    // Memoized filtered tracks
    const filteredTracks = useMemo(() => {
        return sampleTracks.filter(track => {
            const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                track.artist.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
            const matchesMood = selectedMood === 'all' || track.mood === selectedMood;
            const matchesEnergy = track.energy >= energyLevel[0] && track.energy <= energyLevel[1];
            const matchesTempo = track.tempo >= tempoRange[0] && track.tempo <= tempoRange[1];
            
            return matchesSearch && matchesGenre && matchesMood && matchesEnergy && matchesTempo;
        });
    }, [searchQuery, selectedGenre, selectedMood, energyLevel, tempoRange]);

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setDiscoveredTracks(filteredTracks);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filteredTracks]);

    // Handle track selection
    const handleTrackSelect = useCallback((track) => {
        onTrackSelect?.(track);
    }, [onTrackSelect]);

    // Handle add to playlist
    const handleAddToPlaylist = useCallback((track) => {
        onAddToPlaylist?.(track);
    }, [onAddToPlaylist]);

    // Handle favorite
    const handleFavorite = useCallback((track) => {
        onFavorite?.(track);
    }, [onFavorite]);

    // Load recommendations on mount
    useEffect(() => {
        setRecommendations(sampleTracks.slice(0, 6));
        setTrendingTracks(sampleTracks.slice(0, 4));
    }, []);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Get mood color
    const getMoodColor = (mood) => {
        const moodColors = {
            happy: '#FFD700',
            sad: '#4169E1',
            energetic: '#FF4500',
            calm: '#98FB98',
            peaceful: '#87CEEB',
            romantic: '#FF69B4',
            mysterious: '#9932CC',
            melancholic: '#4682B4'
        };
        return moodColors[mood] || '#808080';
    };

    // Get energy color
    const getEnergyColor = (energy) => {
        if (energy < 0.3) return '#4CAF50';
        if (energy < 0.7) return '#FF9800';
        return '#F44336';
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                🎵 Discover New Music
            </Typography>

            {/* Search and Filters */}
            <Card sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    🔍 Search & Filters
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Search tracks, artists, or albums"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={handleSearch}>
                                        <Search />
                                    </IconButton>
                                )
                            }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Genre</InputLabel>
                            <Select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                label="Genre"
                            >
                                {genres.map(genre => (
                                    <MenuItem key={genre} value={genre}>
                                        {genre === 'all' ? 'All Genres' : genre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Mood</InputLabel>
                            <Select
                                value={selectedMood}
                                onChange={(e) => setSelectedMood(e.target.value)}
                                label="Mood"
                            >
                                {moods.map(mood => (
                                    <MenuItem key={mood} value={mood}>
                                        {mood === 'all' ? 'All Moods' : mood}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                            Energy Level: {energyLevel[0].toFixed(1)} - {energyLevel[1].toFixed(1)}
                        </Typography>
                        <Slider
                            value={energyLevel}
                            onChange={(e, newValue) => setEnergyLevel(newValue)}
                            min={0}
                            max={1}
                            step={0.1}
                            valueLabelDisplay="auto"
                            marks={[
                                { value: 0, label: 'Low' },
                                { value: 0.5, label: 'Medium' },
                                { value: 1, label: 'High' }
                            ]}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                            Tempo Range: {tempoRange[0]} - {tempoRange[1]} BPM
                        </Typography>
                        <Slider
                            value={tempoRange}
                            onChange={(e, newValue) => setTempoRange(newValue)}
                            min={60}
                            max={200}
                            step={5}
                            valueLabelDisplay="auto"
                            marks={[
                                { value: 60, label: 'Slow' },
                                { value: 120, label: 'Medium' },
                                { value: 200, label: 'Fast' }
                            ]}
                        />
                    </Grid>
                </Grid>
            </Card>

            {/* Tabs for different discovery methods */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Search Results" icon={<Search />} />
                    <Tab label="AI Recommendations" icon={<TrendingUp />} />
                    <Tab label="Trending Now" icon={<MusicNote />} />
                    <Tab label="Mood Explorer" icon={<Mood />} />
                </Tabs>
            </Box>

            {/* Loading indicator */}
            {isLoading && (
                <Box sx={{ mb: 3 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                        Discovering amazing music...
                    </Typography>
                </Box>
            )}

            {/* Tab Content */}
            {activeTab === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Search Results ({filteredTracks.length} tracks)
                    </Typography>
                    <Grid container spacing={3}>
                        {filteredTracks.map(track => (
                            <Grid item xs={12} sm={6} md={4} key={track.id}>
                                <TrackCard
                                    track={track}
                                    onSelect={handleTrackSelect}
                                    onAddToPlaylist={handleAddToPlaylist}
                                    onFavorite={handleFavorite}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {activeTab === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        AI-Powered Recommendations
                    </Typography>
                    <Grid container spacing={3}>
                        {recommendations.map(track => (
                            <Grid item xs={12} sm={6} md={4} key={track.id}>
                                <TrackCard
                                    track={track}
                                    onSelect={handleTrackSelect}
                                    onAddToPlaylist={handleAddToPlaylist}
                                    onFavorite={handleFavorite}
                                    isRecommendation
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {activeTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Trending Now
                    </Typography>
                    <Grid container spacing={3}>
                        {trendingTracks.map(track => (
                            <Grid item xs={12} sm={6} md={4} key={track.id}>
                                <TrackCard
                                    track={track}
                                    onSelect={handleTrackSelect}
                                    onAddToPlaylist={handleAddToPlaylist}
                                    onFavorite={handleFavorite}
                                    isTrending
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {activeTab === 3 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Explore by Mood
                    </Typography>
                    <Grid container spacing={3}>
                        {moods.filter(mood => mood !== 'all').map(mood => (
                            <Grid item xs={12} sm={6} md={4} key={mood}>
                                <MoodCard
                                    mood={mood}
                                    tracks={sampleTracks.filter(t => t.mood === mood)}
                                    onTrackSelect={handleTrackSelect}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

// Track Card Component
const TrackCard = ({ track, onSelect, onAddToPlaylist, onFavorite, isRecommendation, isTrending }) => {
    const [isFavorited, setIsFavorited] = useState(false);

    const handleFavorite = () => {
        setIsFavorited(!isFavorited);
        onFavorite?.(track);
    };

    const getMoodColor = (mood) => {
        const moodColors = {
            happy: '#FFD700',
            sad: '#4169E1',
            energetic: '#FF4500',
            calm: '#98FB98',
            peaceful: '#87CEEB',
            romantic: '#FF69B4',
            mysterious: '#9932CC',
            melancholic: '#4682B4'
        };
        return moodColors[mood] || '#808080';
    };

    const getEnergyColor = (energy) => {
        if (energy < 0.3) return '#4CAF50';
        if (energy < 0.7) return '#FF9800';
        return '#F44336';
    };

    return (
        <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
            }
        }}>
            {isRecommendation && (
                <Chip
                    label="AI Recommended"
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                />
            )}
            
            {isTrending && (
                <Chip
                    label="Trending"
                    color="secondary"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                />
            )}

            <CardMedia
                component="img"
                height="200"
                image={track.albumArt}
                alt={track.title}
                sx={{ objectFit: 'cover' }}
            />

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom noWrap>
                    {track.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                    {track.artist}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                    {track.album}
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                    <Chip 
                        label={track.genre} 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                        label={track.mood} 
                        size="small" 
                        sx={{ 
                            mr: 1, 
                            mb: 1,
                            background: getMoodColor(track.mood),
                            color: 'white'
                        }}
                    />
                    <Chip 
                        label={`${track.tempo} BPM`} 
                        size="small" 
                        sx={{ mb: 1 }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                        Energy:
                    </Typography>
                    <Box sx={{ 
                        width: 60, 
                        height: 8, 
                        background: getEnergyColor(track.energy),
                        borderRadius: 4
                    }} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                        {Math.round(track.energy * 100)}%
                    </Typography>
                </Box>

                <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => onSelect(track)}
                        fullWidth
                        sx={{ flex: 1 }}
                    >
                        Play
                    </Button>
                    
                    <IconButton onClick={handleFavorite} color="primary">
                        {isFavorited ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    
                    <IconButton onClick={() => onAddToPlaylist(track)} color="secondary">
                        <Add />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

// Mood Card Component
const MoodCard = ({ mood, tracks, onTrackSelect }) => {
    const getMoodColor = (mood) => {
        const moodColors = {
            happy: '#FFD700',
            sad: '#4169E1',
            energetic: '#FF4500',
            calm: '#98FB98',
            peaceful: '#87CEEB',
            romantic: '#FF69B4',
            mysterious: '#9932CC',
            melancholic: '#4682B4'
        };
        return moodColors[mood] || '#808080';
    };

    const getMoodIcon = (mood) => {
        const moodIcons = {
            happy: '😊',
            sad: '😢',
            energetic: '⚡',
            calm: '😌',
            peaceful: '🕊️',
            romantic: '💕',
            mysterious: '🔮',
            melancholic: '🌧️'
        };
        return moodIcons[mood] || '🎵';
    };

    return (
        <Card sx={{ 
            background: `linear-gradient(135deg, ${getMoodColor(mood)}20 0%, ${getMoodColor(mood)}40 100%)`,
            border: `2px solid ${getMoodColor(mood)}`,
            textAlign: 'center',
            p: 3,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': {
                transform: 'scale(1.05)'
            }
        }}>
            <Typography variant="h1" sx={{ mb: 2 }}>
                {getMoodIcon(mood)}
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {mood}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {tracks.length} tracks available
            </Typography>
            
            <Button
                variant="contained"
                onClick={() => onTrackSelect(tracks[0])}
                sx={{ 
                    mt: 2,
                    background: getMoodColor(mood),
                    '&:hover': { background: getMoodColor(mood) }
                }}
            >
                Explore {mood} music
            </Button>
        </Card>
    );
};

export default MusicDiscovery;