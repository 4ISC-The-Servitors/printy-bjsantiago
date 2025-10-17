## Chat System v2 — Simple Overview

Last Updated: 2025-10-17  
**Status**: ✅ Ask-Quote flow fully functional, ✅ Admin chat history & sessioning complete

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

- **Customer**: starts flows (Ask Quote, Issue Ticket); messages saved with `sender_role='customer'`; Printy responds from the flow; can view historical conversations in sidebar.
- **Admin**: opens sessions, can reply (role `admin`), sees quick replies; can view historical conversations in "All Chats" page; ended sessions are read-only with proper overlay.

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
    quote:quotes!quote_id(quote_id, display_id, status)
  `)
  .eq('customer_id', userId)
  .order('created_at', { ascending: false });

// Messages in a session
await supabase
  .from('chat_messages_v2')
  .select('message_id, sender_role, message_text_enc, sent_at, metadata')
  .eq('session_id', sessionId)
  .order('sent_at', { ascending: true });

```

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
- **✅ COMPLETED: Admin chat history & sessioning** (2025-10-17)
  - Fixed PostgREST query syntax error in admin conversations loading
  - Implemented historical chat viewing for admins (mimics customer experience)
  - Added read-only overlay for admin chat dock when viewing ended conversations
  - Removed redundant `useAdminRecentChatSessions` hook (admin uses "All Chats" page instead of sidebar)
  - Admin can now click on ended conversations to view complete chat history
  - Messages load from database using same API as customer historical chats
- **✅ COMPLETED: Admin quote proposal flow & manual specs** (2025-10-17)
  - Fixed admin quote proposal flow to properly show options and execute actions
  - Renamed `openSpecEditor.ts` → `manualOrderSpecs.ts` for clarity
  - Fixed option matching logic in JsonbFlowProcessor to handle both label and value matching
  - Removed duplicate messages from `dynamicChooseAction` and flow definition
  - Fixed action message persistence - action messages now properly saved to chat_messages_v2
  - Removed redundant `sent_confirmation` node since action provides the message
  - Admin can now click "Manual Order Specs" to open empty spec editor form

### Admin Quote Propose UX updates (2025-10-17)
- Removed non-existent `quotes.total_price` from admin sessions query
- Unified timestamps: customer quote card now uses `quotes.updated_at` for "Updated"
- Fixed admin chat crash: correct `setCurrentContext` state setter usage
- Added saved-spec detection on admin chat open for a quote session
  - When a saved draft exists, Printy posts a reminder:
    - "You have drafted an order specs for this quote request. What do you want to do?"
  - Quick replies shown in this case:
    - Edit Specs → opens Spec Editor prefilled with latest saved spec
    - Send Specs to Customer → validates and sends latest spec as proposal
    - End Chat
- Kept Edit Specs persistently available after saving a draft (no "Create New Specs" option to avoid confusion)
- New admin actions registered:
  - `edit_saved_specs` — loads latest spec by `session_id` and opens Spec Editor
  - `send_quote_proposal` — sends latest saved spec and updates quote to `spec_proposed`

Notes:
- `quote_specs` links via `session_id` (no `quote_id` FK); admin chat passes the customer's quote `session_id` in context.

### Troubleshooting (common issues)
- **"function pgp_sym_decrypt does not exist"**: Encryption functions not available. Use plain text storage temporarily.
- **"foreign key constraint violates"**: Always create records before setting foreign key references.
- **"vault.get_secret does not exist"**: Supabase Vault not available. Use `priv.get_vault_secret()` wrapper.
- **"session not found"**: Check if session exists and user has proper permissions.
- **Flow not advancing**: Check if action handlers are properly registered in `actionHandlers` registry.
- **PostgREST query syntax error**: Use correct syntax for null checks: `inquiry_id.not.is.null` not `inquiry_id.is.not.null`.
- **Duplicate messages in flow**: Check for multiple nodes showing messages - remove options from action nodes or messages from dynamic actions.
- **Quick replies not working**: Ensure option matching logic handles both `label` and `value` properties.
- **Action messages not persisting**: Action messages must be saved to database via `insertMessage()` in JsonbFlowProcessor.

### Debugging Process (Admin Quote Proposal Flow)
**Problem**: "Manual Order Specs" button not opening spec editor form.

**Debugging Steps**:
1. **Console Error Analysis**: Found PostgREST syntax error in admin conversations loading
   - Fixed: `inquiry_id.is.not.null` → `inquiry_id.not.is.null`

2. **Flow Definition Issues**: 
   - Issue: `manual_specs` node was message-only, not action node
   - Fix: Updated database to use `manual_order_specs` action

3. **Action Registration**: 
   - Issue: Action handler not registered correctly
   - Fix: Renamed file and updated action registry from `open_spec_editor` → `manual_order_specs`

4. **Option Matching Logic**:
   - Issue: JsonbFlowProcessor only matched by label, not value
   - Fix: Enhanced matching to handle both `opt.label` and `opt.value`

5. **Duplicate Messages**:
   - Issue: Both `choose_action` and `conditional_options` showing messages
   - Fix: Removed message from `dynamicChooseAction` function and `choose_action` node

6. **Message Persistence**:
   - Issue: Action messages not saved to database, lost on backtrack
   - Fix: Added database save loop for action messages in JsonbFlowProcessor

**Final Solution**: Simplified flow with hardcoded options and proper action execution.

### Read more
- `docs_guide/CHAT_SYSTEM_V2_DEV_GUIDE.md` — quick reference + queries
- `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md` — JSON flow format + execution details
- `src/features/chat/services/JsonbFlowProcessor.ts` — the engine
- `src/features/chat/api/sessionQueries.ts` — unified query helpers
 
