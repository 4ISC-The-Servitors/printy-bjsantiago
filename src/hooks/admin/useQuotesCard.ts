// src/hooks/admin/useQuotesCard.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { ConversationData } from '../../features/api/quoteApi';
import { useAdmin } from './AdminContext';

const ITEMS_PER_PAGE = 10;

export function useQuotesCard() {
  const { openChat, openChatWithTopic } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<ConversationData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hoveredQuoteId, setHoveredQuoteId] = useState<string | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());

  // Load quotes
  const loadQuotes = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const from = (pageNum - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error: fetchError } = await supabase
        .from('quote_conversations')
        .select(`
          *,
          customer:customer_id (
            first_name,
            last_name,
            email_address
          )
        `)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Loaded quotes:', data);

      if (pageNum === 1) {
        setQuotes(data || []);
      } else {
        setQuotes(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load quotes when page changes
  useEffect(() => {
    loadQuotes(page);
  }, [page, loadQuotes]);

  // Selection handlers
  const isSelected = useCallback((quoteId: string) => {
    return selectedQuotes.has(quoteId);
  }, [selectedQuotes]);

  const toggleQuoteSelection = useCallback((quoteId: string) => {
    setSelectedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quoteId)) {
        newSet.delete(quoteId);
      } else {
        newSet.add(quoteId);
      }
      return newSet;
    });
  }, []);

  // Chat handlers
  const viewInChat = useCallback((quoteId: string) => {
    if (openChatWithTopic) {
      // Open quote conversation in admin chat using the same pattern as tickets
      openChatWithTopic('quotes', quoteId, undefined, quotes);
    } else {
      openChat();
    }
  }, [openChat, openChatWithTopic, quotes]);

  // Get display quotes (current page)
  const displayQuotes = quotes.slice(0, page * ITEMS_PER_PAGE);

  return {
    isLoading,
    error,
    displayQuotes,
    page,
    setPage,
    hasMore,
    hoveredQuoteId,
    setHoveredQuoteId,
    isSelected,
    selectionCount: selectedQuotes.size,
    toggleQuoteSelection,
    viewInChat,
  };
}
