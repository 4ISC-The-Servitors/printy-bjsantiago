-- Remove admin-related columns from quote tables
-- First, drop all policies that depend on admin_id
DROP POLICY IF EXISTS "Customers can view own quote conversations" ON quote_conversations;
DROP POLICY IF EXISTS "Users can view quote messages in their conversations" ON quote_messages;
DROP POLICY IF EXISTS "Users can insert quote messages in their conversations" ON quote_messages;
DROP POLICY IF EXISTS "Users can view quote specs in their conversations" ON quote_specs;
DROP POLICY IF EXISTS "Admins can insert quote specs" ON quote_specs;
DROP POLICY IF EXISTS "Users can view quote proposals in their conversations" ON quote_proposals;
DROP POLICY IF EXISTS "Users can view quote orders in their conversations" ON quote_orders;

-- Now drop the columns
ALTER TABLE quote_conversations DROP COLUMN admin_id;
ALTER TABLE quote_specs DROP COLUMN triggered_by_admin_id;
ALTER TABLE quote_proposals DROP COLUMN admin_id;

-- Recreate policies without admin_id references
CREATE POLICY "Users can view quote conversations" ON quote_conversations
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

CREATE POLICY "Users can view quote messages in their conversations" ON quote_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_messages.conversation_id 
      AND (qc.customer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Users can insert quote messages in their conversations" ON quote_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_messages.conversation_id 
      AND (qc.customer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    ) AND auth.uid() = sender_id
  );

CREATE POLICY "Users can view quote specs in their conversations" ON quote_specs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_specs.conversation_id 
      AND (qc.customer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Admins can insert quote specs" ON quote_specs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

CREATE POLICY "Users can view quote proposals in their conversations" ON quote_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_proposals.conversation_id 
      AND (qc.customer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Users can view quote orders in their conversations" ON quote_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_orders.conversation_id 
      AND (qc.customer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

-- Remove unused indexes
DROP INDEX IF EXISTS idx_quote_conversations_admin_id;