import { useState } from 'react';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '@features/chat/types/chat';
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import { ChatEndService } from '@features/chat/services/ChatEndService';
import { getFlowDefinition } from '@features/chat/api/jsonbChatFlowApi';
import { useAdmin } from '@admin/hooks/AdminContext';
import { useAdminConversations } from './useAdminConversations';
import { ChatDatabaseService } from '@features/chat/services/ChatDatabaseService';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
import {
  editSavedSpecs,
  sendQuoteProposal,
} from '@features/chat/actions/admin';
import { supabase } from '@lib/supabase';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

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
  handleQuickReply: (value: string) => void;
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
    endConversation,
    loadAdminChatSessions,
    loadHistoricalMessages,
  } = useAdminConversations();
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [viewingHistorical, setViewingHistorical] = useState<boolean>(false);
  const { clearSelected } = useAdmin();
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const { showConversationSwitchToast, clearLoadingToasts } = useChatLoadingToast();

  // Helper: append Printy messages gradually with typing indicator
  // Set skipDelay=true for admin flows to show messages instantly
  const appendMessagesWithTyping = async (
    botTexts: { role: ChatRole; text: string }[],
    skipDelay: boolean = false
  ) => {
    for (const m of botTexts) {
      if (!skipDelay) {
        setIsTyping(true);
        // Simple delay heuristic: base 350ms + 25ms per 20 chars
        const delay =
          350 + Math.min(1200, Math.floor((m.text?.length || 0) / 20) * 25);
        await new Promise(r => setTimeout(r, delay));
      }
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
        setIsTyping(false);
      }
    }
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
            conversationId: currentConversationId
          });

          if (result.success) {
            // Fetch the end message from database to show it in UI
            const { fetchSessionMessagesV2 } = await import('@features/chat/api/jsonbChatFlowApi');
            const messages = await fetchSessionMessagesV2(dbSessionId);
            const lastMessage = messages[messages.length - 1];

            if (lastMessage) {
              const endMessage = {
                id: lastMessage.id,
                role: 'printy' as const,
                text: lastMessage.text,
                ts: lastMessage.ts,
              };
              setMessages(prev => [...prev, endMessage]);
              if (currentConversationId)
                addConvMessage('printy', endMessage.text, currentConversationId);
            }

            setQuickReplies([]);

            // Close after a delay
            setTimeout(() => {
              if (currentConversationId) {
                endConversation(currentConversationId);
                setCurrentConversationId(null);
              }
              setDbSessionId(null);
              setReadOnly(false);
              setChatOpen(false);
              setMessages([]);
              // Dispatch event for notification visibility
              window.dispatchEvent(new CustomEvent('admin-chat-closed'));
            }, 2000);
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
      }
    } else {
      // No database session, just close
      setChatOpen(false);
      setMessages([]);
      setQuickReplies([]);
      setCurrentConversationId(null);
      setReadOnly(false);
    }
  };

  const handleChatOpen = () => {
    setReadOnly(false);
    try {
      clearSelected();
    } catch {}
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
    orderIds?: string[]
  ) => {
    setReadOnly(false);
    try {
      clearSelected();
    } catch {}
    setChatOpen(true);
    // Dispatch event for notification visibility
    window.dispatchEvent(new CustomEvent('admin-chat-opened'));
    const nextTopic = topic || 'intro';

    // If explicitly provided orderIds (multi-select), always (re)initialize
    const shouldReset = (orderIds && orderIds.length > 0);

    if (messages.length === 0 || shouldReset) {
      // Pass context - only for supported flows
      let context: any;
      if (nextTopic === 'tickets') {
        // Only store inquiry_id for ticket review
        context = {
          inquiry_id: orderId, // Store the inquiry_id for fetchTicketForAdmin action
        };
      } else if (nextTopic === 'quotes') {
        // Only store conversationId for quote flows
        context = {
          conversationId: orderId,
        };
      } else if (nextTopic === 'orders') {
        // Only store orderId for order flows
        context = {
          orderId,
        };
      } else {
        // Default context for other flows
        context = orderId ? { orderId } : {};
      }

      console.log('🎯 useAdminChat opening with topic:', nextTopic);
      console.log('📋 Context:', context);

      console.log('🔍 Opening admin JSONB flow for topic:', nextTopic);
      // Temporary title for UI (will be properly set when saved to database)
      const tempTitle = orderId
        ? `${nextTopic.charAt(0).toUpperCase() + nextTopic.slice(1)}: ${orderId}`
        : nextTopic.charAt(0).toUpperCase() + nextTopic.slice(1);
      const convId = startConversation ? startConversation(tempTitle) : 'conv';
      setCurrentConversationId(convId);

      // Handle async initial() for JSONB admin flows - check quote status first
      void (async () => {
        let start: any = null;
        // ✅ FIX: Declare flowId at function scope so it's accessible throughout
        let flowId = 'admin-quote-propose'; // default

        try {
          // For quotes topic, check the quote status to determine which flow to start
          let flowDef = null;

          if (nextTopic === 'orders' && orderId) {
            console.log('🔍 Orders topic detected - checking order status for order_id:', orderId);
            
            // Check order status to determine which flow to start
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('status, order_id, display_id, customer_id')
              .eq('order_id', orderId)
              .single();

            if (!orderError && orderData) {
              console.log('📊 Order status:', orderData.status);

              if (orderData.status === 'verifying_payment') {
                console.log('✅ Order is in verifying_payment status - starting admin-verify-payment flow');
                flowId = 'admin-verify-payment';
                context = {
                  ...context,
                  order_id: orderData.order_id,
                  display_id: orderData.display_id,
                  customer_id: orderData.customer_id,
                };
              } else {
                console.log('⚠️ Order is not in verifying_payment status - using default flow');
                // For other order statuses, could add more specific flows later
                // For now, just use the default flow
              }
            } else {
              console.log('⚠️ Could not find order data, using default flow');
            }
          } else if (nextTopic === 'tickets' && orderId) {
            console.log('🔍 Tickets topic detected - starting admin-review-ticket flow for inquiry_id:', orderId);
            flowId = 'admin-review-ticket';
            
            // Ensure inquiry_id is in context for fetchTicketForAdmin action
            context = {
              ...context,
              inquiry_id: orderId,
            };
          } else if (nextTopic === 'quotes' && orderId) {
            console.log('🔍 Checking quote status for session_id:', orderId);

            // Check quote status to determine which flow to start
            const { data: quoteData, error: quoteError } = await supabase
              .from('quotes')
              .select('status, quote_id, session_id')
              .eq('session_id', orderId)
              .single();

            if (!quoteError && quoteData) {
              console.log('📊 Quote status:', quoteData.status);

              if (quoteData.status === 'accepted') {
                console.log(
                  '✅ Quote is accepted - starting admin-create-order flow'
                );
                flowId = 'admin-create-order';

                // Get the accepted proposal for context
                const { data: proposalData } = await supabase
                  .from('quote_proposals')
                  .select('proposal_id')
                  .eq('session_id', orderId)
                  .eq('status', 'accepted')
                  .single();

                if (proposalData) {
                  console.log(
                    '📋 Found accepted proposal:',
                    proposalData.proposal_id
                  );
                  // Update context with quote_id and proposal_id
                  context = {
                    ...context,
                    quote_id: quoteData.quote_id,
                    proposal_id: proposalData.proposal_id,
                    session_id: orderId,
                  };
                }
              } else {
                // For non-accepted quotes, check if there are saved specs
                console.log(
                  '📝 Quote is not accepted - checking for saved specs'
                );

                const { data: savedSpecs } = await supabase
                  .from('quote_specs')
                  .select('spec_id, spec_data')
                  .eq('session_id', orderId)
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (savedSpecs && savedSpecs.length > 0) {
                  console.log(
                    '📋 Found saved specs - using admin-quote-propose flow with saved specs context'
                  );
                  flowId = 'admin-quote-propose';
                  context = {
                    ...context,
                    quote_id: quoteData.quote_id,
                    session_id: orderId,
                    has_saved_specs: true,
                    saved_spec_id: savedSpecs[0].spec_id,
                  };
                } else {
                  console.log(
                    '📝 No saved specs found - using admin-quote-propose flow for new specs'
                  );
                  flowId = 'admin-quote-propose';
                  context = {
                    ...context,
                    quote_id: quoteData.quote_id,
                    session_id: orderId,
                    has_saved_specs: false,
                  };
                }
              }
            } else {
              console.log('⚠️ Could not find quote data, using default flow');
            }
          }

          console.log(`🔍 Loading ${flowId} flow definition...`);
          flowDef = await getFlowDefinition(flowId);
          if (!flowDef) {
            console.error(`Failed to load flow definition for ${flowId}`);
            return;
          }
          console.log('Flow definition loaded:', flowDef);

          console.log(`Starting ${flowId} flow...`);
          start = await JsonbFlowProcessor.startFlow({
            flowId,
            customerId:
              (await supabase.auth.getUser()).data?.user?.id ||
              '00000000-0000-0000-0000-000000000000',
            flowDefinition: flowDef,
            initialContext: { session_id: orderId, ...context },
          });
          console.log('Flow started successfully:', start);
          setDbSessionId(start.sessionId);
        } catch (error) {
          console.error(`Error starting flow:`, error);
          return;
        }

        if (!start) {
          console.error('Flow start failed - no result');
          return;
        }

        // Persist admin chat session to database for "All Chats" view
        try {
          const { data: existingSession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', start.sessionId)
            .single();

          // Use centralized title generation
          // ✅ FIX: Preserve existing context (including session_id) while adding display_id
          const titleMetadata = {
            ...(existingSession?.metadata || {}),
            admin_chat: true,
            context: {
              ...(existingSession?.metadata?.context || {}), // Keep existing context properties
              display_id: orderId,
            },
          };

          const sessionTitle = getSessionTitle({
            flowId,
            metadata: titleMetadata,
          });

          await supabase
            .from('chat_sessions_v2')
            .update({
              metadata: {
                ...titleMetadata,
                title: sessionTitle,
              },
            })
            .eq('session_id', start.sessionId);

          // Refresh the conversations list to show the new session
          await loadAdminChatSessions();
        } catch (e) {
          console.error('Failed to update admin chat metadata:', e);
        }

        console.log('Appending messages to UI:', start.messages);
        // ✅ FIX: Skip typing delays for admin-create-order flow (shows messages instantly)
        // Keep delays for admin-quote-propose to feel more conversational
        const skipDelay = flowId === 'admin-create-order';
        await appendMessagesWithTyping(
          start.messages.map((m: any) => ({
            role: m.role as ChatRole,
            text: m.text,
          })),
          skipDelay
        );

        // ✅ FIX: Only check for saved specs if this is admin-quote-propose flow
        // For admin-create-order flow, skip this check entirely
        if (flowId === 'admin-quote-propose') {
          // Inject smarter quick replies if there is already a saved spec for this quote session
          try {
            if (orderId) {
              const { data: existingSpecs } = await supabase
                .from('quote_specs')
                .select('spec_id')
                .eq('session_id', orderId)
                .order('created_at', { ascending: false })
                .limit(1);
              if (existingSpecs && existingSpecs.length > 0) {
                // Remind admin there is a drafted spec and present actions
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
            } else {
              setQuickReplies(start.quickReplies || []);
            }
          } catch {
            setQuickReplies(start.quickReplies || []);
          }
        } else {
          // For other flows (like admin-create-order), just use the flow's quick replies
          setQuickReplies(start.quickReplies || []);
        }

        // Persist initial bot messages to DB if this is a ticket chat and a session was created
        if (nextTopic.includes('ticket')) {
          try {
            // Small delay to allow session creation async to complete
            await new Promise(r => setTimeout(r, 80));
            if (dbSessionId) {
              for (const m of start.messages) {
                await ChatDatabaseService.insertMessage({
                  sessionId: dbSessionId,
                  text: m.text,
                  role: 'printy',
                });
              }
            }
          } catch {}
        }

        start.messages.forEach((m: any) =>
          addConvMessage('printy', m.text, convId)
        );

        // No extra respond step; the JSONB flow already displayed details via action auto-advance
      })();

      return;
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

    if (conv.status === 'ended') {
      // For ended conversations, load historical messages from database
      setViewingHistorical(true);
      setReadOnly(true);
      setQuickReplies([]);
      setDbSessionId(conversationId);

      try {
        const historicalMessages =
          await loadHistoricalMessages(conversationId);
        setMessages(historicalMessages);
      } catch (error) {
        console.error('Failed to load historical messages:', error);
        setMessages([]);
      }
    } else {
      // For active conversations, use existing messages
      setViewingHistorical(false);
      setReadOnly(false);
      setMessages((conv.messages as any).slice());
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
    setIsTyping(true);

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
            setIsTyping(false);
            return;
          }

          const resp = await JsonbFlowProcessor.processInput({
            sessionId: dbSessionId,
            userInput: text,
            flowDefinition: flowDef,
            senderRole: 'admin',
          });

          // Skip delays for admin flows to show messages instantly
          const skipDelay = flowId === 'admin-create-order' || flowId === 'admin-verify-payment';
          await appendMessagesWithTyping(
            resp.messages.map(m => ({ role: m.role as ChatRole, text: m.text })),
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
        } finally {
          setIsTyping(false);
        }
      })();
    } else {
      // No active session, just stop typing
      setIsTyping(false);
    }
  };

  const handleQuickReply = (v: string) => {
    const val = v.trim();
    if (val.toLowerCase() === 'end chat') {
      setMessages([]);
      return;
    }

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

    // Echo the user's quick reply as a user message for proper transcript
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      text: val,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    if (currentConversationId)
      addConvMessage('user', val, currentConversationId);
    // ✅ FIX: Don't insert message here - JsonbFlowProcessor will handle it
    // This prevents duplicate quick reply messages in the database
    // if (dbSessionId) {
    //   void ChatDatabaseService.insertMessage({
    //     sessionId: dbSessionId,
    //     text: val,
    //     role: 'printy',
    //   });
    // }
    setIsTyping(true);

    // Drive JSONB flow for quick replies
    if (!dbSessionId) {
      setIsTyping(false);
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
          setIsTyping(false);
          return;
        }
        const resp = await JsonbFlowProcessor.processInput({
          sessionId: dbSessionId,
          userInput: val,
          flowDefinition: flowDef,
          senderRole: 'admin',
        });
        // ✅ FIX: Skip delays for admin-create-order responses
        const skipDelay = flowId === 'admin-create-order';
        await appendMessagesWithTyping(
          resp.messages.map(m => ({ role: m.role as ChatRole, text: m.text })),
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
        console.error('Failed to process quick reply', e);
      } finally {
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
