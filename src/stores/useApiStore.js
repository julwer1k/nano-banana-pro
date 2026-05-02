/**
 * API Key store — kept for legacy UI compatibility.
 * In production the key lives server-side on Vercel (api/vertex/[...path].js).
 * In dev the key is injected by the Vite proxy from VITE_VERTEX_API_KEY.
 * Either way, the client never needs to hold a real key — so we mark
 * the app as "connected" by default and skip the API-key modal.
 */

import { create } from 'zustand';

const useApiStore = create((set) => ({
  apiKey: '',
  isConnected: true,
  isValidating: false,
  error: null,

  setApiKey: (key) => set({ apiKey: key, isConnected: true, error: null }),
  clearApiKey: () => set({ apiKey: '', isConnected: true, error: null }),
  setValidating: (isValidating) => set({ isValidating }),
  setError: (error) => set({ error }),
}));

export default useApiStore;
