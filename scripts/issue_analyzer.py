#!/usr/bin/env python3
"""
Unified Issue Analyzer with Perplexity Integration

Combines analysis logic with:
- Caching by MD5 hash of title+body with 14-day TTL
- Complexity scoring for automatic model selection
- Cost estimation and budget enforcement
- Structured JSON output for downstream parsing
- Integration with centralized PerplexityClient

Usage:
    python scripts/issue_analyzer.py --issue 123 --dry-run
    python scripts/issue_analyzer.py --title "Bug in auth" --body "Description..."
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from perplexity_client import PerplexityClient

class IssueAnalyzer:
    """Unified issue analyzer with Perplexity integration"""
    
    def __init__(self, repository_root: Optional[Path] = None):
        if repository_root is None:
            repository_root = Path(__file__).parent.parent  # Go up from scripts/ to root
        
        self.repository_root = Path(repository_root)
        self.perplexity_dir = self.repository_root / '.perplexity'
        
        # Initialize Perplexity client
        self.client = PerplexityClient(self.perplexity_dir)
        
        print(f"Initialized IssueAnalyzer for repository: {self.repository_root}")
    
    def analyze_issue_from_github(self, issue_number: int, dry_run: bool = False) -> Dict[str, Any]:
        """Analyze issue by fetching from GitHub API"""
        # In a real implementation, this would fetch from GitHub API
        # For now, we'll use mock data
        
        mock_issues = {
            123: {
                'title': 'Implement user authentication system',
                'body': '''We need to implement a comprehensive user authentication system with the following features:

1. User registration with email verification
2. Secure password hashing using bcrypt
3. JWT token-based authentication
4. Password reset functionality
5. Rate limiting for login attempts
6. Integration with existing MongoDB database

Technical requirements:
- Use Express.js middleware for route protection
- Implement proper error handling
- Add comprehensive logging
- Include unit tests for all authentication functions
- Follow OWASP security best practices

Current architecture uses Node.js with Express and MongoDB. The authentication system should integrate seamlessly with the existing chat and recommendation features.'''
            },
            456: {
                'title': 'Fix CSS styling issue in mobile view',
                'body': 'The navigation menu is not displaying properly on mobile devices. It appears to be overlapping with the main content area.'
            }
        }
        
        if issue_number in mock_issues:
            issue_data = mock_issues[issue_number]
            return self.analyze_issue(
                title=issue_data['title'],
                body=issue_data['body'],
                issue_number=issue_number,
                dry_run=dry_run
            )
        else:
            return {
                'success': False,
                'error': f'Issue #{issue_number} not found (using mock data)',
                'analysis': {
                    'summary': 'Issue not found in mock data',
                    'technical_analysis': 'N/A',
                    'priority': 'Unknown',
                    'effort_estimate': 'N/A'
                }
            }
    
    def analyze_issue(self, title: str, body: str, issue_number: Optional[int] = None, 
                     dry_run: bool = False) -> Dict[str, Any]:
        """Analyze issue with structured output"""
        
        print(f"Analyzing issue: {title[:50]}{'...' if len(title) > 50 else ''}")
        
        # Get analysis from Perplexity client
        result = self.client.analyze_issue(title, body, issue_number, dry_run)
        
        # Parse analysis into structured format
        analysis = self._parse_analysis_content(result.get('content', ''), title, body)
        
        # Create comprehensive result
        comprehensive_result = {
            'success': result.get('success', False),
            'issue_number': issue_number,
            'title': title,
            'analysis_timestamp': datetime.now().isoformat(),
            'metadata': {
                'model_used': result.get('model'),
                'complexity_score': result.get('complexity_score'),
                'cache_hit': result.get('cache_hit', False),
                'cost_estimate': result.get('cost_estimate', 0.0),
                'dry_run': result.get('dry_run', False)
            },
            'budget_status': result.get('budget_status', {}),
            'analysis': analysis,
            'structured_data': {
                'tags': self._extract_tags(title, body),
                'components_affected': self._identify_components(title, body),
                'technology_stack': self._identify_technologies(title, body)
            }
        }
        
        # Add error information if analysis failed
        if not result.get('success'):
            comprehensive_result['error'] = result.get('error')
        
        return comprehensive_result
    
    def _parse_analysis_content(self, content: str, title: str, body: str) -> Dict[str, Any]:
        """Parse analysis content into structured format"""
        if not content or content.startswith('[DRY_RUN]'):
            return self._generate_fallback_analysis(title, body)
        
        analysis = {
            'summary': self._extract_section(content, ['Summary', 'Overview']),
            'technical_analysis': self._extract_section(content, ['Technical Analysis', 'Technical Details']),
            'priority': self._extract_section(content, ['Priority']),
            'effort_estimate': self._extract_section(content, ['Effort Estimate', 'Effort']),
            'implementation_approach': self._extract_section(content, ['Implementation Approach', 'Approach']),
            'risks_considerations': self._extract_section(content, ['Risks & Considerations', 'Risks']),
            'related_components': self._extract_section(content, ['Related Components', 'Components']),
            'full_analysis': content
        }
        
        return analysis
    
    def _extract_section(self, content: str, section_names: list) -> str:
        """Extract specific section from analysis content"""
        lines = content.split('\n')
        section_content = []
        in_section = False
        
        for line in lines:
            line_stripped = line.strip()
            
            # Check if this line starts a section we want
            for section_name in section_names:
                if (line_stripped.startswith(f'**{section_name}') or 
                    line_stripped.startswith(f'#{section_name}') or
                    line_stripped.startswith(f'{section_name}:')):
                    in_section = True
                    section_content = [line_stripped]
                    break
            else:
                # Check if this line starts a new section (we're no longer in our section)
                if in_section and (line_stripped.startswith('**') or 
                                  line_stripped.startswith('#') or 
                                  (line_stripped.endswith(':') and len(line_stripped.split()) <= 4)):
                    break
                elif in_section:
                    section_content.append(line_stripped)
        
        return '\n'.join(section_content).strip() if section_content else 'Not specified'
    
    def _generate_fallback_analysis(self, title: str, body: str) -> Dict[str, Any]:
        """Generate basic analysis when API is unavailable"""
        complexity_score = self.client.calculate_complexity_score(title, body)
        
        # Determine priority based on keywords
        priority = 'Medium'
        if any(keyword in title.lower() for keyword in ['critical', 'urgent', 'bug', 'error', 'broken']):
            priority = 'High'
        elif any(keyword in title.lower() for keyword in ['feature', 'enhancement', 'improvement']):
            priority = 'Medium'
        elif any(keyword in title.lower() for keyword in ['typo', 'documentation', 'minor']):
            priority = 'Low'
        
        # Estimate effort based on complexity
        effort_map = {
            1: '1-2 hours', 2: '2-4 hours', 3: '4-8 hours',
            4: '1-2 days', 5: '2-3 days', 6: '3-5 days',
            7: '1 week', 8: '1-2 weeks', 9: '2-3 weeks', 10: '3+ weeks'
        }
        
        return {
            'summary': f'Analysis pending - {title}',
            'technical_analysis': 'Detailed technical analysis requires API access',
            'priority': priority,
            'effort_estimate': effort_map.get(complexity_score, '1-2 days'),
            'implementation_approach': 'Approach will be determined after full analysis',
            'risks_considerations': 'Risk assessment pending full analysis',
            'related_components': 'Component analysis pending',
            'full_analysis': 'Full analysis unavailable - API call skipped or failed'
        }
    
    def _extract_tags(self, title: str, body: str) -> list:
        """Extract relevant tags from issue content"""
        content = f"{title} {body}".lower()
        
        tags = []
        
        # Technology tags
        tech_keywords = {
            'frontend': ['react', 'vue', 'angular', 'css', 'html', 'javascript', 'ui', 'ux'],
            'backend': ['node', 'express', 'api', 'server', 'database', 'mongodb'],
            'security': ['auth', 'login', 'password', 'token', 'security', 'vulnerability'],
            'performance': ['slow', 'optimization', 'performance', 'cache', 'speed'],
            'bug': ['bug', 'error', 'broken', 'issue', 'problem', 'fix'],
            'feature': ['feature', 'enhancement', 'implement', 'add', 'new'],
            'documentation': ['doc', 'readme', 'documentation', 'comment']
        }
        
        for tag, keywords in tech_keywords.items():
            if any(keyword in content for keyword in keywords):
                tags.append(tag)
        
        return tags
    
    def _identify_components(self, title: str, body: str) -> list:
        """Identify affected components from issue content"""
        content = f"{title} {body}".lower()
        
        components = []
        
        component_keywords = {
            'authentication': ['auth', 'login', 'signup', 'password', 'token'],
            'database': ['mongodb', 'database', 'collection', 'query', 'schema'],
            'api': ['api', 'endpoint', 'route', 'request', 'response'],
            'frontend': ['ui', 'interface', 'component', 'react', 'css', 'html'],
            'chat': ['chat', 'message', 'conversation', 'ai', 'llm'],
            'spotify': ['spotify', 'music', 'playlist', 'recommendation'],
            'deployment': ['deploy', 'docker', 'nginx', 'ssl', 'production']
        }
        
        for component, keywords in component_keywords.items():
            if any(keyword in content for keyword in keywords):
                components.append(component)
        
        return components
    
    def _identify_technologies(self, title: str, body: str) -> list:
        """Identify technologies mentioned in issue"""
        content = f"{title} {body}".lower()
        
        technologies = []
        
        tech_list = [
            'javascript', 'node.js', 'express', 'react', 'mongodb', 'redis',
            'docker', 'nginx', 'python', 'css', 'html', 'jwt', 'oauth',
            'bcrypt', 'openai', 'gemini', 'perplexity'
        ]
        
        for tech in tech_list:
            if tech in content:
                technologies.append(tech)
        
        return technologies
    
    def generate_comment_text(self, analysis_result: Dict[str, Any]) -> str:
        """Generate GitHub comment text from analysis result"""
        metadata = analysis_result.get('metadata', {})
        analysis = analysis_result.get('analysis', {})
        budget_status = analysis_result.get('budget_status', {})
        
        # Status indicators
        cache_indicator = "💾 Cached" if metadata.get('cache_hit') else "🔍 Fresh Analysis"
        model_indicator = f"🤖 {metadata.get('model_used', 'unknown')}"
        cost_indicator = f"💰 ${metadata.get('cost_estimate', 0):.4f}"
        complexity_indicator = f"📊 Complexity: {metadata.get('complexity_score', 'unknown')}/10"
        
        comment = f"""## 🔍 AI Issue Analysis {cache_indicator}

**{analysis.get('summary', 'Analysis pending')}**

### 📋 Technical Analysis
{analysis.get('technical_analysis', 'Pending detailed analysis')}

### 🎯 Priority & Effort
- **Priority**: {analysis.get('priority', 'To be determined')}
- **Estimated Effort**: {analysis.get('effort_estimate', 'To be estimated')}

### 🛠️ Implementation Approach
{analysis.get('implementation_approach', 'Implementation approach to be determined')}

### ⚠️ Risks & Considerations
{analysis.get('risks_considerations', 'Risk assessment pending')}

### 🧩 Related Components
{analysis.get('related_components', 'Component analysis pending')}

```json
{{
  "issue_number": {analysis_result.get('issue_number', 'null')},
  "priority": "{analysis.get('priority', 'unknown')}",
  "effort_estimate": "{analysis.get('effort_estimate', 'unknown')}",
  "complexity_score": {metadata.get('complexity_score', 'null')},
  "tags": {analysis_result.get('structured_data', {}).get('tags', [])},
  "components_affected": {analysis_result.get('structured_data', {}).get('components_affected', [])},
  "technology_stack": {analysis_result.get('structured_data', {}).get('technology_stack', [])},
  "analysis_timestamp": "{analysis_result.get('analysis_timestamp', '')}"
}}
```

---
**Analysis Metadata:**
{model_indicator} • {complexity_indicator} • {cost_indicator}

**Budget Status:** {budget_status.get('status', 'Unknown')} 
(${budget_status.get('total_cost', 0):.2f} / ${budget_status.get('weekly_budget', 3):.2f} used this week)"""

        return comment


def main():
    parser = argparse.ArgumentParser(description='Unified Issue Analyzer with Perplexity Integration')
    parser.add_argument('--issue', type=int, help='GitHub issue number to analyze')
    parser.add_argument('--title', help='Issue title (for manual analysis)')
    parser.add_argument('--body', help='Issue body (for manual analysis)')
    parser.add_argument('--dry-run', action='store_true', help='Run in dry-run mode (no API calls)')
    parser.add_argument('--output-comment', action='store_true', help='Generate GitHub comment format')
    parser.add_argument('--output-file', help='Save analysis to JSON file')
    
    args = parser.parse_args()
    
    if not args.issue and not (args.title and args.body):
        print("Error: Must specify either --issue NUMBER or both --title and --body")
        sys.exit(1)
    
    try:
        # Initialize analyzer
        analyzer = IssueAnalyzer()
        
        # Perform analysis
        if args.issue:
            result = analyzer.analyze_issue_from_github(args.issue, dry_run=args.dry_run)
        else:
            result = analyzer.analyze_issue(args.title, args.body, dry_run=args.dry_run)
        
        # Output results
        if args.output_comment:
            comment_text = analyzer.generate_comment_text(result)
            print("\n" + "="*60)
            print("GITHUB COMMENT FORMAT:")
            print("="*60)
            print(comment_text)
        else:
            print(json.dumps(result, indent=2, default=str))
        
        # Save to file if requested
        if args.output_file:
            with open(args.output_file, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            print(f"\nAnalysis saved to: {args.output_file}")
        
        # Exit with appropriate code
        sys.exit(0 if result.get('success') else 1)
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()