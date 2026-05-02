/**
 * Generation store — manages current workspace state:
 * prompt, reference images, generation config, and loading state.
 */

import { create } from 'zustand';
import { MODELS } from '../utils/constants';
import { getBlob } from '../utils/idbUtils';

const DEFAULT_MODEL_ID = MODELS[0]?.id || 'gemini-3-pro-image-preview';

const useGenerationStore = create((set) => ({
  // Prompt
  prompt: '',

  // Reference images: {id, base64, mimeType, preview, name}
  referenceImages: [],

  // Generation config
  model: DEFAULT_MODEL_ID,
  aspectRatio: '9:16',
  quality: '2K',
  numberOfImages: 1,

  // Loading state
  isGenerating: false,
  pendingCards: [], // Array of placeholder card IDs during generation

  // Error state
  error: null,

  // -- Actions --

  setPrompt: (prompt) => set({ prompt }),

  setModel: (model) => set({ model }),

  setAspectRatio: (aspectRatio) => set({ aspectRatio }),

  setQuality: (quality) => set({ quality }),

  setNumberOfImages: (count) =>
    set({ numberOfImages: Math.max(1, Math.min(4, count)) }),

  addReferenceImage: (image) =>
    set((state) => ({
      referenceImages: [...state.referenceImages, image],
    })),

  removeReferenceImage: (id) =>
    set((state) => ({
      referenceImages: state.referenceImages.filter((img) => img.id !== id),
    })),

  reorderReferenceImages: (newOrder) =>
    set({ referenceImages: newOrder }),

  clearReferenceImages: () =>
    set({ referenceImages: [] }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setPendingCards: (pendingCards) => set({ pendingCards }),

  setError: (error) => set({ error }),

  /**
   * Reuse a history item — fills prompt, config, and reference images.
   * Reference images are rehydrated from IDB at full resolution so the next
   * generation uses the original images (not the 64px grid thumbnails).
   */
  reuseFromHistory: async (item) => {
    const blob = await getBlob(item.id);
    const refs = blob?.refImages?.length
      ? blob.refImages
      : (item.referenceImages || []);

    set({
      prompt: item.prompt || '',
      model: item.model || DEFAULT_MODEL_ID,
      aspectRatio: item.aspectRatio || '9:16',
      quality: item.quality || '2K',
      referenceImages: refs,
    });
  },

  /**
   * Resets the workspace to initial state.
   */
  reset: () =>
    set({
      prompt: '',
      referenceImages: [],
      isGenerating: false,
      pendingCards: [],
      error: null,
    }),
}));

export default useGenerationStore;
