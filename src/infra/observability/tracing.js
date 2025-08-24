'use strict';

/**
 * OpenTelemetry Tracing Skeleton
 * Configures tracing for the application with automatic instrumentation
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const opentelemetry = require('@opentelemetry/api');

let sdk = null;
let isInitialized = false;
const logger = require('./logger');

/**
 * Initialize OpenTelemetry tracing
 */
function initializeTracing() {
  if (isInitialized) {
    logger.warn('OpenTelemetry tracing already initialized');
    return;
  }

  try {
    const serviceName = process.env.OTEL_SERVICE_NAME || 'echotune-api';
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    logger.info({
      msg: 'Initializing OpenTelemetry tracing',
      serviceName,
      otlpEndpoint: otlpEndpoint ? 'configured' : 'using console exporter'
    });

    // Configure resource
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
    
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
    });

    // Configure tracing exporter
    let traceExporter;
    if (otlpEndpoint) {
      const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
      traceExporter = new OTLPTraceExporter({
        url: otlpEndpoint,
        headers: {},
      });
      logger.info('Using OTLP trace exporter');
    } else {
      const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
      traceExporter = new ConsoleSpanExporter();
      logger.info('Using Console span exporter for development');
    }

    // Initialize the SDK
    sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Configure specific instrumentations
          '@opentelemetry/instrumentation-http': {
            requestHook: (span, request) => {
              // Add request ID correlation if available
              const requestId = request.headers['x-request-id'];
              if (requestId) {
                span.setAttributes({
                  'request.id': requestId
                });
              }
            }
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true
          },
          '@opentelemetry/instrumentation-mongodb': {
            enabled: true
          },
          '@opentelemetry/instrumentation-redis': {
            enabled: true
          }
        })
      ],
    });

    sdk.start();
    isInitialized = true;

    logger.info({
      msg: 'OpenTelemetry tracing initialized successfully',
      serviceName,
      instrumentations: 'auto-instrumentations enabled'
    });

  } catch (error) {
    logger.error({
      msg: 'Failed to initialize OpenTelemetry tracing',
      error: error.message
    });
    // Don't throw - fail gracefully
  }
}

/**
 * Create a manual span for external operations
 * Integrates with timeExternal wrapper
 */
function createManualSpan(service, operation, fn) {
  const tracer = opentelemetry.trace.getTracer('echotune-manual');
  
  return tracer.startActiveSpan(`${service}.${operation}`, async (span) => {
    try {
      // Set span attributes
      span.setAttributes({
        'service': service,
        'operation': operation,
        'component': 'external-api'
      });

      const result = await fn();
      
      span.setStatus({ 
        code: opentelemetry.SpanStatusCode.OK 
      });
      
      return result;
    } catch (error) {
      span.setStatus({
        code: opentelemetry.SpanStatusCode.ERROR,
        message: error.message
      });
      
      span.setAttributes({
        'error': true,
        'error.message': error.message,
        'error.name': error.name
      });
      
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Enhanced timeExternal that creates manual spans
 */
function timeExternalWithTracing(service, operation, fn) {
  return createManualSpan(service, operation, fn);
}

/**
 * Stop tracing (cleanup)
 */
function stopTracing() {
  if (sdk && isInitialized) {
    return sdk.shutdown()
      .then(() => {
        logger.info('OpenTelemetry tracing stopped');
        isInitialized = false;
      })
      .catch((error) => {
        logger.error({
          msg: 'Error stopping OpenTelemetry tracing',
          error: error.message
        });
      });
  }
}

/**
 * Get current tracer
 */
function getTracer(name = 'echotune-app') {
  return opentelemetry.trace.getTracer(name);
}

/**
 * Get active span
 */
function getActiveSpan() {
  return opentelemetry.trace.getActiveSpan();
}

/**
 * Add request ID to active span if available
 */
function addRequestIdToSpan(requestId) {
  const span = getActiveSpan();
  if (span && requestId) {
    span.setAttributes({
      'request.id': requestId
    });
  }
}

module.exports = {
  initializeTracing,
  stopTracing,
  createManualSpan,
  timeExternalWithTracing,
  getTracer,
  getActiveSpan,
  addRequestIdToSpan,
  isInitialized: () => isInitialized
};