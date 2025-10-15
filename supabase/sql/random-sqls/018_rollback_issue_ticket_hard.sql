-- Hard rollback for Issue Ticket flow
-- Includes the soft rollback plus removal of added columns

BEGIN;

-- 0) Ensure seeded data is removed first (idempotent if already removed)
-- Reset node_action/action_config then delete flow graph
UPDATE public.chat_flow_nodes
SET node_action = NULL,
    action_config = '{}'::jsonb
WHERE flow_id = 'issue-ticket';

DELETE FROM public.chat_flow_options WHERE flow_id = 'issue-ticket';
DELETE FROM public.chat_flow_nodes WHERE flow_id = 'issue-ticket';
DELETE FROM public.chat_flows WHERE flow_id = 'issue-ticket';

-- 1) Drop columns from chat_flow_nodes if safe
ALTER TABLE public.chat_flow_nodes
  DROP COLUMN IF EXISTS action_config,
  DROP COLUMN IF EXISTS node_action;

-- 2) Drop columns from chat_session_flow if safe
ALTER TABLE public.chat_session_flow
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS context;

COMMIT;


