import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@lib/supabase';
import type { ConversationItem } from '@features/chat/hooks/shared/useConversationState';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

interface SessionCacheContextValue {
  sessions: ConversationItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addSession: (session: ConversationItem) => void;
  updateSession: (
    sessionId: string,
    updates: Partial<ConversationItem>
  ) => void;
}

const SessionCacheContext = createContext<SessionCacheContextValue | null>(
  null
);

interface SessionCacheProviderProps {
  children: ReactNode;
  customerId?: string;
}

export const SessionCacheProvider: React.FC<SessionCacheProviderProps> = ({
  children,
  customerId,
}) => {
  const [sessions, setSessions] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions_v2')
        .select(
          `
          session_id,
          flow_id,
          customer_id,
          status,
          created_at,
          ended_at,
          metadata,
          inquiry_id,
          quote_id,
          order_id,
          display_title,
          inquiries_v2!chat_sessions_v2_inquiry_id_fkey (
            inquiry_id,
            display_id,
            inquiry_type,
            inquiry_status
          ),
          quotes!chat_sessions_v2_quote_id_fkey (
            quote_id,
            display_id,
            status
          ),
          orders!chat_sessions_v2_order_id_fkey (
            order_id,
            display_id,
            status,
            total_amount
          )
        `
        )
        .eq('customer_id', customerId)
        .is('metadata->ticket_conversation', null)
        .order('created_at', { ascending: false });

      if (sessionError) {
        console.error('Error loading sessions:', sessionError);
        setError(sessionError.message);
        return;
      }

      const processedSessions: ConversationItem[] = (sessionData || [])
        .filter(session => {
          // Defense-in-depth: Filter out ticket conversation sessions
          const metadata = (session.metadata as any) || {};
          return !metadata.ticket_conversation;
        })
        .map(session => {
          const metadata = (session.metadata as any) || {};

          // Generate session title - handle array types from Supabase joins
          const inquiry = Array.isArray(session.inquiries_v2)
            ? session.inquiries_v2[0]
            : session.inquiries_v2;
          const quote = Array.isArray(session.quotes)
            ? session.quotes[0]
            : session.quotes;
          const order = Array.isArray(session.orders)
            ? session.orders[0]
            : session.orders;

          const sessionTitle = getSessionTitle({
            flowId: session.flow_id || 'about',
            metadata: {
              ...metadata,
              context: {
                ...metadata.context,
                display_id:
                  metadata.context?.display_id ||
                  inquiry?.display_id ||
                  quote?.display_id ||
                  order?.display_id,
              },
            },
            inquiry: inquiry,
            quote: quote,
            order: order,
          });

          return {
            id: session.session_id,
            title: sessionTitle,
            createdAt: new Date(session.created_at).getTime(),
            messages: [], // Messages will be loaded when switching to conversation
            flowId: session.flow_id || 'about',
            status: session.status === 'ended' ? 'ended' : 'active',
            icon: undefined,
            context: {
              orderId: session.order_id,
              inquiryId: session.inquiry_id,
              quoteId: session.quote_id,
              displayId:
                metadata.context?.display_id ||
                inquiry?.display_id ||
                quote?.display_id ||
                order?.display_id,
            },
          };
        });

      setSessions(processedSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load sessions when customerId changes
  useEffect(() => {
    if (customerId) {
      loadSessions();
    }
  }, [customerId]);

  // Refetch function for manual refresh
  const refetch = () => {
    loadSessions();
  };

  // Add new session to cache
  const addSession = (newSession: ConversationItem) => {
    setSessions(prev => [newSession, ...prev]);
  };

  // Update existing session in cache
  const updateSession = (
    sessionId: string,
    updates: Partial<ConversationItem>
  ) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const value: SessionCacheContextValue = {
    sessions,
    loading,
    error,
    refetch,
    addSession,
    updateSession,
  };

  return (
    <SessionCacheContext.Provider value={value}>
      {children}
    </SessionCacheContext.Provider>
  );
};

export const useSessionCache = (): SessionCacheContextValue => {
  const context = useContext(SessionCacheContext);
  if (!context) {
    throw new Error(
      'useSessionCache must be used within a SessionCacheProvider'
    );
  }
  return context;
};

// Custom hook to automatically set up session cache for customer components
export const useCustomerSessionCache = (customerId?: string) => {
  const sessionCache = useSessionCache();

  // Filter sessions by current customer if needed
  const customerSessions = customerId
    ? sessionCache.sessions.filter(
        session => session.context?.orderId || session.flowId !== 'about' // Keep sessions that have orders // Exclude general "about" sessions
      )
    : sessionCache.sessions;

  return {
    ...sessionCache,
    sessions: customerSessions,
  };
};
