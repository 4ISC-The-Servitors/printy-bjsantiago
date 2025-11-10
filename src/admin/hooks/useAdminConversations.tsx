import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
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
  endedAt?: number; // When the chat ended (for ended chats)
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
  loadMoreAdminChatSessions: () => Promise<void>;
  loadAllAdminChatSessions: () => Promise<void>;
  loadHistoricalMessages: (sessionId: string) => Promise<ChatMessage[]>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
}

const AdminConversationsContext = createContext<
  AdminConversationsContextValue | undefined
>(undefined);

export const AdminConversationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const loadedDbIdsRef = useRef<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const adminIdRef = useRef<string | null>(null);

  const fetchSessions = useCallback(
    async (page: number, replace: boolean = page === 1) => {
      if (replace) {
        setLoading(true);
        loadedPagesRef.current.clear();
        loadedDbIdsRef.current.clear();
      } else {
        if (loadingMore) return;
        setLoadingMore(true);
      }

      try {
        if (!adminIdRef.current) {
          const { data: userData, error: userError } =
            await supabase.auth.getUser();

          if (userError || !userData?.user?.id) {
            console.error('Error getting current admin user:', userError);
            return;
          }

          adminIdRef.current = userData.user.id;
        }

        const currentAdminId = adminIdRef.current;
        if (!currentAdminId) return;

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const {
          data: sessions,
          error,
          count,
        } = await supabase
          .from('chat_sessions_v2')
          .select(
            `
            session_id,
            flow_id,
            status,
            created_at,
            ended_at,
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
            ),
            order:orders!order_id(
              order_id,
              display_id,
              status
            )
          `,
            { count: 'exact' }
          )
          .eq('customer_id', currentAdminId)
          .or('metadata->admin_chat.eq.true,flow_id.eq.admin-quote-propose')
          .is('metadata->ticket_conversation', null)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('Error loading admin chat sessions:', error);
          return;
        }

        const sessionConversations: AdminConversation[] = (sessions || []).map(
          (session: any) => {
            const icon = undefined;
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
              endedAt: session.ended_at
                ? new Date(session.ended_at).getTime()
                : undefined,
              messages: [],
              status: session.status === 'ended' ? 'ended' : 'active',
              icon,
              flowId: session.flow_id,
              sessionId: session.session_id,
            };
          }
        );

        let merged: AdminConversation[] = [];
        setConversations(prev => {
          const sessionIds = new Set(sessionConversations.map(c => c.id));
          const preserved = replace
            ? prev.filter(c => !sessionIds.has(c.id))
            : prev;

          const map = new Map<string, AdminConversation>();
          for (const conv of preserved) {
            map.set(conv.id, conv);
          }
          for (const conv of sessionConversations) {
            map.set(conv.id, conv);
          }

          merged = Array.from(map.values()).sort(
            (a, b) => b.createdAt - a.createdAt
          );
          return merged;
        });

        if (replace) {
          loadedDbIdsRef.current.clear();
          loadedPagesRef.current.clear();
          setCurrentPage(1);
        } else {
          setCurrentPage(prev => Math.max(prev, page));
        }

        sessionConversations.forEach(conv => {
          const key = conv.sessionId || conv.id;
          loadedDbIdsRef.current.add(key);
        });
        loadedPagesRef.current.add(page);

        const total = count ?? loadedDbIdsRef.current.size;
        setTotalCount(total);
        setHasMore(loadedDbIdsRef.current.size < total);
      } catch (e) {
        console.error('loadAdminChatSessions error', e);
      } finally {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [PAGE_SIZE, loadingMore]
  );

  const loadAdminChatSessions = useCallback(async () => {
    await fetchSessions(1, true);
  }, [fetchSessions]);

  const loadMoreAdminChatSessions = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    if (loadedPagesRef.current.has(nextPage)) return;
    await fetchSessions(nextPage, false);
  }, [currentPage, fetchSessions, hasMore, loading, loadingMore]);

  const loadAllAdminChatSessions = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    for (let page = currentPage + 1; page <= totalPages; page += 1) {
      if (loadedPagesRef.current.has(page)) continue;
      await fetchSessions(page, false);
    }
  }, [currentPage, fetchSessions, hasMore, loading, loadingMore, totalCount]);

  // Load historical messages from database
  const loadHistoricalMessages = async (
    sessionId: string
  ): Promise<ChatMessage[]> => {
    try {
      const messages = await fetchSessionMessagesV2(sessionId);
      return messages.map(m => ({
        id: m.id,
        role: m.role === 'admin' ? 'user' : 'printy', // Map admin role to user for UI
        text: m.text,
        ts: m.ts,
        metadata: m.metadata || null,
        isHistorical: true, // Mark all loaded messages as historical to prevent typing animations
      }));
    } catch (error) {
      console.error('Failed to load historical messages:', error);
      return [];
    }
  };

  // Load sessions on mount
  useEffect(() => {
    void loadAdminChatSessions();
  }, [loadAdminChatSessions]);

  const startConversation = (title: string) => {
    const id = crypto.randomUUID();
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
      loadMoreAdminChatSessions,
      loadAllAdminChatSessions,
      loadHistoricalMessages,
      loading,
      loadingMore,
      hasMore,
      totalCount,
    }),
    [
      conversations,
      activeId,
      loadAdminChatSessions,
      loadMoreAdminChatSessions,
      loadAllAdminChatSessions,
      loading,
      loadingMore,
      hasMore,
      loadHistoricalMessages,
      totalCount,
    ]
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
