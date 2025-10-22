/**
 * useConversationSwitcher
 * Provides a generic switchConversation that updates active conversation,
 * restores messages for scripted chats, or fetches from DB for session-based chats.
 *
 * Updated for v2 chat system using JsonbFlowProcessor
 */
import { ChatDatabaseService } from '@features/chat/services/ChatDatabaseService';
import { getFlowDefinition, fetchSessionMessagesV2 } from '@features/chat/api/jsonbChatFlowApi';
import { supabase } from '@lib/supabase';
import type { ChatMessage } from '@features/chat/types/chat';

export function useConversationSwitcher() {
  const switchConversation = async (
    conversationId: string,
    conversations: Array<{
      id: string;
      flowId: string;
      status: 'active' | 'ended';
      messages: any[];
      session_id?: string;
    }>,
    setActiveId: (id: string | null) => void,
    setMessages: (msgs: ChatMessage[]) => void,
    setQuickReplies: (qr: any[]) => void,
    updatePlaceholder: (flowId: string, replies: any[]) => void,
    setActiveNodeId?: (id: string | null) => void
  ) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    setActiveId(conversationId);

    // Helper function to map role names
    const mapRole = (role: 'customer' | 'admin' | 'printy'): 'user' | 'printy' => {
      return role === 'customer' ? 'user' : 'printy';
    };

    // Check if this is a v2 session-based conversation
    if (conv.session_id) {
      try {
        // First check if this is an ended session
        const { data: session } = await supabase
          .from('chat_sessions_v2')
          .select('status')
          .eq('id', conv.session_id)
          .single();

        const isEnded = session?.status === 'ended';

        // Load messages from database
        const messages = await fetchSessionMessagesV2(conv.session_id);

        // Mark messages as historical to prevent typing indicators
        const historicalMessages: ChatMessage[] = (messages || []).map((msg: any) => ({
          id: msg.id,
          role: mapRole(msg.role as any),
          text: msg.text,
          ts: msg.ts,
          isHistorical: true
        }));

        setMessages(historicalMessages);

        // Set quick replies based on conversation status
        if (conv.status === 'active' && !isEnded) {
          // For active conversations, check if we should show "End Chat" quick reply
          setQuickReplies([
            { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
          ]);
        } else {
          // For ended conversations, no quick replies
          setQuickReplies([]);
        }

        setActiveNodeId?.(null);
        updatePlaceholder(conv.flowId, []);
        return;

      } catch (error) {
        console.error('Failed to load v2 conversation:', error);
        // Fallback to existing messages
        setMessages(conv.messages.map(m => ({ ...m, isHistorical: true })) as ChatMessage[]);
        setQuickReplies([]);
        setActiveNodeId?.(null);
        updatePlaceholder(conv.flowId, []);
        return;
      }
    }

    // Legacy flows using v2 system
    if (conv.flowId === 'about' || conv.flowId === 'issue-ticket') {
      // Use v2 ChatDatabaseService for message fetching
      const fetched =
        await ChatDatabaseService.fetchSessionMessages(conversationId);
      const list = (fetched || []).map(m => ({
        id: m.id,
        role: m.role as any,
        text: m.text,
        ts: m.ts,
        isHistorical: true
      }));
      // If server yields nothing (e.g., missing table), do not blow away local conversation
      setMessages(list.length > 0 ? list : conv.messages.map(m => ({ ...m, isHistorical: true })) as ChatMessage[]);

      // For v2 flows, get session state directly from database
      try {
        const { data: session } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', conversationId)
          .single();

        if (session && session.metadata && conv.status !== 'ended') {
          const metadata = session.metadata;
          const flowDefinition = await getFlowDefinition(conv.flowId);

          if (flowDefinition && metadata.current_node_id) {
            const currentNode = flowDefinition.nodes[metadata.current_node_id];

            // Only MessageNode and ActionNode have options
            const replies =
              currentNode &&
              (currentNode.type === 'message' ||
                currentNode.type === 'action') &&
              currentNode.options
                ? currentNode.options.map((o: any, i: number) => ({
                    id: `qr-${i}`,
                    label: o.label,
                    value: o.label,
                  }))
                : [];

            setQuickReplies(replies);
            updatePlaceholder(conv.flowId, replies);
            setActiveNodeId?.(metadata.current_node_id);
          } else {
            setQuickReplies([]);
            updatePlaceholder(conv.flowId, []);
            setActiveNodeId?.(null);
          }
        } else {
          setQuickReplies([]);
          updatePlaceholder(conv.flowId, []);
          setActiveNodeId?.(null);
        }
      } catch (error) {
        console.warn(
          'Failed to get v2 flow state, falling back to no replies:',
          error
        );
        setQuickReplies([]);
        updatePlaceholder(conv.flowId, []);
        setActiveNodeId?.(null);
      }
      return;
    }

    // Scripted conversation - mark as historical since we're loading existing messages
    setMessages(conv.messages.map(m => ({ ...m, isHistorical: true })) as ChatMessage[]);
    // Let caller recompute quick replies from flow if needed
  };

  return { switchConversation } as const;
}

export default useConversationSwitcher;
