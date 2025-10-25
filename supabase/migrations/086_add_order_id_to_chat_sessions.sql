-- Add order_id foreign key column to chat_sessions_v2 for consistency with quote_id and inquiry_id
ALTER TABLE chat_sessions_v2 
ADD COLUMN order_id uuid REFERENCES orders(order_id);

-- Create index for performance
CREATE INDEX idx_chat_sessions_v2_order_id ON chat_sessions_v2(order_id);

-- Add comment
COMMENT ON COLUMN chat_sessions_v2.order_id IS 
  'Links chat session to order for pay-order and reupload-payment flows';
