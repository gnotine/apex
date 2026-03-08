/**
 * APEX — Finnhub Proxy
 * Vercel Serverless Function
 *
 * Sits between the browser and Finnhub so the API key is never
 * exposed to the client. The key lives only in Vercel's environment
 * variables (Settings → Environment Variables → FINNHUB_API_KEY).
 *
 * Allowed endpoints (allowlist prevents abuse):
 *   GET /api/finnhub?path=/quote&symbol=AAPL
 *   GET /api/finnhub?path=/search&q=apple
 *   GET /api/finnhub?path=/stock/profile2&symbol=AAPL
 *   GET /api/finnhub?path=/stock/metric&symbol=AAPL&metric=all
 *   GET /api/finnhub?path=/stock/financials-reported&symbol=AAPL&freq=annual
 */

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Only these Finnhub paths are forwarded — everything else is rejected
const ALLOWED_PATHS = [
  '/quote',
  '/search',
  '/stock/profile2',
  '/stock/metric',
  '/stock/financials-reported',
  '/stock/financials',
];

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'FINNHUB_API_KEY environment variable is not set. ' +
             'Add it in Vercel → Project Settings → Environment Variables.'
    });
  }

  // Extract the Finnhub path from our query param
  const { path, ...rest } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query parameter.' });
  }

  // Allowlist check — prevents the proxy from being used as an open relay
  const allowed = ALLOWED_PATHS.some(p => path.startsWith(p));
  if (!allowed) {
    return res.status(403).json({
      error: `Path "${path}" is not allowed. Permitted paths: ${ALLOWED_PATHS.join(', ')}`
    });
  }

  // Build the upstream URL — forward all query params except "path", add key
  const params = new URLSearchParams({ ...rest, token: apiKey });
  const upstreamUrl = `${FINNHUB_BASE}${path}?${params.toString()}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'APEX-Investment-Tool/1.0',
      },
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    const data = await upstream.json();

    // Cache successful responses briefly to reduce Finnhub calls
    if (upstream.ok) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({
      error: 'Failed to reach Finnhub API.',
      detail: err.message
    });
  }
}
