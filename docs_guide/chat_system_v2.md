## Chat System v2 — Simple Overview

Last Updated: 2025-10-17  
**Status**: ✅ Ask-Quote flow fully functional

### What “chat” is here (super simple)

- **Sessions**: a conversation thread → `chat_sessions_v2`
- **Messages**: each line in the conversation → `chat_messages_v2`
- **Flows**: the script Printy follows (Ask Quote, Issue Ticket, etc.) → `chat_flows_v2` (JSONB, in DB only)

### The core idea

- Each flow is one JSON document stored in the database (not in the repo).
- A flow engine reads that JSON, shows Printy’s messages, waits for user input, stores it, runs actions, and moves to the next step.

### Where things live in code

- **Flow definitions**
  - Stored in DB table `chat_flows_v2` (JSONB). The app does not import flow JSON files from the repo.
  - Note: `src/chatFlows/` is now legacy reference only (see below) and is ignored by Git.
- **Types**
  - Unified flow/session types: `@features/chat/types/flow.ts` (replaces `@chatFlows/types`)
- **Flow engine**
  - `src/features/chat/services/JsonbFlowProcessor.ts`
- **DB helpers/queries**
  - `src/features/chat/services/ChatDatabaseService.ts`
  - `src/features/chat/api/sessionQueries.ts`
- **UI/hooks**
  - Customer: `src/features/chat/hooks/customer/useCustomerConversations.ts`
  - Admin: `src/admin/hooks/useAdminChat.ts`, `src/admin/hooks/useAdminConversations.tsx`
  - Lists/recents: `src/admin/components/shared/recentChats/RecentChats.tsx`

### Repository policy for flow files (legacy-only)

- `src/chatFlows/` is kept as a LEGACY GUIDE for reference only:
  - Barrel files export nothing.
  - Directory is added to `.gitignore`.
  - No runtime code should import anything from `src/chatFlows/*`.
- All active flows must be created/updated in the `chat_flows_v2` database table.

### The three tables that matter

- `chat_flows_v2` (flow definitions, JSONB)
- `chat_sessions_v2` (one row per conversation; JSONB `metadata` holds `current_node_id` and `context`; FKs: `inquiry_id`, `quote_id`)
- `chat_messages_v2` (one row per message; `sender_role` = `customer` | `admin` | `printy`; `metadata.node_id`)

### Conversation lifecycle (end-to-end)

1. Start a flow → create session (`status='active'`, set `metadata.current_node_id`).
2. Printy sends first message → insert into `chat_messages_v2`.
3. User replies → insert message; if node collects input, store it in `metadata.context`.
4. Engine advances to next node, optionally runs an action (e.g., create inquiry/quote), then responds as Printy.
5. Repeat until `end` node → set session `status='ended'`.

### Common actions you have

- `create_quote_conversation`, `create_inquiry`, `upload_payment_proof`, `send_admin_reply`, `ai_summarize_specs`, etc.
- These are referenced by flow JSON (from DB) and executed during node transitions.

### Admin vs Customer

- **Customer**: starts flows (Ask Quote, Issue Ticket); messages saved with `sender_role='customer'`; Printy responds from the flow.
- **Admin**: opens sessions, can reply (role `admin`), sees quick replies; ended sessions are read-only.

### Start a flow (how-to)

```ts
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import { getFlowDefinition } from '@features/chat/api/jsonbChatFlowApi';

const flowDefinition = await getFlowDefinition('ask-quote');
const { sessionId, messages } = await JsonbFlowProcessor.startFlow({
  flowId: 'ask-quote',
  customerId,
  flowDefinition,
  initialContext: {
    /* optional: inquiry_id, quote_id, order_id, etc. */
  },
});

// Later, when user types:
await JsonbFlowProcessor.processInput({
  sessionId,
  userInput: 'I need 100 business cards...',
  flowDefinition,
});
```

### Query sessions/messages (canonical)

```ts
// Sessions with related inquiry/quote
const { data } = await supabase
  .from('chat_sessions_v2')
  .select(`
    session_id, flow_id, status, created_at, metadata,
    inquiry:inquiries!inquiry_id(inquiry_id, display_id, inquiry_status),
    quote:quotes!quote_id(quote_id, display_id, status, total_price)
  `)
  .eq('customer_id', userId)
  .order('created_at', { ascending: false });

// Messages in a session
await supabase
  .from('chat_messages_v2')
  .select('message_id, sender_role, message_text_enc, sent_at, metadata')
  .eq('session_id', sessionId)
  .order('sent_at', { ascending: true });

### Guardrails (do this, not that)
- Use only `chat_sessions_v2`, `chat_messages_v2`, `chat_flows_v2`.
- Do not import anything from `src/chatFlows/*` (legacy-only; ignored by Git).
- Don’t rely on `updated_at` in sessions; use `created_at` or last message `sent_at`.
- Prefer `sessionQueries.ts` and service helpers over any legacy APIs.
- Type imports must come from `@features/chat/types` (not `@chatFlows/types`).

### Recent changes (what we just did)
- Marked `src/chatFlows/` as legacy-only; added to `.gitignore`.
- Replaced all type imports from `@chatFlows/types` → `@features/chat/types`.
- Added unified flow/session types to `src/features/chat/types/flow.ts`.
- Ensured no runtime code references files under `src/chatFlows/*`.
- **✅ FIXED: Ask-Quote flow now fully functional** (2025-10-17)
  - Fixed foreign key constraint issue in `createQuoteConversation` action
  - Temporarily disabled encryption to resolve pgcrypto dependency issues
  - Updated RPC functions to work without Supabase Vault extension
  - Flow now successfully creates quotes with display IDs (QOT-XXXXXX)

### Troubleshooting (common issues)
- **"function pgp_sym_decrypt does not exist"**: Encryption functions not available. Use plain text storage temporarily.
- **"foreign key constraint violates"**: Always create records before setting foreign key references.
- **"vault.get_secret does not exist"**: Supabase Vault not available. Use `priv.get_vault_secret()` wrapper.
- **"session not found"**: Check if session exists and user has proper permissions.
- **Flow not advancing**: Check if action handlers are properly registered in `actionHandlers` registry.

### Read more
- `docs_guide/CHAT_SYSTEM_V2_DEV_GUIDE.md` — quick reference + queries
- `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md` — JSON flow format + execution details
- `src/features/chat/services/JsonbFlowProcessor.ts` — the engine
- `src/features/chat/api/sessionQueries.ts` — unified query helpers
```
