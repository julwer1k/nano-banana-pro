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
  // Match Google's official Python example exactly: text first, then images
  // passed sequentially with no per-image labels. The model binds "Image 1",
  // "Image 2" etc. by ordinal position in the list. Adding text labels between
  // images empirically degrades output on Gemini 3 Pro Image.
  // See: https://ai.google.dev/gemini-api/docs/image-generation
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

export async function pingVertex(model = 'gemini-2.5-flash') {
  const path = `${VERTEX_PUBLISHER_PATH}/${model}:generateContent`;
  return callVertex(path, {
    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
  });
}

/**
 * Rewrites the user's prompt into the prose style Nano Banana actually responds
 * to. Technical SYSTEM:/MODE:/TASK: tagged prompts hurt output on Gemini 3 Pro
 * Image because the model expects natural language ("talk to it like a human
 * artist briefing", per Google's prompting guide). This mirrors the invisible
 * preprocessing AI Studio's web UI does before calling the image model.
 */
const ORDINALS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh',
  'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth',
];

function buildReferenceLabelHint(referenceCount) {
  if (referenceCount <= 0) return '';
  const ordinalLabels = ORDINALS.slice(0, referenceCount).map((o) => `"${o} Image"`).join(' / ');
  const numericLabels = Array.from({ length: referenceCount }, (_, i) => `"Image ${i + 1}"`).join(' / ');
  return `The user is uploading ${referenceCount} reference image${referenceCount > 1 ? 's' : ''} (positions 1..${referenceCount}). When the prompt says ${ordinalLabels}, or ${numericLabels}, those refer to those uploads by ordinal position — keep every such reference intact, do not collapse, drop, or renumber them, and do not invent positions beyond ${referenceCount}.`;
}

export async function enhancePrompt(rawPrompt, { hasReferences = false, referenceCount = 0 } = {}) {
  if (!rawPrompt?.trim()) return rawPrompt;

  // Back-compat: if caller only passed hasReferences, assume at least 1.
  const refCount = referenceCount > 0 ? referenceCount : (hasReferences ? 1 : 0);

  const sys = refCount > 0
    ? `You rewrite image-generation prompts for Google's Nano Banana (Gemini 3 Pro Image / 3.1 Flash Image). ${buildReferenceLabelHint(refCount)} Convert any technical / SYSTEM:/MODE:/TASK: style instructions into one cohesive prose paragraph as if briefing a human photographer. Preserve every concrete detail (lighting cues, pose, biology, skin texture, eye geometry, hair physics, framing, negative constraints). End with the aspect ratio if mentioned. Output only the rewritten prompt — no preface, no commentary.`
    : 'You rewrite image-generation prompts for Google\'s Nano Banana (Gemini 3 Pro Image / 3.1 Flash Image). Convert any technical / SYSTEM:/MODE:/TASK: style instructions into one cohesive prose paragraph as if briefing a human photographer. Preserve every concrete detail (subject, lighting, pose, framing, style, negative constraints). End with the aspect ratio if mentioned. Output only the rewritten prompt — no preface, no commentary.';

  const path = `${VERTEX_PUBLISHER_PATH}/gemini-2.5-flash:generateContent`;
  const data = await callVertex(path, {
    contents: [{ role: 'user', parts: [{ text: rawPrompt }] }],
    systemInstruction: { parts: [{ text: sys }] },
  });

  const out = data?.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join('')
    .trim();

  return out || rawPrompt;
}
