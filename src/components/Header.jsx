import useHistoryStore from '../stores/useHistoryStore';

export default function Header() {
  const { items, clearAll } = useHistoryStore();

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-brand/15 flex items-center justify-center">
          <span className="text-brand text-sm font-bold">G</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            1OF1's
          </span>
          <span className="text-xs text-text-muted">·</span>
          <span className="text-xs text-text-secondary">Nano Banana Pro</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary
                       border border-transparent hover:border-border
                       rounded-[var(--radius-sm)] transition-all duration-200 cursor-pointer"
            title="Clear history"
          >
            Clear History
          </button>
        )}

      </div>
    </header>
  );
}
