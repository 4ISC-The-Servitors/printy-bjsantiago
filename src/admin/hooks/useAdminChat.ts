// BACKEND_TODO: Ensure this orchestrator receives live context from pages using Supabase data (orders/services/tickets).
// Remove any reliance on mock data within flows; flows should operate on passed context only.
import { useState } from 'react';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '../../components/chat/types';
// Legacy admin scripted flows removed; use JSONB flows only.
import { JsonbFlowProcessor } from '@features/chat/core/services/JsonbFlowProcessor';
import { getFlowDefinition } from '@features/api/jsonbChatFlowApi';
import { useAdmin } from '@admin/hooks/AdminContext';
import { useInquiryActions } from './useInquiryActions';
import { useAdminConversations } from './useAdminConversations';
import { ChatDatabaseService } from '@features/chat/core/services/ChatDatabaseService';
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
  handleShowConversation: (conversationId: string) => void;
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
  const [currentContext, setCurrentContext] = useState<any>({});
  const [pendingAction, setPendingAction] = useState<
    null | 'assign' | 'status'
  >(null);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);
  const { updateInquiryStatus, assignInquiry, saveResolutionComment } =
    useInquiryActions();
  const {
    conversations,
    startConversation,
    addMessage: addConvMessage,
    endConversation,
  } = useAdminConversations();
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const { clearSelected } = useAdmin();
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);

  // Helper: append Printy messages gradually with typing indicator
  const appendMessagesWithTyping = async (botTexts: { role: ChatRole; text: string }[]) => {
    for (const m of botTexts) {
      setIsTyping(true);
      // Simple delay heuristic: base 350ms + 25ms per 20 chars
      const delay = 350 + Math.min(1200, Math.floor((m.text?.length || 0) / 20) * 25);
      await new Promise(r => setTimeout(r, delay));
      const botMsg = { id: crypto.randomUUID(), role: m.role, text: m.text, ts: Date.now() } as const;
      setMessages(prev => [...prev, botMsg]);
      if (currentConversationId) addConvMessage('printy', m.text, currentConversationId);
      setIsTyping(false);
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
    if (readOnly || (existing && existing.status === 'ended')) {
      // Close the dock and reset transient chat state so a fresh chat can start next time
      setChatOpen(false);
      setMessages([]);
      setQuickReplies([]);
      setCurrentConversationId(null);
      setReadOnly(false);
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
          customerId: (await supabase.auth.getUser()).data?.user?.id || '00000000-0000-0000-0000-000000000000',
          flowDefinition: flowDef,
          initialContext: {},
        });
        setDbSessionId(start.sessionId);
        await appendMessagesWithTyping(start.messages.map(m => ({ role: m.role as ChatRole, text: m.text })));
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
                  .update({ status: updates.status, updated_at: new Date().toISOString() })
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

      // Handle async initial() for JSONB admin-quote-propose
      void (async () => {
        const flowDef = await getFlowDefinition('admin-quote-propose');
        if (!flowDef) return;
        const start = await JsonbFlowProcessor.startFlow({
          flowId: 'admin-quote-propose',
          customerId: (await supabase.auth.getUser()).data?.user?.id || '00000000-0000-0000-0000-000000000000',
          flowDefinition: flowDef,
          initialContext: { session_id: orderId },
        });
        setDbSessionId(start.sessionId);
        await appendMessagesWithTyping(start.messages.map(m => ({ role: m.role as ChatRole, text: m.text })));
        setQuickReplies(start.quickReplies || []);

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

        start.messages.forEach(m => addConvMessage('printy', m.text, convId));

        // No extra respond step; the JSONB flow already displayed details via action auto-advance
      })();

      return;
    }
  };

  // Open an existing conversation in read-only if ended; do not start a new flow
  const handleShowConversation = (conversationId: string) => {
    setChatOpen(true);
    setCurrentConversationId(conversationId);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      setMessages((conv.messages as any).slice());
      // Preserve quick replies when resuming an active conversation;
      // clear them only for ended conversations
      if (conv.status === 'ended') setQuickReplies([]);
      setReadOnly(conv.status === 'ended');
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
    // Persist admin's message for ticket chats to chat_messages (store as 'printy')
    if (dbSessionId && currentFlow.includes('ticket')) {
      void ChatDatabaseService.insertMessage({
        sessionId: dbSessionId,
        text,
        role: 'printy',
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

    // Always use the current flow when we have context (like order-specific chats)
    // For JSONB admin flow, we don't process free-form replies; keep as no-op for now
    setIsTyping(false);
  };

  const handleQuickReply = (v: string) => {
    const val = v.trim();
    if (val.toLowerCase() === 'end chat') {
      setMessages([]);
      return;
    }

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
    // Persist admin quick-reply selection to DB (as 'printy') for ticket chats
    if (dbSessionId && currentFlow.includes('ticket')) {
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
        const flowDef = await getFlowDefinition('admin-quote-propose');
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
        await appendMessagesWithTyping(resp.messages.map(m => ({ role: m.role as ChatRole, text: m.text })));
        setQuickReplies((resp.quickReplies || []).map((qr, i) => ({ id: qr.id || `qr-${i}`, label: qr.label, value: qr.value })));
        if (currentConversationId) {
          resp.messages.forEach(m => addConvMessage('printy', m.text, currentConversationId));
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
