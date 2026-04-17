/**
 * Generation store — manages current workspace state:
 * prompt, reference images, generation config, and loading state.
 */

import { create } from 'zustand';

const useGenerationStore = create((set) => ({
  // Prompt
  prompt: '',

  // Reference images: {id, base64, mimeType, preview, name}
  referenceImages: [],

  // Generation config
  model: 'gemini-3-pro-image-preview',
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
   */
  reuseFromHistory: (item) =>
    set({
      prompt: item.prompt || '',
      model: item.model || 'gemini-3-pro-image-preview',
      aspectRatio: item.aspectRatio || '9:16',
      quality: item.quality || '2K',
      referenceImages: item.referenceImages || [],
    }),

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
