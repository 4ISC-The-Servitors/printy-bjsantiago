/**
 * useRecentChatSessions
 * Loads recent chat sessions for the sidebar and merges with existing list.
 *
 * NOTE: Migrated to use chat_sessions_v2 (JSONB flow system)
 */
import { useEffect } from 'react';
import { getUserSessions } from '@features/chat/api/sessionQueries';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';
import { auth } from '@lib/supabase';

export interface ConversationLike {
  id: string;
  title: string;
  createdAt: number;
  messages: any[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

export function useRecentChatSessions(
  setConversations: (
    updater: (prev: ConversationLike[]) => ConversationLike[]
  ) => void
) {
  useEffect(() => {
    const loadRecentSessions = async () => {
      try {
        // Get current user ID
        const { data: userData } = await auth.getUser();
        if (!userData?.user?.id) return;

        // Fetch from chat_sessions_v2 with FK relationships
        const sessions = await getUserSessions(userData.user.id);

        if (sessions && sessions.length > 0) {
          const mapped: ConversationLike[] = sessions.slice(0, 10).map(s => {
            // Generate title with FK relationships for consistency
            // For sessions with metadata.context (like track-quote with subject), preserve it
            // For sessions with FK relationships (like track-ticket), use display_id from FK
            const displayIdFromFK = s.inquiry?.display_id || s.quote?.display_id || s.order?.display_id;
            const context = s.metadata?.context
              ? { ...s.metadata.context, display_id: s.metadata.context.display_id || s.metadata.context.subject || displayIdFromFK }
              : displayIdFromFK
                ? { display_id: displayIdFromFK }
                : undefined;

            const title = getSessionTitle({
              flowId: s.flowId,
              metadata: s.metadata ? {
                ...s.metadata,
                context,
              } : undefined,
              inquiry: s.inquiry,
              quote: s.quote,
              order: s.order,
            });

            return {
              id: s.sessionId,
              title,
              createdAt: s.createdAt,
              messages: [],
              flowId: s.flowId,
              status: s.status === 'ended' ? 'ended' : 'active',
              icon: undefined,
            };
          });

          setConversations(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const add = mapped.filter(c => !existingIds.has(c.id));
            return [...add, ...prev].sort((a, b) => b.createdAt - a.createdAt);
          });
        }
      } catch (error) {
        console.error('Failed to load recent chat sessions:', error);
      }
    };
    loadRecentSessions();
  }, [setConversations]);
}

export default useRecentChatSessions;
