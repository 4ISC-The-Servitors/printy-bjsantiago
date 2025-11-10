import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@lib/supabase';
import type { ConversationItem } from '@features/chat/hooks/shared/useConversationState';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

interface SessionCacheContextValue {
  sessions: ConversationItem[];
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  refetch: () => void;
  addSession: (session: ConversationItem) => void;
  updateSession: (
    sessionId: string,
    updates: Partial<ConversationItem>
  ) => void;
  loadMore: () => void;
  hasMore: boolean;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sessionsRef = useRef<ConversationItem[]>([]);

  const PAGE_SIZE = 50;

  const sortSessions = useCallback((list: ConversationItem[]) => {
    return [...list].sort((a, b) => {
      const aTs = a.updatedAt ?? a.createdAt;
      const bTs = b.updatedAt ?? b.createdAt;
      return bTs - aTs;
    });
  }, []);

  const replaceSessions = useCallback(
    (nextSessions: ConversationItem[]) => {
      const sorted = sortSessions(nextSessions);
      sessionsRef.current = sorted;
      setSessions(sorted);
    },
    [sortSessions]
  );

  const updateSessionsList = useCallback(
    (updater: (prev: ConversationItem[]) => ConversationItem[]) => {
      setSessions(prev => {
        const next = sortSessions(updater(prev));
        sessionsRef.current = next;
        return next;
      });
    },
    [sortSessions]
  );

  // Helper function to process a single session from database
  const processSession = useCallback(
    (session: any): ConversationItem | null => {
      // Defense-in-depth: Filter out ticket conversation sessions
      const metadata = (session.metadata as any) || {};
      if (metadata.ticket_conversation) {
        return null;
      }

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

      const timestamps: number[] = [];

      const createdAt = new Date(session.created_at).getTime();
      timestamps.push(createdAt);

      if (session.ended_at) {
        timestamps.push(new Date(session.ended_at).getTime());
      }

      if (inquiry?.updated_at) {
        timestamps.push(new Date(inquiry.updated_at).getTime());
      }

      if (quote?.updated_at) {
        timestamps.push(new Date(quote.updated_at).getTime());
      }

      if (order?.updated_at) {
        timestamps.push(new Date(order.updated_at).getTime());
      }

      if (inquiry?.resolved_at) {
        timestamps.push(new Date(inquiry.resolved_at).getTime());
      }

      const updatedAt =
        timestamps.length > 0 ? Math.max(...timestamps) : createdAt;

      return {
        id: session.session_id,
        title: sessionTitle,
        createdAt,
        updatedAt,
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
    },
    []
  );

  // Helper function to fetch a single session with all relationships
  const fetchSingleSession = useCallback(
    async (sessionId: string): Promise<ConversationItem | null> => {
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
            inquiry_status,
            updated_at,
            resolved_at
            ),
            quotes!chat_sessions_v2_quote_id_fkey (
              quote_id,
              display_id,
            status,
            updated_at
            ),
            orders!chat_sessions_v2_order_id_fkey (
              order_id,
              display_id,
              status,
            total_amount,
            updated_at
            )
          `
          )
          .eq('session_id', sessionId)
          .single();

        if (sessionError || !sessionData) {
          console.error('Error fetching single session:', sessionError);
          return null;
        }

        return processSession(sessionData);
      } catch (err) {
        console.error('Failed to fetch single session:', err);
        return null;
      }
    },
    [processSession]
  );

  const loadSessions = useCallback(
    async ({ reset }: { reset: boolean }) => {
      if (!customerId) return;

      if (reset) {
        setLoading(true);
        setIsLoadingMore(false);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      const currentOffset = reset ? 0 : sessionsRef.current.length;
      const rangeFrom = currentOffset;
      const rangeTo = currentOffset + PAGE_SIZE - 1;

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
            inquiry_status,
            updated_at,
            resolved_at
          ),
          quotes!chat_sessions_v2_quote_id_fkey (
            quote_id,
            display_id,
            status,
            updated_at
          ),
          orders!chat_sessions_v2_order_id_fkey (
            order_id,
            display_id,
            status,
            total_amount,
            updated_at
          )
        `
          )
          .eq('customer_id', customerId)
          .is('metadata->ticket_conversation', null)
          .order('created_at', { ascending: false })
          .range(rangeFrom, rangeTo);

        if (sessionError) {
          console.error('Error loading sessions:', sessionError);
          setError(sessionError.message);
          return;
        }

        const processedSessions: ConversationItem[] = (sessionData || [])
          .map(processSession)
          .filter((session): session is ConversationItem => session !== null);

        if (reset) {
          replaceSessions(processedSessions);
        } else if (processedSessions.length > 0) {
          updateSessionsList(prev => {
            const existingIds = new Set(prev.map(session => session.id));
            const appended = processedSessions.filter(
              session => !existingIds.has(session.id)
            );
            if (appended.length === 0) {
              return prev;
            }
            return [...prev, ...appended];
          });
        }

        setHasMore((sessionData?.length ?? 0) === PAGE_SIZE);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (reset) {
          setLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [customerId, processSession, replaceSessions, updateSessionsList]
  );

  // Load sessions when customerId changes
  useEffect(() => {
    if (customerId) {
      void loadSessions({ reset: true });
    }
  }, [customerId, loadSessions]);

  // Real-time subscription for chat_sessions_v2 changes
  useEffect(() => {
    if (!customerId) return;

    const channel = supabase
      .channel('chat_sessions_v2-customer-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions_v2',
          filter: `customer_id=eq.${customerId}`,
        },
        async payload => {
          const sessionId =
            (payload.new as any)?.session_id ||
            (payload.old as any)?.session_id;

          if (!sessionId) return;

          // Handle different event types efficiently
          if (payload.eventType === 'DELETE') {
            // Remove session from state
            updateSessionsList(prev => prev.filter(s => s.id !== sessionId));
            return;
          }

          if (payload.eventType === 'INSERT') {
            // Fetch the new session with all relationships
            const newSession = await fetchSingleSession(sessionId);
            if (newSession) {
              updateSessionsList(prev => {
                const without = prev.filter(s => s.id !== sessionId);
                const next = [newSession, ...without];
                return next;
              });
            } else {
              // Fallback to full reload if single fetch fails
              void loadSessions({ reset: true });
            }
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;

            // Check if this is a ticket conversation (should be filtered out)
            const metadata = (newData.metadata as any) || {};
            if (metadata.ticket_conversation) {
              // Remove if it was previously visible
              updateSessionsList(prev => prev.filter(s => s.id !== sessionId));
              return;
            }

            // For status updates, we can update directly without fetching
            // But if other fields changed that affect title, we need to fetch
            const statusChanged = newData.status !== oldData.status;
            const metadataChanged =
              JSON.stringify(newData.metadata) !==
              JSON.stringify(oldData.metadata);
            const fkChanged =
              newData.inquiry_id !== oldData.inquiry_id ||
              newData.quote_id !== oldData.quote_id ||
              newData.order_id !== oldData.order_id;

            // If only status changed, update directly (most common case)
            if (statusChanged && !metadataChanged && !fkChanged) {
              const endedAtTs = newData.ended_at
                ? new Date(newData.ended_at).getTime()
                : undefined;
              updateSessionsList(prev =>
                prev.map(s =>
                  s.id === sessionId
                    ? {
                        ...s,
                        status: newData.status === 'ended' ? 'ended' : 'active',
                        updatedAt: endedAtTs ?? Date.now(),
                      }
                    : s
                )
              );
              return;
            }

            // If other fields changed, fetch full session to get updated title/relationships
            const updatedSession = await fetchSingleSession(sessionId);
            if (updatedSession) {
              updateSessionsList(prev => {
                const found = prev.some(s => s.id === sessionId);
                if (!found) {
                  const next = [updatedSession, ...prev];
                  return next;
                }
                return prev.map(s => (s.id === sessionId ? updatedSession : s));
              });
            } else {
              // If fetch failed or session was filtered out, remove it
              updateSessionsList(prev => prev.filter(s => s.id !== sessionId));
              void loadSessions({ reset: true });
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [customerId, fetchSingleSession, loadSessions]);

  // Refetch function for manual refresh
  const refetch = () => {
    void loadSessions({ reset: true });
  };

  const loadMore = () => {
    if (loading || isLoadingMore || !hasMore) {
      return;
    }
    void loadSessions({ reset: false });
  };

  // Add new session to cache
  const addSession = (newSession: ConversationItem) => {
    updateSessionsList(prev => {
      const without = prev.filter(session => session.id !== newSession.id);
      const next = [newSession, ...without];
      return next;
    });
  };

  // Update existing session in cache
  const updateSession = (
    sessionId: string,
    updates: Partial<ConversationItem>
  ) => {
    updateSessionsList(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const value: SessionCacheContextValue = {
    sessions,
    loading,
    isLoadingMore,
    error,
    refetch,
    addSession,
    updateSession,
    loadMore,
    hasMore,
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
