-- Migration: Refactor quote_proposals to remove redundant status column
-- Add proposal_id FK to quotes table for single source of truth

-- Step 1: Add proposal_id column to quotes table (nullable initially)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES quote_proposals(proposal_id);

-- Step 2: Backfill existing quotes with their proposal_id
-- This links quotes to the most recent proposal sent for that session
UPDATE quotes q
SET proposal_id = (
  SELECT qp.proposal_id
  FROM quote_proposals qp
  WHERE qp.session_id = q.session_id
  ORDER BY qp.created_at DESC
  LIMIT 1
)
WHERE q.status IN ('spec_proposed', 'accepted', 'rejected')
  AND q.proposal_id IS NULL;

-- Step 3: Drop RLS policies that depend on quote_proposals.status column
-- These will be recreated after the column is dropped

-- Drop policy on quote_proposals table
DROP POLICY IF EXISTS "update quote_proposals" ON quote_proposals;

-- Drop policy on quotes table that references quote_proposals.status
DROP POLICY IF EXISTS "Customers can update quote status on acceptance/rejection" ON quotes;

-- Step 4: Remove redundant status column from quote_proposals
-- All status tracking will now happen in quotes table only
ALTER TABLE quote_proposals DROP COLUMN IF EXISTS status;

-- Step 5: Recreate RLS policies without status dependency

-- Allow admin to update quote_proposals (no status check needed)
CREATE POLICY "update quote_proposals"
ON quote_proposals FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions_v2 cs
    WHERE cs.session_id = quote_proposals.session_id
    AND is_admin()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions_v2 cs
    WHERE cs.session_id = quote_proposals.session_id
    AND is_admin()
  )
);

-- Allow customers to update quotes table when accepting/rejecting
-- Check status in quotes table instead of quote_proposals
CREATE POLICY "Customers can update quote status on acceptance/rejection"
ON quotes FOR UPDATE
TO authenticated
USING (
  auth.uid() = customer_id
  AND status IN ('spec_proposed') -- Can only accept/reject when status is spec_proposed
)
WITH CHECK (
  auth.uid() = customer_id
  AND status IN ('accepted', 'rejected') -- Can only set to accepted or rejected
);

-- Step 6: Create index for performance on proposal_id lookups
CREATE INDEX IF NOT EXISTS idx_quotes_proposal_id ON quotes(proposal_id);

-- Step 7: Drop old triggers that are now redundant (including existing one if any)
DROP TRIGGER IF EXISTS trigger_quote_accept_reject_notifications ON quotes;
DROP TRIGGER IF EXISTS trigger_customer_quote_update_notifications ON quotes;
DROP TRIGGER IF EXISTS trigger_quote_status_notifications ON quotes; -- Drop if already exists

-- Step 8: Create unified trigger for all quote status changes
-- This uses the notify_quote_events() function which handles:
-- - Customer-initiated changes (accept/reject) → notify admins
-- - Admin-initiated changes (spec_proposed, etc.) → notify customer
CREATE TRIGGER trigger_quote_status_notifications
AFTER UPDATE ON quotes
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_quote_events();

-- Note: The notify_quote_proposal_accept_reject function and trigger are no longer needed
-- since we're not tracking status in quote_proposals anymore
DROP FUNCTION IF EXISTS notify_quote_proposal_accept_reject() CASCADE;
