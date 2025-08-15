# Performance Budget Rules

## Latency Budgets
- **Perplexity Research**: p95 ≤ 1500ms
- **Local MCP Services**: p95 ≤ 500ms  
- **Global System**: p95 ≤ 2000ms
- **Spotify API**: Handle 429 rate limits gracefully

## Memory Budgets
- **Perplexity Server**: ≤ 256MB
- **Local Services**: ≤ 128MB each
- **Frontend**: ≤ 100MB initial bundle
- **ML Models**: Use streaming/chunking for large datasets

## Cost Controls
- **Perplexity**: $0.50 USD per research session
- **OpenAI**: Monitor token usage, use caching
- **Spotify API**: Respect free tier limits
- **Infrastructure**: DigitalOcean $20/month budget

## Monitoring Requirements
- **Real-time Metrics**: Track all performance budgets
- **Alerting**: Slack notifications for budget violations
- **Baseline Comparison**: Regression detection vs baselines
- **Regular Reviews**: Weekly performance budget reviews