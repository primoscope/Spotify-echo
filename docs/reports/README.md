# Enhanced Perplexity Browser Research Reports for PRs

This repository includes an advanced automated workflow to generate comprehensive research reports for pull requests using Perplexity with browser research capabilities and Cursor AI agent optimization.

## 🌟 Key Features

### 🤖 Enhanced AI Analysis
- **Multi-source research** with browser validation
- **Real-time web research** for latest best practices and security patterns
- **Cursor AI agent optimization** with specific configuration recommendations
- **Intelligent source verification** using browser automation
- **Comprehensive citation system** with working links and validation

### 🔍 Browser Research Integration
- **Live source validation** through browser automation
- **Cross-reference verification** across multiple authoritative sources
- **Dynamic content extraction** for the most current information
- **Source credibility scoring** and quality assessment
- **Real-time screenshot capture** and content verification

### ⚡ Advanced Workflow Features
- **Three trigger methods**: Labels, slash commands, and manual dispatch
- **Configurable depth**: Brief or deep analysis modes
- **Model selection**: Choose from sonar-pro, sonar-small, or other models
- **Browser toggle**: Enable/disable browser research per request
- **Performance monitoring** with detailed metrics and timing

## 📋 Setup Instructions

### Required Configuration
1. **Perplexity API**: Add repository secret `PERPLEXITY_API_KEY`
2. **Browser Research**: Add repository secret `BROWSERBASE_API_KEY` (optional but recommended)
3. **Model Selection**: Set repository variable `PERPLEXITY_MODEL` (default: sonar-pro)

### Environment Variables
```env
# Core Research
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PERPLEXITY_MODEL=sonar-pro

# Enhanced Browser Research (Optional)
BROWSERBASE_API_KEY=your_browserbase_api_key_here
ENABLE_BROWSER_RESEARCH=true

# GitHub Integration (Automatically provided)
GITHUB_TOKEN=automatic
```

### Repository Variables (Optional)
- `PERPLEXITY_MODEL`: Choose model (sonar-pro, sonar-small)
- `ENABLE_BROWSER_RESEARCH`: Enable/disable browser features (true/false)

## 🚀 Usage Methods

### 1. Label Trigger (Recommended)
Add the `run-perplexity-research` label to any pull request for automatic analysis.

### 2. Slash Commands (Advanced)
Comment on PR with enhanced command options:

```bash
# Basic usage
/run-perplexity-research

# With specific model
/run-perplexity-research --model=sonar-pro

# Control analysis depth
/run-perplexity-research --depth=deep

# Disable browser research for faster results
/run-perplexity-research --browser=disabled

# Combined options
/run-perplexity-research --model=sonar-pro --depth=brief --browser=enabled
```

### 3. Manual Workflow Dispatch
Use the Actions tab → "Enhanced Perplexity Browser Research Report" → Run workflow with:
- **PR Number**: Target pull request
- **Enable Browser**: Toggle browser research capabilities

## 📊 Analysis Capabilities

### Core Analysis Areas
1. **Executive Summary** with Cursor AI integration recommendations
2. **Security Review** with browser-validated threat intelligence
3. **Performance Impact** analysis with real-time benchmarking data
4. **AgentOps Integration** correctness and best practices
5. **Spotify API** rate limiting and fault-tolerance patterns
6. **Architecture Assessment** with industry standard comparisons
7. **Dependency Analysis** with live vulnerability checking

### Cursor AI Integration Features
- **.cursorrules optimization** suggestions
- **AI model selection** recommendations based on task type
- **Context awareness** improvements for better code assistance
- **Automated workflow triggers** for development efficiency
- **MCP server integration** guidance for enhanced capabilities

### Browser Research Enhancements
- **Real-time source validation** from authoritative technical sites
- **Cross-reference checking** across GitHub, Stack Overflow, official docs
- **Latest best practices** from current industry resources
- **Security vulnerability data** from live threat intelligence feeds
- **Performance benchmarks** from recent studies and implementations

## 🔧 Advanced Configuration

### Cursor AI Integration
Generate optimized Cursor AI configuration:

```bash
# Generate Cursor AI configuration
node scripts/research/cursor-ai-integration.js

# Review generated configuration
cat cursor-ai-config.json
```

### Custom Research Domains
The browser research focuses on these authoritative sources:
- **GitHub**: Latest code patterns and implementations
- **Stack Overflow**: Community solutions and best practices  
- **Official Documentation**: Spotify API, MongoDB, Redis, React
- **Security Resources**: CVE databases, security advisories
- **Performance Resources**: Benchmarking studies, optimization guides

### Performance Optimization
- **Response Time Targets**: <30s for full browser research, <10s for API-only
- **Caching Strategy**: 24-hour cache for research results, invalidated on dependency changes
- **Rate Limiting**: Intelligent request management with multiple API key rotation
- **Resource Management**: Automatic browser session cleanup and memory optimization

## 🎯 Research Quality Assurance

### Multi-layer Validation
- **Source Credibility Scoring**: Automated assessment of information reliability
- **Cross-reference Validation**: Multiple source confirmation for key findings
- **Content Freshness**: Preference for recent information and updates
- **Citation Accuracy**: Verified links and proper attribution
- **Consistency Checking**: Internal logic validation across findings

### Browser Research Metrics
- **Success Rate**: Target >90% for source validation
- **Response Time**: Average <343ms per source validation
- **Quality Score**: Target >85/100 for research accuracy
- **Source Diversity**: Average 2-3 authoritative sources per finding

## 🔐 Security and Privacy

### Data Protection
- **No secrets exposed** to external forks or pull requests
- **Minimal permissions** with secure token handling
- **Source validation** prevents malicious link injection
- **Rate limiting** protection against API abuse
- **Audit logging** for all research activities

### Authorization Controls
- **User permissions**: Only OWNER, COLLABORATOR, or MEMBER can trigger research
- **Repository secrets**: Secure API key storage with no external access
- **Workflow isolation**: Research runs in secure GitHub Actions environment
- **Content filtering**: Automated screening of inappropriate or harmful content

## 📈 Performance Monitoring

### Built-in Metrics
- **Analysis Duration**: Complete timing breakdown
- **Browser Research Status**: Success/failure tracking
- **API Usage**: Request counting and optimization
- **Citation Quality**: Link validation and accuracy
- **User Satisfaction**: Implicit feedback through usage patterns

### Optimization Features
- **Intelligent Caching**: 24-hour result caching with smart invalidation
- **Parallel Processing**: Concurrent source validation for faster results
- **Adaptive Depth**: Automatic depth adjustment based on complexity
- **Fallback Systems**: Graceful degradation when browser research unavailable

## 🛠️ Troubleshooting

### Common Issues and Solutions

**❌ "Perplexity API key not configured"**
- Add `PERPLEXITY_API_KEY` repository secret
- Verify API key has correct permissions and credits

**❌ "Browser research failed"**
- Check `BROWSERBASE_API_KEY` configuration
- Try disabling browser research: `--browser=disabled`
- Verify network connectivity and API limits

**❌ "Research taking too long"**
- Use `--depth=brief` for faster analysis
- Disable browser research if not needed
- Check API rate limits and quotas

**❌ "Poor quality results"**
- Ensure API key has sufficient credits
- Verify target sources are accessible
- Try different model: `--model=sonar-small`

### Performance Optimization
```bash
# Quick analysis without browser research
/run-perplexity-research --depth=brief --browser=disabled

# Full analysis with caching
/run-perplexity-research --depth=deep --browser=enabled

# Focus on specific aspects
/run-perplexity-research --depth=deep --focus=security
```

## 📚 Implementation Examples

### Basic PR Analysis
```markdown
Label: run-perplexity-research
Result: Comprehensive analysis with browser-validated findings
Time: ~15-30 seconds
Coverage: Security, performance, best practices, Cursor AI optimization
```

### Advanced Security Analysis
```bash
/run-perplexity-research --model=sonar-pro --depth=deep --browser=enabled
```
**Result**: Deep security analysis with real-time vulnerability checking, browser-validated threat intelligence, and specific mitigation recommendations.

### Quick Development Review
```bash
/run-perplexity-research --depth=brief --browser=disabled
```
**Result**: Fast analysis focusing on immediate issues, code quality, and basic best practices without browser validation overhead.

## 🔄 Integration with Development Workflow

### Automated Triggers
- **PR Creation**: Automatic analysis for new pull requests with specific labels
- **Dependency Changes**: Triggered analysis when package.json or requirements.txt modified
- **Security Files**: Automatic deep analysis for authentication, security, or configuration files
- **Performance Critical**: Enhanced analysis for database, API, or optimization changes

### Cursor AI Optimization
The enhanced research provides specific recommendations for:
- **Model Selection**: Optimal AI model choices based on code changes
- **Context Configuration**: Improved file inclusion patterns for better assistance
- **Workflow Automation**: Suggested triggers and automation opportunities
- **Performance Optimization**: Context window management and response time improvements

---

## 🎯 Next Steps

1. **Configure API Keys**: Add PERPLEXITY_API_KEY and optionally BROWSERBASE_API_KEY
2. **Test Integration**: Use `/run-perplexity-research` on a test PR
3. **Optimize Settings**: Generate Cursor AI configuration with `cursor-ai-integration.js`
4. **Monitor Performance**: Review research quality and adjust settings as needed
5. **Scale Usage**: Enable automatic triggers for development workflow integration

**Enhanced by**: Perplexity Browser Research Bot v2.0  
**Optimized for**: Cursor AI Agent Integration and Development Workflow Automation