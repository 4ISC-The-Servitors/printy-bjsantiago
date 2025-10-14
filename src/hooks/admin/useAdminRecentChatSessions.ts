import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdminConversations } from './useAdminConversations';

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
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select(`
            session_id,
            customer_id,
            status,
            created_at,
            inquiry_id,
            inquiries!inner(inquiry_id, inquiry_type, customer_full_name)
          `)
          .not('inquiry_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) return;
        if (sessions && sessions.length > 0) {
          const mapped: AdminConversationLike[] = (sessions as any[]).map(s => ({
            id: s.session_id,
            title: `Ticket: ${s.inquiries?.inquiry_type || 'Support'}`,
            createdAt: new Date(s.created_at).getTime(),
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
      } catch {}
    };
    loadInquirySessions();
  }, [setConversations]);
}

export default useAdminRecentChatSessions;
