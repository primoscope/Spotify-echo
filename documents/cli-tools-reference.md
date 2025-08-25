# CLI Tools Reference

## 📋 Overview

EchoTune AI provides comprehensive command-line interfaces for all AI services, offering developers and content creators powerful tools for automation, batch processing, and integration. This reference covers all CLI tools, their commands, parameters, and practical usage examples.

## 🎨 Generative AI CLI

### Installation and Setup

#### Install Dependencies
```bash
# Python dependencies
pip install -r requirements.txt

# Verify installation
python generative_ai_cli.py --version
```

#### Authentication Setup
```bash
# Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Verify authentication
python generative_ai_cli.py health-check
```

### Core Commands

#### Image Generation
```bash
# Basic usage
python generative_ai_cli.py generate-image "Professional music studio"

# With specific model
python generative_ai_cli.py generate-image "Concert scene" --model imagen-3.0-generate-001

# Multiple images with style
python generative_ai_cli.py generate-image "Album cover art" \
    --model flux-1-dev \
    --count 4 \
    --style artistic \
    --aspect-ratio 1:1

# Advanced options
python generative_ai_cli.py generate-image "Epic music festival" \
    --model imagen-3.0-generate-001 \
    --style cinematic \
    --aspect-ratio 16:9 \
    --output-dir ./custom-output \
    --negative-prompt "blurry, low quality" \
    --guidance-scale 15
```

#### Video Generation
```bash
# Basic video generation
python generative_ai_cli.py generate-video "Dynamic music visualization"

# Premium video with specifications
python generative_ai_cli.py generate-video "Concert promotional video" \
    --model veo-2.0-001 \
    --duration 30 \
    --resolution 4K \
    --fps 30

# Quick social media video
python generative_ai_cli.py generate-video "Behind the scenes studio" \
    --model veo-1.5-001 \
    --duration 15 \
    --resolution 1080p \
    --output-dir ./social-content
```

### Batch Processing Commands

#### Batch Image Generation
```bash
# From JSON configuration file
python generative_ai_cli.py batch-generate \
    --config batch-config.json \
    --output-dir ./batch-output

# Example batch-config.json:
{
  "batch_name": "Album Artwork Series",
  "requests": [
    {
      "prompt": "Rock album cover with electric guitar",
      "model": "imagen-3.0-generate-001",
      "style": "photographic"
    },
    {
      "prompt": "Jazz album cover with saxophone",
      "model": "flux-1-dev", 
      "style": "artistic"
    }
  ]
}
```

#### Batch Video Generation
```bash
# Multiple videos from prompts file
python generative_ai_cli.py batch-video \
    --prompts-file video-prompts.txt \
    --model veo-1.5-001 \
    --duration 20

# video-prompts.txt:
Music festival crowd dancing
Artist performing on stage
Album artwork coming to life
Recording studio session
```

### System Management Commands

#### List Available Models
```bash
# List all models
python generative_ai_cli.py list-models

# List specific type
python generative_ai_cli.py list-models --type image
python generative_ai_cli.py list-models --type video

# List by provider
python generative_ai_cli.py list-models --provider google
python generative_ai_cli.py list-models --provider huggingface
```

#### Health Check
```bash
# Check all services
python generative_ai_cli.py health-check

# Check specific model
python generative_ai_cli.py health-check --model imagen-3.0-generate-001

# Detailed health report
python generative_ai_cli.py health-check --detailed
```

#### Usage Statistics
```bash
# View usage stats
python generative_ai_cli.py usage-stats

# Specific time period
python generative_ai_cli.py usage-stats --period week
python generative_ai_cli.py usage-stats --period month

# Export to file
python generative_ai_cli.py usage-stats --export usage-report.json
```

### Advanced Features

#### Cost Estimation
```bash
# Estimate cost before generation
python generative_ai_cli.py estimate-cost \
    --model imagen-3.0-generate-001 \
    --count 10

# Estimate batch costs
python generative_ai_cli.py estimate-batch-cost \
    --config batch-config.json
```

#### Quality Analysis
```bash
# Analyze generated content quality
python generative_ai_cli.py analyze-quality \
    --input-dir ./generated-content \
    --output-report quality-report.json

# Compare models quality
python generative_ai_cli.py compare-models \
    --prompt "Professional musician portrait" \
    --models imagen-3.0-generate-001,imagegeneration@006,flux-1-dev
```

## 🤖 Unified LLM Agent CLI

### Setup and Configuration

#### Initialize Agent
```bash
# Initialize with default settings
python unified_agent_cli.py init

# Initialize with custom config
python unified_agent_cli.py init --config custom-config.json
```

#### Configure Models
```bash
# Set default models
python unified_agent_cli.py config set default_fast_model gemini-pro
python unified_agent_cli.py config set default_deep_model claude-opus-4.1

# View current configuration
python unified_agent_cli.py config show
```

### Core Agent Commands

#### Single Model Testing
```bash
# Quick test with auto-routing
python unified_agent_cli.py test "Analyze user engagement trends"

# Specific model test
python unified_agent_cli.py test \
    --model claude-opus-4.1 \
    --prompt "Explain recommendation algorithm bias" \
    --reasoning deep

# Fast response test
python unified_agent_cli.py test \
    --model gemini-pro \
    --prompt "Summarize Q4 metrics" \
    --reasoning fast
```

#### Multi-Model Analysis
```bash
# Compare multiple models
python unified_agent_cli.py compare \
    --models gemini-pro,claude-opus-4.1 \
    --prompt "Analyze streaming revenue decline" \
    --consensus

# Cross-validation analysis
python unified_agent_cli.py validate \
    --primary-model claude-opus-4.1 \
    --validation-model gemini-pro \
    --prompt "Strategic plan for user acquisition"
```

#### Consensus Building
```bash
# Generate consensus from multiple perspectives
python unified_agent_cli.py consensus \
    --prompt "Evaluate new feature proposal" \
    --perspectives business,technical,user \
    --models claude-opus-4.1,gemini-pro

# Export consensus report
python unified_agent_cli.py consensus \
    --prompt "Market analysis for expansion" \
    --export consensus-report.md
```

### Workflow Automation

#### Scheduled Analysis
```bash
# Schedule daily reports
python unified_agent_cli.py schedule \
    --task "daily_metrics_analysis" \
    --prompt "Analyze yesterday's user metrics and trends" \
    --schedule "daily at 9:00 AM" \
    --model claude-opus-4.1

# Schedule weekly deep dive
python unified_agent_cli.py schedule \
    --task "weekly_strategic_review" \
    --prompt "Comprehensive weekly performance review" \
    --schedule "weekly on Monday at 8:00 AM" \
    --consensus true
```

#### Batch Processing
```bash
# Process multiple analysis requests
python unified_agent_cli.py batch \
    --input-file analysis-requests.json \
    --output-dir ./analysis-results

# Example analysis-requests.json:
{
  "requests": [
    {
      "id": "engagement_analysis",
      "prompt": "Analyze user engagement patterns",
      "model": "claude-opus-4.1",
      "reasoning": "deep"
    },
    {
      "id": "retention_summary", 
      "prompt": "Summarize retention metrics",
      "model": "gemini-pro",
      "reasoning": "fast"
    }
  ]
}
```

### Monitoring and Analytics

#### Performance Tracking
```bash
# View agent performance
python unified_agent_cli.py performance

# Detailed performance report
python unified_agent_cli.py performance --detailed --period month

# Model comparison performance
python unified_agent_cli.py performance --compare-models
```

#### Cost Analysis
```bash
# View costs by model
python unified_agent_cli.py costs --breakdown-by-model

# Monthly cost report
python unified_agent_cli.py costs --period month --export monthly-costs.json

# Budget tracking
python unified_agent_cli.py costs --budget-status
```

## 🎵 Music Analysis CLI

### Spotify Integration Commands

#### Playlist Analysis
```bash
# Analyze specific playlist
python music_analysis_cli.py analyze-playlist \
    --playlist-id 37i9dQZF1DXcBWIGoYBM5M \
    --depth comprehensive

# Batch playlist analysis
python music_analysis_cli.py batch-analyze \
    --playlist-file playlists.txt \
    --output-dir ./playlist-analysis

# Compare playlists
python music_analysis_cli.py compare-playlists \
    --playlist1 37i9dQZF1DXcBWIGoYBM5M \
    --playlist2 37i9dQZF1DX0XUsuxWHRQd \
    --export comparison-report.json
```

#### User Analysis
```bash
# Analyze user listening patterns
python music_analysis_cli.py analyze-user \
    --user-id spotify_user_123 \
    --timeframe 6months

# Generate user recommendations
python music_analysis_cli.py recommend \
    --user-id spotify_user_123 \
    --count 20 \
    --diversity high

# User similarity analysis
python music_analysis_cli.py find-similar-users \
    --user-id spotify_user_123 \
    --limit 10
```

#### Trend Analysis
```bash
# Analyze music trends
python music_analysis_cli.py analyze-trends \
    --genre pop \
    --timeframe year \
    --region global

# Emerging artists detection
python music_analysis_cli.py detect-emerging \
    --genre electronic \
    --threshold 0.8 \
    --output emerging-artists.json
```

## 🛠️ Development and Testing CLI

### Development Tools

#### Model Testing Framework
```bash
# Run comprehensive model tests
python dev_cli.py test-models --comprehensive

# Test specific model capabilities
python dev_cli.py test-model \
    --model imagen-3.0-generate-001 \
    --test-suite image-generation

# Performance benchmarking
python dev_cli.py benchmark \
    --models imagen-3.0-generate-001,imagegeneration@006 \
    --iterations 10 \
    --export benchmark-results.json
```

#### Integration Testing
```bash
# Test all integrations
python dev_cli.py test-integrations

# Test specific integration
python dev_cli.py test-integration --service vertex-ai
python dev_cli.py test-integration --service spotify

# End-to-end testing
python dev_cli.py test-e2e --scenario full-workflow
```

#### Code Generation
```bash
# Generate API client code
python dev_cli.py generate-client \
    --service generative-ai \
    --language python \
    --output ./generated-clients

# Generate documentation
python dev_cli.py generate-docs \
    --format markdown \
    --output ./docs-generated

# Generate test fixtures
python dev_cli.py generate-fixtures \
    --service all \
    --output ./test-fixtures
```

## 📊 Analytics and Reporting CLI

### Usage Analytics
```bash
# Generate usage reports
python analytics_cli.py usage-report \
    --period month \
    --format pdf \
    --output monthly-usage.pdf

# Cost analysis report
python analytics_cli.py cost-analysis \
    --breakdown-by service,model,user \
    --period quarter \
    --export cost-analysis.xlsx

# Performance metrics
python analytics_cli.py performance-metrics \
    --metrics latency,success_rate,quality_score \
    --period week
```

### Data Export
```bash
# Export all data
python analytics_cli.py export-data \
    --format json \
    --include generations,analysis,costs \
    --output ./data-export

# Export for analysis
python analytics_cli.py export-for-analysis \
    --tool tableau \
    --period year \
    --output data-for-tableau.csv

# Export user data (GDPR compliant)
python analytics_cli.py export-user-data \
    --user-id user_123 \
    --format json \
    --include-personal-data false
```

## 🔧 Configuration and Management CLI

### System Configuration
```bash
# View system status
python admin_cli.py status

# Update configuration
python admin_cli.py config update \
    --setting max_concurrent_requests \
    --value 20

# Reset to defaults
python admin_cli.py config reset --confirm

# Backup configuration
python admin_cli.py config backup \
    --output config-backup-$(date +%Y%m%d).json
```

### Service Management
```bash
# Restart services
python admin_cli.py service restart --service generative-ai
python admin_cli.py service restart --all

# Check service health
python admin_cli.py service health --detailed

# Update service endpoints
python admin_cli.py service update-endpoints \
    --config new-endpoints.json
```

### Database Management
```bash
# Database health check
python admin_cli.py db health

# Backup database
python admin_cli.py db backup \
    --output db-backup-$(date +%Y%m%d).sql

# Migrate database
python admin_cli.py db migrate --version latest

# Clean old data
python admin_cli.py db cleanup \
    --older-than 90days \
    --dry-run
```

## 🚀 Automation and Scripting

### Script Templates

#### Daily Automation Script
```bash
#!/bin/bash
# daily-automation.sh

# Generate daily social media content
python generative_ai_cli.py generate-image \
    "Daily music inspiration $(date +%B\ %d)" \
    --model imagegeneration@006 \
    --style digital-art \
    --output-dir ./daily-content

# Analyze yesterday's metrics
python unified_agent_cli.py test \
    --prompt "Analyze yesterday's user engagement and provide insights" \
    --model claude-opus-4.1 \
    --export daily-analysis-$(date +%Y%m%d).json

# Generate usage report
python analytics_cli.py usage-report \
    --period yesterday \
    --format summary \
    --output daily-summary.txt
```

#### Weekly Batch Processing
```bash
#!/bin/bash
# weekly-batch.sh

# Generate weekly playlist covers
python generative_ai_cli.py batch-generate \
    --config weekly-playlists-config.json \
    --output-dir ./weekly-content

# Comprehensive performance analysis
python unified_agent_cli.py consensus \
    --prompt "Weekly performance review and strategic recommendations" \
    --models claude-opus-4.1,gemini-pro \
    --export weekly-review-$(date +%Y%m%d).md

# Cost optimization analysis
python analytics_cli.py cost-analysis \
    --period week \
    --optimization-suggestions \
    --export weekly-cost-optimization.json
```

### Integration Scripts

#### Webhook Handler
```python
#!/usr/bin/env python3
# webhook-handler.py

import json
import subprocess
import sys

def handle_generation_complete(data):
    """Handle completed generation webhook."""
    
    output_file = data.get('output_file')
    model_used = data.get('model')
    
    # Analyze quality
    subprocess.run([
        'python', 'generative_ai_cli.py', 'analyze-quality',
        '--input', output_file,
        '--model', model_used,
        '--export', f'quality-{data["id"]}.json'
    ])
    
    # Send notification
    subprocess.run([
        'python', 'notification_cli.py', 'send',
        '--message', f'Generation {data["id"]} completed',
        '--type', 'success'
    ])

if __name__ == '__main__':
    webhook_data = json.loads(sys.stdin.read())
    event_type = webhook_data.get('event_type')
    
    if event_type == 'generation_complete':
        handle_generation_complete(webhook_data)
```

## 📚 CLI Best Practices

### Error Handling
```bash
# Use verbose mode for debugging
python generative_ai_cli.py generate-image "test" --verbose

# Capture and log errors
python generative_ai_cli.py generate-image "test" 2>&1 | tee generation.log

# Retry failed operations
python generative_ai_cli.py generate-image "test" --retry 3 --retry-delay 5
```

### Performance Optimization
```bash
# Use parallel processing for batch operations
python generative_ai_cli.py batch-generate \
    --config large-batch.json \
    --parallel 5

# Enable caching for repeated operations
python unified_agent_cli.py test \
    --prompt "repeated analysis" \
    --cache-enabled

# Optimize output formats
python analytics_cli.py usage-report \
    --format compact \
    --compress
```

### Security Best Practices
```bash
# Use environment variables for secrets
export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/key.json"

# Validate inputs
python generative_ai_cli.py generate-image \
    --prompt-file secure-prompts.txt \
    --validate-inputs

# Log operations for audit
python admin_cli.py config set audit_logging true
```

## 🔍 Troubleshooting Guide

### Common Issues and Solutions

#### Authentication Issues
```bash
# Verify credentials
python admin_cli.py auth verify

# Refresh authentication
python admin_cli.py auth refresh

# Test connection
python admin_cli.py connectivity test --service vertex-ai
```

#### Performance Issues
```bash
# Check system resources
python admin_cli.py system resources

# Monitor active operations
python admin_cli.py monitor --real-time

# Profile performance
python dev_cli.py profile --operation image-generation
```

#### Output Issues
```bash
# Validate output directory permissions
python admin_cli.py validate-permissions --path ./output

# Check disk space
python admin_cli.py system disk-space

# Verify output format
python dev_cli.py validate-output --file generated-image.png
```

## 📋 Quick Reference

### Essential Commands
```bash
# Generate image
python generative_ai_cli.py generate-image "prompt"

# Generate video  
python generative_ai_cli.py generate-video "prompt"

# Test LLM agent
python unified_agent_cli.py test "analysis prompt"

# Check system status
python admin_cli.py status

# View usage statistics
python analytics_cli.py usage-report
```

### Common Flags
- `--help`: Show help information
- `--verbose`: Enable verbose output
- `--dry-run`: Preview operation without execution
- `--export`: Export results to file
- `--config`: Use custom configuration file
- `--parallel`: Enable parallel processing

---

**Last Updated**: January 2025  
**CLI Version**: 2.0.0  
**Total Commands**: 150+ across all CLI tools ✅