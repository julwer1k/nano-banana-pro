/**
 * Application constants: model definitions, aspect ratios, quality/resolution mappings.
 */

const DEFAULT_MODELS = [
  { id: 'gemini-3-pro-image-preview',     name: 'Nano Banana Pro', badge: 'Pro' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2',   badge: '2' },
  { id: 'gemini-2.5-flash-image',         name: 'Nano Banana',     badge: '⚡' },
];

function parseModelsEnv(raw) {
  if (!raw) return null;
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, name, badge] = entry.split(':').map((s) => s?.trim());
      if (!id) return null;
      return { id, name: name || id, badge: badge || '' };
    })
    .filter(Boolean);
  return parsed.length ? parsed : null;
}

export const MODELS =
  parseModelsEnv(import.meta.env.VITE_VERTEX_MODELS) || DEFAULT_MODELS;

export const ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1',  icon: '⬜' },
  { value: '3:4',  label: '3:4',  icon: '▯' },
  { value: '4:3',  label: '4:3',  icon: '▭' },
  { value: '2:3',  label: '2:3',  icon: '▯' },
  { value: '3:2',  label: '3:2',  icon: '▭' },
  { value: '9:16', label: '9:16', icon: '📱' },
  { value: '16:9', label: '16:9', icon: '🖥' },
  { value: '5:4',  label: '5:4',  icon: '▭' },
  { value: '4:5',  label: '4:5',  icon: '▯' },
  { value: '21:9', label: '21:9', icon: '🎬' },
];

export const QUALITY_OPTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

/**
 * Maps aspect ratio + quality to actual pixel dimensions.
 * Formula: short side = base resolution, long side = short * ratio
 */
export const RESOLUTION_MAP = {
  '1:1':  { '1K': '1024×1024',   '2K': '2048×2048',   '4K': '4096×4096' },
  '3:4':  { '1K': '768×1024',    '2K': '1536×2048',   '4K': '3072×4096' },
  '4:3':  { '1K': '1024×768',    '2K': '2048×1536',   '4K': '4096×3072' },
  '2:3':  { '1K': '832×1248',    '2K': '1664×2496',   '4K': '3328×4992' },
  '3:2':  { '1K': '1248×832',    '2K': '2496×1664',   '4K': '4992×3328' },
  '9:16': { '1K': '768×1344',    '2K': '1536×2688',   '4K': '3072×5376' },
  '16:9': { '1K': '1344×768',    '2K': '2688×1536',   '4K': '5376×3072' },
  '5:4':  { '1K': '1024×832',    '2K': '2048×1664',   '4K': '4096×3328' },
  '4:5':  { '1K': '832×1024',    '2K': '1664×2048',   '4K': '3328×4096' },
  '21:9': { '1K': '1344×576',    '2K': '2688×1152',   '4K': '5376×2304' },
};

// All Vertex AI calls go through our same-origin proxy at /api/vertex/*.
// In dev, Vite forwards them and injects the key (see vite.config.js).
// In prod (Vercel), api/vertex/[...path].js does the same on the server.
// The API key never appears in the client bundle.
export const VERTEX_API_BASE_URL = '/api/vertex/v1/publishers/google/models';

export const MAX_REFERENCE_IMAGES = 14;

export const HISTORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
