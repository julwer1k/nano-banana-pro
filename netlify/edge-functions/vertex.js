/**
 * Netlify Edge Function proxy for Vertex AI Express Mode.
 *
 * Replaces the Node Functions version because Node Functions cap responses
 * at 6 MB, and a 2K+/4K generated PNG (even after the base64→binary unwrap)
 * routinely exceeds that. Edge Functions run on Deno and stream the
 * response body, so they sidestep the 6 MB ceiling entirely.
 *
 * Wire contract — identical to the Vercel / dev proxies:
 *   - Image  → binary body, `Content-Type: image/<png|webp|...>`,
 *              accompanying text in base64 in `X-Vertex-Text`.
 *   - Text   → original Vertex JSON.
 *   - Error  → upstream status + original body forwarded verbatim.
 */

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: { message: 'Method not allowed' } });
  }

  const apiKey = Deno.env.get('VERTEX_API_KEY');
  if (!apiKey) {
    return jsonResponse(500, { error: { message: 'VERTEX_API_KEY is not configured on the server' } });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: { message: 'Invalid JSON body' } });
  }

  const { path, body } = payload || {};
  if (!path || typeof path !== 'string' || !path.startsWith('/v1/')) {
    return jsonResponse(400, {
      error: { message: 'Invalid path. Expected JSON body with { path: "/v1/...", body: {...} }' },
    });
  }

  const sep = path.includes('?') ? '&' : '?';
  const target = `https://aiplatform.googleapis.com${path}${sep}key=${encodeURIComponent(apiKey)}`;

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

  if (!upstream.ok || !upstreamCT.includes('application/json')) {
    return new Response(rawText, {
      status: upstream.status,
      headers: { 'content-type': upstreamCT || 'application/json' },
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return new Response(rawText, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const extracted = extractImagePart(parsed);
  if (extracted) {
    const bytes = base64ToBytes(extracted.data);
    const headers = {
      'content-type': extracted.mimeType || 'image/png',
      'cache-control': 'no-store',
    };
    if (extracted.text) {
      headers['x-vertex-text'] = utf8ToBase64(extracted.text);
    }
    return new Response(bytes, { status: upstream.status, headers });
  }

  return new Response(rawText, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
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

// Chunked base64→bytes: atob produces a binary string we walk byte-by-byte.
// Larger 4K images are ~5-10 MB so we allocate the typed array once and fill
// it in place rather than building intermediate strings.
function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const config = { path: '/api/vertex' };
