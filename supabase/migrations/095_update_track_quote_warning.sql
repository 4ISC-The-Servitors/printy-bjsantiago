-- Migration: Update track-quote warning to dynamic action-based message
-- Replace hardcoded show_quote_decision_prompt message node with action node
-- so valued customers see non-payment warning and regular see upfront-payment warning.

UPDATE chat_flows_v2
SET flow_definition = jsonb_set(
  flow_definition,
  '{nodes,show_quote_decision_prompt}',
  jsonb_build_object(
    'type', 'action',
    'action', 'show_quote_decision_prompt',
    'action_config', jsonb_build_object('conversation_id_key', 'session_id'),
    'options', COALESCE(
      flow_definition->'nodes'->'show_quote_decision_prompt'->'options',
      '[]'::jsonb
    )
  )
)
WHERE flow_id = 'track-quote'
  AND (flow_definition->'nodes'->'show_quote_decision_prompt'->>'type') IS NOT NULL;

-- Optional: Ensure node id exists before update (no error if missing)
-- The above WHERE clause ensures safe update only when node exists.


