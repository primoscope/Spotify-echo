const axios = require('axios');

const DEFAULT_TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS || '10000', 10);
const MAX_RETRIES = parseInt(process.env.HTTP_MAX_RETRIES || '2', 10);
const BASE_BACKOFF_MS = parseInt(process.env.HTTP_BASE_BACKOFF_MS || '300', 10);

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoff(attempt, retryAfterHeader) {
	if (retryAfterHeader) {
		const sec = Number(retryAfterHeader);
		if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
	}
	const jitter = Math.floor(Math.random() * 100);
	return Math.min(5000, BASE_BACKOFF_MS * Math.pow(2, attempt)) + jitter;
}

async function requestWithRetry(config) {
	const correlationId = config.headers && config.headers['x-request-id']
		? config.headers['x-request-id']
		: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

	let lastError = null;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const start = Date.now();
			const response = await axios({
				...config,
				timeout: config.timeout || DEFAULT_TIMEOUT_MS,
				headers: {
					'User-Agent': 'EchoTune-Backend/1.0',
					'X-Request-Id': correlationId,
					...(config.headers || {}),
				},
			});
			response.__meta = { correlationId, latency: Date.now() - start, attempt };
			return response;
		} catch (error) {
			lastError = error;
			const status = error.response && error.response.status;
			const retryAfter = error.response && error.response.headers && error.response.headers['retry-after'];
			const retriableStatus = status === 429 || status === 502 || status === 503 || status === 504;
			const retriableCode = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(error.code);
			if (attempt < MAX_RETRIES && (retriableStatus || retriableCode)) {
				const delay = computeBackoff(attempt, retryAfter);
				await sleep(delay);
				continue;
			}
			throw error;
		}
	}
	throw lastError;
}

const httpClient = {
	get(url, options = {}) {
		return requestWithRetry({ method: 'GET', url, ...options });
	},
	post(url, data, options = {}) {
		return requestWithRetry({ method: 'POST', url, data, ...options });
	},
	put(url, data, options = {}) {
		return requestWithRetry({ method: 'PUT', url, data, ...options });
	},
	delete(url, options = {}) {
		return requestWithRetry({ method: 'DELETE', url, ...options });
	},
};

module.exports = { httpClient, requestWithRetry };