# EchoTune AI - Optimized Cursor Coding Instructions for GitHub Automation

## 🤖 GitHub Coding Agent Integration - Copy & Paste Ready

### Configuration Overview
This configuration optimizes Cursor AI for automated GitHub coding workflows with integrated Perplexity research and roadmap automation.

---

## 🚀 Quick Setup Instructions

### 1. **Environment Setup**
```bash
# Copy these environment variables to Cursor
PERPLEXITY_API_KEY=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
GITHUB_PAT=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
MONGODB_URI=mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### 2. **Cursor Rules Configuration**
**Copy this entire section to your `.cursorrules` file:**

```
# 🎵 EchoTune AI - GitHub Coding Agent Rules (2025-08-24)

## Project Context
EchoTune AI - Advanced music recommendation platform with autonomous coding agent integration
- Tech Stack: Node.js + React + MongoDB + Redis + Python ML + Perplexity API
- Status: 26% complete, 38 tasks in roadmap, automation-ready
- Focus: Autonomous coding cycles with repository analysis and roadmap updates

## Automation Workflow
1. **Coding Agent**: Complete tasks from roadmap using established patterns
2. **Perplexity Research**: Analyze repository + roadmap with sonar-pro model
3. **Roadmap Updates**: Generate new tasks based on analysis findings
4. **Continuous Cycle**: Repeat for autonomous development

## Coding Standards
- **JavaScript**: ES2024+, async/await only, comprehensive error handling
- **React**: React 19 + Vite, component-based architecture, performance optimized
- **Node.js**: Express.js, modular architecture, middleware patterns
- **Database**: MongoDB aggregation pipelines, proper indexing, Redis caching
- **AI Integration**: Real API calls only - NO MOCK implementations
- **Testing**: Jest + React Testing Library, >80% coverage for business logic

## File Priorities (Always include in context)
1. GitHubCodingAgentPerplexity.js - Main automation integration
2. AUTONOMOUS_DEVELOPMENT_ROADMAP.md - Current roadmap
3. package.json - Dependencies and scripts
4. server.js - Main backend server
5. src/frontend/App.jsx - Main React component
6. .env - Environment configuration

## Security Requirements
- Input validation for all user data
- Rate limiting on API endpoints
- HTTPS only in production
- OAuth best practices
- No hardcoded secrets (use env vars)

## Performance Targets
- API responses: <500ms for simple, <2s for complex
- Database queries: <100ms simple, <1s complex
- Frontend: First Contentful Paint <1.5s
- Perplexity API: <30s for full repository analysis

## Automation Commands
Use these commands to trigger automation workflows:
- `node GitHubCodingAgentPerplexity.js` - Test integration
- `node test-full-automation-workflow.js` - Complete workflow test
- Repository analysis: Uses sonar-pro model for comprehensive insights
- Roadmap generation: Creates actionable tasks with effort estimates

## Current Priority Tasks (From Latest Analysis)
1. [P0] Integrate LangGraph for Multi-Agent Orchestration (Large, High Automation)
2. [P0] AI-Driven DevOps Automation (Medium, High Automation) 
3. [P1] Implement Explainable AI & Ethical Compliance (Large, Medium Automation)
4. [P1] Edge Computing & Federated Learning Integration (Large, High Automation)
5. [P1] Advanced Monitoring & Self-Healing Systems (Medium, High Automation)

## Code Patterns
**API Integration Pattern:**
```javascript
async function makeAPICall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: { 
                'Authorization': `Bearer ${process.env.API_KEY}`,
                ...options.headers 
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
```

**React Component Pattern:**
```jsx
import React, { useState, useEffect } from 'react';

function Component({ prop1, prop2 }) {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const data = await apiCall();
                setState(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchData();
    }, [prop1, prop2]);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div className="component">
            {/* Component content */}
        </div>
    );
}

export default Component;
```

## Database Query Pattern
```javascript
// MongoDB with proper error handling and indexing
async function queryDatabase(collection, filter, options = {}) {
    try {
        const db = await connectToDatabase();
        const result = await db.collection(collection)
            .find(filter)
            .sort(options.sort || { createdAt: -1 })
            .limit(options.limit || 50)
            .toArray();
            
        return result;
    } catch (error) {
        console.error('Database query failed:', error);
        throw new Error('Database operation failed');
    }
}
```

## Testing Pattern
```javascript
// Jest test with proper setup and mocking
describe('Feature', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('should handle success case', async () => {
        // Arrange
        const mockData = { id: 1, name: 'test' };
        jest.spyOn(api, 'getData').mockResolvedValue(mockData);
        
        // Act
        const result = await feature.process();
        
        // Assert
        expect(result).toEqual(mockData);
        expect(api.getData).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('should handle error case', async () => {
        // Arrange
        jest.spyOn(api, 'getData').mockRejectedValue(new Error('API Error'));
        
        // Act & Assert
        await expect(feature.process()).rejects.toThrow('API Error');
    });
});
```

## When Creating New Features
1. Follow established patterns from existing codebase
2. Include comprehensive error handling
3. Add proper logging with console.log/error
4. Create tests for business logic
5. Update documentation if needed
6. Use TypeScript-style JSDoc comments
7. Consider performance implications
8. Implement proper validation

## Current Architecture Insights (From Perplexity Analysis)
- Modern microservices with MCP integration
- Strong API foundation with room for optimization
- Automation opportunities in ML workflows and API monitoring
- Need for enhanced caching, security auditing, and CI/CD
- Ready for agent-driven development acceleration

Remember: Focus on production-ready, scalable code that follows existing patterns and maintains high quality standards.
```

---

## 🔧 Advanced Configuration

### 3. **Cursor Settings.json**
**Add to your Cursor settings:**

```json
{
  "cursor.cpp.enableIntelliSense": true,
  "cursor.general.enableCursorIntellisense": true,
  "cursor.experimental.enableCodeCompletion": true,
  "editor.inlineSuggest.enabled": true,
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true,
    "javascript": true,
    "typescript": true,
    "python": true
  },
  "cursor.general.enableCodeLens": true,
  "editor.suggestOnTriggerCharacters": true,
  "editor.acceptSuggestionOnEnter": "smart",
  "editor.quickSuggestionsDelay": 10,
  "cursor.composer.enableInlineEdit": true
}
```

### 4. **Keyboard Shortcuts for Automation**
**Add these shortcuts for quick automation:**
- `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Win): Run automation analysis
- `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win): Update roadmap
- `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Win): Run tests

---

## 🚀 Automated Workflow Commands

### **Copy-Paste Terminal Commands:**

```bash
# 1. Initialize automation environment
cd /path/to/Spotify-echo
npm install
source .env

# 2. Test Perplexity integration
node GitHubCodingAgentPerplexity.js

# 3. Run full automation workflow (repository analysis + roadmap updates)
node test-full-automation-workflow.js

# 4. Start development server with automation
npm run dev

# 5. Run tests with coverage
npm test -- --coverage

# 6. Check automation health
node -e "
const automation = require('./GitHubCodingAgentPerplexity');
const instance = new automation();
instance.quickAutomationCheck().then(result => {
  console.log('Automation Status:', result.success ? '✅ READY' : '❌ ISSUES');
  if (result.insights) console.log('Latest Insights Available');
});
"
```

---

## 📋 Task Automation Workflow

### **Complete Automation Cycle (Copy-Paste Ready):**

```bash
#!/bin/bash
# EchoTune AI - Complete Automation Cycle

echo "🤖 Starting EchoTune AI Automation Cycle"
echo "========================================"

# Step 1: Run full automation analysis
echo "📊 Step 1: Repository & Roadmap Analysis..."
node test-full-automation-workflow.js

# Step 2: Check for generated tasks
echo "📋 Step 2: Checking generated tasks..."
if [ -f "perplexity-roadmap-analysis-*.md" ]; then
    echo "✅ New roadmap analysis available"
    ls -la perplexity-roadmap-analysis-*.md
else
    echo "⚠️ No new roadmap analysis found"
fi

# Step 3: Run tests to ensure system health
echo "🧪 Step 3: Running system tests..."
npm test

# Step 4: Start development server
echo "🚀 Step 4: Starting development server..."
echo "💡 Ready for automated coding workflow!"
npm run dev
```

---

## 🎯 Priority Implementation Guide

Based on the latest Perplexity analysis, focus on these areas:

### **Immediate (This Week):**
1. **Multi-Agent Orchestration** - Integrate LangGraph for advanced workflow management
2. **AI-Driven DevOps** - Automate code review and testing with GitHub Copilot integration
3. **Performance Optimization** - Profile MongoDB queries and optimize React components

### **Short-term (Next 2 Weeks):**
1. **Explainable AI Module** - Add model transparency and bias tracking
2. **Enhanced Monitoring** - Implement self-healing systems and anomaly detection
3. **Security Hardening** - Automate vulnerability scanning and secret rotation

### **Medium-term (Next Month):**
1. **Edge Computing Integration** - Add federated learning capabilities
2. **Advanced Analytics** - Real-time user behavior analysis and optimization
3. **Mobile PWA** - Progressive Web App implementation

---

## 💡 Usage Tips for Maximum Efficiency

### **In Cursor IDE:**
1. **Always include** `GitHubCodingAgentPerplexity.js` in your context when working on automation
2. **Use the roadmap** (`AUTONOMOUS_DEVELOPMENT_ROADMAP.md`) as reference for task priorities
3. **Follow established patterns** - look at existing code before creating new features
4. **Test frequently** - run `node test-full-automation-workflow.js` after major changes
5. **Monitor performance** - check API response times and database query performance

### **Best Practices:**
- **Start with small changes** - implement one feature at a time
- **Use real APIs only** - never create mock implementations
- **Follow error handling patterns** - comprehensive try/catch blocks
- **Maintain test coverage** - add tests for new functionality
- **Update documentation** - keep README and roadmap current

---

## 🔄 Continuous Integration with GitHub

### **GitHub Actions Integration:**
The repository includes automated workflows that:
- Run Perplexity analysis on PR creation
- Update roadmaps based on code changes
- Validate API integrations
- Deploy to production after successful tests

### **Commit Message Format:**
```
feat: Add LangGraph multi-agent orchestration integration

- Implement agent graph for workflow management
- Add stateful conversation handling
- Include comprehensive error handling and logging
- Update roadmap with new automation capabilities

Perplexity-Analysis: Repository analysis suggests 40% efficiency improvement
Tasks-Generated: 3 new high-priority automation tasks
```

---

This configuration provides a complete, copy-paste ready setup for automated GitHub coding workflows with EchoTune AI. The integration ensures continuous improvement through Perplexity-powered analysis and roadmap generation.