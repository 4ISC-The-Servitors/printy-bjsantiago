-- Fix Migration: Resolve function overloading ambiguity for api_insert_chat_message_v2
-- This migration cleans up any duplicate function definitions that may cause ambiguous calls
--
-- Problem: If both 4-parameter and 5-parameter versions exist, PostgreSQL can't decide
-- which to use when called with 4 parameters (both match due to default values)
--
-- Solution: Drop ALL overloads and create only the 5-parameter version with defaults

-- Drop ALL existing overloads of the function
DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2(uuid, text, text, text, jsonb);
-- Use CASCADE to remove any dependencies
DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2 CASCADE;

-- Create only the new version with p_metadata parameter (defaults to null)
CREATE FUNCTION public.api_insert_chat_message_v2(
  p_session_id uuid,
  p_text text,
  p_role text,
  p_node_id text default null,
  p_metadata jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_id uuid;
  v_customer_id uuid;
  v_final_metadata jsonb;
begin
  -- Get session customer_id
  select customer_id into v_customer_id
  from public.chat_sessions_v2
  where session_id = p_session_id;

  -- Check authorization: must be session owner, admin, or service role
  if v_customer_id is null then
    raise exception 'session not found';
  end if;

  if not (v_customer_id = auth.uid() or priv.is_admin()) then
    raise exception 'not authorized';
  end if;

  -- Build metadata: merge node_id with provided metadata
  v_final_metadata := jsonb_build_object('node_id', p_node_id);
  if p_metadata is not null then
    v_final_metadata := v_final_metadata || p_metadata;
  end if;

  -- Insert message as plain bytea (not encrypted)
  insert into public.chat_messages_v2 (
    session_id,
    sender_role,
    message_text_enc,
    metadata
  )
  values (
    p_session_id,
    p_role,
    p_text::bytea,
    v_final_metadata
  )
  returning message_id into v_message_id;

  return jsonb_build_object('message_id', v_message_id);
end;
$$;

-- Update function comment
comment on function public.api_insert_chat_message_v2(uuid, text, text, text, jsonb) is 
'Inserts a chat message with optional metadata. Metadata can include attachment_url and has_attachment for ticket image uploads. Supports 4-parameter calls (p_metadata defaults to null) for backward compatibility.';

-- Grant permissions
grant execute on function public.api_insert_chat_message_v2(uuid, text, text, text, jsonb) to authenticated, service_role;

-- Verify only one function exists
DO $$
DECLARE
  function_count integer;
BEGIN
  SELECT COUNT(*)
  INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'api_insert_chat_message_v2';

  IF function_count > 1 THEN
    RAISE WARNING 'Multiple overloads still exist. Function count: %', function_count;
  ELSIF function_count = 0 THEN
    RAISE EXCEPTION 'Function was not created successfully';
  ELSE
    RAISE NOTICE 'Function cleanup successful. Single function exists.';
  END IF;
END $$;

