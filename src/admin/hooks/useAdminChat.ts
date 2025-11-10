import { useState } from 'react';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '@features/chat/types/chat';
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import {
  FlowTriggerService,
  type AdminPage,
} from '@features/chat/services/FlowTriggerService';
import {
  getFlowDefinition,
  fetchSessionMessagesV2,
} from '@features/chat/api/jsonbChatFlowApi';
import { useAdminConversations } from './useAdminConversations';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import {
  editSavedSpecs,
  sendQuoteProposal,
} from '@features/chat/actions/admin';
import { actionHandlers } from '@features/chat/actions';
import { supabase } from '@lib/supabase';

// Helper to extract display label from value (e.g., "uuid|Category Name" -> "Category Name")
function extractDisplayText(text: string): string {
  if (text.includes('|')) {
    return text.split('|')[1].trim();
  }
  return text;
}

export interface UseAdminChatReturn {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  messages: ChatMessage[];
  isTyping: boolean;
  quickReplies: QuickReply[];
  handleChatOpen: () => void;
  handleChatOpenWithTopic: (
    topic: string,
    orderId?: string,
    updateOrder?: (orderId: string, updates: any) => void,
    orders?: any[],
    refreshOrders?: () => void,
    orderIds?: string[]
  ) => void;
  handleShowConversation: (conversationId: string) => Promise<void>;
  endChatWithDelay: () => void;
  handleSendMessage: (text: string) => void;
  handleQuickReply: (value: string | { value: string; label: string }) => void;
  readOnly: boolean;
  dbSessionId: string | null;
  currentConversationId: string | null;
}

export const useAdminChat = (): UseAdminChatReturn => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const {
    conversations,
    startConversation,
    addMessage: addConvMessage,
    loadAdminChatSessions,
    setConversations,
  } = useAdminConversations();
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [viewingHistorical, setViewingHistorical] = useState<boolean>(false);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const { showConversationSwitchToast, clearLoadingToasts } =
    useChatLoadingToast();

  // Track current page context to prevent cross-contamination
  const [currentPage, setCurrentPage] = useState<AdminPage | null>(null);
  const [currentEntityId, setCurrentEntityId] = useState<string | null>(null);

  // Helper: append Printy messages gradually with typing indicator
  // Set skipDelay=true for admin flows to show messages instantly
  // ✅ FIX: This function exclusively manages typing state to prevent duplicate indicators
  // Messages are processed one by one sequentially to ensure only one typing indicator shows
  const appendMessagesWithTyping = async (
    botTexts: { role: ChatRole; text: string }[],
    skipDelay: boolean = false
  ) => {
    // Process messages one by one to ensure sequential display
    for (let i = 0; i < botTexts.length; i++) {
      const m = botTexts[i];
      const isLastMessage = i === botTexts.length - 1;

      if (!skipDelay) {
        // Show typing indicator before processing this message
        setIsTyping(true);
        // Simple delay heuristic: base 350ms + 25ms per 20 chars
        const delay =
          350 + Math.min(1200, Math.floor((m.text?.length || 0) / 20) * 25);
        await new Promise(r => setTimeout(r, delay));
      }

      // Add the message
      const botMsg = {
        id: crypto.randomUUID(),
        role: m.role,
        text: m.text,
        ts: Date.now(),
      } as const;
      setMessages(prev => [...prev, botMsg]);
      if (currentConversationId)
        addConvMessage('printy', m.text, currentConversationId);

      if (!skipDelay) {
        // Small delay to ensure message is rendered
        await new Promise(r => setTimeout(r, 50));

        // Hide typing indicator after message is added
        // For non-last messages, it will be shown again in the next loop iteration
        setIsTyping(false);

        // If more messages coming, brief pause before showing typing for next message
        if (!isLastMessage) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
    }

    // Ensure typing is definitely off after all messages are processed
    setIsTyping(false);
  };

  const endChatWithDelay = async () => {
    // If viewing an already-ended conversation, just close the panel
    const existing = currentConversationId
      ? conversations.find(c => c.id === currentConversationId)
      : null;
    if (
      readOnly ||
      viewingHistorical ||
      (existing && existing.status === 'ended')
    ) {
      // Close the dock and reset transient chat state so a fresh chat can start next time
      setChatOpen(false);
      setMessages([]);
      setQuickReplies([]);
      setCurrentConversationId(null);
      setReadOnly(false);
      setViewingHistorical(false);
      setCurrentPage(null);
      setCurrentEntityId(null);
      // Dispatch event for notification visibility
      window.dispatchEvent(new CustomEvent('admin-chat-closed'));
      return;
    }

    // Use ChatEndService to ensure consistent end messages across admin and customer
    if (currentConversationId && dbSessionId) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const adminId = userData?.user?.id;

        if (adminId) {
          // End the chat using the unified service
          const result = await ChatEndService.endChatSession({
            sessionId: dbSessionId,
            userId: adminId,
            userType: 'admin',
            conversationId: currentConversationId,
          });

          if (result.success) {
            // Fetch the end message from database to show it in UI
            const messages = await fetchSessionMessagesV2(dbSessionId);
            const lastMessage = messages[messages.length - 1];

            if (lastMessage) {
              const endMessage = {
                id: lastMessage.id,
                role: 'printy' as const,
                text: lastMessage.text,
                ts: lastMessage.ts,
                isHistorical: true, // Mark as historical since it's loaded from database
              };
              setMessages(prev => [...prev, endMessage]);
              if (currentConversationId)
                addConvMessage(
                  'printy',
                  endMessage.text,
                  currentConversationId
                );
            }

            setQuickReplies([]);

            // Set read-only mode so feedback can be shown (no auto-close)
            setReadOnly(true);
          }
        }
      } catch (error) {
        console.error('Error ending admin chat:', error);
        // Fallback: just close
        setChatOpen(false);
        setMessages([]);
        setQuickReplies([]);
        setCurrentConversationId(null);
        setDbSessionId(null);
        setCurrentPage(null);
        setCurrentEntityId(null);
      }
    } else {
      // No database session, just close
      setChatOpen(false);
      setMessages([]);
      setQuickReplies([]);
      setCurrentPage(null);
      setCurrentEntityId(null);
      setCurrentConversationId(null);
      setReadOnly(false);
    }
  };

  const handleChatOpen = () => {
    setReadOnly(false);
    setChatOpen(true);
    // Dispatch event for notification visibility
    window.dispatchEvent(new CustomEvent('admin-chat-opened'));
    if (messages.length === 0) {
      const convId = startConversation('Admin Chat');
      setCurrentConversationId(convId);
      void (async () => {
        const flowDef = await getFlowDefinition('admin-quote-propose');
        if (!flowDef) return;
        const start = await JsonbFlowProcessor.startFlow({
          flowId: 'admin-quote-propose',
          customerId:
            (await supabase.auth.getUser()).data?.user?.id ||
            '00000000-0000-0000-0000-000000000000',
          flowDefinition: flowDef,
          initialContext: {},
        });
        setDbSessionId(start.sessionId);
        await appendMessagesWithTyping(
          start.messages.map(m => ({ role: m.role as ChatRole, text: m.text }))
        );
        setQuickReplies(start.quickReplies || []);
      })();
    }
  };

  const handleChatOpenWithTopic = (
    topic: string,
    orderId?: string,
    _updateOrder?: (orderId: string, updates: any) => void,
    _orders?: any[],
    _refreshOrders?: () => void,
    _orderIds?: string[]
  ) => {
    setReadOnly(false);
    setChatOpen(true);
    // Dispatch event for notification visibility
    window.dispatchEvent(new CustomEvent('admin-chat-opened'));

    // Handle special flows that don't require entity IDs (e.g., admin-add-service)
    if (topic === 'add-service') {
      void (async () => {
        let start: any = null;
        let flowId: any;
        let context: any;
        let sessionTitle: string;

        try {
          // Use FlowTriggerService to get the flow context
          const flowContext =
            await FlowTriggerService.getAdminFlowContext('admin-add-service');

          if (!flowContext) {
            console.error('❌ Failed to determine flow for admin-add-service');
            return;
          }

          ({ flowId, context, sessionTitle } = flowContext);

          // Load flow definition
          const flowDef = await getFlowDefinition(flowId);
          if (!flowDef) {
            console.error(`Failed to load flow definition for ${flowId}`);
            return;
          }

          // Start the flow
          start = await JsonbFlowProcessor.startFlow({
            flowId,
            customerId:
              (await supabase.auth.getUser()).data?.user?.id ||
              '00000000-0000-0000-0000-000000000000',
            flowDefinition: flowDef,
            initialContext: context,
          });
          setDbSessionId(start.sessionId);
        } catch (error) {
          console.error(`❌ Error starting flow:`, error);
          return;
        }

        if (!start) {
          console.error('❌ Flow start failed - no result');
          return;
        }

        // Persist admin chat session metadata to database
        try {
          const { data: existingSession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', start.sessionId)
            .single();

          const titleMetadata = {
            ...(existingSession?.metadata || {}),
            admin_chat: true,
            context: {
              ...(existingSession?.metadata?.context || {}),
              ...context,
            },
          };

          await supabase
            .from('chat_sessions_v2')
            .update({
              metadata: {
                ...titleMetadata,
                title: sessionTitle,
              },
            })
            .eq('session_id', start.sessionId);

          // Refresh the conversations list
          await loadAdminChatSessions();
        } catch (e) {
          console.error('Failed to update admin chat metadata:', e);
        }

        // Reset chat state for new flow
        setMessages([]);
        setQuickReplies([]);
        setCurrentPage(null);
        setCurrentEntityId(null);

        // Temporary title for UI
        const tempTitle = sessionTitle;
        const convId = startConversation
          ? startConversation(tempTitle)
          : 'conv';
        setCurrentConversationId(convId);

        // Display messages with appropriate typing delay
        const skipDelay = FlowTriggerService.shouldSkipTypingDelay(flowId);
        await appendMessagesWithTyping(
          start.messages.map((m: any) => ({
            role: m.role as ChatRole,
            text: m.text,
          })),
          skipDelay
        );

        // Set quick replies
        setQuickReplies(start.quickReplies || []);

        // Persist messages to conversation
        start.messages.forEach((m: any) =>
          addConvMessage('printy', m.text, convId)
        );
      })();
      return;
    }

    // Handle portfolio/update-service flow that requires service_id
    if (topic === 'portfolio' && orderId) {
      void (async () => {
        let start: any = null;
        let flowId: any;
        let context: any;
        let sessionTitle: string;

        try {
          // Use FlowTriggerService to get the flow context with service_id
          const flowContext =
            await FlowTriggerService.getAdminServiceFlowContext(
              'admin-update-service',
              orderId
            );

          if (!flowContext) {
            console.error(
              '❌ Failed to determine flow for admin-update-service'
            );
            return;
          }

          ({ flowId, context, sessionTitle } = flowContext);

          // Load flow definition
          const flowDef = await getFlowDefinition(flowId);
          if (!flowDef) {
            console.error(`Failed to load flow definition for ${flowId}`);
            return;
          }

          // Start the flow
          start = await JsonbFlowProcessor.startFlow({
            flowId,
            customerId:
              (await supabase.auth.getUser()).data?.user?.id ||
              '00000000-0000-0000-0000-000000000000',
            flowDefinition: flowDef,
            initialContext: context,
          });
          setDbSessionId(start.sessionId);
        } catch (error) {
          console.error(`❌ Error starting flow:`, error);
          return;
        }

        if (!start) {
          console.error('❌ Flow start failed - no result');
          return;
        }

        // Persist admin chat session metadata to database
        try {
          const { data: existingSession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', start.sessionId)
            .single();

          const titleMetadata = {
            ...(existingSession?.metadata || {}),
            admin_chat: true,
            context: {
              ...(existingSession?.metadata?.context || {}),
              ...context,
            },
          };

          await supabase
            .from('chat_sessions_v2')
            .update({
              metadata: {
                ...titleMetadata,
                title: sessionTitle,
              },
            })
            .eq('session_id', start.sessionId);

          // Refresh the conversations list
          await loadAdminChatSessions();
        } catch (e) {
          console.error('Failed to update admin chat metadata:', e);
        }

        // Reset chat state for new flow
        setMessages([]);
        setQuickReplies([]);
        setCurrentPage(null);
        setCurrentEntityId(null);

        // Temporary title for UI
        const tempTitle = sessionTitle;
        const convId = startConversation
          ? startConversation(tempTitle)
          : 'conv';
        setCurrentConversationId(convId);

        // Display messages with appropriate typing delay
        const skipDelay = FlowTriggerService.shouldSkipTypingDelay(flowId);
        await appendMessagesWithTyping(
          start.messages.map((m: any) => ({
            role: m.role as ChatRole,
            text: m.text,
          })),
          skipDelay
        );

        // Set quick replies
        setQuickReplies(start.quickReplies || []);

        // Persist messages to conversation
        start.messages.forEach((m: any) =>
          addConvMessage('printy', m.text, convId)
        );
      })();
      return;
    }

    // For flows that require entity IDs
    if (!orderId) {
      return;
    }

    const page = topic as AdminPage;

    // Determine if we need to reset the chat
    const shouldReset = FlowTriggerService.shouldResetChat(
      currentPage,
      page,
      currentEntityId,
      orderId,
      messages.length > 0
    );

    if (shouldReset) {
      // Reset chat state
      setMessages([]);
      setQuickReplies([]);

      // Update current context tracking
      setCurrentPage(page);
      setCurrentEntityId(orderId);

      // Temporary title for UI (will be properly set when saved to database)
      const tempTitle = `${page.charAt(0).toUpperCase() + page.slice(1)}: ${orderId}`;
      const convId = startConversation ? startConversation(tempTitle) : 'conv';
      setCurrentConversationId(convId);

      // Handle async flow initialization
      void (async () => {
        let start: any = null;
        let flowId: any;
        let context: any;
        let sessionTitle: string;

        try {
          // Use FlowTriggerService to determine the correct flow
          const flowContext = await FlowTriggerService.getFlowForContext(
            page,
            orderId
          );

          if (!flowContext) {
            console.error('❌ Failed to determine flow for page:', page);
            return;
          }

          ({ flowId, context, sessionTitle } = flowContext);

          // Validate that the flow is appropriate for this page
          if (!FlowTriggerService.validateContext(page, flowId)) {
            console.error('❌ Flow validation failed');
            return;
          }

          // Load flow definition
          const flowDef = await getFlowDefinition(flowId);
          if (!flowDef) {
            console.error(`Failed to load flow definition for ${flowId}`);
            return;
          }

          // Start the flow
          start = await JsonbFlowProcessor.startFlow({
            flowId,
            customerId:
              (await supabase.auth.getUser()).data?.user?.id ||
              '00000000-0000-0000-0000-000000000000',
            flowDefinition: flowDef,
            initialContext: context,
          });
          setDbSessionId(start.sessionId);
        } catch (error) {
          console.error(`❌ Error starting flow:`, error);
          return;
        }

        if (!start) {
          console.error('❌ Flow start failed - no result');
          return;
        }

        // Persist admin chat session metadata to database
        try {
          const { data: existingSession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', start.sessionId)
            .single();

          const titleMetadata = {
            ...(existingSession?.metadata || {}),
            admin_chat: true,
            context: {
              ...(existingSession?.metadata?.context || {}),
              ...context,
            },
          };

          await supabase
            .from('chat_sessions_v2')
            .update({
              metadata: {
                ...titleMetadata,
                title: sessionTitle,
              },
            })
            .eq('session_id', start.sessionId);

          // Refresh the conversations list
          await loadAdminChatSessions();
        } catch (e) {
          console.error('Failed to update admin chat metadata:', e);
        }

        // Display messages with appropriate typing delay
        const skipDelay = FlowTriggerService.shouldSkipTypingDelay(flowId);
        await appendMessagesWithTyping(
          start.messages.map((m: any) => ({
            role: m.role as ChatRole,
            text: m.text,
          })),
          skipDelay
        );

        // Handle flow-specific quick replies
        if (flowId === 'admin-quote-propose') {
          // Check for saved specs to show smart quick replies
          try {
            const { data: existingSpecs } = await supabase
              .from('quote_specs')
              .select('spec_id')
              .eq('session_id', orderId)
              .order('created_at', { ascending: false })
              .limit(1);

            if (existingSpecs && existingSpecs.length > 0) {
              await appendMessagesWithTyping([
                {
                  role: 'printy',
                  text: 'You have drafted an order specs for this quote request. What do you want to do?',
                },
              ]);
              setQuickReplies([
                {
                  id: 'qr-edit-specs',
                  label: 'Edit Specs',
                  value: '__edit_specs__',
                },
                {
                  id: 'qr-send-specs',
                  label: 'Send Specs to Customer',
                  value: '__send_specs__',
                },
                { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
              ]);
            } else {
              setQuickReplies(start.quickReplies || []);
            }
          } catch {
            setQuickReplies(start.quickReplies || []);
          }
        } else {
          setQuickReplies(start.quickReplies || []);
        }

        // Persist messages to conversation
        start.messages.forEach((m: any) =>
          addConvMessage('printy', m.text, convId)
        );
      })();
    }
  };

  // Open an existing conversation in read-only if ended; do not start a new flow
  const handleShowConversation = async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    // Show conversation switching toast
    showConversationSwitchToast(conv.title || 'Chat Conversation');

    setChatOpen(true);
    setCurrentConversationId(conversationId);

    // For database-loaded conversations, the conversation ID is the session ID
    // For locally created conversations, use the stored sessionId
    const sessionId = conv.sessionId || conversationId;
    setDbSessionId(sessionId);

    // Helper function to map role names (admin -> user for UI)
    const mapRole = (
      role: 'customer' | 'admin' | 'printy'
    ): 'user' | 'printy' => {
      return role === 'admin' ? 'user' : 'printy';
    };

    try {
      // Check actual session status from database (similar to customer implementation)
      const isSessionEnded = await ChatEndService.isSessionEnded(sessionId);
      const actualStatus = isSessionEnded ? 'ended' : 'active';

      // Fetch messages from database for both active and ended conversations
      // This ensures we have the complete message history, not just what's in local state
      const fetched = await fetchSessionMessagesV2(sessionId);
      const mappedMessages: ChatMessage[] = fetched.map(m => ({
        id: m.id,
        role: mapRole(m.role as any),
        // Extract display text for user/admin messages (clean UUID|CategoryName to CategoryName)
        text: m.role === 'admin' ? extractDisplayText(m.text) : m.text,
        ts: m.ts,
        isHistorical: true, // Mark all loaded messages as historical to prevent typing animations
        metadata: m.metadata || null,
      }));

      setMessages(mappedMessages);

      if (actualStatus === 'ended') {
        // For ended conversations, set read-only mode
        setViewingHistorical(true);
        setReadOnly(true);
        setQuickReplies([]);
      } else {
        // For active conversations, allow interaction
        setViewingHistorical(false);
        setReadOnly(false);

        // Restore quick replies from current node in DB (flow-aware)
        try {
          const { data: sessionRow } = await supabase
            .from('chat_sessions_v2')
            .select('flow_id, metadata, customer_id')
            .eq('session_id', sessionId)
            .single();

          const flowId = sessionRow?.flow_id as string | undefined;
          const currentNodeId = sessionRow?.metadata?.current_node_id as
            | string
            | undefined;
          const pendingFromContext = sessionRow?.metadata?.context
            ?._pending_quick_replies as any[] | undefined;

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
              // Check if this action node should show quick replies:
              // 1. Action has no next node (designed for interaction)
              // 2. Action is explicitly listed as generating quick replies
              const shouldRegenerateQuickReplies =
                !(node as any).next ||
                ['display_categories_for_admin'].includes(actionName);

              if (shouldRegenerateQuickReplies) {
                try {
                  // Re-execute the action to regenerate quick replies
                  const handler = actionHandlers[actionName];
                  if (handler) {
                    const { data: userData } = await supabase.auth.getUser();
                    const adminId = userData?.user?.id;
                    if (adminId) {
                      const actionResult = await handler({
                        actionNode: node as any,
                        sessionId: sessionId,
                        customerId: adminId,
                        context: sessionRow?.metadata?.context || {},
                      });

                      // Only use quick replies if the action returns them
                      // This matches the JsonbFlowProcessor logic
                      if (
                        actionResult.quickReplies &&
                        actionResult.quickReplies.length > 0
                      ) {
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
                          .eq('session_id', sessionId);
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
        } catch (error) {
          console.error('Failed to restore quick replies:', error);
          setQuickReplies([
            { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
          ]);
        }
      }

      // Update conversation status if it changed
      if (conv.status !== actualStatus) {
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId
              ? { ...c, status: actualStatus as 'active' | 'ended' }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      // Fallback to local messages if database fetch fails
      // This can happen if the conversation hasn't been saved to the database yet
      // or if there's a network/database error
      setViewingHistorical(conv.status === 'ended');
      setReadOnly(conv.status === 'ended');
      setMessages(
        (conv.messages || []).map((m: any) => ({
          ...m,
          isHistorical: true,
        }))
      );
      setQuickReplies([]);
    }

    // Clear the toast after a short delay to indicate loading completion
    setTimeout(() => {
      clearLoadingToasts();
    }, 1500);
  };

  const handleSendMessage = (text: string) => {
    if (readOnly) return; // prevent sending in read-only view
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      text,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    if (currentConversationId)
      addConvMessage('user', text, currentConversationId);
    // ✅ FIX: Don't insert message here - JsonbFlowProcessor will handle it
    // This prevents duplicate admin messages in the database
    // if (dbSessionId) {
    //   void ChatDatabaseService.insertMessage({
    //     sessionId: dbSessionId,
    //     text,
    //     role: 'admin',
    //   });
    // }
    // ✅ FIX: Don't set typing here - appendMessagesWithTyping will manage it
    // This prevents duplicate typing indicators

    // Process free-form input through the flow system if we have an active session
    if (dbSessionId) {
      void (async () => {
        try {
          // Determine which flow to use based on current session
          let flowId = 'admin-quote-propose'; // default

          // Check if we have a session and determine the flow from metadata
          const { data: sessionData } = await supabase
            .from('chat_sessions_v2')
            .select('flow_id')
            .eq('session_id', dbSessionId)
            .single();

          if (sessionData?.flow_id) {
            flowId = sessionData.flow_id;
          }

          const flowDef = await getFlowDefinition(flowId);
          if (!flowDef) {
            // No flow found, no typing needed
            return;
          }

          const resp = await JsonbFlowProcessor.processInput({
            sessionId: dbSessionId,
            userInput: text,
            flowDefinition: flowDef,
            senderRole: 'admin',
          });

          // Use FlowTriggerService to determine typing delay behavior
          const skipDelay = FlowTriggerService.shouldSkipTypingDelay(
            flowId as any
          );
          // appendMessagesWithTyping will handle typing state completely
          await appendMessagesWithTyping(
            resp.messages.map(m => ({
              role: m.role as ChatRole,
              text: m.text,
            })),
            skipDelay
          );

          setQuickReplies(
            (resp.quickReplies || []).map((qr, i) => ({
              id: qr.id || `qr-${i}`,
              label: qr.label,
              value: qr.value,
            }))
          );

          if (currentConversationId) {
            resp.messages.forEach(m =>
              addConvMessage('printy', m.text, currentConversationId)
            );
          }
        } catch (e) {
          console.error('Failed to process user input through flow:', e);
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Sorry, there was an error processing your input. Please try again.',
              ts: Date.now(),
            },
          ]);
          // Ensure typing is off on error
          setIsTyping(false);
        }
        // ✅ FIX: No finally block needed - appendMessagesWithTyping handles typing state
      })();
    }
    // ✅ FIX: No else branch needed - if no session, just don't set typing
  };

  const handleQuickReply = (v: string | { value: string; label: string }) => {
    // Handle both old string format and new object format
    const isObject = typeof v === 'object' && v !== null;
    const val = isObject ? v.value.trim() : v.trim();
    const label = isObject ? v.label.trim() : undefined;

    if (val.toLowerCase() === 'end chat') {
      setMessages([]);
      return;
    }

    // Set typing state and clear quick replies immediately for better UX
    setIsTyping(true);
    setQuickReplies([]);

    // Intercepts for admin-quote-propose special actions
    if (val === '__edit_specs__' && dbSessionId) {
      void (async () => {
        try {
          const resp = await editSavedSpecs({
            actionNode: {
              id: 'edit_saved_specs',
              type: 'action',
              action: 'edit_saved_specs',
              action_config: { conversation_id_key: 'session_id' },
            } as any,
            context: {
              session_id:
                (
                  await supabase
                    .from('chat_sessions_v2')
                    .select('metadata')
                    .eq('session_id', dbSessionId)
                    .single()
                ).data?.metadata?.context?.session_id || null,
            } as any,
            sessionId: dbSessionId,
            customerId: (await supabase.auth.getUser()).data?.user?.id || '',
          });
          for (const m of resp.messages) {
            setMessages(prev => [
              ...prev,
              { id: m.id, role: m.role, text: m.text, ts: m.ts },
            ]);
          }
          setQuickReplies([
            {
              id: 'qr-edit-specs',
              label: 'Edit Specs',
              value: '__edit_specs__',
            },
            {
              id: 'qr-send-specs',
              label: 'Send Specs to Customer',
              value: '__send_specs__',
            },
            { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
          ]);
        } catch (e) {
          console.error('Failed to open saved specs editor', e);
        }
      })();
      return;
    }

    if (val === '__send_specs__' && dbSessionId) {
      void (async () => {
        try {
          const resp = await sendQuoteProposal({
            actionNode: {
              id: 'send_specs',
              type: 'action',
              action: 'send_quote_proposal',
              action_config: { conversation_id_key: 'session_id' },
            } as any,
            context: {
              session_id:
                (
                  await supabase
                    .from('chat_sessions_v2')
                    .select('metadata')
                    .eq('session_id', dbSessionId)
                    .single()
                ).data?.metadata?.context?.session_id || null,
            } as any,
            sessionId: dbSessionId,
            customerId: (await supabase.auth.getUser()).data?.user?.id || '',
          });
          await appendMessagesWithTyping(
            resp.messages.map(m => ({ role: m.role as ChatRole, text: m.text }))
          );
          setQuickReplies([
            { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
          ]);
        } catch (e) {
          console.error('Failed to send specs', e);
        }
      })();
      return;
    }

    // Drive JSONB flow for quick replies
    // Note: Don't add user message locally here - JsonbFlowProcessor will insert it to DB
    // and we'll fetch all messages (including the user message) from the database after processing
    if (!dbSessionId) {
      // No session, nothing to process
      return;
    }

    void (async () => {
      try {
        // Determine which flow to use based on current session
        let flowId = 'admin-quote-propose'; // default

        // Check if we have a session and determine the flow from metadata
        if (dbSessionId) {
          const { data: sessionData } = await supabase
            .from('chat_sessions_v2')
            .select('flow_id')
            .eq('session_id', dbSessionId)
            .single();

          if (sessionData?.flow_id) {
            flowId = sessionData.flow_id;
          }
        }

        const flowDef = await getFlowDefinition(flowId);
        if (!flowDef) {
          // No flow found, no typing needed
          return;
        }
        // Track existing message IDs before processing to distinguish old vs new messages
        const existingMessageIds = new Set(messages.map(m => m.id));

        const resp = await JsonbFlowProcessor.processInput({
          sessionId: dbSessionId,
          userInput: val,
          flowDefinition: flowDef,
          senderRole: 'admin',
          displayLabel: label,
        });

        // Fetch all messages from database to ensure consistency (includes user message with cleaned text)
        const allMessages = await fetchSessionMessagesV2(dbSessionId);
        const mappedMessages: ChatMessage[] = allMessages.map(m => {
          const isExisting = existingMessageIds.has(m.id);
          return {
            id: m.id,
            role: m.role === 'admin' ? 'user' : 'printy',
            // Extract display text for user/admin messages (clean UUID|CategoryName to CategoryName)
            text: m.role === 'admin' ? extractDisplayText(m.text) : m.text,
            ts: m.ts,
            metadata: m.metadata || null,
            // Mark existing messages as historical to prevent typing animations
            // New messages (from this quick reply click) should animate
            isHistorical: isExisting,
          };
        });

        // Update UI with all messages from database (includes cleaned user message)
        // Don't call appendMessagesWithTyping here since all messages are already in the state
        // The typing animation will be handled by the MessageGroup component based on isHistorical flag
        setMessages(mappedMessages);
        setQuickReplies(
          (resp.quickReplies || []).map((qr, i) => ({
            id: qr.id || `qr-${i}`,
            label: qr.label,
            value: qr.value,
          }))
        );
        // Note: Messages are already in the database from JsonbFlowProcessor.processInput
        // No need to add them again via addConvMessage
        // Ensure typing is off after processing
        setIsTyping(false);
      } catch (e) {
        console.error('Failed to process quick reply', e);
        // Ensure typing is off on error
        setIsTyping(false);
      }
    })();
  };

  return {
    chatOpen,
    setChatOpen,
    messages,
    isTyping,
    quickReplies,
    handleChatOpen,
    handleChatOpenWithTopic,
    handleShowConversation,
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
    readOnly,
    dbSessionId,
    currentConversationId,
  };
};

export default useAdminChat;
