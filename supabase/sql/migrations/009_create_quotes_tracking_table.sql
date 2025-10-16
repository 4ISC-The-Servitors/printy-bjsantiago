-- Create quotes tracking table (mirrors quote_conversations structure but uses session_id)
-- This stores quote requests for admin management, similar to old quote_conversations

CREATE TABLE IF NOT EXISTS public.quotes (
  quote_id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  session_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone NULL,
  display_id character varying(20) NULL UNIQUE,
  
  CONSTRAINT quotes_pkey PRIMARY KEY (quote_id),
  CONSTRAINT quotes_display_id_key UNIQUE (display_id),
  CONSTRAINT quotes_customer_id_fkey FOREIGN KEY (customer_id) 
    REFERENCES customer(customer_id) ON DELETE CASCADE,
  CONSTRAINT quotes_session_id_fkey FOREIGN KEY (session_id) 
    REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE,
  CONSTRAINT quotes_status_check CHECK (
    status = ANY (ARRAY[
      'active'::text,
      'spec_proposed'::text,
      'accepted'::text,
      'rejected'::text,
      'ended'::text
    ])
  )
) TABLESPACE pg_default;

-- Indexes (matching quote_conversations pattern)
CREATE INDEX IF NOT EXISTS idx_quotes_display_id ON public.quotes USING btree (display_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes USING btree (customer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_quote_id ON public.quotes USING btree (quote_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_session_id ON public.quotes USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes USING btree (created_at DESC) TABLESPACE pg_default;

-- Updated timestamp trigger
CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON quotes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE quotes IS 'Quote requests tracking table (uses chat_sessions_v2 instead of separate conversations)';
COMMENT ON COLUMN quotes.session_id IS 'References the chat session where quote was created';
COMMENT ON COLUMN quotes.display_id IS 'Human-readable quote ID (e.g., QOT-300026)';
COMMENT ON COLUMN quotes.status IS 'Quote status (active, spec_proposed, accepted, rejected, ended)';

