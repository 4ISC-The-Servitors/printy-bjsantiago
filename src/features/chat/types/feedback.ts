/**
 * Type definitions for chat session feedback
 */

export interface ChatSessionFeedback {
  feedback_id: string;
  session_id: string;
  customer_id: string;
  rating: number; // 1-5
  submitted_at: string;
  user_role: 'customer' | 'admin';
}

export interface SubmitFeedbackParams {
  sessionId: string;
  rating: number;
  userRole: 'customer' | 'admin';
}

export interface SessionFeedbackState {
  isSubmitted: boolean;
  rating: number | null;
  submittedAt: string | null;
}

