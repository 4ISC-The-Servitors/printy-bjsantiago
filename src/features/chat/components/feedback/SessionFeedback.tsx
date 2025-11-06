import React, { useState } from 'react';
import { Star, Check } from 'lucide-react';
import Modal from '@shared/components/ui/Modal';
import { submitSessionFeedback } from '../../api/feedbackApi';

interface SessionFeedbackProps {
  sessionId: string;
  userRole: 'customer' | 'admin';
  isOpen?: boolean; // Only used for modal mode
  onClose?: () => void; // Only used for modal mode
  onSubmitted?: () => void;
  isModal?: boolean; // If true, render as modal; if false, render inline
}

/**
 * SessionFeedback Component
 * Displays a 5-star rating widget in a modal that appears after a chat session ends.
 * Users can optionally rate their experience with Printy.
 */
export const SessionFeedback: React.FC<SessionFeedbackProps> = ({
  sessionId,
  userRole,
  isOpen = false,
  onClose,
  onSubmitted,
  isModal = true,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStarClick = async (rating: number) => {
    if (isSubmitting || isSubmitted) return;

    setSelectedRating(rating);
    setIsSubmitting(true);

    const result = await submitSessionFeedback({
      sessionId,
      rating,
      userRole,
    });

    if (result) {
      setIsSubmitted(true);
      setIsSubmitting(false);
      onSubmitted?.();
    } else {
      // Reset on error
      setSelectedRating(0);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && onClose) {
      onClose();
    }
  };

  // Inline feedback content (used for historical conversations)
  const renderFeedbackContent = () => {
    if (isSubmitted) {
      // Success state
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-full bg-success/10 p-3">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm font-medium text-success">
            Thank you for your feedback!
          </p>
        </div>
      );
    }

    // Rating prompt
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <p className="text-sm font-medium text-neutral-700 text-center">
          How did Printy do? Help us improve your experience!
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => {
            const isActive =
              (!selectedRating && star <= hoveredRating) ||
              (selectedRating && star <= selectedRating);
            
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                disabled={isSubmitting}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className={`transition-transform ${'duration-quick'} ${'ease-out'} ${
                  isSubmitting
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:scale-110 active:scale-95'
                }`}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                title={`${star} star${star !== 1 ? 's' : ''}`}
              >
                <Star
                  size={32}
                  className={
                    isActive
                      ? 'fill-brand-accent stroke-brand-accent'
                      : 'fill-transparent stroke-neutral-300'
                  }
                />
              </button>
            );
          })}
        </div>
        
        {isSubmitting && (
          <p className="text-xs text-neutral-500">Submitting...</p>
        )}
      </div>
    );
  };

  // Inline mode (for historical conversations)
  if (!isModal) {
    return (
      <div className="mt-6 pb-4">
        {renderFeedbackContent()}
      </div>
    );
  }

  // Modal mode (for current conversation ending)
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header with close button only */}
        <div className="flex items-center justify-end device-spacing-component pb-2 pt-2">
          <button
            onClick={handleClose}
            className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="device-spacing-component pb-4 pt-2">
          {isSubmitted ? (
            // Success state
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="rounded-full bg-success/10 p-3">
                <Check className="w-6 h-6 text-success" />
              </div>
              <p className="text-sm font-medium text-success">
                Thank you for your feedback!
              </p>
            </div>
          ) : (
            // Rating prompt
            <div className="flex flex-col items-center gap-3 pb-2">
              <p className="text-lg font-semibold text-neutral-700 text-center">
                How did Printy do? Help us improve your experience!
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => {
                  const isActive =
                    (!selectedRating && star <= hoveredRating) ||
                    (selectedRating && star <= selectedRating);
                  
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      disabled={isSubmitting}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className={`transition-transform ${'duration-quick'} ${'ease-out'} ${
                        isSubmitting
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:scale-110 active:scale-95'
                      }`}
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                      title={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Star
                        size={48}
                        className={
                          isActive
                            ? 'fill-brand-accent stroke-brand-accent'
                            : 'fill-transparent stroke-neutral-300'
                        }
                      />
                    </button>
                  );
                })}
              </div>
              
              {isSubmitting && (
                <p className="text-xs text-neutral-500 mt-1">Submitting...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SessionFeedback;

