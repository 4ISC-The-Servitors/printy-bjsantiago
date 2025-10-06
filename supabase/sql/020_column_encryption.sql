-- Column-level encryption using supabase_vault + pgcrypto
-- This migration encrypts sensitive text fields and exposes read-only decrypted views.

-- Extensions (idempotent)
create extension if not exists supabase_vault;
create extension if not exists pgcrypto;

-- Create a symmetric key in Vault (idempotent-ish)
do $$
begin
  perform vault.create_secret('enc_key_v1', encode(gen_random_bytes(32), 'base64'));
exception when others then
  -- ignore if the secret already exists
  null;
end$$;

-- Private schema for helper functions
create schema if not exists priv;
revoke all on schema priv from public;

-- Helper decrypt function to avoid exposing the key to clients
create or replace function priv.decrypt_text(cipher bytea)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
begin
  k := vault.get_secret('enc_key_v1');
  return pgp_sym_decrypt(cipher, k);
end $$;

grant usage on schema priv to authenticated, service_role;
grant execute on function priv.decrypt_text(bytea) to authenticated, service_role;

-- ==============================
-- chat_messages.message_text
-- ==============================
alter table if exists chat_messages
  add column if not exists message_text_enc bytea,
  alter column message_text drop not null;

create or replace function priv.encrypt_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.message_text is not null then
    new.message_text_enc := pgp_sym_encrypt(new.message_text, vault.get_secret('enc_key_v1'));
    new.message_text := null;
  end if;
  return new;
end $$;

drop trigger if exists chat_messages_encrypt on chat_messages;
create trigger chat_messages_encrypt
before insert or update of message_text on chat_messages
for each row execute function priv.encrypt_chat_message();

create or replace view chat_messages_secure as
select
  message_id,
  session_id,
  sent_at,
  priv.decrypt_text(message_text_enc) as message_text
from chat_messages;

grant select on chat_messages_secure to authenticated, service_role;

-- ==============================
-- inquiries.inquiry_message
-- ==============================
alter table if exists inquiries
  add column if not exists inquiry_message_enc bytea,
  alter column inquiry_message drop not null;

create or replace function priv.encrypt_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.inquiry_message is not null then
    new.inquiry_message_enc := pgp_sym_encrypt(new.inquiry_message, vault.get_secret('enc_key_v1'));
    new.inquiry_message := null;
  end if;
  return new;
end $$;

drop trigger if exists inquiries_encrypt on inquiries;
create trigger inquiries_encrypt
before insert or update of inquiry_message on inquiries
for each row execute function priv.encrypt_inquiry();

create or replace view inquiries_secure as
select
  inquiry_id,
  customer_id,
  inquiry_type,
  inquiry_status,
  resolution_comments,
  received_at,
  priv.decrypt_text(inquiry_message_enc) as inquiry_message
from inquiries;

grant select on inquiries_secure to authenticated, service_role;

-- Convenience view including customer name to minimize client joins
create or replace view inquiries_secure_with_customer as
select
  i.inquiry_id,
  i.customer_id,
  i.inquiry_type,
  i.inquiry_status,
  i.resolution_comments,
  i.received_at,
  priv.decrypt_text(i.inquiry_message_enc) as inquiry_message,
  c.first_name as customer_first_name,
  c.last_name as customer_last_name
from inquiries i
left join customer c on c.customer_id = i.customer_id;

grant select on inquiries_secure_with_customer to authenticated, service_role;




