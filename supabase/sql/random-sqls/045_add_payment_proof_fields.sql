-- Migration 044: Add payment proof fields and extend order statuses

-- 1. Add payment_proof_uploaded_at field to orders_duplicate
ALTER TABLE orders_duplicate
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

-- 2. Extend Order Status Constraint
-- Drop existing constraint and recreate with new status
ALTER TABLE orders_duplicate DROP CONSTRAINT IF EXISTS orders_duplicate_status_check;
ALTER TABLE orders_duplicate ADD CONSTRAINT orders_duplicate_status_check
CHECK (status IN (
  'awaiting_payment',           -- Initial state after order creation
  'verifying_payment',          -- Admin is checking payment proof (EXISTING)
  'reupload_payment_proof',     -- NEW: Admin rejected proof, customer must reupload
  'processing',                 -- Payment verified, order being processed
  'for_delivery',               -- Ready for delivery
  'for_pickup',                 -- Ready for pickup
  'completed',                  -- Order completed
  'cancelled'                   -- Order cancelled
));

-- 3. Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_transfer', 'qrph')),
  image_url TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_display_order ON payment_methods(display_order);

-- 5. Enable RLS on payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for payment_methods
-- Public read access
CREATE POLICY "Public can view active payment methods" ON payment_methods
  FOR SELECT USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Admins can manage payment methods" ON payment_methods
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 7. Add updated_at trigger for payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_payment_methods_updated_at();

-- 8. Add comments for documentation
COMMENT ON TABLE payment_methods IS 'Admin-managed payment method images (bank details, QR codes)';
COMMENT ON COLUMN payment_methods.method_type IS 'Type of payment method: bank_transfer or qrph';
COMMENT ON COLUMN payment_methods.image_url IS 'URL to the payment method image in Supabase Storage';
COMMENT ON COLUMN payment_methods.label IS 'Display label for the payment method (e.g., "BPI Instapay", "GCash QR")';
COMMENT ON COLUMN payment_methods.is_active IS 'Whether this payment method is currently active and should be shown to customers';
COMMENT ON COLUMN payment_methods.display_order IS 'Order in which payment methods should be displayed (lower numbers first)';
