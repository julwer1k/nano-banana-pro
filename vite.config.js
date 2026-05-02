import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devKey = env.VITE_VERTEX_API_KEY || env.VERTEX_API_KEY || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        // Dev-only: mirror what the Vercel function (api/vertex/[...path].js) does in prod —
        // forward /api/vertex/* to the global Vertex AI endpoint and append the API key
        // server-side so it never lives in the client bundle.
        '/api/vertex': {
          target: 'https://aiplatform.googleapis.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/vertex/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (!devKey) return;
              const sep = proxyReq.path.includes('?') ? '&' : '?';
              proxyReq.path = `${proxyReq.path}${sep}key=${encodeURIComponent(devKey)}`;
            });
          },
        },
      },
    },
  }
})
