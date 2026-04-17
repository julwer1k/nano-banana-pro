/**
 * API Key store — manages the Gemini API key state and persistence.
 */

import { create } from 'zustand';
import { saveToStorage, loadFromStorage } from '../utils/storageUtils';

const STORAGE_KEY = '1of1s-api-key';

const useApiStore = create((set, get) => ({
  apiKey: loadFromStorage(STORAGE_KEY) || '',
  isConnected: !!loadFromStorage(STORAGE_KEY),
  isValidating: false,
  error: null,

  /**
   * Sets the API key and persists it.
   */
  setApiKey: (key) => {
    saveToStorage(STORAGE_KEY, key);
    set({ apiKey: key, isConnected: true, error: null });
  },

  /**
   * Clears the API key from state and storage.
   */
  clearApiKey: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ apiKey: '', isConnected: false, error: null });
  },

  /**
   * Sets the validation loading state.
   */
  setValidating: (isValidating) => set({ isValidating }),

  /**
   * Sets an error message.
   */
  setError: (error) => set({ error }),
}));

export default useApiStore;
