# Enhanced Gemini Code Assist Rules for EchoTune AI

## Code Style Rules

### JavaScript/TypeScript
- Use modern ES6+ features (async/await, destructuring, arrow functions, optional chaining)
- Prefer const/let over var, with const as default
- Use meaningful variable names that reflect music domain (trackId, audioFeatures, playlistMetadata)
- Include comprehensive JSDoc comments for public methods and complex functions
- Handle errors with try/catch blocks and provide meaningful error messages
- Use environment variables for all configuration and never hardcode secrets
- Implement proper TypeScript types for better code safety and IDE support
- Use async/await pattern consistently and avoid Promise chains
- Implement proper logging with appropriate log levels (debug, info, warn, error)

### React Components
- Use functional components with hooks instead of class components
- Implement proper prop validation with TypeScript interfaces or PropTypes
- Use React.memo for performance optimization of expensive components
- Implement proper error boundaries for graceful error handling
- Use semantic HTML and ARIA attributes for accessibility
- Implement responsive design patterns for mobile-first development
- Use CSS modules or styled-components for scoped styling
- Implement proper state management with Context API or external libraries

### Python
- Follow PEP 8 style guidelines strictly with 88-character line limit (Black formatter)
- Use type hints for all function parameters, return values, and class attributes
- Include comprehensive docstrings for classes, methods, and modules using Google style
- Use meaningful variable names that reflect music domain (user_preferences, audio_features_df)
- Handle exceptions appropriately with specific exception types
- Use virtual environments and requirements.txt for dependency management
- Implement proper logging with the logging module, not print statements
- Use dataclasses for structured data and Pydantic for validation
- Follow functional programming principles where appropriate

### Database Queries
- Use parameterized queries to prevent injection attacks
- Index frequently queried fields, especially user_id, track_id, timestamp
- Limit result sets appropriately with pagination for large datasets
- Use aggregation pipelines for complex operations instead of post-processing
- Handle connection errors gracefully with retry logic and circuit breakers
- Implement proper transaction management for consistency
- Use connection pooling for optimal resource utilization
- Monitor query performance with explain plans and slow query logs

## Security Rules

### API Keys and Secrets Management
- Never hardcode API keys, tokens, or secrets in source code
- Use environment variables for all sensitive configuration
- Implement key rotation strategies for production environments
- Use different keys for development, staging, and production
- Store secrets in secure key management systems (AWS Secrets Manager, Azure Key Vault)
- Log security events appropriately without exposing sensitive data
- Implement secret scanning in CI/CD pipelines to prevent accidental exposure
- Use encrypted storage for cached tokens and user credentials

### Input Validation and Sanitization
- Validate all user inputs against expected schemas and ranges
- Sanitize data before database operations using parameterized queries
- Use allowlists for expected values instead of blocklists
- Validate file uploads carefully including file type, size, and content scanning
- Implement proper CSRF protection for state-changing operations
- Use content security policies (CSP) to prevent XSS attacks
- Validate and sanitize music metadata from external APIs
- Implement rate limiting per user and per IP address

### Authentication and Authorization
- Use secure session management with appropriate timeouts
- Implement proper logout functionality that invalidates all tokens
- Use HTTPS for all authentication flows and sensitive data transmission
- Validate tokens on each request and handle token expiration gracefully
- Implement rate limiting for authentication endpoints to prevent brute force
- Use OAuth 2.0 with PKCE for secure authorization flows
- Implement proper role-based access control (RBAC) for different user types
- Store passwords using bcrypt or Argon2 with appropriate salt rounds

### Data Privacy and Protection
- Implement data minimization principles - collect only necessary data
- Provide clear privacy policies and obtain proper user consent
- Implement right to deletion (GDPR compliance) for user data
- Encrypt sensitive data at rest and in transit
- Implement proper data retention policies
- Anonymize or pseudonymize data for analytics when possible
- Implement audit trails for data access and modifications
- Regular security assessments and penetration testing

## Performance Rules

### Database Operations
- Use connection pooling with appropriate pool sizes (10-20 connections typical)
- Index queries appropriately based on access patterns and cardinality
- Avoid N+1 query problems by using joins or batch operations
- Use bulk operations for multiple records instead of individual queries
- Monitor query performance with APM tools and database metrics
- Implement read replicas for read-heavy workloads
- Use database-specific optimization features (MongoDB aggregation, PostgreSQL materialized views)
- Implement proper backup and disaster recovery strategies

### API Usage and Caching
- Implement multi-layer caching strategy (in-memory, Redis, CDN)
- Respect rate limits and implement exponential backoff for retries
- Use compression for large responses (gzip, brotli)
- Implement pagination for list endpoints with reasonable default sizes
- Monitor API usage metrics and set up alerting for anomalies
- Cache frequently accessed data with appropriate TTL values
- Use ETags and conditional requests to reduce bandwidth
- Implement graceful degradation when external APIs are unavailable

### Memory Management and Resource Optimization
- Clean up resources properly using try/finally blocks or context managers
- Use streams for large data processing instead of loading everything into memory
- Avoid memory leaks with proper cleanup of event listeners and timers
- Monitor memory usage in production with profiling tools
- Use efficient data structures appropriate for the use case
- Implement proper garbage collection tuning for Node.js applications
- Use worker processes for CPU-intensive tasks to avoid blocking the main thread
- Optimize image and asset delivery with appropriate formats and compression

### Real-time Systems Optimization
- Use WebSocket connections efficiently with proper connection pooling
- Implement heartbeat mechanisms to detect disconnected clients
- Use message queues for asynchronous processing of heavy operations
- Implement proper load balancing for WebSocket connections
- Use Redis pub/sub for scaling real-time features across multiple servers
- Optimize message serialization (consider MessagePack over JSON for performance)
- Implement connection limits and resource quotas per user
- Use sticky sessions for WebSocket connections when load balancing

## Music Domain Rules

### Audio Features and Music Data
- Validate audio feature ranges (0-1 for danceability, energy, valence, acousticness, etc.)
- Handle missing audio features gracefully with appropriate defaults or interpolation
- Use appropriate defaults for missing data based on genre or artist characteristics
- Consider feature normalization for machine learning models
- Document feature meanings clearly for team members and future maintenance
- Implement audio feature aggregation for playlists and albums
- Validate tempo ranges (typically 60-200 BPM for most music)
- Handle edge cases like spoken word, classical music, and experimental genres

### Recommendation Logic and Algorithms
- Implement fallback strategies for cold start problems (new users, new tracks)
- Use multiple recommendation strategies (collaborative, content-based, popularity)
- Consider user context (time of day, mood, activity, listening history)
- Implement diversity in recommendations to avoid filter bubbles
- Track recommendation effectiveness with click-through and completion rates
- Implement serendipity in recommendations while maintaining relevance
- Use proper evaluation metrics (precision@k, recall@k, diversity, novelty)
- A/B test recommendation algorithm changes with proper statistical analysis

### Spotify API Integration Best Practices
- Handle API rate limits (429 responses) with exponential backoff and jitter
- Implement robust token refresh logic with proper error handling
- Validate API responses against expected schemas before processing
- Handle API downtime gracefully with cached data and user notifications
- Cache frequently accessed data (track info, artist details) with appropriate TTL
- Implement pagination for large playlists and user libraries
- Use batch requests when available to reduce API call count
- Monitor API quota usage and implement alerts for approaching limits

### User Experience and Interface Design
- Implement responsive design for different screen sizes and orientations
- Use semantic HTML and ARIA labels for screen reader accessibility
- Provide keyboard navigation support for all interactive elements
- Implement proper loading states and skeleton screens for better perceived performance
- Use consistent design patterns and music-specific iconography
- Implement proper error states with actionable user guidance
- Provide feedback for user actions (like, skip, save to playlist)
- Support both light and dark themes with proper contrast ratios

## Testing Rules

### Unit Testing
- Test happy path scenarios with realistic music data
- Test error cases and edge conditions (empty playlists, invalid audio features)
- Mock external dependencies (Spotify API, database) for isolated testing
- Use descriptive test names that explain the scenario being tested
- Maintain good test coverage (80%+ for critical business logic)
- Use test data that represents realistic music scenarios
- Test async operations properly with appropriate timeout handling
- Implement property-based testing for complex algorithms

### Integration Testing
- Test API endpoints end-to-end with realistic request/response cycles
- Test database operations with actual database instances (use test containers)
- Test external API integrations with proper mocking and contract testing
- Use test data that mirrors production scenarios but is anonymized
- Clean up test data after tests to prevent interference
- Test authentication and authorization flows comprehensively
- Test real-time features with multiple concurrent connections
- Implement chaos engineering practices for resilience testing

### Performance Testing
- Test with realistic data volumes (millions of tracks, thousands of users)
- Monitor response times for all critical user journeys
- Test concurrent user scenarios with load testing tools
- Monitor resource usage (CPU, memory, database connections) during tests
- Test scalability limits and identify bottlenecks early
- Implement synthetic monitoring for production performance tracking
- Test recommendation algorithm performance with large datasets
- Validate caching effectiveness under various load conditions

### Security Testing
- Test authentication flows for various attack vectors
- Validate input sanitization with malicious payloads
- Test authorization controls to prevent privilege escalation
- Implement automated security scanning in CI/CD pipelines
- Test for common vulnerabilities (OWASP Top 10)
- Validate API key and token security practices
- Test data encryption and secure transmission
- Perform regular penetration testing with third-party security firms

## Documentation Rules

### Code Documentation
- Include JSDoc/docstring for all public methods and complex functions
- Document complex algorithms with mathematical foundations and references
- Explain business logic clearly with music domain context
- Include usage examples with realistic scenarios and data
- Keep documentation up to date with code changes
- Document performance characteristics and complexity for algorithms
- Include troubleshooting guides for common issues
- Document configuration options and their effects on system behavior

### API Documentation
- Document all endpoints clearly with OpenAPI/Swagger specifications
- Include complete request/response examples with realistic data
- Document all error codes and messages with specific meanings
- Include authentication requirements and authorization scopes
- Provide SDK examples in multiple programming languages
- Document rate limiting and pagination patterns
- Include workflow examples for common integration scenarios
- Maintain versioning documentation for API changes

### Architecture and Configuration Documentation
- Document all environment variables with descriptions and examples
- Include comprehensive setup instructions for development environments
- Document deployment procedures for different environments
- Include troubleshooting guides for common deployment issues
- Maintain architecture diagrams showing system component interactions
- Document scaling strategies and performance characteristics
- Include disaster recovery and backup procedures
- Maintain changelog with breaking changes and migration guides

## Code Quality and Maintenance Rules

### Code Organization and Structure
- Use consistent directory structure across all projects
- Implement proper separation of concerns with clear layer boundaries
- Use dependency injection for better testability and modularity
- Implement proper error handling hierarchies with custom error types
- Use configuration management for environment-specific settings
- Implement proper logging strategies with structured logging
- Use linting and formatting tools consistently across the team
- Implement pre-commit hooks for code quality enforcement

### Dependency Management
- Keep dependencies up to date with regular security updates
- Use lock files (package-lock.json, poetry.lock) for consistent builds
- Audit dependencies regularly for security vulnerabilities
- Minimize dependency count and avoid unnecessary packages
- Use semantic versioning for internal packages and libraries
- Document dependency rationale for complex or unusual choices
- Implement automated dependency updates with proper testing
- Use virtual environments and containerization for isolation

### Monitoring and Observability
- Implement comprehensive logging with appropriate log levels
- Use structured logging for better searchability and analysis
- Implement application performance monitoring (APM) tools
- Set up alerts for critical system metrics and error rates
- Implement health checks for all system components
- Use distributed tracing for complex request flows
- Monitor business metrics (user engagement, recommendation effectiveness)
- Implement proper incident response procedures and runbooks

These enhanced rules provide comprehensive guidance for developing high-quality, secure, and performant music recommendation systems with proper testing, documentation, and maintenance practices.