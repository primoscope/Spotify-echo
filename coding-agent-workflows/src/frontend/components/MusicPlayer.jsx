import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Box, Slider, IconButton, Typography, Card } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp } from '@mui/icons-material';

// Music player component with React 19 features
const MusicPlayer = ({ track, onPlay, onPause, onNext, onPrevious }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(80);
    const [currentTime, setCurrentTime] = useState(0);
    
    // Memoized track info
    const trackInfo = useMemo(() => ({
        title: track?.title || 'No track selected',
        artist: track?.artist || 'Unknown artist',
        duration: track?.duration || 0,
        albumArt: track?.albumArt || '/default-album.jpg'
    }), [track]);
    
    // Memoized handlers
    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            onPause?.();
            setIsPlaying(false);
        } else {
            onPlay?.();
            setIsPlaying(true);
        }
    }, [isPlaying, onPlay, onPause]);
    
    const handleVolumeChange = useCallback((event, newValue) => {
        setVolume(newValue);
    }, []);
    
    const handleTimeChange = useCallback((event, newValue) => {
        setCurrentTime(newValue);
    }, []);
    
    return (
        <Card sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img 
                    src={trackInfo.albumArt} 
                    alt="Album Art"
                    style={{ width: 200, height: 200, borderRadius: 8 }}
                />
            </Box>
            
            <Typography variant="h6" gutterBottom>
                {trackInfo.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {trackInfo.artist}
            </Typography>
            
            {/* Progress bar */}
            <Box sx={{ my: 2 }}>
                <Slider
                    value={currentTime}
                    onChange={handleTimeChange}
                    max={trackInfo.duration}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`}
                />
            </Box>
            
            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={onPrevious}>
                    <SkipPrevious />
                </IconButton>
                
                <IconButton 
                    onClick={handlePlayPause}
                    sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <IconButton onClick={onNext}>
                    <SkipNext />
                </IconButton>
            </Box>
            
            {/* Volume control */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <VolumeUp />
                <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    max={100}
                    valueLabelDisplay="auto"
                    sx={{ ml: 1 }}
                />
            </Box>
        </Card>
    );
};

export default MusicPlayer;