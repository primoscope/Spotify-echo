/**
 * Event-Driven Architecture Routes
 * 
 * API endpoints for managing Event Bus, Service Mesh, Event Sourcing,
 * and Distributed Transactions (Phase 7)
 */

const express = require('express');
const { getPhase7Orchestrator } = require('../infra/Phase7Orchestrator');

const router = express.Router();

// Middleware for Phase 7 initialization check
const ensurePhase7Initialized = async (req, res, next) => {
  try {
    const orchestrator = getPhase7Orchestrator();
    if (!orchestrator.initialized) {
      await orchestrator.initialize();
    }
    req.phase7 = orchestrator;
    next();
  } catch (error) {
    console.error('Phase 7 initialization error:', error);
    res.status(500).json({
      error: 'Phase 7 not available',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Event Bus Management Routes
 */

// Publish event
router.post('/events/publish', ensurePhase7Initialized, async (req, res) => {
  try {
    const { eventType, data, options = {} } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const eventId = await req.phase7.publishEvent(eventType, data, {
      ...options,
      source: 'api',
      userId: req.user?.id,
      correlationId: req.headers['x-correlation-id']
    });

    res.json({
      success: true,
      eventId,
      eventType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Event publish error:', error);
    res.status(500).json({
      error: 'Failed to publish event',
      message: error.message
    });
  }
});

// Subscribe to events (WebSocket endpoint would be better for real implementation)
router.post('/events/subscribe', ensurePhase7Initialized, async (req, res) => {
  try {
    const { eventType, options = {} } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // For API endpoint, we'll just register a simple logger
    const subscriptionId = req.phase7.subscribeToEvent(eventType, (event) => {
      console.log(`📨 Event received via API subscription: ${event.type} [${event.id}]`);
    }, options);

    res.json({
      success: true,
      subscriptionId,
      eventType,
      message: 'Subscription registered (events will be logged)'
    });

  } catch (error) {
    console.error('Event subscription error:', error);
    res.status(500).json({
      error: 'Failed to subscribe to events',
      message: error.message
    });
  }
});

// Get event bus metrics
router.get('/events/metrics', ensurePhase7Initialized, async (req, res) => {
  try {
    const metrics = req.phase7.components.eventBus?.getMetrics() || {};
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Event metrics error:', error);
    res.status(500).json({
      error: 'Failed to get event metrics',
      message: error.message
    });
  }
});

// Get dead letter queue
router.get('/events/dead-letter', ensurePhase7Initialized, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const deadLetterEvents = req.phase7.components.eventBus?.getDeadLetterQueue(limit) || [];
    
    res.json({
      success: true,
      deadLetterEvents,
      count: deadLetterEvents.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dead letter queue error:', error);
    res.status(500).json({
      error: 'Failed to get dead letter queue',
      message: error.message
    });
  }
});

/**
 * Service Mesh Management Routes
 */

// Get service mesh topology
router.get('/mesh/topology', ensurePhase7Initialized, async (req, res) => {
  try {
    const topology = req.phase7.components.serviceMesh?.getTopology() || {};
    
    res.json({
      success: true,
      topology,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mesh topology error:', error);
    res.status(500).json({
      error: 'Failed to get mesh topology',
      message: error.message
    });
  }
});

// Call service through mesh
router.post('/mesh/call/:serviceName', ensurePhase7Initialized, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { method = 'GET', path = '/', data, headers = {} } = req.body;

    const result = await req.phase7.callService(serviceName, method, path, {
      data,
      headers: {
        ...headers,
        'x-source-service': 'api-gateway',
        'x-request-id': req.headers['x-request-id'] || req.id
      },
      sourceService: 'api-gateway'
    });

    res.json({
      success: true,
      result,
      serviceName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Service call error:', error);
    res.status(error.circuitBreakerOpen ? 503 : 500).json({
      error: 'Service call failed',
      message: error.message,
      circuitBreakerOpen: error.circuitBreakerOpen || false
    });
  }
});

/**
 * Event Sourcing Routes
 */

// Store events
router.post('/events/store/:streamId', ensurePhase7Initialized, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { events, expectedVersion = -1 } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'events array is required' });
    }

    const result = await req.phase7.storeEvents(streamId, events, expectedVersion);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Event storage error:', error);
    res.status(error.message.includes('Concurrency conflict') ? 409 : 500).json({
      error: 'Failed to store events',
      message: error.message
    });
  }
});

// Read stream events
router.get('/events/stream/:streamId', ensurePhase7Initialized, async (req, res) => {
  try {
    const { streamId } = req.params;
    const fromVersion = parseInt(req.query.fromVersion) || 0;
    const maxCount = parseInt(req.query.maxCount) || 100;

    const eventStore = req.phase7.components.eventStore;
    if (!eventStore) {
      return res.status(503).json({ error: 'Event Store not available' });
    }

    const result = await eventStore.readStream(streamId, fromVersion, maxCount);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stream read error:', error);
    res.status(500).json({
      error: 'Failed to read stream',
      message: error.message
    });
  }
});

// Rebuild aggregate
router.post('/events/rebuild/:streamId', ensurePhase7Initialized, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { aggregateType = 'generic', fromSnapshot = true } = req.body;

    const eventStore = req.phase7.components.eventStore;
    if (!eventStore) {
      return res.status(503).json({ error: 'Event Store not available' });
    }

    const result = await eventStore.rebuildAggregate(streamId, aggregateType, fromSnapshot);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Aggregate rebuild error:', error);
    res.status(500).json({
      error: 'Failed to rebuild aggregate',
      message: error.message
    });
  }
});

// Get event store statistics
router.get('/events/statistics', ensurePhase7Initialized, async (req, res) => {
  try {
    const eventStore = req.phase7.components.eventStore;
    if (!eventStore) {
      return res.status(503).json({ error: 'Event Store not available' });
    }

    const statistics = eventStore.getStatistics();

    res.json({
      success: true,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Event statistics error:', error);
    res.status(500).json({
      error: 'Failed to get event statistics',
      message: error.message
    });
  }
});

/**
 * Distributed Transaction Routes
 */

// Start distributed transaction
router.post('/transactions/start', ensurePhase7Initialized, async (req, res) => {
  try {
    const transactionRequest = req.body;

    if (!transactionRequest.type) {
      transactionRequest.type = '2pc'; // Default to Two-Phase Commit
    }

    const result = await req.phase7.startTransaction(transactionRequest);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Transaction start error:', error);
    res.status(500).json({
      error: 'Failed to start transaction',
      message: error.message
    });
  }
});

// Get transaction statistics
router.get('/transactions/statistics', ensurePhase7Initialized, async (req, res) => {
  try {
    const coordinator = req.phase7.components.transactionCoordinator;
    if (!coordinator) {
      return res.status(503).json({ error: 'Transaction Coordinator not available' });
    }

    const statistics = coordinator.getStatistics();

    res.json({
      success: true,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Transaction statistics error:', error);
    res.status(500).json({
      error: 'Failed to get transaction statistics',
      message: error.message
    });
  }
});

/**
 * Phase 7 Health and Metrics Routes
 */

// Comprehensive health check
router.get('/health', ensurePhase7Initialized, async (req, res) => {
  try {
    const health = await req.phase7.getHealthStatus();
    
    res.status(health.status === 'healthy' ? 200 : 503).json(health);

  } catch (error) {
    console.error('Phase 7 health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive metrics
router.get('/metrics', ensurePhase7Initialized, async (req, res) => {
  try {
    const metrics = req.phase7.getMetrics();
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Phase 7 metrics error:', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

// Status overview
router.get('/status', ensurePhase7Initialized, async (req, res) => {
  try {
    const health = await req.phase7.getHealthStatus();
    const metrics = req.phase7.getMetrics();

    res.json({
      success: true,
      phase: 'Phase 7: Event-Driven Architecture & Service Mesh',
      status: health.status,
      components: {
        eventBus: !!req.phase7.components.eventBus,
        serviceMesh: !!req.phase7.components.serviceMesh,
        eventStore: !!req.phase7.components.eventStore,
        transactionCoordinator: !!req.phase7.components.transactionCoordinator
      },
      summary: {
        totalEvents: metrics.components.eventBus?.eventsPublished || 0,
        registeredServices: metrics.components.serviceMesh?.services?.length || 0,
        totalStreams: metrics.components.eventStore?.totalStreams || 0,
        activeTransactions: metrics.components.transactionCoordinator?.activeTransactions || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Phase 7 status error:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

module.exports = router;