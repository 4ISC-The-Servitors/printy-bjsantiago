import React from 'react';
import { FileText } from 'lucide-react';

export interface SpecEditorReopenBubbleProps {
  className?: string;
  fixedPosition?: boolean; // if true, use fixed bottom-right placement
  ariaLabel?: string;
}

/**
 * Floating bubble that appears when the Spec Editor is minimized.
 * Listens for window events:
 *  - 'spec-editor-minimized' => show
 *  - 'spec-editor-reopened' or 'spec-editor-hidden' => hide
 * Clicking the bubble dispatches 'spec-editor-reopen'.
 */
const SpecEditorReopenBubble: React.FC<SpecEditorReopenBubbleProps> = ({
  className,
  fixedPosition = true,
  ariaLabel = 'Open Spec Editor',
}) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onMinimized = () => setVisible(true);
    const onReopened = () => setVisible(false);
    const onHidden = () => setVisible(false);
    window.addEventListener('spec-editor-minimized', onMinimized);
    window.addEventListener('spec-editor-reopened', onReopened);
    window.addEventListener('spec-editor-hidden', onHidden);
    return () => {
      window.removeEventListener('spec-editor-minimized', onMinimized);
      window.removeEventListener('spec-editor-reopened', onReopened);
      window.removeEventListener('spec-editor-hidden', onHidden);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new Event('spec-editor-reopen'))}
      className={`${fixedPosition ? 'fixed right-3 bottom-20 sm:right-4 sm:bottom-24' : ''} z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg bg-brand-primary hover:bg-brand-primary-900 focus:outline-none focus:ring-2 focus:ring-brand-primary text-white flex items-center justify-center ${className ?? ''}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary-50" />
    </button>
  );
};

export default SpecEditorReopenBubble;
