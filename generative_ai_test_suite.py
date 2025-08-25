#!/usr/bin/env python3
"""
Comprehensive Generative AI Testing Suite

Tests image and video generation capabilities with multiple models,
generates various types of content, and provides detailed reporting.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# Import our generative AI service
import sys
sys.path.append('/home/runner/work/Spotify-echo/Spotify-echo')

from src.services.generative_ai_service import (
    GenerativeAIService, 
    GenerationRequest, 
    GenerativeModelType,
    ModelProvider
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GenerativeAITestSuite:
    """Comprehensive testing suite for generative AI capabilities."""
    
    def __init__(self):
        """Initialize the test suite."""
        self.service = GenerativeAIService()
        self.test_results = []
        self.generated_content = []
        self.total_cost = 0.0
        
        # Test prompts for different scenarios
        self.image_test_prompts = [
            {
                "name": "Photorealistic Portrait",
                "prompt": "A photorealistic portrait of a musician in a recording studio, professional lighting, high detail",
                "style": "photographic",
                "aspect_ratio": "3:4"
            },
            {
                "name": "Abstract Art",
                "prompt": "Abstract digital art representing music and sound waves, vibrant colors, flowing forms",
                "style": "digital-art",
                "aspect_ratio": "16:9"
            },
            {
                "name": "Album Cover Design",
                "prompt": "Modern album cover design for electronic music, minimalist style, geometric patterns",
                "style": "graphic-design",
                "aspect_ratio": "1:1"
            },
            {
                "name": "Concert Scene",
                "prompt": "Epic concert scene with stage lights, crowd silhouettes, dramatic atmosphere",
                "style": "cinematic",
                "aspect_ratio": "16:9"
            },
            {
                "name": "Musical Instruments",
                "prompt": "Beautiful collection of vintage musical instruments, warm lighting, artistic composition",
                "style": "artistic",
                "aspect_ratio": "4:3"
            }
        ]
        
        self.video_test_prompts = [
            {
                "name": "Music Visualization",
                "prompt": "Animated music visualization with flowing particles and color waves",
                "duration": 5
            },
            {
                "name": "Concert Atmosphere",
                "prompt": "Dynamic concert atmosphere with moving lights and energy",
                "duration": 8
            },
            {
                "name": "Album Promo",
                "prompt": "Promotional video for a new album release, elegant and modern",
                "duration": 10
            }
        ]
    
    async def run_comprehensive_tests(self) -> Dict[str, Any]:
        """Run the complete test suite."""
        logger.info("🚀 Starting Comprehensive Generative AI Test Suite")
        start_time = time.time()
        
        try:
            # Initialize service
            await self._test_initialization()
            
            # Test image generation
            await self._test_image_generation()
            
            # Test video generation
            await self._test_video_generation()
            
            # Test different models
            await self._test_multiple_models()
            
            # Generate final report
            report = await self._generate_final_report(start_time)
            
            logger.info("✅ Comprehensive testing completed successfully!")
            return report
            
        except Exception as e:
            logger.error(f"❌ Test suite failed: {e}")
            raise
    
    async def _test_initialization(self) -> None:
        """Test service initialization."""
        logger.info("🔧 Testing service initialization...")
        
        try:
            success = await self.service.initialize()
            self.test_results.append({
                "test": "Service Initialization",
                "status": "PASS" if success else "FAIL",
                "timestamp": time.time(),
                "details": "Service initialized successfully" if success else "Initialization failed"
            })
            
            # Test health check
            health = await self.service.health_check()
            self.test_results.append({
                "test": "Health Check",
                "status": "PASS" if health["overall"] == "healthy" else "PARTIAL",
                "timestamp": time.time(),
                "details": health
            })
            
            # Get supported models
            models = self.service.get_supported_models()
            logger.info(f"📊 Found {len(models['models'])} supported models")
            
            self.test_results.append({
                "test": "Model Discovery",
                "status": "PASS",
                "timestamp": time.time(),
                "details": f"Discovered {len(models['models'])} models across {len(models['providers'])} providers"
            })
            
        except Exception as e:
            self.test_results.append({
                "test": "Service Initialization",
                "status": "FAIL",
                "timestamp": time.time(),
                "error": str(e)
            })
            raise
    
    async def _test_image_generation(self) -> None:
        """Test image generation with various prompts and styles."""
        logger.info("🎨 Testing image generation capabilities...")
        
        # Test with primary Google Imagen model
        model_id = "imagegeneration@006"
        
        for i, test_prompt in enumerate(self.image_test_prompts):
            try:
                logger.info(f"🖼️ Generating image {i+1}/{len(self.image_test_prompts)}: {test_prompt['name']}")
                
                request = GenerationRequest(
                    model_id=model_id,
                    prompt=test_prompt["prompt"],
                    model_type=GenerativeModelType.IMAGE_GENERATION,
                    image_count=1,
                    aspect_ratio=test_prompt["aspect_ratio"],
                    style=test_prompt["style"],
                    output_format="PNG"
                )
                
                response = await self.service.generate_image(request)
                
                self.generated_content.append({
                    "type": "image",
                    "name": test_prompt["name"],
                    "model": model_id,
                    "paths": response.content_paths,
                    "cost": response.cost_estimate,
                    "generation_time": response.generation_time_ms,
                    "metadata": response.metadata
                })
                
                self.total_cost += response.cost_estimate
                
                self.test_results.append({
                    "test": f"Image Generation - {test_prompt['name']}",
                    "status": "PASS",
                    "timestamp": time.time(),
                    "details": {
                        "model": model_id,
                        "generation_time_ms": response.generation_time_ms,
                        "cost_estimate": response.cost_estimate,
                        "files_generated": len(response.content_paths)
                    }
                })
                
                # Small delay between requests
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ Failed to generate image for {test_prompt['name']}: {e}")
                self.test_results.append({
                    "test": f"Image Generation - {test_prompt['name']}",
                    "status": "FAIL",
                    "timestamp": time.time(),
                    "error": str(e)
                })
    
    async def _test_video_generation(self) -> None:
        """Test video generation capabilities."""
        logger.info("🎬 Testing video generation capabilities...")
        
        # Test with Google Veo model
        model_id = "veo-1.5-001"
        
        for i, test_prompt in enumerate(self.video_test_prompts):
            try:
                logger.info(f"🎥 Generating video {i+1}/{len(self.video_test_prompts)}: {test_prompt['name']}")
                
                request = GenerationRequest(
                    model_id=model_id,
                    prompt=test_prompt["prompt"],
                    model_type=GenerativeModelType.VIDEO_GENERATION,
                    duration_seconds=test_prompt["duration"],
                    fps=24,
                    output_format="MP4"
                )
                
                response = await self.service.generate_video(request)
                
                self.generated_content.append({
                    "type": "video",
                    "name": test_prompt["name"],
                    "model": model_id,
                    "paths": response.content_paths,
                    "cost": response.cost_estimate,
                    "generation_time": response.generation_time_ms,
                    "metadata": response.metadata
                })
                
                self.total_cost += response.cost_estimate
                
                self.test_results.append({
                    "test": f"Video Generation - {test_prompt['name']}",
                    "status": "PASS",
                    "timestamp": time.time(),
                    "details": {
                        "model": model_id,
                        "generation_time_ms": response.generation_time_ms,
                        "cost_estimate": response.cost_estimate,
                        "duration_seconds": test_prompt["duration"],
                        "files_generated": len(response.content_paths)
                    }
                })
                
                # Longer delay for video generation
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"❌ Failed to generate video for {test_prompt['name']}: {e}")
                self.test_results.append({
                    "test": f"Video Generation - {test_prompt['name']}",
                    "status": "FAIL",
                    "timestamp": time.time(),
                    "error": str(e)
                })
    
    async def _test_multiple_models(self) -> None:
        """Test multiple models with the same prompt."""
        logger.info("🔄 Testing multiple models with same prompt...")
        
        test_prompt = "A beautiful landscape with mountains and a lake at sunset"
        
        image_models = [
            "imagegeneration@006",
            "stabilityai/stable-diffusion-xl-base-1.0",
            "black-forest-labs/FLUX.1-dev"
        ]
        
        for model_id in image_models:
            try:
                logger.info(f"🎨 Testing model: {model_id}")
                
                request = GenerationRequest(
                    model_id=model_id,
                    prompt=test_prompt,
                    model_type=GenerativeModelType.IMAGE_GENERATION,
                    image_count=1,
                    aspect_ratio="16:9",
                    output_format="PNG"
                )
                
                response = await self.service.generate_image(request)
                
                self.generated_content.append({
                    "type": "image",
                    "name": f"Multi-Model Test - {model_id}",
                    "model": model_id,
                    "paths": response.content_paths,
                    "cost": response.cost_estimate,
                    "generation_time": response.generation_time_ms,
                    "metadata": response.metadata
                })
                
                self.total_cost += response.cost_estimate
                
                self.test_results.append({
                    "test": f"Multi-Model Test - {model_id}",
                    "status": "PASS",
                    "timestamp": time.time(),
                    "details": {
                        "model": model_id,
                        "provider": response.provider,
                        "generation_time_ms": response.generation_time_ms,
                        "cost_estimate": response.cost_estimate
                    }
                })
                
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ Failed to test model {model_id}: {e}")
                self.test_results.append({
                    "test": f"Multi-Model Test - {model_id}",
                    "status": "FAIL",
                    "timestamp": time.time(),
                    "error": str(e)
                })
    
    async def _generate_final_report(self, start_time: float) -> Dict[str, Any]:
        """Generate comprehensive final report."""
        total_time = time.time() - start_time
        
        # Calculate statistics
        passed_tests = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed_tests = sum(1 for result in self.test_results if result["status"] == "FAIL")
        partial_tests = sum(1 for result in self.test_results if result["status"] == "PARTIAL")
        
        images_generated = len([content for content in self.generated_content if content["type"] == "image"])
        videos_generated = len([content for content in self.generated_content if content["type"] == "video"])
        
        # Create comprehensive report
        report = {
            "test_summary": {
                "total_tests": len(self.test_results),
                "passed": passed_tests,
                "failed": failed_tests,
                "partial": partial_tests,
                "success_rate": round((passed_tests / len(self.test_results)) * 100, 2) if self.test_results else 0,
                "total_time_seconds": round(total_time, 2)
            },
            "content_generation": {
                "images_generated": images_generated,
                "videos_generated": videos_generated,
                "total_content_pieces": len(self.generated_content),
                "total_cost_estimate": round(self.total_cost, 4)
            },
            "detailed_results": self.test_results,
            "generated_content": self.generated_content,
            "models_tested": list(set(content["model"] for content in self.generated_content)),
            "timestamp": datetime.now().isoformat(),
            "test_environment": {
                "service_version": "1.0.0",
                "output_directory": str(self.service.output_dir),
                "rate_limit": f"{self.service.max_rpm} requests/minute"
            }
        }
        
        # Save report to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = Path(f"generative_ai_test_report_{timestamp}.json")
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"📄 Report saved to: {report_path}")
        
        # Print summary
        self._print_test_summary(report)
        
        return report
    
    def _print_test_summary(self, report: Dict[str, Any]) -> None:
        """Print a formatted test summary."""
        print("\n" + "="*60)
        print("🎯 GENERATIVE AI TEST SUITE RESULTS")
        print("="*60)
        
        summary = report["test_summary"]
        content = report["content_generation"]
        
        print(f"📊 Test Results:")
        print(f"   ✅ Passed: {summary['passed']}")
        print(f"   ❌ Failed: {summary['failed']}")
        print(f"   ⚠️  Partial: {summary['partial']}")
        print(f"   📈 Success Rate: {summary['success_rate']}%")
        print(f"   ⏱️  Total Time: {summary['total_time_seconds']}s")
        
        print(f"\n🎨 Content Generated:")
        print(f"   🖼️  Images: {content['images_generated']}")
        print(f"   🎬 Videos: {content['videos_generated']}")
        print(f"   💰 Estimated Cost: ${content['total_cost_estimate']}")
        
        print(f"\n🤖 Models Tested:")
        for model in report["models_tested"]:
            print(f"   • {model}")
        
        print(f"\n📁 Generated Content Saved To:")
        print(f"   📂 {report['test_environment']['output_directory']}")
        
        if summary["failed"] == 0:
            print("\n🎉 ALL TESTS PASSED! Generative AI integration is working perfectly!")
        else:
            print(f"\n⚠️  {summary['failed']} tests failed. Check the detailed report for issues.")
        
        print("="*60)


async def main():
    """Main test execution function."""
    print("🚀 Starting Generative AI Integration Testing...")
    
    test_suite = GenerativeAITestSuite()
    
    try:
        report = await test_suite.run_comprehensive_tests()
        
        # Additional verification
        if report["test_summary"]["success_rate"] >= 80:
            print("\n✅ INTEGRATION TEST SUCCESSFUL!")
            print("   Generative AI service is ready for production use.")
        else:
            print("\n⚠️  INTEGRATION TEST PARTIAL SUCCESS")
            print("   Some features may need additional configuration.")
        
        return report
        
    except Exception as e:
        print(f"\n❌ INTEGRATION TEST FAILED: {e}")
        return None


if __name__ == "__main__":
    # Run the test suite
    asyncio.run(main())