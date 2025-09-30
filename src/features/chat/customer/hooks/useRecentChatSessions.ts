/**
 * useRecentChatSessions
 * Loads recent chat sessions for the sidebar and merges with existing list.
 */
import { useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

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
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select(
            `
            session_id,
            customer_id,
            status,
            created_at,
            chat_session_flow!inner(
              flow_id,
              chat_flows!inner(title)
            )
          `
          )
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) return;
        if (sessions && sessions.length > 0) {
          const mapped: ConversationLike[] = (sessions as any[]).map(s => ({
            id: s.session_id,
            title: s.chat_session_flow?.chat_flows?.title || 'Chat',
            createdAt: new Date(s.created_at).getTime(),
            messages: [],
            flowId: s.chat_session_flow?.flow_id || 'about',
            status: s.status === 'ended' ? 'ended' : 'active',
            icon: undefined,
          }));
          setConversations(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const add = mapped.filter(c => !existingIds.has(c.id));
            return [...add, ...prev].sort((a, b) => b.createdAt - a.createdAt);
          });
        }
      } catch {}
    };
    loadRecentSessions();
  }, [setConversations]);
}

export default useRecentChatSessions;
