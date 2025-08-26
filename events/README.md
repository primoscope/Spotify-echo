# Event Ingestion System

This directory contains the event feedback ingestion system for capturing user interactions and behavioral data.

## Structure

- `gateway/` - Event ingestion gateway (HTTP/WebSocket endpoints)
- `processing/` - Real-time event processing and enrichment
- `storage/` - Event storage and queuing systems
- `validation/` - Schema validation and data quality checks
- `dlq/` - Dead letter queue handling and replay

## Implementation Status

🚧 **Phase 2 Scaffolding** - Directory structure and placeholders created

### Planned Components

#### Event Gateway
- High-throughput HTTP endpoints
- WebSocket real-time connections
- Rate limiting and authentication
- Request validation and sanitization

#### Event Processing
- Real-time event enrichment
- User context augmentation
- Feature extraction pipeline
- Analytics aggregation

#### Message Queue
- Redis Streams for buffering
- Event replay capabilities
- Dead letter queue handling
- Backpressure management

## Event Types

### User Interactions
```json
{
  "user_interaction": {
    "user_id": "string",
    "session_id": "string",
    "track_id": "string", 
    "action": "play|pause|skip|like|dislike",
    "timestamp": "ISO8601"
  }
}
```

### Feedback Events
```json
{
  "feedback_event": {
    "user_id": "string",
    "recommendation_id": "string",
    "feedback_type": "explicit|implicit",
    "rating": "number",
    "timestamp": "ISO8601"
  }
}
```

## Feature Flags

All components are controlled by feature flags:
- `ENABLE_FEEDBACK_EVENTS`: Enable feedback event ingestion
- `ENABLE_REALTIME_PROCESSING`: Enable real-time event processing
- `ENABLE_EVENT_ENRICHMENT`: Enable event enrichment pipeline
- `ENABLE_DLQ_HANDLING`: Enable dead letter queue processing

## Next Steps

1. Implement event gateway with HTTP endpoints
2. Set up Redis Streams for event buffering
3. Create event processor with enrichment
4. Add dead letter queue implementation
5. Integrate with feature store

---
**Status**: Placeholder - Implementation planned for Phase 2.2