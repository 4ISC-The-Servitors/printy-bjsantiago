// BACKEND_TODO: Ensure this orchestrator receives live context from pages using Supabase data (orders/services/tickets).
// Remove any reliance on mock data within flows; flows should operate on passed context only.
import { useState } from 'react';
import type {
  ChatMessage,
  QuickReply,
  ChatRole,
} from '../../components/chat/_shared/types';
import { resolveAdminFlow, dispatchAdminCommand } from '../../chatLogic/admin';
import { useInquiryActions } from './useInquiryActions';

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
  endChatWithDelay: () => void;
  handleSendMessage: (text: string) => void;
  handleQuickReply: (value: string) => void;
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

  const endChatWithDelay = () => {
    const endMessage = {
      id: crypto.randomUUID(),
      role: 'printy' as const,
      text: 'Thank you for chatting with Printy! Have a great day. 👋',
      ts: Date.now(),
    };
    setMessages(prev => [...prev, endMessage]);
    setQuickReplies([]);
    setTimeout(() => {
      setChatOpen(false);
      setMessages([]);
    }, 2000);
  };

  const handleChatOpen = () => {
    setChatOpen(true);
    if (messages.length === 0) {
      setCurrentFlow('intro');
      setCurrentContext({});
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
      setQuickReplies(
        flow
          .quickReplies()
          .map((l, index) => ({ id: `qr-${index}`, label: l, value: l }))
      );
      return;
    }
  };

  const handleSendMessage = (text: string) => {
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      text,
      ts: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
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
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
  };
};

export default useAdminChat;
