-- Grants to expose chat tables to PostgREST (Supabase) for the authenticated role
-- This file is safe to run multiple times.

-- Ensure roles can see the public schema
grant usage on schema public to anon, authenticated;

-- Core chat tables
grant select, insert, update on table public.chat_sessions to authenticated;
grant select, insert, update on table public.chat_session_flow to authenticated;
grant select, insert, update on table public.chat_messages to authenticated;
grant select, insert on table public.chat_message_meta to authenticated;

-- Flow catalogs
grant select on table public.chat_flows to authenticated;
grant select on table public.chat_flow_nodes to authenticated;
grant select on table public.chat_flow_options to authenticated;

-- Inquiry tables (ticketing)
grant select, insert, update on table public.inquiries to authenticated;
grant select on table public.inquiries_duplicate to authenticated;

-- Secure views (created by 020/021 migrations) – redundant grants are okay
grant select on table public.chat_messages_secure to authenticated;
grant select on table public.inquiries_secure to authenticated;
grant select on table public.inquiries_secure_with_customer to authenticated;

-- Optional: allow anonymous read of flows to render menus before auth
grant select on table public.chat_flows to anon;
grant select on table public.chat_flow_nodes to anon;
grant select on table public.chat_flow_options to anon;


