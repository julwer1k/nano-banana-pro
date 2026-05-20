/**
 * Netlify Functions proxy for Vertex AI Express Mode.
 *
 * Mirrors api/vertex.js (Vercel) but with one extra optimisation that exists
 * specifically to cut bandwidth: when the upstream response contains a
 * generated image, we strip the base64 wrapper and return raw PNG bytes
 * instead of re-shipping ~5–15 MB of base64-in-JSON back to the browser.
 * For typical image generations that's roughly a 33 % egress saving — which
 * is the dominant cost driver for this app on serverless hosting.
 *
 * Response contract for the client:
 *   - Image present  → binary body, `Content-Type: image/<png|webp|...>`.
 *                      Accompanying model text (if any) is sent in the
 *                      `X-Vertex-Text` header (base64-encoded so multi-line
 *                      / non-ASCII text survives header transport).
 *   - Text-only      → original Vertex JSON, `Content-Type: application/json`.
 *   - Upstream error → upstream status + original JSON body forwarded as-is.
 */

const UPSTREAM_BASE = 'https://aiplatform.googleapis.com';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.VERTEX_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: { message: 'VERTEX_API_KEY is not configured on the server' } });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: { message: 'Invalid JSON body' } });
  }

  const { path, body } = payload;
  if (!path || typeof path !== 'string' || !path.startsWith('/v1/')) {
    return jsonResponse(400, {
      error: { message: 'Invalid path. Expected JSON body with { path: "/v1/...", body: {...} }' },
    });
  }

  const sep = path.includes('?') ? '&' : '?';
  const target = `${UPSTREAM_BASE}${path}${sep}key=${encodeURIComponent(apiKey)}`;

  let upstream;
  try {
    upstream = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  } catch (err) {
    return jsonResponse(502, { error: { message: `Upstream fetch failed: ${err.message}` } });
  }

  const upstreamCT = upstream.headers.get('content-type') || '';
  const rawText = await upstream.text();

  // Errors and non-JSON responses are forwarded verbatim. We do this with the
  // original content-type intact so the client's existing error parser keeps
  // working unchanged.
  if (!upstream.ok || !upstreamCT.includes('application/json')) {
    return {
      statusCode: upstream.status,
      headers: { 'content-type': upstreamCT || 'application/json' },
      body: rawText,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      statusCode: upstream.status,
      headers: { 'content-type': 'application/json' },
      body: rawText,
    };
  }

  const extracted = extractImagePart(parsed);
  if (extracted) {
    // Binary response: Netlify decodes the base64 body when isBase64Encoded is
    // true, so the *wire* payload from the function to the CDN is raw bytes
    // (not base64). That's where the bandwidth saving comes from.
    const headers = {
      'content-type': extracted.mimeType || 'image/png',
      'cache-control': 'no-store',
    };
    if (extracted.text) {
      headers['x-vertex-text'] = Buffer.from(extracted.text, 'utf8').toString('base64');
    }
    return {
      statusCode: upstream.status,
      headers,
      body: extracted.data,
      isBase64Encoded: true,
    };
  }

  return {
    statusCode: upstream.status,
    headers: { 'content-type': 'application/json' },
    body: rawText,
  };
};

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

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}
