# Prompt Engineering Guide

## 📋 Overview

Effective prompt engineering is crucial for maximizing the quality and relevance of AI-generated content in EchoTune AI. This comprehensive guide covers advanced techniques, best practices, and model-specific optimizations for both generative AI and LLM interactions.

## 🎨 Image Generation Prompt Engineering

### Fundamental Principles

#### 1. Structure and Clarity
Effective image prompts follow a clear structure that provides specific guidance to the AI model while maintaining creative flexibility.

**Basic Structure:**
```
[Subject] + [Setting/Environment] + [Style/Mood] + [Technical Specifications]
```

**Example:**
```
Professional musician playing acoustic guitar + in a cozy recording studio + warm cinematic lighting + high resolution, detailed, photographic style
```

#### 2. Specificity vs. Creativity Balance
Strike the right balance between being specific enough to get desired results while leaving room for creative interpretation.

**Too Vague:**
```
"Music stuff"
```

**Too Restrictive:**
```
"Exactly 3 musicians, one with blonde hair wearing a red shirt, one with brown hair wearing blue jeans, standing at precisely 45-degree angles"
```

**Well Balanced:**
```
"Three professional musicians collaborating in a modern studio, natural lighting, candid moment, documentary photography style"
```

### Model-Specific Optimization

#### Imagen 3.0 - Premium Quality Prompts
Imagen 3.0 excels with detailed, professional-quality descriptions.

**Optimal Prompt Patterns:**
```python
# Professional photography style
"Professional concert photographer capturing [subject], dramatic stage lighting, high-end camera equipment, sharp focus, professional quality, detailed"

# Cinematic quality
"Cinematic shot of [subject], movie-like lighting, film grain, dramatic composition, high production value, masterpiece"

# Commercial art
"Commercial photography of [subject], studio lighting, professional composition, marketing quality, clean background, detailed textures"
```

**Best Practices for Imagen 3.0:**
- Use professional photography terminology
- Include lighting specifications
- Mention quality indicators ("professional", "high-end", "detailed")
- Specify composition style when needed

**Example Prompts:**
```python
prompts = {
    "album_cover": "Professional album cover art, [genre] music theme, artistic composition, vibrant colors, commercial quality, detailed artwork, masterpiece",
    
    "musician_portrait": "Professional musician portrait, studio lighting, high-end photography, detailed facial features, artistic composition, commercial quality",
    
    "concert_scene": "Epic live concert photography, dramatic stage lighting, professional concert photographer, high energy crowd, dynamic composition, detailed"
}
```

#### Imagen 2.0 - Balanced Prompts
Imagen 2.0 works best with clear, straightforward descriptions.

**Optimal Prompt Patterns:**
```python
# Clear and direct
"[Subject] in [setting], [style] style, [mood], good quality"

# Descriptive but concise
"[Subject] with [specific details], [artistic style], [color palette], detailed"
```

**Best Practices for Imagen 2.0:**
- Keep prompts concise but descriptive
- Use common artistic terms
- Focus on mood and atmosphere
- Include basic quality indicators

**Example Prompts:**
```python
prompts = {
    "social_media": "Vibrant music festival scene, energetic crowd, colorful stage lights, fun atmosphere, digital art style, detailed",
    
    "background": "Abstract music visualization, flowing sound waves, gradient colors, modern design, clean composition",
    
    "thumbnail": "Eye-catching playlist cover, [genre] theme, bold colors, modern design, engaging composition"
}
```

#### FLUX.1 Dev - Artistic and Creative Prompts
FLUX.1 excels with artistic, creative, and experimental descriptions.

**Optimal Prompt Patterns:**
```python
# Artistic expression
"Artistic interpretation of [concept], creative style, imaginative composition, vibrant colors, unique perspective"

# Surreal and abstract
"Surreal [subject], dreamlike atmosphere, artistic creativity, flowing forms, imaginative design, masterpiece"

# Experimental style
"Experimental art of [subject], avant-garde style, creative composition, innovative design, artistic freedom"
```

**Best Practices for FLUX.1:**
- Emphasize creativity and artistic expression
- Use abstract and conceptual language
- Encourage experimentation with unusual perspectives
- Focus on artistic movements and styles

**Example Prompts:**
```python
prompts = {
    "abstract_art": "Surreal music composition visualization, flowing melodies as colorful ribbons, abstract expressionism, creative interpretation, vibrant artistic style",
    
    "creative_poster": "Avant-garde concert poster design, experimental typography, artistic composition, creative layout, unique visual style, masterpiece",
    
    "album_artwork": "Psychedelic album cover art, trippy visual effects, artistic creativity, surreal composition, vibrant colors, imaginative design"
}
```

#### Stable Diffusion XL - Photorealistic Prompts
SDXL specializes in realistic, photographic-quality images.

**Optimal Prompt Patterns:**
```python
# Photorealistic style
"Photorealistic [subject], natural lighting, realistic textures, detailed photography, sharp focus, professional camera"

# Portrait photography
"Professional portrait of [subject], natural lighting, realistic skin textures, sharp focus, professional photography"

# Product photography
"Professional product photography of [subject], studio lighting, clean background, commercial photography, detailed textures"
```

**Best Practices for SDXL:**
- Use photography terminology
- Emphasize realism and natural qualities
- Mention camera and lighting details
- Focus on texture and detail

**Example Prompts:**
```python
prompts = {
    "musician_photo": "Professional musician portrait, natural studio lighting, realistic skin textures, authentic expression, professional photography, detailed",
    
    "instrument_photo": "Professional product photography of vintage guitar, studio lighting, detailed wood textures, commercial quality, sharp focus",
    
    "lifestyle_shot": "Candid lifestyle photography of musicians in coffee shop, natural lighting, documentary style, authentic moment, professional photography"
}
```

### Advanced Prompt Techniques

#### 1. Negative Prompting
Specify what you don't want to improve results quality.

**Common Negative Prompts:**
```python
negative_prompts = {
    "quality_issues": "blurry, low quality, pixelated, distorted, noise, artifacts",
    "unwanted_elements": "watermark, text, logo, signature, frame, border",
    "style_conflicts": "cartoon, anime, 3d render" # when wanting photorealistic
}

# Usage example
prompt = "Professional musician portrait, studio lighting"
negative = "blurry, low quality, watermark, distorted, cartoon style"
```

#### 2. Style Transfer and Artistic Direction
Guide the artistic style and mood of generations.

**Style Keywords by Category:**
```python
photography_styles = [
    "professional photography", "commercial photography", "portrait photography",
    "documentary style", "street photography", "fashion photography"
]

artistic_styles = [
    "digital art", "concept art", "illustration", "artistic painting",
    "watercolor", "oil painting", "acrylic", "mixed media"
]

mood_descriptors = [
    "dramatic", "moody", "bright", "cheerful", "melancholic", "energetic",
    "calm", "peaceful", "intense", "vibrant", "subtle", "bold"
]

lighting_types = [
    "natural lighting", "studio lighting", "dramatic lighting", "soft lighting",
    "golden hour", "blue hour", "neon lighting", "cinematic lighting"
]
```

#### 3. Composition and Technical Specifications
Control the technical aspects of image generation.

**Composition Terms:**
```python
composition_guides = {
    "framing": ["close-up", "medium shot", "wide shot", "extreme close-up", "full body"],
    "angles": ["eye level", "low angle", "high angle", "bird's eye", "worm's eye"],
    "perspective": ["front view", "side profile", "three-quarter view", "back view"],
    "composition": ["rule of thirds", "centered", "off-center", "dynamic composition"]
}
```

**Technical Quality Indicators:**
```python
quality_terms = [
    "high resolution", "8k", "4k", "detailed", "sharp focus", "professional quality",
    "masterpiece", "award winning", "studio quality", "commercial grade"
]
```

### Prompt Templates for Music Content

#### Album Cover Templates
```python
album_cover_templates = {
    "minimalist": "Minimalist album cover for {genre} music, clean design, simple composition, modern typography, {color_scheme} color palette, professional design",
    
    "artistic": "Artistic album cover art for {genre} album, creative composition, {artistic_style} style, vibrant colors, unique design, masterpiece quality",
    
    "photographic": "Professional album cover photography, {genre} music theme, dramatic lighting, commercial photography, detailed composition, high-end quality",
    
    "abstract": "Abstract album artwork for {genre} music, flowing visual elements, dynamic composition, artistic interpretation, creative design, vibrant colors"
}
```

#### Concert and Performance Templates
```python
concert_templates = {
    "live_performance": "Epic live concert performance, {venue_type} venue, dramatic stage lighting, energetic crowd, professional concert photography, dynamic composition",
    
    "intimate_session": "Intimate acoustic performance, cozy venue, warm lighting, close-up perspective, authentic moment, professional photography",
    
    "festival": "Music festival atmosphere, outdoor stage, sunset lighting, massive crowd, aerial perspective, festival photography, vibrant energy",
    
    "studio_session": "Professional recording studio session, musicians at work, natural lighting, behind-the-scenes, documentary style photography"
}
```

#### Musician Portrait Templates
```python
portrait_templates = {
    "professional": "Professional musician portrait, {instrument} player, studio lighting, commercial photography, detailed, high-end quality",
    
    "lifestyle": "Lifestyle musician photography, natural environment, candid moment, authentic expression, professional portrait photography",
    
    "artistic": "Artistic musician portrait, creative lighting, unique composition, artistic photography, dramatic mood, masterpiece",
    
    "band_photo": "Professional band photography, {number} members, group composition, studio lighting, commercial quality, detailed"
}
```

## 🎬 Video Generation Prompt Engineering

### Video-Specific Principles

#### 1. Motion and Dynamics
Video prompts should emphasize movement, transitions, and temporal elements.

**Motion Keywords:**
```python
motion_descriptors = [
    "smooth motion", "dynamic movement", "flowing transitions", "gentle camera pan",
    "dramatic zoom", "slow motion", "time-lapse", "steady shots", "cinematic movement"
]
```

#### 2. Scene Progression
Consider how the video should evolve over time.

**Temporal Structure:**
```python
video_structure = {
    "opening": "Video opens with [scene], establishing shot, smooth entrance",
    "development": "Camera moves to reveal [details], dynamic progression",
    "climax": "Reaches peak energy with [action], dramatic moment",
    "conclusion": "Ends with [final scene], smooth conclusion, fade out"
}
```

### Model-Specific Video Prompts

#### Veo 2.0 - Premium Video Prompts
Veo 2.0 excels with cinematic, high-production value content.

**Optimal Patterns:**
```python
veo_2_patterns = {
    "cinematic": "Cinematic {subject}, professional filmmaking, smooth camera movements, dramatic lighting, high production value, movie-like quality",
    
    "commercial": "Commercial video of {subject}, professional videography, studio lighting, commercial quality, polished production",
    
    "music_video": "Professional music video sequence, {genre} style, dynamic visuals, rhythmic editing, high-end production, cinematic quality"
}
```

**Example Prompts:**
```python
veo_2_prompts = {
    "album_promo": "Cinematic album promotional video, dramatic lighting reveals album artwork, smooth camera movements, professional production, high-end commercial quality",
    
    "concert_highlight": "Epic concert highlight reel, dramatic stage lighting, crowd energy, multiple camera angles, professional concert videography, cinematic quality",
    
    "artist_documentary": "Professional artist documentary segment, intimate interview lighting, cinematic composition, high production value, authentic storytelling"
}
```

#### Veo 1.5 - Standard Video Prompts
Veo 1.5 works well with straightforward, clear video descriptions.

**Optimal Patterns:**
```python
veo_1_5_patterns = {
    "social_media": "{subject} for social media, engaging visuals, modern style, good quality video",
    
    "tutorial": "Educational video showing {subject}, clear presentation, good lighting, instructional style",
    
    "behind_scenes": "Behind-the-scenes video of {subject}, casual style, natural lighting, documentary approach"
}
```

**Example Prompts:**
```python
veo_1_5_prompts = {
    "social_content": "Musicians rehearsing in studio, behind-the-scenes style, natural lighting, casual atmosphere, social media friendly",
    
    "quick_promo": "Quick promotional video for new song, animated album artwork, smooth transitions, modern design, engaging visuals",
    
    "tutorial": "Music production tutorial, screen recording style, clear presentation, educational content, good audio quality"
}
```

### Advanced Video Techniques

#### 1. Camera Movement Specification
```python
camera_movements = {
    "static": "static camera", "steady shot", "fixed position",
    "dynamic": "smooth camera pan", "gentle zoom", "dolly movement", "crane shot",
    "dramatic": "dramatic zoom in", "sweeping camera movement", "dynamic angles"
}
```

#### 2. Pacing and Rhythm
```python
pacing_descriptors = {
    "slow": "slow-paced", "contemplative rhythm", "gentle progression",
    "medium": "steady pacing", "balanced rhythm", "smooth progression",
    "fast": "fast-paced", "energetic rhythm", "dynamic progression", "quick cuts"
}
```

#### 3. Visual Effects and Transitions
```python
effects_and_transitions = {
    "smooth": "smooth transitions", "seamless cuts", "flowing progression",
    "dramatic": "dramatic transitions", "striking visual effects", "bold cuts",
    "artistic": "creative transitions", "artistic effects", "unique visual style"
}
```

## 🤖 LLM Agent Prompt Engineering

### Unified Agent Interaction

#### 1. Task-Specific Prompting
Different types of analysis require different prompt approaches.

**Analysis Types and Patterns:**
```python
analysis_patterns = {
    "data_analysis": "Analyze the following data and provide insights into {specific_metric}. Focus on trends, patterns, and actionable recommendations.",
    
    "causal_analysis": "Explain the causal relationships behind {phenomenon}. Consider multiple factors and their interactions.",
    
    "strategic_planning": "Develop a strategic plan for {objective}. Consider constraints, opportunities, and implementation steps.",
    
    "problem_solving": "Identify the root causes of {problem} and propose practical solutions with implementation timelines."
}
```

#### 2. Context and Background
Provide sufficient context for accurate analysis.

**Context Template:**
```python
context_template = """
Background: {background_information}
Current Situation: {current_state}
Objective: {desired_outcome}
Constraints: {limitations_or_constraints}
Available Data: {data_sources}

Please analyze and provide recommendations.
"""
```

### Model Selection Through Prompting

#### Gemini Pro - Fast Analysis Prompts
Optimize prompts for quick, efficient responses.

**Patterns for Gemini Pro:**
```python
gemini_patterns = {
    "quick_summary": "Provide a concise summary of {topic} focusing on key points and main insights.",
    
    "metric_analysis": "Analyze these metrics: {metrics}. Highlight the most important trends and patterns.",
    
    "recommendation": "Based on {data}, provide 3-5 actionable recommendations with brief explanations."
}
```

#### Claude Opus 4.1 - Deep Reasoning Prompts
Structure prompts for comprehensive, multi-step analysis.

**Patterns for Claude:**
```python
claude_patterns = {
    "deep_analysis": """
    Perform a comprehensive analysis of {subject}:
    1. Break down the problem into components
    2. Analyze each component thoroughly
    3. Identify relationships and dependencies
    4. Consider multiple perspectives
    5. Synthesize findings into actionable insights
    """,
    
    "causal_reasoning": """
    Analyze the causal chain behind {phenomenon}:
    1. Identify immediate causes
    2. Trace back to root causes
    3. Consider feedback loops
    4. Evaluate strength of causal relationships
    5. Suggest intervention points
    """,
    
    "strategic_thinking": """
    Develop a strategic approach to {challenge}:
    1. Assess current situation and constraints
    2. Identify opportunities and threats
    3. Generate multiple strategic options
    4. Evaluate pros/cons of each option
    5. Recommend optimal strategy with implementation plan
    """
}
```

### Advanced LLM Techniques

#### 1. Chain-of-Thought Prompting
Guide the model through step-by-step reasoning.

**Chain-of-Thought Templates:**
```python
cot_templates = {
    "problem_solving": """
    Let's solve this step by step:
    1. First, let me understand the problem: {problem_statement}
    2. Next, I'll identify the key factors: [analysis]
    3. Then, I'll consider possible solutions: [options]
    4. Finally, I'll recommend the best approach: [recommendation]
    """,
    
    "data_analysis": """
    Let me analyze this data systematically:
    1. Data overview: What does the data show?
    2. Pattern identification: What trends do I see?
    3. Insight extraction: What does this mean?
    4. Action items: What should be done?
    """
}
```

#### 2. Role-Based Prompting
Have the model assume specific roles for specialized insights.

**Role Templates:**
```python
role_templates = {
    "music_analyst": "As a music industry analyst with 10 years of experience, analyze {topic} considering market trends, user behavior, and industry dynamics.",
    
    "product_manager": "From a product management perspective, evaluate {feature/issue} considering user needs, technical feasibility, and business impact.",
    
    "data_scientist": "As a data scientist, examine {dataset/metric} using statistical analysis, pattern recognition, and predictive modeling approaches.",
    
    "ux_researcher": "From a UX research standpoint, analyze {user_behavior} considering user psychology, usability principles, and design best practices."
}
```

#### 3. Multi-Perspective Analysis
Request analysis from multiple viewpoints.

**Multi-Perspective Template:**
```python
multi_perspective_template = """
Analyze {topic} from multiple perspectives:

1. User Perspective: How does this affect users?
2. Business Perspective: What are the business implications?
3. Technical Perspective: What are the technical considerations?
4. Competitive Perspective: How does this compare to competitors?

For each perspective, provide:
- Key insights
- Opportunities
- Risks/concerns
- Recommendations
"""
```

## 🎯 Prompt Optimization Strategies

### A/B Testing Prompts

#### Testing Framework
```python
class PromptTester:
    def __init__(self):
        self.test_results = []
    
    def test_prompt_variations(self, base_concept, variations):
        """Test multiple prompt variations for the same concept."""
        results = {}
        
        for version, prompt in variations.items():
            result = self.generate_with_prompt(prompt)
            results[version] = {
                "prompt": prompt,
                "quality_score": self.evaluate_quality(result),
                "relevance_score": self.evaluate_relevance(result, base_concept),
                "creativity_score": self.evaluate_creativity(result)
            }
        
        return self.analyze_test_results(results)
    
    def analyze_test_results(self, results):
        """Analyze which prompt variations perform best."""
        best_overall = max(results.keys(), 
                          key=lambda k: sum(results[k].values()) / 3)
        
        return {
            "best_overall": best_overall,
            "detailed_results": results,
            "recommendations": self.generate_recommendations(results)
        }
```

#### Prompt Variation Examples
```python
prompt_variations = {
    "album_cover": {
        "basic": "Album cover art for rock music",
        
        "detailed": "Professional album cover art for rock music, dramatic lighting, bold composition, commercial quality, detailed artwork",
        
        "artistic": "Artistic album cover design for rock music, creative composition, dynamic visual elements, professional artwork, masterpiece quality",
        
        "specific": "Professional rock album cover featuring electric guitar silhouette, dramatic red and black color scheme, bold typography, commercial photography style, high-end quality"
    }
}
```

### Quality Enhancement Techniques

#### 1. Progressive Prompt Refinement
Start with basic prompts and iteratively improve them.

```python
class PromptRefiner:
    def refine_prompt(self, base_prompt, quality_goals):
        """Progressively refine prompts for better results."""
        
        refinement_stages = [
            self.add_quality_indicators,
            self.add_style_specifications,
            self.add_technical_details,
            self.add_composition_guidance
        ]
        
        refined_prompt = base_prompt
        for stage in refinement_stages:
            refined_prompt = stage(refined_prompt, quality_goals)
        
        return refined_prompt
    
    def add_quality_indicators(self, prompt, goals):
        """Add quality-related keywords."""
        quality_terms = ["professional", "high quality", "detailed", "masterpiece"]
        return f"{prompt}, {', '.join(quality_terms[:2])}"
    
    def add_style_specifications(self, prompt, goals):
        """Add style and mood specifications."""
        if "artistic" in goals:
            return f"{prompt}, artistic style, creative composition"
        elif "photographic" in goals:
            return f"{prompt}, professional photography, studio lighting"
        return prompt
```

#### 2. Automated Prompt Enhancement
```python
class PromptEnhancer:
    ENHANCEMENT_RULES = {
        "image_generation": {
            "quality_boost": ["high resolution", "detailed", "professional quality"],
            "style_clarity": ["photographic style", "artistic style", "digital art"],
            "technical_specs": ["sharp focus", "proper lighting", "good composition"]
        },
        "video_generation": {
            "motion_quality": ["smooth motion", "professional videography"],
            "production_value": ["cinematic quality", "high production value"],
            "technical_specs": ["good lighting", "stable camera", "clear audio"]
        }
    }
    
    def enhance_prompt(self, prompt, generation_type, quality_level="high"):
        """Automatically enhance prompts based on generation type."""
        enhancements = self.ENHANCEMENT_RULES.get(generation_type, {})
        
        enhanced = prompt
        for category, terms in enhancements.items():
            if quality_level == "high":
                enhanced += f", {', '.join(terms[:2])}"
            else:
                enhanced += f", {terms[0]}"
        
        return enhanced
```

### Model-Agnostic Best Practices

#### 1. Universal Quality Principles
```python
universal_principles = {
    "clarity": "Be clear and specific about desired outcomes",
    "context": "Provide sufficient context for accurate interpretation",
    "constraints": "Specify important constraints and limitations",
    "goals": "Clearly state the objective or goal",
    "quality": "Include quality indicators appropriate for the task"
}
```

#### 2. Prompt Validation Checklist
```python
validation_checklist = {
    "completeness": "Does the prompt include all necessary information?",
    "specificity": "Is the prompt specific enough to guide the model?",
    "clarity": "Is the prompt clear and unambiguous?",
    "feasibility": "Is the request technically feasible for the model?",
    "appropriateness": "Does the prompt comply with usage policies?",
    "optimization": "Is the prompt optimized for the target model?"
}
```

## 📊 Prompt Performance Analytics

### Tracking and Measurement

#### Prompt Performance Metrics
```python
class PromptAnalytics:
    def __init__(self):
        self.prompt_history = []
        self.performance_data = {}
    
    def track_prompt_performance(self, prompt, model, result, user_rating):
        """Track prompt performance across different models."""
        
        performance_record = {
            "prompt": prompt,
            "model": model,
            "timestamp": datetime.now(),
            "result_quality": self.analyze_quality(result),
            "user_rating": user_rating,
            "generation_time": result.get("generation_time", 0),
            "cost": result.get("cost", 0)
        }
        
        self.prompt_history.append(performance_record)
        self.update_prompt_performance_stats(prompt, performance_record)
    
    def get_top_performing_prompts(self, category=None, model=None):
        """Identify top-performing prompts by category and model."""
        
        filtered_data = self.filter_data(category, model)
        
        prompt_scores = {}
        for record in filtered_data:
            prompt = record["prompt"]
            if prompt not in prompt_scores:
                prompt_scores[prompt] = []
            
            score = (record["result_quality"] + record["user_rating"]) / 2
            prompt_scores[prompt].append(score)
        
        # Calculate average scores
        avg_scores = {
            prompt: sum(scores) / len(scores)
            for prompt, scores in prompt_scores.items()
        }
        
        return sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
```

#### Performance Optimization Recommendations
```python
class PromptOptimizer:
    def analyze_underperforming_prompts(self, analytics_data):
        """Analyze underperforming prompts and suggest improvements."""
        
        underperforming = [
            record for record in analytics_data
            if record["user_rating"] < 3.0 or record["result_quality"] < 0.7
        ]
        
        common_issues = self.identify_common_issues(underperforming)
        suggestions = self.generate_improvement_suggestions(common_issues)
        
        return {
            "issues_identified": common_issues,
            "improvement_suggestions": suggestions,
            "example_improvements": self.create_improvement_examples(underperforming)
        }
    
    def identify_common_issues(self, underperforming_prompts):
        """Identify common patterns in underperforming prompts."""
        
        issues = {
            "too_vague": 0,
            "missing_style": 0,
            "no_quality_indicators": 0,
            "wrong_model_choice": 0,
            "insufficient_context": 0
        }
        
        for record in underperforming_prompts:
            prompt = record["prompt"]
            
            if len(prompt.split()) < 5:
                issues["too_vague"] += 1
            
            if not any(style in prompt.lower() for style in ["style", "photographic", "artistic"]):
                issues["missing_style"] += 1
            
            if not any(quality in prompt.lower() for quality in ["professional", "high quality", "detailed"]):
                issues["no_quality_indicators"] += 1
        
        return issues
```

---

## 🎯 Advanced Use Cases

### Music Industry Specific Prompts

#### Record Label Marketing
```python
marketing_prompts = {
    "artist_branding": """
    Create a comprehensive visual brand identity for {artist_name}:
    - Genre: {genre}
    - Target audience: {demographics}
    - Brand personality: {personality_traits}
    - Visual style: {style_preferences}
    
    Generate consistent imagery that reflects the artist's musical style and appeals to their target audience.
    """,
    
    "album_campaign": """
    Develop visual content for album '{album_name}' by {artist}:
    - Album theme: {theme}
    - Musical style: {genre}/{subgenre}
    - Target release date: {date}
    - Marketing objectives: {objectives}
    
    Create a cohesive visual campaign including album artwork, promotional materials, and social media content.
    """
}
```

#### Music Education Content
```python
education_prompts = {
    "music_theory": """
    Create educational visual content explaining {music_concept}:
    - Target level: {beginner/intermediate/advanced}
    - Visual style: {educational/infographic/animated}
    - Key concepts to illustrate: {concepts}
    
    Make the content engaging and easy to understand for music students.
    """,
    
    "instrument_tutorials": """
    Generate instructional content for {instrument} lessons:
    - Technique focus: {specific_technique}
    - Student level: {level}
    - Learning objective: {objective}
    
    Create clear, informative visuals that support the learning process.
    """
}
```

### Playlist and Music Discovery

#### Mood-Based Content Generation
```python
mood_content_prompts = {
    "playlist_covers": """
    Create playlist cover art for '{playlist_name}':
    - Mood: {mood_description}
    - Musical genres: {genres}
    - Target activity: {activity}
    - Color psychology: Use colors that evoke {emotional_response}
    
    Design should instantly communicate the playlist's mood and purpose.
    """,
    
    "seasonal_playlists": """
    Generate seasonal playlist artwork for {season} {year}:
    - Season theme: {seasonal_elements}
    - Musical style: {genre_mix}
    - Demographic: {target_audience}
    - Mood: {seasonal_mood}
    
    Incorporate seasonal elements while maintaining musical relevance.
    """
}
```

---

## 🚀 Future-Proofing Your Prompts

### Model Evolution Considerations

#### Version-Agnostic Prompting
```python
version_agnostic_principles = {
    "core_concepts": "Focus on fundamental concepts rather than model-specific features",
    "flexible_structure": "Use adaptable prompt structures that work across model versions",
    "quality_indicators": "Use universal quality terms that apply to any generation model",
    "clear_intent": "Make the intended outcome clear regardless of model capabilities"
}
```

#### Backwards Compatibility
```python
def create_backwards_compatible_prompt(modern_prompt):
    """Convert modern prompts to work with older model versions."""
    
    # Remove version-specific features
    simplified = remove_advanced_features(modern_prompt)
    
    # Add universal quality indicators
    simplified = add_universal_quality_terms(simplified)
    
    # Ensure basic structure
    simplified = ensure_basic_structure(simplified)
    
    return simplified
```

### Continuous Improvement Framework

#### Prompt Evolution Strategy
```python
class PromptEvolutionManager:
    def __init__(self):
        self.prompt_versions = {}
        self.performance_history = {}
    
    def evolve_prompt(self, base_prompt, performance_data):
        """Evolve prompts based on performance data."""
        
        # Analyze current performance
        current_performance = self.analyze_performance(performance_data)
        
        # Generate improved versions
        improved_versions = self.generate_improvements(base_prompt, current_performance)
        
        # Test improvements
        test_results = self.test_improvements(improved_versions)
        
        # Select best version
        best_version = self.select_best_version(test_results)
        
        return best_version
    
    def track_prompt_lineage(self, prompt_id, evolution_data):
        """Track the evolution of prompts over time."""
        
        if prompt_id not in self.prompt_versions:
            self.prompt_versions[prompt_id] = []
        
        self.prompt_versions[prompt_id].append({
            "version": len(self.prompt_versions[prompt_id]) + 1,
            "prompt": evolution_data["prompt"],
            "performance": evolution_data["performance"],
            "changes_made": evolution_data["changes"],
            "timestamp": datetime.now()
        })
```

---

## 📝 Summary and Quick Reference

### Essential Prompt Components

1. **Subject**: What you want to generate
2. **Context**: Where/when/how it exists
3. **Style**: Artistic direction and mood
4. **Quality**: Technical specifications
5. **Constraints**: What to avoid or include

### Model Selection Quick Guide

- **Imagen 3.0**: Professional, commercial-quality content
- **Imagen 2.0**: General-purpose, balanced quality/cost
- **FLUX.1 Dev**: Artistic, creative, experimental content
- **Stable Diffusion XL**: Photorealistic, natural content
- **Veo 2.0**: Premium videos, cinematic quality
- **Veo 1.5**: Social media videos, quick content

### Common Prompt Patterns

```python
patterns = {
    "basic": "[Subject] in [Setting], [Style] style, [Quality terms]",
    "detailed": "[Subject] with [Specific details], [Setting/Environment], [Lighting], [Style], [Quality], [Technical specs]",
    "artistic": "[Artistic interpretation] of [Subject], [Creative style], [Mood], [Color palette], [Artistic quality]",
    "professional": "Professional [Type] of [Subject], [Professional context], [Technical quality], [Commercial standard]"
}
```

---

**Last Updated**: January 2025  
**Framework Version**: 2.0  
**Coverage**: All EchoTune AI models and use cases ✅