/**
 * Vercel serverless proxy for Vertex AI Express Mode.
 * Client posts to /api/vertex with `path` and `body` in JSON; we forward
 * to aiplatform.googleapis.com and inject the API key from server-only
 * VERTEX_API_KEY env so it never reaches the browser bundle.
 *
 * We use a JSON-wrapped request (instead of mirroring the upstream URL
 * directly) because Vercel's path routing chokes on the `:` character
 * Vertex uses in `model:generateContent`, and on deeply nested catch-alls.
 */

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = process.env.VERTEX_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'VERTEX_API_KEY is not configured on the server' } });
    return;
  }

  const { path, body } = req.body || {};
  if (!path || typeof path !== 'string' || !path.startsWith('/v1/')) {
    res.status(400).json({ error: { message: 'Invalid path. Expected JSON body with { path: "/v1/...", body: {...} }' } });
    return;
  }

  const sep = path.includes('?') ? '&' : '?';
  const target = `https://aiplatform.googleapis.com${path}${sep}key=${encodeURIComponent(apiKey)}`;

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    res.send(buf);
  } catch (err) {
    res.status(502).json({ error: { message: `Upstream fetch failed: ${err.message}` } });
  }
}
