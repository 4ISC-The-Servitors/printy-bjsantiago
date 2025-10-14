import React from 'react';
import type { QuickReply } from '../types';

interface QuickReplyGridProps {
  replies: QuickReply[];
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
}

/**
 * Quick Reply Grid Component with 3D styled buttons
 * Handles both regular quick replies and end chat actions
 */
export const QuickReplyGrid: React.FC<QuickReplyGridProps> = ({
  replies,
  onQuickReply,
  onEndChat,
}) => {
  const endLabels = new Set([
    'end',
    'end chat',
    'close chat',
    'end conversation',
    'finish',
    'done',
  ]);

  return (
    <div className="flex flex-wrap gap-3 mt-3 ml-6 sm:gap-3 sm:ml-8">
      {replies.map((reply, index) => {
        const isEnd = endLabels.has(reply.label.trim().toLowerCase());
        const handleClick = () => {
          if (isEnd) {
            onEndChat?.();
          } else {
            onQuickReply?.(reply.value);
          }
        };

        return (
          <button
            key={index}
            onClick={handleClick}
            className={`
              btn-3d px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium
              ${isEnd ? 'btn-secondary' : 'btn-primary'}
            `}
          >
            {reply.label}
          </button>
        );
      })}
    </div>
  );
};

export default QuickReplyGrid;
