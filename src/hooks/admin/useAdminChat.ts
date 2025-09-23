// BACKEND_TODO: Ensure this orchestrator receives live context from pages using Supabase data (orders/services/tickets).
// Remove any reliance on mock data within flows; flows should operate on passed context only.
import { useState } from 'react';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '../../components/chat/_shared/types';
import { resolveAdminFlow, dispatchAdminCommand } from '../../chatLogic/admin';
import { useAdmin } from '@hooks/admin/AdminContext';
import { useInquiryActions } from './useInquiryActions';
import { useAdminConversations } from './useAdminConversations';

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
    null | 'resolution' | 'assign' | 'status'
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

  const buildConversationTitle = (topic: string, orderId?: string): string => {
    const t = (topic || '').toLowerCase();
    if (t.includes('orders') || t.includes('order')) {
      return orderId ? `Orders • ${orderId}` : 'Orders';
    }
    if (t.includes('tickets') || t.includes('ticket')) {
      return orderId ? `Tickets • ${orderId}` : 'Tickets';
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
      const flow = resolveAdminFlow('intro');
      if (!flow) return;
      const initial = flow.initial({});
      setMessages(
        initial.map(m => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        }))
      );
      initial.forEach(m => addConvMessage('printy', m.text, convId));
      setQuickReplies(
        flow
          .quickReplies()
          .map((l, index) => ({ id: `qr-${index}`, label: l, value: l }))
      );
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
      let context;
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
          updateTicket: updateOrder,
          refreshTickets: refreshOrders,
        };
      } else if (nextTopic === 'tickets') {
        context = {
          ticketId: orderId,
          tickets: orders,
          updateTicket: updateOrder,
          refreshTickets: refreshOrders,
        };
        setCurrentInquiryId(orderId || null);
      } else {
        context = orderId
          ? { orderId, updateOrder, orders, refreshOrders, orderIds }
          : { updateOrder, orders, refreshOrders, orderIds };
      }

      setCurrentContext(context);

      console.log('🎯 useAdminChat opening with topic:', nextTopic);
      console.log('📋 Context:', context);

      const flow = resolveAdminFlow(nextTopic);
      console.log('🔍 Resolved flow:', flow);
      if (!flow) {
        console.error('❌ No flow found for topic:', nextTopic);
        return;
      }
      const title = buildConversationTitle(nextTopic, orderId);
      const convId = startConversation(title);
      setCurrentConversationId(convId);
      const initial = flow.initial(context);

      console.log('💬 Initial messages from useAdminChat:', initial);
      console.log('⚡ Quick replies from flow:', flow.quickReplies());

      setMessages(
        initial.map(m => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        }))
      );
      initial.forEach(m => addConvMessage('printy', m.text, convId));
      setQuickReplies(
        flow
          .quickReplies()
          .map((l, index) => ({ id: `qr-${index}`, label: l, value: l }))
      );
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
    setIsTyping(true);

    // Intercepts for pending actions
    const trimmed = text.trim();
    if (pendingAction === 'resolution' && currentInquiryId) {
      void (async () => {
        try {
          await saveResolutionComment(currentInquiryId, trimmed);
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: 'Resolution comment saved and sent to the customer.',
              ts: Date.now(),
            },
          ]);
          if (currentConversationId)
            addConvMessage(
              'printy',
              'Resolution comment saved and sent to the customer.',
              currentConversationId
            );
        } catch (e: any) {
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'printy',
              text: `Failed to save resolution: ${e?.message || 'Unknown error'}`,
              ts: Date.now(),
            },
          ]);
          if (currentConversationId)
            addConvMessage(
              'printy',
              `Failed to save resolution: ${e?.message || 'Unknown error'}`,
              currentConversationId
            );
        } finally {
          setPendingAction(null);
        }
      })();
      setIsTyping(false);
      return;
    }
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
    const flow = resolveAdminFlow(currentFlow);
    if (flow) {
      void flow.respond(currentContext, text).then(resp => {
        const botMessages = resp.messages.map(m => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        }));
        setMessages(prev => [...prev, ...botMessages]);
        if (currentConversationId) {
          resp.messages.forEach(m =>
            addConvMessage('printy', m.text, currentConversationId)
          );
        }
        setQuickReplies(
          (resp.quickReplies || []).map((l, index) => ({
            id: `qr-${index}`,
            label: l,
            value: l,
          }))
        );
        setIsTyping(false);
      });
    } else {
      // Fallback to dispatchAdminCommand for general cases
      const dispatched = dispatchAdminCommand(text);
      if (dispatched) {
        const d = dispatched as {
          messages?: { role: string; text: string }[];
          quickReplies?: string[];
        };
        const botMessages = (d.messages || []).map(m => ({
          id: crypto.randomUUID(),
          role: m.role as ChatRole,
          text: m.text,
          ts: Date.now(),
        }));
        setMessages(prev => [...prev, ...botMessages]);
        setQuickReplies(
          (d.quickReplies || []).map((l, index) => ({
            id: `qr-${index}`,
            label: l,
            value: l,
          }))
        );
        setIsTyping(false);
      } else {
        setIsTyping(false);
      }
    }
  };

  const handleQuickReply = (v: string) => {
    const val = v.trim();
    if (val.toLowerCase().includes('end')) {
      setMessages([]);
      return;
    }

    // Ticket action intercepts
    if (val === 'Create Resolution comment') {
      setPendingAction('resolution');
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Please type the resolution comment.',
          ts: Date.now(),
        },
      ]);
      return;
    }
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
    setIsTyping(true);

    const flow = resolveAdminFlow(currentFlow);
    if (!flow) return;
    void flow.respond(currentContext, val).then(resp => {
      const botMessages = resp.messages.map(m => ({
        id: crypto.randomUUID(),
        role: m.role as ChatRole,
        text: m.text,
        ts: Date.now(),
      }));
      setMessages(prev => [...prev, ...botMessages]);
      setQuickReplies(
        (resp.quickReplies || []).map((l, index) => ({
          id: `qr-${index}`,
          label: l,
          value: l,
        }))
      );
      if (currentConversationId) {
        resp.messages.forEach(m =>
          addConvMessage('printy', m.text, currentConversationId)
        );
      }
      setIsTyping(false);
    });
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
