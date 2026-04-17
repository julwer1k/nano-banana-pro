/**
 * History store — manages generated image history with localStorage persistence.
 * Items auto-expire after 24 hours (HISTORY_TTL_MS).
 */

import { create } from 'zustand';
import { saveToStorage, pruneExpiredItems } from '../utils/storageUtils';
import { HISTORY_TTL_MS } from '../utils/constants';

const STORAGE_KEY = '1of1s-history';

/**
 * Loads and prunes history from localStorage on initialization.
 */
function loadHistory() {
  return pruneExpiredItems(STORAGE_KEY, HISTORY_TTL_MS);
}

const useHistoryStore = create((set, get) => ({
  items: loadHistory(),

  /**
   * Adds a generation result to history.
   * @param {Object} item - History item with image data, prompt, config
   */
  addItem: (item) => {
    const newItem = {
      ...item,
      timestamp: Date.now(),
    };

    set((state) => {
      const updated = [newItem, ...state.items];
      saveToStorage(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  /**
   * Removes a specific item from history.
   */
  removeItem: (id) => {
    set((state) => {
      const updated = state.items.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  /**
   * Clears all history.
   */
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ items: [] });
  },

  /**
   * Prunes expired items (called periodically or on load).
   */
  pruneExpired: () => {
    const valid = pruneExpiredItems(STORAGE_KEY, HISTORY_TTL_MS);
    set({ items: valid });
  },
}));

export default useHistoryStore;
