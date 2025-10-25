-- Migration: Filter out ticket conversation sessions from user sessions
-- Description: Update api_get_user_sessions_v2() to exclude sessions with ticket_conversation=true
--              These are internal reply sessions that should only appear in Track Ticket history

-- Drop existing function first (needed to change return type)
drop function if exists public.api_get_user_sessions_v2();

-- Recreate the RPC function to exclude ticket conversation sessions
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

-- Re-grant permissions
grant execute on function public.api_get_user_sessions_v2() to authenticated, service_role;

comment on function public.api_get_user_sessions_v2() is 
'Returns customer chat sessions excluding ticket conversation reply sessions. Ticket reply sessions are internal and only appear within Track Ticket conversation history.';
