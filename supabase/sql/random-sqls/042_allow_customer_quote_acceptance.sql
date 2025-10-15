-- Allow customers to accept/reject their own quote proposals
-- This migration adds UPDATE policies so customers can respond to quotes

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can update quote conversations" ON quote_conversations;
DROP POLICY IF EXISTS "Admins can manage quote proposals" ON quote_proposals;

-- 1. Allow customers to update their own quote conversation status
-- (Only when accepting or rejecting - status changes to 'accepted' or 'rejected')
CREATE POLICY "Customers can update own quote conversation status" ON quote_conversations
  FOR UPDATE USING (
    auth.uid() = customer_id
    AND status IN ('spec_proposed', 'active')
  )
  WITH CHECK (
    auth.uid() = customer_id
    AND status IN ('accepted', 'rejected', 'ended')
  );

-- 2. Allow admins to update any quote conversation
CREATE POLICY "Admins can update quote conversations" ON quote_conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

-- 3. Allow customers to update proposal status when accepting/rejecting
CREATE POLICY "Customers can accept or reject proposals" ON quote_proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc
      WHERE qc.conversation_id = quote_proposals.conversation_id
      AND qc.customer_id = auth.uid()
    )
    AND status = 'sent'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quote_conversations qc
      WHERE qc.conversation_id = quote_proposals.conversation_id
      AND qc.customer_id = auth.uid()
    )
    AND status IN ('accepted', 'rejected')
  );

-- 4. Allow admins to manage all proposals (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage quote proposals" ON quote_proposals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

-- Add comment explaining the policy structure
COMMENT ON POLICY "Customers can update own quote conversation status" ON quote_conversations IS
  'Allows customers to update their quote conversation status from spec_proposed/active to accepted/rejected/ended';
COMMENT ON POLICY "Customers can accept or reject proposals" ON quote_proposals IS
  'Allows customers to update proposal status from sent to accepted/rejected only';
