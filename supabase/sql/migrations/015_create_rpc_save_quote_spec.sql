-- Migration: Create RPC function to save quote specs with security definer
-- Purpose: Allow admins to save specs even when RLS would normally block client-side inserts

-- Drop function if exists
DROP FUNCTION IF EXISTS public.save_quote_spec(uuid, jsonb);

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.save_quote_spec(
  p_session_id uuid,
  p_spec_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spec_id uuid;
  v_session_exists boolean;
BEGIN
  -- Verify the user is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can save quote specifications';
  END IF;

  -- Verify the session exists
  SELECT EXISTS (
    SELECT 1 FROM chat_sessions_v2
    WHERE session_id = p_session_id
  ) INTO v_session_exists;

  IF NOT v_session_exists THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Insert the spec
  INSERT INTO quote_specs (session_id, spec_data)
  VALUES (p_session_id, p_spec_data)
  RETURNING spec_id INTO v_spec_id;

  RETURN v_spec_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_quote_spec(uuid, jsonb) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.save_quote_spec IS 'Saves a quote specification for a given session. Only admins can call this function. Uses SECURITY DEFINER to bypass RLS.';

