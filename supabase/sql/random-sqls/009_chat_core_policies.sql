-- RLS policies for existing core chat tables to allow customer-owned access

-- Ensure RLS is enabled
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_sessions policies
DROP POLICY IF EXISTS "select own sessions" ON public.chat_sessions;
CREATE POLICY "select own sessions" ON public.chat_sessions
  FOR SELECT TO authenticated USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "insert own sessions" ON public.chat_sessions;
CREATE POLICY "insert own sessions" ON public.chat_sessions
  FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "update own sessions" ON public.chat_sessions;
CREATE POLICY "update own sessions" ON public.chat_sessions
  FOR UPDATE TO authenticated USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- Admin policies for chat_sessions
DROP POLICY IF EXISTS "admin can modify all" ON public.chat_sessions;
CREATE POLICY "admin can modify all" ON public.chat_sessions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- chat_messages policies (scoped via session ownership)
DROP POLICY IF EXISTS "select own messages" ON public.chat_messages;
CREATE POLICY "select own messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert own messages" ON public.chat_messages;
CREATE POLICY "insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update own messages" ON public.chat_messages;
CREATE POLICY "update own messages" ON public.chat_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  );

-- Admin policies for chat_messages
DROP POLICY IF EXISTS "admin all chat_messages" ON public.chat_messages;
CREATE POLICY "admin all chat_messages" ON public.chat_messages
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.raw_app_meta_data->>'role' = 'admin'
    )
  );


