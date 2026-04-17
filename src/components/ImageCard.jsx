import { useState } from 'react';
import useGenerationStore from '../stores/useGenerationStore';
import { downloadImage } from '../utils/imageUtils';
import { MODELS, RESOLUTION_MAP } from '../utils/constants';

export default function ImageCard({ item, onExpand }) {
  const { reuseFromHistory } = useGenerationStore();
  const [isLoaded, setIsLoaded] = useState(false);

  const modelInfo = MODELS.find((m) => m.id === item.model) || MODELS[0];
  const resolution = RESOLUTION_MAP[item.aspectRatio]?.[item.quality] || '';

  const handleReuse = (e) => {
    e.stopPropagation();
    reuseFromHistory(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const ts = new Date(item.timestamp).toISOString().slice(0, 10);
    downloadImage(item.resultImage, `1of1s-${ts}-${item.id.slice(0, 6)}.png`, item.resultMimeType);
  };

  const src = item.resultThumbnail || `data:${item.resultMimeType || 'image/png'};base64,${item.resultImage}`;

  return (
    <div onClick={() => onExpand(item)}
      className="group relative rounded-[var(--radius-lg)] overflow-hidden border border-border bg-bg-card cursor-pointer hover:border-brand/30 hover:scale-[1.02] transition-all duration-300 animate-fade-in-up">
      <div className="aspect-[3/4] bg-bg-secondary overflow-hidden">
        <img src={src} alt="" loading="lazy" onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
        {!isLoaded && <div className="absolute inset-0 skeleton-shimmer" />}
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
        <div className="flex justify-end gap-1.5">
          <button onClick={handleReuse} title="Reuse" className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-brand/30 transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
          </button>
          <button onClick={handleDownload} title="Download" className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-brand/30 transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onExpand(item); }} title="Expand" className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-brand/30 transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
          </button>
        </div>
        <div>
          <p className="text-white text-[11px] font-medium line-clamp-2 mb-1">{item.prompt?.slice(0, 80)}</p>
          <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
            <span>{modelInfo.name}</span><span>·</span><span>{item.quality}</span><span>·</span><span>{item.aspectRatio}</span>
          </div>
        </div>
      </div>
      <div className="p-2.5 group-hover:opacity-0 transition-opacity duration-200">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <span className="text-brand font-semibold">G</span>
          <span>{modelInfo.name}</span>
          <span className="ml-auto">{resolution}</span>
        </div>
      </div>
    </div>
  );
}
