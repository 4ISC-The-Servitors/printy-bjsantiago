/**
 * useConversationSwitcher
 * Provides a generic switchConversation that updates active conversation,
 * restores messages for scripted chats, or fetches from DB for session-based chats.
 *
 * Updated for v2 chat system using JsonbFlowProcessor
 */
import { ChatDatabaseService } from '@features/chat/services/ChatDatabaseService';
import { getFlowDefinition } from '@features/chat/api/jsonbChatFlowApi';
import { supabase } from '@lib/supabase';

export function useConversationSwitcher() {
  const switchConversation = async (
    conversationId: string,
    conversations: Array<{
      id: string;
      flowId: string;
      status: 'active' | 'ended';
      messages: any[];
    }>,
    setActiveId: (id: string | null) => void,
    setMessages: (msgs: any[]) => void,
    setQuickReplies: (qr: any[]) => void,
    updatePlaceholder: (flowId: string, replies: any[]) => void,
    setActiveNodeId?: (id: string | null) => void
  ) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    setActiveId(conversationId);

    // DB-backed flows using v2 system
    if (conv.flowId === 'about' || conv.flowId === 'issue-ticket') {
      // Use v2 ChatDatabaseService for message fetching
      const fetched =
        await ChatDatabaseService.fetchSessionMessages(conversationId);
      const list = (fetched || []).map(m => ({
        id: m.id,
        role: m.role as any,
        text: m.text,
        ts: m.ts,
      }));
      // If server yields nothing (e.g., missing table), do not blow away local conversation
      setMessages(list.length > 0 ? list : conv.messages);

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

    // Scripted conversation
    setMessages(conv.messages);
    // Let caller recompute quick replies from flow if needed
  };

  return { switchConversation } as const;
}

export default useConversationSwitcher;
