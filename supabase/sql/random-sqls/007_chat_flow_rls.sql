-- RLS policies for chat flow foundation
-- Enable RLS
ALTER TABLE public.chat_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_flow_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_session_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_meta ENABLE ROW LEVEL SECURITY;

-- Content tables (read for authenticated users). Writes should be done by admins via separate admin policies or migrations.
DROP POLICY IF EXISTS "select flows" ON public.chat_flows;
CREATE POLICY "select flows" ON public.chat_flows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "select flow nodes" ON public.chat_flow_nodes;
CREATE POLICY "select flow nodes" ON public.chat_flow_nodes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "select flow options" ON public.chat_flow_options;
CREATE POLICY "select flow options" ON public.chat_flow_options
  FOR SELECT TO authenticated USING (true);

-- Session flow state: customer-scoped read/update
DROP POLICY IF EXISTS "select own session_flow" ON public.chat_session_flow;
CREATE POLICY "select own session_flow" ON public.chat_session_flow
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  );

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

DROP POLICY IF EXISTS "update own session_flow" ON public.chat_session_flow;
CREATE POLICY "update own session_flow" ON public.chat_session_flow
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  );

-- Message meta: customer-scoped read
DROP POLICY IF EXISTS "select own message_meta" ON public.chat_message_meta;
CREATE POLICY "select own message_meta" ON public.chat_message_meta
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      JOIN public.chat_sessions s ON s.session_id = m.session_id
      WHERE m.message_id = chat_message_meta.message_id
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


