-- Rollback Migration: Revert api_fetch_chat_messages_v2 to original signature (without metadata column)
-- Use this to restore the original function if migration 092 causes issues
--
-- To apply: Run this file after migration 092 to revert changes
-- This will restore the function to its original state from migration 085

-- Revert the function to original return signature (no metadata column)
-- Note: Must DROP and recreate function since PostgreSQL doesn't allow changing return type

DROP FUNCTION IF EXISTS public.api_fetch_chat_messages_v2(uuid);

CREATE FUNCTION public.api_fetch_chat_messages_v2(p_session_id uuid)
returns table (
  message_id uuid,
  sender_role text,
  message_text text,
  sent_at timestamptz,
  node_id text
)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- Restore original function comment
comment on function public.api_fetch_chat_messages_v2(uuid) is 
'Returns chat messages. Original function signature without metadata column.';

grant execute on function public.api_fetch_chat_messages_v2(uuid) to authenticated, service_role;

