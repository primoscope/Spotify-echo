# Community MCP Servers - Curated Collection

This guide helps you discover, evaluate, and implement community MCP (Model Communication Protocol) servers for use with coding agents in the Spotify-echo project. It covers recommended servers, installation and integration workflows, example use cases, and tips for ongoing community contribution.

## 1. Introduction: What are MCP Servers?

**MCP servers** provide standardized APIs that allow coding agents (like LLMs) to interact with various tools, databases, and services. Integrating MCP servers in Spotify-echo enables advanced automation, facilitates AI-powered code generation, and enhances overall project workflow.

**Benefits:**
- Streamlined agent-to-service communication
- Automated code and data management
- Enhanced extensibility for AI-driven tasks
- Reduce manual intervention across your development lifecycle

## 2. Workflow: Finding, Installing, and Integrating MCP Servers

Follow these steps to discover and use MCP servers in your project:

### Step 1: Search for MCP Servers
- Explore curated lists:  
  [Awesome MCP Servers (GitHub)](https://github.com/punkpeye/awesome-mcp-servers)  
  [MCP Servers Directory (MCPdb)](https://mcpdb.org/)  
  [Top MCP Servers Blog](https://dev.to/fallon_jimmy/top-10-mcp-servers-for-2025-yes-githubs-included-15jg)

- Search platforms:  
  - GitHub (repos, issues, discussions)  
  - PyPI (for installable packages)  
  - Community forums (Discord, Reddit, Stack Overflow)

### Step 2: Evaluate Compatibility
- Check Python version support (Spotify-echo uses Python 3.11+)
- Review documentation and active maintenance
- Assess community support and recent activity

### Step 3: Install the MCP Server
- Most servers offer installation via pip:
  ```bash
  pip install <server-package>
  ```
- Some may require Docker or standalone binaries (see their docs).

### Step 4: Integrate with Coding Agent
- Configure the MCP server endpoint in your project settings (see code examples below)
- Use provided APIs to interact via your coding agent

## 3. High-Priority MCP Servers for EchoTune AI

Below is a curated list of actual, production-ready MCP servers with proven functionality:

### A. GitHub MCP Server (Official)

- **Repository:** [github/github-mcp-server](https://github.com/github/github-mcp-server)
- **Type:** 🎖️ Official GitHub implementation
- **Features:** Complete GitHub integration with repository management, PRs, issues, and Actions
- **Use Cases for EchoTune AI:**
  - Automated PR reviews for ML model updates
  - Issue tracking for user-reported recommendation bugs
  - GitHub Actions integration for CI/CD automation
  - Code quality monitoring and dependency management
- **Installation:**
  ```bash
  # Using Docker (recommended)
  docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "github": {
        "command": "docker",
        "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
        }
      }
    }
  }
  ```
- **Benefits:** Official support, comprehensive GitHub automation, production-ready

### B. PostgreSQL Database MCP Server

- **Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)
- **Type:** 📇 Official MCP implementation
- **Features:** PostgreSQL database integration with schema inspection and query capabilities
- **Use Cases for EchoTune AI:**
  - Automated database schema management for user data
  - Query optimization for music recommendation algorithms
  - Real-time analytics on user listening patterns
  - Automated backup and migration scripts
- **Installation:**
  ```bash
  npm install @modelcontextprotocol/server-postgres
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "postgres": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-postgres"],
        "env": {
          "POSTGRES_CONNECTION_STRING": "${DATABASE_URL}"
        }
      }
    }
  }
  ```
- **Benefits:** Secure database operations, schema exploration, query building

### C. Brave Search MCP Server

- **Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search)
- **Type:** 📇 Official MCP implementation
- **Features:** Web search capabilities using Brave's Search API
- **Use Cases for EchoTune AI:**
  - Research trending music and artists for recommendation enhancement
  - Automated music discovery from web sources
  - Market research for music industry trends
  - User preference analysis from social media
- **Installation:**
  ```bash
  npm install @modelcontextprotocol/server-brave-search
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "brave-search": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-brave-search"],
        "env": {
          "BRAVE_API_KEY": "${BRAVE_API_KEY}"
        }
      }
    }
  }
  ```
- **Benefits:** Real-time web search, music discovery, trend analysis

### D. File System MCP Server

- **Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- **Type:** 📇 Official MCP implementation
- **Features:** Direct local file system access with configurable permissions
- **Use Cases for EchoTune AI:**
  - Automated processing of Spotify CSV data files
  - ML dataset management and organization
  - Log file analysis and monitoring
  - Configuration file management
- **Installation:**
  ```bash
  npm install @modelcontextprotocol/server-filesystem
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-filesystem", "--path", "/path/to/spotify-echo"],
        "env": {
          "ALLOWED_PATHS": "/home/runner/work/Spotify-echo"
        }
      }
    }
  }
  ```
- **Benefits:** Secure file operations, data pipeline automation, log management

### E. SQLite Database MCP Server

- **Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite)
- **Type:** 🐍 Official Python implementation
- **Features:** SQLite database operations with built-in analysis features
- **Use Cases for EchoTune AI:**
  - Local caching of Spotify API responses
  - User preference storage and retrieval
  - ML model performance tracking
  - Offline music recommendation storage
- **Installation:**
  ```bash
  pip install mcp-server-sqlite
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "sqlite": {
        "command": "python",
        "args": ["-m", "mcp_server_sqlite", "--db-path", "data/echotune.db"]
      }
    }
  }
  ```
- **Benefits:** Fast local storage, offline capabilities, built-in analytics

### F. Memory MCP Server (Knowledge Graph)

- **Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- **Type:** 📇 Official MCP implementation
- **Features:** Knowledge graph-based persistent memory system
- **Use Cases for EchoTune AI:**
  - Persistent user preference learning
  - Music recommendation context preservation
  - Cross-session conversation memory
  - Dynamic playlist generation context
- **Installation:**
  ```bash
  npm install @modelcontextprotocol/server-memory
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "memory": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-memory"]
      }
    }
  }
  ```
- **Benefits:** Context preservation, intelligent memory, enhanced user experience

### G. Puppeteer Browser Automation

- **Repository:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer)
- **Type:** 📇 Official MCP implementation
- **Features:** Browser automation for web scraping and interaction
- **Use Cases for EchoTune AI:**
  - Automated Spotify Web Player interaction
  - Music blog and review scraping
  - Social media music trend monitoring
  - Automated testing of web interfaces
- **Installation:**
  ```bash
  npm install @modelcontextprotocol/server-puppeteer
  ```
- **MCP Configuration:**
  ```json
  {
    "servers": {
      "puppeteer": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-puppeteer"]
      }
    }
  }
  ```
- **Benefits:** Web automation, data collection, testing automation

## 4. Specialized Community MCP Servers for Music Intelligence

### Music & Audio Processing Servers

#### A. Audio Analysis MCP Server
- **Repository:** [biomcp by genomoncology](https://github.com/genomoncology/biomcp) (adaptable for audio data)
- **Type:** 🐍 Python implementation
- **Features:** Data analysis and processing capabilities
- **Spotify-echo Adaptations:**
  - Audio feature extraction from Spotify track data
  - Music similarity analysis and clustering
  - Tempo and key analysis for playlist optimization
  - Audio fingerprinting for duplicate detection
- **Installation:**
  ```bash
  pip install biomcp
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "audio-analysis": {
        "command": "python",
        "args": ["-m", "biomcp"],
        "env": {
          "ANALYSIS_TYPE": "audio_features",
          "SPOTIFY_CLIENT_ID": "${SPOTIFY_CLIENT_ID}"
        }
      }
    }
  }
  ```

#### B. YouTube Music Integration
- **Repository:** [youtube-mcp by anaisbetts](https://github.com/anaisbetts/mcp-youtube)
- **Type:** 📇 TypeScript implementation  
- **Features:** YouTube subtitle and content fetching
- **Use Cases for EchoTune AI:**
  - Cross-platform music discovery (YouTube to Spotify)
  - Lyrics analysis and sentiment tracking
  - Music video content analysis
  - Alternative source recommendations
- **Installation:**
  ```bash
  npm install mcp-youtube
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "youtube": {
        "command": "npx",
        "args": ["mcp-youtube"],
        "env": {
          "YOUTUBE_API_KEY": "${YOUTUBE_API_KEY}"
        }
      }
    }
  }
  ```

### Database & Analytics Servers

#### C. MongoDB Integration
- **Repository:** [mongodb-lens by furey](https://github.com/furey/mongodb-lens)
- **Type:** 📇 TypeScript implementation
- **Features:** Full-featured MongoDB database operations
- **Use Cases for EchoTune AI:**
  - User listening history storage and retrieval
  - Real-time recommendation caching
  - Playlist metadata management
  - Analytics data aggregation
- **Installation:**
  ```bash
  npm install mongodb-lens
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "mongodb": {
        "command": "npx",
        "args": ["mongodb-lens"],
        "env": {
          "MONGODB_URI": "${MONGODB_URI}",
          "DATABASE_NAME": "echotune"
        }
      }
    }
  }
  ```

#### D. Time Series Data Analysis
- **Repository:** [influxdb-mcp-server by idoru](https://github.com/idoru/influxdb-mcp-server)
- **Type:** 📇 TypeScript implementation
- **Features:** Time-series database operations for InfluxDB
- **Use Cases for EchoTune AI:**
  - Real-time listening pattern tracking
  - Performance metrics collection
  - User engagement analytics
  - Recommendation accuracy monitoring
- **Installation:**
  ```bash
  npm install influxdb-mcp-server
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "influxdb": {
        "command": "npx",
        "args": ["influxdb-mcp-server"],
        "env": {
          "INFLUXDB_URL": "http://localhost:8086",
          "INFLUXDB_TOKEN": "${INFLUXDB_TOKEN}"
        }
      }
    }
  }
  ```

### AI & Machine Learning Servers

#### E. OpenAI Integration
- **Repository:** [mcp-server-openai by pierrebrunelle](https://github.com/pierrebrunelle/mcp-server-openai)
- **Type:** 🐍 Python implementation
- **Features:** Direct OpenAI API integration
- **Use Cases for EchoTune AI:**
  - Enhanced music recommendation explanations
  - Natural language playlist generation
  - User interaction improvement
  - Sentiment analysis of music preferences
- **Installation:**
  ```bash
  pip install mcp-server-openai
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "openai": {
        "command": "python",
        "args": ["-m", "mcp_server_openai"],
        "env": {
          "OPENAI_API_KEY": "${OPENAI_API_KEY}"
        }
      }
    }
  }
  ```

#### F. Prompt Management
- **Repository:** [langfuse mcp-server by langfuse](https://github.com/langfuse/mcp-server-langfuse)
- **Type:** 🐍 Python implementation
- **Features:** LLM prompt management and optimization
- **Use Cases for EchoTune AI:**
  - A/B testing for recommendation prompts
  - Conversation flow optimization
  - User interaction personalization
  - Prompt performance analytics
- **Installation:**
  ```bash
  pip install langfuse-mcp
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "langfuse": {
        "command": "python",
        "args": ["-m", "langfuse_mcp"],
        "env": {
          "LANGFUSE_PUBLIC_KEY": "${LANGFUSE_PUBLIC_KEY}",
          "LANGFUSE_SECRET_KEY": "${LANGFUSE_SECRET_KEY}"
        }
      }
    }
  }
  ```

### Web & API Integration Servers

#### G. Web Scraping & Content Extraction
- **Repository:** [mcp-server-playwright by executeautomation](https://github.com/executeautomation/mcp-playwright)
- **Type:** 📇 TypeScript implementation
- **Features:** Browser automation and web scraping
- **Use Cases for EchoTune AI:**
  - Music blog and review collection
  - Social media trend monitoring
  - Concert and event information gathering
  - Artist biography and metadata collection
- **Installation:**
  ```bash
  npm install mcp-playwright
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "playwright": {
        "command": "npx",
        "args": ["mcp-playwright"],
        "env": {
          "HEADLESS": "true",
          "USER_AGENT": "EchoTune-Bot/1.0"
        }
      }
    }
  }
  ```

#### H. API Testing & Monitoring
- **Repository:** [webhook-tester-mcp by alimo7amed93](https://github.com/alimo7amed93/webhook-tester-mcp)
- **Type:** 🐍 Python implementation
- **Features:** Webhook testing and API monitoring
- **Use Cases for EchoTune AI:**
  - Spotify API health monitoring
  - Webhook endpoint testing
  - API response validation
  - Integration testing automation
- **Installation:**
  ```bash
  pip install webhook-tester-mcp
  ```
- **Configuration:**
  ```json
  {
    "servers": {
      "webhook-tester": {
        "command": "python",
        "args": ["-m", "webhook_tester_mcp"],
        "env": {
          "WEBHOOK_URL": "https://webhook-test.com"
        }
      }
    }
  }
  ```

## 5. Additional Resources

### Official MCP Resources
- **[Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)** - Comprehensive community-maintained list
- **[MCPdb Directory](https://mcpdb.org/)** - Searchable database of MCP servers
- **[Model Context Protocol Documentation](https://modelcontextprotocol.io/)** - Official MCP specification
- **[MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)** - TypeScript SDK for building servers

### Community Platforms
- **[MCP Discord Server](https://glama.ai/mcp/discord)** - Active community discussions
- **[r/mcp Reddit](https://www.reddit.com/r/mcp)** - Community forum and updates
- **[MCP GitHub Discussions](https://github.com/modelcontextprotocol/servers/discussions)** - Technical discussions

### Development Resources
- **[Top 10 MCP Servers Blog](https://dev.to/fallon_jimmy/top-10-mcp-servers-for-2025-yes-githubs-included-15jg)** - Curated recommendations
- **[Digma AI MCP Server List](https://digma.ai/15-best-mcp-servers/)** - Additional server recommendations
- **[MCP Quickstart Guide](https://glama.ai/blog/2024-11-25-model-context-protocol-quickstart)** - Getting started tutorial

## 6. Implementation Guide for EchoTune AI

### Installation Process

1. **Environment Setup**
   ```bash
   # Ensure you have Node.js 18+ and Python 3.11+
   node --version  # Should be 18.0.0 or higher
   python --version  # Should be 3.11.0 or higher
   ```

2. **Install MCP Server Dependencies**
   ```bash
   # Install Node.js based servers
   npm install @modelcontextprotocol/server-filesystem
   npm install @modelcontextprotocol/server-brave-search
   npm install @modelcontextprotocol/server-memory
   
   # Install Python based servers
   pip install mcp-server-sqlite
   pip install mcp-server-openai
   ```

3. **Update MCP Configuration**
   Add servers to your `mcp-server/package.json`:
   ```json
   {
     "servers": {
       "github": {
         "command": "docker",
         "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
         }
       },
       "filesystem": {
         "command": "npx",
         "args": ["@modelcontextprotocol/server-filesystem", "--path", "/home/runner/work/Spotify-echo"],
         "env": {
           "ALLOWED_PATHS": "/home/runner/work/Spotify-echo"
         }
       },
       "sqlite": {
         "command": "python",
         "args": ["-m", "mcp_server_sqlite", "--db-path", "data/echotune.db"]
       },
       "memory": {
         "command": "npx",
         "args": ["@modelcontextprotocol/server-memory"]
       }
     }
   }
   ```

4. **Configure Environment Variables**
   Update your `.env` file:
   ```env
   # GitHub Integration
   GITHUB_PAT=your_github_personal_access_token
   
   # Database Connections
   MONGODB_URI=your_mongodb_connection_string
   DATABASE_URL=your_postgresql_connection_string
   
   # API Keys
   BRAVE_API_KEY=your_brave_search_api_key
   OPENAI_API_KEY=your_openai_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   
   # Spotify Integration
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

### Recommended Implementation Priority

#### Phase 1: Core Infrastructure (Week 1-2)
1. **GitHub MCP Server** - Essential for repository management
2. **File System MCP Server** - Required for data pipeline automation
3. **SQLite MCP Server** - Local caching and storage

#### Phase 2: Enhanced Intelligence (Week 3-4)
4. **Memory MCP Server** - Context preservation for conversations
5. **PostgreSQL MCP Server** - Production database operations
6. **OpenAI MCP Server** - Enhanced AI capabilities

#### Phase 3: Advanced Features (Week 5-6)
7. **Brave Search MCP Server** - Web content discovery
8. **MongoDB MCP Server** - Document database operations
9. **Puppeteer MCP Server** - Web automation

#### Phase 4: Specialized Music Features (Week 7-8)
10. **YouTube MCP Server** - Cross-platform music discovery
11. **Audio Analysis Server** - Advanced music intelligence
12. **Playlist Optimization Server** - Enhanced user experience

### Integration Testing Checklist

For each MCP server integration:

- [ ] **Installation Success**: Server installs without errors
- [ ] **Configuration Valid**: MCP configuration syntax is correct
- [ ] **Environment Variables**: All required variables are set
- [ ] **Connectivity Test**: Server responds to basic commands
- [ ] **Permission Validation**: Appropriate access levels configured
- [ ] **Performance Impact**: Monitor response times and resource usage
- [ ] **Error Handling**: Test failure scenarios and recovery
- [ ] **Documentation Updated**: Update project docs with new capabilities

### Security Considerations

1. **API Key Management**:
   - Store sensitive keys in environment variables
   - Use different keys for development and production
   - Regular key rotation and access auditing

2. **File System Access**:
   - Limit file system servers to specific directories
   - Use read-only permissions where possible
   - Regular security audits of file access patterns

3. **Database Security**:
   - Use connection strings with minimal required permissions
   - Enable SSL/TLS for database connections
   - Regular backup and recovery testing

4. **Network Security**:
   - Configure firewalls for MCP server ports
   - Use HTTPS for all external API communications
   - Monitor network traffic for unusual patterns

---

**Note**: This list is curated and maintained by the EchoTune AI team. Server availability, URLs, and features may change. Always verify server compatibility and security before integration in production environments.