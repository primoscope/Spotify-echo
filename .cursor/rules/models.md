# Model Switching Guide

Routing
- Fast tasks: Llama 3.1 8B or GPT-4-mini
- Balanced coding/reasoning: GPT-4
- Long context/nuanced reasoning: Claude 3.7
- Research/current docs: Grok-4 equivalent via Perplexity `sonar-pro`

Heuristics
- If prompt mentions @web or external docs: use Perplexity
- If multi-file refactor or architecture: GPT-4 or Claude 3.7
- If latency < 2s needed: Llama 3.1 8B

Cost Awareness
- Prefer small models by default; escalate only when needed. Keep tokens concise and avoid large context dumps.