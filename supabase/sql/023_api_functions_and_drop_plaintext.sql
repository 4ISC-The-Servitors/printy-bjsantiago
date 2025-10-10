-- API functions (security definer) + backfill + drop plaintext columns

-- Ensure extensions exist
create extension if not exists supabase_vault;
create extension if not exists pgcrypto;

-- 1) Backfill encrypted columns from plaintext where needed (safe if already filled)
update public.inquiries
set inquiry_message_enc = pgp_sym_encrypt(inquiry_message, vault.get_secret('enc_key_v1'))
where inquiry_message is not null and inquiry_message_enc is null;

update public.chat_messages
set message_text_enc = pgp_sym_encrypt(message_text, vault.get_secret('enc_key_v1'))
where message_text is not null and message_text_enc is null;

-- Clear plaintext after backfill (idempotent)
update public.inquiries set inquiry_message = null where inquiry_message is not null;
update public.chat_messages set message_text = null where message_text is not null;

-- 2) Drop triggers that relied on plaintext columns (if present)
drop trigger if exists inquiries_encrypt on public.inquiries;
drop trigger if exists chat_messages_encrypt on public.chat_messages;

-- Drop helper trigger functions (safe if absent)
drop function if exists priv.encrypt_inquiry() cascade;
drop function if exists priv.encrypt_chat_message() cascade;

-- 3) Drop plaintext columns
alter table public.inquiries drop column if exists inquiry_message;
alter table public.chat_messages drop column if exists message_text;

-- 4) Rebuild secure views WITHOUT coalesce
create or replace view public.chat_messages_secure as
select
  message_id,
  session_id,
  sent_at,
  priv.decrypt_text(message_text_enc) as message_text
from public.chat_messages;

grant select on public.chat_messages_secure to authenticated, service_role;

create or replace view public.inquiries_secure as
select
  inquiry_id,
  customer_id,
  inquiry_type,
  inquiry_status,
  resolution_comments,
  received_at,
  priv.decrypt_text(inquiry_message_enc) as inquiry_message
from public.inquiries;

grant select on public.inquiries_secure to authenticated, service_role;

-- 5) API functions (Option A): security-definer wrappers

-- Helper: admin check
create or replace function priv.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from auth.users u
    where u.id = auth.uid() and u.raw_app_meta_data->>'role' = 'admin'
  );
$$;

grant execute on function priv.is_admin() to authenticated, service_role;

-- User-specific inquiries list
create or replace function api_inquiries_for_user(p_limit int default 10, p_offset int default 0)
returns table (
  inquiry_id uuid,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  resolution_comments text,
  received_at timestamptz,
  inquiry_message text
)
language sql
security definer
set search_path = public
as $$
  select
    i.inquiry_id,
    i.customer_id,
    i.inquiry_type,
    i.inquiry_status,
    i.resolution_comments,
    i.received_at,
    i.inquiry_message
  from public.inquiries_secure i
  where i.customer_id = auth.uid()
  order by i.received_at desc
  limit p_limit offset p_offset
$$;

revoke all on function api_inquiries_for_user(int, int) from public;
grant execute on function api_inquiries_for_user(int, int) to authenticated, service_role;

-- Inquiry by id (user or admin)
create or replace function api_inquiry_by_id(p_inquiry_id uuid)
returns table (
  inquiry_id uuid,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  resolution_comments text,
  received_at timestamptz,
  inquiry_message text
)
language sql
security definer
set search_path = public
as $$
  select
    i.inquiry_id,
    i.customer_id,
    i.inquiry_type,
    i.inquiry_status,
    i.resolution_comments,
    i.received_at,
    i.inquiry_message
  from public.inquiries_secure i
  where i.inquiry_id = p_inquiry_id
    and (i.customer_id = auth.uid() or priv.is_admin())
  limit 1
$$;

revoke all on function api_inquiry_by_id(uuid) from public;
grant execute on function api_inquiry_by_id(uuid) to authenticated, service_role;

-- Admin list with customer names (only for admins)
create or replace function api_inquiries_admin_list(p_limit int, p_offset int)
returns table (
  inquiry_id uuid,
  customer_id uuid,
  inquiry_type text,
  inquiry_status text,
  received_at timestamptz,
  inquiry_message text,
  customer_first_name text,
  customer_last_name text
)
language sql
security definer
set search_path = public
as $$
  select
    i.inquiry_id,
    i.customer_id,
    i.inquiry_type,
    i.inquiry_status,
    i.received_at,
    i.inquiry_message,
    c.first_name as customer_first_name,
    c.last_name as customer_last_name
  from public.inquiries_secure i
  left join public.customer c on c.customer_id = i.customer_id
  where priv.is_admin()
  order by i.received_at desc
  limit p_limit offset p_offset
$$;

revoke all on function api_inquiries_admin_list(int, int) from public;
grant execute on function api_inquiries_admin_list(int, int) to authenticated, service_role;

-- Create inquiry (encrypts server-side)
create or replace function api_create_inquiry(p_message text, p_inquiry_type text)
returns table ( inquiry_id uuid )
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.inquiries (customer_id, inquiry_message_enc, inquiry_type, inquiry_status)
  values (auth.uid(), pgp_sym_encrypt(p_message, vault.get_secret('enc_key_v1')), p_inquiry_type, 'new')
  returning inquiries.inquiry_id into new_id;
  return query select new_id;
end $$;

revoke all on function api_create_inquiry(text, text) from public;
grant execute on function api_create_inquiry(text, text) to authenticated, service_role;

-- Insert chat message (encrypts server-side) and meta
create or replace function api_insert_chat_message(p_session_id uuid, p_text text, p_role text default 'user', p_node_id text default null)
returns table ( message_id uuid )
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
begin
  -- Ensure session belongs to user or caller is admin
  if not exists (
    select 1 from public.chat_sessions s
    where s.session_id = p_session_id and (s.customer_id = auth.uid() or priv.is_admin())
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.chat_messages (session_id, message_text_enc)
  values (p_session_id, pgp_sym_encrypt(p_text, vault.get_secret('enc_key_v1')))
  returning chat_messages.message_id into mid;

  insert into public.chat_message_meta (message_id, sender_role, node_id)
  values (mid, coalesce(p_role, 'user'), p_node_id);

  return query select mid;
end $$;

revoke all on function api_insert_chat_message(uuid, text, text, text) from public;
grant execute on function api_insert_chat_message(uuid, text, text, text) to authenticated, service_role;


