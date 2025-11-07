-- Migration: Update api_insert_chat_message_v2 to accept optional metadata parameter
-- This allows storing attachment URLs and other metadata with messages
--
-- Note: Must DROP and recreate function since PostgreSQL doesn't allow changing function signature
-- We need to drop ALL overloads to avoid function overloading ambiguity

-- Drop ALL existing overloads to avoid ambiguity
-- Must drop all signatures to prevent "could not choose best candidate" errors
DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2(uuid, text, text, text, jsonb);
-- CASCADE to handle any dependencies
DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2 CASCADE;

-- Recreate the function with new parameter (includes p_metadata)
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
'Inserts a chat message with optional metadata. Metadata can include attachment_url and has_attachment for ticket image uploads.';

-- Grant permissions remain the same
grant execute on function public.api_insert_chat_message_v2(uuid, text, text, text, jsonb) to authenticated, service_role;

