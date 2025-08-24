/* Vercel Serverless Function: API proxy
 * Proxies all /api/* requests to the configured upstream API_BASE_URL
 * Set API_BASE_URL in Vercel Project Environment Variables, e.g. https://api.your-domain.com
 */

const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailers',
	'transfer-encoding',
	'upgrade',
]);

module.exports = async (req, res) => {
	try {
		const baseUrl = process.env.API_BASE_URL;
		if (!baseUrl) {
			res.statusCode = 500;
			res.setHeader('content-type', 'application/json');
			return res.end(JSON.stringify({ error: 'API_BASE_URL not configured in Vercel env' }));
		}

		const pathSegments = Array.isArray(req.query.path) ? req.query.path : (req.query.path ? [req.query.path] : []);
		const subPath = pathSegments.join('/');

		// Build target URL with original querystring
		const url = new URL(baseUrl.replace(/\/$/, ''));
		url.pathname = `${url.pathname.replace(/\/$/, '')}/${subPath}`;
		const origQuery = req.url.split('?')[1];
		if (origQuery) {
			url.search = origQuery;
		}

		// Clone headers, drop hop-by-hop
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (!value) continue;
			if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
			if (key.toLowerCase() === 'host') continue;
			headers.set(key, Array.isArray(value) ? value.join(', ') : value);
		}

		const init = {
			method: req.method,
			headers,
			redirect: 'manual',
		};

		// Forward body for applicable methods
		if (!['GET', 'HEAD'].includes(req.method)) {
			init.body = req;
		}

		const upstream = await fetch(url.toString(), init);

		// Set status and headers
		res.statusCode = upstream.status;
		upstream.headers.forEach((value, key) => {
			if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
			// Vercel allows multiple set-cookie
			if (key.toLowerCase() === 'set-cookie') {
				const cookies = upstream.headers.getSetCookie ? upstream.headers.getSetCookie() : value.split(/,(?=\s*[^;]+=)/);
				if (Array.isArray(cookies)) {
					res.setHeader('set-cookie', cookies);
				} else {
					res.setHeader('set-cookie', cookies);
				}
				return;
			}
			res.setHeader(key, value);
		});

		// Stream body
		if (upstream.body) {
			for await (const chunk of upstream.body) {
				res.write(chunk);
			}
		}
		return res.end();
	} catch (error) {
		res.statusCode = 502;
		res.setHeader('content-type', 'application/json');
		return res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
	}
};