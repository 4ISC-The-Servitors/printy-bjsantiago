# Migration Plan: Unifying quote_* Tables with chat_sessions_v2 & chat_messages_v2

## Overview

The existing database structure supports two parallel stacks:
- **Chat Stack**: `chat_sessions_v2`, `chat_messages_v2` (with RPCs such as `api_create_chat_session`, `api_insert_chat_message_v2`, `api_fetch_chat_messages_v2`, etc.)
- **Quote Stack**: `quote_conversations`, `quote_messages` (with RPCs such as `create_quote_conversation`, `add_quote_message`)

Currently, the "Ask Quote" flow initiates a quote in the quote stack, then attempts to synchronize state back into the chat stack, resulting in complexity and error-prone state management.

The following plan outlines the migration steps to unify all quote-related conversations and messages under `chat_sessions_v2` and `chat_messages_v2`, deprecating `quote_conversations` and `quote_messages`.

---

## Migration Todos (Pre-Implementation Checklist)

- [ ] Reroute the RPC `create_quote_conversation` to create a `chat_sessions_v2` session and store the `quote_display_id` in the session's `metadata`
- [ ] Reroute the RPC `add_quote_message` to insert into `chat_messages_v2`, with the message type in `metadata.quote_message_type`
- [ ] Update all foreign keys:
    - `quote_specs.conversation_id` → `chat_sessions_v2.session_id`
    - `quote_proposals.conversation_id` → `chat_sessions_v2.session_id`
    - `quote_orders.conversation_id` → `chat_sessions_v2.session_id`
    - `quote_specs.trigger_message_id` → `chat_messages_v2.message_id`
- [ ] Add indexes on `chat_sessions_v2` for:
    - `metadata->>'quote_display_id'`
    - `metadata->>'quote_status'`
- [ ] Update the frontend action (`createQuoteConversation.ts`) to read `display_id` from `chat_sessions_v2.metadata` and stop fetching from `quote_conversations`
- [ ] Replace all `quote_messages` reads with `chat_messages_v2` (e.g., via a new RPC `get_quote_messages_v2`)
- [ ] (Optional) Create temporary compatibility views or RPC shims for `quote_conversations` and `quote_messages`
- [ ] Plan and execute a one-time data migration from `quote_messages` to `chat_messages_v2`, relinking all conversations to the new sessions
- [ ] End-to-end test of the "Ask Quote" flow to verify node transitions and correct data storage

---

## Detailed Migration Phases

### Phase 0 — Safety and Scope

- Retain the tables encoding the quote lifecycle (`quote_specs`, `quote_proposals`, `quote_orders`)
- Only deprecate `quote_conversations` and `quote_messages`
- Add compatibility shims so that existing UI and code remain operational during migration

### Phase 1 — Schema Adjustments (Additive, Non-Breaking Changes)

- Extend `chat_sessions_v2.metadata` to include and standardize:
  - `metadata.quote: { display_id, status, spec_id?, proposal_id? }`
- Create indexes for easier discovery:
  - GIN index on `metadata`
  - B-tree index on `(metadata->'quote'->>'display_id')`
  - B-tree index on `(metadata->'quote'->>'status')`
- Ensure `chat_messages_v2.metadata` can store message types:
  - `metadata.quote: { type: 'chat' | 'spec_summary' | 'spec_proposal' | 'system' }`
- Optionally, add a generated column for fast lookups by display ID

### Phase 2 — RPC Shims to v2 Tables

- Reimplement `create_quote_conversation`:
    - Create a `chat_sessions_v2` row (with `flow_id='ask-quote'`, `customer_id`)
    - Generate and store `display_id` and `status` in `metadata.quote`
    - Return the new `session_id` (not a separate `conversation_id`)
- Reimplement `add_quote_message`:
    - Insert into `chat_messages_v2` with correct `sender_role`, encrypted `message_text_enc`, and `metadata.quote.type`
- Provide a read RPC `get_quote_messages_v2(session_id)` to fetch (decrypted) messages for any quote session

### Phase 3 — DDL Updates to Quote Tables

- Update foreign keys so that quote tables point to unified session/message IDs:
    - `quote_specs.conversation_id` → `chat_sessions_v2.session_id`
    - `quote_proposals.conversation_id` → `chat_sessions_v2.session_id`
    - `quote_orders.conversation_id` → `chat_sessions_v2.session_id`
    - `quote_specs.trigger_message_id` → `chat_messages_v2.message_id`
- Add new foreign keys and backfill data before dropping the old keys

### Phase 4 — Data Migration

- For each row in `quote_conversations`:
    - Create or identify a corresponding `chat_sessions_v2` session for the customer (with `flow_id='ask-quote'`)
    - Migrate over timestamps, copying `display_id` and status to `metadata.quote`
- For each row in `quote_messages`:
    - Insert into `chat_messages_v2` (mapping sender roles and message types, encrypting text as needed)
- Backfill foreign keys in `quote_specs`, `quote_proposals`, and `quote_orders` to point to the new session/message IDs

### Phase 5 — Frontend Updates

- `createQuoteConversation.ts`:
    - Stop querying `quote_conversations`
    - Retrieve `display_id` from `chat_sessions_v2.metadata.quote.display_id`
    - Store only `session_id` in session metadata; remove usage of `quote_conversation_id`
- Update all reads/writes to use the new v2 RPCs or select directly from `chat_messages_v2`

### Phase 6 — Cutover and Cleanup

- After thorough verification:
    - Drop compatibility views and RPCs
    - Finally drop `quote_conversations` and `quote_messages` tables

---

## Notes on Encryption & RPCs

- Reuse `api_insert_chat_message_v2` for all message inserts to ensure encryption is applied consistently
- If the RPC requires plaintext input and handles the encryption internally, wrap `add_quote_message` so it calls the v2 RPC with the correct metadata

---
