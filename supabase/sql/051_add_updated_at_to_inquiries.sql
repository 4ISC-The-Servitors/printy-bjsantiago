-- Migration 051: Add updated_at column to inquiries table
-- This migration adds the updated_at column to inquiries table and updates the inquiries_secure view

-- 1. Add updated_at column to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- 2. Add an index for better query performance on updated_at
CREATE INDEX IF NOT EXISTS idx_inquiries_updated_at ON public.inquiries (updated_at);

-- 3. Add a trigger to automatically update the updated_at column when a row is modified
CREATE OR REPLACE FUNCTION update_inquiries_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;

CREATE TRIGGER update_inquiries_updated_at 
    BEFORE UPDATE ON public.inquiries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inquiries_updated_at_column();

-- 4. Update the inquiries_secure view to include updated_at column
DROP VIEW IF EXISTS public.inquiries_secure;

CREATE VIEW public.inquiries_secure AS
SELECT 
    inquiry_id,
    display_id,
    customer_id,
    inquiry_type,
    inquiry_status,
    resolution_comments,
    received_at,
    updated_at,
    (convert_from(inquiry_message_enc, 'utf8'::name) COLLATE "default") AS inquiry_message
FROM public.inquiries;

-- 5. Grant permissions on the updated view
GRANT SELECT ON public.inquiries_secure TO authenticated, service_role;

-- 6. Update the API functions to include updated_at
-- Drop existing functions first
DROP FUNCTION IF EXISTS api_inquiries_for_user(int, int);
DROP FUNCTION IF EXISTS api_inquiries_admin_list(int, int);
DROP FUNCTION IF EXISTS api_inquiry_by_id(uuid);

-- Recreate api_inquiries_for_user with updated_at
CREATE FUNCTION api_inquiries_for_user(p_limit int, p_offset int)
RETURNS TABLE (
  inquiry_id uuid,
  display_id text,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  resolution_comments text,
  received_at timestamptz,
  updated_at timestamptz,
  inquiry_message text
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, priv
AS $$
  SELECT
    i.inquiry_id,
    i.display_id,
    i.customer_id,
    i.inquiry_type,
    i.inquiry_status,
    i.resolution_comments,
    i.received_at,
    i.updated_at,
    i.inquiry_message
  FROM public.inquiries_secure i
  WHERE i.customer_id = auth.uid()
  ORDER BY i.received_at DESC
  LIMIT p_limit OFFSET p_offset
$$;

-- Recreate api_inquiries_admin_list with updated_at
CREATE FUNCTION api_inquiries_admin_list(int, int)
RETURNS TABLE (
  inquiry_id uuid,
  display_id text,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  received_at timestamptz,
  updated_at timestamptz,
  inquiry_message text,
  customer_first_name text,
  customer_last_name text
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, priv
AS $$
  SELECT 
    i.inquiry_id, 
    i.display_id,
    i.customer_id, 
    i.inquiry_type, 
    i.inquiry_status,
    i.received_at,
    i.updated_at,
    i.inquiry_message,
    c.first_name as customer_first_name, 
    c.last_name as customer_last_name
  FROM public.inquiries_secure i
  LEFT JOIN public.customer c ON c.customer_id = i.customer_id
  WHERE EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin'
  )
  ORDER BY i.received_at DESC
  LIMIT $1 OFFSET $2
$$;

-- Recreate api_inquiry_by_id with updated_at
CREATE FUNCTION api_inquiry_by_id(p_inquiry_id uuid)
RETURNS TABLE (
  inquiry_id uuid,
  display_id text,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  resolution_comments text,
  received_at timestamptz,
  updated_at timestamptz,
  inquiry_message text
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, priv
AS $$
  SELECT
    i.inquiry_id,
    i.display_id,
    i.customer_id,
    i.inquiry_type,
    i.inquiry_status,
    i.resolution_comments,
    i.received_at,
    i.updated_at,
    i.inquiry_message
  FROM public.inquiries_secure i
  WHERE i.inquiry_id = p_inquiry_id
    AND (i.customer_id = auth.uid() OR priv.is_admin())
  LIMIT 1
$$;

-- Grant permissions on the API functions
REVOKE ALL ON FUNCTION api_inquiries_for_user(int, int) FROM public;
GRANT EXECUTE ON FUNCTION api_inquiries_for_user(int, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION api_inquiries_admin_list(int, int) FROM public;
GRANT EXECUTE ON FUNCTION api_inquiries_admin_list(int, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION api_inquiry_by_id(uuid) FROM public;
GRANT EXECUTE ON FUNCTION api_inquiry_by_id(uuid) TO authenticated, service_role;

-- 7. Add comments for documentation
COMMENT ON COLUMN public.inquiries.updated_at IS 'Timestamp when the inquiry was last updated';
COMMENT ON FUNCTION update_inquiries_updated_at_column() IS 'Trigger function to automatically update updated_at column when inquiry is modified';

-- 8. Verify the migration
DO $$
DECLARE
    column_exists boolean;
    index_exists boolean;
    trigger_exists boolean;
    view_exists boolean;
BEGIN
    -- Check if updated_at column was added
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'inquiries' 
        AND column_name = 'updated_at'
    ) INTO column_exists;
    
    -- Check if index was created
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'inquiries' 
        AND indexname = 'idx_inquiries_updated_at'
    ) INTO index_exists;
    
    -- Check if trigger was created
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_inquiries_updated_at'
    ) INTO trigger_exists;
    
    -- Check if view was updated
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'inquiries_secure' 
        AND column_name = 'updated_at'
    ) INTO view_exists;
    
    -- Log results
    RAISE NOTICE 'Migration verification results:';
    RAISE NOTICE '- updated_at column added: %', column_exists;
    RAISE NOTICE '- updated_at index created: %', index_exists;
    RAISE NOTICE '- updated_at trigger created: %', trigger_exists;
    RAISE NOTICE '- inquiries_secure view updated: %', view_exists;
    
    IF column_exists AND index_exists AND trigger_exists AND view_exists THEN
        RAISE NOTICE 'Migration 051 completed successfully!';
    ELSE
        RAISE EXCEPTION 'Migration 051 failed - some components were not created properly';
    END IF;
END $$;
