-- API functions for chat_sessions_v2, chat_messages_v2, and chat_flows_v2
-- These are required by the JsonbFlowProcessor and jsonbChatFlowApi

-- Ensure required extensions exist
create extension if not exists pgcrypto;
create extension if not exists supabase_vault;

-- 1) Get flow definition from chat_flows_v2
create or replace function api_get_flow_definition(p_flow_id text)
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

grant execute on function api_get_flow_definition(text) to authenticated, service_role, anon;

-- 2) Insert encrypted message to chat_messages_v2
create or replace function api_insert_chat_message_v2(
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
  v_enc_key text;
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

  -- Get encryption key
  v_enc_key := vault.get_secret('enc_key_v1');

  -- Insert encrypted message
  insert into public.chat_messages_v2 (
    session_id,
    sender_role,
    message_text_enc,
    metadata
  )
  values (
    p_session_id,
    p_role,
    pgp_sym_encrypt(p_text, v_enc_key),
    jsonb_build_object('node_id', p_node_id)
  )
  returning message_id into v_message_id;

  return jsonb_build_object('message_id', v_message_id);
end;
$$;

grant execute on function api_insert_chat_message_v2(uuid, text, text, text) to authenticated, service_role;

-- 3) Fetch decrypted messages from chat_messages_v2
create or replace function api_fetch_chat_messages_v2(p_session_id uuid)
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

  -- Return decrypted messages
  return query
  select
    m.message_id,
    m.sender_role,
    priv.decrypt_text(m.message_text_enc) as message_text,
    m.sent_at,
    (m.metadata->>'node_id')::text as node_id
  from public.chat_messages_v2 m
  where m.session_id = p_session_id
  order by m.sent_at asc;
end;
$$;

grant execute on function api_fetch_chat_messages_v2(uuid) to authenticated, service_role;

-- 4) Get user sessions from chat_sessions_v2
create or replace function api_get_user_sessions_v2()
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
  order by s.created_at desc;
$$;

grant execute on function api_get_user_sessions_v2() to authenticated, service_role;

-- 5) Helper function to get session metadata (useful for debugging)
create or replace function api_get_session_metadata_v2(p_session_id uuid)
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

grant execute on function api_get_session_metadata_v2(uuid) to authenticated, service_role;

-- 6) Create secure view for chat_messages_v2 (similar to legacy chat_messages_secure)
create or replace view public.chat_messages_v2_secure as
select
  m.message_id,
  m.session_id,
  m.sender_role,
  priv.decrypt_text(m.message_text_enc) as message_text,
  m.sent_at,
  m.metadata
from public.chat_messages_v2 m;

grant select on public.chat_messages_v2_secure to authenticated, service_role;

-- 7) Enable RLS on chat_sessions_v2 and chat_messages_v2
alter table public.chat_sessions_v2 enable row level security;
alter table public.chat_messages_v2 enable row level security;
alter table public.chat_flows_v2 enable row level security;

-- RLS Policies for chat_sessions_v2
drop policy if exists "Users can view their own sessions" on public.chat_sessions_v2;
create policy "Users can view their own sessions"
  on public.chat_sessions_v2
  for select
  using (customer_id = auth.uid() or priv.is_admin());

drop policy if exists "Users can insert their own sessions" on public.chat_sessions_v2;
create policy "Users can insert their own sessions"
  on public.chat_sessions_v2
  for insert
  with check (customer_id = auth.uid() or priv.is_admin());

drop policy if exists "Users can update their own sessions" on public.chat_sessions_v2;
create policy "Users can update their own sessions"
  on public.chat_sessions_v2
  for update
  using (customer_id = auth.uid() or priv.is_admin());

-- RLS Policies for chat_messages_v2
drop policy if exists "Users can view messages from their sessions" on public.chat_messages_v2;
create policy "Users can view messages from their sessions"
  on public.chat_messages_v2
  for select
  using (
    exists (
      select 1 from public.chat_sessions_v2 s
      where s.session_id = chat_messages_v2.session_id
        and (s.customer_id = auth.uid() or priv.is_admin())
    )
  );

drop policy if exists "Users can insert messages to their sessions" on public.chat_messages_v2;
create policy "Users can insert messages to their sessions"
  on public.chat_messages_v2
  for insert
  with check (
    exists (
      select 1 from public.chat_sessions_v2 s
      where s.session_id = chat_messages_v2.session_id
        and (s.customer_id = auth.uid() or priv.is_admin())
    )
  );

-- RLS Policies for chat_flows_v2 (read-only for all authenticated users)
drop policy if exists "All users can view active flows" on public.chat_flows_v2;
create policy "All users can view active flows"
  on public.chat_flows_v2
  for select
  using (active = true);

drop policy if exists "Only admins can modify flows" on public.chat_flows_v2;
create policy "Only admins can modify flows"
  on public.chat_flows_v2
  for all
  using (priv.is_admin());
