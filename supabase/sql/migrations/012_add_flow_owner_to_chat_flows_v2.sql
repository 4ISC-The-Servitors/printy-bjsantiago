-- Add flow owner to chat_flows_v2
ALTER TABLE chat_flows_v2
ADD COLUMN IF NOT EXISTS flow_owner text CHECK (flow_owner IN ('customer','admin','guest')) DEFAULT 'customer';

-- Optional: backfill known flows by ID
-- Example: mark admin flows as 'admin'
UPDATE chat_flows_v2
SET flow_owner = 'admin'
WHERE flow_id IN ('admin-quote-propose');

-- Update rpc to return owner if you surface it in api_get_flow_definition (if using a composite)
-- Ensure any views or selects include the new column when needed.

