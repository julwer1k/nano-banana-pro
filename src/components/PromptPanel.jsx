import { useRef, useState } from 'react';
import useGenerationStore from '../stores/useGenerationStore';

/**
 * PromptPanel — Resizable text input area for the generation prompt.
 * Supports expand/collapse toggle and character count display.
 */
export default function PromptPanel() {
  const { prompt, setPrompt } = useGenerationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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
