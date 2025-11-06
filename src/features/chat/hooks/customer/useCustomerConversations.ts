/**
 * useCustomerConversations (composer)
 * Small hook that composes core state for customer-side chat.
 * Uses JSONB-based flows.
 */
import { useCallback, useState, useRef } from 'react';
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

// Helper to extract display label from value (e.g., "uuid|Category Name" -> "Category Name")
function extractDisplayText(text: string): string {
  if (text.includes('|')) {
    return text.split('|')[1].trim();
  }
  return text;
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

  // ✅ DUPLICATE PREVENTION: Track if message is currently being processed
  // Prevents concurrent calls when quick reply buttons are clicked multiple times
  const isProcessingRef = useRef<boolean>(false);

  const updateInputPlaceholder = useCallback(() => {
    // Use a generic placeholder for DB-backed flows
    setInputPlaceholder('Type a message...');
  }, [setInputPlaceholder]);

  const initializeFlow = useCallback(
    async (flowId: string, title: string, ctx?: any) => {
      setIsTyping(true);
      try {
        // Use the flow ID as-is since track-ticket already exists in the database
        const resolvedFlowId = flowId;

        // Get customer ID
        const { data: userData } = await auth.getUser();
        const customerId = userData?.user?.id;

        if (!customerId) {
          throw new Error('User not authenticated');
        }

        // Fetch flow definition from database
        const flowDefinition = await getFlowDefinition(resolvedFlowId);
        if (!flowDefinition) {
          throw new Error(`Flow ${resolvedFlowId} not found in database`);
        }

        // Start the JSONB flow, pass initial context when present (e.g., order_id/display_id)
        const result = await JsonbFlowProcessor.startFlow({
          flowId: resolvedFlowId,
          customerId,
          flowDefinition,
          initialContext: ctx || {},
        });

        // ✅ Phase 1 Fix: Save title to database for persistence across refreshes
        // Fetch existing metadata to merge with new title
        const { data: existingSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', result.sessionId)
          .single();

        // Determine which FK to link based on context
        const fkUpdates: any = {};

        if (ctx?.quote_id) {
          fkUpdates.quote_id = ctx.quote_id;
        } else if (ctx?.conversation_id) {
          // For track-quote, conversation_id is actually the original ask-quote session_id
          // We need to find the quote_id from that session
          try {
            const { data: quoteData, error: quoteErr, status: httpStatus } = await supabase
            .from('quotes')
              .select('quote_id, created_at')
            .eq('session_id', ctx.conversation_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (quoteErr) {
              console.warn('[initializeFlow] quotes lookup by session_id failed', {
                conversation_id: ctx.conversation_id,
                httpStatus,
                errorMessage: quoteErr.message,
              });
            }
            if (quoteData) {
              fkUpdates.quote_id = (quoteData as any).quote_id;
              console.debug('[initializeFlow] quotes lookup success', {
                resolvedQuoteId: (quoteData as any).quote_id,
              });
            }
          } catch (e) {
            console.warn('[initializeFlow] quotes lookup threw', e);
          }
        }

        if (ctx?.inquiryId || ctx?.inquiry_id) {
          fkUpdates.inquiry_id = ctx.inquiryId || ctx.inquiry_id;
        }

        if (ctx?.order_id) {
          fkUpdates.order_id = ctx.order_id;
        }

        // Update session with FKs and metadata
        await supabase
          .from('chat_sessions_v2')
          .update({
            ...fkUpdates,
            metadata: {
              ...(existingSession?.metadata || {}),
              title, // Save the display title
              context: ctx || {},
            },
          })
          .eq('session_id', result.sessionId);

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
      if (!activeId || !sessionId) {
        return;
      }

      // ✅ DUPLICATE PREVENTION: Ignore if already processing
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setIsTyping(true);
      setQuickReplies([]);

      try {
        // Get flow definition
        const conv = conversations.find(c => c.id === activeId);
        if (!conv) return;

        const flowDefinition = await getFlowDefinition(conv.flowId);
        if (!flowDefinition) return;

        // Track existing message IDs before processing to distinguish old vs new messages
        const existingMessageIds = new Set(messages.map(m => m.id));

        // Process input through JSONB flow (this will insert user message to DB)
        const result = await JsonbFlowProcessor.processInput({
          sessionId,
          userInput: text,
          flowDefinition,
        });

        // Fetch all messages from database to ensure consistency (includes user message)
        const allMessages = await fetchSessionMessagesV2(sessionId);
        const mappedMessages: ChatMessage[] = allMessages.map(m => ({
          id: m.id,
          role: mapRole(m.role),
          text: m.role === 'customer' ? extractDisplayText(m.text) : m.text, // Clean UUID for user messages
          ts: m.ts,
          metadata: m.metadata || null,
          // Only mark as historical if this message existed before processing
          // New messages (from this send) should animate
          isHistorical: existingMessageIds.has(m.id),
        }));

        // Update UI with all messages from database
        setMessages(mappedMessages);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId ? { ...c, messages: mappedMessages } : c
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
        isProcessingRef.current = false;
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
          text: m.role === 'customer' ? extractDisplayText(m.text) : m.text, // Clean UUID for user messages
          ts: m.ts,
          isHistorical: true,
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
    async (value: string | { value: string; label: string }) => {
      // Handle both string and object formats
      const data = typeof value === 'string' ? { value, label: value } : value;

      const normalized = (data.label ?? '').trim().toLowerCase();
      if (normalized === 'end chat' || normalized === 'end') {
        void endChatWithSequence();
        return;
      }

      if (!activeId || !sessionId) {
        return;
      }

      // ✅ DUPLICATE PREVENTION: Ignore if already processing
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setIsTyping(true);
      setQuickReplies([]);

      try {
        // Get flow definition
        const conv = conversations.find(c => c.id === activeId);
        if (!conv) return;

        const flowDefinition = await getFlowDefinition(conv.flowId);
        if (!flowDefinition) return;

        // Track existing message IDs before processing to distinguish old vs new messages
        const existingMessageIds = new Set(messages.map(m => m.id));

        // Process input through JSONB flow using the VALUE for routing (this will insert user message to DB)
        const result = await JsonbFlowProcessor.processInput({
          sessionId,
          userInput: data.value, // Use value for routing (contains UUID|CategoryName)
          flowDefinition,
        });

        // Fetch all messages from database to ensure consistency (includes user message)
        const allMessages = await fetchSessionMessagesV2(sessionId);
        const mappedMessages: ChatMessage[] = allMessages.map(m => ({
          id: m.id,
          role: mapRole(m.role),
          text: m.role === 'customer' ? extractDisplayText(m.text) : m.text, // Clean UUID for user messages
          ts: m.ts,
          metadata: m.metadata || null,
          // Only mark as historical if this message existed before processing
          // New messages (from this quick reply click) should animate
          isHistorical: existingMessageIds.has(m.id),
        }));

        // Update UI with all messages from database
        setMessages(mappedMessages);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeId ? { ...c, messages: mappedMessages } : c
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
        console.error('Failed to process quick reply:', error);
      } finally {
        setIsTyping(false);
        isProcessingRef.current = false;
      }
    },
    [
      endChatWithSequence,
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
            text: m.role === 'customer' ? extractDisplayText(m.text) : m.text, // Clean UUID for user messages
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
      // ✅ FIX: Don't switch if already on this conversation (prevents double fetch)
      if (activeId === id) {
        return;
      }

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
          text: m.role === 'customer' ? extractDisplayText(m.text) : m.text, // Clean UUID for user messages
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

        // Set quick replies from current node in DB (flow-aware), fallback to End Chat
        try {
          if (actualStatus === 'active') {
            const { data: sessionRow } = await supabase
              .from('chat_sessions_v2')
              .select('flow_id, metadata')
              .eq('session_id', id)
              .single();

            const flowId = sessionRow?.flow_id as string | undefined;
            const currentNodeId = sessionRow?.metadata?.current_node_id as
              | string
              | undefined;
            const pendingFromContext = sessionRow?.metadata?.context?.
              _pending_quick_replies as any[] | undefined;

            if (flowId && currentNodeId) {
              const flowDef = await getFlowDefinition(flowId);
              const node = flowDef?.nodes?.[currentNodeId as any];
              // Prefer dynamic quick replies persisted by actions in metadata context
              let replies: any[] = Array.isArray(pendingFromContext)
                ? pendingFromContext.map((qr: any, i: number) => ({
                    id: qr.id || `qr-${i}`,
                    label: qr.label,
                    value: qr.value,
                  }))
                : [];

              // If no dynamic quick replies and current node is an action that generates them,
              // re-execute the action to regenerate quick replies
              if (
                replies.length === 0 &&
                node &&
                node.type === 'action' &&
                (node as any).action
              ) {
                const actionName = (node as any).action;
                // Actions that generate dynamic quick replies
                const dynamicActions = [
                  'display_service_categories',
                  'display_services_by_category',
                  'show_customer_orders',
                  'show_quote_decision_prompt',
                ];

                if (dynamicActions.includes(actionName)) {
                  try {
                    // Re-execute the action to regenerate quick replies
                    const { actionHandlers } = await import(
                      '@features/chat/actions/customer'
                    );
                    const handler = actionHandlers[actionName];
                    if (handler) {
                      const { data: userData } = await auth.getUser();
                      const customerId = userData?.user?.id;
                      if (customerId) {
                        const actionResult = await handler({
                          actionNode: node as any,
                          sessionId: id,
                          customerId,
                          context: sessionRow?.metadata?.context || {},
                        });

                        if (actionResult.quickReplies) {
                          replies = actionResult.quickReplies.map(
                            (qr: any, i: number) => ({
                              id: qr.id || `qr-${i}`,
                              label: qr.label,
                              value: qr.value,
                            })
                          );

                          // Persist regenerated quick replies to session metadata
                          const updatedContext = {
                            ...(sessionRow?.metadata?.context || {}),
                            _pending_quick_replies: actionResult.quickReplies,
                          };
                          await supabase
                            .from('chat_sessions_v2')
                            .update({
                              metadata: {
                                ...sessionRow?.metadata,
                                context: updatedContext,
                              },
                            })
                            .eq('session_id', id);
                        }
                      }
                    }
                  } catch (error) {
                    console.error(
                      'Failed to regenerate dynamic quick replies:',
                      error
                    );
                  }
                }
              }

              // Fallback to node options if no dynamic quick replies are present
              if (replies.length === 0 && node && (node as any).options) {
                replies = (node as any).options.map((o: any, i: number) => ({
                  id: `qr-${i}`,
                  label: o.label,
                  value: o.label,
                }));
              }
              setQuickReplies(
                replies.length > 0
                  ? replies
                  : [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]
              );
            } else {
              setQuickReplies([
                { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
              ]);
            }
          } else {
            setQuickReplies([]);
          }
        } catch {
          setQuickReplies([
            { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
          ]);
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
      activeId,
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
