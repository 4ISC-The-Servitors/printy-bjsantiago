-- Migration 073: Add updated_by column to orders table
-- This allows tracking who made changes to orders for proper notification routing

-- Add updated_by column to orders table
ALTER TABLE public.orders 
ADD COLUMN updated_by uuid NULL;

ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_updated_by
FOREIGN KEY (updated_by) REFERENCES public.customer(customer_id)
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_updated_by 
ON public.orders USING btree (updated_by);

-- Update existing records to set updated_by based on who likely made the change
-- For orders with status 'awaiting_payment' or 'verifying_payment', assume customer created them
UPDATE public.orders 
SET updated_by = customer_id 
WHERE status IN ('awaiting_payment', 'verifying_payment') 
AND updated_by IS NULL;

-- For orders with other statuses, assume admin updated them
-- We'll need to set these manually or leave NULL for now
-- This is a conservative approach - better to leave NULL than guess incorrectly

-- Add comment for documentation
COMMENT ON COLUMN public.orders.updated_by IS 'Tracks who made the last update to this order for notification routing';
