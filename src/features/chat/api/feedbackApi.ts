/**
 * API functions for chat session feedback
 */

import { supabase } from '@lib/supabase';
import type {
  ChatSessionFeedback,
  SubmitFeedbackParams,
  SessionFeedbackState,
} from '../types/feedback';

/**
 * Submit feedback for a chat session
 * @param params - Feedback submission parameters
 * @returns The created feedback record or null on error
 */
export async function submitSessionFeedback(
  params: SubmitFeedbackParams
): Promise<ChatSessionFeedback | null> {
  try {
    const { sessionId, rating, userRole } = params;

    // Get current user to ensure we use their ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return null;
    }

    const { data, error } = await supabase
      .from('chat_session_feedback')
      .insert({
        session_id: sessionId,
        customer_id: user.id,
        rating: rating,
        user_role: userRole,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to submit feedback:', error);

      // Handle duplicate feedback error gracefully
      if (error.code === '23505') {
        // Feedback already submitted for this session
      }

      return null;
    }

    return data as ChatSessionFeedback;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return null;
  }
}

/**
 * Check if the current user has already submitted feedback for a session
 * @param sessionId - The session ID to check
 * @returns The feedback state or null if not found/error
 */
export async function getSessionFeedback(
  sessionId: string
): Promise<SessionFeedbackState | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isSubmitted: false, rating: null, submittedAt: null };
    }

    const { data, error } = await supabase
      .from('chat_session_feedback')
      .select('rating, submitted_at')
      .eq('session_id', sessionId)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get feedback:', error);
      return null;
    }

    if (data) {
      return {
        isSubmitted: true,
        rating: data.rating,
        submittedAt: data.submitted_at,
      };
    }

    return { isSubmitted: false, rating: null, submittedAt: null };
  } catch (error) {
    console.error('Error checking feedback:', error);
    return null;
  }
}
