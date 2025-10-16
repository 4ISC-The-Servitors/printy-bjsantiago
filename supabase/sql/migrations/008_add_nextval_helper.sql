-- Helper function to get next value from a sequence
-- This allows frontend to generate display IDs without creating separate sessions

CREATE OR REPLACE FUNCTION public.get_next_sequence_value(sequence_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN nextval(sequence_name::regclass);
END;
$$;

COMMENT ON FUNCTION get_next_sequence_value IS 'Helper to get next value from a sequence (e.g., quote_display_seq)';

