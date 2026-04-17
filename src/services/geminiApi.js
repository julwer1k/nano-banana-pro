/**
 * Gemini API service — handles image generation requests via REST.
 * Uses the generativelanguage.googleapis.com endpoint with API key auth.
 */

import { API_BASE_URL } from '../utils/constants';

/**
 * Builds the request body for the generateContent endpoint.
 * @param {Object} params
 * @param {string} params.prompt - Text prompt
 * @param {Array<{base64: string, mimeType: string}>} params.referenceImages - Reference images
 * @param {string} params.aspectRatio - e.g. "9:16"
 * @param {string} params.quality - e.g. "2K"
 * @returns {Object} Request body
 */
function buildRequestBody({ prompt, referenceImages = [], aspectRatio, quality }) {
  const parts = [];

  // Add text prompt
  if (prompt) {
    parts.push({ text: prompt });
  }

  // Add reference images as inline data
  for (const img of referenceImages) {
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.base64,
      },
    });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  // Add image config for aspect ratio and resolution
  if (aspectRatio || quality) {
    body.generationConfig.imageConfig = {};

    if (aspectRatio) {
      body.generationConfig.imageConfig.aspectRatio = aspectRatio;
    }
    if (quality) {
      body.generationConfig.imageConfig.imageSize = quality;
    }
  }

  return body;
}

/**
 * Parses the API response and extracts generated image data.
 * @param {Object} response - Raw API response JSON
 * @returns {{ image: string|null, text: string|null, mimeType: string }}
 */
function parseResponse(response) {
  const result = { image: null, text: null, mimeType: 'image/png' };

  if (!response.candidates || response.candidates.length === 0) {
    // Check for prompt feedback / blocking
    if (response.promptFeedback) {
      throw new Error(
        `Request blocked: ${response.promptFeedback.blockReason || 'Unknown reason'}`
      );
    }
    throw new Error('No candidates returned from API');
  }

  const parts = response.candidates[0].content?.parts || [];

  for (const part of parts) {
    // Skip thinking parts
    if (part.thought) continue;

    if (part.text) {
      result.text = (result.text || '') + part.text;
    } else if (part.inlineData) {
      result.image = part.inlineData.data;
      result.mimeType = part.inlineData.mimeType || 'image/png';
    }
  }

  return result;
}

/**
 * Generates an image using the Gemini API.
 * @param {Object} params
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.model - Model identifier
 * @param {string} params.prompt - Text prompt
 * @param {Array} params.referenceImages - Reference images array
 * @param {string} params.aspectRatio - Aspect ratio
 * @param {string} params.quality - Quality/resolution
 * @returns {Promise<{image: string, text: string, mimeType: string}>}
 */
export async function generateImage({
  apiKey,
  model,
  prompt,
  referenceImages = [],
  aspectRatio,
  quality,
}) {
  const url = `${API_BASE_URL}/${model}:generateContent`;
  const body = buildRequestBody({ prompt, referenceImages, aspectRatio, quality });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  return parseResponse(data);
}

/**
 * Validates an API key by making a lightweight models.list request.
 * @param {string} apiKey - Gemini API key to validate
 * @returns {Promise<boolean>}
 */
export async function validateApiKey(apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
