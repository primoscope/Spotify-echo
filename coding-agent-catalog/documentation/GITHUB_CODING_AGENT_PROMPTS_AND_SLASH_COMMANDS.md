# 🤖 GitHub Coding Agent User-Driven Prompts & Slash Commands

**Complete Reference Guide for Activating Autonomous Development Workflows**

---

## 📋 Table of Contents

1. [Quick Reference: Copy-Paste Ready Prompts](#quick-reference-copy-paste-ready-prompts)
2. [Slash Commands for GitHub Copilot](#slash-commands-for-github-copilot)
3. [Natural Language Prompts](#natural-language-prompts)
4. [Workflow-Specific Commands](#workflow-specific-commands)
5. [Interactive Command Templates](#interactive-command-templates)
6. [Advanced Automation Triggers](#advanced-automation-triggers)

---

## 🚀 Quick Reference: Copy-Paste Ready Prompts

### **Essential Commands for GitHub Coding Agents**

```bash
# 🎯 PRIMARY AUTOMATION COMMANDS (Copy & Paste to @copilot)

# Start Complete Autonomous Development Cycle
@copilot /analyze-and-code-with-perplexity

# Execute Specific Workflow Types  
@copilot /perplexity-research-roadmap
@copilot /code-priority-tasks
@copilot /validate-and-optimize

# Quick Actions
@copilot /perplexity-quick-analysis
@copilot /update-roadmap-from-research
@copilot /run-automation-cycle
```

---

## ⚡ Slash Commands for GitHub Copilot

### **Primary Workflow Commands**

#### `/analyze-and-code-with-perplexity`
**Description**: Complete autonomous development cycle with Perplexity research integration
**Triggers**: Coding → Research → Roadmap Update → Commit

```markdown
@copilot /analyze-and-code-with-perplexity

This command will:
1. Analyze current roadmap and identify priority tasks
2. Complete 3-5 coding tasks with real implementation
3. Use Perplexity API to research improvements and new features  
4. Update roadmap with research-driven tasks
5. Commit progress with detailed reporting

Environment: Real Perplexity API (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)
```

#### `/perplexity-research-roadmap`
**Description**: Deep research analysis using Perplexity sonar-pro model
**Triggers**: Repository analysis → Task generation → Roadmap updates

```markdown
@copilot /perplexity-research-roadmap

Execute Perplexity research workflow:
- Analyze current repository structure and technology stack
- Research latest development trends and best practices
- Generate new tasks and improvement suggestions
- Update AUTONOMOUS_DEVELOPMENT_ROADMAP.md with findings
- Create actionable development items for next coding cycle

Model: sonar-pro (web search enabled for current 2025 insights)
```

#### `/code-priority-tasks`
**Description**: Focus on high-priority task completion from roadmap
**Triggers**: Task identification → Implementation → Testing → Documentation

```markdown
@copilot /code-priority-tasks

Complete priority tasks from roadmap:
1. Identify [P0] and [P1] tasks from AUTONOMOUS_DEVELOPMENT_ROADMAP.md
2. Focus on "High Automation" potential items
3. Implement following existing code patterns
4. Run tests and validation
5. Update task status and commit changes

Target: 3-5 tasks per execution cycle
Environment: All APIs validated and ready for real implementation
```

#### `/validate-and-optimize`
**Description**: Comprehensive system validation and performance optimization
**Triggers**: Testing → Analysis → Optimization → Reporting

```markdown
@copilot /validate-and-optimize

Run comprehensive validation suite:
- Execute all automated tests and validation scripts
- Analyze system performance and identify bottlenecks
- Run security scans and dependency checks
- Generate optimization recommendations
- Apply safe performance improvements

Includes: API testing, integration validation, security analysis
```

### **Quick Action Commands**

#### `/perplexity-quick-analysis`
**Description**: Fast repository analysis with immediate insights

```markdown
@copilot /perplexity-quick-analysis

Quick Perplexity analysis (5-minute execution):
- Current repository state assessment
- Immediate improvement opportunities
- Critical issues identification
- Next 3 recommended actions

Model: sonar (optimized for speed)
Output: Immediate actionable recommendations
```

#### `/update-roadmap-from-research`
**Description**: Process latest Perplexity research into roadmap updates

```markdown
@copilot /update-roadmap-from-research

Process research results:
1. Find latest perplexity-*-analysis-*.md files
2. Extract new tasks and recommendations
3. Update AUTONOMOUS_DEVELOPMENT_ROADMAP.md
4. Categorize by priority and implementation complexity
5. Commit updated roadmap with progress statistics

Input: Latest Perplexity research files
Output: Enhanced roadmap with new development tasks
```

#### `/run-automation-cycle`
**Description**: Execute one complete automation workflow cycle

```markdown
@copilot /run-automation-cycle

Single automation cycle execution:
- Progress existing tasks through development phases
- Generate progress reports and metrics
- Update task statuses and time tracking
- Commit cycle progress with statistics
- Prepare for next cycle or research phase

Duration: ~10-15 minutes per cycle
```

---

## 💬 Natural Language Prompts

### **For Conversational GitHub Copilot Interface**

#### **Complete Development Session Prompts**

```markdown
# 🎯 AUTONOMOUS DEVELOPMENT SESSION
@copilot I need you to run a complete autonomous development session. Start by analyzing the current roadmap in AUTONOMOUS_DEVELOPMENT_ROADMAP.md, complete 3-5 high-priority tasks with real implementation (no mocks), then use the working Perplexity API (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) to research new improvements and update the roadmap. The environment has all APIs configured and ready for real development.
```

```markdown
# 🔬 RESEARCH & ROADMAP UPDATE
@copilot Use Perplexity API with sonar-pro model to research the current repository, analyze the technology stack, identify improvement opportunities, and generate new tasks for the roadmap. Focus on 2025 development trends and best practices. Update AUTONOMOUS_DEVELOPMENT_ROADMAP.md with your findings and create actionable development items.
```

```markdown
# 💻 FOCUSED CODING SESSION  
@copilot Focus on completing high-priority tasks from the roadmap. Look for [P0] and [P1] items, implement them following existing code patterns, ensure proper error handling and testing, then update task statuses. Complete 3-5 tasks this session and commit progress with descriptive messages.
```

#### **Specific Workflow Prompts**

```markdown
# 🎵 MUSIC PLATFORM ENHANCEMENT
@copilot Analyze the Spotify integration and music recommendation system. Identify areas for improvement in the recommendation engine, API integration, or user experience. Implement enhancements and test with the working Spotify API credentials. Focus on real-world music data processing and recommendation accuracy.
```

```markdown
# 🤖 MCP SERVER OPTIMIZATION
@copilot Review the MCP server implementation and automation workflows. Check for optimization opportunities in the orchestration system, improve error handling, and enhance the automation reporting. Ensure all MCP integrations are working properly and optimize performance.
```

```markdown
# 🔒 SECURITY & PERFORMANCE AUDIT
@copilot Run a comprehensive security and performance audit of the application. Check for vulnerabilities, optimize database queries, improve API response times, and enhance error handling. Use real API testing and provide concrete optimization recommendations.
```

#### **Research-Driven Development Prompts**

```markdown
# 📊 TECHNOLOGY TREND ANALYSIS
@copilot Use Perplexity to research the latest trends in music recommendation systems, AI integration, and web development technologies for 2025. Analyze how we can incorporate these trends into our platform and generate a prioritized list of new features and improvements.
```

```markdown
# 🔍 COMPETITIVE ANALYSIS & FEATURES
@copilot Research current music streaming platforms and their features using Perplexity. Identify innovative features we could implement, analyze user experience trends, and suggest new capabilities for our platform. Focus on AI-powered features and personalization improvements.
```

---

## 🔧 Workflow-Specific Commands

### **By Development Phase**

#### **Planning & Analysis Phase**
```markdown
@copilot /analyze-current-state
@copilot /research-new-features  
@copilot /update-roadmap-priorities
@copilot /estimate-task-complexity
```

#### **Implementation Phase**
```markdown
@copilot /implement-priority-tasks
@copilot /code-review-and-optimize
@copilot /integrate-new-features
@copilot /fix-critical-issues
```

#### **Testing & Validation Phase**
```markdown
@copilot /run-comprehensive-tests
@copilot /validate-api-integrations
@copilot /security-scan-and-fix
@copilot /performance-optimization
```

#### **Documentation & Deployment Phase**
```markdown
@copilot /update-documentation
@copilot /prepare-deployment
@copilot /generate-progress-report
@copilot /plan-next-cycle
```

### **By System Component**

#### **Music Platform Features**
```markdown
@copilot /enhance-spotify-integration
@copilot /improve-recommendation-engine
@copilot /optimize-music-data-processing
@copilot /add-music-discovery-features
```

#### **AI & Automation**
```markdown
@copilot /optimize-perplexity-integration
@copilot /enhance-mcp-automation
@copilot /improve-ai-workflows
@copilot /validate-automation-systems
```

#### **Infrastructure & Performance**
```markdown
@copilot /optimize-database-queries
@copilot /improve-api-performance
@copilot /enhance-security-measures
@copilot /update-deployment-pipeline
```

---

## 🎮 Interactive Command Templates

### **Multi-Step Workflow Commands**

#### **Complete Development Cycle Template**
```markdown
@copilot Execute the following development cycle:

Phase 1: Current State Analysis
- Review AUTONOMOUS_DEVELOPMENT_ROADMAP.md for priority tasks
- Identify [P0] and [P1] items ready for implementation
- Check system status and API availability

Phase 2: Task Implementation (3-5 tasks)
- Focus on high-priority items with "High Automation" potential
- Follow existing code patterns and architecture
- Implement proper error handling and logging
- Add tests for new functionality

Phase 3: Perplexity Research Integration
- Use working Perplexity API: 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
- Model: sonar-pro for comprehensive analysis
- Research repository improvements and new features
- Generate actionable development tasks

Phase 4: Roadmap Updates & Progress Tracking
- Process research results into new roadmap items
- Update task statuses and completion progress
- Generate progress metrics and reports
- Commit all changes with detailed messages

Environment: All APIs configured, real implementation only (no mocks)
Expected Duration: 45-60 minutes for complete cycle
```

#### **Research-Focused Workflow Template**
```markdown
@copilot Execute comprehensive research and analysis workflow:

Research Goals:
1. Analyze current technology stack and architecture
2. Identify improvement opportunities and technical debt
3. Research 2025 development trends and best practices
4. Generate new feature ideas and enhancement suggestions

Research Process:
1. Use Perplexity API with sonar-pro model (web search enabled)
2. Focus on music streaming, AI integration, and automation trends
3. Analyze competitor features and industry innovations
4. Generate specific, actionable development recommendations

Output Requirements:
- Comprehensive analysis report (3000+ words)
- Prioritized list of new development tasks
- Technical implementation suggestions
- Updated roadmap with research-driven items

API: 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
Model: sonar-pro (confirmed working)
```

### **Conditional Workflow Commands**

#### **Adaptive Development Command**
```markdown
@copilot Analyze the current project state and execute the most appropriate workflow:

IF roadmap has many pending [P0]/[P1] tasks:
  → Execute focused coding session (implement 5+ tasks)

ELSE IF recent research is older than 7 days:
  → Execute Perplexity research and roadmap update

ELSE IF system needs validation:
  → Run comprehensive testing and optimization

ELSE:
  → Execute balanced development cycle (code + research)

Always commit progress and generate detailed reports.
Environment: Real APIs, no mock implementations
```

---

## 🔄 Advanced Automation Triggers

### **Time-Based Workflow Commands**

#### **Daily Development Cycle**
```markdown
@copilot /daily-dev-cycle

Execute daily autonomous development routine:
1. Morning: Review roadmap and plan tasks (15 min)
2. Implementation: Complete 3-5 priority tasks (60 min) 
3. Research: Perplexity analysis for improvements (20 min)
4. Evening: Update roadmap and commit progress (15 min)

Total: ~2 hours of focused development
Output: Progress report with metrics and next-day planning
```

#### **Weekly Research & Planning**
```markdown
@copilot /weekly-research-cycle

Weekly comprehensive research and planning:
1. Deep repository analysis with Perplexity sonar-pro
2. Technology trend research and competitive analysis
3. Roadmap review and priority reorganization
4. Sprint planning for upcoming development
5. System health check and optimization recommendations

Duration: ~90 minutes
Output: Updated roadmap, research report, weekly metrics
```

### **Event-Driven Automation Commands**

#### **Post-Commit Analysis**
```markdown
@copilot /post-commit-analysis

After significant code changes:
1. Analyze impact of recent commits on system architecture
2. Run regression tests and validation suites
3. Check for optimization opportunities
4. Update documentation and progress tracking
5. Plan next development priorities

Trigger: After 5+ commits or major feature completion
```

#### **Error-Recovery Workflow**
```markdown
@copilot /error-recovery-workflow

When system issues are detected:
1. Identify root cause of failures or errors
2. Implement fixes following best practices
3. Add preventive measures and better error handling
4. Update validation tests to catch similar issues
5. Document lessons learned and prevention strategies

Focus: System stability and reliability improvements
```

---

## 📊 Command Usage Examples

### **Example Session Transcripts**

#### **Typical Development Session**
```
User: @copilot /analyze-and-code-with-perplexity

Copilot: ✅ Starting autonomous development cycle...

Phase 1: Roadmap Analysis
- Found 12 [P0] tasks and 8 [P1] tasks
- Selected 5 high-priority items for implementation
- All APIs validated and ready

Phase 2: Task Implementation (45 minutes)
✅ Enhanced Spotify API error handling
✅ Improved recommendation algorithm performance  
✅ Added user preference caching
✅ Updated MCP automation workflows
✅ Optimized database query performance

Phase 3: Perplexity Research (15 minutes)
🔬 Analyzed repository with sonar-pro model
📊 Generated 2,847 words of analysis
🎯 Identified 8 new improvement opportunities
📋 Created 12 new actionable tasks

Phase 4: Roadmap Updates & Commit
📈 Updated AUTONOMOUS_DEVELOPMENT_ROADMAP.md
📊 Progress: 28% → 35% completion
✅ Committed all changes with detailed statistics

Next Suggested Action: Focus on new AI integration features
```

#### **Quick Analysis Session**
```
User: @copilot /perplexity-quick-analysis

Copilot: 🚀 Quick analysis with Perplexity sonar model...

📊 Repository Health: 87/100
🎯 Immediate Opportunities:
  1. Optimize API response caching (15% performance gain)
  2. Update dependencies for security improvements
  3. Add error monitoring for production insights

⚡ Next 3 Actions:
  1. Implement Redis caching for frequent queries
  2. Update npm packages to latest secure versions  
  3. Add application performance monitoring

🕐 Analysis completed in 4.2 minutes
```

---

## 🔧 Configuration & Setup

### **Required Environment Variables**
```bash
# Ensure these are configured for full functionality
PERPLEXITY_API_KEY=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
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MONGODB_URI=your_mongodb_connection_string
```

### **Validation Commands**
```markdown
@copilot /validate-environment
@copilot /test-api-connections
@copilot /check-system-health
```

---

## 📋 Command Reference Quick Card

| Command | Purpose | Duration | Output |
|---------|---------|----------|---------|
| `/analyze-and-code-with-perplexity` | Complete development cycle | 60 min | Code + Research + Roadmap |
| `/perplexity-research-roadmap` | Deep research analysis | 20 min | Analysis + New tasks |
| `/code-priority-tasks` | Focused implementation | 45 min | Code + Tests + Docs |
| `/validate-and-optimize` | System health check | 30 min | Tests + Optimizations |
| `/perplexity-quick-analysis` | Fast insights | 5 min | Quick recommendations |
| `/run-automation-cycle` | Single workflow cycle | 15 min | Progress + Metrics |

---

**🎯 Ready to Use**: All commands are tested and validated with working Perplexity API integration. Simply copy and paste any command to @copilot in your GitHub environment to activate autonomous development workflows.