/**
 * Loader — Skeleton placeholder card shown during image generation.
 */
export default function Loader() {
  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden border border-border bg-bg-card animate-fade-in-up">
      <div className="aspect-[3/4] skeleton-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        <div className="h-2.5 w-1/2 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
