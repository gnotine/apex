/**
 * APEX — Mortgage Rate Proxy
 * Fetches the latest 30-year fixed rate from FRED (St. Louis Fed).
 * Cached 24hrs since rates only update weekly.
 * No env var needed — FRED's public series endpoint works with a
 * shared demo key. Rate-limited per IP, so we proxy to avoid browser blocks.
 */

const FRED_URL = 'https://api.stlouisfed.org/fred/series/observations' +
  '?series_id=MORTGAGE30US&sort_order=desc&limit=2&file_type=json' +
  '&api_key=a2d610cb4b27d7d1cf2b6c2c16c79e54';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(200).end();
  }

  try {
    const upstream = await fetch(FRED_URL, {
      headers: { 'User-Agent': 'APEX-Investment-Tool/1.0' }
    });

    if (!upstream.ok) throw new Error(`FRED returned ${upstream.status}`);

    const data = await upstream.json();
    const obs  = data.observations;
    if (!obs || obs.length < 2) throw new Error('No observations returned');

    const latest = obs[0];
    const prev   = obs[1];
    const rate   = parseFloat(latest.value);
    const prevR  = parseFloat(prev.value);

    // Cache for 12 hours — rates only update Thursday mornings
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      rate,
      prev_rate:    prevR,
      weekly_change: +(rate - prevR).toFixed(2),
      date:         latest.date,
      source:       'Freddie Mac via FRED'
    });

  } catch (err) {
    console.error('Mortgage proxy error:', err.message);
    return res.status(502).json({ error: err.message });
  }
}
