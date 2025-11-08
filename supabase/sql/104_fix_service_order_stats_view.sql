-- Migration 104: Fix service_order_stats view to include orders with service_id in order_specs
-- Purpose: Count completed orders even when service_id column is NULL but service is specified in order_specs JSON

-- Update the view to match orders by both:
-- 1. Direct service_id column match (normal case)
-- 2. Match by display_id from order_specs JSON when service_id column is NULL

CREATE OR REPLACE VIEW public.service_order_stats AS
SELECT
  s.service_id,
  COUNT(DISTINCT o.order_id) AS total_order_count
FROM public.printing_services s
LEFT JOIN public.orders o
  ON o.status = 'completed'
  AND (
    -- Case 1: Direct service_id match
    o.service_id = s.service_id 
    OR 
    -- Case 2: Match by display_id from order_specs when service_id column is NULL
    (o.service_id IS NULL AND o.order_specs->>'service_id' = s.display_id)
  )
GROUP BY s.service_id;

COMMENT ON VIEW public.service_order_stats IS 
'All-time count of completed orders per service_id. Includes orders matched by service_id column or by display_id in order_specs JSON.';



