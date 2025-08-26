/**
 * Static File Serving Routes
 * Phase 5A: Extracted from server.js for modular architecture
 * Handles all static file serving configurations with proper caching
 */

const express = require('express');
const path = require('path');

// Constants for cache control
const ONE_YEAR_IN_SECONDS = 31536000;

/**
 * Configure static file serving for all application assets
 * @param {Express} app - Express application instance
 */
function configureStaticRoutes(app) {
  // Serve built React application static files first
  app.use(
    express.static(path.join(__dirname, '../../dist'), {
      maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          // Hashed asset filenames are immutable
          res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`);
        }
      },
    })
  );

  // Static file serving with caching headers (fallback)
  app.use(
    express.static(path.join(__dirname, '../../public'), {
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      },
    })
  );

  // Serve React frontend files
  app.use(
    '/frontend',
    express.static(path.join(__dirname, '../frontend'), {
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
      etag: false,
      setHeaders: (res) => {
        if (process.env.NODE_ENV !== 'production') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );

  // Serve src directory for JavaScript modules with no-cache in development
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      '/src',
      express.static(path.join(__dirname, '..'), {
        maxAge: 0,
        etag: false,
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        },
      })
    );
  }

  // Serve docs directory for API documentation
  app.use(
    '/docs',
    express.static(path.join(__dirname, '../../docs'), {
      maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          res.setHeader('Content-Type', 'text/yaml');
        }
      },
    })
  );

  console.log('📁 Static file serving configured');
}

module.exports = {
  configureStaticRoutes,
};