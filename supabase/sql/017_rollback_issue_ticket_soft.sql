-- Soft rollback for Issue Ticket flow
-- Removes seeded data and resets node action fields without altering table structure

BEGIN;

-- 1) Reset node_action and action_config on nodes we touched
UPDATE public.chat_flow_nodes
SET node_action = 'none',
    action_config = '{}'::jsonb
WHERE flow_id = 'issue-ticket';

-- 2) Delete options belonging to the flow
DELETE FROM public.chat_flow_options
WHERE flow_id = 'issue-ticket';

-- 3) Delete nodes of the flow
DELETE FROM public.chat_flow_nodes
WHERE flow_id = 'issue-ticket';

-- 4) Delete the flow record
DELETE FROM public.chat_flows
WHERE flow_id = 'issue-ticket';

COMMIT;


