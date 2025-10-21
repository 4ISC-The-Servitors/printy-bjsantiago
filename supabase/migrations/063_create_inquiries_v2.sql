-- Migration: Create inquiries_v2 table
-- Purpose: Clean table structure for ticket system with proper order_id tracking
-- Deprecates: inquiry_message_enc and resolution_comments (now using chat_messages_v2)

-- 1. Create the inquiries_v2 table
CREATE TABLE public.inquiries_v2 (
  inquiry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type TEXT,
  inquiry_status TEXT DEFAULT 'new',
  customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions_v2(session_id) ON DELETE SET NULL,
  order_id UUID NULL REFERENCES orders(order_id) ON DELETE SET NULL,
  display_id VARCHAR(20) UNIQUE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inquiry_v2_status_check CHECK (
    inquiry_status = ANY (ARRAY[
      'new'::text,
      'under_review'::text,
      'pending_customer_reply'::text,
      'pending_admin_reply'::text,
      'resolved'::text,
      'closed'::text
    ])
  )
) TABLESPACE pg_default;

-- 2. Create indexes for performance
CREATE INDEX idx_inquiries_v2_display_id ON public.inquiries_v2 USING btree (display_id);
CREATE INDEX idx_inquiries_v2_customer_id ON public.inquiries_v2 USING btree (customer_id);
CREATE INDEX idx_inquiries_v2_session_id ON public.inquiries_v2 USING btree (session_id);
CREATE INDEX idx_inquiries_v2_order_id ON public.inquiries_v2 USING btree (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_inquiries_v2_status ON public.inquiries_v2 USING btree (inquiry_status);
CREATE INDEX idx_inquiries_v2_updated_at ON public.inquiries_v2 USING btree (updated_at DESC);

-- 3. Create trigger for display_id generation
-- Reuse existing function from inquiries table
CREATE TRIGGER set_ticket_display_id_v2
  BEFORE INSERT ON inquiries_v2
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_display_id();

-- 4. Create trigger for updated_at column
-- Reuse existing function from inquiries table
CREATE TRIGGER update_inquiries_v2_updated_at
  BEFORE UPDATE ON inquiries_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at_column();

-- 5. Create trigger for ticket notifications (if function exists)
-- Note: Only create if notify_ticket_events function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'notify_ticket_events'
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_ticket_notifications_v2
      AFTER INSERT OR UPDATE ON inquiries_v2
      FOR EACH ROW
      EXECUTE FUNCTION notify_ticket_events()';
  END IF;
END $$;

-- 6. Enable Row Level Security
ALTER TABLE public.inquiries_v2 ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for inquiries_v2

-- Customers can view their own inquiries
DROP POLICY IF EXISTS "select own inquiries v2" ON public.inquiries_v2;
CREATE POLICY "select own inquiries v2" 
  ON public.inquiries_v2
  FOR SELECT 
  USING (customer_id = auth.uid());

-- Customers can insert their own inquiries
DROP POLICY IF EXISTS "insert own inquiries v2" ON public.inquiries_v2;
CREATE POLICY "insert own inquiries v2" 
  ON public.inquiries_v2
  FOR INSERT 
  WITH CHECK (customer_id = auth.uid());

-- Admins can do everything with all inquiries
DROP POLICY IF EXISTS "admin all inquiries v2" ON public.inquiries_v2;
CREATE POLICY "admin all inquiries v2" 
  ON public.inquiries_v2
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM priv.is_admin() WHERE priv.is_admin() = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM priv.is_admin() WHERE priv.is_admin() = true
    )
  );

-- 8. Add helpful comments
COMMENT ON TABLE public.inquiries_v2 IS 'Customer support tickets (v2) - messages stored in chat_messages_v2';
COMMENT ON COLUMN public.inquiries_v2.inquiry_id IS 'Unique ticket identifier';
COMMENT ON COLUMN public.inquiries_v2.inquiry_type IS 'Type of issue: quality, delivery, billing, other';
COMMENT ON COLUMN public.inquiries_v2.inquiry_status IS 'Current ticket status';
COMMENT ON COLUMN public.inquiries_v2.customer_id IS 'Customer who created the ticket';
COMMENT ON COLUMN public.inquiries_v2.session_id IS 'Associated chat session containing all messages';
COMMENT ON COLUMN public.inquiries_v2.order_id IS 'Related order if ticket concerns an existing order';
COMMENT ON COLUMN public.inquiries_v2.display_id IS 'Human-readable ticket ID (e.g., TCK-200001)';
COMMENT ON COLUMN public.inquiries_v2.received_at IS 'When the ticket was created';
COMMENT ON COLUMN public.inquiries_v2.updated_at IS 'Last modification time';

