/**
 * useConversationSwitcher
 * Provides a generic switchConversation that updates active conversation,
 * restores messages for scripted chats, or fetches from DB for session-based chats.
 *
 * Updated for v2 chat system using JsonbFlowProcessor
 */
import { ChatDatabaseService } from '@features/chat/services/ChatDatabaseService';
import {
  getFlowDefinition,
  fetchSessionMessagesV2,
} from '@features/chat/api/jsonbChatFlowApi';
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
    const mapRole = (
      role: 'customer' | 'admin' | 'printy'
    ): 'user' | 'printy' => {
      return role === 'customer' ? 'user' : 'printy';
    };

    // Check if this is a v2 session-based conversation
    if (conv.session_id) {
      try {
        // First check if this is an ended session
        const { data: session } = await supabase
          .from('chat_sessions_v2')
          .select('status, flow_id, metadata')
          .eq('session_id', conv.session_id)
          .single();

        const isEnded = session?.status === 'ended';

        // Load messages from database
        const messages = await fetchSessionMessagesV2(conv.session_id);

        // Mark messages as historical to prevent typing indicators
        const historicalMessages: ChatMessage[] = (messages || []).map(
          (msg: any) => ({
            id: msg.id,
            role: mapRole(msg.role as any),
            text: msg.text,
            ts: msg.ts,
            isHistorical: true,
            metadata: msg.metadata || null,
          })
        );

        setMessages(historicalMessages);

        // Set quick replies using current node options from flow definition when active
        if (conv.status === 'active' && !isEnded && session) {
          const flowDef = await getFlowDefinition(session.flow_id);
          const nodeId = session?.metadata?.current_node_id as string | undefined;
          const node = nodeId && flowDef ? (flowDef as any).nodes?.[nodeId] : null;
          const pending = session?.metadata?.context?.
            _pending_quick_replies as any[] | undefined;

          // Prefer dynamic replies persisted by actions in session metadata context
          let replies: any[] = Array.isArray(pending)
            ? pending.map((qr: any, i: number) => ({
                id: qr.id || `qr-${i}`,
                label: qr.label,
                value: qr.value,
              }))
            : [];

          // If no dynamic quick replies and current node is an action that generates them,
          // re-execute the action to regenerate quick replies
          if (
            replies.length === 0 &&
            node &&
            node.type === 'action' &&
            (node as any).action
          ) {
            const actionName = (node as any).action;
            // Actions that generate dynamic quick replies
            const dynamicActions = [
              'display_service_categories',
              'display_services_by_category',
              'show_customer_orders',
              'show_quote_decision_prompt',
            ];

            if (dynamicActions.includes(actionName)) {
              try {
                // Re-execute the action to regenerate quick replies
                const { actionHandlers } = await import(
                  '@features/chat/actions/customer'
                );
                const handler = actionHandlers[actionName];
                if (handler) {
                  // Get customer ID from session
                  const { data: sessionData } = await supabase
                    .from('chat_sessions_v2')
                    .select('customer_id')
                    .eq('session_id', conv.session_id)
                    .single();

                  if (sessionData?.customer_id) {
                    const actionResult = await handler({
                      actionNode: node as any,
                      sessionId: conv.session_id,
                      customerId: sessionData.customer_id,
                      context: session?.metadata?.context || {},
                    });

                    if (actionResult.quickReplies) {
                      replies = actionResult.quickReplies.map(
                        (qr: any, i: number) => ({
                          id: qr.id || `qr-${i}`,
                          label: qr.label,
                          value: qr.value,
                        })
                      );

                      // Persist regenerated quick replies to session metadata
                      const updatedContext = {
                        ...(session?.metadata?.context || {}),
                        _pending_quick_replies: actionResult.quickReplies,
                      };
                      await supabase
                        .from('chat_sessions_v2')
                        .update({
                          metadata: {
                            ...session.metadata,
                            context: updatedContext,
                          },
                        })
                        .eq('session_id', conv.session_id);
                    }
                  }
                }
              } catch (error) {
                console.error(
                  'Failed to regenerate dynamic quick replies:',
                  error
                );
              }
            }
          }

          // Fallback to node options
          if (replies.length === 0 && node && (node as any).options) {
            replies = (node as any).options.map((o: any, i: number) => ({
              id: `qr-${i}`,
              label: o.label,
              value: o.label,
            }));
          }

          setQuickReplies(
            replies.length > 0
              ? replies
              : [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }]
          );
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
        setMessages(
          conv.messages.map(m => ({
            ...m,
            isHistorical: true,
          })) as ChatMessage[]
        );
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
        isHistorical: true,
      }));
      // If server yields nothing (e.g., missing table), do not blow away local conversation
      setMessages(
        list.length > 0
          ? list
          : (conv.messages.map(m => ({
              ...m,
              isHistorical: true,
            })) as ChatMessage[])
      );

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
    setMessages(
      conv.messages.map(m => ({ ...m, isHistorical: true })) as ChatMessage[]
    );
    // Let caller recompute quick replies from flow if needed
  };

  return { switchConversation } as const;
}

export default useConversationSwitcher;
