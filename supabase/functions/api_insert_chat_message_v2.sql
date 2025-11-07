-- Function: api_insert_chat_message_v2
-- Description: Inserts a chat message into chat_messages_v2
-- Returns: JSON object with message_id

CREATE OR REPLACE FUNCTION public.api_insert_chat_message_v2(
  p_session_id uuid,
  p_text text,
  p_role text,
  p_node_id text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.api_insert_chat_message_v2(uuid, text, text, text) TO authenticated, service_role;

