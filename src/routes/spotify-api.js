const express = require('express');
const axios = require('axios');
const { URLSearchParams } = require('url');

const router = express.Router();

/**
 * Get Spotify recommendations based on user preferences
 * POST /api/spotify/recommendations
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { access_token, seed_genres, limit = 20, target_features = {} } = req.body;

    if (!access_token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Build recommendations query
    const params = new URLSearchParams({
      limit: limit.toString(),
      seed_genres: (seed_genres || ['pop', 'rock']).join(','),
    });

    // Add target audio features if provided
    Object.entries(target_features).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(`target_${key}`, value.toString());
      }
    });

    const response = await axios.get(
      `https://api.spotify.com/v1/recommendations?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    res.json({
      recommendations: response.data.tracks,
      seed_genres: seed_genres,
      target_features: target_features,
      status: 'success',
    });
  } catch (error) {
    console.error('Recommendations error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error.response?.data?.error?.message || error.message,
    });
  }
});

/**
 * Create a new Spotify playlist
 * POST /api/spotify/playlist
 */
router.post('/playlist', async (req, res) => {
  try {
    const { access_token, name, description, tracks, isPublic = false } = req.body;

    if (!access_token || !name || !tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user ID first
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userId = userResponse.data.id;

    // Create playlist
    const playlistResponse = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: name,
        description: description || 'Created by EchoTune AI',
        public: isPublic,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const playlist = playlistResponse.data;

    // Add tracks to playlist
    if (tracks.length > 0) {
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          uris: tracks,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        external_url: playlist.external_urls.spotify,
        tracks_added: tracks.length,
      },
      status: 'success',
    });
  } catch (error) {
    console.error('Playlist creation error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create playlist',
      message: error.response?.data?.error?.message || error.message,
    });
  }
});

module.exports = router;