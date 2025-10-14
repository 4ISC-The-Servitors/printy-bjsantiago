-- Drop existing orders_duplicate table and recreate with proper structure
DROP TABLE IF EXISTS orders_duplicate CASCADE;

-- Create new orders table with proper structure
CREATE TABLE orders_duplicate (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer(customer_id) ON DELETE CASCADE,
  -- Store the final agreed specs
  order_specs JSONB NOT NULL DEFAULT '{}',
  -- Store the agreed price
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  currency TEXT NOT NULL DEFAULT 'PHP',
  -- Order status
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (
    status IN (
      'awaiting_payment',    -- Initial state after order creation
      'verifying_payment',   -- Admin is checking payment proof
      'processing',          -- Payment verified, order being processed
      'for_delivery',        -- Ready for delivery
      'for_pickup',         -- Ready for pickup
      'completed',          -- Order completed
      'cancelled'           -- Order cancelled
    )
  ),
  -- Payment tracking
  payment_proof TEXT,           -- URL/path to payment proof image
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES customer(customer_id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Optional notes
  admin_notes TEXT,
  customer_notes TEXT
);

-- Add indexes for performance
CREATE INDEX idx_orders_customer_id ON orders_duplicate(customer_id);
CREATE INDEX idx_orders_status ON orders_duplicate(status);
CREATE INDEX idx_orders_created_at ON orders_duplicate(created_at DESC);
CREATE INDEX idx_orders_updated_at ON orders_duplicate(updated_at DESC);

-- Enable RLS
ALTER TABLE orders_duplicate ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own orders
CREATE POLICY "Customers can view own orders" ON orders_duplicate
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

-- Only admins can insert orders
CREATE POLICY "Admins can insert orders" ON orders_duplicate
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

-- Only admins can update orders
CREATE POLICY "Admins can update orders" ON orders_duplicate
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM customer WHERE customer_id = auth.uid() AND customer_type = 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders_duplicate
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Function to verify payment
CREATE OR REPLACE FUNCTION verify_order_payment(
  p_order_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM customer 
    WHERE customer_id = p_admin_id 
    AND customer_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can verify payments';
  END IF;

  -- Update order status
  UPDATE orders_duplicate
  SET 
    status = 'processing',
    payment_verified_at = now(),
    payment_verified_by = p_admin_id,
    admin_notes = CASE 
      WHEN p_admin_notes IS NOT NULL THEN 
        COALESCE(admin_notes || E'\n', '') || 'Payment verified: ' || p_admin_notes
      ELSE 
        admin_notes
      END
  WHERE 
    order_id = p_order_id 
    AND status = 'verifying_payment';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in verifying_payment status';
  END IF;
END;
$$;

-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID,
  p_status TEXT,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM customer 
    WHERE customer_id = p_admin_id 
    AND customer_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;

  -- Update order status
  UPDATE orders_duplicate
  SET 
    status = p_status,
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_status = 'cancelled' THEN now() ELSE cancelled_at END,
    admin_notes = CASE 
      WHEN p_admin_notes IS NOT NULL THEN 
        COALESCE(admin_notes || E'\n', '') || 'Status updated to ' || p_status || ': ' || p_admin_notes
      ELSE 
        admin_notes
      END
  WHERE order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END;
$$;

-- Comments
COMMENT ON TABLE orders_duplicate IS 'Stores order information including specs, pricing, and status';
COMMENT ON COLUMN orders_duplicate.order_specs IS 'JSON containing the final agreed specifications from quote';
COMMENT ON COLUMN orders_duplicate.total_amount IS 'Final agreed price from quote';
COMMENT ON COLUMN orders_duplicate.status IS 'Current order status';
COMMENT ON COLUMN orders_duplicate.payment_proof IS 'URL/path to uploaded payment proof image';
COMMENT ON COLUMN orders_duplicate.payment_verified_at IS 'When payment was verified by admin';
COMMENT ON COLUMN orders_duplicate.payment_verified_by IS 'Which admin verified the payment';
COMMENT ON COLUMN orders_duplicate.admin_notes IS 'Internal notes visible to admins only';
COMMENT ON COLUMN orders_duplicate.customer_notes IS 'Notes visible to customer';
