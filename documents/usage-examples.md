# Usage Examples

## 📋 Overview

This comprehensive collection of practical examples demonstrates how to leverage EchoTune AI's capabilities across various real-world scenarios. From simple image generation to complex multi-modal workflows, these examples provide ready-to-use implementations for common tasks.

## 🎨 Image Generation Examples

### Basic Image Generation

#### Simple Album Cover
```python
from src.services.generative_ai_service import GenerativeAIService
from src.services.generative_ai_service import GenerationRequest, GenerativeModelType

# Initialize service
service = GenerativeAIService()
await service.initialize()

# Create album cover
request = GenerationRequest(
    model_id="imagen-3.0-generate-001",
    prompt="Professional album cover for indie rock band, vintage aesthetic, warm colors",
    model_type=GenerativeModelType.IMAGE_GENERATION,
    aspect_ratio="1:1",
    style="photographic"
)

response = await service.generate_image(request)
print(f"Generated album cover: {response.content_paths[0]}")
```

#### Social Media Content Series
```python
# Generate consistent social media content
social_prompts = [
    "Monday motivation music quote, minimalist design, inspiring typography",
    "Behind the scenes studio photo, musicians working, candid moment",
    "New release announcement, album artwork preview, exciting design",
    "Concert photo memories, crowd energy, stage lighting",
    "Artist spotlight feature, professional portrait, creative composition"
]

for i, prompt in enumerate(social_prompts):
    request = GenerationRequest(
        model_id="imagegeneration@006",  # Cost-effective for social media
        prompt=prompt,
        model_type=GenerativeModelType.IMAGE_GENERATION,
        aspect_ratio="1:1"  # Instagram square format
    )
    
    response = await service.generate_image(request)
    print(f"Social media post {i+1}: {response.content_paths[0]}")
```

### Advanced Image Workflows

#### A/B Testing Album Covers
```python
# Test different styles for album cover
base_prompt = "Electronic music album cover, futuristic theme"

styles_to_test = [
    {"style": "cyberpunk", "model": "flux-1-dev"},
    {"style": "minimalist", "model": "imagen-3.0-generate-001"},
    {"style": "photographic", "model": "stable-diffusion-xl-base-1.0"},
    {"style": "artistic", "model": "flux-1-dev"}
]

test_results = []

for test in styles_to_test:
    request = GenerationRequest(
        model_id=test["model"],
        prompt=f"{base_prompt}, {test['style']} style",
        model_type=GenerativeModelType.IMAGE_GENERATION,
        aspect_ratio="1:1"
    )
    
    response = await service.generate_image(request)
    
    test_results.append({
        "style": test["style"],
        "model": test["model"],
        "image_path": response.content_paths[0],
        "cost": response.cost_estimate,
        "generation_time": response.generation_time_ms
    })

# Analyze results
for result in test_results:
    print(f"Style: {result['style']}, Cost: ${result['cost']:.3f}, Time: {result['generation_time']:.0f}ms")
```

#### Brand Consistency Workflow
```python
# Maintain brand consistency across multiple assets
brand_guidelines = {
    "color_palette": "deep blues and gold accents",
    "style": "modern minimalist with professional photography elements",
    "mood": "sophisticated and premium",
    "typography_hint": "clean sans-serif style"
}

brand_assets = [
    "Artist profile banner with logo placement",
    "Concert poster with event details layout",
    "Merchandise design for t-shirt",
    "Social media profile picture",
    "Album back cover with track listing space"
]

for asset in brand_assets:
    enhanced_prompt = f"{asset}, {brand_guidelines['color_palette']}, {brand_guidelines['style']}, {brand_guidelines['mood']}"
    
    request = GenerationRequest(
        model_id="imagen-3.0-generate-001",
        prompt=enhanced_prompt,
        model_type=GenerativeModelType.IMAGE_GENERATION,
        aspect_ratio="16:9" if "banner" in asset else "1:1"
    )
    
    response = await service.generate_image(request)
    print(f"Brand asset '{asset}': {response.content_paths[0]}")
```

## 🎬 Video Generation Examples

### Music Video Creation

#### Short-Form Music Video
```python
# Create engaging short-form music video content
video_segments = [
    {
        "prompt": "Artist performing with dynamic stage lighting, energetic performance",
        "duration": 8,
        "style": "high energy opening"
    },
    {
        "prompt": "Close-up of instruments with rhythmic movement, detailed textures",
        "duration": 6,
        "style": "intimate instrument focus"
    },
    {
        "prompt": "Crowd dancing and enjoying music, festival atmosphere",
        "duration": 10,
        "style": "audience connection"
    },
    {
        "prompt": "Artist silhouette against dramatic lighting, emotional conclusion",
        "duration": 6,
        "style": "powerful ending"
    }
]

video_files = []

for i, segment in enumerate(video_segments):
    request = GenerationRequest(
        model_id="veo-2.0-001",  # Premium quality for music video
        prompt=f"{segment['prompt']}, cinematic quality, professional music video style",
        model_type=GenerativeModelType.VIDEO_GENERATION,
        duration_seconds=segment['duration'],
        fps=30
    )
    
    response = await service.generate_video(request)
    video_files.append(response.content_paths[0])
    print(f"Video segment {i+1} ({segment['style']}): {response.content_paths[0]}")

print(f"Total segments generated: {len(video_files)}")
```

#### Promotional Video Campaign
```python
# Create comprehensive promotional video campaign
campaign_videos = {
    "teaser": {
        "prompt": "Album artwork coming to life with smooth animations, mysterious reveal",
        "duration": 10,
        "model": "veo-2.0-001",
        "resolution": "4K"
    },
    "behind_scenes": {
        "prompt": "Recording studio session, musicians at work, authentic documentary style",
        "duration": 20,
        "model": "veo-1.5-001",
        "resolution": "1080p"
    },
    "lyric_video": {
        "prompt": "Abstract visualization of music with flowing text elements, artistic style",
        "duration": 30,
        "model": "veo-2.0-001", 
        "resolution": "4K"
    },
    "social_snippet": {
        "prompt": "Quick concert highlights with energetic crowd, social media optimized",
        "duration": 15,
        "model": "veo-1.5-001",
        "resolution": "1080p"
    }
}

campaign_results = {}

for video_type, specs in campaign_videos.items():
    request = GenerationRequest(
        model_id=specs["model"],
        prompt=specs["prompt"],
        model_type=GenerativeModelType.VIDEO_GENERATION,
        duration_seconds=specs["duration"]
    )
    
    response = await service.generate_video(request)
    
    campaign_results[video_type] = {
        "file_path": response.content_paths[0],
        "cost": response.cost_estimate,
        "duration": specs["duration"],
        "model_used": specs["model"]
    }

# Calculate campaign totals
total_cost = sum(result["cost"] for result in campaign_results.values())
total_duration = sum(result["duration"] for result in campaign_results.values())

print(f"Campaign complete! Total cost: ${total_cost:.2f}, Total duration: {total_duration}s")
```

## 🤖 LLM Agent Integration Examples

### Music Analysis Workflows

#### Comprehensive Playlist Analysis
```python
from unified_llm_agent import UnifiedLLMAgent

# Initialize agent
agent = UnifiedLLMAgent()

# Analyze playlist with multi-model approach
playlist_data = {
    "id": "37i9dQZF1DXcBWIGoYBM5M",
    "name": "Today's Top Hits",
    "track_count": 50,
    "genres": ["pop", "hip-hop", "electronic"],
    "avg_energy": 0.73,
    "avg_danceability": 0.68
}

analysis_prompt = f"""
Analyze this playlist data and provide insights:
{json.dumps(playlist_data, indent=2)}

Please provide:
1. Genre distribution analysis
2. Energy and mood assessment
3. Target audience identification
4. Recommendations for similar playlists
5. Potential improvements
"""

# Get analysis from both models for comprehensive view
gemini_analysis = await agent.query_model(
    prompt=analysis_prompt,
    model="gemini-pro",
    reasoning_level="fast"
)

claude_analysis = await agent.query_model(
    prompt=analysis_prompt,
    model="claude-opus-4.1", 
    reasoning_level="deep"
)

# Generate consensus
consensus = await agent.generate_consensus([gemini_analysis, claude_analysis])

print("Playlist Analysis Results:")
print(f"Gemini Insights: {gemini_analysis['response']}")
print(f"Claude Deep Analysis: {claude_analysis['response']}")
print(f"Consensus Recommendations: {consensus['recommendations']}")
```

#### User Behavior Analysis
```python
# Analyze user listening patterns
user_data = {
    "user_id": "user_123",
    "listening_hours_per_day": 4.2,
    "top_genres": ["indie rock", "alternative", "folk"],
    "discovery_rate": 0.15,  # 15% new music
    "skip_rate": 0.23,       # 23% songs skipped
    "repeat_listening": 0.31, # 31% repeated tracks
    "device_usage": {"mobile": 0.7, "desktop": 0.2, "smart_speaker": 0.1}
}

behavior_analysis_prompt = f"""
Analyze this user's music listening behavior:
{json.dumps(user_data, indent=2)}

Provide insights on:
1. User engagement level and satisfaction
2. Music discovery preferences
3. Listening pattern optimization opportunities
4. Personalized recommendation strategies
5. Potential churn risk factors
"""

# Route to appropriate model based on complexity
routing_decision = await agent.route_request(behavior_analysis_prompt)

if routing_decision["approach"] == "multi_model":
    analysis = await agent.multi_model_analysis(
        prompt=behavior_analysis_prompt,
        models=routing_decision["models"]
    )
else:
    analysis = await agent.query_model(
        prompt=behavior_analysis_prompt,
        model=routing_decision["model"],
        reasoning_level="deep"
    )

print(f"User Behavior Analysis: {analysis}")
```

### Business Intelligence Workflows

#### Revenue Impact Analysis
```python
# Analyze impact of new features on revenue
feature_data = {
    "feature_name": "AI-Powered Playlist Generation",
    "launch_date": "2024-11-01",
    "user_adoption_rate": 0.34,
    "revenue_before": 125000,  # monthly
    "revenue_after": 142000,   # monthly
    "user_engagement_change": 0.18,  # 18% increase
    "cost_of_implementation": 85000
}

business_analysis_prompt = f"""
Analyze the business impact of this new feature:
{json.dumps(feature_data, indent=2)}

Provide comprehensive analysis including:
1. ROI calculation and break-even analysis
2. User adoption and engagement impact
3. Revenue attribution to the feature
4. Long-term value projection
5. Recommendations for optimization
"""

# Use Claude for complex business analysis
business_analysis = await agent.query_model(
    prompt=business_analysis_prompt,
    model="claude-opus-4.1",
    reasoning_level="deep"
)

print(f"Business Impact Analysis: {business_analysis['response']}")
```

## 🎵 End-to-End Music Production Workflows

### Complete Album Release Campaign

#### Campaign Planning and Execution
```python
# Comprehensive album release campaign
album_info = {
    "title": "Digital Dreams",
    "artist": "Neon Pulse",
    "genre": "Electronic/Synthwave",
    "release_date": "2025-03-15",
    "track_count": 12,
    "target_audience": "18-35, electronic music enthusiasts",
    "budget": 5000,
    "marketing_channels": ["social_media", "streaming_platforms", "music_blogs"]
}

# Step 1: Generate album artwork
album_artwork_request = GenerationRequest(
    model_id="imagen-3.0-generate-001",
    prompt=f"Professional album cover for '{album_info['title']}' by {album_info['artist']}, {album_info['genre']} music, futuristic neon aesthetic, high-end commercial quality",
    model_type=GenerativeModelType.IMAGE_GENERATION,
    aspect_ratio="1:1",
    style="photographic"
)

album_cover = await service.generate_image(album_artwork_request)

# Step 2: Create promotional videos
promo_videos = []

# Album announcement video
announcement_request = GenerationRequest(
    model_id="veo-2.0-001",
    prompt=f"Album announcement for '{album_info['title']}', animated album artwork reveal, electronic music visualization, professional quality",
    model_type=GenerativeModelType.VIDEO_GENERATION,
    duration_seconds=20
)

announcement_video = await service.generate_video(announcement_request)
promo_videos.append(announcement_video)

# Step 3: Generate social media content
social_content = []

for i in range(1, 8):  # Week of daily posts
    social_request = GenerationRequest(
        model_id="imagegeneration@006",
        prompt=f"Day {i} countdown to '{album_info['title']}' release, {album_info['genre']} aesthetic, engaging social media post",
        model_type=GenerativeModelType.IMAGE_GENERATION,
        aspect_ratio="1:1"
    )
    
    social_post = await service.generate_image(social_request)
    social_content.append(social_post)

# Step 4: Marketing strategy analysis
marketing_analysis_prompt = f"""
Create a comprehensive marketing strategy for this album release:
{json.dumps(album_info, indent=2)}

Generated assets:
- Album cover: {album_cover.content_paths[0]}
- Announcement video: {announcement_video.content_paths[0]}
- Social media posts: {len(social_content)} pieces

Provide:
1. Release timeline and milestones
2. Channel-specific strategies
3. Budget allocation recommendations
4. Success metrics and KPIs
5. Risk assessment and mitigation
"""

marketing_strategy = await agent.query_model(
    prompt=marketing_analysis_prompt,
    model="claude-opus-4.1",
    reasoning_level="deep"
)

# Calculate campaign costs
total_visual_cost = (album_cover.cost_estimate + 
                    announcement_video.cost_estimate + 
                    sum(post.cost_estimate for post in social_content))

print(f"""
Album Release Campaign Complete!
=================================
Album: {album_info['title']} by {album_info['artist']}
Generated Assets: {1 + 1 + len(social_content)} pieces
Total Generation Cost: ${total_visual_cost:.2f}
Marketing Strategy: Generated
Campaign Status: Ready for launch
""")
```

### Live Concert Promotion

#### Multi-Channel Concert Campaign
```python
# Concert promotion campaign
concert_info = {
    "artist": "Indie Collective",
    "venue": "The Echo Chamber",
    "date": "2025-02-20",
    "city": "Austin, TX",
    "ticket_price": 35,
    "genre": "Indie Rock/Alternative",
    "expected_attendance": 800
}

# Generate concert poster
poster_request = GenerationRequest(
    model_id="flux-1-dev",  # Artistic style for concert poster
    prompt=f"Concert poster for {concert_info['artist']} at {concert_info['venue']}, {concert_info['genre']} music, vintage concert poster aesthetic, artistic typography",
    model_type=GenerativeModelType.IMAGE_GENERATION,
    aspect_ratio="3:4"  # Poster format
)

concert_poster = await service.generate_image(poster_request)

# Create promotional video
promo_video_request = GenerationRequest(
    model_id="veo-1.5-001",
    prompt=f"Concert promotional video for {concert_info['artist']}, live performance energy, venue atmosphere, exciting announcement",
    model_type=GenerativeModelType.VIDEO_GENERATION,
    duration_seconds=25
)

promo_video = await service.generate_video(promo_video_request)

# Generate social media variants
social_variants = []
platforms = ["instagram_square", "instagram_story", "facebook_event", "twitter_post"]

for platform in platforms:
    aspect_ratios = {
        "instagram_square": "1:1",
        "instagram_story": "9:16", 
        "facebook_event": "16:9",
        "twitter_post": "16:9"
    }
    
    platform_request = GenerationRequest(
        model_id="imagegeneration@006",
        prompt=f"Concert promotion for {concert_info['artist']}, {platform} optimized, {concert_info['genre']} aesthetic",
        model_type=GenerativeModelType.IMAGE_GENERATION,
        aspect_ratio=aspect_ratios[platform]
    )
    
    platform_content = await service.generate_image(platform_request)
    social_variants.append({
        "platform": platform,
        "content": platform_content
    })

# Analyze promotion strategy
promotion_analysis_prompt = f"""
Analyze and optimize this concert promotion strategy:

Concert Details:
{json.dumps(concert_info, indent=2)}

Generated Assets:
- Main poster: High-quality artistic design
- Promotional video: 25-second dynamic content
- Platform-specific variants: {len(social_variants)} versions

Provide:
1. Multi-platform promotion timeline
2. Audience targeting strategies
3. Engagement optimization tactics
4. Ticket sales projections
5. ROI analysis for promotion spend
"""

promotion_strategy = await agent.query_model(
    prompt=promotion_analysis_prompt,
    model="claude-opus-4.1",
    reasoning_level="deep"
)

print(f"Concert Promotion Campaign: {concert_info['artist']} - {promotion_strategy['response']}")
```

## 🔧 Automation and Integration Examples

### Scheduled Content Generation

#### Daily Social Media Automation
```python
import schedule
import time
from datetime import datetime

class DailyContentGenerator:
    def __init__(self):
        self.service = GenerativeAIService()
        self.agent = UnifiedLLMAgent()
        
    async def generate_daily_content(self):
        """Generate daily social media content."""
        
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Generate inspirational music quote image
        quote_request = GenerationRequest(
            model_id="imagegeneration@006",
            prompt=f"Inspirational music quote for {current_date}, minimalist design, motivational typography, clean aesthetic",
            model_type=GenerativeModelType.IMAGE_GENERATION,
            aspect_ratio="1:1"
        )
        
        daily_quote = await self.service.generate_image(quote_request)
        
        # Generate trending music analysis
        trends_prompt = f"""
        Analyze current music trends for {current_date}:
        
        Provide a brief, engaging social media post about:
        1. Today's top trending genres
        2. Emerging artists to watch
        3. Recommendation for music discovery
        
        Keep it under 280 characters, engaging and informative.
        """
        
        trends_analysis = await self.agent.query_model(
            prompt=trends_prompt,
            model="gemini-pro",
            reasoning_level="fast"
        )
        
        # Save content with metadata
        content_metadata = {
            "date": current_date,
            "image_path": daily_quote.content_paths[0],
            "text_content": trends_analysis['response'],
            "generation_cost": daily_quote.cost_estimate,
            "hashtags": ["#MusicTrends", "#DailyMusic", f"#{current_date.replace(' ', '')}"]
        }
        
        print(f"Daily content generated for {current_date}")
        return content_metadata

# Schedule daily generation
generator = DailyContentGenerator()

async def daily_job():
    await generator.generate_daily_content()

# Schedule for 9 AM daily
schedule.every().day.at("09:00").do(lambda: asyncio.run(daily_job()))

# Keep scheduler running
while True:
    schedule.run_pending()
    time.sleep(60)
```

### Webhook Integration Example

#### Real-Time Content Processing
```python
from flask import Flask, request, jsonify
import asyncio

app = Flask(__name__)

class WebhookHandler:
    def __init__(self):
        self.service = GenerativeAIService()
        self.agent = UnifiedLLMAgent()
    
    async def process_new_track_upload(self, track_data):
        """Process newly uploaded track with automatic content generation."""
        
        # Extract track information
        track_name = track_data.get("name")
        artist_name = track_data.get("artist")
        genre = track_data.get("genre", "Unknown")
        
        # Generate track artwork
        artwork_request = GenerationRequest(
            model_id="flux-1-dev",
            prompt=f"Album single artwork for '{track_name}' by {artist_name}, {genre} music style, artistic design",
            model_type=GenerativeModelType.IMAGE_GENERATION,
            aspect_ratio="1:1"
        )
        
        track_artwork = await self.service.generate_image(artwork_request)
        
        # Generate promotional content
        promo_request = GenerationRequest(
            model_id="veo-1.5-001",
            prompt=f"Track promotion video for '{track_name}' by {artist_name}, {genre} visualization, engaging social media content",
            model_type=GenerativeModelType.VIDEO_GENERATION,
            duration_seconds=15
        )
        
        promo_video = await self.service.generate_video(promo_request)
        
        # Generate release strategy
        strategy_prompt = f"""
        Create a release strategy for this new track:
        
        Track: {track_name}
        Artist: {artist_name}
        Genre: {genre}
        
        Provide:
        1. Optimal release timing
        2. Platform-specific strategies
        3. Promotion recommendations
        4. Target audience analysis
        """
        
        release_strategy = await self.agent.query_model(
            prompt=strategy_prompt,
            model="claude-opus-4.1",
            reasoning_level="deep"
        )
        
        return {
            "track_id": track_data.get("id"),
            "generated_artwork": track_artwork.content_paths[0],
            "promotional_video": promo_video.content_paths[0],
            "release_strategy": release_strategy['response'],
            "total_cost": track_artwork.cost_estimate + promo_video.cost_estimate
        }

webhook_handler = WebhookHandler()

@app.route('/webhook/track-upload', methods=['POST'])
def handle_track_upload():
    track_data = request.json
    
    # Process asynchronously
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(
        webhook_handler.process_new_track_upload(track_data)
    )
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## 📊 Analytics and Optimization Examples

### Performance Monitoring

#### Comprehensive Analytics Dashboard
```python
import json
from datetime import datetime, timedelta

class AnalyticsDashboard:
    def __init__(self):
        self.service = GenerativeAIService()
        self.agent = UnifiedLLMAgent()
        
    async def generate_performance_report(self, period_days=30):
        """Generate comprehensive performance analysis."""
        
        # Simulate usage data (in real implementation, fetch from database)
        usage_data = {
            "total_generations": 247,
            "image_generations": 189,
            "video_generations": 58,
            "llm_queries": 312,
            "total_cost": 67.43,
            "success_rate": 98.4,
            "avg_quality_score": 4.2,
            "user_satisfaction": 4.6
        }
        
        # Analyze performance trends
        performance_analysis_prompt = f"""
        Analyze this {period_days}-day performance data:
        {json.dumps(usage_data, indent=2)}
        
        Provide insights on:
        1. Usage patterns and trends
        2. Cost efficiency analysis
        3. Quality and satisfaction metrics
        4. Optimization opportunities
        5. Growth projections
        """
        
        performance_insights = await self.agent.query_model(
            prompt=performance_analysis_prompt,
            model="claude-opus-4.1",
            reasoning_level="deep"
        )
        
        # Generate optimization recommendations
        optimization_prompt = f"""
        Based on the performance data, recommend specific optimizations:
        
        Current metrics:
        - Success rate: {usage_data['success_rate']}%
        - Average cost per generation: ${usage_data['total_cost'] / usage_data['total_generations']:.3f}
        - Quality score: {usage_data['avg_quality_score']}/5
        
        Suggest actionable improvements for cost reduction and quality enhancement.
        """
        
        optimization_recommendations = await self.agent.query_model(
            prompt=optimization_prompt,
            model="gemini-pro",
            reasoning_level="fast"
        )
        
        return {
            "period": f"{period_days} days",
            "usage_summary": usage_data,
            "performance_insights": performance_insights['response'],
            "optimization_recommendations": optimization_recommendations['response'],
            "generated_at": datetime.now().isoformat()
        }

# Generate weekly analytics report
dashboard = AnalyticsDashboard()
weekly_report = await dashboard.generate_performance_report(period_days=7)

print("Weekly Performance Report:")
print(json.dumps(weekly_report, indent=2))
```

### Cost Optimization Workflow

#### Intelligent Cost Management
```python
class CostOptimizer:
    def __init__(self, monthly_budget=2000):
        self.monthly_budget = monthly_budget
        self.current_spend = 0
        self.service = GenerativeAIService()
        
    async def optimize_generation_request(self, original_request):
        """Optimize generation request for cost efficiency."""
        
        # Calculate remaining budget
        remaining_budget = self.monthly_budget - self.current_spend
        budget_utilization = self.current_spend / self.monthly_budget
        
        # Estimate cost of original request
        original_cost = self.estimate_request_cost(original_request)
        
        if budget_utilization > 0.8:  # Over 80% budget used
            # Suggest cost-optimized alternatives
            optimized_request = self.create_budget_friendly_alternative(original_request)
            
            print(f"Budget utilization: {budget_utilization:.1%}")
            print(f"Original cost: ${original_cost:.3f}")
            print(f"Optimized cost: ${self.estimate_request_cost(optimized_request):.3f}")
            
            return optimized_request
        
        return original_request
    
    def create_budget_friendly_alternative(self, request):
        """Create cost-optimized version of request."""
        
        if request.model_type == GenerativeModelType.IMAGE_GENERATION:
            # Switch to more economical model
            if request.model_id == "imagen-3.0-generate-001":
                request.model_id = "imagegeneration@006"
            elif request.model_id == "flux-1-dev":
                request.model_id = "stable-diffusion-xl-base-1.0"
        
        elif request.model_type == GenerativeModelType.VIDEO_GENERATION:
            # Reduce duration or switch model
            if request.model_id == "veo-2.0-001":
                request.model_id = "veo-1.5-001"
            
            if request.duration_seconds > 20:
                request.duration_seconds = min(20, request.duration_seconds)
        
        return request
    
    def estimate_request_cost(self, request):
        """Estimate cost of generation request."""
        
        cost_table = {
            "imagen-3.0-generate-001": 0.025,
            "imagegeneration@006": 0.020,
            "flux-1-dev": 0.022,
            "stable-diffusion-xl-base-1.0": 0.018,
            "veo-2.0-001": 0.025,  # per second
            "veo-1.5-001": 0.015   # per second
        }
        
        unit_cost = cost_table.get(request.model_id, 0.025)
        
        if request.model_type == GenerativeModelType.VIDEO_GENERATION:
            return unit_cost * request.duration_seconds
        else:
            return unit_cost * request.image_count

# Example usage
optimizer = CostOptimizer(monthly_budget=1500)

# Original expensive request
expensive_request = GenerationRequest(
    model_id="imagen-3.0-generate-001",
    prompt="High-end album cover artwork",
    model_type=GenerativeModelType.IMAGE_GENERATION,
    image_count=5
)

# Optimize for budget
optimized_request = await optimizer.optimize_generation_request(expensive_request)
```

## 🎯 Advanced Integration Patterns

### Multi-Service Orchestration

#### Complete Content Pipeline
```python
class ContentPipeline:
    def __init__(self):
        self.generative_service = GenerativeAIService()
        self.llm_agent = UnifiedLLMAgent()
        self.spotify_client = SpotifyClient()  # Hypothetical Spotify integration
        
    async def process_playlist_to_content(self, playlist_id):
        """Convert Spotify playlist to complete visual content package."""
        
        # Step 1: Analyze playlist
        playlist_data = await self.spotify_client.get_playlist(playlist_id)
        
        analysis_prompt = f"""
        Analyze this playlist and suggest visual themes:
        Name: {playlist_data['name']}
        Track count: {playlist_data['track_count']}
        Top genres: {playlist_data['genres']}
        Mood: {playlist_data['mood_analysis']}
        
        Suggest:
        1. Visual style for cover art
        2. Color palette
        3. Artistic direction
        4. Target audience appeal
        """
        
        theme_analysis = await self.llm_agent.query_model(
            prompt=analysis_prompt,
            model="claude-opus-4.1",
            reasoning_level="deep"
        )
        
        # Step 2: Generate playlist cover
        cover_request = GenerationRequest(
            model_id="imagen-3.0-generate-001",
            prompt=f"Playlist cover for '{playlist_data['name']}', {theme_analysis['response'][:200]}",
            model_type=GenerativeModelType.IMAGE_GENERATION,
            aspect_ratio="1:1"
        )
        
        playlist_cover = await self.generative_service.generate_image(cover_request)
        
        # Step 3: Generate promotional video
        video_request = GenerationRequest(
            model_id="veo-1.5-001",
            prompt=f"Playlist promotional video, {playlist_data['mood_analysis']} mood, engaging social media content",
            model_type=GenerativeModelType.VIDEO_GENERATION,
            duration_seconds=15
        )
        
        promo_video = await self.generative_service.generate_video(video_request)
        
        # Step 4: Generate social media variants
        social_variants = []
        
        for platform in ["instagram", "twitter", "facebook"]:
            social_request = GenerationRequest(
                model_id="imagegeneration@006",
                prompt=f"{platform} post for playlist '{playlist_data['name']}', optimized for platform engagement",
                model_type=GenerativeModelType.IMAGE_GENERATION,
                aspect_ratio="1:1" if platform == "instagram" else "16:9"
            )
            
            social_content = await self.generative_service.generate_image(social_request)
            social_variants.append({
                "platform": platform,
                "content": social_content
            })
        
        # Step 5: Generate marketing copy
        copy_prompt = f"""
        Create marketing copy for this playlist:
        {json.dumps(playlist_data, indent=2)}
        
        Generate:
        1. Short description (50 words)
        2. Social media captions for each platform
        3. Email newsletter snippet
        4. SEO-optimized description
        """
        
        marketing_copy = await self.llm_agent.query_model(
            prompt=copy_prompt,
            model="gemini-pro",
            reasoning_level="fast"
        )
        
        return {
            "playlist_id": playlist_id,
            "theme_analysis": theme_analysis['response'],
            "cover_art": playlist_cover.content_paths[0],
            "promotional_video": promo_video.content_paths[0],
            "social_variants": social_variants,
            "marketing_copy": marketing_copy['response'],
            "total_cost": (playlist_cover.cost_estimate + 
                          promo_video.cost_estimate + 
                          sum(variant['content'].cost_estimate for variant in social_variants))
        }

# Process popular playlist
pipeline = ContentPipeline()
result = await pipeline.process_playlist_to_content("37i9dQZF1DXcBWIGoYBM5M")

print(f"Complete content package generated for playlist!")
print(f"Total assets: {3 + len(result['social_variants'])}")
print(f"Total cost: ${result['total_cost']:.2f}")
```

---

## 📋 Quick Start Templates

### Basic Templates

#### Simple Image Generation
```python
# Basic image generation template
async def generate_simple_image(prompt, style="professional"):
    service = GenerativeAIService()
    await service.initialize()
    
    request = GenerationRequest(
        model_id="imagegeneration@006",
        prompt=f"{prompt}, {style} style, high quality",
        model_type=GenerativeModelType.IMAGE_GENERATION,
        aspect_ratio="1:1"
    )
    
    response = await service.generate_image(request)
    return response.content_paths[0]

# Usage
image_path = await generate_simple_image("Album cover for jazz music")
print(f"Generated: {image_path}")
```

#### Quick Video Creation
```python
# Basic video generation template
async def generate_simple_video(prompt, duration=15):
    service = GenerativeAIService()
    await service.initialize()
    
    request = GenerationRequest(
        model_id="veo-1.5-001",
        prompt=f"{prompt}, professional quality, engaging content",
        model_type=GenerativeModelType.VIDEO_GENERATION,
        duration_seconds=duration
    )
    
    response = await service.generate_video(request)
    return response.content_paths[0]

# Usage
video_path = await generate_simple_video("Music festival highlights", 20)
print(f"Generated: {video_path}")
```

#### Basic Analysis
```python
# Simple LLM analysis template
async def analyze_with_ai(data, question):
    agent = UnifiedLLMAgent()
    
    prompt = f"""
    Analyze this data: {data}
    
    Question: {question}
    
    Provide a clear, actionable response.
    """
    
    response = await agent.query_model(
        prompt=prompt,
        model="gemini-pro",
        reasoning_level="fast"
    )
    
    return response['response']

# Usage
analysis = await analyze_with_ai(
    data="User engagement: 75%, Retention: 68%",
    question="How can we improve these metrics?"
)
print(f"Analysis: {analysis}")
```

---

**Last Updated**: January 2025  
**Examples Count**: 25+ comprehensive workflows  
**Coverage**: All EchoTune AI services and integrations ✅