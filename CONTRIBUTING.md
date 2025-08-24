# 🤝 Contributing to EchoTune AI

Thank you for your interest in contributing to EchoTune AI! This guide will help you get started with contributing to our music recommendation platform.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up development environment** (see [Setup Guide](#development-setup))
4. **Create a feature branch** for your changes
5. **Make your changes** following our guidelines
6. **Test thoroughly** and ensure quality
7. **Submit a pull request** with clear description

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🛠️ Development Setup

### Prerequisites

- **Node.js 20+** and npm
- **Python 3.8+** and pip
- **Git** for version control
- **MongoDB** (local or Atlas account)
- **Spotify Developer Account** for API access

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Spotify-echo.git
cd Spotify-echo

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Configure your environment variables
# Add your Spotify API credentials and other settings
```

### Environment Configuration

Edit `.env` file with your credentials:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/echotune
# OR use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune

# AI/ML Configuration
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
LLM_PROVIDER=mock  # Use 'mock' for development

# Development Settings
NODE_ENV=development
PORT=3000
```

### Running the Application

```bash
# Start the main application
npm start

# Or start in development mode with auto-reload
npm run dev

# Start the MCP automation server (optional)
npm run mcp-server

# Run Python ML scripts
python scripts/recommendation_engine.py
```

## 🎯 Contributing Guidelines

### What We're Looking For

**High Priority Contributions:**
- 🎵 **Music recommendation improvements** - Better algorithms, new features
- 🤖 **AI/ML enhancements** - Smarter chat interface, personalization
- 🔧 **API development** - New endpoints, better documentation
- 🚀 **Performance optimizations** - Faster responses, better caching
- 🛡️ **Security improvements** - Authentication, data protection
- 📚 **Documentation** - Code comments, guides, examples
- 🧪 **Testing** - Unit tests, integration tests, bug fixes

**Medium Priority:**
- 🎨 **UI/UX improvements** - Better design, accessibility
- 📱 **Mobile optimization** - Responsive design, PWA features
- 🌍 **Internationalization** - Multi-language support
- 📊 **Analytics features** - User insights, listening patterns

### Types of Contributions

#### 🐛 Bug Reports
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node.js version)
- Screenshots or error logs (if applicable)

#### 💡 Feature Requests
- Clear use case and problem statement
- Proposed solution or approach
- Consider backward compatibility
- Discuss implementation complexity

#### 🔧 Code Contributions
- Follow our coding standards
- Include comprehensive tests
- Update documentation as needed
- Ensure backward compatibility
- Performance impact assessment

## 💻 Coding Standards

### JavaScript/Node.js

```javascript
// Use modern ES6+ features
const recommendationEngine = async (userId, options = {}) => {
    try {
        // Use descriptive variable names
        const userListeningHistory = await getUserHistory(userId);
        const personalizedTracks = await generateRecommendations(
            userListeningHistory,
            options
        );

        return {
            tracks: personalizedTracks,
            generated_at: new Date().toISOString(),
            algorithm: 'collaborative_filtering_v2'
        };
    } catch (error) {
        // Comprehensive error handling
        console.error('Recommendation generation failed:', error);
        throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
};

// JSDoc comments for functions
/**
 * Generate personalized music recommendations
 * @param {string} userId - Spotify user ID
 * @param {Object} options - Recommendation options
 * @param {number} options.limit - Number of tracks to return
 * @param {string[]} options.seed_genres - Seed genres for recommendations
 * @returns {Promise<Object>} Recommendation response
 */
```

### Python/ML Code

```python
import pandas as pd
import numpy as np
from typing import List, Dict, Optional

class RecommendationEngine:
    """Advanced music recommendation engine using collaborative filtering."""

    def __init__(self, model_version: str = "v2") -> None:
        self.model_version = model_version
        self.is_trained = False

    def train_model(self, interaction_data: pd.DataFrame) -> bool:
        """Train the recommendation model with user interaction data.

        Args:
            interaction_data: DataFrame with user_id, track_id, rating columns

        Returns:
            bool: True if training successful, False otherwise

        Raises:
            ValueError: If required columns are missing from input data
        """
        try:
            # Validate input data
            required_columns = ['user_id', 'track_id', 'rating']
            if not all(col in interaction_data.columns for col in required_columns):
                raise ValueError(f"Missing required columns: {required_columns}")

            # Training logic here
            self.is_trained = True
            return True

        except Exception as e:
            print(f"Training failed: {e}")
            return False
```

### Code Style Rules

#### JavaScript
- Use **ESLint** configuration (automatic formatting)
- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** at line endings
- **camelCase** for variables and functions
- **PascalCase** for classes and constructors
- **UPPER_SNAKE_CASE** for constants

#### Python
- Follow **PEP 8** style guide
- **4 spaces** for indentation
- **Type hints** for function parameters and returns
- **snake_case** for variables and functions
- **PascalCase** for classes
- **Docstrings** for all public functions and classes

#### General
- **Descriptive variable names** - avoid abbreviations
- **Small functions** - single responsibility principle
- **Comprehensive error handling** - try/catch blocks
- **Logging** - use console.log/print for debugging
- **Comments** - explain complex logic, not obvious code

## 🧪 Testing Requirements

### Testing Standards

All contributions must include appropriate tests:

#### Unit Tests
```javascript
// Jest test example
describe('RecommendationEngine', () => {
    let engine;

    beforeEach(() => {
        engine = new RecommendationEngine();
    });

    it('should generate recommendations for valid user', async () => {
        // Arrange
        const userId = 'test_user_123';
        const mockData = { tracks: [], total: 0 };

        // Mock external dependencies
        jest.spyOn(engine, 'fetchUserData').mockResolvedValue(mockData);

        // Act
        const result = await engine.getRecommendations(userId);

        // Assert
        expect(result).toBeDefined();
        expect(result.tracks).toBeInstanceOf(Array);
        expect(engine.fetchUserData).toHaveBeenCalledWith(userId);
    });

    it('should handle errors gracefully', async () => {
        // Test error conditions
        const invalidUserId = null;

        await expect(engine.getRecommendations(invalidUserId))
            .rejects.toThrow('Invalid user ID');
    });
});
```

#### Integration Tests
```javascript
// API endpoint testing
describe('GET /api/recommendations', () => {
    it('should return recommendations for authenticated user', async () => {
        const response = await request(app)
            .get('/api/recommendations')
            .set('Authorization', `Bearer ${validToken}`)
            .expect(200);

        expect(response.body.tracks).toBeDefined();
        expect(response.body.tracks.length).toBeGreaterThan(0);
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="RecommendationEngine"

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Requirements

- **Minimum 80% code coverage** for new features
- **100% coverage** for critical business logic
- **Edge case testing** - error conditions, boundary values
- **Integration testing** - API endpoints, database operations
- **Performance testing** - load testing for recommendation generation

## 📝 Pull Request Process

### Before Submitting

1. **Update your fork** with latest changes from main
2. **Run full test suite** and ensure all tests pass
3. **Run linting** and fix any style issues
4. **Update documentation** if you've changed APIs
5. **Test your changes** thoroughly in development environment

### Pull Request Template

```markdown
## 🎯 Description
Brief description of changes and motivation.

## 🔄 Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## 🧪 Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Edge cases covered
- [ ] Manual testing completed

## 📚 Documentation
- [ ] Code comments updated
- [ ] API documentation updated (if applicable)
- [ ] README updated (if applicable)
- [ ] Roadmap format maintained (if editing roadmap files)

### Roadmap Format Guidelines

When contributing to roadmap files (`docs/roadmap/*.md`), please maintain these formats for automated parsing:

**Table Format:**
```markdown
| ID | Title | Category | Priority | Status |
|---|---|---|---|---|
| FEATURE-001 | New Feature | Enhancement | High | Planned |
```

**Bullet List Format:**
```markdown
- [x] ITEM-001: Completed item (Priority: High, Status: Done, Category: Feature)
- [ ] ITEM-002: Planned item (Priority: Medium, Status: Planned, Category: Bug Fix)
```

This ensures the automated roadmap index generation continues to work properly.

## 📋 Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No security vulnerabilities introduced
- [ ] Performance impact assessed
- [ ] Backward compatibility maintained

## 🔗 Related Issues
Closes #(issue number)

## 📷 Screenshots (if applicable)
Include screenshots for UI changes.
```

### Review Process

1. **Automated checks** must pass (linting, tests, security scans)
2. **Code review** by at least one maintainer
3. **Testing verification** in staging environment
4. **Documentation review** for completeness
5. **Final approval** and merge

## 🐛 Issue Reporting

### Bug Report Template

```markdown
## 🐛 Bug Description
Clear and concise description of the bug.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## 💭 Expected Behavior
What you expected to happen.

## 📷 Screenshots
If applicable, add screenshots.

## 🖥️ Environment
- OS: [e.g. iOS, Windows, Linux]
- Browser: [e.g. chrome, safari]
- Node.js version: [e.g. 20.1.0]
- App version: [e.g. 1.2.3]

## 📋 Additional Context
Any other context about the problem.
```

### Feature Request Template

```markdown
## 🚀 Feature Request

## 🎯 Problem Statement
What problem does this feature solve?

## 💡 Proposed Solution
Describe your ideal solution.

## 🔄 Alternative Solutions
Other approaches you've considered.

## 📊 Impact Assessment
- Who benefits from this feature?
- How often would it be used?
- Implementation complexity?

## 📋 Additional Context
Any other context or screenshots.
```

## 🌟 Recognition

### Contributors

All contributors will be recognized in:
- **README.md** - Contributors section
- **CHANGELOG.md** - Release notes
- **GitHub Releases** - Feature credits

### Types of Recognition

- 🏆 **Major Features** - Spotlight in release announcements
- 🐛 **Bug Fixes** - Listed in changelog
- 📚 **Documentation** - Credited in docs
- 🧪 **Testing** - Quality assurance credits

## 💬 Community

### Communication Channels

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - General questions, ideas
- **Discord** - Real-time chat with community
- **Email** - Maintainer contact for sensitive issues

### Getting Help

1. **Check existing documentation** first
2. **Search existing issues** for similar problems
3. **Ask in GitHub Discussions** for general questions
4. **Create an issue** for bugs or feature requests
5. **Join Discord** for real-time help

## 📅 Release Process

### Version Strategy

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality
- **PATCH** version for backward-compatible bug fixes

### Release Schedule

- **Major releases**: Quarterly (every 3 months)
- **Minor releases**: Monthly feature updates
- **Patch releases**: As needed for critical bugs

---

## 🙏 Thank You

Your contributions make EchoTune AI better for everyone! Whether it's code, documentation, bug reports, or feature ideas - every contribution matters.

**Happy coding! 🎵**

---

**Last Updated**: January 2024
**Contributing Guide Version**: v1.0
