import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ChatRole, QuickReply } from '../../components/chat/_shared/types';
import { useToast } from '../../lib/useToast';
import { customerFlows as flows } from '../../chatLogic/customer';
import { mockOrders } from '../../data/orders';
import {
  attachSessionToFlow,
  createSession,
  fetchCurrentNode,
  fetchInitialNode,
  fetchOptions,
  fetchSessionMessages,
  fetchUserSessions,
  insertMessage,
  updateCurrentNode,
  endSession as endDbSession,
    fetchEndNodeText,
} from '../../api/chatFlowApi';
import { auth } from '../../lib/supabase';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  flowId: string;
  status: 'active' | 'ended';
  icon?: React.ReactNode;
}

export function useCustomerConversations() {
  const [toasts, toastMethods] = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentFlow, setCurrentFlow] = useState<{
    id: string;
    initial: (ctx: unknown) => { text: string }[];
    respond: (
      ctx: unknown,
      input: string
    ) => Promise<{ messages: { text: string }[]; quickReplies?: string[] }>;
    quickReplies: () => string[];
  } | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [inputPlaceholder, setInputPlaceholder] = useState('Type a message...');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const endTimerRef = useRef<number | null>(null);

  // Mock recent order used by events
  const recentOrder = useMemo(() => {
    const miguel = mockOrders.find(o => o.customer === 'Miguel Tan');
    return {
      id: miguel?.id || 'ORD-000145',
      total: '₱5,000',
    };
  }, []);

  const updateInputPlaceholder = (flowId: string, replies: QuickReply[]) => {
    if (flowId === 'issue-ticket' && replies.length === 0) {
      setInputPlaceholder('Enter your Order ID (e.g., ORD-123456)');
    } else if (replies.length === 0) {
      setInputPlaceholder('Type a message...');
    } else {
      setInputPlaceholder('Type a message...');
    }
  };

  const initializeFlow = async (flowId: string, title: string, ctx?: any) => {
    // Always fresh start for About Us; other flows remain legacy for now
    if (flowId === 'about') {
      setActiveFlowId(flowId);
      setIsTyping(true);
      try {
        const { data: userData } = await auth.getUser();
        const customerId = userData?.user?.id;
        if (!customerId) throw new Error('No authenticated user');

        // Create a new DB session
        const sessionId = await createSession(customerId);
        if (!sessionId) throw new Error('Failed to create session');
        setActiveSessionId(sessionId);

        // Create in-memory conversation wrapper for UI lists
        const conversation: Conversation = {
          id: sessionId,
          title,
          createdAt: Date.now(),
          messages: [],
          flowId,
          status: 'active',
          icon: undefined,
        };
        setConversations(prev => [conversation, ...prev]);
        setActiveId(sessionId);

        // Fetch initial node and attach session to flow
        const initialNode = await fetchInitialNode('about');
        if (!initialNode) throw new Error('No initial node');
        const attached = await attachSessionToFlow({ sessionId, flowId: 'about', nodeId: initialNode.node_id });
        if (!attached) throw new Error('Failed to attach session to flow');
        setActiveNodeId(initialNode.node_id);

        // Insert bot initial message in DB and reflect in UI
        await insertMessage({ sessionId, text: initialNode.text, role: 'printy', nodeId: initialNode.node_id });
        const fetched = await fetchSessionMessages(sessionId);
        setMessages(fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })));
        setConversations(prev => prev.map(c => (c.id === sessionId ? { ...c, messages: fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })) } : c)));

        // Load quick replies from options
        const options = await fetchOptions(initialNode.node_id);
        const replies = (options.length ? options.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]);
        setQuickReplies(replies);
        updateInputPlaceholder(flowId, replies);
      } catch (e) {
        console.error('initializeFlow DB error', e);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Legacy path for other flows
    const flow = (flows as any)[flowId];
    if (!flow) return;
    setCurrentFlow(flow as any);

    const initialMessages = (flow as any).initial?.(ctx || {}) || flow.initial({});

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      messages: [],
      flowId,
      status: 'active',
      icon: undefined,
    };
    setConversations(prev => [conversation, ...prev]);
    setActiveId(conversation.id);

    const msgs = initialMessages as { text: string }[];
    let index = 0;
    const renderNext = () => {
      if (index >= msgs.length) {
        let rawReplies = flow.quickReplies();
        if (!rawReplies || rawReplies.length === 0) rawReplies = ['End Chat'];
        const replies = rawReplies.map((label: string, i: number) => ({ id: `qr-${i}`, label, value: label }));
        setQuickReplies(replies);
        updateInputPlaceholder(flowId, replies);
        setIsTyping(false);
        return;
      }
      setIsTyping(true);
      setTimeout(() => {
        const m = msgs[index++];
        const botMsg: ChatMessage = { id: crypto.randomUUID(), role: 'printy' as ChatRole, text: m.text, ts: Date.now() };
        setMessages(prev => [...prev, botMsg]);
        setConversations(prev => prev.map(c => (c.id === conversation.id ? { ...c, messages: [...c.messages, botMsg] } : c)));
        renderNext();
      }, 1000);
    };
    renderNext();
  };

  const handleSend = async (text: string) => {
    // clear any running timers when user sends a message
    if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null; }
    if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null; }
    // DB-backed About Us flow
    if (activeFlowId === 'about' && activeSessionId && activeNodeId) {
      const conversationId = activeSessionId;
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user' as ChatRole, text, ts: Date.now() };
      setMessages(prev => [...prev, userMessage]);
      setConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, messages: [...c.messages, userMessage] } : c)));
      setIsTyping(true);
      setQuickReplies([]);
      try {
        // Persist user message
        await insertMessage({ sessionId: activeSessionId, text, role: 'user' });
        // Resolve option from current node
        const options = await fetchOptions(activeNodeId);
        const match = options.find(o => o.label.toLowerCase() === text.trim().toLowerCase());
        if (!match) {
          // Respond with generic prompt
          const prompt = 'Please choose one of the options.';
          await insertMessage({ sessionId: activeSessionId, text: prompt, role: 'printy', nodeId: activeNodeId });
        } else {
          // Move to next node
          await updateCurrentNode(activeSessionId, match.to_node_id);
          setActiveNodeId(match.to_node_id);
          // Fetch node content and reply
          const node = await fetchCurrentNode(activeSessionId);
          if (node) {
            await insertMessage({ sessionId: activeSessionId, text: node.text, role: 'printy', nodeId: node.node_id });
          }
        }
        // Refresh messages and quick replies
        const fetched = await fetchSessionMessages(activeSessionId);
        setMessages(fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })));
        setConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, messages: fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })) } : c)));
        const nodeNow = await fetchCurrentNode(activeSessionId);
        const newOptions = nodeNow ? await fetchOptions(nodeNow.node_id) : [];
        // If session already ended (e.g., idle timeout), enforce ended state and clear quick replies
        const ended = conversations.find(c => c.id === conversationId)?.status === 'ended';
        if (ended) {
          setQuickReplies([]);
          setInputPlaceholder('This conversation has ended');
        } else {
          const replies = (newOptions.length ? newOptions.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]);
          setQuickReplies(replies);
          updateInputPlaceholder('about', replies);
        }
      } catch (e) {
        console.error('handleSend DB error', e);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (!currentFlow || !activeId) return;
    const activeConversation = conversations.find(c => c.id === activeId);
    if (activeConversation?.status === 'ended') return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, userMessage] } : c)));

    setIsTyping(true);
    setQuickReplies([]);

    try {
      const response = await currentFlow.respond({}, text);
      const msgs = (response.messages || []) as { text: string }[];
      let index = 0;
      const renderNext = () => {
        if (index >= msgs.length) {
          const rr = response.quickReplies || [];
          const rawReplies = rr.length === 0 ? ['End Chat'] : rr;
          const replies = rawReplies.map((label: string, i: number) => ({ id: `qr-${i}`, label, value: label }));
          setQuickReplies(replies);
          updateInputPlaceholder(currentFlow.id, replies);
          setIsTyping(false);
          return;
        }
        setIsTyping(true);
        setTimeout(() => {
          const m = msgs[index++];
          const botMsg: ChatMessage = { id: crypto.randomUUID(), role: 'printy' as ChatRole, text: m.text, ts: Date.now() };
          setMessages(prev => [...prev, botMsg]);
          setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, botMsg] } : c)));
          renderNext();
        }, 600);
      };
      renderNext();
    } catch (error) {
      console.error('Flow error:', error);
      toastMethods.error('Chat Error', 'There was an issue processing your message. Please try again.');
      setIsTyping(false);
    }
  };

  const handleQuickReply = async (value: string) => {
    const activeConversation = conversations.find(c => c.id === activeId);
    if (activeConversation?.status === 'ended') return;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'end chat' || normalized === 'end' || normalized === 'no') {
      await endChat();
      return;
    }
    // Special-case idle prompt reply: "Yes, give me a second"
    if (activeFlowId === 'about' && normalized === 'yes, give me a second') {
      // reset timers
      if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null; }
      if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null; }
      // ack bot message and persist
      const ack = 'Okay, take your time.';
      if (activeSessionId) {
        await insertMessage({ sessionId: activeSessionId, text: ack, role: 'printy', nodeId: activeNodeId || null });
      }
      const botMsg: ChatMessage = { id: crypto.randomUUID(), role: 'printy' as ChatRole, text: ack, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
      setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, botMsg] } : c)));
      // Restore the same node's options so user can continue from where Printy stopped
      if (activeSessionId) {
        const node = await fetchCurrentNode(activeSessionId);
        const opts = node ? await fetchOptions(node.node_id) : [];
        const replies = (opts.length ? opts.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : []);
        setQuickReplies(replies);
      } else {
        setQuickReplies([]);
      }
      return;
    }
    await handleSend(value);
  };

  const switchConversation = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    setActiveId(id);
    // If this is a DB-backed session (id looks like a UUID we stored), fetch messages and quick replies
    if (conv.flowId === 'about') {
      setActiveSessionId(id);
      setActiveFlowId('about');
      const fetched = await fetchSessionMessages(id);
      setMessages(fetched.map(m => ({ id: m.id, role: m.role as ChatRole, text: m.text, ts: m.ts })));
      const node = await fetchCurrentNode(id);
      const opts = node ? await fetchOptions(node.node_id) : [];
      const replies = (opts.length ? opts.map((o, i) => ({ id: `qr-${i}`, label: o.label, value: o.label })) : []);
      if (conv.status === 'ended') {
        setQuickReplies([]);
      } else {
        setQuickReplies(replies);
        updateInputPlaceholder('about', replies);
      }
      return;
    }
    // Legacy conversation path
    setMessages(conv.messages);
    if (conv.status === 'ended') {
      setCurrentFlow(null);
      setQuickReplies([]);
      setIsTyping(false);
    } else {
      const flow = (flows as any)[conv.flowId];
      if (flow) {
        setCurrentFlow(flow as any);
        const replies = flow.quickReplies().map((label: string, index: number) => ({ id: `qr-${index}`, label, value: label }));
        setQuickReplies(replies);
        updateInputPlaceholder(conv.flowId, replies);
      }
    }
  };

  const endChat = async () => {
    if (!activeId) return;
    const currentConversation = conversations.find(c => c.id === activeId);
    if (currentConversation?.status === 'ended') return;
    // If About flow, prefer the DB end node text
    let endText = 'Thank you for chatting with Printy! Have a great day. 👋';
    if (activeFlowId === 'about') {
      const endNode = await fetchEndNodeText('about');
      if (endNode) {
        await insertMessage({ sessionId: activeId, text: endNode.text, role: 'printy', nodeId: endNode.nodeId });
        endText = endNode.text;
      }
    }
    const endMessage: ChatMessage = { id: crypto.randomUUID(), role: 'printy' as ChatRole, text: endText, ts: Date.now() };
    setMessages(prev => [...prev, endMessage]);
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: [...c.messages, endMessage] } : c)));
    setQuickReplies([]);
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, status: 'ended' as const, icon: c.icon } : c)));
    // Persist end in DB if About Us
    if (activeFlowId === 'about' && activeSessionId) {
      try { await endDbSession(activeSessionId); } catch (e) { console.error('endDbSession error', e); }
    }
    setTimeout(() => {
      setActiveId(null);
      setMessages([]);
      setCurrentFlow(null);
      setQuickReplies([]);
      setInputPlaceholder('Type a message...');
      setActiveSessionId(null);
      setActiveFlowId(null);
      setActiveNodeId(null);
    }, 2000);
  };

  // Auto-timeout: 10s test (future 5m) with "Are you still there?" prompt
  useEffect(() => {
    if (activeFlowId !== 'about' || !activeSessionId) return;
    // Only when chat is active and last message is from bot
    const activeConv = conversations.find(c => c.id === activeSessionId);
    if (!activeConv || activeConv.status === 'ended') return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'printy') return;

    // clear existing timers before scheduling new ones
    if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null; }
    if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null; }

    const timer = window.setTimeout(async () => {
      // send prompt
      const prompt = 'Are you still there?';
      await insertMessage({ sessionId: activeSessionId, text: prompt, role: 'printy', nodeId: activeNodeId || null });
      const promptMsg: ChatMessage = { id: crypto.randomUUID(), role: 'printy' as ChatRole, text: prompt, ts: Date.now() };
      setMessages(prev => [...prev, promptMsg]);
      setConversations(prev => prev.map(c => (c.id === activeSessionId ? { ...c, messages: [...c.messages, promptMsg] } : c)));
      // show prompt replies
      setQuickReplies([
        { id: 'qr-yst-yes', label: 'Yes, give me a second', value: 'Yes, give me a second' },
        { id: 'qr-yst-no', label: 'No', value: 'No' },
      ]);
      setInputPlaceholder('Type a message...');

      // wait another 10s, if no user reply, end chat
      const endTimer = window.setTimeout(async () => {
        if (activeFlowId !== 'about' || !activeSessionId) return;
        // if last message is still from bot (no user reply after prompt)
        const latest = messages[messages.length - 1];
        if (latest && latest.role === 'printy') {
          await endChat();
        }
      }, 10000);
      endTimerRef.current = endTimer;
    }, 10000);
    inactivityTimerRef.current = timer;

    return () => {
      if (inactivityTimerRef.current) { clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = null; }
      if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null; }
    };
  }, [messages, activeFlowId, activeSessionId, activeNodeId, conversations]);

  // Load recent sessions from DB on mount (for Recent Chats/History)
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchUserSessions();
        if (list.length === 0) return setSessionsLoaded(true);
        const convs = list.map(s => ({
          id: s.sessionId,
          title: s.title,
          createdAt: s.createdAt,
          messages: [],
          flowId: s.flowId || 'about',
          status: (s.status === 'ended' ? 'ended' : 'active') as const,
          icon: undefined,
        }));
        setConversations(prev => {
          // avoid duplicates by id
          const map = new Map(prev.map(p => [p.id, p] as const));
          convs.forEach(c => map.set(c.id, c));
          return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        });
      } catch (e) {
        console.error('load sessions error', e);
      } finally {
        setSessionsLoaded(true);
      }
    })();
  }, []);

  // Events from RecentOrder widgets
  useEffect(() => {
    const paymentHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { orderId?: string };
      const orderId = detail?.orderId || recentOrder.id;
      const title = `Payment for ${orderId}`;
      initializeFlow('payment', title, { orderId, total: recentOrder.total });
    };
    const cancelHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { orderId?: string; orderStatus?: string };
      const orderId = detail?.orderId || recentOrder.id;
      const title = `Cancel Order ${orderId}`;
      initializeFlow('cancel-order', title, { orderId, orderStatus: detail?.orderStatus });
    };
    window.addEventListener('customer-open-payment-chat', paymentHandler as EventListener);
    window.addEventListener('customer-open-cancel-chat', cancelHandler as EventListener);
    return () => {
      window.removeEventListener('customer-open-payment-chat', paymentHandler as EventListener);
      window.removeEventListener('customer-open-cancel-chat', cancelHandler as EventListener);
    };
  }, [recentOrder.id]);

  return {
    // state
    toasts,
    toastMethods,
    messages,
    isTyping,
    conversations,
    activeId,
    quickReplies,
    inputPlaceholder,
    // actions
    initializeFlow,
    handleSend,
    handleQuickReply,
    switchConversation,
    endChat,
    setActiveId,
  } as const;
}

export default useCustomerConversations;


