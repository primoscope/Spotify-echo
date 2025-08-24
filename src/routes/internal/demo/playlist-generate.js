'use strict';

/**
 * Demo Playlist Generation Route
 * Demonstrates domain metrics for playlist generation
 * Only available when ENABLE_DEMO_ROUTES=1
 */

const express = require('express');
const { instrumentPlaylistGeneration } = require('../../../domain/playlist/metrics');
const { createValidationError } = require('../../../errors/createError');

const router = express.Router();

/**
 * Simulate playlist generation with configurable latency and error rates
 */
router.post('/', async (req, res) => {
  try {
    const {
      source = 'demo',
      trackCount = 20,
      simulateLatency = 100,
      simulateError = false,
      errorType = 'timeout'
    } = req.body || {};

    // Validate input
    if (trackCount < 1 || trackCount > 1000) {
      throw createValidationError('Track count must be between 1 and 1000', {
        field: 'trackCount',
        value: trackCount,
        min: 1,
        max: 1000
      });
    }

    // Use domain metrics instrumentation
    const result = await instrumentPlaylistGeneration(source, async () => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, simulateLatency));
      
      // Simulate error if requested
      if (simulateError) {
        const errors = {
          timeout: new Error('Playlist generation timeout'),
          rate_limit: new Error('Rate limit exceeded'),
          auth: new Error('Authentication failed'),
          network: new Error('Network error occurred'),
          validation: createValidationError('Invalid playlist parameters'),
          server_error: Object.assign(new Error('Server error'), { statusCode: 500 }),
          client_error: Object.assign(new Error('Client error'), { statusCode: 400 })
        };
        
        const error = errors[errorType] || new Error('Unknown error');
        throw error;
      }

      // Simulate successful playlist generation
      const tracks = Array.from({ length: trackCount }, (_, i) => ({
        id: `track_${i + 1}`,
        name: `Demo Track ${i + 1}`,
        artist: `Demo Artist ${Math.floor(i / 5) + 1}`,
        duration: Math.floor(Math.random() * 240000) + 120000, // 2-6 minutes
        popularity: Math.floor(Math.random() * 100)
      }));

      return {
        id: `playlist_${Date.now()}`,
        name: `Demo Playlist (${source})`,
        tracks,
        trackCount: tracks.length,
        source,
        generatedAt: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      playlist: result,
      metrics: {
        source,
        trackCount: result.trackCount,
        simulatedLatency: simulateLatency
      }
    });

  } catch (error) {
    // Error will be handled by the domain metrics and central error handler
    throw error;
  }
});

/**
 * Get playlist generation metrics (for demonstration)
 */
router.get('/metrics', (req, res) => {
  res.json({
    info: 'Playlist generation metrics are available at /internal/metrics',
    metrics: [
      'playlist_generation_requests_total{source}',
      'playlist_generation_duration_ms{source}', 
      'playlist_generation_errors_total{source,error_type}'
    ],
    demo_endpoint: '/internal/demo/playlist-generate',
    example_request: {
      source: 'ai',
      trackCount: 30,
      simulateLatency: 200,
      simulateError: false,
      errorType: 'timeout'
    }
  });
});

module.exports = router;