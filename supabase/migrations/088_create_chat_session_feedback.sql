-- Migration: Create chat_session_feedback table for collecting user feedback on chat sessions
-- This feedback is used to measure Printy's effectiveness as a prompt-based chatbot
-- Users can provide a 5-star rating after their session ends

-- Create the feedback table
CREATE TABLE IF NOT EXISTS chat_session_feedback (
  feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  user_role text NOT NULL CHECK (user_role IN ('customer', 'admin')),
  
  -- Ensure one rating per user per session
  UNIQUE(session_id, customer_id)
);

-- Add comment explaining the table's purpose
COMMENT ON TABLE chat_session_feedback IS 
  'Stores user feedback (1-5 star ratings) for chat sessions to measure Printy effectiveness';

COMMENT ON COLUMN chat_session_feedback.feedback_id IS 'Primary key';
COMMENT ON COLUMN chat_session_feedback.session_id IS 'References the chat session being rated';
COMMENT ON COLUMN chat_session_feedback.customer_id IS 'The user who submitted the feedback';
COMMENT ON COLUMN chat_session_feedback.rating IS '1-5 star rating for the session';
COMMENT ON COLUMN chat_session_feedback.submitted_at IS 'When the feedback was submitted';
COMMENT ON COLUMN chat_session_feedback.user_role IS 'Whether the feedback is from a customer or admin';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_session_feedback_session_id ON chat_session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_feedback_customer_id ON chat_session_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_feedback_submitted_at ON chat_session_feedback(submitted_at);

-- Enable RLS
ALTER TABLE chat_session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON chat_session_feedback
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- RLS Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON chat_session_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- RLS Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON chat_session_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customer
      WHERE customer.customer_id = auth.uid()
      AND customer.customer_type = 'admin'
    )
  );

-- RLS Policy: Admins can view their own feedback in admin sessions
-- Note: When admin provides feedback on a customer session, this ensures proper access

