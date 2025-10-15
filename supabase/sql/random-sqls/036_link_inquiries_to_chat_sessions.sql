-- Add inquiry_id column to chat_sessions to link tickets to conversations
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS inquiry_id uuid REFERENCES public.inquiries(inquiry_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_inquiry ON public.chat_sessions(inquiry_id);

-- Add helper function to get or create chat session for an inquiry
CREATE OR REPLACE FUNCTION api_get_or_create_inquiry_session(p_inquiry_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_customer_id uuid;
BEGIN
  -- Get customer_id from inquiry
  SELECT customer_id INTO v_customer_id 
  FROM inquiries 
  WHERE inquiry_id = p_inquiry_id;
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Inquiry not found';
  END IF;
  
  -- Check if session already exists for this inquiry
  SELECT session_id INTO v_session_id
  FROM chat_sessions
  WHERE inquiry_id = p_inquiry_id
  LIMIT 1;
  
  -- Create new session if none exists
  IF v_session_id IS NULL THEN
    INSERT INTO chat_sessions (customer_id, inquiry_id, status)
    VALUES (v_customer_id, p_inquiry_id, 'active')
    RETURNING session_id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END $$;

GRANT EXECUTE ON FUNCTION api_get_or_create_inquiry_session(uuid) TO authenticated, service_role;
