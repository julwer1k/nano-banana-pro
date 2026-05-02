import { useRef, useState } from 'react';
import useGenerationStore from '../stores/useGenerationStore';
import { enhancePrompt } from '../services/geminiApi';

export default function PromptPanel() {
  const { prompt, setPrompt, referenceImages } = useGenerationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState(null);
  const textareaRef = useRef(null);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceError(null);
    try {
      const rewritten = await enhancePrompt(prompt, {
        hasReferences: referenceImages.length > 0,
        referenceCount: referenceImages.length,
      });
      setPrompt(rewritten);
    } catch (err) {
      setEnhanceError(err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="prompt-input" className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Prompt
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted tabular-nums">
            {prompt.length} chars
          </span>
          <button
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing}
            className="text-xs text-brand hover:text-brand-light disabled:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
            title="Rewrite prompt in the prose style Nano Banana responds to best"
          >
            {isEnhancing ? (
              <>
                <svg className="w-3 h-3 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enhancing
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Enhance
              </>
            )}
          </button>
          <button
            onClick={toggleExpand}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {enhanceError && (
        <p className="text-xs text-error animate-fade-in">Enhance failed: {enhanceError}</p>
      )}

      <textarea
        ref={textareaRef}
        id="prompt-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you want to generate..."
        rows={isExpanded ? 12 : 4}
        className={`w-full px-4 py-3 bg-bg-secondary border border-border rounded-[var(--radius-md)]
                    text-sm text-text-primary placeholder-text-muted leading-relaxed
                    focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/15
                    transition-all duration-300 resize-y
                    ${isExpanded ? 'min-h-[280px]' : 'min-h-[100px]'}`}
      />
    </div>
  );
}
