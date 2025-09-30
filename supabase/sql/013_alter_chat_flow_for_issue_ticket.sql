-- Alter existing chat flow tables to support Issue Ticket without new tables

-- 1) Add action fields to nodes
ALTER TABLE public.chat_flow_nodes
  ADD COLUMN IF NOT EXISTS node_action text
    CHECK (node_action IN (
      'none',                -- default no-op
      'expects_input',       -- free-text input node; store under input_key
      'set_context',         -- set key/values into session context
      'lookup_order',        -- verify order ownership and load summary
      'list_recent_orders',  -- show last N orders for the user
      'create_inquiry',      -- insert into inquiries from context
      'ticket_status_query'  -- fetch inquiry by id
    ))
    DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS action_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Add per-session context JSON to session_flow
ALTER TABLE public.chat_session_flow
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();


