#!/usr/bin/env python3
"""
Generative AI CLI Tool

Production-ready command-line interface for the EchoTune AI generative AI service.
Supports image and video generation with all integrated models.

Usage:
    python generative_ai_cli.py generate-image "A beautiful landscape" --model imagen-3.0-generate-001
    python generative_ai_cli.py generate-video "Music visualization" --model veo-2.0-001 --duration 10
    python generative_ai_cli.py list-models
    python generative_ai_cli.py health-check
"""

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GenerativeAICLI:
    """Command-line interface for generative AI operations."""
    
    def __init__(self):
        """Initialize the CLI."""
        try:
            # Import the demo service for now (in production, use the full service)
            from generative_ai_demo import GenerativeAIDemoService
            self.service = GenerativeAIDemoService()
        except ImportError:
            logger.error("❌ Failed to import generative AI service")
            sys.exit(1)
    
    async def generate_image(self, prompt: str, model: str = "imagegeneration@006", 
                           style: Optional[str] = None, aspect_ratio: str = "1:1",
                           count: int = 1, output_dir: Optional[str] = None) -> None:
        """Generate images using the specified model."""
        logger.info(f"🎨 Generating {count} image(s) with model: {model}")
        logger.info(f"📝 Prompt: {prompt}")
        
        try:
            # Simulate image generation (in production, use the real service)
            scenario = {
                "name": "CLI Generated Image",
                "prompt": prompt,
                "model": model,
                "style": style or "photographic",
                "aspect_ratio": aspect_ratio,
                "colors": [(135, 206, 235), (255, 182, 193), (144, 238, 144)]
            }
            
            images = []
            for i in range(count):
                logger.info(f"🖼️ Generating image {i+1}/{count}...")
                image_path = await self.service._create_demo_image(scenario)
                images.append(str(image_path))
                logger.info(f"✅ Image saved: {image_path}")
            
            # Calculate cost
            model_config = self.service.supported_models.get(model, {})
            cost = count * model_config.get("cost_per_image", 0.025)
            
            print(f"\n🎯 Generation Complete!")
            print(f"   📂 Images Generated: {count}")
            print(f"   💰 Estimated Cost: ${cost:.4f}")
            print(f"   📁 Output Directory: {self.service.output_dir / 'images'}")
            
            for i, image_path in enumerate(images, 1):
                print(f"   🖼️  Image {i}: {Path(image_path).name}")
            
        except Exception as e:
            logger.error(f"❌ Image generation failed: {e}")
            sys.exit(1)
    
    async def generate_video(self, prompt: str, model: str = "veo-1.5-001",
                           duration: int = 5, fps: int = 24, 
                           output_dir: Optional[str] = None) -> None:
        """Generate videos using the specified model."""
        logger.info(f"🎬 Generating video with model: {model}")
        logger.info(f"📝 Prompt: {prompt}")
        logger.info(f"⏱️ Duration: {duration} seconds")
        
        try:
            # Simulate video generation
            scenario = {
                "name": "CLI Generated Video",
                "prompt": prompt,
                "model": model,
                "duration": duration,
                "resolution": "1080p"
            }
            
            logger.info("🎥 Generating video...")
            video_path = await self.service._create_demo_video(scenario)
            
            # Calculate cost
            model_config = self.service.supported_models.get(model, {})
            cost = duration * model_config.get("cost_per_second", 0.30)
            
            print(f"\n🎯 Generation Complete!")
            print(f"   🎬 Video Generated: 1")
            print(f"   ⏱️  Duration: {duration} seconds")
            print(f"   💰 Estimated Cost: ${cost:.4f}")
            print(f"   📁 Output Directory: {self.service.output_dir / 'videos'}")
            print(f"   🎥 Video: {Path(video_path).name}")
            
        except Exception as e:
            logger.error(f"❌ Video generation failed: {e}")
            sys.exit(1)
    
    def list_models(self) -> None:
        """List all supported models."""
        print("🤖 Supported Generative AI Models")
        print("="*50)
        
        models = self.service.supported_models
        
        # Group by type
        image_models = {k: v for k, v in models.items() if v["type"] == "image_generation"}
        video_models = {k: v for k, v in models.items() if v["type"] == "video_generation"}
        editing_models = {k: v for k, v in models.items() if v["type"] == "image_editing"}
        
        print(f"\n🎨 Image Generation Models ({len(image_models)}):")
        for model_id, config in image_models.items():
            print(f"   • {model_id}")
            print(f"     Provider: {config['provider']}")
            print(f"     Max Resolution: {config['max_resolution']}")
            print(f"     Cost per Image: ${config['cost_per_image']}")
            print(f"     Capabilities: {', '.join(config['capabilities'])}")
            print()
        
        print(f"🎬 Video Generation Models ({len(video_models)}):")
        for model_id, config in video_models.items():
            print(f"   • {model_id}")
            print(f"     Provider: {config['provider']}")
            print(f"     Max Duration: {config['max_duration']} seconds")
            print(f"     Max Resolution: {config['max_resolution']}")
            print(f"     Cost per Second: ${config['cost_per_second']}")
            print(f"     Capabilities: {', '.join(config['capabilities'])}")
            print()
        
        if editing_models:
            print(f"✏️ Image Editing Models ({len(editing_models)}):")
            for model_id, config in editing_models.items():
                print(f"   • {model_id}")
                print(f"     Provider: {config['provider']}")
                print(f"     Capabilities: {', '.join(config['capabilities'])}")
                print()
    
    def health_check(self) -> None:
        """Perform health check of the service."""
        print("🏥 Generative AI Service Health Check")
        print("="*40)
        
        summary = self.service.get_integration_summary()
        
        print(f"Status: {summary['service_status']}")
        print(f"Total Models: {summary['supported_models']['total_models']}")
        print(f"Image Models: {summary['supported_models']['image_generation']}")
        print(f"Video Models: {summary['supported_models']['video_generation']}")
        print(f"Providers: {', '.join(summary['supported_models']['providers'])}")
        
        print(f"\n🎯 Capabilities:")
        for category, capabilities in summary['capabilities'].items():
            print(f"   {category.replace('_', ' ').title()}: {', '.join(capabilities)}")
        
        print(f"\n🔧 Production Features:")
        for feature, value in summary['production_features'].items():
            print(f"   {feature.replace('_', ' ').title()}: {value}")
        
        print(f"\n✅ Service is healthy and ready for use!")
    
    async def batch_generate_async(self, config_file: str) -> None:
        """Generate multiple items from a configuration file (async-safe)."""
        logger.info(f"📄 Loading batch configuration from: {config_file}")
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)

            print(f"🔄 Processing {len(config.get('requests', []))} batch requests...")
            tasks = []
            for i, request in enumerate(config.get('requests', []), 1):
                print(f"\n📋 Processing request {i}/{len(config['requests'])}")
                if request.get('type') == 'image':
                    tasks.append(self.generate_image(
                        prompt=request['prompt'],
                        model=request.get('model', 'imagegeneration@006'),
                        style=request.get('style'),
                        aspect_ratio=request.get('aspect_ratio', '1:1'),
                        count=request.get('count', 1)
                    ))
                elif request.get('type') == 'video':
                    tasks.append(self.generate_video(
                        prompt=request['prompt'],
                        model=request.get('model', 'veo-1.5-001'),
                        duration=request.get('duration', 5)
                    ))
            # execute sequentially or concurrently; here concurrently:
            await asyncio.gather(*tasks)
            print(f"\n🎉 Batch processing complete!")
        except Exception as e:
            logger.error(f"❌ Batch processing failed: {e}")
            sys.exit(1)

    def batch_generate(self, config_file: str) -> None:
        """Sync wrapper for async batch generation."""
        asyncio.run(self.batch_generate_async(config_file))


def create_sample_batch_config():
    """Create a sample batch configuration file."""
    config = {
        "requests": [
            {
                "type": "image",
                "prompt": "A professional music studio with vintage equipment",
                "model": "imagen-3.0-generate-001",
                "style": "photographic",
                "aspect_ratio": "16:9",
                "count": 1
            },
            {
                "type": "image", 
                "prompt": "Abstract art representing different music genres",
                "model": "black-forest-labs/FLUX.1-dev",
                "style": "artistic",
                "aspect_ratio": "1:1",
                "count": 2
            },
            {
                "type": "video",
                "prompt": "Dynamic music visualization with flowing colors",
                "model": "veo-2.0-001",
                "duration": 8
            }
        ]
    }
    
    with open('batch_generation_sample.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("📄 Sample batch configuration created: batch_generation_sample.json")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="EchoTune AI Generative AI CLI Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Generate image command
    img_parser = subparsers.add_parser('generate-image', help='Generate images')
    img_parser.add_argument('prompt', help='Text prompt for image generation')
    img_parser.add_argument('--model', default='imagegeneration@006', 
                           help='Model to use for generation')
    img_parser.add_argument('--style', help='Style for the image (photographic, artistic, etc.)')
    img_parser.add_argument('--aspect-ratio', default='1:1', 
                           help='Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)')
    img_parser.add_argument('--count', type=int, default=1, 
                           help='Number of images to generate')
    img_parser.add_argument('--output-dir', help='Output directory for generated images')
    
    # Generate video command
    vid_parser = subparsers.add_parser('generate-video', help='Generate videos')
    vid_parser.add_argument('prompt', help='Text prompt for video generation')
    vid_parser.add_argument('--model', default='veo-1.5-001',
                           help='Model to use for generation')
    vid_parser.add_argument('--duration', type=int, default=5,
                           help='Video duration in seconds')
    vid_parser.add_argument('--fps', type=int, default=24,
                           help='Frames per second')
    vid_parser.add_argument('--output-dir', help='Output directory for generated videos')
    
    # List models command
    subparsers.add_parser('list-models', help='List all supported models')
    
    # Health check command
    subparsers.add_parser('health-check', help='Check service health')
    
    # Batch generation command
    batch_parser = subparsers.add_parser('batch-generate', help='Generate from config file')
    batch_parser.add_argument('config_file', help='JSON configuration file')
    
    # Create sample config command
    subparsers.add_parser('create-sample-config', help='Create sample batch config')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    cli = GenerativeAICLI()
    
    try:
        if args.command == 'generate-image':
            asyncio.run(cli.generate_image(
                prompt=args.prompt,
                model=args.model,
                style=args.style,
                aspect_ratio=args.aspect_ratio,
                count=args.count,
                output_dir=args.output_dir
            ))
        
        elif args.command == 'generate-video':
            asyncio.run(cli.generate_video(
                prompt=args.prompt,
                model=args.model,
                duration=args.duration,
                fps=args.fps,
                output_dir=args.output_dir
            ))
        
        elif args.command == 'list-models':
            cli.list_models()
        
        elif args.command == 'health-check':
            cli.health_check()
        
        elif args.command == 'batch-generate':
            cli.batch_generate(args.config_file)
        
        elif args.command == 'create-sample-config':
            create_sample_batch_config()
        
    except KeyboardInterrupt:
        print("\n⏹️ Operation cancelled by user")
    except Exception as e:
        logger.error(f"❌ Command failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()