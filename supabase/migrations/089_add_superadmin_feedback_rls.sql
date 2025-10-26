-- Migration: Add RLS policies for superadmin to view all chat session feedback
-- This allows superadmin to check KPI 3 (CSAT) in the dashboard

-- Grant superadmin access to view all feedback for analytics
CREATE POLICY "Superadmin can view all feedback"
  ON chat_session_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customer
      WHERE customer.customer_id = auth.uid()
      AND customer.customer_type = 'superadmin'
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "Superadmin can view all feedback" ON chat_session_feedback IS 
  'Allows superadmin role to view all feedback records for KPI calculations and analytics';

