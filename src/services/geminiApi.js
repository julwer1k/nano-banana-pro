/**
 * Vertex AI service — handles image generation requests via REST.
 * Talks to a same-origin proxy (/api/vertex/*) that injects the API key
 * on the server side. The key never lives in this client code.
 */

import { VERTEX_PROXY_URL, VERTEX_PUBLISHER_PATH } from '../utils/constants';

async function callVertex(path, body) {
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, body }),
  });
  const text = await response.text();
  if (!response.ok) {
    let parsed = {};
    try { parsed = JSON.parse(text); } catch { /* keep empty */ }
    const message = parsed.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }
  return JSON.parse(text);
}

function buildRequestBody({ prompt, referenceImages = [], aspectRatio, quality }) {
  const parts = [];

  if (prompt) {
    parts.push({ text: prompt });
  }

  for (const img of referenceImages) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  if (aspectRatio || quality) {
    body.generationConfig.imageConfig = {};
    if (aspectRatio) body.generationConfig.imageConfig.aspectRatio = aspectRatio;
    if (quality) body.generationConfig.imageConfig.imageSize = quality;
  }

  return body;
}

function parseResponse(response) {
  const result = { image: null, text: null, mimeType: 'image/png' };

  if (!response.candidates || response.candidates.length === 0) {
    if (response.promptFeedback) {
      throw new Error(
        `Request blocked: ${response.promptFeedback.blockReason || 'Unknown reason'}`
      );
    }
    throw new Error('No candidates returned from API');
  }

  const parts = response.candidates[0].content?.parts || [];

  for (const part of parts) {
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

export async function generateImage({
  model,
  prompt,
  referenceImages = [],
  aspectRatio,
  quality,
}) {
  const path = `${VERTEX_PUBLISHER_PATH}/${model}:generateContent`;
  const body = buildRequestBody({ prompt, referenceImages, aspectRatio, quality });
  const data = await callVertex(path, body);
  return parseResponse(data);
}

/**
 * Diagnostic: pings a known-available model to verify the proxy + server key work.
 * Run from the browser console:
 *   import('/src/services/geminiApi.js').then(m => m.pingVertex().then(console.log).catch(e => console.error(e.message)))
 */
export async function pingVertex(model = 'gemini-2.5-flash') {
  const path = `${VERTEX_PUBLISHER_PATH}/${model}:generateContent`;
  return callVertex(path, {
    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
  });
}
