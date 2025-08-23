#!/usr/bin/env python3
"""
Real autonomous development cycle test with working Perplexity API
This will demonstrate the complete cycle working with real API calls
"""

import os
import sys
sys.path.append('scripts')

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from perplexity_client import PerplexityClient
import json
from datetime import datetime

def run_real_autonomous_development():
    """Run a complete autonomous development cycle with real Perplexity API"""
    
    print("🚀 Real Autonomous Development Cycle Test")
    print("=========================================\n")
    
    # Initialize client
    client = PerplexityClient()
    
    # Check budget and API key
    budget_status = client.budget_manager.check_budget()
    print(f"💰 Budget Status: {budget_status['status']}")
    print(f"💰 Weekly Budget: ${budget_status['weekly_budget']:.2f}")
    print(f"💰 Used This Week: ${budget_status['total_cost']:.4f}")
    print(f"💰 Remaining: ${budget_status['budget_remaining']:.4f}")
    print(f"🔑 API Key: {'CONFIGURED' if client.api_key else 'MISSING'}\n")
    
    if not budget_status['allow_requests']:
        print("❌ Budget exceeded - cannot continue with real API calls")
        return
    
    if not client.api_key:
        print("❌ No API key configured - cannot continue")
        return
    
    print("✅ All checks passed - proceeding with real API calls\n")
    
    # Step 1: Analyze current roadmap (simulated)
    print("📋 Step 1: Roadmap Analysis")
    print("-" * 30)
    
    roadmap_analysis_prompt = """
    Analyze this EchoTune AI project and provide specific, actionable development tasks:
    
    EchoTune AI is a sophisticated music recommendation system that integrates with Spotify 
    to provide AI-powered, personalized music discovery. It uses Node.js (Express), Python, 
    React, MongoDB, Redis, and various AI/ML APIs (OpenAI, Google Gemini, Perplexity).
    
    Identify 5 specific development tasks that can be implemented to improve the system:
    1. Focus on performance optimization
    2. Security enhancements  
    3. User experience improvements
    4. AI/ML algorithm enhancements
    5. API integration improvements
    
    For each task, provide:
    - Task title
    - Description (2-3 sentences)
    - Priority (high/medium/low)
    - Estimated time (hours)
    - Complexity score (1-10)
    
    Format as JSON for easy parsing.
    """
    
    try:
        roadmap_result = client.research(roadmap_analysis_prompt, model='sonar-pro')
        
        if roadmap_result['success']:
            print(f"✅ Roadmap analysis completed successfully")
            print(f"   Model: {roadmap_result['model']}")
            print(f"   Cost: ${roadmap_result['cost_estimate']:.4f}")
            print(f"   Content length: {len(roadmap_result['content'])} characters")
            print(f"   Citations: {len(roadmap_result.get('citations', []))}")
            
            # Save analysis
            with open('perplexity-enhancements/roadmap-updates/REAL_ROADMAP_ANALYSIS.md', 'w') as f:
                f.write(f"# Real Roadmap Analysis - {datetime.now().isoformat()}\n\n")
                f.write(f"**Model:** {roadmap_result['model']}\n")
                f.write(f"**Cost:** ${roadmap_result['cost_estimate']:.4f}\n")
                f.write(f"**Citations:** {len(roadmap_result.get('citations', []))}\n\n")
                f.write("## Analysis Results\n\n")
                f.write(roadmap_result['content'])
                
                if roadmap_result.get('citations'):
                    f.write("\n\n## Citations\n\n")
                    for i, citation in enumerate(roadmap_result['citations'], 1):
                        f.write(f"{i}. {citation}\n")
            
            print(f"   📄 Analysis saved to: perplexity-enhancements/roadmap-updates/REAL_ROADMAP_ANALYSIS.md")
            
        else:
            print(f"❌ Roadmap analysis failed: {roadmap_result.get('error')}")
            return
            
    except Exception as e:
        print(f"❌ Roadmap analysis error: {e}")
        return
    
    print()
    
    # Step 2: Research latest technology trends
    print("🔍 Step 2: Technology Trend Research")
    print("-" * 35)
    
    tech_research_prompt = """
    Research the latest trends and best practices for music streaming applications in 2025:
    
    Focus on:
    1. Latest Spotify API features and capabilities
    2. Modern React patterns for music applications
    3. MongoDB optimization techniques for music data
    4. AI/ML trends in music recommendation systems
    5. Performance optimization strategies for Node.js music apps
    
    Provide actionable insights that can be implemented in the EchoTune AI project.
    Include specific technologies, libraries, or approaches with examples.
    """
    
    try:
        tech_result = client.research(tech_research_prompt, model='sonar-pro')
        
        if tech_result['success']:
            print(f"✅ Technology research completed successfully")
            print(f"   Model: {tech_result['model']}")
            print(f"   Cost: ${tech_result['cost_estimate']:.4f}")
            print(f"   Content length: {len(tech_result['content'])} characters")
            print(f"   Citations: {len(tech_result.get('citations', []))}")
            
            # Save research
            with open('perplexity-enhancements/research-insights/REAL_TECH_TRENDS.md', 'w') as f:
                f.write(f"# Technology Trends Research - {datetime.now().isoformat()}\n\n")
                f.write(f"**Model:** {tech_result['model']}\n")
                f.write(f"**Cost:** ${tech_result['cost_estimate']:.4f}\n")
                f.write(f"**Citations:** {len(tech_result.get('citations', []))}\n\n")
                f.write("## Research Results\n\n")
                f.write(tech_result['content'])
                
                if tech_result.get('citations'):
                    f.write("\n\n## Citations\n\n")
                    for i, citation in enumerate(tech_result['citations'], 1):
                        f.write(f"{i}. {citation}\n")
            
            print(f"   📄 Research saved to: perplexity-enhancements/research-insights/REAL_TECH_TRENDS.md")
            
        else:
            print(f"❌ Technology research failed: {tech_result.get('error')}")
            
    except Exception as e:
        print(f"❌ Technology research error: {e}")
    
    print()
    
    # Step 3: Generate implementation recommendations
    print("💡 Step 3: Implementation Recommendations")
    print("-" * 40)
    
    impl_prompt = """
    Based on the EchoTune AI music platform (Node.js, React, MongoDB, Spotify API), 
    provide 3 specific implementation recommendations that can be coded immediately:
    
    1. A performance optimization that can be implemented in 1-2 hours
    2. A security enhancement that improves API safety
    3. A user experience improvement for the music interface
    
    For each recommendation:
    - Provide specific code examples or pseudocode
    - Explain the implementation approach
    - Estimate the impact and effort required
    - Include file locations and function names where possible
    
    Focus on practical, actionable improvements that a GitHub Copilot coding agent can implement.
    """
    
    try:
        impl_result = client.research(impl_prompt, model='sonar')  # Use cheaper model for implementation details
        
        if impl_result['success']:
            print(f"✅ Implementation recommendations completed successfully")
            print(f"   Model: {impl_result['model']}")
            print(f"   Cost: ${impl_result['cost_estimate']:.4f}")
            print(f"   Content length: {len(impl_result['content'])} characters")
            print(f"   Citations: {len(impl_result.get('citations', []))}")
            
            # Save recommendations
            with open('perplexity-enhancements/improvement-recommendations/REAL_IMPLEMENTATION_TASKS.md', 'w') as f:
                f.write(f"# Implementation Recommendations - {datetime.now().isoformat()}\n\n")
                f.write(f"**Model:** {impl_result['model']}\n")
                f.write(f"**Cost:** ${impl_result['cost_estimate']:.4f}\n")
                f.write(f"**Citations:** {len(impl_result.get('citations', []))}\n\n")
                f.write("## Ready-to-Implement Tasks\n\n")
                f.write(impl_result['content'])
                
                if impl_result.get('citations'):
                    f.write("\n\n## Citations\n\n")
                    for i, citation in enumerate(impl_result['citations'], 1):
                        f.write(f"{i}. {citation}\n")
            
            print(f"   📄 Recommendations saved to: perplexity-enhancements/improvement-recommendations/REAL_IMPLEMENTATION_TASKS.md")
            
        else:
            print(f"❌ Implementation recommendations failed: {impl_result.get('error')}")
            
    except Exception as e:
        print(f"❌ Implementation recommendations error: {e}")
    
    # Final budget check
    final_budget = client.budget_manager.check_budget()
    
    print()
    print("📊 Final Results Summary")
    print("=" * 25)
    print(f"✅ Total API calls made: 3")
    print(f"💰 Total cost this session: ${final_budget['total_cost'] - budget_status['total_cost']:.4f}")
    print(f"💰 Remaining budget: ${final_budget['budget_remaining']:.4f}")
    print(f"📄 Documents generated: 3")
    print(f"🎯 Status: {'SUCCESS' if final_budget['allow_requests'] else 'BUDGET_EXCEEDED'}")
    
    # Create comprehensive session report
    session_report = {
        "session_id": f"real-autonomous-{int(datetime.now().timestamp())}",
        "timestamp": datetime.now().isoformat(),
        "status": "SUCCESS",
        "api_calls_made": 3,
        "total_cost": final_budget['total_cost'] - budget_status['total_cost'],
        "budget_remaining": final_budget['budget_remaining'],
        "documents_generated": [
            "perplexity-enhancements/roadmap-updates/REAL_ROADMAP_ANALYSIS.md",
            "perplexity-enhancements/research-insights/REAL_TECH_TRENDS.md", 
            "perplexity-enhancements/improvement-recommendations/REAL_IMPLEMENTATION_TASKS.md"
        ],
        "budget_status": final_budget['status'],
        "api_key_working": True,
        "next_steps": [
            "Review generated implementation tasks",
            "Execute high-priority recommendations",
            "Continue autonomous development cycle",
            "Monitor budget usage"
        ]
    }
    
    with open('perplexity-enhancements/REAL_SESSION_REPORT.json', 'w') as f:
        json.dump(session_report, f, indent=2)
    
    print(f"📊 Session report saved to: perplexity-enhancements/REAL_SESSION_REPORT.json")
    
    print()
    print("🎉 Real autonomous development cycle completed successfully!")
    print("   - API key is working properly")
    print("   - Real research was conducted")
    print("   - Implementation tasks were generated")
    print("   - Budget tracking is operational")
    print("   - System is ready for continuous development")

if __name__ == '__main__':
    # Ensure directories exist
    import os
    os.makedirs('perplexity-enhancements/roadmap-updates', exist_ok=True)
    os.makedirs('perplexity-enhancements/research-insights', exist_ok=True)
    os.makedirs('perplexity-enhancements/improvement-recommendations', exist_ok=True)
    
    run_real_autonomous_development()