#!/usr/bin/env python3
"""
Enhanced Autonomous Development Orchestrator

This module provides comprehensive autonomous development capabilities including:
- Roadmap analysis and task identification
- Code generation and implementation
- Progress tracking and reporting
- Integration with Perplexity API for research and analysis

Designed for GitHub Copilot autonomous development workflows.
"""

import os
import sys
import json
import logging
import asyncio
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict

# Add scripts directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__)))

try:
    from perplexity_client import PerplexityClient
except ImportError as e:
    print(f"❌ Failed to import perplexity_client: {e}")
    print("Make sure perplexity_client.py is in the scripts directory")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class DevelopmentTask:
    """Represents a development task identified from roadmap analysis"""
    id: str
    title: str
    description: str
    priority: str  # high, medium, low
    complexity_score: int  # 1-10
    estimated_hours: float
    files_to_modify: List[str]
    implementation_steps: List[str]
    dependencies: List[str]
    category: str  # frontend, backend, ml, devops, etc.
    research_context: str
    
@dataclass 
class AutonomousSession:
    """Tracks an autonomous development session"""
    session_id: str
    start_time: datetime
    trigger_type: str
    max_iterations: int
    focus_area: str
    tasks_identified: int
    tasks_completed: int
    research_insights: List[str]
    code_changes: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]

class AutonomousDevelopmentOrchestrator:
    """Main orchestrator for autonomous development workflows"""
    
    def __init__(self, session_dir: str = ".autonomous-session"):
        self.session_dir = Path(session_dir)
        self.session_dir.mkdir(exist_ok=True)
        
        self.perplexity_client = PerplexityClient()
        self.session: Optional[AutonomousSession] = None
        
        # Configuration
        self.max_tasks_per_iteration = int(os.environ.get('MAX_TASKS_PER_ITERATION', '3'))
        self.complexity_threshold = int(os.environ.get('COMPLEXITY_THRESHOLD', '8'))
        self.focus_area = os.environ.get('FOCUS_AREA', '')
        
        logger.info(f"Initialized orchestrator with session dir: {self.session_dir}")

    def start_session(self, trigger_type: str, max_iterations: int = 5, focus_area: str = "") -> str:
        """Start a new autonomous development session"""
        session_id = f"autonomous-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        self.session = AutonomousSession(
            session_id=session_id,
            start_time=datetime.now(),
            trigger_type=trigger_type,
            max_iterations=max_iterations,
            focus_area=focus_area,
            tasks_identified=0,
            tasks_completed=0,
            research_insights=[],
            code_changes=[],
            performance_metrics={}
        )
        
        # Create session directory
        session_path = self.session_dir / session_id
        session_path.mkdir(exist_ok=True)
        
        # Save session metadata
        with open(session_path / "session_metadata.json", 'w') as f:
            json.dump(asdict(self.session), f, indent=2, default=str)
            
        logger.info(f"Started autonomous development session: {session_id}")
        return session_id

    def analyze_roadmap(self) -> List[DevelopmentTask]:
        """Analyze current roadmap and identify actionable development tasks"""
        logger.info("🔍 Analyzing roadmap for development opportunities...")
        
        try:
            # Read roadmap files
            roadmap_content = self._read_roadmap_files()
            
            # Use Perplexity to analyze and extract tasks
            analysis_prompt = self._build_roadmap_analysis_prompt(roadmap_content)
            
            research_result = self.perplexity_client.research(
                analysis_prompt, 
                enable_web_search=True
            )
            
            # Extract structured task data
            tasks = self._extract_tasks_from_analysis(research_result['content'])
            
            # Filter and prioritize tasks
            filtered_tasks = self._filter_and_prioritize_tasks(tasks)
            
            if self.session:
                self.session.tasks_identified = len(filtered_tasks)
                self.session.research_insights.append(research_result['content'][:500] + "...")
                
            logger.info(f"✅ Identified {len(filtered_tasks)} actionable tasks")
            return filtered_tasks
            
        except Exception as e:
            logger.error(f"❌ Roadmap analysis failed: {e}")
            return []

    def execute_development_tasks(self, tasks: List[DevelopmentTask]) -> Dict[str, Any]:
        """Execute identified development tasks"""
        logger.info(f"🔧 Executing {min(len(tasks), self.max_tasks_per_iteration)} development tasks...")
        
        execution_results = {
            "tasks_attempted": 0,
            "tasks_successful": 0,
            "tasks_failed": 0,
            "code_changes": [],
            "errors": []
        }
        
        # Execute top priority tasks up to max limit
        for i, task in enumerate(tasks[:self.max_tasks_per_iteration]):
            try:
                logger.info(f"Executing task {i+1}: {task.title}")
                
                # Generate implementation code
                implementation = self._generate_task_implementation(task)
                
                if implementation:
                    # Apply code changes (in simulation mode for safety)
                    changes = self._simulate_code_changes(task, implementation)
                    
                    execution_results["code_changes"].append({
                        "task_id": task.id,
                        "task_title": task.title,
                        "files_modified": task.files_to_modify,
                        "implementation_summary": implementation[:200] + "...",
                        "changes": changes
                    })
                    
                    execution_results["tasks_successful"] += 1
                else:
                    execution_results["tasks_failed"] += 1
                    execution_results["errors"].append(f"Failed to generate implementation for: {task.title}")
                
                execution_results["tasks_attempted"] += 1
                
            except Exception as e:
                logger.error(f"❌ Task execution failed for {task.title}: {e}")
                execution_results["tasks_failed"] += 1
                execution_results["errors"].append(str(e))
        
        # Update session tracking
        if self.session:
            self.session.tasks_completed = execution_results["tasks_successful"]
            self.session.code_changes = execution_results["code_changes"]
            
        logger.info(f"✅ Task execution complete: {execution_results['tasks_successful']}/{execution_results['tasks_attempted']} successful")
        return execution_results

    def conduct_research_and_update_roadmap(self, execution_results: Dict[str, Any]) -> Dict[str, Any]:
        """Conduct comprehensive research and update roadmap with new insights"""
        logger.info("🔍 Conducting research to update roadmap...")
        
        try:
            # Build research prompt based on current state
            research_prompt = self._build_comprehensive_research_prompt(execution_results)
            
            # Conduct research
            research_result = self.perplexity_client.research(
                research_prompt,
                enable_web_search=True
            )
            
            # Update roadmaps
            roadmap_updates = self._update_roadmaps_with_research(research_result['content'])
            
            # Generate new tasks from research
            new_tasks = self._extract_tasks_from_research(research_result['content'])
            
            research_summary = {
                "research_content": research_result['content'],
                "new_tasks_identified": len(new_tasks),
                "roadmap_sections_updated": len(roadmap_updates),
                "research_cost": research_result.get('cost', 0),
                "model_used": research_result.get('model', 'unknown'),
                "timestamp": datetime.now().isoformat()
            }
            
            if self.session:
                self.session.research_insights.append(research_result['content'][:500] + "...")
                
            logger.info(f"✅ Research complete: {len(new_tasks)} new tasks identified")
            return research_summary
            
        except Exception as e:
            logger.error(f"❌ Research and roadmap update failed: {e}")
            return {"error": str(e), "new_tasks_identified": 0}

    def save_session_report(self) -> str:
        """Save comprehensive session report"""
        if not self.session:
            return ""
            
        try:
            session_path = self.session_dir / self.session.session_id
            session_path.mkdir(exist_ok=True)
            
            # Generate comprehensive report
            report_content = f"""# 🤖 Autonomous Development Session Report

**Session ID**: {self.session.session_id}
**Started**: {self.session.start_time.isoformat()}
**Completed**: {datetime.now().isoformat()}
**Duration**: {datetime.now() - self.session.start_time}
**Trigger**: {self.session.trigger_type}

## 📊 Session Statistics

- **Tasks Identified**: {self.session.tasks_identified}
- **Tasks Completed**: {self.session.tasks_completed}
- **Success Rate**: {(self.session.tasks_completed / max(self.session.tasks_identified, 1)) * 100:.1f}%
- **Research Insights**: {len(self.session.research_insights)}
- **Code Changes**: {len(self.session.code_changes)}

## 🔧 Development Activities

### Tasks Executed:
"""
            
            for i, change in enumerate(self.session.code_changes, 1):
                report_content += f"""
{i}. **{change['task_title']}**
   - Files: {', '.join(change['files_modified'])}
   - Status: Completed
   - Summary: {change['implementation_summary']}
"""
            
            report_content += f"""

## 🔍 Research Insights

{chr(10).join(f"- {insight[:200]}..." for insight in self.session.research_insights)}

## 📈 Performance Metrics

{json.dumps(self.session.performance_metrics, indent=2)}

## 🔄 Next Steps

Based on this session's analysis, the following actions are recommended:
1. Review generated code changes for implementation
2. Continue with next development iteration
3. Monitor roadmap for new research-driven tasks

---
*Report generated by Autonomous Development Orchestrator*
"""
            
            report_path = session_path / "session_report.md"
            with open(report_path, 'w') as f:
                f.write(report_content)
            
            # Save session data as JSON
            with open(session_path / "session_data.json", 'w') as f:
                json.dump(asdict(self.session), f, indent=2, default=str)
                
            logger.info(f"✅ Session report saved: {report_path}")
            return str(report_path)
            
        except Exception as e:
            logger.error(f"❌ Failed to save session report: {e}")
            return ""

    def _read_roadmap_files(self) -> Dict[str, str]:
        """Read and combine all roadmap files"""
        roadmaps = {}
        
        roadmap_files = [
            "ROADMAP.md",
            "AUTONOMOUS_DEVELOPMENT_ROADMAP.md", 
            "DEVELOPMENT_AUTOMATION.md"
        ]
        
        for filename in roadmap_files:
            filepath = Path(filename)
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    roadmaps[filename] = f.read()
                    
        return roadmaps

    def _build_roadmap_analysis_prompt(self, roadmap_content: Dict[str, str]) -> str:
        """Build comprehensive prompt for roadmap analysis"""
        
        combined_content = "\n\n".join([
            f"## {filename}\n{content[:5000]}" 
            for filename, content in roadmap_content.items()
        ])
        
        return f"""
Analyze the EchoTune AI development roadmaps and identify specific, actionable development tasks that can be implemented autonomously.

## Current Roadmaps:
{combined_content}

## Analysis Requirements:

Focus on identifying tasks that are:
1. **Clearly Defined**: Specific implementation requirements
2. **Self-Contained**: Can be completed independently  
3. **Appropriate Complexity**: Can be completed in 1-3 hours
4. **High Impact**: Provide meaningful value to the project
5. **Feasible**: Don't require external dependencies or complex setup

## Required Output Format:

Return a JSON structure with actionable tasks:

```json
{{
  "actionable_tasks": [
    {{
      "id": "task_unique_id",
      "title": "Clear Task Title", 
      "description": "Detailed description of what needs to be implemented",
      "priority": "high|medium|low",
      "complexity_score": 7,
      "estimated_hours": 1.5,
      "files_to_modify": ["src/components/Example.jsx", "src/api/routes.js"],
      "implementation_steps": [
        "Step 1: Analyze existing code structure",
        "Step 2: Implement core functionality", 
        "Step 3: Add error handling",
        "Step 4: Write tests"
      ],
      "dependencies": ["existing_component", "api_endpoint"],
      "category": "frontend|backend|ml|devops|testing",
      "research_context": "Context about why this task is important"
    }}
  ],
  "analysis_summary": "Summary of roadmap analysis and task selection rationale",
  "total_tasks_found": 5,
  "completion_estimate": "2-3 days for all identified tasks"
}}
```

Focus area: {self.focus_area or "Full roadmap analysis"}

Prioritize tasks that can be implemented through code generation and don't require human decision-making or external resources.
"""

    def _build_comprehensive_research_prompt(self, execution_results: Dict[str, Any]) -> str:
        """Build prompt for comprehensive research and roadmap updates"""
        
        return f"""
Conduct comprehensive browser research to enhance the EchoTune AI development roadmap based on recent development activities.

## Current Development State:
- **Tasks Completed**: {execution_results.get('tasks_successful', 0)}
- **Tasks Attempted**: {execution_results.get('tasks_attempted', 0)}
- **Code Changes**: {len(execution_results.get('code_changes', []))} modifications made

## Recent Development Activities:
{json.dumps(execution_results.get('code_changes', [])[:3], indent=2)}

## Research Focus Areas:

### 1. Technology Advancement Research:
- Latest music AI/ML innovations and algorithms
- Spotify Web API updates and new features
- React 19 and modern frontend patterns
- Node.js performance optimization techniques
- MongoDB optimization for music data
- Real-time music streaming technologies

### 2. Development Process Optimization:
- GitHub Copilot and AI coding best practices
- Autonomous development workflow improvements  
- MCP (Model Context Protocol) integration opportunities
- Continuous integration and deployment enhancements

### 3. Architecture and Performance:
- Microservices architecture for music platforms
- Caching strategies for music streaming
- Security best practices for music applications
- Scalability patterns for real-time applications

### 4. User Experience Enhancements:
- Modern music discovery interfaces
- Audio visualization techniques
- Progressive Web App capabilities
- Mobile-first design patterns

## Output Requirements:

Based on your research, provide:

1. **New High-Priority Development Tasks**: Specific tasks identified through research
2. **Technology Integration Opportunities**: New technologies to integrate
3. **Performance Optimization Recommendations**: Specific improvements
4. **Architecture Enhancement Suggestions**: Structural improvements
5. **Updated Development Priorities**: Revised task priorities based on research

Format the response as structured markdown that can be integrated into the development roadmap.
Include specific implementation guidance and complexity estimates for each recommendation.

Focus on actionable insights that can drive immediate development improvements while building toward long-term architectural goals.
"""

    def _extract_tasks_from_analysis(self, analysis_content: str) -> List[DevelopmentTask]:
        """Extract structured tasks from Perplexity analysis"""
        tasks = []
        
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', analysis_content, re.DOTALL)
            
            if json_match:
                data = json.loads(json_match.group())
                task_data = data.get('actionable_tasks', [])
                
                for task_info in task_data:
                    task = DevelopmentTask(
                        id=task_info.get('id', f'task_{len(tasks)}'),
                        title=task_info.get('title', 'Untitled Task'),
                        description=task_info.get('description', ''),
                        priority=task_info.get('priority', 'medium'),
                        complexity_score=task_info.get('complexity_score', 5),
                        estimated_hours=task_info.get('estimated_hours', 1.0),
                        files_to_modify=task_info.get('files_to_modify', []),
                        implementation_steps=task_info.get('implementation_steps', []),
                        dependencies=task_info.get('dependencies', []),
                        category=task_info.get('category', 'general'),
                        research_context=task_info.get('research_context', '')
                    )
                    tasks.append(task)
            else:
                # Fallback: extract tasks from text content
                tasks = self._extract_tasks_from_text(analysis_content)
                
        except Exception as e:
            logger.error(f"❌ Failed to extract tasks from analysis: {e}")
            tasks = self._extract_tasks_from_text(analysis_content)
            
        return tasks

    def _extract_tasks_from_text(self, content: str) -> List[DevelopmentTask]:
        """Fallback method to extract tasks from text content"""
        tasks = []
        
        # Simple pattern matching for task-like content
        import re
        
        # Look for task patterns
        task_patterns = [
            r'(?:^|\n)\s*(?:\d+\.\s*)?(?:\-|\*)\s*(.+(?:implement|create|add|update|optimize|enhance|develop|build).+)(?:\n|$)',
            r'(?:^|\n)#+\s*(.+(?:implement|create|add|update|optimize|enhance|develop|build).+)(?:\n|$)'
        ]
        
        for pattern in task_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            
            for i, match in enumerate(matches[:5]):  # Limit to 5 tasks
                task = DevelopmentTask(
                    id=f'text_task_{len(tasks) + 1}',
                    title=match.strip()[:100],
                    description=match.strip(),
                    priority='medium',
                    complexity_score=5,
                    estimated_hours=1.5,
                    files_to_modify=[],
                    implementation_steps=[],
                    dependencies=[],
                    category='general',
                    research_context='Extracted from text analysis'
                )
                tasks.append(task)
                
        return tasks

    def _filter_and_prioritize_tasks(self, tasks: List[DevelopmentTask]) -> List[DevelopmentTask]:
        """Filter and prioritize tasks based on complexity and focus area"""
        
        # Filter by complexity threshold
        filtered_tasks = [
            task for task in tasks 
            if task.complexity_score <= self.complexity_threshold
        ]
        
        # Filter by focus area if specified
        if self.focus_area:
            filtered_tasks = [
                task for task in filtered_tasks
                if self.focus_area.lower() in task.category.lower() or
                   self.focus_area.lower() in task.title.lower() or
                   self.focus_area.lower() in task.description.lower()
            ]
        
        # Sort by priority and complexity
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        
        filtered_tasks.sort(key=lambda task: (
            priority_order.get(task.priority, 1),
            task.complexity_score,
            -len(task.implementation_steps)  # Prefer more detailed tasks
        ))
        
        return filtered_tasks

    def _generate_task_implementation(self, task: DevelopmentTask) -> str:
        """Generate implementation code for a development task"""
        
        try:
            implementation_prompt = f"""
Generate implementation code for this development task:

**Task**: {task.title}
**Description**: {task.description}
**Category**: {task.category}
**Files to Modify**: {', '.join(task.files_to_modify)}
**Implementation Steps**: {'; '.join(task.implementation_steps)}

Generate practical, production-ready code that:
1. Follows existing project patterns and conventions
2. Includes proper error handling
3. Has appropriate logging and debugging
4. Follows security best practices
5. Is well-documented with comments

Focus on generating actual implementable code rather than pseudocode or theoretical solutions.
"""
            
            result = self.perplexity_client.research(
                implementation_prompt,
                enable_web_search=False  # Code generation doesn't need web search
            )
            
            return result['content']
            
        except Exception as e:
            logger.error(f"❌ Implementation generation failed for {task.title}: {e}")
            return ""

    def _simulate_code_changes(self, task: DevelopmentTask, implementation: str) -> Dict[str, Any]:
        """Simulate applying code changes (for safety - actual changes would be made by human review)"""
        
        return {
            "simulation": True,
            "task_id": task.id,
            "files_affected": task.files_to_modify,
            "changes_summary": f"Generated {len(implementation)} characters of implementation code",
            "implementation_preview": implementation[:300] + "...",
            "requires_human_review": True,
            "estimated_lines_changed": len(implementation.split('\n'))
        }

    def _update_roadmaps_with_research(self, research_content: str) -> List[str]:
        """Update roadmap files with research insights"""
        updates = []
        
        try:
            # Generate roadmap update content
            update_content = f"""
## 🔍 Latest Research Insights - {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}

### Research-Driven Development Opportunities:

{research_content[:2000]}...

[Full research available in autonomous session artifacts]

---
"""
            
            # Update AUTONOMOUS_DEVELOPMENT_ROADMAP.md
            autonomous_roadmap_path = Path('AUTONOMOUS_DEVELOPMENT_ROADMAP.md')
            
            if autonomous_roadmap_path.exists():
                with open(autonomous_roadmap_path, 'r') as f:
                    current_content = f.read()
            else:
                current_content = f"""# 🤖 Autonomous Development Roadmap

This roadmap is automatically maintained by the autonomous development system.

**Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}

---
"""
            
            # Remove old research sections to avoid duplication
            import re
            current_content = re.sub(
                r'\n## 🔍 Latest Research Insights.*?(?=\n## |\Z)', 
                '', 
                current_content, 
                flags=re.DOTALL
            )
            
            # Add new research section
            updated_content = current_content + update_content
            
            with open(autonomous_roadmap_path, 'w') as f:
                f.write(updated_content)
                
            updates.append("AUTONOMOUS_DEVELOPMENT_ROADMAP.md updated with research insights")
            
        except Exception as e:
            logger.error(f"❌ Failed to update roadmaps: {e}")
            
        return updates

    def _extract_tasks_from_research(self, research_content: str) -> List[DevelopmentTask]:
        """Extract new tasks identified from research"""
        # This would extract tasks from research content similar to roadmap analysis
        # For now, return empty list as research tasks would be manually reviewed
        return []


def main():
    """Main entry point for autonomous development orchestrator"""
    
    # Initialize orchestrator
    orchestrator = AutonomousDevelopmentOrchestrator()
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Autonomous Development Orchestrator')
    parser.add_argument('--trigger', default='manual', help='Trigger type for the session')
    parser.add_argument('--max-iterations', type=int, default=3, help='Maximum development iterations')
    parser.add_argument('--focus-area', default='', help='Focus area for development')
    parser.add_argument('--action', choices=['analyze', 'execute', 'research', 'full-cycle'], 
                       default='full-cycle', help='Action to perform')
    
    args = parser.parse_args()
    
    print(f"🚀 Starting Autonomous Development Orchestrator")
    print(f"   Action: {args.action}")
    print(f"   Trigger: {args.trigger}")
    print(f"   Max Iterations: {args.max_iterations}")
    print(f"   Focus Area: {args.focus_area or 'All areas'}")
    
    # Start session
    session_id = orchestrator.start_session(
        trigger_type=args.trigger,
        max_iterations=args.max_iterations,
        focus_area=args.focus_area
    )
    
    try:
        if args.action in ['analyze', 'full-cycle']:
            # Step 1: Analyze roadmap
            tasks = orchestrator.analyze_roadmap()
            print(f"✅ Roadmap analysis: {len(tasks)} tasks identified")
            
        if args.action in ['execute', 'full-cycle'] and tasks:
            # Step 2: Execute development tasks
            execution_results = orchestrator.execute_development_tasks(tasks)
            print(f"✅ Task execution: {execution_results['tasks_successful']}/{execution_results['tasks_attempted']} successful")
            
        if args.action in ['research', 'full-cycle']:
            # Step 3: Research and update roadmap
            research_results = orchestrator.conduct_research_and_update_roadmap(
                execution_results if 'execution_results' in locals() else {}
            )
            print(f"✅ Research complete: {research_results.get('new_tasks_identified', 0)} new tasks identified")
        
        # Save comprehensive session report
        report_path = orchestrator.save_session_report()
        if report_path:
            print(f"📊 Session report saved: {report_path}")
        
        print(f"🎉 Autonomous development session {session_id} completed successfully")
        
    except KeyboardInterrupt:
        print(f"\n⚠️ Session {session_id} interrupted by user")
    except Exception as e:
        print(f"❌ Session {session_id} failed: {e}")
        logger.error(f"Session failed: {e}", exc_info=True)
    finally:
        # Ensure session report is saved even on failure
        if orchestrator.session:
            orchestrator.save_session_report()


if __name__ == "__main__":
    main()