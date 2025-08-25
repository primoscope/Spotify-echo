# Slash Commands Reference

## 📋 Overview

EchoTune AI provides a comprehensive suite of slash commands for interacting with generative AI models, unified LLM agents, and system management. This reference covers all available commands, their parameters, usage examples, and best practices.

## 🎨 Generative AI Commands

### Image Generation Commands

#### `/generate-image` - Create Images
Generate high-quality images using various AI models.

**Syntax:**
```bash
/generate-image <prompt> [--model=MODEL] [--style=STYLE] [--aspect-ratio=RATIO] [--count=N]
```

**Parameters:**
- `prompt` (required): Text description of the image to generate
- `--model` (optional): Model to use (default: imagen-3.0-generate-001)
  - `imagen-3.0-generate-001` - Premium quality (1536x1536)
  - `imagegeneration@006` - Balanced quality (1024x1024)
  - `flux-1-dev` - Artistic style
  - `stable-diffusion-xl-base-1.0` - Photorealistic
- `--style` (optional): Visual style
  - `photographic` - Professional photography
  - `digital-art` - Digital artwork
  - `cinematic` - Movie-like quality
  - `artistic` - Creative and artistic
  - `minimalist` - Clean and simple
- `--aspect-ratio` (optional): Image dimensions
  - `1:1` - Square (default)
  - `16:9` - Landscape
  - `9:16` - Portrait
  - `4:3` - Photo landscape
  - `3:4` - Photo portrait
- `--count` (optional): Number of images (1-8, default: 1)

**Examples:**
```bash
# Basic image generation
/generate-image "Professional music studio with vintage equipment"

# Specify model and style
/generate-image "Concert stage with dramatic lighting" --model=imagen-3.0-generate-001 --style=cinematic

# Generate multiple variations
/generate-image "Album cover art, abstract music visualization" --count=4 --aspect-ratio=1:1

# Artistic style with FLUX
/generate-image "Surreal music composition" --model=flux-1-dev --style=artistic

# Photorealistic with Stable Diffusion XL
/generate-image "Musician playing guitar in natural lighting" --model=stable-diffusion-xl-base-1.0 --style=photographic
```

**Response Format:**
```json
{
  "success": true,
  "images_generated": 1,
  "model_used": "imagen-3.0-generate-001",
  "generation_time": 3.2,
  "cost_estimate": 0.025,
  "output_files": ["imagen3_studio_001.png"],
  "metadata": {
    "prompt": "Professional music studio with vintage equipment",
    "style": "photographic",
    "aspect_ratio": "16:9",
    "resolution": "1536x864"
  }
}
```

---

#### `/generate-video` - Create Videos
Generate dynamic video content using AI models.

**Syntax:**
```bash
/generate-video <prompt> [--model=MODEL] [--duration=SECONDS] [--resolution=RES] [--fps=FPS]
```

**Parameters:**
- `prompt` (required): Text description of the video to generate
- `--model` (optional): Video model to use
  - `veo-2.0-001` - Premium quality (4K, up to 120s)
  - `veo-1.5-001` - Standard quality (1080p, up to 60s)
- `--duration` (optional): Video length in seconds (4-120, default: 10)
- `--resolution` (optional): Video resolution
  - `4K` - 3840x2160 (Veo 2.0 only)
  - `1080p` - 1920x1080 (default)
  - `720p` - 1280x720
- `--fps` (optional): Frames per second (24 or 30, default: 24)

**Examples:**
```bash
# Basic video generation
/generate-video "Dynamic music visualization with flowing colors"

# High-quality long video
/generate-video "Epic concert atmosphere" --model=veo-2.0-001 --duration=30 --resolution=4K --fps=30

# Quick social media video
/generate-video "Album artwork animation" --model=veo-1.5-001 --duration=8 --resolution=1080p

# Music festival promo
/generate-video "Energetic music festival with crowd and stage lighting" --duration=15 --fps=30
```

**Response Format:**
```json
{
  "success": true,
  "video_generated": true,
  "model_used": "veo-2.0-001",
  "generation_time": 45.8,
  "cost_estimate": 0.75,
  "output_file": "veo2_concert_001.mp4",
  "metadata": {
    "prompt": "Epic concert atmosphere",
    "duration_seconds": 30,
    "resolution": "4K",
    "fps": 30,
    "file_size_mb": 127.5
  }
}
```

---

### Model Management Commands

#### `/list-models` - Show Available Models
Display all available generative AI models and their capabilities.

**Syntax:**
```bash
/list-models [--type=TYPE] [--provider=PROVIDER]
```

**Parameters:**
- `--type` (optional): Filter by model type
  - `image` - Image generation models only
  - `video` - Video generation models only
  - `all` - All models (default)
- `--provider` (optional): Filter by provider
  - `google` - Google Vertex AI models
  - `huggingface` - HuggingFace models
  - `all` - All providers (default)

**Examples:**
```bash
# List all models
/list-models

# List only image models
/list-models --type=image

# List Google models only
/list-models --provider=google

# List HuggingFace image models
/list-models --type=image --provider=huggingface
```

**Response Format:**
```json
{
  "total_models": 6,
  "image_models": 4,
  "video_models": 2,
  "models": [
    {
      "id": "imagen-3.0-generate-001",
      "name": "Imagen 3.0",
      "type": "image",
      "provider": "google",
      "capabilities": {
        "max_resolution": "1536x1536",
        "cost_per_image": 0.025,
        "generation_time": "2-4 seconds",
        "supported_styles": ["photographic", "artistic", "cinematic"]
      }
    }
  ]
}
```

---

#### `/model-status` - Check Model Health
Check the operational status of all AI models.

**Syntax:**
```bash
/model-status [--model=MODEL_ID]
```

**Parameters:**
- `--model` (optional): Check specific model (default: all models)

**Examples:**
```bash
# Check all models
/model-status

# Check specific model
/model-status --model=imagen-3.0-generate-001
```

**Response Format:**
```json
{
  "overall_status": "healthy",
  "models_checked": 6,
  "healthy_models": 6,
  "unhealthy_models": 0,
  "model_details": [
    {
      "model_id": "imagen-3.0-generate-001",
      "status": "healthy",
      "response_time_ms": 250,
      "last_check": "2025-01-15T10:30:00Z",
      "quota_remaining": "85%"
    }
  ]
}
```

---

## 🤖 Unified LLM Agent Commands

### Multi-Model Interaction Commands

#### `/model-test` - Test Specific Models
Test individual LLM models with specific prompts.

**Syntax:**
```bash
/model-test prompt="<PROMPT>" [model=MODEL] [reasoning=LEVEL]
```

**Parameters:**
- `prompt` (required): Test prompt for the model
- `model` (optional): Specific model to test
  - `gemini-pro` - Fast general-purpose model
  - `claude-opus-4.1` - Deep reasoning model
  - `auto` - Auto-select based on prompt (default)
- `reasoning` (optional): Reasoning depth
  - `fast` - Quick response
  - `deep` - Detailed analysis with multi-step reasoning

**Examples:**
```bash
# Test with auto-selection
/model-test prompt="Analyze the impact of streaming on music industry"

# Test specific model
/model-test prompt="Explain recommendation algorithms" model=claude-opus-4.1

# Deep reasoning request
/model-test prompt="Why did user engagement decrease?" model=claude-opus-4.1 reasoning=deep

# Quick response test
/model-test prompt="Summarize key metrics" model=gemini-pro reasoning=fast
```

**Response Format:**
```json
{
  "run_id": "run_2025-01-15T10:30:15.123Z",
  "mode": "single_model",
  "model_used": "claude-opus-4.1",
  "reasoning_level": "deep",
  "response": "Detailed analysis of streaming impact...",
  "confidence_score": 0.92,
  "generation_time_ms": 3450,
  "cost_estimate": 0.012,
  "verification": {
    "hash": "abc123def456",
    "model_version": "claude-3-opus-20241022"
  }
}
```

---

#### `/multi-run` - Consensus Analysis
Run multiple models on the same prompt and compare results.

**Syntax:**
```bash
/multi-run models=MODEL1,MODEL2 prompt="<PROMPT>" [consensus=true/false]
```

**Parameters:**
- `models` (required): Comma-separated list of models
- `prompt` (required): Prompt to test across models
- `consensus` (optional): Generate consensus analysis (default: true)

**Examples:**
```bash
# Compare two models
/multi-run models=gemini-pro,claude-opus-4.1 prompt="Analyze user retention patterns"

# Multiple model comparison without consensus
/multi-run models=gemini-pro,claude-opus-4.1 prompt="Summarize Q4 performance" consensus=false

# Full consensus analysis
/multi-run models=gemini-pro,claude-opus-4.1 prompt="Explain recommendation engine bias" consensus=true
```

**Response Format:**
```json
{
  "run_id": "run_2025-01-15T10:35:22.456Z",
  "mode": "multi_model",
  "models_used": ["gemini-pro", "claude-opus-4.1"],
  "responses": [
    {
      "model": "gemini-pro",
      "response": "User retention analysis...",
      "confidence": 0.87,
      "generation_time_ms": 1200
    },
    {
      "model": "claude-opus-4.1", 
      "response": "Detailed retention patterns...",
      "confidence": 0.94,
      "generation_time_ms": 3800
    }
  ],
  "consensus_analysis": {
    "similarity_score": 0.78,
    "unique_insights": ["Gemini focused on metrics", "Claude provided causal analysis"],
    "recommendation": "Combine both perspectives for comprehensive view"
  }
}
```

---

#### `/model-route` - Intelligent Routing
Automatically route prompts to the most appropriate model.

**Syntax:**
```bash
/model-route task="<TASK_DESCRIPTION>"
```

**Parameters:**
- `task` (required): Description of the task to be performed

**Examples:**
```bash
# Quick analysis task
/model-route task="Summarize today's user metrics"

# Complex reasoning task
/model-route task="Explain causal factors behind engagement drop"

# Creative task
/model-route task="Generate creative marketing ideas for new album"

# Technical analysis
/model-route task="Deep dive into recommendation algorithm performance"
```

**Response Format:**
```json
{
  "run_id": "run_2025-01-15T10:40:33.789Z",
  "mode": "auto_routed",
  "selected_model": "claude-opus-4.1",
  "routing_reason": "Complex causal analysis requires deep reasoning",
  "confidence_in_routing": 0.95,
  "response": "Detailed analysis of engagement factors...",
  "alternative_models": ["gemini-pro"],
  "routing_time_ms": 150
}
```

---

### Analysis and Reporting Commands

#### `/run-report` - Get Generation Report
Retrieve detailed report for a specific run.

**Syntax:**
```bash
/run-report run_id=<RUN_ID>
```

**Parameters:**
- `run_id` (required): The run ID from a previous command

**Examples:**
```bash
# Get report for specific run
/run-report run_id=run_2025-01-15T10:30:15.123Z
```

**Response Format:**
```json
{
  "run_id": "run_2025-01-15T10:30:15.123Z",
  "timestamp": "2025-01-15T10:30:15.123Z",
  "command_used": "/model-test",
  "parameters": {
    "prompt": "Analyze streaming impact",
    "model": "claude-opus-4.1",
    "reasoning": "deep"
  },
  "execution_details": {
    "total_time_ms": 3450,
    "model_time_ms": 3200,
    "processing_time_ms": 250
  },
  "cost_breakdown": {
    "input_tokens": 145,
    "output_tokens": 892,
    "total_cost_usd": 0.012
  },
  "quality_metrics": {
    "response_length": 1247,
    "confidence_score": 0.92,
    "reasoning_steps": 5
  }
}
```

---

#### `/agent-status` - System Health Check
Check the overall health and status of the AI agent system.

**Syntax:**
```bash
/agent-status [--detailed=true/false]
```

**Parameters:**
- `--detailed` (optional): Show detailed system information (default: false)

**Examples:**
```bash
# Quick status check
/agent-status

# Detailed system information
/agent-status --detailed=true
```

**Response Format:**
```json
{
  "system_status": "healthy",
  "uptime_hours": 72.5,
  "models_available": {
    "generative_ai": 6,
    "llm_agents": 2
  },
  "current_load": {
    "active_requests": 3,
    "queue_size": 0,
    "avg_response_time_ms": 2100
  },
  "resource_usage": {
    "memory_usage_percent": 45,
    "cpu_usage_percent": 23,
    "storage_available_gb": 847
  },
  "recent_performance": {
    "requests_last_hour": 127,
    "success_rate_percent": 99.2,
    "avg_cost_per_request": 0.018
  }
}
```

---

## 🎵 Music-Specific Commands

### Spotify Integration Commands

#### `/analyze-playlist` - Playlist Analysis
Analyze Spotify playlists for insights and recommendations.

**Syntax:**
```bash
/analyze-playlist <playlist_id> [--depth=LEVEL] [--recommendations=true/false]
```

**Parameters:**
- `playlist_id` (required): Spotify playlist ID or URL
- `--depth` (optional): Analysis depth
  - `basic` - Track count, genres, basic stats
  - `detailed` - Audio features, mood analysis
  - `comprehensive` - Full analysis with ML insights (default)
- `--recommendations` (optional): Generate recommendations (default: true)

**Examples:**
```bash
# Basic playlist analysis
/analyze-playlist 37i9dQZF1DXcBWIGoYBM5M --depth=basic

# Comprehensive analysis with recommendations
/analyze-playlist spotify:playlist:37i9dQZF1DXcBWIGoYBM5M --depth=comprehensive --recommendations=true

# Detailed analysis without recommendations
/analyze-playlist https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M --depth=detailed --recommendations=false
```

**Response Format:**
```json
{
  "playlist_id": "37i9dQZF1DXcBWIGoYBM5M",
  "playlist_name": "Today's Top Hits",
  "total_tracks": 50,
  "analysis": {
    "genres": ["pop", "hip-hop", "electronic"],
    "mood_distribution": {
      "energetic": 35,
      "chill": 10,
      "melancholic": 5
    },
    "audio_features": {
      "avg_danceability": 0.73,
      "avg_energy": 0.68,
      "avg_valence": 0.54
    }
  },
  "recommendations": [
    {
      "track_name": "Suggested Song 1",
      "artist": "Artist Name",
      "reason": "Matches playlist energy and style",
      "confidence": 0.89
    }
  ]
}
```

---

#### `/recommend-music` - Music Recommendations
Generate personalized music recommendations.

**Syntax:**
```bash
/recommend-music [--user=USER_ID] [--mood=MOOD] [--genre=GENRE] [--count=N]
```

**Parameters:**
- `--user` (optional): Spotify user ID for personalized recommendations
- `--mood` (optional): Target mood
  - `happy`, `sad`, `energetic`, `chill`, `angry`, `romantic`
- `--genre` (optional): Target genre
- `--count` (optional): Number of recommendations (default: 10)

**Examples:**
```bash
# Personalized recommendations
/recommend-music --user=spotify_user_123 --count=20

# Mood-based recommendations
/recommend-music --mood=energetic --genre=rock --count=15

# General recommendations
/recommend-music --mood=chill --count=10
```

**Response Format:**
```json
{
  "recommendations": [
    {
      "track_id": "4uLU6hMCjMI75M1A2tKUQC",
      "track_name": "Track Name",
      "artist": "Artist Name",
      "album": "Album Name",
      "confidence_score": 0.92,
      "reason": "Matches your listening patterns",
      "spotify_url": "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
    }
  ],
  "recommendation_engine": "collaborative_filtering_ml",
  "based_on": ["user_history", "mood_preference", "genre_filter"],
  "total_recommended": 10
}
```

---

## 🔧 System Management Commands

### Configuration Commands

#### `/config-set` - Update Configuration
Update system configuration settings.

**Syntax:**
```bash
/config-set <setting>=<value>
```

**Parameters:**
- `setting=value` (required): Configuration setting and its new value

**Available Settings:**
- `default_image_model` - Default model for image generation
- `default_video_model` - Default model for video generation
- `max_concurrent_requests` - Maximum concurrent AI requests
- `enable_cost_tracking` - Enable/disable cost tracking
- `auto_quality_enhancement` - Automatic prompt enhancement
- `cache_responses` - Cache AI responses

**Examples:**
```bash
# Set default image model
/config-set default_image_model=imagen-3.0-generate-001

# Enable cost tracking
/config-set enable_cost_tracking=true

# Set concurrent request limit
/config-set max_concurrent_requests=5

# Enable response caching
/config-set cache_responses=true
```

**Response Format:**
```json
{
  "setting_updated": "default_image_model",
  "old_value": "imagegeneration@006",
  "new_value": "imagen-3.0-generate-001",
  "requires_restart": false,
  "effective_immediately": true
}
```

---

#### `/config-get` - View Configuration
View current system configuration.

**Syntax:**
```bash
/config-get [setting]
```

**Parameters:**
- `setting` (optional): Specific setting to view (default: all settings)

**Examples:**
```bash
# View all configuration
/config-get

# View specific setting
/config-get default_image_model
```

**Response Format:**
```json
{
  "configuration": {
    "default_image_model": "imagen-3.0-generate-001",
    "default_video_model": "veo-2.0-001",
    "max_concurrent_requests": 10,
    "enable_cost_tracking": true,
    "auto_quality_enhancement": true,
    "cache_responses": true
  },
  "last_updated": "2025-01-15T10:30:00Z",
  "config_version": "1.2.0"
}
```

---

### Monitoring Commands

#### `/usage-stats` - Usage Statistics
View detailed usage statistics and analytics.

**Syntax:**
```bash
/usage-stats [--period=PERIOD] [--model=MODEL]
```

**Parameters:**
- `--period` (optional): Time period for statistics
  - `hour` - Last hour
  - `day` - Last 24 hours (default)
  - `week` - Last 7 days
  - `month` - Last 30 days
- `--model` (optional): Filter by specific model

**Examples:**
```bash
# Daily usage stats
/usage-stats

# Weekly stats for specific model
/usage-stats --period=week --model=imagen-3.0-generate-001

# Hourly stats across all models
/usage-stats --period=hour
```

**Response Format:**
```json
{
  "period": "day",
  "total_requests": 247,
  "successful_requests": 244,
  "success_rate_percent": 98.8,
  "total_cost_usd": 5.67,
  "avg_cost_per_request": 0.023,
  "model_breakdown": {
    "imagen-3.0-generate-001": {
      "requests": 89,
      "cost": 2.23,
      "avg_response_time_ms": 3200
    },
    "veo-2.0-001": {
      "requests": 12,
      "cost": 1.44,
      "avg_response_time_ms": 45000
    }
  },
  "peak_usage_hour": "14:00-15:00",
  "most_used_model": "imagen-3.0-generate-001"
}
```

---

#### `/cost-report` - Cost Analysis
Generate detailed cost analysis and projections.

**Syntax:**
```bash
/cost-report [--period=PERIOD] [--forecast=true/false]
```

**Parameters:**
- `--period` (optional): Analysis period (day, week, month)
- `--forecast` (optional): Include cost forecasting (default: false)

**Examples:**
```bash
# Monthly cost report
/cost-report --period=month

# Weekly report with forecast
/cost-report --period=week --forecast=true
```

**Response Format:**
```json
{
  "period": "month",
  "total_cost_usd": 156.78,
  "cost_breakdown": {
    "image_generation": 89.45,
    "video_generation": 52.33,
    "llm_usage": 15.00
  },
  "cost_by_model": {
    "imagen-3.0-generate-001": 45.67,
    "veo-2.0-001": 42.11,
    "claude-opus-4.1": 12.34
  },
  "forecast": {
    "next_month_estimate": 178.23,
    "trend": "increasing",
    "confidence": 0.87
  },
  "optimization_suggestions": [
    "Consider using Imagen 2.0 for non-premium content",
    "Implement response caching to reduce redundant requests"
  ]
}
```

---

## 🚀 Advanced Commands

### Batch Processing Commands

#### `/batch-generate` - Batch Operations
Process multiple generation requests efficiently.

**Syntax:**
```bash
/batch-generate type=<TYPE> requests=<REQUEST_LIST>
```

**Parameters:**
- `type` (required): Batch operation type
  - `image` - Batch image generation
  - `video` - Batch video generation
  - `mixed` - Mixed content generation
- `requests` (required): JSON array of requests

**Examples:**
```bash
# Batch image generation
/batch-generate type=image requests='[
  {"prompt": "Album cover 1", "model": "imagen-3.0-generate-001"},
  {"prompt": "Album cover 2", "model": "imagen-2.0"},
  {"prompt": "Album cover 3", "model": "flux-1-dev"}
]'

# Batch video generation
/batch-generate type=video requests='[
  {"prompt": "Music video 1", "duration": 15},
  {"prompt": "Music video 2", "duration": 30}
]'
```

**Response Format:**
```json
{
  "batch_id": "batch_2025-01-15T10:45:00.123Z",
  "total_requests": 3,
  "successful_generations": 3,
  "failed_generations": 0,
  "total_time_seconds": 12.5,
  "total_cost_usd": 0.075,
  "results": [
    {
      "request_index": 0,
      "success": true,
      "output_file": "album_cover_1.png",
      "generation_time": 3.2
    }
  ],
  "batch_summary": {
    "success_rate_percent": 100,
    "avg_generation_time": 4.17,
    "cost_efficiency": "high"
  }
}
```

---

#### `/schedule-generation` - Scheduled Operations
Schedule AI generation tasks for later execution.

**Syntax:**
```bash
/schedule-generation task=<TASK> schedule=<SCHEDULE>
```

**Parameters:**
- `task` (required): Generation task configuration
- `schedule` (required): Execution schedule (cron format or natural language)

**Examples:**
```bash
# Daily social media content
/schedule-generation task='{"type": "image", "prompt": "Daily music inspiration", "model": "imagen-2.0"}' schedule="daily at 9:00 AM"

# Weekly playlist covers
/schedule-generation task='{"type": "batch", "requests": [{"prompt": "Weekly playlist cover"}]}' schedule="every Monday at 8:00 AM"

# Monthly reports
/schedule-generation task='{"type": "analysis", "action": "generate_monthly_report"}' schedule="0 0 1 * *"
```

**Response Format:**
```json
{
  "schedule_id": "sched_2025-01-15T10:50:00.456Z",
  "task_scheduled": true,
  "next_execution": "2025-01-16T09:00:00Z",
  "schedule_pattern": "daily at 9:00 AM",
  "task_details": {
    "type": "image",
    "estimated_cost": 0.020,
    "estimated_duration": 3
  },
  "status": "active"
}
```

---

### Integration Commands

#### `/webhook-setup` - Configure Webhooks
Set up webhooks for AI generation events.

**Syntax:**
```bash
/webhook-setup url=<URL> events=<EVENTS> [secret=SECRET]
```

**Parameters:**
- `url` (required): Webhook endpoint URL
- `events` (required): Comma-separated list of events
  - `generation_complete` - When AI generation finishes
  - `generation_failed` - When generation fails
  - `cost_threshold` - When cost threshold is exceeded
  - `quota_warning` - When approaching quota limits
- `secret` (optional): Webhook secret for verification

**Examples:**
```bash
# Basic webhook setup
/webhook-setup url=https://myapp.com/webhook events=generation_complete,generation_failed

# Webhook with secret
/webhook-setup url=https://myapp.com/webhook events=generation_complete,cost_threshold secret=my_webhook_secret
```

**Response Format:**
```json
{
  "webhook_id": "webhook_123",
  "url": "https://myapp.com/webhook",
  "events": ["generation_complete", "generation_failed"],
  "status": "active",
  "verification_sent": true,
  "created_at": "2025-01-15T10:55:00Z"
}
```

---

## 🔍 Command Discovery and Help

### Help Commands

#### `/help` - Command Help
Get help information for commands.

**Syntax:**
```bash
/help [command]
```

**Parameters:**
- `command` (optional): Specific command for detailed help

**Examples:**
```bash
# General help
/help

# Specific command help
/help generate-image

# Help for command category
/help generative-ai
```

---

#### `/commands` - List All Commands
List all available commands with brief descriptions.

**Syntax:**
```bash
/commands [--category=CATEGORY]
```

**Parameters:**
- `--category` (optional): Filter by command category
  - `generative-ai` - Image and video generation
  - `llm-agents` - Multi-model LLM interactions
  - `music` - Music-specific features
  - `system` - System management
  - `batch` - Batch processing
  - `all` - All commands (default)

**Examples:**
```bash
# List all commands
/commands

# List generative AI commands
/commands --category=generative-ai

# List system commands
/commands --category=system
```

---

## 📊 Command Response Standards

### Standard Response Format
All commands follow a consistent response format:

```json
{
  "success": true,
  "command": "/generate-image",
  "timestamp": "2025-01-15T10:30:15.123Z",
  "execution_time_ms": 3450,
  "data": {
    // Command-specific response data
  },
  "metadata": {
    "version": "1.0.0",
    "cost_usd": 0.025,
    "rate_limit_remaining": 95
  },
  "errors": [],
  "warnings": []
}
```

### Error Response Format
When commands fail, they return structured error information:

```json
{
  "success": false,
  "command": "/generate-image",
  "timestamp": "2025-01-15T10:30:15.123Z",
  "error": {
    "code": "INVALID_MODEL",
    "message": "Model 'invalid-model' not found",
    "details": {
      "available_models": ["imagen-3.0-generate-001", "imagegeneration@006"],
      "suggestion": "Use /list-models to see available options"
    }
  },
  "retry_after": null
}
```

---

## 🎯 Best Practices

### Command Usage Guidelines

1. **Be Specific**: Use detailed prompts for better results
2. **Choose Appropriate Models**: Select models based on quality vs cost needs
3. **Use Batch Processing**: For multiple requests to improve efficiency
4. **Monitor Costs**: Regularly check usage with `/usage-stats` and `/cost-report`
5. **Cache Results**: Enable caching for repeated requests
6. **Handle Errors**: Implement proper error handling in integrations

### Performance Optimization

1. **Model Selection**: Use auto-routing when uncertain about model choice
2. **Concurrent Limits**: Don't exceed system concurrent request limits
3. **Request Sizing**: Batch similar requests together
4. **Quality Settings**: Balance quality needs with cost constraints
5. **Monitoring**: Set up webhooks for automated monitoring

### Security Considerations

1. **API Keys**: Never include API keys in command parameters
2. **Webhooks**: Always use secrets for webhook verification
3. **Content Filtering**: Be aware of content policy restrictions
4. **Rate Limiting**: Respect system rate limits to avoid blocking

---

**Last Updated**: January 2025  
**Command Set Version**: 2.0.0  
**Total Commands**: 25+ commands across 6 categories ✅