# 🤖 EchoTune AI - Copilot Slash Commands

## Overview

The EchoTune AI repository now includes an advanced slash command system that allows authorized users to easily trigger Copilot SWE agent functions through simple commands in GitHub issues and pull requests.

## How It Works

Simply type a slash command in any issue or PR comment, and the system will automatically:

1. **Parse the command** and extract parameters
2. **Execute the requested function** (documentation generation, code analysis, etc.)
3. **Generate the requested content** using AI and project-specific templates
4. **Post results as comments** with rich formatting and helpful information
5. **Commit generated files** automatically to the repository

## Available Commands

### 📚 Documentation Commands

## 📋 Available Commands

### 📚 Documentation & Analysis Commands
| Command | Description | Output |
|---------|-------------|---------|
| `/review-docs [scope]` | Analyze current documentation and suggest improvements | Comprehensive review with recommendations |
| `/create-api-docs` | Generate complete API documentation | `API_DOCUMENTATION.md` with full endpoint reference |
| `/create-architecture` | Generate system architecture documentation | `ARCHITECTURE.md` with diagrams and design docs |
| `/create-contributing` | Generate contributing guidelines | `CONTRIBUTING.md` with development workflow |
| `/gpt5 analyze [scope]` | Trigger GPT-5 repository analysis | Comprehensive analysis report |
| `/analyze-gpt5 [scope]` | Alternative phrasing for GPT-5 analysis | Same as above |
| `/review-gpt5 [scope]` | GPT-5 focused code review | Code review report |
| `/optimize-gpt5 [scope]` | GPT-5 optimization analysis | Performance optimization report |

### 🔧 System & MCP Commands
| Command | Description | Output |
|---------|-------------|---------|
| `/run-mcp-all` | Comprehensive MCP validation | MCP validation report |
| `/mcp-health-check` | Quick MCP health check | Health status report |

### 🤖 Autonomous Development Commands
| Command | Description | Output |
|---------|-------------|---------|
| `/start-autonomous-development` | Begin autonomous development cycle | Session reports and updated files |
| `@copilot use perplexity browser research` | Full autonomous cycle with roadmap updates | Roadmap updates and implementation files |
| `@copilot autonomous development` | Alternative natural language trigger | Same as above |

### 🔍 Specific Perplexity Commands (NEW!)
| Command | Description | Output |
|---------|-------------|---------|
| `/perplexity-analyze <scope>` | Targeted analysis with Perplexity AI | Analysis report for specified scope |
| `/analyze-perplexity <scope>` | Alternative phrasing for analysis | Same as above |
| `/perplexity-research <topic>` | Focused research on specific topics | Research report and insights |
| `/research-perplexity <topic>` | Alternative phrasing for research | Same as above |
| `/perplexity-roadmap-update` | Update roadmap with latest research | Updated roadmap with research insights |
| `/perplexity-budget-check` | Check Perplexity usage and budget | Budget status report |
| `/perplexity-optimize-costs` | Optimize Perplexity usage patterns | Cost optimization recommendations |

### 🎯 Usage Examples

```bash
# Documentation Commands
/review-docs                    # Review all documentation
/review-docs api               # Focus on API documentation
/create-api-docs               # Generate comprehensive API docs

# Analysis Commands
/gpt5 analyze scripts/         # Analyze specific directory with GPT-5
/perplexity-analyze frontend   # Analyze frontend with Perplexity
/perplexity-analyze "API security"  # Analyze specific topic

# Research Commands  
/perplexity-research "React 19 features"        # Research latest React
/research-perplexity "music AI trends"          # Research domain-specific topics
/perplexity-research "Spotify API best practices" # Research API patterns

# Autonomous Development
@copilot use perplexity browser research        # Full autonomous cycle
/start-autonomous-development                   # Direct trigger
/perplexity-roadmap-update                     # Update roadmap with research

# Budget & Optimization
/perplexity-budget-check                       # Check usage and budget
/perplexity-optimize-costs                     # Optimize API usage patterns

# System Commands
/run-mcp-all                   # Comprehensive MCP validation
/mcp-health-check              # Quick health check
```

### 💡 Command Features

#### 🎯 Scope Parameters
Most commands accept optional scope parameters to focus analysis:
- **Directory Scope**: `/perplexity-analyze scripts/` - Focus on specific directories
- **Component Scope**: `/perplexity-analyze frontend` - Focus on frontend components  
- **Topic Scope**: `/perplexity-research "API security"` - Focus on specific topics

#### 💰 Budget Awareness
Perplexity commands automatically optimize for cost efficiency:
- **Smart Model Selection**: Complexity-based routing (sonar → sonar-reasoning → sonar-pro)
- **Cache Utilization**: 14-day TTL reduces duplicate API calls
- **Budget Monitoring**: Real-time usage tracking with weekly $3.00 limit
- **Cost Optimization**: Automatic recommendations to reduce spending

#### 🔄 Natural Language Processing
Enhanced recognition for natural language commands:
- **Analysis Triggers**: "@copilot analyze this with perplexity"
- **Research Triggers**: "@copilot research using perplexity"
- **Budget Inquiries**: "check my perplexity budget"
- **General Development**: "@copilot use perplexity browser research"

## Authorization

Commands are available to:
- Repository owners
- Collaborators  
- Organization members

## Features

### 🎨 Rich Content Generation
- **Comprehensive documentation** with examples and best practices
- **Interactive diagrams** using Mermaid for visual documentation
- **Code examples** in multiple languages (JavaScript, Python)
- **Professional templates** following industry standards

### 🔄 Intelligent Processing
- **Context-aware responses** based on issue/PR content
- **Parameter parsing** for focused operations
- **Error handling** with helpful feedback
- **Automatic file management** and git operations

### 🛡️ Security & Quality
- **Permission validation** ensures only authorized users can execute commands
- **Input sanitization** prevents malicious command injection
- **Automated testing** of generated content
- **Audit logging** for all command executions

## Technical Implementation

### Workflow Triggers
```yaml
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
```

### Command Processing Flow
1. **Comment Detection** - Monitors for comments starting with `/`
2. **Authorization Check** - Validates user permissions
3. **Command Parsing** - Extracts command and parameters
4. **Function Execution** - Runs the appropriate generator
5. **Content Creation** - Generates high-quality documentation
6. **Response Posting** - Comments with results and files
7. **Git Operations** - Commits and pushes generated files

### Generated Content Quality
- **Comprehensive coverage** of all project aspects
- **Industry best practices** and professional standards
- **Interactive elements** (diagrams, code examples)
- **Consistent formatting** and structure
- **Actionable recommendations** for improvements

## Future Enhancements

### Planned Commands (Coming Soon)
- `/create-openapi` - Generate OpenAPI/Swagger specifications
- `/create-security-guide` - Generate security best practices
- `/analyze-code` - Perform comprehensive code analysis
- `/optimize-performance` - Analyze and optimize performance
- `/deploy-staging` - Deploy to staging environment
- `/run-tests` - Execute full test suite
- `/analyze-music-data` - Music recommendation algorithm analysis
- `/generate-ml-report` - Machine learning model analysis

### Advanced Features
- **Multi-step workflows** for complex operations
- **Interactive command builders** for complex parameters
- **Integration with external tools** (testing, deployment)
- **Custom command creation** for project-specific needs

## Benefits

### For Developers
- **Instant documentation generation** saves hours of manual work
- **Consistent quality** across all generated content
- **Professional templates** follow industry best practices
- **Easy customization** of generated content

### For Project Maintainers
- **Automated workflow** reduces manual documentation overhead
- **Quality assurance** through standardized templates
- **Contributor onboarding** with comprehensive guides
- **Professional presentation** for open source projects

### For Contributors
- **Clear guidelines** for contributing to the project
- **Comprehensive setup** instructions and examples
- **Professional development** workflow and standards
- **Recognition system** for community contributions

## Support

If you encounter issues with slash commands:
- Check the **Actions tab** for workflow execution logs
- Ensure you have **appropriate permissions** (owner/collaborator)
- Review **command syntax** and available parameters
- Contact **maintainers** for complex issues or feature requests

---

**System Status**: ✅ Active and operational  
**Available Commands**: 6 active, 8 planned  
**Last Updated**: January 2024