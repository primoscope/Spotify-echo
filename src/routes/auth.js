const express = require('express');
const crypto = require('crypto');
const { URLSearchParams } = require('url');
const { getConfigService } = require('../config/ConfigurationService');

const router = express.Router();

// Store for temporary state (in production, use Redis or database)
const authStates = new Map();

// Utility functions
const generateRandomString = (length) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Get configuration
const config = getConfigService().load();

// Environment-aware redirect URI fallback
const getDefaultRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return `https://${process.env.DOMAIN || 'primosphere.studio'}/auth/callback`;
  }
  return `http://localhost:${config.server.port}/auth/callback`;
};

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || getDefaultRedirectUri();

/**
 * Spotify authentication initiation
 * Redirects user to Spotify authorization page
 */
router.get('/spotify', (req, res) => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Spotify credentials not configured',
      message: 'Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables',
    });
  }

  const state = generateRandomString(16);
  const scope =
    'user-read-private user-read-email playlist-modify-public playlist-modify-private user-read-recently-played user-top-read';

  // Store state for verification
  authStates.set(state, {
    timestamp: Date.now(),
    ip: req.ip,
  });

  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of authStates.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      authStates.delete(key);
    }
  }

  const authURL =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state,
    }).toString();

  res.redirect(authURL);
});

/**
 * Spotify OAuth callback handler
 * Delegates to the canonical Spotify API callback handler
 */
router.get('/callback', (req, res, next) => {
  // Forward to the canonical Spotify API callback handler to avoid code duplication
  req.url = '/api/spotify/auth/callback' + (req.url.indexOf('?') !== -1 ? req.url.substring(req.url.indexOf('?')) : '');
  next('router');
});

module.exports = router;