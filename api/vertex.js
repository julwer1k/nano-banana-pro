/**
 * Vercel serverless proxy for Vertex AI Express Mode.
 * Client posts to /api/vertex with `path` and `body` in JSON; we forward
 * to aiplatform.googleapis.com and inject the API key from server-only
 * VERTEX_API_KEY env so it never reaches the browser bundle.
 *
 * We use a JSON-wrapped request (instead of mirroring the upstream URL
 * directly) because Vercel's path routing chokes on the `:` character
 * Vertex uses in `model:generateContent`, and on deeply nested catch-alls.
 *
 * Bandwidth optimisation: when the upstream response carries a generated
 * image, we strip the base64 wrapper and ship raw bytes back to the client
 * (~33 % egress reduction vs the original base64-in-JSON path). Text-only
 * responses are passed through as JSON unchanged.
 *
 * Wire contract for the client (same as the Netlify function):
 *   - Image  → binary body, `Content-Type: image/<png|webp|...>`,
 *              accompanying text in base64 in `X-Vertex-Text`.
 *   - Text   → original Vertex JSON.
 *   - Error  → original Vertex error JSON + status forwarded as-is.
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

    const upstreamCT = upstream.headers.get('content-type') || '';
    const rawText = await upstream.text();

    if (!upstream.ok || !upstreamCT.includes('application/json')) {
      res.status(upstream.status);
      if (upstreamCT) res.setHeader('content-type', upstreamCT);
      res.send(rawText);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      res.status(upstream.status);
      res.setHeader('content-type', 'application/json');
      res.send(rawText);
      return;
    }

    const extracted = extractImagePart(parsed);
    if (extracted) {
      res.status(upstream.status);
      res.setHeader('content-type', extracted.mimeType || 'image/png');
      res.setHeader('cache-control', 'no-store');
      if (extracted.text) {
        res.setHeader('x-vertex-text', Buffer.from(extracted.text, 'utf8').toString('base64'));
      }
      res.send(Buffer.from(extracted.data, 'base64'));
      return;
    }

    res.status(upstream.status);
    res.setHeader('content-type', 'application/json');
    res.send(rawText);
  } catch (err) {
    res.status(502).json({ error: { message: `Upstream fetch failed: ${err.message}` } });
  }
}

function extractImagePart(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  let imagePart = null;
  let text = '';
  for (const part of parts) {
    if (part?.thought) continue;
    if (part?.inlineData?.data && !imagePart) {
      imagePart = part.inlineData;
    } else if (typeof part?.text === 'string') {
      text += part.text;
    }
  }

  if (!imagePart) return null;
  return {
    data: imagePart.data,
    mimeType: imagePart.mimeType || 'image/png',
    text: text || null,
  };
}
