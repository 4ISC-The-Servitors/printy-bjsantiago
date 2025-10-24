-- Migration 074: Add updated_by column to inquiries_v2 table
-- This allows tracking who made changes to tickets for proper notification routing

-- Add updated_by column to inquiries_v2 table
ALTER TABLE public.inquiries_v2 
ADD COLUMN updated_by uuid NULL;

ALTER TABLE public.inquiries_v2
ADD CONSTRAINT fk_inquiries_v2_updated_by
FOREIGN KEY (updated_by) REFERENCES public.customer(customer_id)
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_v2_updated_by 
ON public.inquiries_v2 USING btree (updated_by);

-- Update existing records to set updated_by based on who likely made the change
-- For tickets with status 'new', assume customer created them
UPDATE public.inquiries_v2 
SET updated_by = customer_id 
WHERE inquiry_status = 'new' 
AND updated_by IS NULL;

-- For tickets with other statuses, assume admin updated them
-- We'll need to set these manually or leave NULL for now
-- This is a conservative approach - better to leave NULL than guess incorrectly

-- Add comment for documentation
COMMENT ON COLUMN public.inquiries_v2.updated_by IS 'Tracks who made the last update to this ticket for notification routing';
