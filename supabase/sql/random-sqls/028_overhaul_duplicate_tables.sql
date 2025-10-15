-- Migration 028: Overhaul duplicate tables for proper quote flow
-- This migration cleans up and restructures the duplicate tables

-- First, let's add the missing columns and clean up existing ones
-- Note: User will manually delete all rows before running this

-- 1. Overhaul inquiries_duplicate table
-- Remove redundant columns and add missing ones
ALTER TABLE inquiries_duplicate 
DROP COLUMN IF EXISTS inquiry_message,
DROP COLUMN IF EXISTS resolution_comments,
DROP COLUMN IF EXISTS assigned_to;

-- Add essential columns for quote flow
ALTER TABLE inquiries_duplicate 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- 2. Overhaul orders_duplicate table
-- Remove redundant columns and clean up
ALTER TABLE orders_duplicate
DROP COLUMN IF EXISTS specification, -- Use spec JSONB instead
DROP COLUMN IF EXISTS priority_level; -- Use priority text instead

-- Add missing columns
ALTER TABLE orders_duplicate
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_completion TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Overhaul quotes_duplicate table
-- Remove redundant columns
ALTER TABLE quotes_duplicate
DROP COLUMN IF EXISTS initial_price,
DROP COLUMN IF EXISTS negotiated_price,
DROP COLUMN IF EXISTS quote_issue_datetime,
DROP COLUMN IF EXISTS quote_due_datetime;

-- Add missing columns
ALTER TABLE quotes_duplicate
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inquiries_duplicate_customer_id ON inquiries_duplicate(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_duplicate_status ON inquiries_duplicate(inquiry_status);
CREATE INDEX IF NOT EXISTS idx_inquiries_duplicate_created_at ON inquiries_duplicate(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_duplicate_type ON inquiries_duplicate(inquiry_type);

CREATE INDEX IF NOT EXISTS idx_orders_duplicate_customer_id ON orders_duplicate(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_duplicate_status ON orders_duplicate(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_duplicate_created_at ON orders_duplicate(created_at);

CREATE INDEX IF NOT EXISTS idx_quotes_duplicate_customer_id ON quotes_duplicate(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_duplicate_inquiry_id ON quotes_duplicate(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotes_duplicate_status ON quotes_duplicate(status);
CREATE INDEX IF NOT EXISTS idx_quotes_duplicate_created_at ON quotes_duplicate(created_at);

-- 5. Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all duplicate tables
DROP TRIGGER IF EXISTS update_inquiries_duplicate_updated_at ON inquiries_duplicate;
CREATE TRIGGER update_inquiries_duplicate_updated_at 
    BEFORE UPDATE ON inquiries_duplicate 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_duplicate_updated_at ON orders_duplicate;
CREATE TRIGGER update_orders_duplicate_updated_at 
    BEFORE UPDATE ON orders_duplicate 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_duplicate_updated_at ON quotes_duplicate;
CREATE TRIGGER update_quotes_duplicate_updated_at 
    BEFORE UPDATE ON quotes_duplicate 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Update RLS policies to work with new schema
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Users can insert own inquiries" ON inquiries_duplicate;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries_duplicate;

DROP POLICY IF EXISTS "Users can view own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders_duplicate;
DROP POLICY IF EXISTS "Users can update own orders" ON orders_duplicate;

DROP POLICY IF EXISTS "Users can view own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes_duplicate;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes_duplicate;

-- Create new policies
CREATE POLICY "Users can view own inquiries" ON inquiries_duplicate
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own inquiries" ON inquiries_duplicate
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own inquiries" ON inquiries_duplicate
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Users can view own orders" ON orders_duplicate
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own orders" ON orders_duplicate
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own orders" ON orders_duplicate
    FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Users can view own quotes" ON quotes_duplicate
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own quotes" ON quotes_duplicate
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own quotes" ON quotes_duplicate
    FOR UPDATE USING (auth.uid() = customer_id);

-- 7. Add comments for documentation
COMMENT ON TABLE inquiries_duplicate IS 'Customer inquiries and support tickets - duplicate table for quote flow integration';
COMMENT ON TABLE orders_duplicate IS 'Customer orders - duplicate table with enhanced fields for quote-to-order conversion';
COMMENT ON TABLE quotes_duplicate IS 'Customer quotes - duplicate table for LLM-powered quote generation and management';

COMMENT ON COLUMN inquiries_duplicate.subject IS 'Brief subject/title of the inquiry';
COMMENT ON COLUMN inquiries_duplicate.description IS 'Detailed description of the inquiry';
COMMENT ON COLUMN inquiries_duplicate.priority IS 'Priority level: urgent';
COMMENT ON COLUMN inquiries_duplicate.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN inquiries_duplicate.metadata IS 'Additional metadata as JSON';

COMMENT ON COLUMN orders_duplicate.title IS 'Order title/name';
COMMENT ON COLUMN orders_duplicate.description IS 'Order description';
COMMENT ON COLUMN orders_duplicate.priority IS 'Priority level: urgent';
COMMENT ON COLUMN orders_duplicate.estimated_completion IS 'Estimated completion timestamp';
COMMENT ON COLUMN orders_duplicate.actual_completion IS 'Actual completion timestamp';
COMMENT ON COLUMN orders_duplicate.notes IS 'Additional order notes';
COMMENT ON COLUMN orders_duplicate.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN orders_duplicate.metadata IS 'Additional metadata as JSON';

COMMENT ON COLUMN quotes_duplicate.title IS 'Quote title/name';
COMMENT ON COLUMN quotes_duplicate.description IS 'Quote description';
COMMENT ON COLUMN quotes_duplicate.valid_until IS 'Quote validity expiration timestamp';
COMMENT ON COLUMN quotes_duplicate.terms IS 'Terms and conditions for the quote';
COMMENT ON COLUMN quotes_duplicate.metadata IS 'Additional metadata as JSON';
