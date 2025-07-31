const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const crypto = require('crypto');
const { URLSearchParams } = require('url');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Environment-aware redirect URI fallback
const getDefaultRedirectUri = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://primosphere.studio/auth/callback';
    }
    return `http://localhost:${PORT}/auth/callback`;
};

const getDefaultFrontendUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://primosphere.studio';
    }
    return `http://localhost:${PORT}`;
};

const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || getDefaultRedirectUri();
const FRONTEND_URL = process.env.FRONTEND_URL || getDefaultFrontendUrl();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://primosphere.studio', 'https://www.primosphere.studio']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Store for temporary state (in production, use Redis or database)
const authStates = new Map();

// Utility functions
const generateRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

const base64encode = (str) => {
    return Buffer.from(str).toString('base64');
};

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        spotify_configured: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)
    });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Spotify authentication initiation
app.get('/auth/spotify', (req, res) => {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        return res.status(500).json({
            error: 'Spotify credentials not configured',
            message: 'Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables'
        });
    }

    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-read-recently-played user-top-read';
    
    // Store state for verification
    authStates.set(state, {
        timestamp: Date.now(),
        ip: req.ip
    });

    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    for (const [key, value] of authStates.entries()) {
        if (value.timestamp < tenMinutesAgo) {
            authStates.delete(key);
        }
    }

    const authURL = 'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state: state
        }).toString();

    res.redirect(authURL);
});

// Spotify OAuth callback
app.get('/auth/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.error('Spotify auth error:', error);
        return res.redirect(`${FRONTEND_URL}?error=access_denied`);
    }

    if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}?error=invalid_request`);
    }

    // Verify state
    const storedState = authStates.get(state);
    if (!storedState) {
        return res.redirect(`${FRONTEND_URL}?error=state_mismatch`);
    }

    // Remove used state
    authStates.delete(state);

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI
            }),
            {
                headers: {
                    'Authorization': 'Basic ' + base64encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token } = tokenResponse.data;
        // Note: refresh_token and expires_in available for future token refresh implementation

        // Get user profile
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const userProfile = userResponse.data;

        // In a real application, store these tokens securely in a database
        // For now, we'll redirect with success and include basic user info
        const userInfo = {
            id: userProfile.id,
            display_name: userProfile.display_name,
            email: userProfile.email,
            country: userProfile.country,
            followers: userProfile.followers?.total || 0,
            premium: userProfile.product === 'premium'
        };

        // Redirect to frontend with success
        const encodedUserInfo = encodeURIComponent(JSON.stringify(userInfo));
        res.redirect(`${FRONTEND_URL}?auth=success&user=${encodedUserInfo}`);

    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
    }
});

// API endpoint to get user's Spotify data (requires authentication in production)
app.post('/api/spotify/recommendations', async (req, res) => {
    try {
        const { access_token, seed_genres, limit = 20, target_features = {} } = req.body;

        if (!access_token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Build recommendations query
        const params = new URLSearchParams({
            limit: limit.toString(),
            seed_genres: (seed_genres || ['pop', 'rock']).join(',')
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
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );

        res.json({
            recommendations: response.data.tracks,
            seed_genres: seed_genres,
            target_features: target_features,
            status: 'success'
        });

    } catch (error) {
        console.error('Recommendations error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get recommendations',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// API endpoint to create playlist
app.post('/api/spotify/playlist', async (req, res) => {
    try {
        const { access_token, name, description, tracks, isPublic = false } = req.body;

        if (!access_token || !name || !tracks || !Array.isArray(tracks)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get user ID first
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const userId = userResponse.data.id;

        // Create playlist
        const playlistResponse = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
                name: name,
                description: description || 'Created by EchoTune AI',
                public: isPublic
            },
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const playlist = playlistResponse.data;

        // Add tracks to playlist
        if (tracks.length > 0) {
            await axios.post(
                `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
                {
                    uris: tracks
                },
                {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        res.json({
            playlist: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                external_url: playlist.external_urls.spotify,
                tracks_added: tracks.length
            },
            status: 'success'
        });

    } catch (error) {
        console.error('Playlist creation error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to create playlist',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Chatbot endpoint (basic implementation)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        // Note: user_context available for future personalization features

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Simple intent recognition (in production, use proper NLP)
        const lowerMessage = message.toLowerCase();
        let response = '';
        let action = null;

        if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
            response = 'I\'d love to recommend some music for you! What mood are you in? Or what genre would you like to explore?';
            action = 'recommend';
        } else if (lowerMessage.includes('playlist')) {
            response = 'I can help you create a personalized playlist! What would you like to name it and what kind of vibe are you going for?';
            action = 'create_playlist';
        } else if (lowerMessage.includes('mood') || lowerMessage.includes('feel')) {
            response = 'Tell me more about your mood! Are you looking for something upbeat and energetic, or maybe something more chill and relaxing?';
            action = 'mood_analysis';
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = 'Hello! I\'m your AI music assistant. I can help you discover new music, create playlists, and find the perfect songs for any mood. What would you like to explore today?';
        } else {
            response = 'I\'m here to help you with music recommendations and playlist creation! Try asking me to recommend songs for a specific mood or to create a playlist.';
        }

        res.json({
            response: response,
            action: action,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Failed to process message',
            message: 'Sorry, I encountered an error. Please try again.'
        });
    }
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 EchoTune AI Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Spotify configured: ${!!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔗 Local access: http://localhost:${PORT}`);
        console.log(`🎤 Health check: http://localhost:${PORT}/health`);
    }
});

module.exports = app;