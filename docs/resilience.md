# Resilience Patterns

## Circuit Breaker & Retry Wrapper

The application implements circuit breaker pattern with exponential backoff retry logic to improve reliability when calling external services.

## Usage

### Basic Circuit Breaker

```javascript
const { createBreaker } = require('../infra/resilience/breaker');

// Create a circuit breaker for an external service
const spotifyBreaker = createBreaker('spotify-api', {
  failureThreshold: 5,     // Open after 5 consecutive failures
  resetTimeoutMs: 30000,   // Try to close after 30s
  maxRetries: 2,           // Retry up to 2 times
  baseDelayMs: 100,        // Start with 100ms delay
  backoffFactor: 2         // Double delay each retry
});

// Use the circuit breaker
async function callSpotifyAPI() {
  return await spotifyBreaker(async () => {
    // Your external API call here
    const response = await fetch('https://api.spotify.com/v1/me');
    return response.json();
  });
}
```

### Combined with Metrics

```javascript
const { withResilience } = require('../infra/resilience/breaker');
const { createBreaker } = require('../infra/resilience/breaker');

const apiBreaker = createBreaker('external-api');
const resilientCall = withResilience(apiBreaker, apiCallFunction, 'spotify', 'get_user');

// This will track both circuit breaker metrics and timing metrics
const result = await resilientCall();
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `failureThreshold` | 5 | Number of failures before opening circuit |
| `resetTimeoutMs` | 30000 | Time to wait before trying to close circuit |
| `halfOpenTrialCount` | 1 | Successful calls needed to close from half-open |
| `maxRetries` | 2 | Maximum retry attempts |
| `baseDelayMs` | 50 | Base delay for exponential backoff |
| `backoffFactor` | 2 | Multiplier for delay between retries |
| `retryOn` | function | Function to determine if error should be retried |
| `onStateChange` | function | Callback for circuit state changes |

## Circuit States

- **CLOSED (0)**: Normal operation, requests allowed
- **OPEN (1)**: Circuit tripped, requests rejected immediately  
- **HALF_OPEN (2)**: Testing if service has recovered

## Metrics

The circuit breaker exposes the following Prometheus metrics:

- `external_circuit_state{breaker}`: Current circuit state (0/1/2)
- `external_call_retries_total{breaker,outcome}`: Count of retry attempts by outcome

## Custom Retry Logic

```javascript
const customBreaker = createBreaker('custom-service', {
  retryOn: (error, attempt) => {
    // Don't retry client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }
    // Retry network errors and server errors
    return true;
  }
});
```

## State Change Monitoring

```javascript
const monitoredBreaker = createBreaker('monitored-service', {
  onStateChange: ({ name, previousState, newState, reason }) => {
    console.log(`Circuit ${name}: ${previousState} -> ${newState} (${reason})`);
    // Send alerts, metrics, etc.
  }
});
```

## Best Practices

1. **Choose appropriate thresholds**: Balance between fault tolerance and responsiveness
2. **Monitor state changes**: Set up alerts for circuit breaker state transitions
3. **Use different breakers**: Create separate breakers for different external services
4. **Implement fallbacks**: Provide alternative behavior when circuit is open
5. **Test failure scenarios**: Verify circuit breaker behavior under load

## Integration Examples

### Spotify API Wrapper

```javascript
const spotifyBreaker = createBreaker('spotify', {
  failureThreshold: 3,
  resetTimeoutMs: 60000,
  retryOn: (error) => {
    // Retry on rate limits and server errors, not auth errors
    return error.response?.status !== 401 && error.response?.status !== 403;
  }
});

async function getSpotifyRecommendations(params) {
  return await spotifyBreaker(async () => {
    const response = await axios.get('/v1/recommendations', { params });
    return response.data;
  });
}
```

### Database Connection Wrapper

```javascript
const dbBreaker = createBreaker('database', {
  failureThreshold: 2,
  resetTimeoutMs: 10000,
  maxRetries: 1
});

async function queryDatabase(query) {
  return await dbBreaker(async () => {
    return await db.query(query);
  });
}
```