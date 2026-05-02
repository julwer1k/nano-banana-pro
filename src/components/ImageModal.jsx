import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { downloadImage } from '../utils/imageUtils';
import { MODELS, RESOLUTION_MAP } from '../utils/constants';
import useGenerationStore from '../stores/useGenerationStore';
import useHistoryStore from '../stores/useHistoryStore';

export default function ImageModal({ item, onClose }) {
  const { reuseFromHistory } = useGenerationStore();
  const { getFullBlob } = useHistoryStore();
  const [copied, setCopied] = useState(false);
  const [fullSrc, setFullSrc] = useState(item.resultThumbnail || '');
  const [fullBlob, setFullBlob] = useState(null);

  const modelInfo = MODELS.find((m) => m.id === item.model) || MODELS[0];
  const resolution = RESOLUTION_MAP[item.aspectRatio]?.[item.quality] || '';

  useEffect(() => {
    let cancelled = false;
    getFullBlob(item.id).then((blob) => {
      if (cancelled || !blob?.resultImage) return;
      setFullBlob(blob);
      setFullSrc(`data:${blob.resultMimeType || 'image/png'};base64,${blob.resultImage}`);
    });
    return () => { cancelled = true; };
  }, [item.id, getFullBlob]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.prompt || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReuse = async () => {
    await reuseFromHistory(item);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = () => {
    if (!fullBlob?.resultImage) return;
    const ts = new Date(item.timestamp).toISOString().slice(0, 10);
    downloadImage(fullBlob.resultImage, `1of1s-${ts}.png`, fullBlob.resultMimeType);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-5xl max-h-[90vh] mx-4 flex bg-bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden animate-fade-in-up">

        {/* Image side */}
        <div className="flex-1 min-w-0 bg-bg-primary flex items-center justify-center p-4">
          <img src={fullSrc} alt="" className="max-w-full max-h-[80vh] object-contain rounded-[var(--radius-md)]" />
        </div>

        {/* Info panel */}
        <div className="w-80 shrink-0 border-l border-border flex flex-col overflow-y-auto">
          {/* Close */}
          <div className="flex justify-end p-3">
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center hover:bg-bg-hover transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 px-4 pb-4 space-y-5">
            {/* Reference images */}
            {item.referenceImages?.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Reference Images</h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.referenceImages.map((ref) => (
                    <img key={ref.id} src={ref.preview} alt={ref.name} className="w-10 h-10 rounded-[var(--radius-sm)] object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Prompt</h3>
                <button onClick={handleCopy} className="text-[10px] text-text-muted hover:text-brand transition-colors cursor-pointer">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-3 bg-bg-secondary rounded-[var(--radius-md)] border border-border">
                <pre className="text-xs text-text-primary whitespace-pre-wrap break-words font-mono leading-relaxed">{item.prompt}</pre>
              </div>
            </div>

            {/* Model info */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Information</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Model</span><span className="text-text-primary font-medium">{modelInfo.name}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Quality</span><span className="text-text-primary font-medium">{item.quality}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Aspect Ratio</span><span className="text-text-primary font-medium">{item.aspectRatio}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Size</span><span className="text-text-primary font-medium">{resolution}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Generated</span><span className="text-text-primary font-medium">{new Date(item.timestamp).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button onClick={handleReuse} className="flex-1 py-2 text-xs font-medium text-brand border border-brand/30 rounded-[var(--radius-md)] hover:bg-brand/10 transition-colors cursor-pointer">
                Reuse
              </button>
              <button onClick={handleDownload} className="flex-1 py-2 text-xs font-medium text-text-primary bg-bg-elevated rounded-[var(--radius-md)] hover:bg-bg-hover transition-colors cursor-pointer">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
