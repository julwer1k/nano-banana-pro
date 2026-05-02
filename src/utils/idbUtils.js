/**
 * IndexedDB store for full-resolution image blobs.
 * localStorage caps at ~5 MB per origin which a single 2K/4K base64 PNG can blow.
 * IDB allows hundreds of MB and persists reliably across reloads/tab switches.
 *
 * Schema: object store "blobs", keyPath "id".
 * Record shape: { id, resultImage, resultMimeType, refImages: [{id, base64, mimeType}], timestamp }
 */

const DB_NAME = '1of1s-blobs';
const STORE = 'blobs';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export async function putBlob(record) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getBlob(id) {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(id) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function pruneExpiredBlobs(ttlMs) {
  const store = await tx('readwrite');
  const cutoff = Date.now() - ttlMs;
  return new Promise((resolve, reject) => {
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return resolve();
      const ts = cursor.value?.timestamp || 0;
      if (ts < cutoff) cursor.delete();
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllBlobs() {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
