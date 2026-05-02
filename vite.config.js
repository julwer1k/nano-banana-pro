import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Dev-only middleware that mirrors api/vertex.js (the Vercel function).
 * Reads { path, body } from a POST to /api/vertex, forwards to
 * aiplatform.googleapis.com with the dev key appended, returns the response.
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
          const buf = Buffer.from(await upstream.arrayBuffer());
          res.statusCode = upstream.status;
          const ct = upstream.headers.get('content-type');
          if (ct) res.setHeader('content-type', ct);
          res.end(buf);
        } catch (err) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: { message: `Upstream fetch failed: ${err.message}` } }));
        }
      });
    },
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
