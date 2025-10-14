import React, { useEffect, useRef, useState } from 'react';
import { renderInlineTurnstile } from '../../lib/turnstile';

interface TurnstileProps {
  action: string;
  onTokenReceived?: (token: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  appearance?: 'always' | 'interaction-only';
}

const Turnstile: React.FC<TurnstileProps> = ({
  action,
  onTokenReceived,
  onError,
  className = '',
  appearance = 'always'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerId = `turnstile-${action}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    let isMounted = true;

    const initializeTurnstile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait a bit for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted || !containerRef.current) return;

        // Render the Turnstile widget
        await renderInlineTurnstile(containerId, action, appearance);
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load Turnstile';
          setError(errorMessage);
          setIsLoading(false);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        }
      }
    };

    initializeTurnstile();

    return () => {
      isMounted = false;
    };
  }, [action, appearance, containerId, onError]);

  return (
    <div className={`turnstile-container ${className}`}>
      <div
        ref={containerRef}
        id={containerId}
        className="flex items-center justify-center min-h-[65px]"
      >
        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
            <span>Loading verification...</span>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <p>Verification failed. Please refresh the page and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Turnstile;
