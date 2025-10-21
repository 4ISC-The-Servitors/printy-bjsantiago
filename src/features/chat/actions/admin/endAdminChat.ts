import { ChatEndService } from '../../services/ChatEndService';
import type { ActionExecutionParams, ActionExecutionResult } from '@features/chat/types';

/**
 * Action handler: end_admin_chat
 *
 * Ends an admin's chat session using the unified ChatEndService.
 * This ensures consistent behavior across all end chat operations.
 *
 * @param params.actionNode - The action node from the flow definition
 * @param params.context - Current session context
 * @param params.customerId - Not used for admin actions
 * @param params.sessionId - Current chat session ID
 *
 * @returns ActionExecutionResult with end chat message
 */
export async function endAdminChat(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { context, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  try {
    // For admin actions, we need to get the admin ID from context or auth
    // In this implementation, we'll assume the admin ID is available in the context
    const adminId = context.admin_id || context.userId;

    if (!adminId) {
      console.error('Admin ID not found in context for endAdminChat action');
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: "I'm having trouble ending the chat. Admin authentication issue.",
        ts: Date.now(),
      });
      return { messages };
    }

    // Use the unified service to end the chat
    const result = await ChatEndService.endChatSession({
      sessionId,
      userId: adminId,
      userType: 'admin',
      endMessage: "This conversation has been ended by the administrator."
    });

    if (!result.success) {
      console.error('Failed to end admin chat:', result.error);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: "I'm having trouble ending the chat. Please try again.",
        ts: Date.now(),
      });
      return { messages };
    }

    // Success message - this will be added by the service, so we don't need to add another
    return { messages };

  } catch (error) {
    console.error('Error in endAdminChat:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: "Something went wrong. Please try again.",
      ts: Date.now(),
    });
    return { messages };
  }
}

/**
 * Standalone function for direct admin chat ending (not from flow actions)
 * This can be used in UI components and hooks
 */
export const endAdminChatDirect = async (sessionId: string, adminId: string, conversationId?: string) => {
  const result = await ChatEndService.endChatSession({
    sessionId,
    userId: adminId,
    userType: 'admin',
    conversationId,
    endMessage: "This conversation has been ended by the administrator."
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to end chat');
  }

  return result;
};