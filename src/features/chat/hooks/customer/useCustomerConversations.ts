/**
 * useCustomerConversations (composer)
 * Small hook that composes core state for customer-side chat.
 * Uses JSONB-based flows.
 */
import { useCallback, useState } from 'react';
import { useConversationState } from '@features/chat/hooks/shared/useConversationState';
import { auth, supabase } from '@lib/supabase';
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import {
  getFlowDefinition,
  fetchSessionMessagesV2,
} from '@features/chat/api/jsonbChatFlowApi';
import type { ChatMessage, ChatRole } from '@features/chat/types/chat';

// Helper to map JSONB roles to ChatRole
function mapRole(role: 'customer' | 'admin' | 'printy'): ChatRole {
  return role === 'customer' ? 'user' : 'printy';
}

export function useCustomerConversations() {
  const {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    conversations,
    setConversations,
    activeId,
    setActiveId,
    quickReplies,
    setQuickReplies,
    inputPlaceholder,
    setInputPlaceholder,
  } = useConversationState();

  // JSONB flow state
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [_currentNodeId, setCurrentNodeIdState] = useState<string | null>(null);

  const updateInputPlaceholder = useCallback(() => {
    // Use a generic placeholder for DB-backed flows
    setInputPlaceholder('Type a message...');
  }, [setInputPlaceholder]);

  const initializeFlow = useCallback(
    async (flowId: string, title: string, ctx?: any) => {
      setIsTyping(true);
      try {
        console.log('[useCustomerConversations] initializeFlow called:', {
          flowId,
          title,
          ctx,
        });

        // Use the flow ID as-is since track-ticket already exists in the database
        const resolvedFlowId = flowId;

        console.log(
          '[useCustomerConversations] Resolved flow ID:',
          resolvedFlowId
        );

        // Get customer ID
        const { data: userData } = await auth.getUser();
        const customerId = userData?.user?.id;

        if (!customerId) {
          throw new Error('User not authenticated');
        }

        console.log('[useCustomerConversations] Customer ID:', customerId);

        // Fetch flow definition from database
        const flowDefinition = await getFlowDefinition(resolvedFlowId);
        if (!flowDefinition) {
          throw new Error(`Flow ${resolvedFlowId} not found in database`);
        }

        console.log(
          '[useCustomerConversations] Flow definition loaded:',
          flowDefinition.flow_id
        );
        console.log(
          '[useCustomerConversations] Initial context being passed:',
          ctx
        );

        // Start the JSONB flow, pass initial context when present (e.g., order_id/display_id)
        const result = await JsonbFlowProcessor.startFlow({
          flowId: resolvedFlowId,
          customerId,
          flowDefinition,
          initialContext: ctx || {},
        });

        console.log('[useCustomerConversations] Flow started, result:', result);

        // ✅ Phase 1 Fix: Save title to database for persistence across refreshes
        // Fetch existing metadata to merge with new title
        const { data: existingSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', result.sessionId)
          .single();

        await supabase
          .from('chat_sessions_v2')
          .update({
            metadata: {
              ...(existingSession?.metadata || {}),
              title, // Save the display title
              context: ctx || {},
            },
          })
          .eq('session_id', result.sessionId);

        console.log(
          '[useCustomerConversations] Title saved to database:',
          title
        );

        // Map messages to ChatMessage format
        const mappedMessages: ChatMessage[] = result.messages.map(m => ({
          id: m.id,
          role: mapRole(m.role),
          text: m.text,
          ts: m.ts,
        }));

        // Create UI conversation wrapper
        const conv = {
          id: result.sessionId,
          title,
          createdAt: Date.now(),
          messages: mappedMessages,
          flowId: resolvedFlowId,
          status: 'active' as const,
          icon: undefined,
          context: ctx || {},
        };

        setConversations(prev => [conv, ...prev]);
        setSessionIdState(result.sessionId);
        setCurrentNodeIdState(result.currentNodeId);
        setActiveId(result.sessionId);
        setMessages(mappedMessages);
        setQuickReplies(result.quickReplies);
        updateInputPlaceholder();
      } catch (error) {
        console.error('Failed to initialize flow:', error);
      } finally {
        setIsTyping(false);
      }
    },
    [
      setIsTyping,
      setConversations,
      setActiveId,
      setMessages,
      setQuickReplies,
      updateInputPlaceholder,
    ]
  );

  const handleSend = useCallback(
    async (text: string) => {
      console.log('[handleSend] Called with text:', text);
      if (!activeId || !sessionId) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
        ts: Date.now(),
      };

      // Add user message to UI
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

        // Process input through JSONB flow
        const result = await JsonbFlowProcessor.processInput({
          sessionId,
          userInput: text,
          flowDefinition,
        });

        // Map bot responses to ChatMessage format
        const mappedResponses: ChatMessage[] = result.messages.map(m => ({
          id: m.id,
          role: mapRole(m.role),
          text: m.text,
          ts: m.ts,
        }));

        // Update UI with bot responses
        setMessages(prev => [...prev, ...mappedResponses]);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, ...mappedResponses] }
              : c
          )
        );

        setQuickReplies(result.quickReplies);
        setCurrentNodeIdState(result.currentNodeId);

        // Check if conversation ended
        const updatedNode = flowDefinition.nodes[result.currentNodeId];
        if (updatedNode && updatedNode.type === 'end') {
          setConversations(prev =>
            prev.map(c =>
              c.id === activeId ? { ...c, status: 'ended' as const } : c
            )
          );
        }

        updateInputPlaceholder();
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsTyping(false);
      }
    },
    [
      activeId,
      sessionId,
      conversations,
      setMessages,
      setConversations,
      setIsTyping,
      setQuickReplies,
      updateInputPlaceholder,
    ]
  );

  const endChatWithSequence = useCallback(async () => {
    if (!activeId || !sessionId) return;

    // Step 1: Add goodbye message
    const goodbyeMessage: ChatMessage = {
      id: `goodbye-${Date.now()}`,
      role: 'printy',
      text: 'Thank you for chatting with Printy! Have a great day.',
      ts: Date.now(),
    };

    // Add the goodbye message to current messages
    setMessages(prev => [...prev, goodbyeMessage]);

    // Step 2: Mark conversation as ended (this will show ReadOnlyOverlay)
    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeId ? { ...conv, status: 'ended' as const } : conv
      )
    );

    // Step 3: Clear quick replies
    setQuickReplies([]);

    // Step 4: After delay, actually end the conversation in DB
    setTimeout(async () => {
      try {
        // End the session in the database (using JSONB flow API)
        await import('@features/chat/api/jsonbChatFlowApi').then(api =>
          api.endSessionV2(sessionId)
        );

        // Refresh messages from database
        const fetched = await fetchSessionMessagesV2(sessionId);
        const mappedFetched: ChatMessage[] = fetched.map(m => ({
          id: m.id,
          role: mapRole(m.role as any),
          text: m.text,
          ts: m.ts,
        }));
        setMessages(mappedFetched);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId
              ? {
                  ...c,
                  messages: mappedFetched,
                  status: 'ended' as const,
                }
              : c
          )
        );
      } catch (error) {
        console.error('Failed to refresh messages after ending chat:', error);
      }
    }, 3000); // 3 second delay
  }, [activeId, sessionId, setMessages, setConversations, setQuickReplies]);

  const handleQuickReply = useCallback(
    (value: string) => {
      console.log('[handleQuickReply] Quick reply clicked with value:', value);
      const normalized = (value ?? '').trim().toLowerCase();
      if (normalized === 'end chat' || normalized === 'end') {
        void endChatWithSequence();
        return;
      }
      console.log('[handleQuickReply] Sending to handleSend:', value);
      void handleSend(value);
    },
    [handleSend, endChatWithSequence]
  );

  const endChat = useCallback(
    async (conversationId?: string, targetSessionId?: string) => {
      const currentConversationId = conversationId || activeId;
      const currentSessionId = targetSessionId || sessionId;

      if (!currentConversationId || !currentSessionId) return;

      try {
        // Get current user
        const { data: userData } = await auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          console.error('User not authenticated');
          return;
        }

        // Use the unified service - this adds the end message to the database
        const result = await ChatEndService.endChatSession({
          sessionId: currentSessionId,
          userId,
          userType: 'customer',
          conversationId: currentConversationId,
        });

        if (result.success) {
          // Update local state
          setConversations(prev =>
            prev.map(conv =>
              conv.id === currentConversationId
                ? {
                    ...conv,
                    status: 'ended' as const,
                    updated_at: new Date().toISOString(),
                  }
                : conv
            )
          );

          // Keep chat open so user can see the end message
          // Don't setActiveId(null) here - let user see the message first

          // Refresh messages to show the end message from database
          const fetched = await fetchSessionMessagesV2(currentSessionId);
          const mappedFetched: ChatMessage[] = fetched.map(m => ({
            id: m.id,
            role: mapRole(m.role as any),
            text: m.text,
            ts: m.ts,
          }));
          setMessages(mappedFetched);
          setQuickReplies([]);
        } else {
          console.error('Failed to end chat:', result.error);
        }
      } catch (error) {
        console.error('Error ending chat:', error);
      }

      // Don't automatically close the chat - let user manually close it after seeing the end message
    },
    [
      activeId,
      sessionId,
      setConversations,
      setMessages,
      setQuickReplies,
      setActiveId,
    ]
  );

  const handleSwitchConversation = useCallback(
    async (id: string) => {
      const conv = conversations.find(c => c.id === id);
      if (!conv) return;

      setActiveId(id);
      setSessionIdState(id);
      setIsTyping(true);

      try {
        // Check actual session status from database
        const isSessionEnded = await ChatEndService.isSessionEnded(id);
        const actualStatus = isSessionEnded ? 'ended' : 'active';

        // Fetch messages from database
        const fetched = await fetchSessionMessagesV2(id);
        const mappedMessages: ChatMessage[] = fetched.map(m => ({
          id: m.id,
          role: mapRole(m.role as any),
          text: m.text,
          ts: m.ts,
          isHistorical: true, // Mark all loaded messages as historical to prevent typing animations
        }));

        setMessages(mappedMessages);

        // Update conversation with fetched messages and correct status
        setConversations(prev =>
          prev.map(c =>
            c.id === id
              ? {
                  ...c,
                  messages: mappedMessages,
                  status: actualStatus as 'active' | 'ended',
                }
              : c
          )
        );

        // Set quick replies based on actual database status
        if (actualStatus === 'active') {
          setQuickReplies([
            { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
          ]);
        } else {
          setQuickReplies([]);
        }

        updateInputPlaceholder();
      } catch (error) {
        console.error('Failed to load conversation messages:', error);
        setMessages([]);
      } finally {
        setIsTyping(false);
      }
    },
    [
      conversations,
      setActiveId,
      setMessages,
      setQuickReplies,
      updateInputPlaceholder,
      setIsTyping,
      setConversations,
    ]
  );

  return {
    // state
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    inputPlaceholder,
    sessionId,
    // actions
    initializeFlow,
    handleSend,
    handleQuickReply,
    switchConversation: handleSwitchConversation,
    endChat,
    setActiveId,
    setConversations,
  } as const;
}

export default useCustomerConversations;
