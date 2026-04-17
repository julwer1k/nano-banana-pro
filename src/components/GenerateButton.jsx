import useGenerationStore from '../stores/useGenerationStore';
import useApiStore from '../stores/useApiStore';
import useHistoryStore from '../stores/useHistoryStore';
import { generateImage } from '../services/geminiApi';
import { generateId, createThumbnail } from '../utils/imageUtils';

/**
 * GenerateButton — Primary CTA button that triggers image generation.
 * Handles parallel requests based on numberOfImages count.
 */
export default function GenerateButton() {
  const {
    prompt, referenceImages, model, aspectRatio, quality,
    numberOfImages, isGenerating,
    setGenerating, setPendingCards, setError,
  } = useGenerationStore();

  const { apiKey } = useApiStore();
  const { addItem } = useHistoryStore();

  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setError(null);
    setGenerating(true);

    // Create pending placeholder cards
    const pendingIds = Array.from({ length: numberOfImages }, () => generateId());
    setPendingCards(pendingIds);

    // Prepare reference images payload (base64 + mimeType only)
    const refs = referenceImages.map((img) => ({
      base64: img.base64,
      mimeType: img.mimeType,
    }));

    // Create thumbnail versions of reference images for history storage
    const refThumbnails = await Promise.all(
      referenceImages.map(async (img) => ({
        id: img.id,
        name: img.name,
        preview: await createThumbnail(img.preview, 64),
      }))
    );

    // Fire N parallel requests
    const promises = pendingIds.map(async (pendingId) => {
      try {
        const result = await generateImage({
          apiKey,
          model,
          prompt,
          referenceImages: refs,
          aspectRatio,
          quality,
        });

        if (result.image) {
          // Create thumbnail for grid display
          const thumbDataUrl = `data:${result.mimeType};base64,${result.image}`;
          const thumbnail = await createThumbnail(thumbDataUrl, 400);

          addItem({
            id: pendingId,
            prompt,
            model,
            aspectRatio,
            quality,
            resultImage: result.image,
            resultMimeType: result.mimeType,
            resultThumbnail: thumbnail,
            resultText: result.text,
            referenceImages: refThumbnails,
          });
        }
      } catch (err) {
        console.error('Generation failed:', err);
        setError(err.message);
      }
    });

    await Promise.allSettled(promises);
    setGenerating(false);
    setPendingCards([]);
  };

  return (
    <button
      id="generate-btn"
      onClick={handleGenerate}
      disabled={!canGenerate}
      className={`w-full py-3 px-6 rounded-[var(--radius-md)] font-semibold text-sm
                  transition-all duration-200 cursor-pointer
                  ${canGenerate
                    ? 'bg-brand text-bg-primary hover:bg-brand-light active:scale-[0.98] shadow-md shadow-brand/20'
                    : 'bg-bg-elevated text-text-muted cursor-not-allowed'}
                  ${isGenerating ? 'animate-pulse-soft' : ''}`}
    >
      {isGenerating ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </span>
      ) : (
        `Generate${numberOfImages > 1 ? ` (${numberOfImages})` : ''}`
      )}
    </button>
  );
}
