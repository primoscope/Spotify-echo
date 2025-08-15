# EchoTune AI Architecture Rules

## Core Principles
- **Music-First Design**: All features should enhance music discovery and recommendation
- **Performance Budgets**: Maintain p95 latency ≤ 1500ms, memory ≤ 256MB
- **Research-Driven Development**: Use @perplexity for latest music tech insights
- **Modular Architecture**: Keep components loosely coupled and testable

## Technology Stack
- **Backend**: Node.js (Express), Python ML pipelines
- **Frontend**: React with modern ES6+, Vite build system
- **Database**: MongoDB (primary), Redis (caching), SQLite (fallback)
- **AI/ML**: Spotify API, OpenAI, Perplexity research
- **MCP**: Multi-server integration with performance monitoring

## Code Quality Standards
- **JavaScript**: Use modern async/await, avoid callback hell
- **Python**: Follow PEP 8, use type hints, implement proper error handling
- **Testing**: Jest for JS, pytest for Python, aim for 80%+ coverage
- **Security**: Never hardcode API keys, validate all inputs
- **Documentation**: JSDoc for complex functions, README updates for features

## Music Domain Rules
- **Spotify Integration**: Always handle rate limits and token refresh
- **ML Models**: Use cached predictions when possible, batch API calls
- **User Privacy**: Anonymize listening data, secure token storage
- **Performance**: Preload popular tracks, optimize recommendation algorithms