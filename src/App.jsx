import { useEffect } from 'react';
import useApiStore from './stores/useApiStore';
import useGenerationStore from './stores/useGenerationStore';
import useHistoryStore from './stores/useHistoryStore';
import ApiKeyModal from './components/ApiKeyModal';
import Header from './components/Header';
import PromptPanel from './components/PromptPanel';
import ImageUpload from './components/ImageUpload';
import ConfigBar from './components/ConfigBar';
import GenerateButton from './components/GenerateButton';
import ResultsGrid from './components/ResultsGrid';

export default function App() {
  const { isConnected } = useApiStore();
  const { error } = useGenerationStore();
  const { pruneExpired } = useHistoryStore();

  // Prune expired history items on mount
  useEffect(() => {
    pruneExpired();
    const interval = setInterval(pruneExpired, 5 * 60 * 1000); // Every 5 min
    return () => clearInterval(interval);
  }, [pruneExpired]);

  if (!isConnected) {
    return <ApiKeyModal />;
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-5 gap-5">
        {/* Input section */}
        <div className="bg-bg-secondary border border-border rounded-[var(--radius-xl)] p-5 space-y-4">
          <PromptPanel />
          <ImageUpload />

          {/* Error display */}
          {error && (
            <div className="px-3 py-2 bg-error/10 border border-error/20 rounded-[var(--radius-md)] text-xs text-error animate-fade-in">
              {error}
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
            <ConfigBar />
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <GenerateButton />
            </div>
          </div>
        </div>

        {/* Results */}
        <ResultsGrid />
      </main>
    </div>
  );
}
