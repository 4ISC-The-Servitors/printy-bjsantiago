/**
 * useCustomerConversations (composer)
 * Small hook that composes core state + controller + switcher for customer-side chat.
 * Keeps page code thin and migration-friendly.
 */
import { useCallback } from 'react';
import { useConversationState } from '../../../chat/core/hooks/useConversationState';
import { useConversationController } from '../../../chat/core/hooks/useConversationController';
import { fetchSessionMessages } from '../../../../api/chatFlowApi';
import { useConversationSwitcher } from '../../../chat/core/hooks/useConversationSwitcher';
import { customerFlows as scriptedRegistry } from '../../../../chatLogic/customer';
import { auth } from '../../../../lib/supabase';

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

  const { start, send, end, sessionId, setControllerSession } = useConversationController();
  const { switchConversation } = useConversationSwitcher();

  const updateInputPlaceholder = useCallback((flowId: string, replies: any[]) => {
    if (flowId === 'issue-ticket' && replies.length === 0) {
      setInputPlaceholder('Enter your Order ID (e.g., ORD-123456)');
    } else {
      setInputPlaceholder('Type a message...');
    }
  }, [setInputPlaceholder]);

  const initializeFlow = useCallback(async (flowId: string, title: string, ctx?: any) => {
    setIsTyping(true);
    try {
      // Ensure DB-backed flows receive the authenticated customerId
      let enrichedCtx = ctx || {};
      if (flowId === 'about' && !enrichedCtx.customerId) {
        try {
          const { data: userData } = await auth.getUser();
          const customerId = userData?.user?.id;
          if (customerId) enrichedCtx = { ...enrichedCtx, customerId };
        } catch {}
      }
      // Start conversation via driver selection
      const result = await start(flowId, scriptedRegistry, enrichedCtx);
      // Create UI conversation wrapper
      const conv = {
        id: (result.sessionId || crypto.randomUUID()) as string,
        title,
        createdAt: Date.now(),
        messages: result.messages,
        flowId,
        status: 'active' as const,
        icon: undefined,
      };
      setConversations(prev => [conv, ...prev]);
      if (result.sessionId) setControllerSession(result.sessionId);
      setActiveId(conv.id);
      setMessages(result.messages);
      setQuickReplies(result.quickReplies);
      updateInputPlaceholder(flowId, result.quickReplies);
    } finally {
      setIsTyping(false);
    }
  }, [setIsTyping, start, setConversations, setActiveId, setMessages, setQuickReplies, updateInputPlaceholder]);

  const handleSend = useCallback(async (text: string) => {
    if (!activeId) return;
    const user = { id: crypto.randomUUID(), role: 'user' as const, text, ts: Date.now() };
    setMessages(prev => [...prev, user]);
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, user] } : c));
    setIsTyping(true);
    setQuickReplies([]);
    try {
      const res = await send(text);
      // If this is a DB-backed session, replace messages with the latest fetched list
      if (sessionId) {
        const latest = (res.messages as any[]).map(m => ({ id: m.id, role: m.role as any, text: m.text, ts: m.ts }));
        setMessages(latest as any);
        setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: latest as any } : c)));
      } else {
        const bot = res.messages as any[];
        setMessages(prev => [...prev, ...bot]);
        setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, ...bot] } : c));
      }
      setQuickReplies(res.quickReplies);
      // For scripted, we have flowId in conversation; for DB 'about', use literal
      const flowId = conversations.find(c => c.id === activeId)?.flowId || 'about';
      updateInputPlaceholder(flowId, res.quickReplies);
    } finally {
      setIsTyping(false);
    }
  }, [activeId, setMessages, setConversations, setIsTyping, setQuickReplies, send, conversations, updateInputPlaceholder, sessionId]);

  const handleQuickReply = useCallback((value: string) => {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'end chat' || normalized === 'end') {
      void endChat();
      return;
    }
    void handleSend(value);
  }, [handleSend]);

  const endChat = useCallback(async () => {
    if (!activeId) return;
    const flowId = conversations.find(c => c.id === activeId)?.flowId;
    await end(flowId);
    // Refresh messages so closing line appears
    const sid = sessionId || activeId;
    try {
      const fetched = await fetchSessionMessages(sid);
      setMessages(fetched.map(m => ({ id: m.id, role: m.role as any, text: m.text, ts: m.ts })) as any);
      setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, messages: fetched.map(m => ({ id: m.id, role: m.role as any, text: m.text, ts: m.ts })), status: 'ended' as const } : c)));
    } catch {}
    setQuickReplies([]);
    // Keep chat open briefly so user sees closing message, then return to dashboard
    window.setTimeout(() => {
      setActiveId(null);
      setMessages([] as any);
    }, 1500);
  }, [activeId, conversations, end, setConversations, setMessages, setQuickReplies, sessionId]);

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
    switchConversation: (id: string) => { setControllerSession(id); return switchConversation(id, conversations, setActiveId, setMessages, setQuickReplies, updateInputPlaceholder); },
    endChat,
    setActiveId,
    setConversations,
  } as const;
}

export default useCustomerConversations;


