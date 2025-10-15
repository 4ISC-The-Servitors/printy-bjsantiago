-- Migration 050: Update inquiry status constraints to new ticket status values
-- This migration ONLY updates constraints to support new status values
-- Existing data remains unchanged - new statuses can be used for future records
-- Note: inquiries_secure is a view, so it will automatically reflect the changes

-- Step 1: Drop existing constraint on inquiries table
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_inquiry_status_check;

-- Step 2: Add new constraint that supports both old and new status values
-- This allows existing data to remain valid while enabling new status values
ALTER TABLE inquiries ADD CONSTRAINT inquiries_inquiry_status_check 
  CHECK (inquiry_status = ANY (ARRAY[
    -- Existing status values (for backward compatibility)
    'new'::text,
    'open'::text,
    'in_progress'::text,
    'resolved'::text,
    'closed'::text,
    -- New status values (for future use)
    'under_review'::text,
    'pending_customer_reply'::text,
    'pending_admin_reply'::text
  ]));

-- Step 3: Update default value to use new status
ALTER TABLE inquiries ALTER COLUMN inquiry_status SET DEFAULT 'new';

-- Step 4: Add comment for documentation
COMMENT ON CONSTRAINT inquiries_inquiry_status_check ON inquiries IS 
'Updated constraint to support both old status values (new, open, in_progress, resolved, closed) and new status values (under_review, pending_customer_reply, pending_admin_reply)';

-- Step 5: Verify the migration by checking data distribution
DO $$
DECLARE
  inquiry_counts RECORD;
  secure_counts RECORD;
BEGIN
  -- Check inquiries table
  SELECT 
    inquiry_status,
    COUNT(*) as count
  INTO inquiry_counts
  FROM inquiries
  GROUP BY inquiry_status
  ORDER BY count DESC
  LIMIT 1;
  
  -- Check inquiries_secure view (will reflect the same data)
  SELECT 
    inquiry_status,
    COUNT(*) as count
  INTO secure_counts
  FROM inquiries_secure
  GROUP BY inquiry_status
  ORDER BY count DESC
  LIMIT 1;
  
  -- Log the results
  RAISE NOTICE 'Migration completed successfully. Top status in inquiries: % (%)', 
    inquiry_counts.inquiry_status, inquiry_counts.count;
  RAISE NOTICE 'Top status in inquiries_secure view: % (%)', 
    secure_counts.inquiry_status, secure_counts.count;
  RAISE NOTICE 'Constraint now supports both old and new status values';
END $$;
