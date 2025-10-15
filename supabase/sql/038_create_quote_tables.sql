-- Create quote conversation tables for AI-powered quote flow
-- This migration creates dedicated tables for the new quote system
-- Quote tables are now completely separate from inquiry/ticket system

-- 1. quote_conversations - Main conversation tracking
CREATE TABLE quote_conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES customer(customer_id) ON DELETE SET NULL,
  quote_id UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'spec_proposed', 'accepted', 'rejected', 'ended')),
  language TEXT CHECK (language IN ('tl', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 2. quote_messages - Messages within conversations
CREATE TABLE quote_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quote_conversations(conversation_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin', 'ai')),
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'spec_summary', 'spec_proposal', 'system')),
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. quote_specs - AI-generated spec versions (history tracking)
CREATE TABLE quote_specs (
  spec_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quote_conversations(conversation_id) ON DELETE CASCADE,
  spec_data JSONB NOT NULL DEFAULT '{}',
  triggered_by_admin_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  trigger_message_id UUID REFERENCES quote_messages(message_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. quote_proposals - Admin's finalized specs with pricing
CREATE TABLE quote_proposals (
  proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quote_conversations(conversation_id) ON DELETE CASCADE,
  spec_id UUID NOT NULL REFERENCES quote_specs(spec_id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  spec_final JSONB NOT NULL DEFAULT '{}',
  quoted_price NUMERIC NOT NULL CHECK (quoted_price > 0),
  currency TEXT NOT NULL DEFAULT 'PHP',
  notes TEXT,
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- 5. quote_orders - Links accepted quotes to orders
CREATE TABLE quote_orders (
  quote_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quote_conversations(conversation_id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES quote_proposals(proposal_id) ON DELETE CASCADE,
  order_id VARCHAR NOT NULL REFERENCES orders_duplicate(order_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_quote_conversations_customer_id ON quote_conversations(customer_id);
CREATE INDEX idx_quote_conversations_admin_id ON quote_conversations(admin_id);
CREATE INDEX idx_quote_conversations_quote_id ON quote_conversations(quote_id);
CREATE INDEX idx_quote_conversations_status ON quote_conversations(status);
CREATE INDEX idx_quote_conversations_created_at ON quote_conversations(created_at DESC);

CREATE INDEX idx_quote_messages_conversation_id ON quote_messages(conversation_id);
CREATE INDEX idx_quote_messages_sent_at ON quote_messages(sent_at);
CREATE INDEX idx_quote_messages_sender_role ON quote_messages(sender_role);

CREATE INDEX idx_quote_specs_conversation_id ON quote_specs(conversation_id);
CREATE INDEX idx_quote_specs_created_at ON quote_specs(created_at DESC);

CREATE INDEX idx_quote_proposals_conversation_id ON quote_proposals(conversation_id);
CREATE INDEX idx_quote_proposals_status ON quote_proposals(status);
CREATE INDEX idx_quote_proposals_admin_id ON quote_proposals(admin_id);

CREATE INDEX idx_quote_orders_conversation_id ON quote_orders(conversation_id);
CREATE INDEX idx_quote_orders_proposal_id ON quote_orders(proposal_id);

-- Enable RLS
ALTER TABLE quote_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can see their own conversations and messages
CREATE POLICY "Customers can view own quote conversations" ON quote_conversations
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = admin_id OR
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

CREATE POLICY "Customers can insert own quote conversations" ON quote_conversations
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can update quote conversations" ON quote_conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

CREATE POLICY "Users can view quote messages in their conversations" ON quote_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_messages.conversation_id 
      AND (qc.customer_id = auth.uid() OR qc.admin_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Users can insert quote messages in their conversations" ON quote_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_messages.conversation_id 
      AND (qc.customer_id = auth.uid() OR qc.admin_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    ) AND auth.uid() = sender_id
  );

CREATE POLICY "Users can view quote specs in their conversations" ON quote_specs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_specs.conversation_id 
      AND (qc.customer_id = auth.uid() OR qc.admin_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Admins can insert quote specs" ON quote_specs
  FOR INSERT WITH CHECK (
    auth.uid() = triggered_by_admin_id AND
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

CREATE POLICY "Users can view quote proposals in their conversations" ON quote_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_proposals.conversation_id 
      AND (qc.customer_id = auth.uid() OR qc.admin_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Admins can manage quote proposals" ON quote_proposals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

CREATE POLICY "Users can view quote orders in their conversations" ON quote_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quote_conversations qc 
      WHERE qc.conversation_id = quote_orders.conversation_id 
      AND (qc.customer_id = auth.uid() OR qc.admin_id = auth.uid() OR
           EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin'))
    )
  );

CREATE POLICY "Admins can insert quote orders" ON quote_orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

-- Helper functions
-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS create_quote_conversation(UUID, UUID);

CREATE OR REPLACE FUNCTION create_quote_conversation(
  p_customer_id UUID, 
  p_quote_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_final_quote_id UUID;
BEGIN
  -- Use provided quote_id or generate new one
  v_final_quote_id := COALESCE(p_quote_id, gen_random_uuid());
  
  INSERT INTO quote_conversations (customer_id, quote_id)
  VALUES (p_customer_id, v_final_quote_id)
  RETURNING conversation_id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION add_quote_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_sender_role TEXT,
  p_message_text TEXT,
  p_message_type TEXT DEFAULT 'chat',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO quote_messages (
    conversation_id,
    sender_id,
    sender_role,
    message_text,
    message_type,
    metadata
  )
  VALUES (
    p_conversation_id,
    p_sender_id,
    p_sender_role,
    p_message_text,
    p_message_type,
    p_metadata
  )
  RETURNING message_id INTO v_message_id;
  
  -- Update conversation updated_at
  UPDATE quote_conversations 
  SET updated_at = now() 
  WHERE conversation_id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE (
  message_id UUID,
  sender_id UUID,
  sender_role TEXT,
  message_text TEXT,
  message_type TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qm.message_id,
    qm.sender_id,
    qm.sender_role,
    qm.message_text,
    qm.message_type,
    qm.metadata,
    qm.sent_at
  FROM quote_messages qm
  WHERE qm.conversation_id = p_conversation_id
  ORDER BY qm.sent_at ASC;
END;
$$;

-- Helper function to get quote_id from conversation_id
CREATE OR REPLACE FUNCTION get_quote_id_from_conversation(p_conversation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  SELECT quote_id
  INTO v_quote_id
  FROM quote_conversations
  WHERE conversation_id = p_conversation_id;
  
  RETURN v_quote_id;
END;
$$;

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quote_conversations_updated_at BEFORE UPDATE ON quote_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_proposals_updated_at BEFORE UPDATE ON quote_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON quote_conversations TO authenticated;
GRANT ALL ON quote_messages TO authenticated;
GRANT ALL ON quote_specs TO authenticated;
GRANT ALL ON quote_proposals TO authenticated;
GRANT ALL ON quote_orders TO authenticated;

-- Add comments
COMMENT ON TABLE quote_conversations IS 'Main conversation tracking for AI-powered quote flow';
COMMENT ON TABLE quote_messages IS 'Messages within quote conversations';
COMMENT ON TABLE quote_specs IS 'AI-generated spec versions with history tracking';
COMMENT ON TABLE quote_proposals IS 'Admin finalized specs with pricing';
COMMENT ON TABLE quote_orders IS 'Links accepted quotes to orders';
COMMENT ON COLUMN quote_conversations.quote_id IS 'Unique identifier for quote requests, separate from inquiry system';