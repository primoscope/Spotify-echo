import React, { useEffect, useRef, memo } from 'react';
import { Box, Paper, Typography } from '@mui/material';

/**
 * Music Visualizer Component
 * Provides real-time audio visualization
 */
const MusicVisualizer = memo(({ isPlaying = false, audioFeatures = {} }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up animation parameters based on audio features
    const energy = audioFeatures.energy || 0.5;
    const tempo = audioFeatures.tempo || 120;
    const valence = audioFeatures.valence || 0.5;

    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsla(${valence * 360}, 70%, 50%, 0.1)`);
      gradient.addColorStop(1, `hsla(${(valence + 0.3) * 360}, 70%, 30%, 0.1)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw visualization bars
      const barCount = 32;
      const barWidth = width / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.sin(frame * 0.1 + i * 0.5) * energy * height * 0.3 + height * 0.1;
        const x = i * barWidth;
        const y = height - Math.abs(barHeight);
        
        // Color based on position and audio features
        const hue = (i / barCount * 360 + frame * 2) % 360;
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${energy})`;
        
        ctx.fillRect(x, y, barWidth - 2, Math.abs(barHeight));
      }

      // Draw center circle
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 20 + Math.sin(frame * 0.2) * energy * 10;
      
      const circleGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      circleGradient.addColorStop(0, `hsla(${valence * 360}, 80%, 60%, ${energy})`);
      circleGradient.addColorStop(1, `hsla(${valence * 360}, 80%, 60%, 0)`);
      
      ctx.fillStyle = circleGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      frame += tempo / 120; // Animate faster for higher tempo
      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioFeatures]);

  if (!isPlaying) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary">
          🎵 Visualizer (Play to activate)
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        style={{
          width: '100%',
          height: '100px',
          borderRadius: '8px',
          background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)'
        }}
        aria-label="Music visualization"
      />
    </Box>
  );
});

MusicVisualizer.displayName = 'MusicVisualizer';

export default MusicVisualizer;