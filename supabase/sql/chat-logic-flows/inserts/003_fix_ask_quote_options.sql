-- Fix: Remove the "Submit Quote Request" option from ask_quote_intro
-- This option should not exist because the flow expects free-text input
-- The user should type their description and click Send, not use a quick reply button

DELETE FROM public.chat_flow_options
WHERE flow_id = 'ask-quote'
  AND from_node_id = 'ask_quote_intro'
  AND label = 'Submit Quote Request';

-- Verify: Only the "End Chat" option from create_quote_node should remain
-- SELECT * FROM chat_flow_options WHERE flow_id = 'ask-quote';

