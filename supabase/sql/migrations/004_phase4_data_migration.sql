-- Migration: Phase 4 - Data migration from quote_conversations/quote_messages to chat_sessions_v2/chat_messages_v2
-- Purpose: Migrate existing quote data to the unified chat tables

-- IMPORTANT: Review and test this migration on a staging environment first!
-- This migration will:
-- 1. Create chat_sessions_v2 records for each quote_conversations record
-- 2. Migrate quote_messages to chat_messages_v2 with encryption
-- 3. Backfill foreign keys in quote_specs, quote_proposals, quote_orders

-- ============================================================================
-- Step 1: Create a mapping table to track old conversation_id -> new session_id
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_migration_map (
  old_conversation_id uuid PRIMARY KEY,
  new_session_id uuid NOT NULL,
  migrated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE quote_migration_map IS 'Temporary mapping table for quote migration from quote_conversations to chat_sessions_v2';

-- ============================================================================
-- Step 2: Migrate quote_conversations to chat_sessions_v2
-- ============================================================================
DO $$
DECLARE
  rec RECORD;
  v_session_id UUID;
BEGIN
  FOR rec IN 
    SELECT 
      conversation_id,
      customer_id,
      quote_id,
      status,
      created_at,
      updated_at,
      ended_at,
      display_id
    FROM quote_conversations
    WHERE conversation_id NOT IN (SELECT old_conversation_id FROM quote_migration_map)
  LOOP
    -- Insert into chat_sessions_v2
    INSERT INTO chat_sessions_v2 (
      customer_id,
      flow_id,
      status,
      created_at,
      ended_at,
      metadata
    )
    VALUES (
      rec.customer_id,
      'ask-quote',
      CASE 
        WHEN rec.status = 'ended' THEN 'ended'
        ELSE 'active'
      END,
      rec.created_at,
      rec.ended_at,
      jsonb_build_object(
        'quote', jsonb_build_object(
          'display_id', rec.display_id,
          'quote_id', rec.quote_id,
          'status', rec.status,
          'created_at', rec.created_at,
          'updated_at', rec.updated_at,
          'migrated_from_conversation_id', rec.conversation_id
        )
      )
    )
    RETURNING session_id INTO v_session_id;

    -- Record mapping
    INSERT INTO quote_migration_map (old_conversation_id, new_session_id)
    VALUES (rec.conversation_id, v_session_id);

    RAISE NOTICE 'Migrated conversation % to session %', rec.conversation_id, v_session_id;
  END LOOP;
END $$;

-- ============================================================================
-- Step 3: Migrate quote_messages to chat_messages_v2
-- ============================================================================
DO $$
DECLARE
  rec RECORD;
  v_session_id UUID;
  v_key TEXT;
  v_message_id UUID;
BEGIN
  -- Get encryption key
  v_key := current_setting('app.encryption_key', true);
  IF v_key IS NULL THEN
    v_key := 'default-encryption-key-change-in-production';
  END IF;

  FOR rec IN 
    SELECT 
      qm.message_id,
      qm.conversation_id,
      qm.sender_id,
      qm.sender_role,
      qm.message_text,
      qm.message_type,
      qm.metadata,
      qm.sent_at,
      qmm.new_session_id
    FROM quote_messages qm
    INNER JOIN quote_migration_map qmm ON qm.conversation_id = qmm.old_conversation_id
    WHERE NOT EXISTS (
      SELECT 1 FROM chat_messages_v2 cm 
      WHERE cm.metadata->>'migrated_from_quote_message_id' = qm.message_id::text
    )
  LOOP
    -- Insert into chat_messages_v2 with encryption
    INSERT INTO chat_messages_v2 (
      session_id,
      sender_role,
      message_text_enc,
      sent_at,
      metadata
    )
    VALUES (
      rec.new_session_id,
      rec.sender_role,
      pgp_sym_encrypt(rec.message_text, v_key),
      rec.sent_at,
      rec.metadata || jsonb_build_object(
        'quote', jsonb_build_object('type', rec.message_type),
        'migrated_from_quote_message_id', rec.message_id
      )
    )
    RETURNING message_id INTO v_message_id;

    RAISE NOTICE 'Migrated message % to %', rec.message_id, v_message_id;
  END LOOP;
END $$;

-- ============================================================================
-- Step 4: Backfill foreign keys in quote_specs
-- ============================================================================
UPDATE quote_specs qs
SET 
  session_id = qmm.new_session_id,
  trigger_message_id_v2 = (
    SELECT cm.message_id 
    FROM chat_messages_v2 cm
    WHERE cm.metadata->>'migrated_from_quote_message_id' = qs.trigger_message_id::text
    LIMIT 1
  )
FROM quote_migration_map qmm
WHERE qs.conversation_id = qmm.old_conversation_id
  AND qs.session_id IS NULL;

-- ============================================================================
-- Step 5: Backfill foreign keys in quote_proposals
-- ============================================================================
UPDATE quote_proposals qp
SET session_id = qmm.new_session_id
FROM quote_migration_map qmm
WHERE qp.conversation_id = qmm.old_conversation_id
  AND qp.session_id IS NULL;

-- ============================================================================
-- Step 6: Backfill foreign keys in quote_orders
-- ============================================================================
UPDATE quote_orders qo
SET session_id = qmm.new_session_id
FROM quote_migration_map qmm
WHERE qo.conversation_id = qmm.old_conversation_id
  AND qo.session_id IS NULL;

-- ============================================================================
-- Step 7: Verify migration
-- ============================================================================
DO $$
DECLARE
  v_conversation_count INT;
  v_session_count INT;
  v_message_count INT;
  v_chat_message_count INT;
BEGIN
  SELECT COUNT(*) INTO v_conversation_count FROM quote_conversations;
  SELECT COUNT(*) INTO v_session_count FROM quote_migration_map;
  SELECT COUNT(*) INTO v_message_count FROM quote_messages;
  SELECT COUNT(*) INTO v_chat_message_count 
  FROM chat_messages_v2 
  WHERE metadata->>'migrated_from_quote_message_id' IS NOT NULL;

  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Total quote_conversations: %', v_conversation_count;
  RAISE NOTICE 'Migrated to chat_sessions_v2: %', v_session_count;
  RAISE NOTICE 'Total quote_messages: %', v_message_count;
  RAISE NOTICE 'Migrated to chat_messages_v2: %', v_chat_message_count;
  
  IF v_conversation_count = v_session_count AND v_message_count = v_chat_message_count THEN
    RAISE NOTICE 'Migration completed successfully!';
  ELSE
    RAISE WARNING 'Migration counts do not match. Please review.';
  END IF;
END $$;

