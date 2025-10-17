ALTER TABLE public.orders_duplicate
  DROP CONSTRAINT IF EXISTS orders_duplicate_status_check;

ALTER TABLE public.orders_duplicate
  ADD CONSTRAINT orders_duplicate_status_check
  CHECK (status = ANY (ARRAY[
    'awaiting_payment',
    'verifying_payment',
    'reupload_payment',
    'processing',
    'for_delivery',
    'for_pickup',
    'completed',
    'cancelled'
  ])) NOT VALID;