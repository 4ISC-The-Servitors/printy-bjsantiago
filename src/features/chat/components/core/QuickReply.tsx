import React from 'react';
import type { QuickReply } from '@features/chat/types';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import { auth } from '@lib/supabase';

interface QuickReplyGridProps {
  replies: QuickReply[];
  onQuickReply?: (value: string) => void;
  onEndChat?: () => void;
  userRole?: 'admin' | 'customer';
  sessionId?: string;
  conversationId?: string;
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
}) => {
  const endLabels = new Set([
    'end',
    'end chat',
    'close chat',
    'end conversation',
    'finish',
    'done',
  ]);

  const handleEndChat = async () => {
    if (!sessionId || !userRole) {
      // Fallback to legacy behavior if no session info provided
      onEndChat?.();
      return;
    }

    try {
      // Get current user
      const { data: userData } = await auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      // Use the unified service - this adds the end message to the database
      const result = await ChatEndService.endChatSession({
        sessionId,
        userId,
        userType: userRole,
        conversationId,
        endMessage: userRole === 'admin'
          ? "This conversation has been ended by the administrator."
          : ChatEndService.DEFAULT_END_MESSAGE
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
        const isEnd = endLabels.has(reply.label.trim().toLowerCase());
        const handleClick = () => {
          if (isEnd) {
            void handleEndChat();
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
