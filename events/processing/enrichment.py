"""
Event Enrichment Pipeline

Enriches raw feedback events with contextual information like session_id, 
device_type, and locale. Implements DLQ handling and retry mechanisms.

Part of FBK workstream - Phase 2.1 Foundation
"""

import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from enum import Enum

# Configure structured logging
logger = logging.getLogger(__name__)


class EventType(Enum):
    PLAY = "play"
    SKIP = "skip" 
    LIKE = "like"
    DISLIKE = "dislike"
    PAUSE = "pause"
    RESUME = "resume"


@dataclass
class RawEvent:
    """Raw event before enrichment"""
    user_id: str
    item_id: str
    event_type: str
    timestamp: str
    raw_data: Dict[str, Any]


@dataclass 
class EnrichedEvent:
    """Enriched event with contextual data"""
    user_id: str
    item_id: str
    event_type: str
    timestamp: str
    session_id: str
    device_type: str
    locale: str
    context: Dict[str, Any]
    schema_version: int = 2
    enriched_at: str = None
    
    def __post_init__(self):
        if self.enriched_at is None:
            self.enriched_at = datetime.now(timezone.utc).isoformat()


class EnrichmentEngine:
    """Core event enrichment processing engine"""
    
    def __init__(self, session_store=None, device_detector=None, locale_resolver=None):
        self.session_store = session_store or MockSessionStore()
        self.device_detector = device_detector or MockDeviceDetector()
        self.locale_resolver = locale_resolver or MockLocaleResolver()
        self.metrics = EnrichmentMetrics()
        
    def enrich_event(self, raw_event: RawEvent) -> Optional[EnrichedEvent]:
        """
        Enrich a raw event with contextual information
        
        Returns None if enrichment fails and event should go to DLQ
        """
        start_time = time.time()
        
        try:
            # Validate event structure
            if not self._validate_event(raw_event):
                self.metrics.increment('feedback.enrich.validation_fail')
                logger.warning(f"Event validation failed: {raw_event.user_id}")
                return None
                
            # Extract session context
            session_id = self._get_session_id(raw_event)
            if not session_id:
                self.metrics.increment('feedback.enrich.session_fail')
                logger.warning(f"Session extraction failed: {raw_event.user_id}")
                return None
                
            # Detect device type
            device_type = self._detect_device_type(raw_event)
            
            # Resolve locale
            locale = self._resolve_locale(raw_event)
            
            # Build additional context
            context = self._build_context(raw_event)
            
            enriched = EnrichedEvent(
                user_id=raw_event.user_id,
                item_id=raw_event.item_id,
                event_type=raw_event.event_type,
                timestamp=raw_event.timestamp,
                session_id=session_id,
                device_type=device_type,
                locale=locale,
                context=context
            )
            
            duration_ms = (time.time() - start_time) * 1000
            self.metrics.record_histogram('feedback.enrich.duration_ms', duration_ms)
            self.metrics.increment('feedback.enriched.count')
            
            logger.info(f"Event enriched successfully", extra={
                'user_id': raw_event.user_id,
                'event_type': raw_event.event_type,
                'duration_ms': duration_ms
            })
            
            return enriched
            
        except Exception as e:
            self.metrics.increment('feedback.enrich.error')
            logger.error(f"Enrichment error: {e}", extra={
                'user_id': raw_event.user_id,
                'error': str(e)
            })
            return None
    
    def _validate_event(self, event: RawEvent) -> bool:
        """Validate event structure and required fields"""
        if not event.user_id or not event.item_id or not event.event_type:
            return False
            
        if event.event_type not in [e.value for e in EventType]:
            return False
            
        try:
            datetime.fromisoformat(event.timestamp.replace('Z', '+00:00'))
        except ValueError:
            return False
            
        return True
    
    def _get_session_id(self, event: RawEvent) -> Optional[str]:
        """Extract or generate session ID"""
        # Try to get from raw data first
        if 'session_id' in event.raw_data:
            return event.raw_data['session_id']
            
        # Fallback to session store lookup
        return self.session_store.get_session_id(event.user_id)
    
    def _detect_device_type(self, event: RawEvent) -> str:
        """Detect device type from event context"""
        user_agent = event.raw_data.get('user_agent', '')
        return self.device_detector.detect(user_agent)
    
    def _resolve_locale(self, event: RawEvent) -> str:
        """Resolve user locale"""
        # Check event data first
        if 'locale' in event.raw_data:
            return event.raw_data['locale']
            
        # Fallback to user profile
        return self.locale_resolver.resolve(event.user_id)
    
    def _build_context(self, event: RawEvent) -> Dict[str, Any]:
        """Build additional context information"""
        context = {}
        
        # Extract referrer information
        if 'referrer' in event.raw_data:
            context['referrer'] = event.raw_data['referrer']
            
        # Extract playlist context
        if 'playlist_id' in event.raw_data:
            context['playlist_id'] = event.raw_data['playlist_id']
            
        # Extract recommendation context
        if 'recommendation_id' in event.raw_data:
            context['recommendation_id'] = event.raw_data['recommendation_id']
            
        return context


class DeadLetterQueue:
    """Dead Letter Queue for failed events with retry mechanism"""
    
    def __init__(self, storage_backend=None, max_retries=3):
        self.storage_backend = storage_backend or MockDLQStorage()
        self.max_retries = max_retries
        self.metrics = EnrichmentMetrics()
        
    def enqueue(self, event: RawEvent, error_reason: str):
        """Add failed event to DLQ"""
        dlq_entry = {
            'event': asdict(event),
            'error_reason': error_reason,
            'retry_count': 0,
            'enqueued_at': datetime.now(timezone.utc).isoformat(),
            'next_retry_at': self._calculate_next_retry(0)
        }
        
        self.storage_backend.store(dlq_entry)
        self.metrics.increment('feedback.dlq.count')
        
        logger.warning(f"Event added to DLQ", extra={
            'user_id': event.user_id,
            'error_reason': error_reason
        })
    
    def retry_failed_events(self, enrichment_engine: EnrichmentEngine) -> int:
        """Process DLQ events ready for retry"""
        retry_count = 0
        
        for dlq_entry in self.storage_backend.get_retryable_events():
            raw_event = RawEvent(**dlq_entry['event'])
            
            enriched = enrichment_engine.enrich_event(raw_event)
            if enriched:
                # Success - remove from DLQ
                self.storage_backend.remove(dlq_entry['id'])
                self.metrics.increment('feedback.retry.success.count')
                retry_count += 1
                
                logger.info(f"DLQ retry successful", extra={
                    'user_id': raw_event.user_id,
                    'retry_count': dlq_entry['retry_count']
                })
            else:
                # Still failing - update retry count
                dlq_entry['retry_count'] += 1
                
                if dlq_entry['retry_count'] >= self.max_retries:
                    # Max retries exceeded - move to permanent failure
                    self.storage_backend.mark_failed(dlq_entry['id'])
                    self.metrics.increment('feedback.retry.max_exceeded')
                    
                    logger.error(f"DLQ max retries exceeded", extra={
                        'user_id': raw_event.user_id,
                        'retry_count': dlq_entry['retry_count']
                    })
                else:
                    # Schedule next retry
                    dlq_entry['next_retry_at'] = self._calculate_next_retry(
                        dlq_entry['retry_count']
                    )
                    self.storage_backend.update(dlq_entry)
                    self.metrics.increment('feedback.retry.scheduled')
        
        return retry_count
    
    def _calculate_next_retry(self, retry_count: int) -> str:
        """Calculate next retry time with exponential backoff"""
        backoff_seconds = 2 ** retry_count * 60  # 1min, 2min, 4min, etc
        next_retry = datetime.now(timezone.utc).timestamp() + backoff_seconds
        return datetime.fromtimestamp(next_retry, timezone.utc).isoformat()


class EnrichmentMetrics:
    """Metrics collection for enrichment pipeline"""
    
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


# Mock implementations for testing/development
class MockSessionStore:
    def get_session_id(self, user_id: str) -> Optional[str]:
        return f"session_{user_id}_{int(time.time() // 1800)}"  # 30min sessions


class MockDeviceDetector:
    def detect(self, user_agent: str) -> str:
        if 'Mobile' in user_agent:
            return 'mobile'
        elif 'Tablet' in user_agent:
            return 'tablet'
        else:
            return 'web'


class MockLocaleResolver:
    def resolve(self, user_id: str) -> str:
        return 'en-US'  # Default locale


class MockDLQStorage:
    def __init__(self):
        self.entries = {}
        self.counter = 0
    
    def store(self, entry: Dict[str, Any]):
        self.counter += 1
        entry['id'] = self.counter
        self.entries[self.counter] = entry
    
    def get_retryable_events(self) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        return [
            entry for entry in self.entries.values()
            if entry.get('next_retry_at', '') <= now and entry.get('status') != 'failed'
        ]
    
    def remove(self, entry_id: int):
        self.entries.pop(entry_id, None)
    
    def mark_failed(self, entry_id: int):
        if entry_id in self.entries:
            self.entries[entry_id]['status'] = 'failed'
    
    def update(self, entry: Dict[str, Any]):
        self.entries[entry['id']] = entry


# Feature flag check
def is_enrichment_enabled() -> bool:
    """Check if event enrichment is enabled via feature flag"""
    import os
    return os.getenv('ENABLE_FEEDBACK_EVENTS', 'false').lower() == 'true'


if __name__ == "__main__":
    # Example usage
    engine = EnrichmentEngine()
    dlq = DeadLetterQueue()
    
    # Sample raw event
    raw_event = RawEvent(
        user_id="user123",
        item_id="track456", 
        event_type="play",
        timestamp=datetime.now(timezone.utc).isoformat(),
        raw_data={
            'user_agent': 'Mozilla/5.0 Mobile',
            'referrer': 'https://open.spotify.com',
            'locale': 'en-US'
        }
    )
    
    # Enrich event
    enriched = engine.enrich_event(raw_event)
    if enriched:
        print("Event enriched successfully:")
        print(json.dumps(asdict(enriched), indent=2))
    else:
        print("Enrichment failed - event added to DLQ")
        dlq.enqueue(raw_event, "Enrichment failed")
    
    # Show metrics
    print("\nMetrics:")
    print(json.dumps(engine.metrics.get_metrics(), indent=2))