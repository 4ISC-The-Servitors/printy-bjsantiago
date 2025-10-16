-- Add RLS policies for quotes table

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own quotes
CREATE POLICY "Customers can view own quotes"
ON quotes FOR SELECT
USING (auth.uid() = quotes.customer_id);

-- Policy: Admins can view all quotes
CREATE POLICY "Admins can view all quotes"
ON quotes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customer c
    WHERE c.customer_id = auth.uid()
    AND c.customer_type = 'admin'
  )
);

-- Policy: System can insert quotes (for the action handler)
CREATE POLICY "Authenticated users can create quotes"
ON quotes FOR INSERT
WITH CHECK (auth.uid() = quotes.customer_id);

-- Policy: Admins can update quotes
CREATE POLICY "Admins can update quotes"
ON quotes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customer c
    WHERE c.customer_id = auth.uid()
    AND c.customer_type = 'admin'
  )
);

-- Policy: Admins can delete quotes
CREATE POLICY "Admins can delete quotes"
ON quotes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM customer c
    WHERE c.customer_id = auth.uid()
    AND c.customer_type = 'admin'
  )
);

COMMENT ON POLICY "Customers can view own quotes" ON quotes IS 'Customers can only see their own quote requests';
COMMENT ON POLICY "Admins can view all quotes" ON quotes IS 'Admins can see all customer quotes';

