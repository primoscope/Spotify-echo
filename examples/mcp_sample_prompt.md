# MCP Sample Prompts for Coding Agents

This document provides sample prompts and usage patterns for GitHub Coding Agents using the MCP (Model Context Protocol) servers configured in EchoTune AI.

## 🚀 Getting Started

After setting up MCP servers with `npm run mcp:install`, you can use these prompts with your coding agent (GitHub Copilot, Cursor, Claude, etc.).

## 📁 File & Repository Operations

### Basic File Operations
```
"List all TypeScript files in the src directory and analyze their import/export structure"

"Find all files that import 'express' and show their usage patterns"

"Create a new component file at src/components/PlaylistManager.tsx with basic React setup"
```

### Repository Analysis
```
"Analyze the current project structure and identify potential architectural improvements"

"Generate a dependency graph for the React components in src/components/"

"Find all TODO comments in the codebase and categorize them by priority"
```

### Security Analysis
```
"Scan all JavaScript files for potential security vulnerabilities, especially in authentication code"

"Check if any environment variables or API keys are accidentally hardcoded in the source"
```

## 🔧 GitHub Integration

### Issue Management
```
"Create a new GitHub issue titled 'Implement real-time playlist updates' with the enhancement label and assign it to the current milestone"

"List all open issues with the 'bug' label and summarize them by component"

"Update issue #123 to add the 'in-progress' label and post a status comment"
```

### Pull Request Operations
```
"Create a draft pull request for the current branch with a detailed description of changes made to the recommendation engine"

"Review the last 3 pull requests and summarize the main changes and their impact"

"Check if there are any open pull requests that conflict with the current branch"
```

### Repository Insights
```
"Analyze the commit history for the past month and identify the most active contributors"

"Generate a report of code review comments from the last 10 pull requests"

"Find all recently merged PRs that modified the Spotify integration code"
```

## 🤖 AI-Powered Development

### Code Generation
```
"Create a new recommendation engine class that uses collaborative filtering, following the existing code patterns in scripts/recommendation_engine.py"

"Generate unit tests for the SpotifyAPI class in src/services/spotify.js"

"Create a new API endpoint for playlist management with proper error handling and validation"
```

### Code Review & Analysis
```
"Review the changes in the current working directory and suggest improvements for performance and readability"

"Analyze the database queries in scripts/ and suggest optimizations"

"Check the React components for accessibility issues and suggest improvements"
```

### Documentation Generation
```
"Generate API documentation for all endpoints in server.js using JSDoc format"

"Create a README section explaining how to set up the development environment"

"Generate TypeScript type definitions for the Spotify API responses used in the project"
```

## 🔍 Research & Discovery

### Technology Research
```
"Search for best practices for implementing OAuth 2.0 refresh tokens in Node.js applications"

"Find examples of real-time music visualization libraries compatible with React"

"Research current trends in music recommendation algorithms and how they compare to our approach"
```

### Documentation Lookup
```
"Find the official Spotify Web API documentation for the recommendation endpoints"

"Look up MongoDB best practices for storing and querying music listening history data"

"Search for React performance optimization techniques for large playlists"
```

### Competitive Analysis
```
"Research how other music apps implement playlist sharing features"

"Find open source music recommendation systems and analyze their architectures"
```

## 🛠️ Development Workflow

### Environment Setup
```
"Help me set up a new development environment by checking all required dependencies and environment variables"

"Validate that all API keys are properly configured and test the Spotify API connection"

"Set up the database schema and run any necessary migrations"
```

### Testing & Debugging
```
"Run the test suite and analyze any failing tests, then suggest fixes"

"Debug the authentication flow by tracing through the OAuth implementation"

"Test the recommendation engine with sample data and analyze the results"
```

### Deployment Preparation
```
"Check the application for production readiness, including security, performance, and monitoring"

"Generate a deployment checklist with all required environment variables and dependencies"

"Review the Docker configuration and suggest improvements for production deployment"
```

## 🎵 Music-Specific Operations

### Spotify Integration
```
"Analyze my Spotify listening history CSV files and identify patterns in my music preferences"

"Create a new playlist recommendation algorithm based on audio features like tempo and energy"

"Implement a feature to sync playlists between the app and Spotify"
```

### Audio Analysis
```
"Process the audio features data to identify clusters of similar songs"

"Generate visualizations of music preference trends over time"

"Create a mood-based music filtering system using audio features"
```

### Machine Learning
```
"Improve the collaborative filtering model by implementing matrix factorization"

"Add support for content-based filtering using song metadata and audio features"

"Create a hybrid recommendation system that combines multiple approaches"
```

## 📊 Data & Analytics

### Database Operations
```
"Optimize the MongoDB queries for fetching user listening history and generate performance metrics"

"Create database indexes to improve query performance for recommendation generation"

"Migrate the listening history data from CSV files to MongoDB with proper validation"
```

### Data Analysis
```
"Analyze the correlation between audio features and user preferences in the dataset"

"Generate insights about music discovery patterns from the user interaction data"

"Create a dashboard showing key metrics for the recommendation system performance"
```

## 🔄 Advanced Workflows

### Multi-Step Operations
```
"Help me implement a complete user authentication system: 1) Update the database schema, 2) Create API endpoints, 3) Add frontend components, 4) Write tests, 5) Update documentation"

"Guide me through adding a new music service integration: 1) Research their API, 2) Create the service class, 3) Add authentication flow, 4) Test the integration, 5) Update the UI"
```

### Cross-Platform Development
```
"Create a mobile-responsive version of the playlist interface that works well on both desktop and mobile"

"Implement Progressive Web App features to make the music app work offline"
```

## 🎯 Context-Aware Prompts

### Using Project Knowledge
```
"Based on the existing EchoTune AI architecture, suggest the best approach to add real-time collaborative playlists"

"Considering our current MongoDB schema and Spotify API integration, how should we implement playlist versioning?"

"Given the existing React component structure, create a new component for music visualization that fits the current design patterns"
```

### Sequential Development
```
"Let's build a new feature step by step:
1. First, help me understand the requirements for social playlist sharing
2. Then design the database changes needed
3. Create the backend API endpoints
4. Build the frontend components
5. Add appropriate tests
6. Update the documentation"
```

## 💡 Tips for Effective Prompts

### Be Specific
- ✅ "Create a React component for playlist management with add, remove, and reorder functionality"
- ❌ "Create a playlist component"

### Provide Context
- ✅ "Using the existing Spotify integration in src/services/spotify.js, add support for creating playlists"
- ❌ "Add playlist creation"

### Request Multiple Perspectives
- ✅ "Analyze this code for both performance and security issues, and suggest improvements"
- ❌ "Fix this code"

### Ask for Explanations
- ✅ "Explain why this approach is better than alternatives and what trade-offs we're making"
- ❌ "Implement this feature"

## 🔧 Troubleshooting Prompts

### When Things Go Wrong
```
"The Spotify authentication is failing - help me debug the OAuth flow and identify the issue"

"The recommendation engine is returning poor results - analyze the algorithm and suggest improvements"

"The React app is performing slowly with large playlists - identify bottlenecks and optimize"
```

### Learning & Improvement
```
"Explain the current architecture and suggest how we could make it more scalable"

"What modern development practices could we adopt to improve code quality?"

"How can we better structure our tests to improve coverage and reliability?"
```

---

## 📚 Additional Resources

- [MCP Integration Guide](../docs/mcp-integration.md)
- [GitHub MCP Server Documentation](https://github.com/github/github-mcp-server)
- [VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=microsoft.vscode-mcp)

---

**Pro Tip**: Start with simple prompts and gradually build complexity. The MCP servers will remember context within a session, so you can reference previous responses and build upon them.