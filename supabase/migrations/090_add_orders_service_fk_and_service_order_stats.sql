-- Migration: Add orders.service_id FK to printing_services and create service_order_stats view
-- Purpose: Enable accurate, all-time counts of completed orders per service

-- 1) Add service_id to orders (nullable for historical data)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_id uuid;

-- 2) Add FK constraint to printing_services(service_id) if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'orders_service_id_fkey'
      AND t.relname = 'orders'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_service_id_fkey
      FOREIGN KEY (service_id)
      REFERENCES public.printing_services(service_id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON public.orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 4) View: service_order_stats (all-time totals, only completed orders)
CREATE OR REPLACE VIEW public.service_order_stats AS
SELECT
  s.service_id,
  COUNT(o.order_id) AS total_order_count
FROM public.printing_services s
LEFT JOIN public.orders o
  ON o.service_id = s.service_id
  AND o.status = 'completed'
GROUP BY s.service_id;

COMMENT ON VIEW public.service_order_stats IS 'All-time count of completed orders per service_id';


