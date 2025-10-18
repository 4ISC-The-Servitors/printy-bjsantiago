## Chat System v2 — Simple Overview

Last Updated: 2025-10-18
**Status**: ✅ Ask-Quote flow fully functional, ✅ Admin chat history & sessioning complete, ✅ Track-Quote flow fully functional, ✅ Admin-create-order flow fully functional (end-to-end)

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

- `create_quote_conversation`, `create_inquiry`, `upload_payment_proof`, `send_admin_reply`, `ai_summarize_specs`, `accept_quote_proposal`, `reject_quote_proposal`, `display_quote_details`, `display_original_request`, `display_proposal_specs`, `display_quoted_price`, `verify_order`, etc.
- These are referenced by flow JSON (from DB) and executed during node transitions.

### Admin vs Customer

- **Customer**: starts flows (Ask Quote, Issue Ticket, Track Quote); messages saved with `sender_role='customer'`; Printy responds from the flow; can view historical conversations in sidebar.
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
  .select(
    `
    session_id, flow_id, status, created_at, metadata,
    inquiry:inquiries!inquiry_id(inquiry_id, display_id, inquiry_status),
    quote:quotes!quote_id(quote_id, display_id, status)
  `
  )
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

### Track-Quote Flow Completion (2025-10-18)

- **✅ COMPLETED: Track-Quote flow fully functional** (2025-10-18)
  - Created comprehensive track-quote flow for customers to view quote details and accept/reject proposals
  - Implemented customer actions: `accept_quote_proposal`, `reject_quote_proposal`, `display_quote_details`, `display_original_request`, `display_proposal_specs`, `display_quoted_price`, `verify_order`
  - Fixed RLS policy issue preventing customers from updating quote status
  - Added missing RLS policy: "Customers can update quote status on acceptance/rejection"
  - Flow now successfully updates both `quote_proposals` and `quotes` tables when customer accepts/rejects
  - Complete end-to-end functionality: customer can track quotes, view details, and accept/reject proposals

### Admin Create Order Flow Fixes (2025-10-18)

- **✅ FIXED: Context propagation and message persistence in JsonbFlowProcessor** (2025-10-18)
  - Fixed critical bug where `executeAction()` dropped context updates from action handlers
  - Action handlers return `{ messages, context }` but only messages were being propagated
  - Conditional nodes failed with "undefined" because context was never saved to database
  - Added context return in `executeAction()` method (line 838-842)
  - Fixed message persistence - boot messages from actions now saved to database
  - Added `insertMessage()` calls in three locations:
    1. Initial action node execution (line 144-152)
    2. Conditional branch to action node (line 215-223)
    3. Auto-advance loop action nodes (line 295-303)
  - Impact: Admin-create-order flow now works correctly with proper conditional evaluation and persistent messages

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
- **Quote acceptance not updating quotes table**: Check RLS policies - customers need permission to update quote status when accepting/rejecting proposals.
- **"invalid input syntax for type bytea"**: Message insertion failing due to improper text-to-bytea conversion in RPC function.
- **Conditional node evaluating to undefined**: Action context updates not propagated - ensure `executeAction()` returns both messages and context.
- **Messages not persisted to database**: Boot messages from actions must be saved via `insertMessage()` in all code paths.
- **ReferenceError: flowId is not defined**: Variable declared in try block - move to function scope so it's accessible throughout.
- **Hardcoded messages appearing in wrong flow**: Check flow-specific logic is wrapped in conditional (e.g., saved-specs check only for admin-quote-propose).
- **Slow UI despite flow completing**: Typing delays in `appendMessagesWithTyping` - use `skipDelay=true` for admin flows.
- **"Could not find column in schema cache"**: Column removed from database but still referenced in code - remove all references to deleted columns.

### Debugging Process (Track-Quote Flow - Quote Acceptance Issue)

**Problem**: Quote proposals table updates successfully but quotes table remains unchanged when customer accepts proposal.

**Debugging Steps**:

1. **Log Analysis**: Found warning `[acceptQuoteProposal] No quotes found for session_id: f026de5a-d9b5-475c-b8b9-60186ff99551`
   - But database query showed quote exists with that session_id

2. **Database Investigation**:
   - Confirmed quote exists: `quote_id: f9ffe38e-50af-4e5f-86f1-6c089c40adef`, `status: spec_proposed`
   - Confirmed quote_proposal exists: `proposal_id: 39300ae2-3d4d-4bf5-968a-2ec1f0ea8b91`, `status: accepted`
   - Both have same session_id: `f026de5a-d9b5-475c-b8b9-60186ff99551`

3. **RLS Policy Analysis**:
   - **quote_proposals table**: Customers CAN update (policy allows customers to update status to 'accepted'/'rejected')
   - **quotes table**: Customers CANNOT update (policy only allows admins to update quotes)

4. **Root Cause**: Missing RLS policy for customers to update quote status when accepting/rejecting proposals

5. **Solution**: Added RLS policy:
   ```sql
   CREATE POLICY "Customers can update quote status on acceptance/rejection" ON quotes
   FOR UPDATE TO authenticated
   USING (
     auth.uid() = customer_id
     AND EXISTS (
       SELECT 1 FROM quote_proposals qp
       WHERE qp.session_id = quotes.session_id
       AND qp.status IN ('accepted', 'rejected')
     )
   )
   WITH CHECK (
     auth.uid() = customer_id
     AND status IN ('accepted', 'rejected')
   );
   ```

**Final Solution**: RLS policy fix allows customers to update quote status when accepting/rejecting proposals, maintaining security while enabling functionality.

### Debugging Process (Bytea Encoding Error)

**Problem**: Track-quote flow shows confirmation messages but fails to save them due to `"invalid input syntax for type bytea"` error.

**Debugging Steps**:

1. **Error Analysis**: Found error in console logs:

   ```
   ERROR: Failed to insert message: {"code":"22P02","details":null,"hint":null,"message":"invalid input syntax for type bytea"}
   ```

2. **RPC Function Investigation**:
   - Checked `api_insert_chat_message_v2` function definition
   - Found problematic line: `p_text::bytea` - direct cast fails with special characters

3. **Root Cause**:
   - Function tries to cast text directly to bytea: `p_text::bytea`
   - This fails when text contains newlines, special characters, or Unicode
   - Track-quote confirmation messages contain newlines (`\n`)

4. **Solution**: Update RPC function to use proper encoding:

   ```sql
   -- BEFORE (problematic):
   p_text::bytea,  -- Direct cast fails with special characters

   -- AFTER (fixed):
   convert_to(p_text, 'UTF8'),  -- Properly encode text to bytea
   ```

5. **Complete Fix**:

   ```sql
   CREATE OR REPLACE FUNCTION public.api_insert_chat_message_v2(p_session_id uuid, p_text text, p_role text, p_node_id text DEFAULT NULL::text)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
   AS $function$
   DECLARE
     v_message_id uuid;
     v_customer_id uuid;
   BEGIN
     -- Get session customer_id
     SELECT customer_id INTO v_customer_id
     FROM public.chat_sessions_v2
     WHERE session_id = p_session_id;

     -- Check authorization
     IF v_customer_id IS NULL THEN
       RAISE EXCEPTION 'session not found';
     END IF;

     IF NOT (v_customer_id = auth.uid() OR priv.is_admin()) THEN
       RAISE EXCEPTION 'not authorized';
     END IF;

     -- Insert message as properly encoded bytea
     INSERT INTO public.chat_messages_v2 (
       session_id,
       sender_role,
       message_text_enc,
       metadata
     )
     VALUES (
       p_session_id,
       p_role,
       convert_to(p_text, 'UTF8'),  -- Properly encode text to bytea
       jsonb_build_object('node_id', p_node_id)
     )
     RETURNING message_id INTO v_message_id;

     RETURN jsonb_build_object('message_id', v_message_id);
   END;
   $function$;
   ```

**Final Solution**: Use `convert_to(p_text, 'UTF8')` instead of `p_text::bytea` to properly handle special characters and Unicode in message text.

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

### Debugging Process (Admin Create Order Flow - Context Propagation & Message Persistence)

**Problem**: Admin-create-order flow shows no messages and conditional evaluation fails with undefined context.

**Debugging Steps**:

1. **Log Analysis**: Found critical errors in logs:
   - Flow returns empty messages array: `"messages": []`
   - Conditional evaluation fails: `[StartFlow] No matching case found for condition: undefined`
   - The `quote_status` context variable is undefined despite `checkAcceptedQuote` action setting it

2. **Action Handler Investigation**:
   - Confirmed `checkAcceptedQuote` action correctly returns: `{ messages: [], context: { quote_status: 'accepted' } }`
   - Action logs show: `[checkAcceptedQuote] Quote status: accepted`

3. **Root Cause Analysis - Context Propagation**:
   - **Issue**: `executeAction()` method only returns `{ messages }` - it drops context updates!
   - Action handlers return `{ messages, context }` but `executeAction()` ignores the context
   - When conditional node evaluates, it reads from database but context was never saved

4. **Root Cause Analysis - Message Persistence**:
   - **Issue**: Boot messages from actions are added to `bootMessages` array but never saved to database
   - Messages show in UI during initial render but disappear on refresh
   - Three locations where this occurs:
     1. Initial action node execution (line 142)
     2. Conditional branch to action node (line 213)
     3. Auto-advance loop action nodes (line 293)

5. **Solution - Part 1 (Context Propagation)**:

   ```typescript
   // BEFORE (line 853):
   return { messages }; // ❌ Context dropped

   // AFTER:
   if (result.context) {
     return { messages, context: result.context }; // ✅ Propagate context
   }
   return { messages };
   ```

6. **Solution - Part 2 (Message Persistence)**:
   Added database persistence after each `bootMessages.push()`:

   ```typescript
   bootMessages.push(...actionResult.messages);

   // ✅ FIX: Save action messages to database
   for (const message of actionResult.messages) {
     await insertMessage({
       sessionId,
       text: message.text,
       role: message.role,
       nodeId: currentNodeId,
     });
   }
   ```

7. **Files Modified**:
   - `src/features/chat/services/JsonbFlowProcessor.ts`:
     - Line 838-842: Return context from `executeAction()`
     - Line 144-152: Save messages from initial action node
     - Line 215-223: Save messages from conditional branch action
     - Line 295-303: Save messages from auto-advance action loop

**Final Solution**:

1. `executeAction()` now properly returns both messages and context updates
2. All action messages in startFlow are now persisted to database
3. Conditional nodes can now properly evaluate context set by actions
4. Messages persist across page refreshes

**Impact**: Admin-create-order flow now works correctly - conditional evaluates properly, messages persist, and flow advances as expected.

### Debugging Process (Admin Create Order Flow - Complete Implementation)

**Problem**: Multiple issues preventing admin-create-order flow from working end-to-end.

**Issue Timeline & Fixes**:

#### Issue 1: Context Propagation Failure (2025-10-18)

**Problem**: Conditional node evaluating to `undefined` despite action setting context.

**Root Cause**: `executeAction()` method dropped context updates from action handlers.

**Solution**: Modified `src/features/chat/services/JsonbFlowProcessor.ts:838-842`:

```typescript
// Return context updates from action results
if (result.context) {
  return { messages, context: result.context };
}
```

#### Issue 2: Boot Messages Not Persisted (2025-10-18)

**Problem**: Messages showed in UI but disappeared on page refresh.

**Root Cause**: `bootMessages` array collected messages but never saved to database.

**Solution**: Added `insertMessage()` calls in three locations:

- Line 144-152: Initial action node execution
- Line 215-223: Conditional branch to action node
- Line 295-303: Auto-advance loop action nodes

#### Issue 3: Hardcoded Saved-Specs Message (2025-10-18)

**Problem**: "You have drafted an order specs..." message appeared for accepted quotes.

**Root Cause**: Saved-specs checking logic ran for all flows, not just `admin-quote-propose`.

**Solution**: Wrapped logic in conditional check (`src/admin/hooks/useAdminChat.ts:460-496`):

```typescript
if (flowId === 'admin-quote-propose') {
  // Only check for saved specs in quote proposal flow
  // ...
} else {
  // For other flows (admin-create-order), use flow's quick replies
  setQuickReplies(start.quickReplies || []);
}
```

#### Issue 4: flowId Scoping Error (2025-10-18)

**Problem**: `ReferenceError: flowId is not defined` when checking flow type.

**Root Cause**: `flowId` declared inside `try` block, not accessible in outer scope.

**Solution**: Moved declaration to function scope (`src/admin/hooks/useAdminChat.ts:322-323`):

```typescript
void (async () => {
  let start: any = null;
  let flowId = 'admin-quote-propose'; // ✅ Declared at function scope

  try {
    // ... flowId now accessible throughout
  }
})();
```

#### Issue 5: Slow UI Response (2025-10-18)

**Problem**: Messages took 2-3 seconds to appear despite flow completing instantly.

**Root Cause**: `appendMessagesWithTyping` added artificial typing delays (350ms + length-based delays) for every message.

**Solution**: Added fast mode option (`src/admin/hooks/useAdminChat.ts:68-94`):

```typescript
const appendMessagesWithTyping = async (
  botTexts: { role: ChatRole; text: string }[],
  skipDelay: boolean = false // ✅ Skip delays for admin-create-order
) => {
  for (const m of botTexts) {
    if (!skipDelay) {
      setIsTyping(true);
      const delay =
        350 + Math.min(1200, Math.floor((m.text?.length || 0) / 20) * 25);
      await new Promise(r => setTimeout(r, delay));
    }
    // ... append message
  }
};

// Usage:
const skipDelay = flowId === 'admin-create-order';
await appendMessagesWithTyping(start.messages, skipDelay);
```

**Impact**: Messages now appear instantly for admin-create-order flow (no artificial delays).

#### Issue 6: admin_notes Column Error (2025-10-18)

**Problem**: Order creation failed with `"Could not find the 'admin_notes' column of 'orders'"`

**Root Cause**: `createOrder` action trying to insert into removed `admin_notes` column.

**Solution**: Removed references (`src/features/chat/actions/admin/createOrder.ts`):

- Line 69: Removed `notes` from proposal query
- Line 119-120: Removed `admin_notes` from order insert

**Files Modified**:

- `src/features/chat/services/JsonbFlowProcessor.ts`
- `src/admin/hooks/useAdminChat.ts`
- `src/features/chat/actions/admin/createOrder.ts`

**Final Result**: Admin-create-order flow works end-to-end:

1. ✅ Detects accepted quotes and launches correct flow
2. ✅ Evaluates conditionals with proper context
3. ✅ Persists all messages to database
4. ✅ Shows messages instantly (no delays)
5. ✅ Creates orders successfully
6. ✅ No hardcoded messages appearing incorrectly

### Read more

- `docs_guide/CHAT_SYSTEM_V2_DEV_GUIDE.md` — quick reference + queries
- `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md` — JSON flow format + execution details
- `src/features/chat/services/JsonbFlowProcessor.ts` — the engine
- `src/features/chat/api/sessionQueries.ts` — unified query helpers
