#!/usr/bin/env python3
"""
Generate required architectural diagrams for agent integration.

Creates the 3 required images:
1. System Architecture Delta
2. Model Integration Graph  
3. Idempotent State Lifecycle
"""

import os
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def create_architecture_delta_diagram():
    """Create system architecture delta diagram."""
    width, height = 1200, 800
    image = Image.new('RGB', (width, height), color=(240, 248, 255))
    draw = ImageDraw.Draw(image)
    
    # Title
    try:
        title_font = ImageFont.load_default()
    except:
        title_font = None
    
    draw.text((50, 30), "EchoTune AI - System Architecture Delta", fill=(0, 0, 0), font=title_font)
    
    # Before (left side)
    draw.rectangle([50, 100, 550, 700], outline=(200, 200, 200), width=2)
    draw.text((60, 110), "BEFORE: Basic Integration", fill=(0, 0, 0), font=title_font)
    
    # Before components
    components_before = [
        ("Basic LLM Integration", 70, 150),
        ("Single Provider (Mock)", 70, 200),
        ("No State Management", 70, 250),
        ("Manual Configuration", 70, 300),
        ("Limited Documentation", 70, 350)
    ]
    
    for comp, x, y in components_before:
        draw.rectangle([x, y, x+450, y+35], fill=(255, 200, 200), outline=(150, 0, 0))
        draw.text((x+10, y+10), comp, fill=(0, 0, 0), font=title_font)
    
    # After (right side)
    draw.rectangle([650, 100, 1150, 700], outline=(0, 150, 0), width=2)
    draw.text((660, 110), "AFTER: Production-Ready Integration", fill=(0, 100, 0), font=title_font)
    
    # After components
    components_after = [
        ("8 AI Models (6 Generative + 2 LLM)", 670, 150),
        ("Multi-Provider (Vertex, HF, Anthropic)", 670, 200),
        ("Idempotent State Management", 670, 250),
        ("Automated Registration", 670, 300),
        ("Comprehensive Documentation", 670, 350),
        ("CLI Tools & Testing Suite", 670, 400),
        ("Cost Tracking & Monitoring", 670, 450),
        ("Slash Commands Interface", 670, 500),
        ("Agent State Registry", 670, 550),
        ("Production-Grade Error Handling", 670, 600)
    ]
    
    for comp, x, y in components_after:
        draw.rectangle([x, y, x+450, y+35], fill=(200, 255, 200), outline=(0, 150, 0))
        draw.text((x+10, y+10), comp, fill=(0, 0, 0), font=title_font)
    
    # Arrow
    draw.polygon([(580, 400), (620, 380), (620, 420)], fill=(0, 0, 0))
    draw.text((580, 350), "UPGRADE", fill=(0, 0, 0), font=title_font)
    
    return image

def create_model_integration_graph():
    """Create model integration graph."""
    width, height = 1200, 900
    image = Image.new('RGB', (width, height), color=(248, 248, 255))
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.load_default()
    except:
        font = None
    
    # Title
    draw.text((50, 30), "AI Model Integration Graph - Multi-Provider Architecture", fill=(0, 0, 0), font=font)
    
    # Central Agent Hub
    hub_x, hub_y = 600, 450
    draw.ellipse([hub_x-80, hub_y-40, hub_x+80, hub_y+40], fill=(100, 150, 255), outline=(0, 0, 150))
    draw.text((hub_x-60, hub_y-10), "EchoTune AI Agent", fill=(255, 255, 255), font=font)
    
    # Provider clusters
    providers = [
        # Google Vertex AI
        {
            "name": "Google Vertex AI", 
            "color": (255, 200, 100),
            "position": (300, 200),
            "models": ["Imagen 3.0", "Imagen 2.0", "Veo 2.0", "Veo 1.5", "Gemini Pro"]
        },
        # HuggingFace
        {
            "name": "HuggingFace",
            "color": (255, 150, 150), 
            "position": (900, 200),
            "models": ["Stable Diffusion XL", "FLUX.1 Dev"]
        },
        # Anthropic
        {
            "name": "Anthropic",
            "color": (150, 255, 150),
            "position": (600, 150),
            "models": ["Claude Opus 4.1"]
        }
    ]
    
    for provider in providers:
        px, py = provider["position"]
        
        # Provider box
        draw.rectangle([px-100, py-50, px+100, py+100], fill=provider["color"], outline=(0, 0, 0))
        draw.text((px-80, py-40), provider["name"], fill=(0, 0, 0), font=font)
        
        # Models
        for i, model in enumerate(provider["models"]):
            my = py - 20 + (i * 25)
            draw.text((px-90, my), f"• {model}", fill=(0, 0, 0), font=font)
        
        # Connection to hub
        draw.line([(px, py+50), (hub_x, hub_y-40)], fill=(0, 0, 0), width=2)
    
    # Features boxes
    features = [
        ("Unified Interface", 200, 600),
        ("Cost Tracking", 400, 650),
        ("Health Monitoring", 600, 700),
        ("State Management", 800, 650),
        ("Error Handling", 1000, 600)
    ]
    
    for feature, fx, fy in features:
        draw.rectangle([fx-60, fy-20, fx+60, fy+20], fill=(200, 200, 255), outline=(0, 0, 100))
        draw.text((fx-50, fy-10), feature, fill=(0, 0, 0), font=font)
        draw.line([(fx, fy-20), (hub_x, hub_y+40)], fill=(100, 100, 100), width=1)
    
    return image

def create_state_lifecycle_diagram():
    """Create idempotent state lifecycle diagram."""
    width, height = 1000, 800
    image = Image.new('RGB', (width, height), color=(255, 248, 240))
    draw = ImageDraw.Draw(image)
    
    try:
        font = ImageFont.load_default()
    except:
        font = None
    
    # Title
    draw.text((50, 30), "Idempotent State Lifecycle - Model Registration Flow", fill=(0, 0, 0), font=font)
    
    # Flow steps
    steps = [
        {"text": "1. Agent Startup", "pos": (150, 100), "color": (255, 200, 200)},
        {"text": "2. Load agent_state/", "pos": (500, 100), "color": (255, 220, 200)},
        {"text": "3. Check Model Registry", "pos": (150, 250), "color": (255, 255, 200)},
        {"text": "4. Calculate Capability Hash", "pos": (500, 250), "color": (200, 255, 200)},
        {"text": "5. Hash Exists?", "pos": (320, 400), "color": (200, 200, 255)},
        {"text": "6a. SKIP (Idempotent)", "pos": (150, 550), "color": (200, 255, 255)},
        {"text": "6b. Register New Model", "pos": (500, 550), "color": (255, 200, 255)},
        {"text": "7. Update Registry", "pos": (320, 700), "color": (220, 255, 220)}
    ]
    
    for step in steps:
        x, y = step["pos"]
        draw.rectangle([x-70, y-30, x+70, y+30], fill=step["color"], outline=(0, 0, 0))
        draw.text((x-60, y-10), step["text"], fill=(0, 0, 0), font=font)
    
    # Arrows
    arrows = [
        ((220, 100), (430, 100)),  # 1 -> 2
        ((150, 130), (150, 220)),  # 2 -> 3 
        ((220, 250), (430, 250)),  # 3 -> 4
        ((320, 280), (320, 370)),  # 4 -> 5
        ((250, 430), (180, 520)),  # 5 -> 6a (YES)
        ((390, 430), (470, 520)),  # 5 -> 6b (NO)
        ((150, 580), (280, 670)),  # 6a -> 7
        ((500, 580), (360, 670))   # 6b -> 7
    ]
    
    for start, end in arrows:
        draw.line([start, end], fill=(0, 0, 0), width=2)
        # Arrow head
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        if abs(dx) > abs(dy):  # Horizontal arrow
            if dx > 0:
                draw.polygon([(end[0]-10, end[1]-5), (end[0], end[1]), (end[0]-10, end[1]+5)], fill=(0, 0, 0))
            else:
                draw.polygon([(end[0]+10, end[1]-5), (end[0], end[1]), (end[0]+10, end[1]+5)], fill=(0, 0, 0))
        else:  # Vertical arrow
            if dy > 0:
                draw.polygon([(end[0]-5, end[1]-10), (end[0], end[1]), (end[0]+5, end[1]-10)], fill=(0, 0, 0))
            else:
                draw.polygon([(end[0]-5, end[1]+10), (end[0], end[1]), (end[0]+5, end[1]+10)], fill=(0, 0, 0))
    
    # Labels on decision paths
    draw.text((200, 460), "Hash Match", fill=(0, 100, 0), font=font)
    draw.text((420, 460), "New Model", fill=(100, 0, 0), font=font)
    
    # Benefits box
    draw.rectangle([700, 200, 950, 500], fill=(240, 240, 255), outline=(0, 0, 100))
    draw.text((710, 210), "Benefits:", fill=(0, 0, 100), font=font)
    benefits = [
        "• No Duplicate Registration",
        "• Consistent State", 
        "• Fast Startup",
        "• Version Tracking",
        "• Rollback Support",
        "• Multi-Agent Safe",
        "• Atomic Updates",
        "• Error Recovery"
    ]
    for i, benefit in enumerate(benefits):
        draw.text((710, 240 + i*30), benefit, fill=(0, 0, 0), font=font)
    
    return image

def main():
    """Generate all required diagrams."""
    output_dir = Path("agent/docs/images")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("🎨 Generating architectural diagrams...")
    
    # Generate diagrams
    arch_delta = create_architecture_delta_diagram()
    arch_delta.save(output_dir / "architecture_delta.png")
    print("✅ Generated: architecture_delta.png")
    
    model_graph = create_model_integration_graph()
    model_graph.save(output_dir / "model_graph.png")
    print("✅ Generated: model_graph.png")
    
    state_lifecycle = create_state_lifecycle_diagram()
    state_lifecycle.save(output_dir / "state_lifecycle.png")
    print("✅ Generated: state_lifecycle.png")
    
    print(f"📁 All diagrams saved to: {output_dir}")
    print("🎯 Architectural visualization complete!")

if __name__ == "__main__":
    main()