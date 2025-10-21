import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { supabase } from '@lib/supabase';
import { fetchSessionMessagesV2 } from '@features/chat/api/jsonbChatFlowApi';
import type { ChatMessage } from '@features/chat/types/chat';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

export type AdminChatRole = 'user' | 'printy';

export interface AdminChatMessage {
  id: string;
  role: AdminChatRole;
  text: string;
  ts: number;
}

export interface AdminConversation {
  id: string;
  title: string;
  createdAt: number;
  messages: AdminChatMessage[];
  status: 'active' | 'ended';
  icon?: React.ReactNode;
  flowId?: string;
  sessionId?: string; // Database session ID for admin chats
}

interface AdminConversationsContextValue {
  conversations: AdminConversation[];
  activeId: string | null;
  startConversation: (title: string) => string; // returns id
  addMessage: (role: AdminChatRole, text: string, id?: string) => void;
  endConversation: (id?: string) => void;
  setActive: (id: string | null) => void;
  clear: () => void;
  setConversations: React.Dispatch<React.SetStateAction<AdminConversation[]>>;
  loadAdminChatSessions: () => Promise<void>;
  loadHistoricalMessages: (sessionId: string) => Promise<ChatMessage[]>;
}

const AdminConversationsContext = createContext<
  AdminConversationsContextValue | undefined
>(undefined);

export const AdminConversationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const idCounter = useRef(0);

  // Load admin chat sessions from database
  const loadAdminChatSessions = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions_v2')
        .select(`
          session_id,
          flow_id,
          status,
          created_at,
          display_title,
          metadata->context->display_id,
          inquiry:inquiries_v2!inquiry_id(
            inquiry_id,
            display_id,
            inquiry_type,
            inquiry_status
          ),
          quote:quotes!quote_id(
            quote_id,
            display_id,
            status
          )
        `)
        .or('metadata->admin_chat.eq.true,flow_id.eq.admin-quote-propose,inquiry_id.not.is.null')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading admin chat sessions:', error);
        return;
      }

      if (sessions && sessions.length > 0) {
        const sessionConversations: AdminConversation[] = sessions.map(
          (session: any) => {
            const icon = undefined;

            // Use centralized title logic with optimized data
            const title = getSessionTitle({
              flowId: session.flow_id,
              metadata: {
                title: session.display_title,
                context: {
                  display_id: session.display_id,
                },
              },
              inquiry: session.inquiry,
              quote: session.quote,
              order: session.order,
            });

            return {
              id: session.session_id,
              title,
              createdAt: new Date(session.created_at).getTime(),
              messages: [], // Messages will be loaded when switching to conversation
              status: session.status === 'ended' ? 'ended' : 'active',
              icon,
              flowId: session.flow_id,
              sessionId: session.session_id,
            };
          }
        );

        setConversations(prev => {
          // Merge with existing conversations, avoiding duplicates
          const existingIds = new Set(prev.map(c => c.id));
          const newConversations = sessionConversations.filter(
            c => !existingIds.has(c.id)
          );
          return [...newConversations, ...prev].sort(
            (a, b) => b.createdAt - a.createdAt
          );
        });
      }
    } catch (e) {
      console.error('loadAdminChatSessions error', e);
    }
  };

  // Load historical messages from database
  const loadHistoricalMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const messages = await fetchSessionMessagesV2(sessionId);
      return messages.map(m => ({
        id: m.id,
        role: m.role === 'admin' ? 'user' : 'printy', // Map admin role to user for UI
        text: m.text,
        ts: m.ts,
      }));
    } catch (error) {
      console.error('Failed to load historical messages:', error);
      return [];
    }
  };

  // Load sessions on mount
  useEffect(() => {
    loadAdminChatSessions();
  }, []);

  const startConversation = (title: string) => {
    const id = `admin-conv-${Date.now()}-${++idCounter.current}`;
    const conv: AdminConversation = {
      id,
      title,
      createdAt: Date.now(),
      messages: [],
      status: 'active',
    };
    setConversations(prev => [conv, ...prev]);
    setActiveId(id);
    return id;
  };

  const addMessage = (role: AdminChatRole, text: string, id?: string) => {
    const targetId = id || activeId;
    if (!targetId) return;
    const msg: AdminChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      text,
      ts: Date.now(),
    };
    setConversations(prev =>
      prev.map(c =>
        c.id === targetId ? { ...c, messages: [...c.messages, msg] } : c
      )
    );
  };

  const endConversation = (id?: string) => {
    const targetId = id || activeId;
    if (!targetId) return;
    setConversations(prev =>
      prev.map(c => (c.id === targetId ? { ...c, status: 'ended' } : c))
    );
  };

  const clear = () => setConversations([]);

  const value = useMemo<AdminConversationsContextValue>(
    () => ({
      conversations,
      activeId,
      startConversation,
      addMessage,
      endConversation,
      setActive: setActiveId,
      clear,
      setConversations,
      loadAdminChatSessions,
      loadHistoricalMessages,
    }),
    [conversations, activeId]
  );

  return (
    <AdminConversationsContext.Provider value={value}>
      {children}
    </AdminConversationsContext.Provider>
  );
};

export const useAdminConversations = () => {
  const ctx = useContext(AdminConversationsContext);
  if (!ctx)
    throw new Error(
      'useAdminConversations must be used within AdminConversationsProvider'
    );
  return ctx;
};