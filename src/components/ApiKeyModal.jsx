import { useState } from 'react';
import useApiStore from '../stores/useApiStore';
import { validateApiKey } from '../services/geminiApi';

/**
 * ApiKeyModal — Full-screen overlay for initial API key configuration.
 * Validates the key with a test request before proceeding.
 */
export default function ApiKeyModal() {
  const [inputKey, setInputKey] = useState('');
  const { setApiKey, setValidating, setError, isValidating, error } = useApiStore();

  const handleConnect = async () => {
    if (!inputKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setValidating(true);
    setError(null);

    const isValid = await validateApiKey(inputKey.trim());

    if (isValid) {
      setApiKey(inputKey.trim());
    } else {
      setError('Invalid API key. Please check and try again.');
    }

    setValidating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-4 p-8 bg-bg-card border border-border rounded-[var(--radius-xl)] animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-brand/15 flex items-center justify-center">
              <span className="text-brand text-xl font-bold">G</span>
            </div>
            <span className="text-xl font-semibold text-text-primary tracking-tight">
              1OF1's
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Nano Banana Pro
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Enter your Gemini API key to start generating images.
            <br />
            Get one at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:text-brand-light transition-colors underline underline-offset-2"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              id="api-key-input"
              type="password"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isValidating}
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-[var(--radius-md)]
                         text-text-primary placeholder-text-muted text-sm
                         focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20
                         transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            {isValidating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin-slow" />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-error animate-fade-in">{error}</p>
          )}

          <button
            id="connect-btn"
            onClick={handleConnect}
            disabled={isValidating || !inputKey.trim()}
            className="w-full py-3 px-4 bg-brand text-bg-primary font-semibold text-sm
                       rounded-[var(--radius-md)] cursor-pointer
                       hover:bg-brand-light active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand"
          >
            {isValidating ? 'Validating...' : 'Connect'}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-muted">
          Your key is stored locally and never sent to third parties.
        </p>
      </div>
    </div>
  );
}
