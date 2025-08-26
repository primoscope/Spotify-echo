"""
Event Gateway - HTTP/WebSocket endpoints for event ingestion

High-throughput event ingestion with rate limiting, validation, and authentication.
Part of FBK workstream - Phase 2.1 Foundation
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from dataclasses import asdict
import os

# Import enrichment engine
from ..processing.enrichment import EnrichmentEngine, DeadLetterQueue, RawEvent

logger = logging.getLogger(__name__)


class EventGateway:
    """HTTP event ingestion gateway with rate limiting and validation"""
    
    def __init__(self, enrichment_engine=None, dlq=None):
        self.enrichment_engine = enrichment_engine or EnrichmentEngine()
        self.dlq = dlq or DeadLetterQueue()
        self.rate_limiter = RateLimiter()
        self.metrics = GatewayMetrics()
        
    async def ingest_event(self, event_data: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main event ingestion endpoint
        
        Args:
            event_data: Raw event data from client
            request_context: HTTP request context (headers, IP, etc.)
            
        Returns:
            Response with status and metadata
        """
        start_time = time.time()
        request_id = request_context.get('request_id', self._generate_request_id())
        
        try:
            # Check feature flag
            if not self._is_ingestion_enabled():
                return self._error_response("Event ingestion disabled", 503, request_id)
            
            # Rate limiting check
            client_ip = request_context.get('client_ip', 'unknown')
            if not self.rate_limiter.allow_request(client_ip):
                self.metrics.increment('gateway.rate_limited')
                return self._error_response("Rate limit exceeded", 429, request_id)
            
            # Authentication check
            user_id = self._authenticate_request(request_context)
            if not user_id:
                self.metrics.increment('gateway.auth_failed')
                return self._error_response("Authentication failed", 401, request_id)
            
            # Validate event structure
            validation_result = self._validate_event_data(event_data)
            if not validation_result['valid']:
                self.metrics.increment('gateway.validation_failed')
                return self._error_response(
                    f"Validation failed: {validation_result['error']}", 
                    400, 
                    request_id
                )
            
            # Create raw event
            raw_event = RawEvent(
                user_id=user_id,
                item_id=event_data['item_id'],
                event_type=event_data['event_type'],
                timestamp=event_data.get('timestamp', datetime.now(timezone.utc).isoformat()),
                raw_data=self._extract_raw_data(event_data, request_context)
            )
            
            # Enrich event
            enriched_event = self.enrichment_engine.enrich_event(raw_event)
            
            if enriched_event:
                # Success - event enriched
                self.metrics.increment('gateway.events_processed')
                
                # TODO: Send to event stream/queue for downstream processing
                await self._publish_event(enriched_event)
                
                duration_ms = (time.time() - start_time) * 1000
                self.metrics.record_histogram('gateway.request_duration_ms', duration_ms)
                
                logger.info("Event processed successfully", extra={
                    'request_id': request_id,
                    'user_id': user_id,
                    'event_type': event_data['event_type'],
                    'duration_ms': duration_ms
                })
                
                return {
                    'status': 'success',
                    'request_id': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            else:
                # Enrichment failed - send to DLQ
                self.dlq.enqueue(raw_event, "Enrichment failed")
                self.metrics.increment('gateway.enrichment_failed')
                
                return {
                    'status': 'queued',
                    'message': 'Event queued for retry',
                    'request_id': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            self.metrics.increment('gateway.errors')
            logger.error(f"Gateway error: {e}", extra={
                'request_id': request_id,
                'error': str(e)
            })
            return self._error_response("Internal server error", 500, request_id)
    
    async def batch_ingest_events(self, events_data: List[Dict[str, Any]], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Batch event ingestion endpoint for high-throughput scenarios
        """
        start_time = time.time()
        request_id = request_context.get('request_id', self._generate_request_id())
        
        if len(events_data) > 100:  # Batch size limit
            return self._error_response("Batch size exceeds limit (100)", 400, request_id)
        
        results = {
            'processed': 0,
            'failed': 0,
            'queued': 0,
            'errors': []
        }
        
        for i, event_data in enumerate(events_data):
            try:
                result = await self.ingest_event(event_data, request_context)
                
                if result.get('status') == 'success':
                    results['processed'] += 1
                elif result.get('status') == 'queued':
                    results['queued'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append({
                        'index': i,
                        'error': result.get('message', 'Unknown error')
                    })
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'index': i,
                    'error': str(e)
                })
        
        duration_ms = (time.time() - start_time) * 1000
        self.metrics.record_histogram('gateway.batch_duration_ms', duration_ms)
        self.metrics.increment('gateway.batch_requests')
        
        return {
            'status': 'completed',
            'request_id': request_id,
            'results': results,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def _is_ingestion_enabled(self) -> bool:
        """Check if event ingestion is enabled via feature flag"""
        return os.getenv('ENABLE_FEEDBACK_EVENTS', 'false').lower() == 'true'
    
    def _authenticate_request(self, request_context: Dict[str, Any]) -> Optional[str]:
        """Extract and validate user authentication"""
        # Check for authorization header
        auth_header = request_context.get('headers', {}).get('authorization', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            # TODO: Implement proper token validation
            # For now, extract user_id from token payload (mock)
            try:
                # Mock token validation - in production would validate JWT
                if len(token) > 10:  # Basic validation
                    return f"user_{hash(token) % 10000}"
            except Exception:
                pass
        
        # Fallback to session-based auth
        session_id = request_context.get('headers', {}).get('x-session-id')
        if session_id:
            # TODO: Look up user from session store
            return f"user_session_{hash(session_id) % 10000}"
        
        return None
    
    def _validate_event_data(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate event data structure and types"""
        required_fields = ['item_id', 'event_type']
        
        for field in required_fields:
            if field not in event_data:
                return {'valid': False, 'error': f"Missing required field: {field}"}
        
        # Validate event type
        valid_event_types = ['play', 'skip', 'like', 'dislike', 'pause', 'resume']
        if event_data['event_type'] not in valid_event_types:
            return {'valid': False, 'error': f"Invalid event_type: {event_data['event_type']}"}
        
        # Validate item_id format
        if not isinstance(event_data['item_id'], str) or len(event_data['item_id']) < 3:
            return {'valid': False, 'error': "Invalid item_id format"}
        
        return {'valid': True}
    
    def _extract_raw_data(self, event_data: Dict[str, Any], request_context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract raw data for enrichment"""
        raw_data = {}
        
        # Include request headers that are useful for enrichment
        headers = request_context.get('headers', {})
        if 'user-agent' in headers:
            raw_data['user_agent'] = headers['user-agent']
        if 'referer' in headers:
            raw_data['referrer'] = headers['referer']
        if 'accept-language' in headers:
            raw_data['accept_language'] = headers['accept-language']
        
        # Include client context
        raw_data['client_ip'] = request_context.get('client_ip')
        
        # Include any additional event metadata
        for key, value in event_data.items():
            if key not in ['item_id', 'event_type', 'timestamp']:
                raw_data[key] = value
        
        return raw_data
    
    async def _publish_event(self, enriched_event) -> bool:
        """Publish enriched event to downstream systems"""
        try:
            # TODO: Implement actual event publishing to message queue/stream
            # For now, just log the event
            event_json = json.dumps(asdict(enriched_event))
            logger.info(f"Publishing event: {event_json}")
            
            # Simulate async publishing
            await asyncio.sleep(0.001)
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish event: {e}")
            return False
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        return f"req_{int(time.time() * 1000)}_{hash(time.time()) % 10000}"
    
    def _error_response(self, message: str, status_code: int, request_id: str) -> Dict[str, Any]:
        """Generate standardized error response"""
        return {
            'status': 'error',
            'message': message,
            'status_code': status_code,
            'request_id': request_id,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, requests_per_minute=60):
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # client_ip -> [timestamp, timestamp, ...]
        
    def allow_request(self, client_ip: str) -> bool:
        """Check if request is allowed under rate limit"""
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        if client_ip in self.requests:
            self.requests[client_ip] = [
                ts for ts in self.requests[client_ip] 
                if ts > minute_ago
            ]
        else:
            self.requests[client_ip] = []
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True


class GatewayMetrics:
    """Metrics collection for gateway"""
    
    def __init__(self):
        self.counters = {}
        self.histograms = {}
    
    def increment(self, metric_name: str, value: int = 1):
        """Increment a counter metric"""
        self.counters[metric_name] = self.counters.get(metric_name, 0) + value
    
    def record_histogram(self, metric_name: str, value: float):
        """Record a histogram value"""
        if metric_name not in self.histograms:
            self.histograms[metric_name] = []
        self.histograms[metric_name].append(value)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot"""
        return {
            'counters': self.counters.copy(),
            'histograms': {
                name: {
                    'count': len(values),
                    'avg': sum(values) / len(values) if values else 0,
                    'p95': self._percentile(values, 0.95) if values else 0
                }
                for name, values in self.histograms.items()
            }
        }
    
    def _percentile(self, values: List[float], p: float) -> float:
        """Calculate percentile of values"""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        k = (len(sorted_values) - 1) * p
        f = int(k)
        c = k - f
        if f == len(sorted_values) - 1:
            return sorted_values[f]
        return sorted_values[f] * (1 - c) + sorted_values[f + 1] * c


# FastAPI/Flask endpoint wrappers (example integration)
class FastAPIGateway:
    """FastAPI wrapper for event gateway"""
    
    def __init__(self):
        self.gateway = EventGateway()
    
    async def ingest_event_endpoint(self, event_data: dict, request) -> dict:
        """FastAPI endpoint wrapper"""
        request_context = {
            'request_id': request.headers.get('x-request-id'),
            'client_ip': request.client.host,
            'headers': dict(request.headers)
        }
        
        return await self.gateway.ingest_event(event_data, request_context)
    
    async def batch_ingest_endpoint(self, events_data: List[dict], request) -> dict:
        """FastAPI batch endpoint wrapper"""
        request_context = {
            'request_id': request.headers.get('x-request-id'),
            'client_ip': request.client.host,
            'headers': dict(request.headers)
        }
        
        return await self.gateway.batch_ingest_events(events_data, request_context)


if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def test_gateway():
        gateway = EventGateway()
        
        # Test single event
        event_data = {
            'item_id': 'track123',
            'event_type': 'play',
            'playlist_id': 'playlist456'
        }
        
        request_context = {
            'client_ip': '192.168.1.1',
            'headers': {
                'authorization': 'Bearer test_token_12345',
                'user-agent': 'Mozilla/5.0 Mobile',
                'referer': 'https://open.spotify.com'
            }
        }
        
        result = await gateway.ingest_event(event_data, request_context)
        print("Single event result:")
        print(json.dumps(result, indent=2))
        
        # Test batch events
        batch_events = [
            {'item_id': 'track123', 'event_type': 'play'},
            {'item_id': 'track124', 'event_type': 'skip'},
            {'item_id': 'track125', 'event_type': 'like'}
        ]
        
        batch_result = await gateway.batch_ingest_events(batch_events, request_context)
        print("\nBatch events result:")
        print(json.dumps(batch_result, indent=2))
        
        # Show metrics
        print("\nGateway metrics:")
        print(json.dumps(gateway.metrics.get_metrics(), indent=2))
    
    # Run test
    asyncio.run(test_gateway())