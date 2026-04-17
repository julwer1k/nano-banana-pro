import { useState } from 'react';
import useGenerationStore from '../stores/useGenerationStore';
import { MODELS, ASPECT_RATIOS, QUALITY_OPTIONS } from '../utils/constants';

/**
 * ConfigBar — Bottom configuration bar with model, aspect ratio, quality, and count selectors.
 * Inspired by Higsfield's bottom toolbar design.
 */
export default function ConfigBar() {
  const {
    model, setModel,
    aspectRatio, setAspectRatio,
    quality, setQuality,
    numberOfImages, setNumberOfImages,
  } = useGenerationStore();

  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);

  const currentModel = MODELS.find((m) => m.id === model) || MODELS[0];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Model Selector */}
      <div className="relative">
        <button
          onClick={() => { setShowModelMenu(!showModelMenu); setShowRatioMenu(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5
                     bg-bg-secondary border border-border rounded-full
                     text-xs text-text-primary hover:border-brand/30
                     transition-all duration-200 cursor-pointer"
        >
          <span className="text-brand font-semibold">G</span>
          <span className="font-medium">{currentModel.name}</span>
          <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showModelMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-56 py-1
                            bg-bg-card border border-border rounded-[var(--radius-md)]
                            shadow-lg shadow-black/30 z-50 animate-fade-in">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setModel(m.id); setShowModelMenu(false); }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2
                              text-xs transition-colors cursor-pointer
                              ${model === m.id
                                ? 'text-brand bg-brand/8'
                                : 'text-text-primary hover:bg-bg-elevated'}`}
                >
                  <span className="w-5 h-5 rounded bg-brand/15 flex items-center justify-center text-[10px] text-brand font-bold shrink-0">
                    {m.badge}
                  </span>
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-text-muted text-[10px] mt-0.5">{m.description}</div>
                  </div>
                  {model === m.id && (
                    <svg className="w-3 h-3 text-brand ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Aspect Ratio Selector */}
      <div className="relative">
        <button
          onClick={() => { setShowRatioMenu(!showRatioMenu); setShowModelMenu(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5
                     bg-bg-secondary border border-border rounded-full
                     text-xs text-text-primary hover:border-brand/30
                     transition-all duration-200 cursor-pointer"
        >
          <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          <span className="font-medium">{aspectRatio}</span>
          <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showRatioMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowRatioMenu(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-40 py-1
                            bg-bg-card border border-border rounded-[var(--radius-md)]
                            shadow-lg shadow-black/30 z-50 animate-fade-in max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] text-text-muted uppercase tracking-wider font-medium">
                Aspect ratio
              </div>
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setAspectRatio(r.value); setShowRatioMenu(false); }}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2
                              text-xs transition-colors cursor-pointer
                              ${aspectRatio === r.value
                                ? 'text-brand bg-brand/8'
                                : 'text-text-primary hover:bg-bg-elevated'}`}
                >
                  <span className="text-text-muted w-4 text-center">{r.icon}</span>
                  <span className="font-medium">{r.label}</span>
                  {aspectRatio === r.value && (
                    <svg className="w-3 h-3 text-brand ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quality Selector */}
      <div className="flex items-center bg-bg-secondary border border-border rounded-full overflow-hidden">
        {QUALITY_OPTIONS.map((q) => (
          <button
            key={q.value}
            onClick={() => setQuality(q.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer
                        ${quality === q.value
                          ? 'bg-brand/15 text-brand'
                          : 'text-text-muted hover:text-text-secondary'}`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Count Selector */}
      <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-full px-1">
        <button
          onClick={() => setNumberOfImages(numberOfImages - 1)}
          disabled={numberOfImages <= 1}
          className="w-6 h-6 flex items-center justify-center text-text-muted
                     hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors cursor-pointer text-sm"
        >
          −
        </button>
        <span className="w-5 text-center text-xs font-medium text-text-primary tabular-nums">
          {numberOfImages}
        </span>
        <button
          onClick={() => setNumberOfImages(numberOfImages + 1)}
          disabled={numberOfImages >= 4}
          className="w-6 h-6 flex items-center justify-center text-text-muted
                     hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors cursor-pointer text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}
