-- Migration 102: Fix duplicate order notification triggers
-- There are two triggers calling notify_order_events():
-- 1. trigger_notify_order_events (from migration 088)
-- 2. trigger_order_notifications (from migration 075)
-- Both fire on INSERT OR UPDATE, causing duplicate notifications

-- Drop the duplicate trigger (keep trigger_order_notifications as it's the newer one)
DROP TRIGGER IF EXISTS trigger_notify_order_events ON public.orders;

-- Ensure only one trigger exists
DROP TRIGGER IF EXISTS trigger_order_notifications ON public.orders;
CREATE TRIGGER trigger_order_notifications
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_events();

-- Add comment for documentation
COMMENT ON TRIGGER trigger_order_notifications ON public.orders IS 
'Single trigger for order notifications. Handles both INSERT and UPDATE operations via notify_order_events().';

