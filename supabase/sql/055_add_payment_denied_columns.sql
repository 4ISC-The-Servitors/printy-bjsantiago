-- Add payment_denied_by and payment_denied_at columns to orders table
-- This ensures consistency with payment_verified_by and payment_verified_at columns

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_denied_by UUID REFERENCES customer(customer_id),
ADD COLUMN IF NOT EXISTS payment_denied_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_denied_by IS 'Customer ID of the admin who denied the payment proof';
COMMENT ON COLUMN orders.payment_denied_at IS 'Timestamp when the payment proof was denied by admin';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_denied_by 
ON orders(payment_denied_by);

CREATE INDEX IF NOT EXISTS idx_orders_payment_denied_at 
ON orders(payment_denied_at);
