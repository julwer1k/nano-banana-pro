/**
 * Image utility functions: file reading, base64 conversion, download.
 */

/**
 * Reads a File object and returns a base64-encoded data string (without prefix).
 * @param {File} file - The image file to read
 * @returns {Promise<{base64: string, mimeType: string, preview: string}>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;           // "data:image/png;base64,..."
      const base64 = dataUrl.split(',')[1];    // raw base64 without prefix
      const mimeType = file.type || 'image/png';

      resolve({
        base64,
        mimeType,
        preview: dataUrl,                       // full data URL for <img> src
        name: file.name,
        size: file.size,
      });
    };

    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 string to a Blob for download.
 * @param {string} base64 - Base64-encoded image data
 * @param {string} mimeType - MIME type (e.g. "image/png")
 * @returns {Blob}
 */
export function base64ToBlob(base64, mimeType = 'image/png') {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }

  return new Blob([buffer], { type: mimeType });
}

/**
 * Creates a compressed thumbnail from a base64 image for storage efficiency.
 * @param {string} dataUrl - Full data URL of the image
 * @param {number} maxSize - Max width/height in pixels
 * @returns {Promise<string>} Compressed data URL
 */
export function createThumbnail(dataUrl, maxSize = 128) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = dataUrl;
  });
}

/**
 * Triggers a browser download of a base64 image.
 * @param {string} base64 - Base64-encoded image data
 * @param {string} filename - Download filename
 * @param {string} mimeType - MIME type
 */
export function downloadImage(base64, filename = 'generated-image.png', mimeType = 'image/png') {
  const blob = base64ToBlob(base64, mimeType);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generates a unique ID for tracking items.
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
