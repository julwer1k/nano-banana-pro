/**
 * localStorage utilities with TTL (Time-To-Live) support.
 * Items are auto-pruned when they exceed the configured lifespan.
 */

/**
 * Saves a value to localStorage with a timestamp for TTL tracking.
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON-serialized)
 */
export function saveToStorage(key, value) {
  try {
    const wrapper = {
      data: value,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(wrapper));
  } catch (error) {
    console.warn(`[Storage] Failed to save "${key}":`, error.message);
  }
}

/**
 * Loads a value from localStorage, returning null if expired or missing.
 * @param {string} key - Storage key
 * @param {number} ttlMs - Time-to-live in milliseconds
 * @returns {*|null} The stored value, or null if expired/missing
 */
export function loadFromStorage(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const wrapper = JSON.parse(raw);
    const age = Date.now() - wrapper.timestamp;

    if (ttlMs && age > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }

    return wrapper.data;
  } catch (error) {
    console.warn(`[Storage] Failed to load "${key}":`, error.message);
    return null;
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key - Storage key
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove "${key}":`, error.message);
  }
}

/**
 * Prunes items from an array stored in localStorage that exceed the TTL.
 * Each item must have a `timestamp` field.
 * @param {string} key - Storage key
 * @param {number} ttlMs - Time-to-live in milliseconds
 * @returns {Array} The pruned array
 */
export function pruneExpiredItems(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const wrapper = JSON.parse(raw);
    const items = wrapper.data || [];
    const now = Date.now();

    const valid = items.filter((item) => now - item.timestamp < ttlMs);

    if (valid.length !== items.length) {
      saveToStorage(key, valid);
    }

    return valid;
  } catch (error) {
    console.warn(`[Storage] Failed to prune "${key}":`, error.message);
    return [];
  }
}
