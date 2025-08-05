# Production Optimization Guide

Comprehensive guide for optimizing EchoTune AI for production environments.

## 🚀 Performance Optimization

### Frontend Optimization
```bash
# Build with production optimizations
npm run build

# Analyze bundle size
npm run build -- --analyze

# Enable gzip compression in nginx
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

### Backend Optimization
```javascript
// Enable compression middleware
app.use(compression());

// Configure caching
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Database connection pooling
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});
```

### CDN Configuration
```nginx
# Static asset caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🛡️ Security Hardening

### Environment Configuration
```env
# Production security settings
NODE_ENV=production
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://your-domain.com
```

### Security Headers
```javascript
// Configure Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://sdk.scdn.co"],
      connectSrc: ["'self'", "https://api.spotify.com"]
    }
  }
}));
```

### Rate Limiting
```javascript
// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

## 📊 Monitoring Setup

### Health Checks
```bash
# Application health endpoint
curl https://your-domain.com/health

# Expected response time: <50ms
# Expected uptime: >99.9%
```

### Logging Configuration
```javascript
// Production logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Metrics Collection
```javascript
// Application metrics
const prometheus = require('prom-client');
const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

## 🗄️ Database Optimization

### MongoDB Configuration
```javascript
// Optimized MongoDB connection
const options = {
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4
};
```

### Indexing Strategy
```javascript
// Create performance indexes
db.listening_history.createIndex({ user_id: 1, timestamp: -1 });
db.recommendations.createIndex({ user_id: 1, score: -1 });
db.user_sessions.createIndex({ session_id: 1 }, { expireAfterSeconds: 3600 });
```

### Data Archiving
```bash
# Archive old data
mongodump --db echotune --query '{"timestamp": {"$lt": ISODate("2024-01-01")}}'
mongo echotune --eval 'db.old_data.deleteMany({"timestamp": {"$lt": ISODate("2024-01-01")}})'
```

## 🐳 Docker Optimization

### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

### Resource Limits
```yaml
# docker-compose.yml
services:
  echotune-ai:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    restart: unless-stopped
```

## ☁️ Cloud Optimization

### DigitalOcean App Platform
```yaml
# Optimized app spec
name: echotune-ai
region: nyc1
services:
- name: web
  instance_count: 1
  instance_size_slug: basic-s  # 2GB RAM, 1 vCPU
  health_check:
    http_path: /health
  autoscaling:
    min_instance_count: 1
    max_instance_count: 3
    metrics:
    - type: cpu
      target: 70
```

### CDN Configuration
```yaml
# Enable CDN for static assets
static_sites:
- name: echotune-static
  source_dir: dist
  index_document: index.html
  environment_slug: html
  routes:
  - path: /static
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to DigitalOcean
      uses: digitalocean/app_action@main
      with:
        app_name: echotune-ai
        token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
```

### Automated Testing
```yaml
# Test pipeline
- name: Run security audit
  run: npm audit --audit-level high
  
- name: Run linting
  run: npm run lint
  
- name: Run unit tests
  run: npm run test:unit
  
- name: Run integration tests
  run: npm run test:integration
```

## 📈 Scaling Strategies

### Horizontal Scaling
```yaml
# Load balancer configuration
services:
  echotune-ai:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### Caching Strategy
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
const cacheRecommendations = async (userId, recommendations) => {
  await client.setex(`recs:${userId}`, 3600, JSON.stringify(recommendations));
};
```

### Database Sharding
```javascript
// Database connection routing
const getDatabase = (userId) => {
  const shard = userId.slice(-1);
  return shard < '5' ? mongoClient1 : mongoClient2;
};
```

## 🔧 Maintenance Procedures

### Automated Backups
```bash
#!/bin/bash
# backup-script.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db echotune --out backup_$DATE
tar -czf backup_$DATE.tar.gz backup_$DATE/
aws s3 cp backup_$DATE.tar.gz s3://echotune-backups/
```

### Health Monitoring
```bash
# Health check script
#!/bin/bash
HEALTH_URL="https://your-domain.com/health"
if ! curl -f $HEALTH_URL > /dev/null 2>&1; then
  echo "Health check failed" | mail -s "EchoTune Alert" admin@your-domain.com
fi
```

### Log Rotation
```bash
# logrotate configuration
/opt/echotune/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 echotune echotune
}
```

## ⚡ Performance Benchmarks

### Target Metrics
- **Response Time**: <100ms for API endpoints
- **Time to First Byte**: <200ms
- **Page Load Time**: <2 seconds
- **Availability**: >99.9% uptime
- **Throughput**: 1000+ requests/second

### Load Testing
```bash
# Apache Bench testing
ab -n 1000 -c 10 https://your-domain.com/api/health

# Artillery.io testing
npm install -g artillery
artillery quick --count 10 --num 100 https://your-domain.com/
```

## 🛠️ Troubleshooting

### Performance Issues
```bash
# Check memory usage
free -h
htop

# Check disk usage
df -h
iotop

# Check network
netstat -i
iftop
```

### Application Debugging
```bash
# Check application logs
tail -f /var/log/echotune/app.log

# Check error logs
grep ERROR /var/log/echotune/app.log

# Monitor real-time performance
curl https://your-domain.com/api/performance
```

## 📚 Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [nginx Performance Tuning](https://nginx.org/en/docs/http/ngx_http_core_module.html)