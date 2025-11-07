-- Function: api_fetch_chat_messages_v2
-- Description: Fetches chat messages for a session from chat_messages_v2
-- Returns: Table with message_id, sender_role, message_text, sent_at, node_id

CREATE OR REPLACE FUNCTION public.api_fetch_chat_messages_v2(p_session_id uuid)
RETURNS TABLE(
  message_id uuid,
  sender_role text,
  message_text text,
  sent_at timestamp with time zone,
  node_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_customer_id uuid;
begin
  -- Get session customer_id
  select customer_id into v_customer_id
  from public.chat_sessions_v2
  where session_id = p_session_id;

  -- Check authorization
  if v_customer_id is null then
    raise exception 'session not found';
  end if;

  if not (v_customer_id = auth.uid() or priv.is_admin()) then
    raise exception 'not authorized';
  end if;

  -- Return messages (convert bytea to text, no decryption needed)
  return query
  select
    m.message_id,
    m.sender_role,
    convert_from(m.message_text_enc, 'UTF8') as message_text,
    m.sent_at,
    (m.metadata->>'node_id')::text as node_id
  from public.chat_messages_v2 m
  where m.session_id = p_session_id
  order by m.sent_at asc;
end;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.api_fetch_chat_messages_v2(uuid) TO authenticated, service_role;

