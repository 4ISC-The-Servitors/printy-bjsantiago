import React, { useState } from 'react';
import { Star, Check } from 'lucide-react';
import { submitSessionFeedback } from '../../api/feedbackApi';

interface SessionFeedbackProps {
  sessionId: string;
  userRole: 'customer' | 'admin';
  onSubmitted?: () => void;
}

/**
 * SessionFeedback Component
 * Displays a 5-star rating widget that appears after a chat session ends.
 * Users can optionally rate their experience with Printy.
 */
export const SessionFeedback: React.FC<SessionFeedbackProps> = ({
  sessionId,
  userRole,
  onSubmitted,
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
      
      // Show success message for 3 seconds before calling parent
      setTimeout(() => {
        onSubmitted?.();
      }, 3000);
    } else {
      // Reset on error
      setSelectedRating(0);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 pb-4">
      {isSubmitted ? (
        // Success state
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-full bg-success/10 p-3">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm font-medium text-success">
            Thank you for your feedback!
          </p>
        </div>
      ) : (
        // Rating prompt
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm font-medium text-neutral-700 text-center">
            How did I do? Help us improve your experience!
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
      )}
    </div>
  );
};

export default SessionFeedback;

