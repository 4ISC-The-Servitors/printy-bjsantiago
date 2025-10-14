// Admin quotes context using real Supabase data from quote_conversations table
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { ConversationData } from '../../features/api/quoteApi';

interface QuotesContextValue {
  quotes: ConversationData[];
  updateQuote: (conversationId: string, updates: Partial<ConversationData>) => void;
  refreshQuotes: () => void;
  loading: boolean;
  error: string | null;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [quotes, setQuotes] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

              const { data, error: fetchError } = await supabase
                .from('quote_conversations')
                .select(`
                  conversation_id,
                  customer_id,
                  quote_id,
                  status,
                  language,
                  created_at,
                  updated_at,
                  ended_at,
                  display_id,
                  customer:customer_id (
                    first_name,
                    last_name,
                    email_address
                  ),
                  proposals:quote_proposals (
                    proposal_id,
                    status,
                    quoted_price,
                    currency,
                    created_at,
                    updated_at
                  )
                `)
                .order('updated_at', { ascending: false })
                .limit(100);

      if (fetchError) {
        console.error('[QuotesContext] Error fetching quotes:', fetchError);
        setError(fetchError.message);
        return;
      }
      
      console.debug('[QuotesContext] Fetched quotes:', data?.length || 0);
      console.debug('[QuotesContext] Sample quote data:', data?.[0]);
      setQuotes(data || []);
    } catch (err) {
      console.error('[QuotesContext] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Add real-time subscription for quotes table changes
  useEffect(() => {
    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quote_conversations' },
        (payload) => {
          console.log('[QuotesContext] Real-time update received from quote_conversations:', payload);
          void loadQuotes();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quote_proposals' },
        (payload) => {
          console.log('[QuotesContext] Real-time update received from quote_proposals:', payload);
          void loadQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadQuotes]);

  const updateQuote = (conversationId: string, updates: Partial<ConversationData>) => {
    console.log('updateQuote called:', conversationId, updates);
    
    // Optimistic update - update local state immediately
    setQuotes(prevQuotes => 
      prevQuotes.map(quote => 
        quote.conversation_id === conversationId ? { ...quote, ...updates } : quote
      )
    );
    
    // Then refresh from database to ensure consistency
    loadQuotes();
  };

  const refreshQuotes = () => {
    loadQuotes();
  };

  return (
    <QuotesContext.Provider value={{ 
      quotes, 
      updateQuote, 
      refreshQuotes, 
      loading, 
      error 
    }}>
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};
