-- Shared Chat Flow Schema (foundational, reusable for all flows)
-- This migration only creates new tables and indexes. It does not modify existing tables.

-- 1) Flow catalog
CREATE TABLE IF NOT EXISTS public.chat_flows (
  flow_id text PRIMARY KEY,
  title text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

-- 2) Flow nodes (states)
CREATE TABLE IF NOT EXISTS public.chat_flow_nodes (
  node_id text PRIMARY KEY,
  flow_id text NOT NULL REFERENCES public.chat_flows(flow_id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (node_type IN ('start','message','end')),
  text text NOT NULL,
  is_initial boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_chat_flow_nodes_flow ON public.chat_flow_nodes(flow_id);

-- 3) Flow options (quick replies / edges)
CREATE TABLE IF NOT EXISTS public.chat_flow_options (
  option_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id text NOT NULL REFERENCES public.chat_flows(flow_id) ON DELETE CASCADE,
  from_node_id text NOT NULL REFERENCES public.chat_flow_nodes(node_id) ON DELETE CASCADE,
  label text NOT NULL,
  to_node_id text NOT NULL REFERENCES public.chat_flow_nodes(node_id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chat_flow_options_from ON public.chat_flow_options(from_node_id);
CREATE INDEX IF NOT EXISTS idx_chat_flow_options_flow ON public.chat_flow_options(flow_id);

-- 4) Per-session flow state (links existing chat_sessions to a flow + current node)
CREATE TABLE IF NOT EXISTS public.chat_session_flow (
  session_id uuid PRIMARY KEY REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE,
  flow_id text NOT NULL REFERENCES public.chat_flows(flow_id) ON DELETE RESTRICT,
  current_node_id text NOT NULL REFERENCES public.chat_flow_nodes(node_id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_chat_session_flow_flow ON public.chat_session_flow(flow_id);

-- 5) Message metadata (role and originating node for bot messages)
CREATE TABLE IF NOT EXISTS public.chat_message_meta (
  message_id uuid PRIMARY KEY REFERENCES public.chat_messages(message_id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user','printy')),
  node_id text REFERENCES public.chat_flow_nodes(node_id)
);


