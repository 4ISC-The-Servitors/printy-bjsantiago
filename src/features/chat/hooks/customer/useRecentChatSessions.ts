/**
 * useRecentChatSessions
 * Loads recent chat sessions for the sidebar and merges with existing list.
 * 
 * NOTE: Migrated to use chat_sessions_v2 (JSONB flow system)
 */
import { useEffect } from 'react';
import { getUserSessionsV2 } from '@features/chat/api/jsonbChatFlowApi';

export interface ConversationLike {
  id: string;
  title: string;
  createdAt: number;
  messages: any[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

// Flow ID to title mapping (fallback if flow definition not available)
const FLOW_TITLES: Record<string, string> = {
  'ask-quote': 'Ask Quote',
  'issue-ticket': 'Ask Assistance',
  'customer-track-ticket': 'Track Ticket',
  'upload-payment': 'Upload Payment',
  'track-order': 'Track Order',
  'about': 'About B.J. Santiago',
};

export function useRecentChatSessions(
  setConversations: (
    updater: (prev: ConversationLike[]) => ConversationLike[]
  ) => void
) {
  useEffect(() => {
    const loadRecentSessions = async () => {
      try {
        // Fetch from chat_sessions_v2 using the JSONB flow API
        const sessions = await getUserSessionsV2();
        
        if (sessions && sessions.length > 0) {
          const mapped: ConversationLike[] = sessions.slice(0, 10).map(s => ({
            id: s.sessionId,
            title: FLOW_TITLES[s.flowId] || s.flowId || 'Chat',
            createdAt: s.createdAt,
            messages: [],
            flowId: s.flowId || 'about',
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
        console.error('Failed to load recent chat sessions:', error);
      }
    };
    loadRecentSessions();
  }, [setConversations]);
}

export default useRecentChatSessions;
