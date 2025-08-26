/**
 * Enterprise Event Bus Service
 * 
 * Provides asynchronous service-to-service communication with event routing,
 * message persistence, delivery guarantees, and distributed event patterns
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.setMaxListeners(0); // Remove listener limit for enterprise use
    
    this.config = {
      enablePersistence: options.enablePersistence !== false,
      enableRetries: options.enableRetries !== false,
      maxRetries: options.maxRetries || 3,
      retryDelayMs: options.retryDelayMs || 1000,
      deadLetterQueue: options.deadLetterQueue !== false,
      enableMetrics: options.enableMetrics !== false,
      enableTracing: options.enableTracing !== false,
      eventTtlMs: options.eventTtlMs || 86400000, // 24 hours
      batchSize: options.batchSize || 100,
      enableOrdering: options.enableOrdering !== false,
      ...options
    };

    // Event storage and management
    this.eventStore = new Map(); // In-memory store (can be replaced with Redis/DB)
    this.subscriptions = new Map(); // Event subscriptions registry
    this.metrics = {
      eventsPublished: 0,
      eventsDelivered: 0,
      eventsFailed: 0,
      eventsRetried: 0,
      deadLettered: 0
    };
    
    // Dead letter queue for failed events
    this.deadLetterQueue = [];
    this.processingQueue = new Map(); // For ordered processing
    
    // Initialize cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // 5 minutes
    
    console.log('🚌 Event Bus initialized with enterprise capabilities');
  }

  /**
   * Publish an event to the bus
   */
  async publish(eventType, data, options = {}) {
    const event = this.createEvent(eventType, data, options);
    
    try {
      // Store event if persistence is enabled
      if (this.config.enablePersistence) {
        this.eventStore.set(event.id, event);
      }

      // Emit to local subscribers
      this.emit(eventType, event);
      
      // Handle ordered events
      if (options.ordered && options.partitionKey) {
        await this.processOrderedEvent(event, options.partitionKey);
      }

      this.metrics.eventsPublished++;
      
      console.log(`📤 Event published: ${eventType} [${event.id}]`);
      return event.id;
      
    } catch (error) {
      console.error(`❌ Failed to publish event ${eventType}:`, error);
      this.metrics.eventsFailed++;
      throw error;
    }
  }

  /**
   * Subscribe to events with advanced options
   */
  subscribe(eventType, handler, options = {}) {
    const subscription = {
      id: uuidv4(),
      eventType,
      handler,
      options: {
        retries: options.retries || this.config.maxRetries,
        priority: options.priority || 'normal',
        filter: options.filter,
        batchSize: options.batchSize || 1,
        ackTimeout: options.ackTimeout || 30000,
        deadLetterOnFailure: options.deadLetterOnFailure !== false,
        ...options
      },
      stats: {
        processed: 0,
        failed: 0,
        retries: 0
      }
    };

    // Store subscription
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType).push(subscription);

    // Register event listener with error handling
    const wrappedHandler = async (event) => {
      await this.processEventWithRetries(event, subscription);
    };

    this.on(eventType, wrappedHandler);
    
    console.log(`📝 Subscription registered: ${eventType} [${subscription.id}]`);
    return subscription.id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId) {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        console.log(`🗑️ Subscription removed: ${subscriptionId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Create a structured event object
   */
  createEvent(eventType, data, options = {}) {
    return {
      id: options.id || uuidv4(),
      type: eventType,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: options.source || 'echotune-ai',
        version: options.version || '1.0',
        correlationId: options.correlationId || uuidv4(),
        causationId: options.causationId,
        userId: options.userId,
        sessionId: options.sessionId,
        priority: options.priority || 'normal',
        ttl: options.ttl || this.config.eventTtlMs
      },
      retries: 0,
      maxRetries: options.maxRetries || this.config.maxRetries
    };
  }

  /**
   * Process event with retry logic
   */
  async processEventWithRetries(event, subscription) {
    const startTime = Date.now();
    
    try {
      // Apply filter if specified
      if (subscription.options.filter && !subscription.options.filter(event)) {
        return;
      }

      await subscription.handler(event);
      subscription.stats.processed++;
      this.metrics.eventsDelivered++;
      
      console.log(`✅ Event processed: ${event.type} [${event.id}] by ${subscription.id}`);
      
    } catch (error) {
      subscription.stats.failed++;
      this.metrics.eventsFailed++;
      
      console.error(`❌ Event processing failed: ${event.type} [${event.id}]:`, error);

      // Retry logic
      if (event.retries < event.maxRetries) {
        event.retries++;
        subscription.stats.retries++;
        this.metrics.eventsRetried++;
        
        const delay = this.calculateRetryDelay(event.retries);
        console.log(`🔄 Retrying event ${event.id} in ${delay}ms (attempt ${event.retries}/${event.maxRetries})`);
        
        setTimeout(() => {
          this.processEventWithRetries(event, subscription);
        }, delay);
        
      } else if (subscription.options.deadLetterOnFailure) {
        // Send to dead letter queue
        this.sendToDeadLetterQueue(event, subscription, error);
      }
    }
  }

  /**
   * Process ordered events by partition key
   */
  async processOrderedEvent(event, partitionKey) {
    if (!this.processingQueue.has(partitionKey)) {
      this.processingQueue.set(partitionKey, []);
    }
    
    this.processingQueue.get(partitionKey).push(event);
    
    // Process queue in order
    const queue = this.processingQueue.get(partitionKey);
    while (queue.length > 0) {
      const nextEvent = queue.shift();
      // Emit ordered event
      this.emit(`${nextEvent.type}:ordered`, nextEvent);
    }
  }

  /**
   * Send failed event to dead letter queue
   */
  sendToDeadLetterQueue(event, subscription, error) {
    const deadLetterEvent = {
      ...event,
      deadLetterReason: error.message,
      deadLetterTimestamp: new Date().toISOString(),
      subscriptionId: subscription.id,
      originalEventType: event.type
    };
    
    this.deadLetterQueue.push(deadLetterEvent);
    this.metrics.deadLettered++;
    
    console.log(`💀 Event sent to dead letter queue: ${event.id}`);
    this.emit('deadLetter', deadLetterEvent);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    return Math.min(this.config.retryDelayMs * Math.pow(2, attempt - 1), 30000);
  }

  /**
   * Get event bus metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      subscriptions: Array.from(this.subscriptions.entries()).map(([eventType, subs]) => ({
        eventType,
        subscriberCount: subs.length,
        totalProcessed: subs.reduce((sum, sub) => sum + sub.stats.processed, 0),
        totalFailed: subs.reduce((sum, sub) => sum + sub.stats.failed, 0),
        totalRetries: subs.reduce((sum, sub) => sum + sub.stats.retries, 0)
      })),
      deadLetterQueueSize: this.deadLetterQueue.length,
      eventStoreSize: this.eventStore.size,
      processingQueues: this.processingQueue.size
    };
  }

  /**
   * Get dead letter queue events
   */
  getDeadLetterQueue(limit = 100) {
    return this.deadLetterQueue.slice(0, limit);
  }

  /**
   * Replay events from store
   */
  async replayEvents(eventType, fromTimestamp, toTimestamp) {
    const events = Array.from(this.eventStore.values())
      .filter(event => {
        const eventTime = new Date(event.metadata.timestamp).getTime();
        return event.type === eventType &&
               eventTime >= fromTimestamp &&
               eventTime <= toTimestamp;
      })
      .sort((a, b) => new Date(a.metadata.timestamp) - new Date(b.metadata.timestamp));

    console.log(`🔄 Replaying ${events.length} events of type ${eventType}`);
    
    for (const event of events) {
      this.emit(eventType, event);
    }
    
    return events.length;
  }

  /**
   * Cleanup expired events
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, event] of this.eventStore.entries()) {
      const eventAge = now - new Date(event.metadata.timestamp).getTime();
      if (eventAge > event.metadata.ttl) {
        this.eventStore.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired events`);
    }
  }

  /**
   * Health check for the event bus
   */
  async healthCheck() {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      config: {
        persistence: this.config.enablePersistence,
        retries: this.config.enableRetries,
        maxRetries: this.config.maxRetries,
        deadLetterQueue: this.config.deadLetterQueue
      }
    };

    // Check for critical issues
    if (this.deadLetterQueue.length > 1000) {
      status.status = 'degraded';
      status.warnings = ['High dead letter queue size'];
    }

    if (this.metrics.eventsFailed > this.metrics.eventsDelivered * 0.1) {
      status.status = 'degraded';
      status.warnings = status.warnings || [];
      status.warnings.push('High failure rate');
    }

    return status;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Event Bus...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Wait for pending events to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.removeAllListeners();
    console.log('✅ Event Bus shutdown complete');
  }
}

// Singleton instance
let eventBusInstance = null;

/**
 * Get or create Event Bus instance
 */
function getEventBus(options = {}) {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(options);
  }
  return eventBusInstance;
}

module.exports = {
  EventBus,
  getEventBus
};