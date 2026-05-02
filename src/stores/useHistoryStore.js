/**
 * History store — manages generated image history.
 *
 * Lightweight index (id, prompt, config, thumbnails) lives in localStorage.
 * Full-resolution result images and original reference images live in IndexedDB
 * (see idbUtils.js). Items auto-expire after HISTORY_TTL_MS.
 */

import { create } from 'zustand';
import { saveToStorage, pruneExpiredItems } from '../utils/storageUtils';
import { putBlob, getBlob, deleteBlob, pruneExpiredBlobs } from '../utils/idbUtils';
import { HISTORY_TTL_MS } from '../utils/constants';

const STORAGE_KEY = '1of1s-history';

function loadIndex() {
  return pruneExpiredItems(STORAGE_KEY, HISTORY_TTL_MS);
}

const useHistoryStore = create((set, get) => ({
  items: loadIndex(),

  /**
   * Adds a generation result to history.
   * @param {Object} item.indexEntry — lightweight metadata + thumbnails (goes to localStorage)
   * @param {Object} item.blob — { resultImage, resultMimeType, refImages } (goes to IDB)
   */
  addItem: async ({ indexEntry, blob }) => {
    const timestamp = Date.now();
    const newItem = { ...indexEntry, timestamp };

    await putBlob({ id: indexEntry.id, ...blob, timestamp });

    set((state) => {
      const updated = [newItem, ...state.items];
      saveToStorage(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  /**
   * Loads the full-resolution blob (result image + original reference images) for an item.
   * Returns null if missing (e.g. blob was evicted but index entry survived).
   */
  getFullBlob: async (id) => getBlob(id),

  removeItem: async (id) => {
    await deleteBlob(id);
    set((state) => {
      const updated = state.items.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  clearAll: async () => {
    const { items } = get();
    await Promise.all(items.map((item) => deleteBlob(item.id)));
    localStorage.removeItem(STORAGE_KEY);
    set({ items: [] });
  },

  pruneExpired: async () => {
    await pruneExpiredBlobs(HISTORY_TTL_MS);
    const valid = pruneExpiredItems(STORAGE_KEY, HISTORY_TTL_MS);
    set({ items: valid });
  },
}));

export default useHistoryStore;
