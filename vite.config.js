import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Dev-only middleware that mirrors the production Vertex proxies
 * (api/vertex.js for Vercel and netlify/functions/vertex.js for Netlify).
 *
 * Reads { path, body } from a POST to /api/vertex, forwards to
 * aiplatform.googleapis.com with the dev key appended, and applies the same
 * base64→binary unwrap for image responses so the dev wire format matches
 * production exactly. Text responses are forwarded as JSON.
 */
function devVertexProxy(devKey) {
  return {
    name: 'dev-vertex-proxy',
    configureServer(server) {
      server.middlewares.use('/api/vertex', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: { message: 'Method not allowed' } }));
          return;
        }
        if (!devKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: { message: 'VITE_VERTEX_API_KEY not set in .env' } }));
          return;
        }

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        let body;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: { message: 'Invalid JSON' } }));
          return;
        }

        const path = body?.path;
        if (!path || typeof path !== 'string' || !path.startsWith('/v1/')) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: { message: 'Invalid path' } }));
          return;
        }

        const sep = path.includes('?') ? '&' : '?';
        const target = `https://aiplatform.googleapis.com${path}${sep}key=${encodeURIComponent(devKey)}`;

        try {
          const upstream = await fetch(target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body.body ?? {}),
          });

          const upstreamCT = upstream.headers.get('content-type') || '';
          const rawText = await upstream.text();

          if (!upstream.ok || !upstreamCT.includes('application/json')) {
            res.statusCode = upstream.status;
            if (upstreamCT) res.setHeader('content-type', upstreamCT);
            res.end(rawText);
            return;
          }

          let parsed;
          try {
            parsed = JSON.parse(rawText);
          } catch {
            res.statusCode = upstream.status;
            res.setHeader('content-type', 'application/json');
            res.end(rawText);
            return;
          }

          const extracted = extractImagePart(parsed);
          if (extracted) {
            res.statusCode = upstream.status;
            res.setHeader('content-type', extracted.mimeType || 'image/png');
            res.setHeader('cache-control', 'no-store');
            if (extracted.text) {
              res.setHeader('x-vertex-text', Buffer.from(extracted.text, 'utf8').toString('base64'));
            }
            res.end(Buffer.from(extracted.data, 'base64'));
            return;
          }

          res.statusCode = upstream.status;
          res.setHeader('content-type', 'application/json');
          res.end(rawText);
        } catch (err) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: { message: `Upstream fetch failed: ${err.message}` } }));
        }
      });
    },
  };
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devKey = env.VITE_VERTEX_API_KEY || env.VERTEX_API_KEY || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      devVertexProxy(devKey),
    ],
  }
})
