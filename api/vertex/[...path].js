/**
 * Vercel serverless proxy for Vertex AI Express Mode.
 * Catches anything under /api/vertex/* and forwards it to aiplatform.googleapis.com,
 * injecting the API key from server-only env (VERTEX_API_KEY) so it never reaches
 * the client bundle.
 */

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const apiKey = process.env.VERTEX_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'VERTEX_API_KEY is not configured on the server' } });
    return;
  }

  const incoming = req.url || '';
  const path = incoming.replace(/^\/api\/vertex/, '') || '/';
  const sep = path.includes('?') ? '&' : '?';
  const target = `https://aiplatform.googleapis.com${path}${sep}key=${encodeURIComponent(apiKey)}`;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody
    ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}))
    : undefined;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body,
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
