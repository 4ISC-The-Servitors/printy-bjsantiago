-- Migration 094: Disable ticket notification trigger
-- Ticket notifications are now handled by hardcoded application code
-- This prevents duplicate notifications from both trigger and application code

-- Drop the trigger that creates notifications for ticket events
DROP TRIGGER IF EXISTS trigger_ticket_notifications_v2 ON public.inquiries_v2;

-- Keep the function in case it's needed for other purposes, but it won't be triggered
-- The function can be removed later if not needed

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_ticket_events() IS 
'Ticket notification trigger has been disabled. Notifications are now handled by hardcoded application code in trackTicket.ts and replyToTicket.ts to prevent duplicates.';

