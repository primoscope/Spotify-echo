/**
 * Event Sourcing Infrastructure
 * 
 * Provides event-based state management, audit trails, and state reconstruction
 * capabilities for enterprise applications
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

class EventStore extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      enableSnapshots: options.enableSnapshots !== false,
      snapshotFrequency: options.snapshotFrequency || 100, // Every 100 events
      enableProjections: options.enableProjections !== false,
      enableReplication: options.enableReplication !== false,
      maxEventsInMemory: options.maxEventsInMemory || 10000,
      enableOptimisticConcurrency: options.enableOptimisticConcurrency !== false,
      ...options
    };

    // Event storage
    this.events = new Map(); // streamId -> events[]
    this.snapshots = new Map(); // streamId -> latest snapshot
    this.projections = new Map(); // projectionName -> projection data
    this.streamMetadata = new Map(); // streamId -> metadata
    
    // Concurrency control
    this.streamVersions = new Map(); // streamId -> version
    this.locks = new Map(); // streamId -> lock info
    
    // Performance metrics
    this.metrics = {
      eventsStored: 0,
      snapshotsTaken: 0,
      streamsCreated: 0,
      projectionUpdates: 0,
      concurrencyConflicts: 0
    };

    console.log('📚 Event Store initialized with sourcing capabilities');
  }

  /**
   * Append events to a stream
   */
  async appendToStream(streamId, events, expectedVersion = -1) {
    try {
      // Validate input
      if (!Array.isArray(events)) {
        events = [events];
      }

      // Check optimistic concurrency if enabled
      if (this.config.enableOptimisticConcurrency && expectedVersion !== -1) {
        const currentVersion = this.getStreamVersion(streamId);
        if (currentVersion !== expectedVersion) {
          this.metrics.concurrencyConflicts++;
          throw new Error(`Concurrency conflict: expected version ${expectedVersion}, actual version ${currentVersion}`);
        }
      }

      // Acquire stream lock
      await this.acquireStreamLock(streamId);

      try {
        // Initialize stream if it doesn't exist
        if (!this.events.has(streamId)) {
          this.events.set(streamId, []);
          this.streamVersions.set(streamId, 0);
          this.streamMetadata.set(streamId, {
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            eventCount: 0
          });
          this.metrics.streamsCreated++;
        }

        const streamEvents = this.events.get(streamId);
        const currentVersion = this.streamVersions.get(streamId);
        
        // Process each event
        const processedEvents = [];
        for (let i = 0; i < events.length; i++) {
          const event = this.createEventRecord(events[i], streamId, currentVersion + i + 1);
          streamEvents.push(event);
          processedEvents.push(event);
          this.metrics.eventsStored++;
        }

        // Update stream version and metadata
        const newVersion = currentVersion + events.length;
        this.streamVersions.set(streamId, newVersion);
        
        const metadata = this.streamMetadata.get(streamId);
        metadata.lastModified = new Date().toISOString();
        metadata.eventCount = streamEvents.length;

        // Emit events for projections
        for (const event of processedEvents) {
          this.emit('eventAppended', event);
        }

        // Check if snapshot is needed
        if (this.config.enableSnapshots && 
            streamEvents.length % this.config.snapshotFrequency === 0) {
          await this.createSnapshot(streamId);
        }

        console.log(`📝 Appended ${events.length} events to stream ${streamId} (version: ${newVersion})`);
        
        return {
          streamId,
          eventsAppended: events.length,
          newVersion,
          eventIds: processedEvents.map(e => e.id)
        };

      } finally {
        this.releaseStreamLock(streamId);
      }

    } catch (error) {
      console.error(`❌ Failed to append events to stream ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Read events from a stream
   */
  async readStream(streamId, fromVersion = 0, maxCount = 1000) {
    const streamEvents = this.events.get(streamId) || [];
    
    // Filter events by version
    const filteredEvents = streamEvents.filter(event => event.version >= fromVersion);
    
    // Apply max count limit
    const events = filteredEvents.slice(0, maxCount);
    
    return {
      streamId,
      fromVersion,
      events,
      isEndOfStream: events.length < maxCount,
      nextVersion: events.length > 0 ? events[events.length - 1].version + 1 : fromVersion,
      streamVersion: this.getStreamVersion(streamId)
    };
  }

  /**
   * Rebuild aggregate state from events
   */
  async rebuildAggregate(streamId, aggregateType, fromSnapshot = true) {
    let state = null;
    let fromVersion = 0;

    // Load snapshot if available and requested
    if (fromSnapshot && this.config.enableSnapshots) {
      const snapshot = this.snapshots.get(streamId);
      if (snapshot) {
        state = snapshot.data;
        fromVersion = snapshot.version + 1;
        console.log(`📷 Loaded snapshot for ${streamId} at version ${snapshot.version}`);
      }
    }

    // Read events from the specified version
    const streamData = await this.readStream(streamId, fromVersion);
    
    // Apply events to rebuild state
    for (const event of streamData.events) {
      state = this.applyEvent(state, event, aggregateType);
    }

    return {
      streamId,
      aggregateType,
      state,
      version: streamData.streamVersion,
      eventsApplied: streamData.events.length,
      usedSnapshot: fromSnapshot && this.snapshots.has(streamId)
    };
  }

  /**
   * Create a snapshot of current aggregate state
   */
  async createSnapshot(streamId, state = null) {
    if (!this.config.enableSnapshots) {
      return null;
    }

    const version = this.getStreamVersion(streamId);
    
    // If state is not provided, rebuild it
    if (state === null) {
      const rebuilt = await this.rebuildAggregate(streamId, 'unknown', false);
      state = rebuilt.state;
    }

    const snapshot = {
      streamId,
      version,
      data: state,
      timestamp: new Date().toISOString(),
      metadata: {
        reason: 'automatic',
        eventCount: version
      }
    };

    this.snapshots.set(streamId, snapshot);
    this.metrics.snapshotsTaken++;
    
    console.log(`📷 Snapshot created for stream ${streamId} at version ${version}`);
    this.emit('snapshotCreated', snapshot);
    
    return snapshot;
  }

  /**
   * Create and manage projections
   */
  createProjection(projectionName, eventHandlers, options = {}) {
    const projection = {
      name: projectionName,
      handlers: eventHandlers,
      state: options.initialState || {},
      version: 0,
      lastProcessedEvent: null,
      options: {
        persistent: options.persistent !== false,
        continueOnError: options.continueOnError !== false,
        ...options
      }
    };

    this.projections.set(projectionName, projection);
    
    // Listen for events to update projection
    this.on('eventAppended', (event) => {
      this.updateProjection(projectionName, event);
    });

    console.log(`📊 Projection created: ${projectionName}`);
    return projection;
  }

  /**
   * Update projection with new event
   */
  updateProjection(projectionName, event) {
    const projection = this.projections.get(projectionName);
    if (!projection) {
      return;
    }

    try {
      const handler = projection.handlers[event.type];
      if (handler) {
        projection.state = handler(projection.state, event);
        projection.version++;
        projection.lastProcessedEvent = event.id;
        this.metrics.projectionUpdates++;
        
        this.emit('projectionUpdated', { projectionName, event, newState: projection.state });
      }
    } catch (error) {
      console.error(`❌ Error updating projection ${projectionName}:`, error);
      if (!projection.options.continueOnError) {
        throw error;
      }
    }
  }

  /**
   * Get projection state
   */
  getProjection(projectionName) {
    const projection = this.projections.get(projectionName);
    return projection ? {
      name: projection.name,
      state: projection.state,
      version: projection.version,
      lastProcessedEvent: projection.lastProcessedEvent
    } : null;
  }

  /**
   * Query events across all streams
   */
  async queryEvents(criteria = {}) {
    const allEvents = [];
    
    for (const [streamId, events] of this.events.entries()) {
      for (const event of events) {
        // Apply filters
        if (criteria.eventType && event.type !== criteria.eventType) continue;
        if (criteria.streamId && streamId !== criteria.streamId) continue;
        if (criteria.fromTimestamp && new Date(event.timestamp) < new Date(criteria.fromTimestamp)) continue;
        if (criteria.toTimestamp && new Date(event.timestamp) > new Date(criteria.toTimestamp)) continue;
        if (criteria.correlationId && event.metadata.correlationId !== criteria.correlationId) continue;
        
        allEvents.push(event);
      }
    }

    // Sort by timestamp
    allEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Apply limit
    const limit = criteria.limit || 1000;
    return allEvents.slice(0, limit);
  }

  /**
   * Create structured event record
   */
  createEventRecord(eventData, streamId, version) {
    return {
      id: uuidv4(),
      streamId,
      version,
      type: eventData.type,
      data: eventData.data || {},
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: eventData.correlationId || uuidv4(),
        causationId: eventData.causationId,
        userId: eventData.userId,
        source: eventData.source || 'echotune-ai',
        ...eventData.metadata
      }
    };
  }

  /**
   * Apply event to aggregate state (override in specific implementations)
   */
  applyEvent(state, event, aggregateType) {
    // This is a generic implementation - override for specific aggregates
    if (!state) {
      state = { type: aggregateType, version: 0 };
    }
    
    state.version = event.version;
    state.lastEventId = event.id;
    state.lastModified = event.metadata.timestamp;
    
    return state;
  }

  /**
   * Acquire stream lock for concurrency control
   */
  async acquireStreamLock(streamId) {
    const lockKey = `lock:${streamId}`;
    const existing = this.locks.get(lockKey);
    
    if (existing && existing.expiresAt > Date.now()) {
      // Wait for lock to be released or expire
      await new Promise(resolve => setTimeout(resolve, 10));
      return this.acquireStreamLock(streamId); // Retry
    }
    
    this.locks.set(lockKey, {
      streamId,
      acquiredAt: Date.now(),
      expiresAt: Date.now() + 5000 // 5 second timeout
    });
  }

  /**
   * Release stream lock
   */
  releaseStreamLock(streamId) {
    const lockKey = `lock:${streamId}`;
    this.locks.delete(lockKey);
  }

  /**
   * Get current stream version
   */
  getStreamVersion(streamId) {
    return this.streamVersions.get(streamId) || 0;
  }

  /**
   * Get event store statistics
   */
  getStatistics() {
    return {
      totalStreams: this.events.size,
      totalEvents: this.metrics.eventsStored,
      totalSnapshots: this.snapshots.size,
      totalProjections: this.projections.size,
      metrics: this.metrics,
      streamSizes: Array.from(this.events.entries()).map(([streamId, events]) => ({
        streamId,
        eventCount: events.length,
        version: this.getStreamVersion(streamId)
      }))
    };
  }

  /**
   * Health check for event store
   */
  async healthCheck() {
    const stats = this.getStatistics();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: stats,
      config: {
        snapshots: this.config.enableSnapshots,
        projections: this.config.enableProjections,
        optimisticConcurrency: this.config.enableOptimisticConcurrency
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Event Store...');
    
    // Release all locks
    this.locks.clear();
    
    this.removeAllListeners();
    console.log('✅ Event Store shutdown complete');
  }
}

// Singleton instance
let eventStoreInstance = null;

/**
 * Get or create Event Store instance
 */
function getEventStore(options = {}) {
  if (!eventStoreInstance) {
    eventStoreInstance = new EventStore(options);
  }
  return eventStoreInstance;
}

module.exports = {
  EventStore,
  getEventStore
};