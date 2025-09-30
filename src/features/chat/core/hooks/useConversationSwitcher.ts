/**
 * useConversationSwitcher
 * Provides a generic switchConversation that updates active conversation,
 * restores messages for scripted chats, or fetches from DB for session-based chats.
 */
import { ChatDatabaseService } from '../services/ChatDatabaseService';

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

    // DB-backed flows (About Us, Issue Ticket)
    if (conv.flowId === 'about' || conv.flowId === 'issue-ticket') {
      const fetched =
        await ChatDatabaseService.fetchSessionMessages(conversationId);
      setMessages(
        fetched.map(m => ({
          id: m.id,
          role: m.role as any,
          text: m.text,
          ts: m.ts,
        }))
      );
      const node = await ChatDatabaseService.fetchCurrentNode(conversationId);
      const opts = node
        ? await ChatDatabaseService.fetchOptions(node.node_id)
        : [];
      const replies =
        conv.status === 'ended'
          ? []
          : opts.map((o: any, i: number) => ({
              id: `qr-${i}`,
              label: o.label,
              value: o.label,
            }));
      setQuickReplies(replies);
      updatePlaceholder(conv.flowId, replies);
      setActiveNodeId?.(node ? node.node_id : null);
      return;
    }

    // Scripted conversation
    setMessages(conv.messages);
    // Let caller recompute quick replies from flow if needed
  };

  return { switchConversation } as const;
}

export default useConversationSwitcher;
