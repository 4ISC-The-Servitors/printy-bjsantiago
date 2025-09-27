-- Additional INSERT policies to allow customers to create session flow rows and message meta

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.chat_session_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_meta ENABLE ROW LEVEL SECURITY;

-- Allow INSERT of own session_flow row
DROP POLICY IF EXISTS "insert own session_flow" ON public.chat_session_flow;
CREATE POLICY "insert own session_flow" ON public.chat_session_flow
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  );

-- Allow INSERT of own message_meta row
DROP POLICY IF EXISTS "insert own message_meta" ON public.chat_message_meta;
CREATE POLICY "insert own message_meta" ON public.chat_message_meta
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_sessions s ON s.session_id = m.session_id
      WHERE m.message_id = chat_message_meta.message_id
        AND s.customer_id = auth.uid()
    )
  );


