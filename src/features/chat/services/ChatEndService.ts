import { supabase } from '@/lib/supabase';
import { insertMessageV2 } from '@features/chat/api/jsonbChatFlowApi';

export interface ChatEndServiceOptions {
  sessionId: string;
  userId: string;
  userType: 'customer' | 'admin';
  conversationId?: string;
  endMessage?: string;
}

export class ChatEndService {
  private static readonly DEFAULT_END_MESSAGE =
    'Thanks for choosing B.J. Santiago! Have a great day!';

  /**
   * Unified method to end chat sessions consistently
   */
  static async endChatSession(
    options: ChatEndServiceOptions
  ): Promise<{ success: boolean; error?: string }> {
    const { sessionId, userType, endMessage } = options;

    try {
      // 1. First check current session status
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions_v2')
        .select('status, metadata')
        .eq('session_id', sessionId)
        .single();

      if (sessionError) {
        console.error('Failed to fetch session:', sessionError);
        return { success: false, error: 'Failed to fetch session' };
      }

      // 2. If already ended, don't proceed
      if (session.status === 'ended') {
        return { success: true };
      }

      // 3. Add end message to messages table using the proper API function
      const messageToAdd = endMessage || this.DEFAULT_END_MESSAGE;

      const { messageId } = await insertMessageV2({
        sessionId,
        text: messageToAdd,
        role: 'printy', // End message is from Printy bot
        nodeId: null,
      });

      if (!messageId) {
        console.error('Failed to add end message');
        return { success: false, error: 'Failed to add end message' };
      }

      // 4. Update session status to ended
      const { error: updateError } = await supabase
        .from('chat_sessions_v2')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(), // Use ended_at column directly
          metadata: {
            ...session.metadata,
            ended_by: userType,
          },
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Failed to update session status:', updateError);
        return { success: false, error: 'Failed to update session status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in endChatSession:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Check if a session is already ended
   */
  static async isSessionEnded(sessionId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('chat_sessions_v2')
        .select('status')
        .eq('session_id', sessionId)
        .single();

      return data?.status === 'ended';
    } catch (error) {
      console.error('Error checking session status:', error);
      return false;
    }
  }
}
