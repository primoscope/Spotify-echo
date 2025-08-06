# 👨‍💻 EchoTune AI - Developer Setup and Contributing Guide

[![Contributor Friendly](https://img.shields.io/badge/contributor-friendly-green.svg)](CONTRIBUTING.md)
[![Development Ready](https://img.shields.io/badge/development-ready-blue.svg)](#quick-start)

## Overview

This guide provides comprehensive instructions for setting up a development environment, understanding the codebase architecture, and contributing to EchoTune AI. Whether you're fixing bugs, adding features, or improving documentation, this guide will get you started quickly.

## 🚀 Quick Start for Contributors

### Prerequisites

**Required:**
- Node.js 20+ and npm 10+
- Git 2.30+
- Code editor (VS Code recommended)

**Optional:**
- Docker and Docker Compose (for containerized development)
- Python 3.8+ (for ML features)
- MongoDB (or use Docker)

### 1-Minute Setup

```bash
# Fork and clone repository
git clone https://github.com/YOUR_USERNAME/Spotify-echo.git
cd Spotify-echo

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

**That's it!** The application runs in demo mode without any API keys.

## 🏗️ Project Architecture

### Technology Stack

**Frontend:**
- **React 18** - Modern UI components with hooks
- **Vite** - Fast build tool and dev server
- **CSS3** - Custom styling with CSS variables
- **Socket.io Client** - Real-time communication

**Backend:**
- **Node.js 20** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - WebSocket communication
- **Passport.js** - Authentication middleware

**AI/ML:**
- **OpenAI GPT** - Conversational AI
- **Google Gemini** - Alternative AI provider
- **Custom ML** - Recommendation algorithms
- **Python scripts** - Data processing

**Database:**
- **MongoDB** - Primary database (optional)
- **SQLite** - Fallback database
- **Redis** - Caching (optional)

**Infrastructure:**
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD

### Project Structure

```
Spotify-echo/
├── src/                    # Source code
│   ├── frontend/          # React components and UI
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── styles/        # CSS and styling
│   │   └── utils/         # Frontend utilities
│   ├── chat/              # AI chat system
│   │   ├── providers/     # LLM providers (OpenAI, Gemini, Mock)
│   │   ├── conversation/  # Chat logic and history
│   │   └── prompts/       # AI prompt templates
│   ├── spotify/           # Spotify API integration
│   │   ├── auth/          # OAuth authentication
│   │   ├── api/           # API client and endpoints
│   │   └── data/          # Data processing
│   ├── database/          # Database layer
│   │   ├── models/        # Data models
│   │   ├── migrations/    # Database migrations
│   │   └── seeds/         # Test data
│   ├── utils/             # Shared utilities
│   │   ├── health-check.js # Health monitoring
│   │   ├── logger.js      # Logging system
│   │   └── validation.js  # Input validation
│   └── server.js          # Main application server
├── scripts/               # Python automation and data processing
│   ├── database/          # Database management scripts
│   ├── deployment/        # Deployment automation
│   └── ml/                # Machine learning scripts
├── tests/                 # Test suites
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── docs/                  # Documentation
│   ├── api/               # API documentation
│   ├── deployment/        # Deployment guides
│   └── guides/            # User guides
├── mcp-server/            # Model Context Protocol server
├── public/                # Static assets
├── nginx/                 # Nginx configuration
├── .github/workflows/     # CI/CD workflows
├── docker-compose.yml     # Development containers
├── Dockerfile            # Container build instructions
├── package.json          # Node.js dependencies
├── requirements.txt      # Python dependencies
└── README.md             # Project overview
```

## 💻 Development Environment

### Environment Configuration

**Minimal setup for development:**

```bash
# .env file for development
NODE_ENV=development
PORT=3000
DOMAIN=localhost

# Optional: Spotify API (for full functionality)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional: AI providers (mock provider works without keys)
DEFAULT_LLM_PROVIDER=mock
# GEMINI_API_KEY=your_gemini_key
# OPENAI_API_KEY=your_openai_key

# Optional: Database (SQLite fallback available)
# MONGODB_URI=mongodb://localhost:27017/echotune_dev

# Security (generate random strings)
SESSION_SECRET=dev_session_secret_change_in_production
JWT_SECRET=dev_jwt_secret_change_in_production
```

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking (if using TypeScript)
npm run type-check

# Health check
npm run health-check

# Clean build artifacts
npm run clean
```

### VS Code Setup

**Recommended extensions (`.vscode/extensions.json`):**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-vscode.vscode-docker",
    "github.copilot"
  ]
}
```

**VS Code settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.env.*": "plaintext"
  }
}
```

### Docker Development Environment

**For consistent development across teams:**

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Development with hot reload
docker-compose -f docker-compose.dev.yml exec app npm run dev

# Run tests in container
docker-compose -f docker-compose.dev.yml exec app npm test

# Shell access
docker-compose -f docker-compose.dev.yml exec app /bin/sh

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/                  # Unit tests for individual functions
│   ├── frontend/         # React component tests
│   ├── backend/          # Server function tests
│   ├── utils/            # Utility function tests
│   └── api/              # API endpoint tests
├── integration/          # Integration tests
│   ├── spotify/          # Spotify API integration
│   ├── database/         # Database operations
│   └── chat/             # AI chat system
├── e2e/                  # End-to-end tests
│   ├── user-flows/       # Complete user journeys
│   └── api-flows/        # API workflow tests
├── fixtures/             # Test data and mocks
├── helpers/              # Test utilities
└── setup/                # Test environment setup
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=spotify

# Debug tests
npm run test:debug

# Generate test report
npm run test:report
```

### Writing Tests

**Unit test example (Jest + React Testing Library):**

```javascript
// tests/unit/frontend/components/ChatInterface.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from '../../../src/frontend/components/ChatInterface';

describe('ChatInterface', () => {
  it('should render chat input and send button', () => {
    render(<ChatInterface />);
    
    expect(screen.getByPlaceholderText(/ask for music/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should send message when form is submitted', async () => {
    const mockSendMessage = jest.fn();
    render(<ChatInterface onSendMessage={mockSendMessage} />);
    
    const input = screen.getByPlaceholderText(/ask for music/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Play some jazz music' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Play some jazz music');
    });
  });
});
```

**Integration test example:**

```javascript
// tests/integration/spotify/auth.test.js
const request = require('supertest');
const app = require('../../../src/server');

describe('Spotify Authentication', () => {
  describe('GET /auth/spotify', () => {
    it('should redirect to Spotify authorization URL', async () => {
      const response = await request(app)
        .get('/auth/spotify')
        .expect(302);
        
      expect(response.headers.location).toContain('accounts.spotify.com');
      expect(response.headers.location).toContain('client_id');
    });
  });

  describe('GET /auth/callback', () => {
    it('should handle successful callback with code', async () => {
      // Mock Spotify token exchange
      jest.mock('../../../src/spotify/auth');
      
      const response = await request(app)
        .get('/auth/callback?code=test_code')
        .expect(302);
        
      expect(response.headers.location).toBe('/dashboard');
    });
  });
});
```

## 🔧 Code Style and Standards

### ESLint Configuration

**`.eslintrc.js`:**

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### Prettier Configuration

**`.prettierrc`:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Hooks (Husky)

**Pre-commit hooks:**

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{css,md,json}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Coding Standards

**JavaScript/React Best Practices:**

1. **Function Components**: Use functional components with hooks
2. **Async/Await**: Prefer async/await over promises
3. **Error Handling**: Always wrap async operations in try/catch
4. **PropTypes**: Use PropTypes or TypeScript for type checking
5. **Destructuring**: Use object/array destructuring
6. **Arrow Functions**: Use arrow functions for consistency
7. **Comments**: JSDoc comments for functions and components

**Example React Component:**

```javascript
// src/frontend/components/MusicRecommendation.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * MusicRecommendation component displays AI-generated music suggestions
 * @param {Object} props - Component props
 * @param {string} props.userId - User identifier
 * @param {Function} props.onRecommendationSelect - Callback when recommendation is selected
 */
const MusicRecommendation = ({ userId, onRecommendationSelect }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  /**
   * Fetch personalized recommendations for the user
   */
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/recommendations/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle recommendation selection
   * @param {Object} recommendation - Selected recommendation
   */
  const handleSelect = (recommendation) => {
    onRecommendationSelect(recommendation);
  };

  if (loading) {
    return <div className="loading">Loading recommendations...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="music-recommendations">
      <h3>Recommended for You</h3>
      {recommendations.length === 0 ? (
        <p>No recommendations available.</p>
      ) : (
        <ul className="recommendations-list">
          {recommendations.map((rec) => (
            <li key={rec.id} className="recommendation-item">
              <div className="track-info">
                <h4>{rec.trackName}</h4>
                <p>{rec.artistName}</p>
              </div>
              <button
                onClick={() => handleSelect(rec)}
                className="select-button"
                aria-label={`Select ${rec.trackName} by ${rec.artistName}`}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

MusicRecommendation.propTypes = {
  userId: PropTypes.string.isRequired,
  onRecommendationSelect: PropTypes.func.isRequired,
};

export default MusicRecommendation;
```

**Node.js Backend Best Practices:**

```javascript
// src/api/recommendations.js
const express = require('express');
const router = express.Router();
const { validateUserId } = require('../utils/validation');
const RecommendationEngine = require('../ml/recommendation-engine');

/**
 * Get personalized music recommendations
 * @route GET /api/recommendations/:userId
 * @param {string} userId - User identifier
 * @returns {Object} Recommendations data
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, genre, mood } = req.query;

    // Validate input
    if (!validateUserId(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    // Get recommendations
    const engine = new RecommendationEngine();
    const recommendations = await engine.getRecommendations({
      userId,
      limit: parseInt(limit, 10),
      filters: { genre, mood }
    });

    res.json({
      success: true,
      data: {
        userId,
        recommendations,
        total: recommendations.length,
        filters: { genre, mood }
      }
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'RECOMMENDATION_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
```

## 🚀 Contributing Workflow

### Development Process

1. **Fork Repository**: Create your own fork
2. **Create Branch**: Feature branch from main
3. **Develop**: Make changes with tests
4. **Test**: Run full test suite
5. **Document**: Update docs as needed
6. **Submit PR**: Create pull request

### Branch Naming Convention

```bash
# Feature branches
feature/add-voice-interface
feature/improve-recommendations

# Bug fixes
fix/health-check-timeout
fix/spotify-auth-redirect

# Documentation
docs/update-api-guide
docs/improve-readme

# Performance improvements
perf/optimize-database-queries
perf/reduce-bundle-size

# Refactoring
refactor/extract-chat-components
refactor/modernize-async-code
```

### Commit Message Format

```bash
# Format: type(scope): description

# Examples:
feat(chat): add voice input functionality
fix(spotify): resolve OAuth redirect timeout
docs(readme): update deployment instructions
test(api): add integration tests for recommendations
perf(db): optimize user query performance
refactor(ui): extract reusable button component
```

### Pull Request Template

**When creating a PR, include:**

1. **Description**: What changes were made and why
2. **Testing**: How the changes were tested
3. **Screenshots**: For UI changes
4. **Breaking Changes**: Any backwards incompatible changes
5. **Checklist**: Ensure all requirements are met

**Example PR Description:**

```markdown
## Description
Adds voice input functionality to the chat interface, allowing users to speak their music requests instead of typing.

## Changes Made
- Added Web Speech API integration
- Created VoiceInput component with start/stop controls
- Added microphone permissions handling
- Integrated with existing chat message flow
- Added visual feedback for recording state

## Testing
- [x] Manual testing on Chrome, Firefox, Safari
- [x] Unit tests for VoiceInput component
- [x] Integration test for speech-to-text flow
- [x] Accessibility testing with screen readers

## Screenshots
[Include screenshots of new voice interface]

## Breaking Changes
None

## Checklist
- [x] Code follows project style guidelines
- [x] Tests pass locally
- [x] Documentation updated
- [x] No console errors or warnings
```

## 🐛 Debugging

### Development Debugging

**VS Code Debug Configuration (`.vscode/launch.json`):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Node.js App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**Common Debugging Techniques:**

```javascript
// 1. Console logging with context
console.log('🎵 Spotify API Response:', {
  status: response.status,
  data: response.data,
  timestamp: new Date().toISOString()
});

// 2. Debug middleware for Express
const debugMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  next();
};

// 3. Error boundaries for React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}
```

### Performance Debugging

```javascript
// 1. Performance timing
const startTime = performance.now();
await someAsyncOperation();
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);

// 2. Memory usage monitoring
const memUsage = process.memoryUsage();
console.log('Memory usage:', {
  rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
  heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
});

// 3. Database query profiling
const queryStart = Date.now();
const result = await db.collection('users').find(query).toArray();
const queryTime = Date.now() - queryStart;
console.log(`Query executed in ${queryTime}ms, returned ${result.length} results`);
```

## 📚 Learning Resources

### Codebase Understanding

**Start here for understanding the codebase:**

1. **`src/server.js`** - Main application entry point
2. **`src/frontend/App.jsx`** - Main React component
3. **`src/chat/providers/`** - AI integration patterns
4. **`src/spotify/auth/`** - OAuth implementation
5. **`src/utils/health-check.js`** - Health monitoring system

### Key Concepts

**1. Health Check System:**
- Distinguishes between critical errors and warnings
- Optional services (database, Redis) can show warnings
- Application remains functional with degraded services

**2. AI Provider System:**
- Pluggable provider architecture
- Mock provider for development without API keys
- Fallback mechanisms for reliability

**3. Spotify Integration:**
- OAuth 2.0 authentication flow
- API rate limiting and error handling
- Playlist creation and management

**4. Database Layer:**
- MongoDB primary with SQLite fallback
- Optional Redis for caching
- Graceful degradation when services unavailable

### External Documentation

- **Node.js**: [Official documentation](https://nodejs.org/docs/)
- **React**: [React documentation](https://react.dev/)
- **Express.js**: [Express guide](https://expressjs.com/)
- **Spotify API**: [Web API documentation](https://developer.spotify.com/documentation/web-api/)
- **Docker**: [Docker documentation](https://docs.docker.com/)

## 🎯 Common Development Tasks

### Adding a New AI Provider

```javascript
// 1. Create provider class
// src/chat/providers/CustomProvider.js
class CustomProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generateResponse(prompt) {
    try {
      // Implement custom API call
      const response = await fetch('https://api.custom.com/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Custom provider error:', error);
      throw error;
    }
  }
}

module.exports = CustomProvider;

// 2. Register provider
// src/chat/ChatManager.js
const providers = {
  openai: new OpenAIProvider(process.env.OPENAI_API_KEY),
  gemini: new GeminiProvider(process.env.GEMINI_API_KEY),
  custom: new CustomProvider(process.env.CUSTOM_API_KEY),
  mock: new MockProvider()
};

// 3. Add environment variable
// .env.example
CUSTOM_API_KEY=your_custom_api_key_here

// 4. Add to health check
// src/utils/health-check.js
if (process.env.CUSTOM_API_KEY) {
  checks.custom_provider = await checkCustomProvider();
}
```

### Creating a New API Endpoint

```javascript
// 1. Create route handler
// src/api/playlists.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PlaylistService = require('../services/PlaylistService');

router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, tracks, isPublic = false } = req.body;
    const userId = req.user.id;

    const playlist = await PlaylistService.create({
      userId,
      name,
      tracks,
      isPublic
    });

    res.status(201).json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Playlist creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create playlist'
    });
  }
});

module.exports = router;

// 2. Register route
// src/server.js
app.use('/api/playlists', require('./api/playlists'));

// 3. Add tests
// tests/integration/api/playlists.test.js
describe('Playlist API', () => {
  it('should create playlist with valid data', async () => {
    const response = await request(app)
      .post('/api/playlists/create')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'Test Playlist',
        tracks: ['track1', 'track2'],
        isPublic: false
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Playlist');
  });
});
```

### Adding Frontend Components

```javascript
// 1. Create component
// src/frontend/components/PlaylistCreator.jsx
import React, { useState } from 'react';
import './PlaylistCreator.css';

const PlaylistCreator = ({ onPlaylistCreate }) => {
  const [name, setName] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/playlists/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, tracks })
      });

      if (response.ok) {
        const data = await response.json();
        onPlaylistCreate(data.data);
        setName('');
        setTracks([]);
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="playlist-creator">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Playlist name"
        required
      />
      <button type="submit" disabled={loading || !name}>
        {loading ? 'Creating...' : 'Create Playlist'}
      </button>
    </form>
  );
};

export default PlaylistCreator;

// 2. Add styles
// src/frontend/components/PlaylistCreator.css
.playlist-creator {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.playlist-creator input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.playlist-creator button {
  padding: 0.5rem 1rem;
  background: #1db954;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.playlist-creator button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

// 3. Add tests
// tests/unit/frontend/components/PlaylistCreator.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlaylistCreator from '../../../src/frontend/components/PlaylistCreator';

describe('PlaylistCreator', () => {
  it('should create playlist when form is submitted', async () => {
    const mockOnCreate = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: '1', name: 'Test' } })
    });

    render(<PlaylistCreator onPlaylistCreate={mockOnCreate} />);

    fireEvent.change(screen.getByPlaceholderText('Playlist name'), {
      target: { value: 'Test Playlist' }
    });
    fireEvent.click(screen.getByText('Create Playlist'));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({ id: '1', name: 'Test' });
    });
  });
});
```

## 📞 Getting Help

### Support Resources

- **GitHub Issues**: [Report bugs or request features](https://github.com/dzp5103/Spotify-echo/issues)
- **GitHub Discussions**: [Ask questions and get help](https://github.com/dzp5103/Spotify-echo/discussions)
- **Documentation**: [Complete project documentation](docs/)
- **Contributing Guide**: [Detailed contributing instructions](CONTRIBUTING.md)

### Before Asking for Help

1. **Check existing issues**: Search for similar problems
2. **Read documentation**: Review relevant guides
3. **Try debugging**: Use logging and debugging tools
4. **Provide context**: Include error messages, logs, and steps to reproduce

### Getting Code Reviews

**Tips for effective code reviews:**

1. **Small PRs**: Keep changes focused and reviewable
2. **Clear descriptions**: Explain what and why
3. **Add tests**: Include relevant test coverage
4. **Follow conventions**: Use project coding standards
5. **Be responsive**: Address feedback promptly

---

**Ready to contribute?**

```bash
git clone https://github.com/YOUR_USERNAME/Spotify-echo.git
cd Spotify-echo
npm install
npm run dev
```

**Happy coding! 🎵**

---

*Last updated: January 2025 • EchoTune AI v2.1.0*