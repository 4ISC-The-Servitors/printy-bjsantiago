-- Migration: Add Display IDs for Orders, Tickets, and Quotes
-- This migration adds human-readable display IDs while keeping UUID primary keys

-- Create sequences starting after existing records
CREATE SEQUENCE IF NOT EXISTS order_display_seq START WITH 100002;
CREATE SEQUENCE IF NOT EXISTS ticket_display_seq START WITH 200029;
CREATE SEQUENCE IF NOT EXISTS quote_display_seq START WITH 300003;

-- Add display_id columns
ALTER TABLE orders_duplicate ADD COLUMN IF NOT EXISTS display_id VARCHAR(20) UNIQUE;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS display_id VARCHAR(20) UNIQUE;
ALTER TABLE quote_conversations ADD COLUMN IF NOT EXISTS display_id VARCHAR(20) UNIQUE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_display_id ON orders_duplicate(display_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_display_id ON inquiries(display_id);
CREATE INDEX IF NOT EXISTS idx_quote_conversations_display_id ON quote_conversations(display_id);

-- Create trigger functions to auto-generate display IDs
CREATE OR REPLACE FUNCTION generate_order_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'ORD-' || LPAD(nextval('order_display_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_ticket_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'TCK-' || LPAD(nextval('ticket_display_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_quote_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := 'QOT-' || LPAD(nextval('quote_display_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER set_order_display_id
  BEFORE INSERT ON orders_duplicate
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_display_id();

CREATE TRIGGER set_ticket_display_id
  BEFORE INSERT ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_display_id();

CREATE TRIGGER set_quote_display_id
  BEFORE INSERT ON quote_conversations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quote_display_id();

-- Comments for documentation
COMMENT ON COLUMN orders_duplicate.display_id IS 'Human-readable order ID (e.g., ORD-100002)';
COMMENT ON COLUMN inquiries.display_id IS 'Human-readable ticket ID (e.g., TCK-200029)';
COMMENT ON COLUMN quote_conversations.display_id IS 'Human-readable quote ID (e.g., QOT-300003)';
