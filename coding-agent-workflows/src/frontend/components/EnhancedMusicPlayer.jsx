import React, { useState, useMemo, useCallback, Suspense, useEffect } from 'react';
import { 
    Box, 
    Slider, 
    IconButton, 
    Typography, 
    Card, 
    Chip,
    LinearProgress,
    Tooltip,
    Fab,
    Badge
} from '@mui/material';
import { 
    PlayArrow, 
    Pause, 
    SkipNext, 
    SkipPrevious, 
    VolumeUp, 
    VolumeOff,
    Shuffle,
    Repeat,
    Favorite,
    FavoriteBorder,
    QueueMusic,
    Equalizer,
    Lyrics
} from '@mui/icons-material';

/**
 * Enhanced Music Player Component
 * Features: React 19 patterns, advanced controls, mood detection, lyrics display
 */
const EnhancedMusicPlayer = ({ 
    track, 
    onPlay, 
    onPause, 
    onNext, 
    onPrevious,
    onShuffle,
    onRepeat,
    onFavorite,
    onQueue,
    isPlaying = false,
    volume = 80,
    onVolumeChange,
    showAdvanced = false
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isShuffled, setIsShuffled] = useState(false);
    const [repeatMode, setRepeatMode] = useState('none'); // none, one, all
    const [isFavorited, setIsFavorited] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [showEqualizer, setShowEqualizer] = useState(false);
    const [audioContext, setAudioContext] = useState(null);
    const [audioAnalyser, setAudioAnalyser] = useState(null);
    const [visualizationData, setVisualizationData] = useState([]);

    // Memoized track info for performance
    const trackInfo = useMemo(() => ({
        title: track?.title || 'No track selected',
        artist: track?.artist || 'Unknown artist',
        album: track?.album || 'Unknown album',
        duration: track?.duration || 0,
        albumArt: track?.albumArt || '/default-album.jpg',
        genre: track?.genre || 'Unknown',
        mood: track?.mood || 'neutral',
        bpm: track?.bpm || 120,
        key: track?.key || 'C',
        energy: track?.energy || 0.5,
        valence: track?.valence || 0.5
    }), [track]);

    // Memoized handlers for performance
    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            onPause?.();
        } else {
            onPlay?.();
        }
    }, [isPlaying, onPlay, onPause]);

    const handleTimeChange = useCallback((event, newValue) => {
        setCurrentTime(newValue);
        // Here you would typically seek the audio
    }, []);

    const handleVolumeChange = useCallback((event, newValue) => {
        onVolumeChange?.(newValue);
    }, [onVolumeChange]);

    const handleShuffle = useCallback(() => {
        setIsShuffled(!isShuffled);
        onShuffle?.(!isShuffled);
    }, [isShuffled, onShuffle]);

    const handleRepeat = useCallback(() => {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(repeatMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setRepeatMode(nextMode);
        onRepeat?.(nextMode);
    }, [repeatMode, onRepeat]);

    const handleFavorite = useCallback(() => {
        setIsFavorited(!isFavorited);
        onFavorite?.(!isFavorited);
    }, [isFavorited, onFavorite]);

    // Audio visualization setup
    useEffect(() => {
        if (showEqualizer && !audioContext) {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            setAudioContext(context);
            setAudioAnalyser(analyser);
        }
    }, [showEqualizer, audioContext]);

    // Update visualization data
    useEffect(() => {
        if (audioAnalyser && isPlaying) {
            const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
            const updateVisualization = () => {
                audioAnalyser.getByteFrequencyData(dataArray);
                setVisualizationData(Array.from(dataArray));
                requestAnimationFrame(updateVisualization);
            };
            updateVisualization();
        }
    }, [audioAnalyser, isPlaying]);

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get mood color
    const getMoodColor = (mood) => {
        const moodColors = {
            happy: '#FFD700',
            sad: '#4169E1',
            energetic: '#FF4500',
            calm: '#98FB98',
            neutral: '#808080'
        };
        return moodColors[mood] || moodColors.neutral;
    };

    return (
        <Card sx={{ 
            p: 3, 
            maxWidth: 500, 
            mx: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
        }}>
            {/* Album Art and Track Info */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                        src={trackInfo.albumArt} 
                        alt="Album Art"
                        style={{ 
                            width: 250, 
                            height: 250, 
                            borderRadius: 16,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}
                    />
                    {isPlaying && (
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            animation: 'pulse 2s infinite'
                        }}>
                            <div style={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)'
                            }} />
                        </Box>
                    )}
                </Box>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                    {trackInfo.title}
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 1, opacity: 0.9 }}>
                    {trackInfo.artist}
                </Typography>
                
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {trackInfo.album}
                </Typography>

                {/* Track Metadata Chips */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip 
                        label={trackInfo.genre} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                    <Chip 
                        label={`${trackInfo.bpm} BPM`} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                    <Chip 
                        label={trackInfo.key} 
                        size="small" 
                        sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                    <Chip 
                        label={trackInfo.mood} 
                        size="small" 
                        sx={{ 
                            background: getMoodColor(trackInfo.mood),
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    />
                </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
                <Slider
                    value={currentTime}
                    onChange={handleTimeChange}
                    max={duration}
                    min={0}
                    valueLabelDisplay="auto"
                    valueLabelFormat={formatTime}
                    sx={{
                        color: 'white',
                        '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                            background: 'white'
                        },
                        '& .MuiSlider-track': {
                            background: 'white'
                        },
                        '& .MuiSlider-rail': {
                            background: 'rgba(255,255,255,0.3)'
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </Box>
            </Box>

            {/* Main Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton 
                    onClick={handleShuffle}
                    sx={{ 
                        color: isShuffled ? '#FFD700' : 'white',
                        '&:hover': { background: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <Shuffle />
                </IconButton>
                
                <IconButton onClick={onPrevious} sx={{ color: 'white', '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                    <SkipPrevious />
                </IconButton>
                
                <IconButton 
                    onClick={handlePlayPause}
                    sx={{ 
                        bgcolor: 'white', 
                        color: '#667eea',
                        width: 64,
                        height: 64,
                        '&:hover': { 
                            bgcolor: 'rgba(255,255,255,0.9)',
                            transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s'
                    }}
                >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <IconButton onClick={onNext} sx={{ color: 'white', '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                    <SkipNext />
                </IconButton>
                
                <IconButton 
                    onClick={handleRepeat}
                    sx={{ 
                        color: repeatMode !== 'none' ? '#FFD700' : 'white',
                        '&:hover': { background: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <Repeat />
                </IconButton>
            </Box>

            {/* Secondary Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                        onClick={handleFavorite}
                        sx={{ color: isFavorited ? '#FF6B6B' : 'white' }}
                    >
                        {isFavorited ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    
                    <IconButton 
                        onClick={() => onQueue?.()}
                        sx={{ color: 'white' }}
                    >
                        <QueueMusic />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                        onClick={() => setShowLyrics(!showLyrics)}
                        sx={{ color: showLyrics ? '#FFD700' : 'white' }}
                    >
                        <Lyrics />
                    </IconButton>
                    
                    <IconButton 
                        onClick={() => setShowEqualizer(!showEqualizer)}
                        sx={{ color: showEqualizer ? '#FFD700' : 'white' }}
                    >
                        <Equalizer />
                    </IconButton>
                </Box>
            </Box>

            {/* Volume Control */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                    onClick={() => onVolumeChange?.(volume === 0 ? 80 : 0)}
                    sx={{ color: 'white' }}
                >
                    {volume === 0 ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
                <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    max={100}
                    min={0}
                    valueLabelDisplay="auto"
                    sx={{
                        color: 'white',
                        '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                            background: 'white'
                        },
                        '& .MuiSlider-track': {
                            background: 'white'
                        },
                        '& .MuiSlider-rail': {
                            background: 'rgba(255,255,255,0.3)'
                        }
                    }}
                />
            </Box>

            {/* Audio Visualization */}
            {showEqualizer && visualizationData.length > 0 && (
                <Box sx={{ mt: 3, p: 2, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                        Audio Spectrum
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 60 }}>
                        {visualizationData.slice(0, 32).map((value, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 8,
                                    height: `${(value / 255) * 60}px`,
                                    background: `hsl(${index * 8}, 70%, 60%)`,
                                    borderRadius: 1,
                                    transition: 'height 0.1s ease'
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Lyrics Display */}
            {showLyrics && (
                <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: 2,
                    maxHeight: 200,
                    overflowY: 'auto'
                }}>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', fontWeight: 'bold' }}>
                        Lyrics
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.9 }}>
                        {trackInfo.lyrics || 'Lyrics not available for this track'}
                    </Typography>
                </Box>
            )}

            {/* Advanced Features */}
            {showAdvanced && (
                <Box sx={{ mt: 3, p: 2, background: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', fontWeight: 'bold' }}>
                        Advanced Features
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Chip label="Crossfade" size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                        <Chip label="Gapless" size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                        <Chip label="High Quality" size="small" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                    </Box>
                </Box>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </Card>
    );
};

export default EnhancedMusicPlayer;