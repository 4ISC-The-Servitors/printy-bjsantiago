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
import { getFlowDefinition } from '@features/chat/api/jsonbChatFlowApi';
import { useAdminConversations } from './useAdminConversations';
import { useChatLoadingToast } from '@features/chat/hooks/shared/useChatLoadingToast';
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
    loadHistoricalMessages,
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
            const { fetchSessionMessagesV2 } = await import(
              '@features/chat/api/jsonbChatFlowApi'
            );
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

    if (!orderId) {
      console.warn('⚠️ No entity ID provided for topic:', topic);
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

    if (conv.status === 'ended') {
      // For ended conversations, load historical messages from database
      setViewingHistorical(true);
      setReadOnly(true);
      setQuickReplies([]);
      
      // For database-loaded conversations, the conversation ID is the session ID
      // For locally created conversations, use the stored sessionId
      const sessionId = conv.sessionId || conversationId;
      setDbSessionId(sessionId);
      
      try {
        const historicalMessages = await loadHistoricalMessages(sessionId);
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

          // Use FlowTriggerService to determine typing delay behavior
          const skipDelay = FlowTriggerService.shouldSkipTypingDelay(
            flowId as any
          );
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
        } finally {
          setIsTyping(false);
        }
      })();
    } else {
      // No active session, just stop typing
      setIsTyping(false);
    }
  };

  const handleQuickReply = (v: string | { value: string; label: string }) => {
    // Handle both old string format and new object format
    const val = typeof v === 'string' ? v.trim() : v.value.trim();
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
        // Use FlowTriggerService to determine typing delay behavior
        const skipDelay = FlowTriggerService.shouldSkipTypingDelay(
          flowId as any
        );
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
