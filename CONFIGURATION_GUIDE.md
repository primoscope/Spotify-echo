# 🔧 EchoTune AI - Configuration Management Guide

*Updated: January 2025 | Version: 2.1.0*

## Overview

EchoTune AI features a comprehensive configuration management system that allows real-time customization of music discovery, performance settings, mobile optimization, and MCP server integration. This guide covers all configuration options and management interfaces.

## 🎛️ Configuration Interface Access

### Web Interface
Access the configuration panel through the main application:
1. Navigate to `http://localhost:3000` (or your deployed URL)
2. Click the "⚙️ Settings" tab
3. Choose between:
   - **General Configuration**: Core app settings, MCP servers, performance
   - **Mobile & Responsive**: Device optimization and mobile settings

### API Access
Configuration can also be managed programmatically:
```bash
# Get current configuration
curl http://localhost:3000/api/settings/config

# Update configuration
curl -X PUT http://localhost:3000/api/settings/config \
  -H "Content-Type: application/json" \
  -d '{"config": {...}}'

# Get mobile settings
curl http://localhost:3000/api/settings/mobile

# Update mobile settings  
curl -X PUT http://localhost:3000/api/settings/mobile \
  -H "Content-Type: application/json" \
  -d '{"settings": {...}}'
```

## ⚙️ General Configuration Options

### Music Discovery Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `recommendationEngine` | select | `hybrid` | Algorithm for music recommendations |
| `audioQuality` | select | `high` | Audio streaming quality preference |
| `discoveryMode` | select | `smart` | Default music discovery mode |

**Recommendation Engine Options:**
- `collaborative`: Uses user behavior patterns and collaborative filtering
- `content-based`: Analyzes track features and audio characteristics  
- `hybrid`: Combines both approaches (recommended for best results)

**Audio Quality Options:**
- `low`: 96 kbps (data saving mode)
- `medium`: 160 kbps (balanced quality/bandwidth)
- `high`: 320 kbps (premium audio quality)

**Discovery Mode Options:**
- `smart`: AI-powered intelligent discovery
- `mood-based`: Music based on detected or specified mood
- `trending`: Popular and trending tracks
- `social`: Community-driven recommendations

### Performance Settings

| Setting | Type | Default | Range | Description |
|---------|------|---------|--------|-------------|
| `cacheSize` | number | `100` | 50-500 MB | Memory allocated for caching |
| `requestTimeout` | number | `30` | 5-60 sec | API request timeout |
| `batchSize` | number | `20` | 10-100 | Batch processing size |

### UI/UX Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `theme` | select | `auto` | Application theme mode |
| `animations` | boolean | `true` | Enable UI animations |
| `compactMode` | boolean | `false` | Use compact interface layout |

**Theme Options:**
- `light`: Light theme mode
- `dark`: Dark theme mode
- `auto`: Follows system preference

### Privacy & Security Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `anonymousMode` | boolean | `false` | Hide user identification |
| `dataCollection` | boolean | `true` | Allow usage data collection |
| `analytics` | boolean | `true` | Enable analytics tracking |

## 🖥️ MCP Server Configuration

EchoTune AI integrates 12 Model Context Protocol servers for advanced automation. Each server can be individually enabled/disabled:

### Available MCP Servers

| Server | Default | Capabilities | Requirements |
|--------|---------|--------------|--------------|
| `mermaid` | ✅ | Diagram generation, workflow visualization | None |
| `filesystem` | ✅ | File operations, repository analysis | None |
| `browserbase` | ❌ | Cloud browser automation | API key required |
| `spotify` | ✅ | Music data, playlists, recommendations | Spotify credentials |
| `github` | ❌ | Repository management, PRs, issues | GitHub PAT required |
| `sqlite` | ✅ | Database operations and analysis | None |
| `memory` | ✅ | Knowledge graph, persistent memory | None |
| `postgres` | ❌ | PostgreSQL operations | Database URL required |
| `brave-search` | ❌ | Web search capabilities | Brave API key required |
| `screenshot-website` | ✅ | Website screenshots | None |
| `browser` | ✅ | Local browser automation | None |
| `sequential-thinking` | ✅ | Structured reasoning | None |

### MCP Server Configuration
```json
{
  "mcpEnabled": true,
  "mcpServers": {
    "mermaid": true,
    "filesystem": true,
    "browserbase": false,
    "spotify": true,
    "github": false,
    "sqlite": true,
    "memory": true,
    "postgres": false,
    "brave-search": false,
    "screenshot-website": true,
    "browser": true,
    "sequential-thinking": true
  }
}
```

## 📱 Mobile & Responsive Configuration

### Device Optimization Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `touchOptimization` | boolean | `true` | Optimize for touch interfaces |
| `gestureNavigation` | boolean | `true` | Enable gesture-based navigation |
| `compactUI` | boolean | `true` | Use space-efficient interface |
| `mobileFriendlyFonts` | boolean | `true` | Optimize fonts for mobile reading |

### Responsive Design Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoRotation` | boolean | `false` | Auto-adjust to device orientation |
| `highContrastMode` | boolean | `false` | High contrast for accessibility |

### Performance Optimization Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `fastScrolling` | boolean | `true` | Optimize scrolling performance |
| `reduceAnimations` | boolean | `false` | Minimize animations for performance |
| `dataSaver` | boolean | `false` | Reduce bandwidth usage |
| `offlineMode` | boolean | `false` | Enable offline functionality |

### Auto-Detection Features

The mobile responsive manager automatically detects:
- **Device Type**: Mobile, tablet, or desktop
- **Screen Resolution**: Width × height and pixel ratio
- **Touch Capability**: Touch screen availability
- **Orientation**: Portrait or landscape mode
- **Network Type**: Connection speed estimation
- **Device Performance**: Battery and performance mode detection

## 🔄 Real-time System Monitoring

The configuration interface provides live system status monitoring:

### System Health Metrics
- **Main Application Status**: Health check from `/api/health`
- **MCP Server Status**: Health check from MCP orchestrator
- **Database Connectivity**: MongoDB and SQLite status
- **Performance Metrics**: Response times and resource usage
- **Last Update Time**: Real-time status refresh timestamp

### Status Indicators
- 🟢 **Healthy/Running**: System operating normally
- 🟡 **Warning**: Minor issues or performance concerns
- 🔴 **Error/Unhealthy**: Critical issues requiring attention
- ⚪ **Unknown**: Status checking in progress

## 🔧 Configuration Storage

### Storage Locations
- **General Config**: `config/app-config.json`
- **Mobile Config**: `config/mobile-config.json`
- **Environment Variables**: `.env` file for sensitive settings

### Configuration Persistence
- Settings are automatically saved to JSON files
- Configuration survives application restarts
- Default values are used when no saved configuration exists
- Configuration validation prevents invalid settings

### Backup and Recovery
```bash
# Backup current configuration
cp config/app-config.json config/app-config.backup.json
cp config/mobile-config.json config/mobile-config.backup.json

# Restore configuration
cp config/app-config.backup.json config/app-config.json
cp config/mobile-config.backup.json config/mobile-config.json
```

## 🚀 Advanced Configuration

### Environment Variable Integration
Some settings require environment variables for security:

```bash
# MCP Server Credentials
GITHUB_PAT=your_github_token
BROWSERBASE_API_KEY=your_browserbase_key
BROWSERBASE_PROJECT_ID=your_project_id
BRAVE_API_KEY=your_brave_key
DATABASE_URL=your_postgres_url

# Core Application
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
MONGODB_URI=your_mongodb_connection
```

### Programmatic Configuration Management

```javascript
// Configuration Management Example
const configManager = {
  async updateConfig(updates) {
    const response = await fetch('/api/settings/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: updates })
    });
    return response.json();
  },
  
  async getCurrentConfig() {
    const response = await fetch('/api/settings/config');
    return response.json();
  },
  
  async optimizeForMobile() {
    return this.updateConfig({
      compactMode: true,
      reduceAnimations: true,
      cacheSize: 50,
      batchSize: 10
    });
  }
};
```

## 🔍 Troubleshooting

### Common Configuration Issues

**MCP Server Not Starting**
- Verify required environment variables are set
- Check server-specific dependencies are installed
- Review MCP server logs in console output

**Settings Not Persisting**
- Ensure `config/` directory is writable
- Check for JSON syntax errors in configuration files
- Verify API endpoints are responding correctly

**Mobile Settings Not Applied**
- Refresh the page after changing mobile settings
- Check browser developer tools for JavaScript errors
- Verify mobile detection is working correctly

### Configuration Validation

The system automatically validates configuration changes:
- **Type Checking**: Ensures correct data types for all settings
- **Range Validation**: Numeric values must be within acceptable ranges
- **Dependency Checking**: Verifies required services are available
- **Security Validation**: Prevents unsafe configuration changes

### Reset to Defaults
```bash
# Reset all configuration to defaults
rm config/app-config.json config/mobile-config.json
# Restart application to regenerate with defaults
```

## 📊 Configuration Best Practices

### Performance Optimization
- Use `hybrid` recommendation engine for best results
- Set `cacheSize` based on available system memory
- Enable `dataSaver` on mobile or limited bandwidth connections
- Use `compactMode` on smaller screens

### Security Considerations
- Enable `anonymousMode` for privacy-sensitive deployments
- Disable `dataCollection` if GDPR compliance required
- Use environment variables for all sensitive credentials
- Regularly backup configuration files

### Mobile Experience
- Enable all touch optimization features for mobile devices
- Use `fastScrolling` for better performance on slower devices
- Enable `highContrastMode` for accessibility compliance
- Test configuration on actual mobile devices when possible

---

**Configuration management is a powerful feature that allows EchoTune AI to adapt to different environments, user preferences, and deployment scenarios while maintaining optimal performance and user experience.**