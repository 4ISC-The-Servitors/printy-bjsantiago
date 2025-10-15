-- chat_flows
CREATE POLICY "select flows" ON public.chat_flows
  FOR SELECT
  TO authenticated
  USING (true);

-- chat_flow_options
CREATE POLICY "select flow options" ON public.chat_flow_options
  FOR SELECT
  TO authenticated
  USING (true);

-- chat_flow_nodes
CREATE POLICY "select flow nodes" ON public.chat_flow_nodes
  FOR SELECT
  TO authenticated
  USING (true);

-- chat_sessions
CREATE POLICY "Admins can view all chat sessions" ON public.chat_sessions
  FOR SELECT
  TO PUBLIC
  USING (is_admin());

CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = customer_id) AND (NOT is_admin()));

CREATE POLICY "insert own sessions" ON public.chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "select own sessions" ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "update own sessions" ON public.chat_sessions
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- chat_messages
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.session_id = chat_messages.session_id
        AND is_admin()
    )
  );

CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.session_id = chat_messages.session_id
        AND cs.customer_id = auth.uid()
        AND NOT is_admin()
    )
  );

CREATE POLICY "insert own messages" ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  );

CREATE POLICY "select own messages" ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  );

CREATE POLICY "update own messages" ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_messages.session_id
        AND s.customer_id = auth.uid()
    )
  );

-- Optional dev policy in your DB: allow anon to insert (dev only)
CREATE POLICY "Allow inserts for anon (dev only)" ON public.chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- chat_session_flow
CREATE POLICY "Admins can view all chat session flows" ON public.chat_session_flow
  FOR SELECT
  TO PUBLIC
  USING (is_admin());

CREATE POLICY "Users can view own chat session flows" ON public.chat_session_flow
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.session_id = chat_session_flow.session_id
        AND cs.customer_id = auth.uid()
        AND NOT is_admin()
    )
  );

CREATE POLICY "insert own session_flow" ON public.chat_session_flow
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  );

CREATE POLICY "select own session_flow" ON public.chat_session_flow
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  );

CREATE POLICY "update own session_flow" ON public.chat_session_flow
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.session_id = chat_session_flow.session_id
        AND s.customer_id = auth.uid()
    )
  );

-- chat_message_meta
CREATE POLICY "Admins can view all chat message meta" ON public.chat_message_meta
  FOR SELECT
  TO PUBLIC
  USING (is_admin());

CREATE POLICY "Users can view own chat message meta" ON public.chat_message_meta
  FOR SELECT
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_messages cm
      JOIN public.chat_sessions cs ON cs.session_id = cm.session_id
      WHERE cm.message_id = chat_message_meta.message_id
        AND cs.customer_id = auth.uid()
        AND NOT is_admin()
    )
  );

CREATE POLICY "insert own message_meta" ON public.chat_message_meta
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_messages m
      JOIN public.chat_sessions s ON s.session_id = m.session_id
      WHERE m.message_id = chat_message_meta.message_id
        AND s.customer_id = auth.uid()
    )
  );

CREATE POLICY "select own message_meta" ON public.chat_message_meta
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_messages m
      JOIN public.chat_sessions s ON s.session_id = m.session_id
      WHERE m.message_id = chat_message_meta.message_id
        AND s.customer_id = auth.uid()
    )
  );