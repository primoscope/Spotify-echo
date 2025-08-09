# MongoDB Insights and Admin Tools Documentation

## Overview

The MongoDB Insights and Admin Tools provide comprehensive database monitoring, analysis, and administration capabilities for EchoTune AI. These tools focus on **read-only, safe operations** with automated insights and recommendations for optimal database performance.

## 🎯 Key Features

### 📊 Database Insights
- **Collection Statistics**: Real-time metrics on document counts, sizes, and storage
- **Performance Monitoring**: Query execution times, connection metrics, and resource usage
- **Index Health Analysis**: Automated detection of unused, missing, or inefficient indexes
- **Slow Query Detection**: Identify and analyze performance bottlenecks

### 🛡️ Safety Features
- **Read-Only Operations**: All admin tools are designed for safe, non-destructive analysis
- **Data Sanitization**: Automatic removal of sensitive fields during exports
- **Rate Limiting**: Built-in protection against excessive operations
- **Permission Validation**: Comprehensive access level checking

### 📤 Export Tools
- **Safe Data Export**: Batch export with configurable limits and sanitization
- **Multiple Formats**: JSON and CSV export capabilities  
- **Metadata Analysis**: Preview document structures before export
- **Batch Processing**: Efficient handling of large datasets

## 🚀 Quick Start

### Access the Admin Dashboard

1. **Start the EchoTune AI server**:
   ```bash
   npm start
   ```

2. **Navigate to the admin dashboard**:
   ```
   http://localhost:3000/admin.html
   ```

3. **Verify MongoDB connection**: The dashboard will automatically check your MongoDB connection status.

### API Endpoints

All admin endpoints are prefixed with `/api/admin/`:

```javascript
// Get comprehensive dashboard data
GET /api/admin/dashboard

// Collection statistics  
GET /api/admin/collections

// Index health analysis
GET /api/admin/indexes

// Slow query analysis
GET /api/admin/slow-queries?threshold=100&limit=50

// Database performance stats
GET /api/admin/stats

// Export collection data
POST /api/admin/collections/{name}/export
```

## 📋 Usage Guide

### Dashboard Overview

The main dashboard provides four key sections:

#### 1. **Overview Tab**
- Database connection status
- High-level metrics (collections, documents, data size)
- Performance indicators
- Index health summary

#### 2. **Collections Tab** 
- Detailed collection statistics
- Document counts and sizes
- Index information per collection
- Health status indicators

#### 3. **Performance Tab**
- Query performance analysis
- Connection metrics
- Memory usage statistics
- Operations per second

#### 4. **Recommendations Tab**
- Automated optimization suggestions
- Index recommendations
- Performance improvement tips
- Categorized by priority (Critical, Important, Suggestions)

#### 5. **Export Tools Tab**
- Safe data export utilities
- Collection preview capabilities
- Format selection (JSON/CSV)
- Batch size configuration

### Collection Statistics

Get comprehensive stats for all collections:

```bash
curl http://localhost:3000/api/admin/collections
```

**Response includes**:
- Document counts
- Data and storage sizes
- Average document size
- Index information
- Collection health status

### Index Health Analysis

Analyze index usage and performance:

```bash
curl http://localhost:3000/api/admin/indexes
```

**Analysis provides**:
- Unused index detection
- Missing index recommendations
- Index usage statistics
- Performance impact assessment

### Slow Query Detection

Identify performance bottlenecks:

```bash
curl "http://localhost:3000/api/admin/slow-queries?threshold=100&limit=20"
```

**Parameters**:
- `threshold`: Minimum execution time in milliseconds (default: 100)
- `limit`: Maximum number of queries to return (default: 50)

**Note**: Requires MongoDB profiling to be enabled for comprehensive analysis.

### Safe Data Export

Export collection data with built-in safety measures:

```bash
curl -X POST http://localhost:3000/api/admin/collections/echotune_users/export \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 1000,
    "format": "json",
    "sanitize": true,
    "query": {"createdAt": {"$gte": "2024-01-01"}}
  }'
```

**Export Options**:
- `limit`: Maximum documents (up to 10,000 for safety)
- `skip`: Number of documents to skip
- `query`: MongoDB query filter
- `projection`: Field selection
- `format`: Output format ("json" or "csv")
- `sanitize`: Remove sensitive data (default: true)

## 🔧 Configuration

### Environment Variables

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/echotune
MONGODB_DB_NAME=echotune
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5

# Admin Tools Configuration  
ADMIN_TOOLS_ENABLED=true
ADMIN_MAX_EXPORT_SIZE=10000
ADMIN_RATE_LIMIT=100
```

### Collection Naming Convention

The system expects collections to follow the pattern:
- `echotune_users` - User account information
- `echotune_listening_history` - User music listening data
- `echotune_recommendations` - Generated recommendations
- `echotune_playlists` - Playlist information
- `echotune_analytics_events` - Analytics and telemetry
- `echotune_chat_sessions` - Chat conversation data

### Recommended Indexes

The system automatically checks for these recommended indexes:

**Users Collection**:
```javascript
db.echotune_users.createIndex({ spotifyId: 1 }, { unique: true })
db.echotune_users.createIndex({ email: 1 }, { unique: true })
db.echotune_users.createIndex({ lastActive: 1 })
```

**Listening History Collection**:
```javascript
db.echotune_listening_history.createIndex({ userId: 1, playedAt: -1 })
db.echotune_listening_history.createIndex({ trackId: 1 })
db.echotune_listening_history.createIndex({ playedAt: -1 })
```

**Recommendations Collection**:
```javascript
db.echotune_recommendations.createIndex({ userId: 1, score: -1 })
db.echotune_recommendations.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 })
```

## 📈 Monitoring Strategy

### Automated Health Checks

The system performs automatic health monitoring:

1. **Connection Monitoring**: Every 2 minutes
2. **Performance Tracking**: Continuous query timing
3. **Index Usage Analysis**: Weekly automated reports
4. **Slow Query Detection**: Real-time alerting (when profiling enabled)

### Key Metrics to Monitor

- **Document Growth Rate**: Track collection size trends
- **Index Hit Ratio**: Ensure queries are using indexes effectively
- **Average Query Time**: Monitor for performance degradation
- **Connection Pool Usage**: Avoid connection exhaustion
- **Storage Growth**: Plan for capacity needs

### Performance Optimization

#### Query Optimization
1. **Use Compound Indexes**: For multi-field queries
2. **Limit Result Sets**: Always use `.limit()` for large collections
3. **Project Only Needed Fields**: Reduce network overhead
4. **Use Aggregation Pipelines**: For complex data processing

#### Index Optimization
1. **Monitor Index Usage**: Remove unused indexes
2. **Create Selective Indexes**: Use sparse indexes when appropriate
3. **Consider Index Order**: Most selective fields first in compound indexes
4. **Regular Index Maintenance**: Rebuild fragmented indexes

## 🛡️ Security Considerations

### Access Control

- **Read-Only Operations**: Admin tools perform no write operations
- **Data Sanitization**: Sensitive fields automatically removed from exports
- **Rate Limiting**: Prevents API abuse and resource exhaustion
- **Authentication**: Ensure proper access controls in production

### Data Privacy

- **Automatic Sanitization**: Removes passwords, tokens, emails, etc.
- **Configurable Export Limits**: Maximum 10,000 documents per export
- **Audit Logging**: All admin operations are logged
- **IP Restriction**: Consider restricting admin access by IP

### Production Deployment

```bash
# Recommended production environment variables
NODE_ENV=production
ADMIN_TOOLS_ENABLED=true
ADMIN_RATE_LIMIT=50
ADMIN_MAX_EXPORT_SIZE=5000

# MongoDB security
MONGODB_URI=mongodb+srv://admin:secure_password@cluster.mongodb.net/echotune?authSource=admin
MONGODB_SSL=true
MONGODB_REPLICA_SET=cluster-shard-0
```

## 🔍 Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check connection string
echo $MONGODB_URI

# Test connection
npm run validate:mongodb
```

#### Slow Query Analysis Unavailable
```bash
# Enable profiling (temporarily)
mongo your-database --eval "db.setProfilingLevel(1, { slowms: 100 })"

# Check profiling status
mongo your-database --eval "db.getProfilingStatus()"
```

#### Export Fails with Large Collections
```bash
# Use smaller batch sizes
curl -X POST /api/admin/collections/large_collection/export \
  -d '{"limit": 1000, "skip": 0}'

# Use query filters to reduce dataset
curl -X POST /api/admin/collections/large_collection/export \
  -d '{"query": {"createdAt": {"$gte": "2024-01-01"}}, "limit": 5000}'
```

### Performance Issues

1. **Dashboard Loading Slowly**:
   - Check MongoDB connection latency
   - Verify index usage on large collections
   - Consider increasing connection pool size

2. **High Memory Usage**:
   - Reduce export batch sizes
   - Use projection to limit returned fields
   - Monitor aggregation pipeline efficiency

3. **Connection Pool Exhaustion**:
   - Increase `MONGODB_MAX_POOL_SIZE`
   - Check for connection leaks
   - Monitor concurrent request patterns

## 📊 API Reference

### Dashboard Endpoint

**GET `/api/admin/dashboard`**

Returns comprehensive dashboard data including:
- Database overview metrics
- Collection summaries  
- Index health analysis
- Performance statistics
- System recommendations

### Collections Endpoint

**GET `/api/admin/collections`**

Returns detailed statistics for all collections:
- Document counts and sizes
- Index information
- Health status
- Storage utilization

### Export Endpoints

**GET `/api/admin/collections/{name}/export-info`**

Returns export metadata:
- Collection statistics
- Sample document structure
- Recommended batch sizes
- Available fields

**POST `/api/admin/collections/{name}/export`**

Exports collection data with safety measures:
- Configurable limits and filters
- Automatic data sanitization
- Multiple output formats
- Progress tracking for large exports

## 🎛️ Advanced Configuration

### Custom Index Recommendations

Add custom index recommendations in `mongodb-manager.js`:

```javascript
const customRecommendations = {
  'custom_collection': [
    { key: { customField: 1 }, reason: 'Custom business logic queries' },
    { key: { userId: 1, timestamp: -1 }, reason: 'User timeline queries' }
  ]
};
```

### Performance Tuning

```javascript
// Adjust MongoDB connection options
const mongoOptions = {
  maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  useUnifiedTopology: true
};
```

## 📝 Best Practices

### Database Design
1. **Use appropriate data types** for optimal storage and performance
2. **Implement TTL indexes** for temporary data (recommendations, sessions)
3. **Consider sharding** for horizontally scalable collections
4. **Use embedded documents** for data that's always accessed together

### Monitoring
1. **Set up automated alerts** for performance degradation
2. **Regular index maintenance** schedule
3. **Capacity planning** based on growth trends
4. **Backup verification** through export tools

### Development Workflow
1. **Test index changes** in development environment first
2. **Monitor impact** of schema changes on performance
3. **Use admin tools** for data validation during migrations
4. **Document custom indexes** and their business justification

## 🤝 Contributing

To extend the admin tools:

1. **Add new analysis functions** to `mongodb-manager.js`
2. **Create corresponding API endpoints** in `admin.js`
3. **Update dashboard UI** in `admin.html`
4. **Add comprehensive tests** for new functionality
5. **Update documentation** with new features

---

## 📞 Support

For issues or questions regarding the MongoDB admin tools:

1. Check the troubleshooting section above
2. Review MongoDB logs for connection issues
3. Verify environment variable configuration
4. Test with smaller datasets first

The admin tools are designed to be safe and non-destructive, making them ideal for production monitoring and analysis.