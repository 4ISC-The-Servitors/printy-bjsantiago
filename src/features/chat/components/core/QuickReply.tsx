import React from 'react';
import type { QuickReply } from '@features/chat/types';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import { auth } from '@lib/supabase';

interface QuickReplyGridProps {
  replies: QuickReply[];
  onQuickReply?: (data: { value: string; label: string }) => void;
  onEndChat?: () => void;
  userRole?: 'admin' | 'customer';
  sessionId?: string;
  conversationId?: string;
  readOnly?: boolean;
}

/**
 * Quick Reply Grid Component with 3D styled buttons
 * Handles both regular quick replies and end chat actions
 */
export const QuickReplyGrid: React.FC<QuickReplyGridProps> = ({
  replies,
  onQuickReply,
  onEndChat,
  userRole,
  sessionId,
  conversationId,
  readOnly = false,
}) => {
  const endLabels = new Set([
    'end',
    'end chat',
    'close chat',
    'end conversation',
    'finish',
    'done',
  ]);

  const secondaryLabels = new Set([
    'cancel order',
    'cancel request',
    'cancel',
    'back to main menu',
    'back to payment options',
    'create a new category',
    'back to all options',
    'back to all questions',
  ]);

  const handleEndChat = async () => {
    // Don't allow ending chat if already read-only (ended)
    if (readOnly) {
      console.warn('Chat is already ended, cannot end again');
      return;
    }

    if (!sessionId || !userRole) {
      // Fallback to legacy behavior if no session info provided
      onEndChat?.();
      return;
    }

    try {
      // Check if session is already ended before attempting to end it
      const isEnded = await ChatEndService.isSessionEnded(sessionId);
      if (isEnded) {
        console.warn('Session is already ended, cannot end again');
        return;
      }

      // Get current user
      const { data: userData } = await auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      // Use the unified service - this adds the end message to the database
      // Don't pass endMessage - let ChatEndService use its default
      const result = await ChatEndService.endChatSession({
        sessionId,
        userId,
        userType: userRole,
        conversationId,
      });

      if (result.success) {
        onEndChat?.();
      } else {
        console.error('Failed to end chat:', result.error);
      }
    } catch (error) {
      console.error('Error ending chat from quick reply:', error);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mt-3 ml-6 sm:gap-3 sm:ml-8">
      {replies.map((reply, index) => {
        const normalizedLabel = reply.label.trim().toLowerCase();
        const isEnd = endLabels.has(normalizedLabel);
        const isSecondary = secondaryLabels.has(normalizedLabel);
        const handleClick = () => {
          if (isEnd) {
            void handleEndChat();
          } else {
            // Compose a robust value that includes both id and label for server-side routing.
            // If value already contains a pipe (id|label), keep as-is; otherwise append label.
            const valueWithLabel = reply.value.includes('|')
              ? reply.value
              : `${reply.value}|${reply.label}`;
            const displayLabel = valueWithLabel.split('|')[1] || reply.label;

            // Pass both value (for routing) and label (for display) as an object
            // The handler will extract what it needs
            onQuickReply?.({ value: valueWithLabel, label: displayLabel });
          }
        };

        return (
          <button
            key={index}
            type="button"
            onClick={handleClick}
            className={`
              btn-3d px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium
              ${isEnd || isSecondary ? 'btn-secondary' : 'btn-primary'}
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
