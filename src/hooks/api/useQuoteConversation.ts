// src/hooks/api/useQuoteConversation.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  fetchConversation,
  fetchMessages,
  sendMessage,
  summarizeConversation,
  fetchProposals,
  type ConversationData,
  type Message,
  type Proposal
} from '../../features/api/quoteApi';

export function useQuoteConversation(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversation data
  const loadConversation = useCallback(async () => {
    try {
      const [conversationData, messagesData, proposalsData] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
        fetchProposals(conversationId)
      ]);

      setConversation(conversationData);
      setMessages(messagesData);
      setProposals(proposalsData);
      setError(null);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessageHandler = useCallback(async (params: {
    senderId: string;
    senderRole: 'customer' | 'admin' | 'ai';
    text: string;
    messageType?: 'chat' | 'spec_summary' | 'spec_proposal' | 'system';
    metadata?: any;
  }) => {
    try {
      const messageId = await sendMessage({
        conversationId,
        ...params
      });

      // Reload messages to get the new one
      await loadConversation();
      return messageId;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [conversationId, loadConversation]);

  // Summarize conversation with AI
  const summarizeSpecs = useCallback(async () => {
    try {
      const result = await summarizeConversation(conversationId);
      
      // Reload conversation to get updated language
      await loadConversation();
      
      return result;
    } catch (err) {
      console.error('Error summarizing conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to summarize conversation');
      throw err;
    }
  }, [conversationId, loadConversation]);

  // Reload function
  const reload = useCallback(() => {
    setLoading(true);
    loadConversation();
  }, [loadConversation]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    loadConversation();

    // Subscribe to new messages and updates
    const channel = supabase
      .channel(`quote-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages_v2',
          filter: `session_id=eq.${conversationId}`
        },
        () => {
          // Reload messages when new ones are added
          loadConversation();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `session_id=eq.${conversationId}`
        },
        () => {
          // Reload conversation when status changes
          loadConversation();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quote_proposals',
          filter: `session_id=eq.${conversationId}`
        },
        () => {
          // Reload proposals when they change
          loadConversation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadConversation]);

  return {
    messages,
    conversation,
    proposals,
    loading,
    error,
    sendMessage: sendMessageHandler,
    summarizeSpecs,
    reload
  };
}