/**
 * useJsonbFlowConversations
 * Hook for JSONB-based chat flows (ask-quote, issue-ticket, etc.)
 * Based on the old AskQuote.ts logic but using FlowDefinition from chatFlows/
 */

import { useState, useCallback } from 'react';
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import {
  getFlowDefinition,
  fetchSessionMessagesV2,
} from '@features/chat/api/jsonbChatFlowApi';
import { auth, supabase } from '@lib/supabase';

interface Message {
  id: string;
  role: 'customer' | 'admin' | 'printy';
  text: string;
  ts: number;
  isHistorical?: boolean;
}

interface QuickReply {
  id: string;
  label: string;
  value: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  flowId: string;
  status: 'active' | 'ended';
}

export function useJsonbFlowConversations() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  /**
   * Start a new flow conversation
   */
  const startFlow = useCallback(async (flowId: string, title: string) => {
    setIsTyping(true);
    try {
      // Get customer ID
      const { data: userData } = await auth.getUser();
      const customerId = userData?.user?.id;

      if (!customerId) {
        throw new Error('User not authenticated');
      }

      // Get flow definition from database
      const flowDefinition = await getFlowDefinition(flowId);
      if (!flowDefinition) {
        throw new Error(`Flow ${flowId} not found in database`);
      }

      // Start the flow
      const result = await JsonbFlowProcessor.startFlow({
        flowId,
        customerId,
        flowDefinition,
      });

      // Create UI conversation
      const conv: Conversation = {
        id: result.sessionId,
        title,
        createdAt: Date.now(),
        messages: result.messages,
        flowId,
        status: 'active',
      };

      setConversations(prev => [conv, ...prev]);
      setActiveId(result.sessionId);
      setSessionId(result.sessionId);
      setCurrentNodeId(result.currentNodeId);
      setMessages(result.messages);
      setQuickReplies(result.quickReplies);
    } catch (error) {
      console.error('Failed to start flow:', error);
    } finally {
      setIsTyping(false);
    }
  }, []);

  /**
   * Send a message (user input)
   */
  const sendMessage = useCallback(
    async (text: string) => {
      console.log('[useJsonbFlowConversations] sendMessage called with:', text);
      if (!activeId || !sessionId) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'customer',
        text,
        ts: Date.now(),
      };

      // Add user message to UI
      console.log('[useJsonbFlowConversations] Adding user message to UI:', userMessage);
      setMessages(prev => [...prev, userMessage]);
      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMessage] }
            : c
        )
      );

      setIsTyping(true);
      setQuickReplies([]);

      try {
        // Get flow definition
        const conv = conversations.find(c => c.id === activeId);
        if (!conv) return;

        const flowDefinition = await getFlowDefinition(conv.flowId);
        if (!flowDefinition) return;

        // Process input
        const result = await JsonbFlowProcessor.processInput({
          sessionId,
          userInput: text,
          flowDefinition,
        });

        console.log('[useJsonbFlowConversations] JsonbFlowProcessor result:', result);
        console.log('[useJsonbFlowConversations] Adding bot responses to UI:', result.messages);
        // Update UI with bot responses
        setMessages(prev => [...prev, ...result.messages]);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, ...result.messages] }
              : c
          )
        );

        setQuickReplies(result.quickReplies);
        setCurrentNodeId(result.currentNodeId);

        // Check if conversation ended
        const updatedNode = flowDefinition.nodes[result.currentNodeId];
        if (updatedNode && updatedNode.type === 'end') {
          setConversations(prev =>
            prev.map(c =>
              c.id === activeId ? { ...c, status: 'ended' as const } : c
            )
          );
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsTyping(false);
      }
    },
    [activeId, sessionId, conversations]
  );

  /**
   * Handle quick reply selection
   */
  const handleQuickReply = useCallback(
    (value: string) => {
      const normalized = (value ?? '').trim().toLowerCase();
      if (normalized === 'end chat' || normalized === 'end') {
        // End the conversation
        if (activeId) {
          setConversations(prev =>
            prev.map(c =>
              c.id === activeId ? { ...c, status: 'ended' as const } : c
            )
          );
          setQuickReplies([]);

          // Show goodbye message
          const goodbyeMessage: Message = {
            id: `goodbye-${Date.now()}`,
            role: 'printy',
            text: 'Thanks for choosing B.J. Santiago! Have a great day!',
            ts: Date.now(),
          };

          setMessages(prev => [...prev, goodbyeMessage]);
          setConversations(prev =>
            prev.map(c =>
              c.id === activeId
                ? { ...c, messages: [...c.messages, goodbyeMessage] }
                : c
            )
          );
        }
        return;
      }
      void sendMessage(value);
    },
    [sendMessage, activeId]
  );

  /**
   * Switch to a different conversation
   */
  const switchConversation = useCallback(
    async (id: string) => {
      const conv = conversations.find(c => c.id === id);
      if (!conv) return;

      setActiveId(id);
      setSessionId(id);

      // Check if this is a v2 session-based conversation
      if (conv.flowId && !conv.flowId.includes('legacy')) {
        try {
          // First check if this is an ended session
          const { data: session } = await supabase
            .from('chat_sessions_v2')
            .select('status')
            .eq('session_id', id)
            .single();

          const isEnded = session?.status === 'ended';

          // Load messages from database with proper typing indicator handling
          const messages = await fetchSessionMessagesV2(id);

          // Mark messages as historical to prevent typing indicators
          const historicalMessages: Message[] = (messages || []).map(
            (msg: any) => ({
              id: msg.id,
              role: msg.role as 'customer' | 'admin' | 'printy',
              text: msg.text,
              ts: msg.ts,
              isHistorical: true,
            })
          );

          setMessages(historicalMessages);

          // Set quick replies based on conversation status
          if (conv.status === 'active' && !isEnded) {
            setQuickReplies([
              { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
            ]);
          } else {
            setQuickReplies([]);
          }

          // Ensure typing indicator is off for historical messages
          setIsTyping(false);
        } catch (error) {
          console.error('Failed to load conversation messages:', error);
          // Fallback to existing messages marked as historical
          setMessages(conv.messages.map(m => ({ ...m, isHistorical: true })));
          setQuickReplies(
            conv.status === 'active'
              ? [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]
              : []
          );
          setIsTyping(false);
        }
      } else {
        // Legacy conversation - use existing messages but mark as historical
        setMessages(conv.messages.map(m => ({ ...m, isHistorical: true })));
        setQuickReplies(
          conv.status === 'active'
            ? [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]
            : []
        );
        setIsTyping(false);
      }
    },
    [conversations]
  );

  return {
    // State
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    sessionId,
    currentNodeId,

    // Actions
    startFlow,
    sendMessage,
    handleQuickReply,
    switchConversation,
    setActiveId,
    setConversations,
  } as const;
}

export default useJsonbFlowConversations;
