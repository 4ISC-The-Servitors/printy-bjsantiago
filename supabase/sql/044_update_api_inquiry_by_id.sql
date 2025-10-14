-- Drop all dependent functions first
DROP FUNCTION IF EXISTS api_inquiries_for_user(int, int);
DROP FUNCTION IF EXISTS api_inquiries_admin_list(int, int);
DROP FUNCTION IF EXISTS api_inquiry_by_id(uuid);

-- Drop and recreate the view to include display_id
DROP VIEW IF EXISTS inquiries_secure;

CREATE VIEW inquiries_secure AS
SELECT inquiry_id,
    display_id,
    customer_id,
    inquiry_type,
    inquiry_status,
    resolution_comments,
    received_at,
    (convert_from(inquiry_message_enc, 'utf8'::name) COLLATE "default") AS inquiry_message
FROM inquiries;

-- Recreate api_inquiries_for_user with display_id
CREATE FUNCTION api_inquiries_for_user(p_limit int, p_offset int)
RETURNS TABLE (
  inquiry_id uuid,
  display_id text,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  resolution_comments text,
  received_at timestamptz,
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
    i.inquiry_message
  FROM public.inquiries_secure i
  WHERE i.customer_id = auth.uid()
  ORDER BY i.received_at DESC
  LIMIT p_limit OFFSET p_offset
$$;

-- Recreate api_inquiries_admin_list with display_id
CREATE FUNCTION api_inquiries_admin_list(p_limit int, p_offset int)
RETURNS TABLE (
  inquiry_id uuid,
  display_id text,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  received_at timestamptz,
  inquiry_message text,
  customer_first_name text,
  customer_last_name text
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, priv
AS $$
  SELECT i.inquiry_id, 
         i.display_id,
         i.customer_id, 
         i.inquiry_type, 
         i.inquiry_status,
         i.received_at, 
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
  LIMIT p_limit OFFSET p_offset
$$;

-- Recreate api_inquiry_by_id with display_id
CREATE FUNCTION api_inquiry_by_id(p_inquiry_id uuid)
RETURNS TABLE (
  inquiry_id uuid,
  display_id text,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  resolution_comments text,
  received_at timestamptz,
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
    i.inquiry_message
  FROM public.inquiries_secure i
  WHERE i.inquiry_id = p_inquiry_id
    AND (i.customer_id = auth.uid() OR priv.is_admin())
  LIMIT 1
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION api_inquiries_for_user(int, int) FROM public;
GRANT EXECUTE ON FUNCTION api_inquiries_for_user(int, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION api_inquiries_admin_list(int, int) FROM public;
GRANT EXECUTE ON FUNCTION api_inquiries_admin_list(int, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION api_inquiry_by_id(uuid) FROM public;
GRANT EXECUTE ON FUNCTION api_inquiry_by_id(uuid) TO authenticated, service_role;
