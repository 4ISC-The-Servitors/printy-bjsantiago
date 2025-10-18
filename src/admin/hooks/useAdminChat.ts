import { useState } from 'react';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '@features/chat/types/chat';
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import { getFlowDefinition } from '@features/chat/api/jsonbChatFlowApi';
import { useAdmin } from '@admin/hooks/AdminContext';
import { useInquiryActions } from './useInquiryActions';
import { useAdminConversations } from './useAdminConversations';
import { ChatDatabaseService } from '@features/chat/services/ChatDatabaseService';
import {
  editSavedSpecs,
  sendQuoteProposal,
} from '@features/chat/actions/admin';
import { supabase } from '@lib/supabase';

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
}

export const useAdminChat = (): UseAdminChatReturn => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [currentFlow, setCurrentFlow] = useState<string>('intro');
  const [, setCurrentContext] = useState<any>({});
  const [pendingAction, setPendingAction] = useState<
    null | 'assign' | 'status'
  >(null);
  const [currentInquiryId] = useState<string | null>(null);
  const { updateInquiryStatus, assignInquiry, saveResolutionComment } =
    useInquiryActions();
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

  const buildConversationTitle = (topic: string, orderId?: string): string => {
    const t = (topic || '').toLowerCase();
    if (t.includes('orders') || t.includes('order')) {
      return orderId ? `Orders • ${orderId}` : 'Orders';
    }
    if (t.includes('tickets') || t.includes('ticket')) {
      return orderId ? `Tickets • ${orderId}` : 'Tickets';
    }
    if (t.includes('quotes') || t.includes('quote')) {
      return orderId ? `Quotes • ${orderId}` : 'Quotes';
    }
    if (t.includes('add-service') || t.includes('add service')) {
      return 'Add Service';
    }
    if (t.includes('portfolio') || t.includes('service')) {
      return orderId ? `Portfolio • ${orderId}` : 'Portfolio';
    }
    return 'Admin Chat';
  };

  const endChatWithDelay = () => {
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
      setCurrentFlow('intro');
      setCurrentContext({});
      return;
    }

    const endMessage = {
      id: crypto.randomUUID(),
      role: 'printy' as const,
      text: 'Thank you for chatting with Printy! Have a great day. 👋',
      ts: Date.now(),
    };
    setMessages(prev => [...prev, endMessage]);
    if (currentConversationId)
      addConvMessage('printy', endMessage.text, currentConversationId);
    setQuickReplies([]);
    setTimeout(() => {
      if (currentConversationId) {
        endConversation(currentConversationId);
        setCurrentConversationId(null);
      }
      // End DB-backed session if any
      if (dbSessionId) {
        void ChatDatabaseService.endSession(dbSessionId);
        setDbSessionId(null);
      }
      setReadOnly(false);
      setChatOpen(false);
      setMessages([]);
    }, 2000);
  };

  const handleChatOpen = () => {
    setReadOnly(false);
    try {
      clearSelected();
    } catch {}
    setChatOpen(true);
    if (messages.length === 0) {
      setCurrentFlow('intro');
      setCurrentContext({});
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
    updateOrder?: (orderId: string, updates: any) => void,
    orders?: any[],
    refreshOrders?: () => void,
    orderIds?: string[]
  ) => {
    setReadOnly(false);
    try {
      clearSelected();
    } catch {}
    setChatOpen(true);
    const nextTopic = topic || 'intro';

    // If switching topics or explicitly provided orderIds (multi-select), always (re)initialize
    const shouldReset =
      currentFlow !== nextTopic || (orderIds && orderIds.length > 0);

    if (messages.length === 0 || shouldReset) {
      setCurrentFlow(nextTopic);

      // Pass context - handle both order and service contexts
      let context: any;
      if (nextTopic === 'multiple-portfolio') {
        context = {
          serviceIds: orderIds,
          services: orders,
          updateService: updateOrder,
          refreshServices: refreshOrders,
        };
      } else if (nextTopic === 'portfolio') {
        context = {
          serviceId: orderId,
          services: orders,
          updateService: updateOrder,
          refreshServices: refreshOrders,
        };
      } else if (nextTopic === 'multiple-tickets') {
        context = {
          ticketIds: orderIds,
          tickets: orders,
          // Bridge tickets flow updates to Supabase
          updateTicket: async (ticketId: string, updates: any) => {
            try {
              if (typeof updates?.status === 'string') {
                const map: Record<string, string> = {
                  Open: 'open',
                  Pending: 'in_progress',
                  Closed: 'closed',
                };
                const db = map[updates.status] || updates.status;
                await updateInquiryStatus(ticketId, db);
              }
              if (typeof updates?.lastMessage === 'string') {
                await saveResolutionComment(ticketId, updates.lastMessage);
              }
            } catch (e) {
              console.error('Failed to update ticket', e);
            }
          },
          refreshTickets: refreshOrders,
        };
      } else if (nextTopic === 'tickets') {
        context = {
          ticketId: orderId,
          tickets: orders,
          // Bridge tickets flow updates to Supabase
          updateTicket: async (ticketId: string, updates: any) => {
            try {
              if (typeof updates?.status === 'string') {
                const map: Record<string, string> = {
                  Open: 'open',
                  Pending: 'in_progress',
                  Closed: 'closed',
                };
                const db = map[updates.status] || updates.status;
                await updateInquiryStatus(ticketId, db);
              }
              if (typeof updates?.lastMessage === 'string') {
                await saveResolutionComment(ticketId, updates.lastMessage);
              }
            } catch (e) {
              console.error('Failed to update ticket', e);
            }
          },
          refreshTickets: refreshOrders,
        };
      } else if (nextTopic === 'quotes') {
        context = {
          conversationId: orderId,
          quotes: orders,
          // Bridge quotes flow updates to Supabase
          updateQuote: async (conversationId: string, updates: any) => {
            try {
              if (typeof updates?.status === 'string') {
                const { error } = await supabase
                  .from('quotes')
                  .update({
                    status: updates.status,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('session_id', conversationId);

                if (error) {
                  console.error('Failed to update quote status', error);
                  throw error;
                }
              }
              // Refresh the quotes data after update
              refreshOrders?.();
            } catch (e) {
              console.error('Failed to update quote', e);
            }
          },
          refreshQuotes: refreshOrders,
        };
        // Note: Quotes use conversationId, not inquiryId
      } else {
        context = orderId
          ? { orderId, updateOrder, orders, refreshOrders, orderIds }
          : { updateOrder, orders, refreshOrders, orderIds };
      }

      setCurrentContext(context);

      console.log('🎯 useAdminChat opening with topic:', nextTopic);
      console.log('📋 Context:', context);

      console.log('🔍 Opening admin JSONB flow for topic:', nextTopic);
      const title = buildConversationTitle(nextTopic, orderId);
      const convId = startConversation ? startConversation(title) : 'conv';
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

          await supabase
            .from('chat_sessions_v2')
            .update({
              metadata: {
                ...(existingSession?.metadata || {}),
                admin_chat: true,
                title: nextTopic === 'orders' 
                  ? `Order: ${orderId || 'New Order'}`
                  : `Quote: ${orderId || 'New Quote'}`,
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
    setChatOpen(true);
    setCurrentConversationId(conversationId);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
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
    }
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
    // Persist admin's message to chat_messages for all admin chats
    if (dbSessionId) {
      void ChatDatabaseService.insertMessage({
        sessionId: dbSessionId,
        text,
        role: 'admin',
      });
    }
    setIsTyping(true);

    // Intercepts for pending actions
    const trimmed = text.trim();
    // No separate resolution action; Reply handles resolution saving below
    if (pendingAction === 'assign' && currentInquiryId) {
      void (async () => {
        try {
          await assignInquiry(currentInquiryId, trimmed);
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: `Ticket assigned to ${trimmed}.`,
              ts: Date.now(),
            },
          ]);
          if (currentConversationId)
            addConvMessage(
              'printy',
              `Ticket assigned to ${trimmed}.`,
              currentConversationId
            );
        } catch (e: any) {
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: `Failed to assign ticket: ${e?.message || 'Unknown error'}`,
              ts: Date.now(),
            },
          ]);
          if (currentConversationId)
            addConvMessage(
              'printy',
              `Failed to assign ticket: ${e?.message || 'Unknown error'}`,
              currentConversationId
            );
        } finally {
          setPendingAction(null);
        }
      })();
      setIsTyping(false);
      return;
    }

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

    // no "create new" option to avoid confusion; admins can re-open editor any time

    // Ticket action intercepts
    if (val === 'Assign to') {
      setPendingAction('assign');
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Who should resolve this ticket? Type the staff name.',
          ts: Date.now(),
        },
      ]);
      return;
    }
    if (
      (['Open', 'Pending', 'Closed'] as string[]).includes(val) &&
      currentInquiryId
    ) {
      const dbStatus = (
        {
          Open: 'open',
          Pending: 'in_progress',
          Closed: 'closed',
        } as const
      )[val as 'Open' | 'Pending' | 'Closed'];
      void (async () => {
        try {
          await updateInquiryStatus(currentInquiryId, dbStatus);
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: `Status updated to ${val}.`,
              ts: Date.now(),
            },
          ]);
        } catch (e: any) {
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: `Failed to update status: ${e?.message || 'Unknown error'}`,
              ts: Date.now(),
            },
          ]);
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
    // Persist admin quick-reply selection to DB for all admin chats
    if (dbSessionId) {
      void ChatDatabaseService.insertMessage({
        sessionId: dbSessionId,
        text: val,
        role: 'printy',
      });
    }
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
  };
};

export default useAdminChat;
