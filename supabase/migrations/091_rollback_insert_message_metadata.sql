-- Rollback Migration: Revert api_insert_chat_message_v2 to original signature (without metadata parameter)
-- Use this to restore the original function if migration 091 causes issues
--
-- To apply: Run this file after migration 091 to revert changes
-- This will restore the function to its original state from migration 085

-- Revert the function to original signature (no p_metadata parameter)
-- Note: Must DROP and recreate function since PostgreSQL doesn't allow changing function signature

DROP FUNCTION IF EXISTS public.api_insert_chat_message_v2(uuid, text, text, text, jsonb);

CREATE FUNCTION public.api_insert_chat_message_v2(
  p_session_id uuid,
  p_text text,
  p_role text,
  p_node_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_id uuid;
  v_customer_id uuid;
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
    jsonb_build_object('node_id', p_node_id)
  )
  returning message_id into v_message_id;

  return jsonb_build_object('message_id', v_message_id);
end;
$$;

-- Restore original function comment
comment on function public.api_insert_chat_message_v2(uuid, text, text, text) is 
'Inserts a chat message. Original function signature without metadata parameter.';

-- Grant permissions remain the same
grant execute on function public.api_insert_chat_message_v2(uuid, text, text, text) to authenticated, service_role;

