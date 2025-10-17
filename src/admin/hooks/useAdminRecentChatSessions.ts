import { useEffect } from 'react';
import { getAdminInquirySessions } from '@features/chat/api/sessionQueries';

export interface AdminConversationLike {
  id: string;
  title: string;
  createdAt: number;
  messages: any[];
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

export function useAdminRecentChatSessions(
  setConversations: (
    updater: (prev: AdminConversationLike[]) => AdminConversationLike[]
  ) => void
) {
  useEffect(() => {
    const loadInquirySessions = async () => {
      try {
        // Use new sessionQueries to get admin inquiry sessions from chat_sessions_v2
        const sessions = await getAdminInquirySessions();

        if (sessions && sessions.length > 0) {
          const mapped: AdminConversationLike[] = sessions.slice(0, 10).map(s => ({
            id: s.sessionId,
            title: `Ticket: ${s.inquiry?.inquiry_type || 'Support'}`,
            createdAt: s.createdAt,
            messages: [],
            status: s.status === 'ended' ? 'ended' : 'active',
            icon: undefined,
          }));
          setConversations(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const add = mapped.filter(c => !existingIds.has(c.id));
            return [...add, ...prev].sort((a, b) => b.createdAt - a.createdAt);
          });
        }
      } catch (error) {
        console.error('Failed to load admin inquiry sessions:', error);
      }
    };
    loadInquirySessions();
  }, [setConversations]);
}

export default useAdminRecentChatSessions;
