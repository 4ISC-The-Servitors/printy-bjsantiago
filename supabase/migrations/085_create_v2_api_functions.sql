-- Migration: Create v2 API functions if they don't exist
-- These functions are required for the JSONB chat flow system

-- Ensure required extensions exist
create extension if not exists pgcrypto;

-- 1) Get flow definition from chat_flows_v2
create or replace function public.api_get_flow_definition(p_flow_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select flow_definition
  from public.chat_flows_v2
  where flow_id = p_flow_id and active = true
  limit 1;
$$;

grant execute on function public.api_get_flow_definition(text) to authenticated, service_role, anon;

-- 2) Insert encrypted message to chat_messages_v2
create or replace function public.api_insert_chat_message_v2(
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

grant execute on function public.api_insert_chat_message_v2(uuid, text, text, text) to authenticated, service_role;

-- 3) Fetch decrypted messages from chat_messages_v2
create or replace function public.api_fetch_chat_messages_v2(p_session_id uuid)
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

grant execute on function public.api_fetch_chat_messages_v2(uuid) to authenticated, service_role;

-- 4) Get user sessions from chat_sessions_v2
create or replace function public.api_get_user_sessions_v2()
returns table (
  session_id uuid,
  flow_id text,
  status text,
  created_at timestamptz,
  current_node_id text
)
language sql
security definer
set search_path = public
as $$
  select
    s.session_id,
    s.flow_id,
    s.status,
    s.created_at,
    (s.metadata->>'current_node_id')::text as current_node_id
  from public.chat_sessions_v2 s
  where s.customer_id = auth.uid()
    and (s.metadata->>'ticket_conversation' is null or s.metadata->>'ticket_conversation' != 'true')
  order by s.created_at desc;
$$;

grant execute on function public.api_get_user_sessions_v2() to authenticated, service_role;

-- 5) Helper function to get session metadata (useful for debugging)
create or replace function public.api_get_session_metadata_v2(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_metadata jsonb;
begin
  -- Get session customer_id and metadata
  select customer_id, metadata into v_customer_id, v_metadata
  from public.chat_sessions_v2
  where session_id = p_session_id;

  -- Check authorization
  if v_customer_id is null then
    raise exception 'session not found';
  end if;

  if not (v_customer_id = auth.uid() or priv.is_admin()) then
    raise exception 'not authorized';
  end if;

  return v_metadata;
end;
$$;

grant execute on function public.api_get_session_metadata_v2(uuid) to authenticated, service_role;

comment on function public.api_get_user_sessions_v2() is 
'Returns customer chat sessions excluding ticket conversation reply sessions. Ticket reply sessions are internal and only appear within Track Ticket conversation history.';
