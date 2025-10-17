# Priority 3: Production Testing & Verification Plan

**Chat System v2 - Testing & Verification**
**Date:** 2025-10-17
**Status:** 🟡 In Progress

---

## Overview

This document provides a comprehensive testing plan for the Chat System v2 migration. All database functions, RLS policies, and flow definitions are now in place. This priority focuses on **functional testing** to ensure the system works end-to-end.

---

## Active Flows in Production (chat_flows_v2)

| Flow ID               | Owner    | Created    | Status    | Purpose                                  |
| --------------------- | -------- | ---------- | --------- | ---------------------------------------- |
| `ask-quote`           | customer | 2025-10-15 | ✅ Active | Customer requests printing quote         |
| `issue-ticket`        | customer | 2025-10-15 | ✅ Active | Customer reports support issues          |
| `track-quote`         | customer | 2025-10-15 | ✅ Active | Customer reviews/accepts quote proposals |
| `admin-quote-propose` | admin    | 2025-10-16 | ✅ Active | Admin prepares and sends quote proposals |

**Note:** `upload-payment` flow exists in JSON but is not yet migrated to v2 (legacy/future feature).

---

## Pre-Flight Checklist

### Database Layer ✅

- [x] `chat_sessions_v2` table created with proper columns
- [x] `chat_messages_v2` table created with encryption
- [x] `chat_flows_v2` table created with JSONB definitions
- [x] API functions created (`052_create_v2_api_functions.sql`):
  - `api_get_flow_definition(flow_id)`
  - `api_insert_chat_message_v2(session_id, text, role, node_id)`
  - `api_fetch_chat_messages_v2(session_id)`
  - `api_get_user_sessions_v2()`
- [x] RLS policies enabled and configured
- [x] Encryption helpers (`priv.decrypt_text()`) available

### Application Layer ✅

- [x] `JsonbFlowProcessor.ts` - Main flow engine
- [x] `jsonbChatFlowApi.ts` - API wrapper functions
- [x] Customer hooks implemented:
  - `useJsonbFlowConversations.ts`
  - `useCustomerConversations.ts`
- [x] Admin hooks implemented:
  - `useAdminChat.ts`
- [x] Action handlers registered for all node actions

---

## Test Scenarios

### 1. Customer Flow: ask-quote

**Flow Path:**

```
intro → [user input] → create_quote → quote_created → end
```

**Test Steps:**

1. **Start Flow**
   - [ ] Customer clicks "Ask for Quote" button
   - [ ] Verify intro message displays correctly
   - [ ] Verify input prompt appears

2. **Provide Input**
   - [ ] Enter quote details: "100 business cards, 3.5x2 inches, glossy finish"
   - [ ] Verify user message appears in chat
   - [ ] Verify "processing" message displays

3. **Action Execution**
   - [ ] Verify `create_quote_conversation` action executes
   - [ ] Verify quote record created in `quotes` table
   - [ ] Verify display ID generated (e.g., QOT-000123)
   - [ ] Verify session linked to quote via FK (`quote_id` column)

4. **Completion**
   - [ ] Verify success message with quote ID displays
   - [ ] Verify "End Chat" button appears
   - [ ] Click "End Chat" and verify session status = 'ended'

**Expected Database State:**

```sql
-- New record in chat_sessions_v2
SELECT session_id, flow_id, status, quote_id, metadata
FROM chat_sessions_v2
WHERE flow_id = 'ask-quote'
ORDER BY created_at DESC LIMIT 1;

-- Verify quote created and linked
SELECT q.quote_id, q.display_id, q.status, q.conversation_details
FROM quotes q
WHERE q.quote_id = (SELECT quote_id FROM chat_sessions_v2 WHERE flow_id = 'ask-quote' ORDER BY created_at DESC LIMIT 1);

-- Verify messages encrypted
SELECT message_id, sender_role, sent_at, metadata
FROM chat_messages_v2
WHERE session_id = [session_id from above]
ORDER BY sent_at ASC;
```

---

### 2. Customer Flow: issue-ticket

**Flow Path:**

```
welcome → [select issue type] → collect_details → [user input] →
ask_order_id → [yes/no] → (optional: collect_order_id) →
create_ticket → ticket_created → end
```

**Test Steps:**

1. **Start Flow**
   - [ ] Customer clicks "Report an Issue" button
   - [ ] Verify welcome message with issue type options displays

2. **Select Issue Type**
   - [ ] Click "Printing Quality Issue" button
   - [ ] Verify `inquiry_type` stored in context as "quality"
   - [ ] Verify "collect_details" prompt displays

3. **Provide Details**
   - [ ] Enter: "Colors are faded on my business cards"
   - [ ] Verify transition to "ask_order_id" node

4. **Order ID Flow**
   - [ ] Select "Yes, I have an order ID"
   - [ ] Enter: "ORD-12345"
   - [ ] Verify `order_id` stored in context

5. **Action Execution**
   - [ ] Verify `create_inquiry` action executes
   - [ ] Verify inquiry record created in `inquiries` table
   - [ ] Verify display ID generated (e.g., TKT-000123)
   - [ ] Verify session linked to inquiry via FK (`inquiry_id` column)
   - [ ] Verify `inquiry_message_enc` contains encrypted message

6. **Completion**
   - [ ] Verify success message with ticket ID displays
   - [ ] Verify "End Chat" button appears
   - [ ] Click "End Chat" and verify session status = 'ended'

**Expected Database State:**

```sql
-- New inquiry created
SELECT i.inquiry_id, i.display_id, i.inquiry_type, i.inquiry_status
FROM inquiries i
WHERE i.inquiry_id = (SELECT inquiry_id FROM chat_sessions_v2 WHERE flow_id = 'issue-ticket' ORDER BY created_at DESC LIMIT 1);

-- Verify session linkage
SELECT session_id, flow_id, inquiry_id, metadata->'context'->>'inquiry_type' as inquiry_type
FROM chat_sessions_v2
WHERE flow_id = 'issue-ticket'
ORDER BY created_at DESC LIMIT 1;
```

---

### 3. Customer Flow: track-quote

**Flow Path:**

```
intro → [display_quote_details action] → await_response →
[accept_quote | reject_quote] → [quote_accepted | quote_rejected] → end
```

**Prerequisites:**

- Existing quote with `status = 'proposed'`
- Quote must have a valid `session_id` (conversation_id)

**Test Steps:**

1. **Start Flow with Context**
   - [ ] Navigate to quote from dashboard (should pass `conversation_id` in initialContext)
   - [ ] Verify intro loading message displays
   - [ ] Verify `display_quote_details` action executes

2. **View Quote Details**
   - [ ] Verify quote details display (item, quantity, price)
   - [ ] Verify "Accept Quote" and "Reject Quote" buttons appear
   - [ ] Verify warning message about no cancellation displays

3. **Accept Quote Path**
   - [ ] Click "Accept Quote"
   - [ ] Verify `accept_quote_proposal` action executes
   - [ ] Verify quote `status` updated to 'accepted' in database
   - [ ] Verify acceptance confirmation message displays

4. **Reject Quote Path (Alternative)**
   - [ ] (On separate test) Click "Reject Quote"
   - [ ] Verify `reject_quote_proposal` action executes
   - [ ] Verify quote `status` updated to 'rejected' in database
   - [ ] Verify rejection confirmation message displays

5. **Pending Action Processing**
   - [ ] Verify `pending_quote_action` stored in session metadata
   - [ ] Verify pending action processes when reaching acknowledgement node

**Expected Database State:**

```sql
-- Quote status updated
SELECT quote_id, status, updated_at
FROM quotes
WHERE quote_id = [test_quote_id];

-- Session metadata contains pending action
SELECT metadata->'context'->>'pending_quote_action' as pending_action,
       metadata->'context'->>'pending_conversation_id' as pending_conv_id
FROM chat_sessions_v2
WHERE flow_id = 'track-quote'
ORDER BY created_at DESC LIMIT 1;
```

---

### 4. Admin Flow: admin-quote-propose

**Flow Path:**

```
greet → show_details → [display_quote_details_admin action] →
choose_action → [summarize_specs | manual_specs] →
wait_for_draft_save → send_specs → [send_quote_proposal action] →
sent_confirmation → end
```

**Prerequisites:**

- Existing quote request (from ask-quote flow)
- Admin role permissions

**Test Steps:**

1. **Start Flow**
   - [ ] Admin opens quote request from admin dashboard
   - [ ] Verify greeting message displays
   - [ ] Verify `display_quote_details_admin` action executes
   - [ ] Verify quote details display for admin

2. **Choose Spec Preparation Method**
   - [ ] Verify "Summarize Order Specs" and "Manual Order Specs" options appear

3. **AI Summarize Path**
   - [ ] Click "Summarize Order Specs"
   - [ ] Verify `ai_summarize_specs` action executes
   - [ ] Verify AI-generated specs display (or spec editor opens)
   - [ ] Verify draft saved to database

4. **Manual Specs Path (Alternative)**
   - [ ] (On separate test) Click "Manual Order Specs"
   - [ ] Verify `open_spec_editor` action executes
   - [ ] Verify spec editor form opens
   - [ ] Fill out specs manually and save draft

5. **Send Proposal**
   - [ ] Click "Send Specs to Customer"
   - [ ] Verify `send_quote_proposal` action executes
   - [ ] Verify quote `status` updated to 'proposed'
   - [ ] Verify proposal sent confirmation displays

6. **Realtime Check**
   - [ ] (Optional) Have customer logged in simultaneously
   - [ ] Verify customer receives notification about new proposal

**Expected Database State:**

```sql
-- Quote status updated to proposed
SELECT quote_id, status, quote_specs, updated_at
FROM quotes
WHERE quote_id = [test_quote_id];

-- Session created for admin
SELECT session_id, flow_id, customer_id, metadata
FROM chat_sessions_v2
WHERE flow_id = 'admin-quote-propose'
ORDER BY created_at DESC LIMIT 1;
```

---

## Integration Testing

### Customer Dashboard Integration

- [ ] Verify recent chats display correctly (using `chat_sessions_v2`)
- [ ] Verify clicking chat opens conversation history
- [ ] Verify quote cards link to track-quote flow
- [ ] Verify ticket cards link to issue history

### Admin Dashboard Integration

- [ ] Verify admin can see all customer sessions
- [ ] Verify admin can open quote requests
- [ ] Verify admin can reply to tickets
- [ ] Verify conversation switching works

### Hook Testing

- [ ] `useJsonbFlowConversations.startFlow()` - Creates session correctly
- [ ] `useJsonbFlowConversations.sendMessage()` - Inserts messages and advances nodes
- [ ] `useJsonbFlowConversations.handleQuickReply()` - Processes button clicks
- [ ] `useAdminChat.handleChatOpenWithTopic()` - Opens correct flow with context
- [ ] `useConversationSwitcher` - Switches between multiple active chats

---

## Performance & Query Testing

### FK-Based Queries

```sql
-- Test 1: Get all user sessions with related inquiry/quote
EXPLAIN ANALYZE
SELECT
  s.session_id, s.flow_id, s.status, s.created_at,
  i.inquiry_id, i.display_id as inquiry_display_id,
  q.quote_id, q.display_id as quote_display_id
FROM chat_sessions_v2 s
LEFT JOIN inquiries i ON s.inquiry_id = i.inquiry_id
LEFT JOIN quotes q ON s.quote_id = q.quote_id
WHERE s.customer_id = [test_user_id]
ORDER BY s.created_at DESC
LIMIT 20;

-- Test 2: Get messages for a session (with decryption)
EXPLAIN ANALYZE
SELECT * FROM api_fetch_chat_messages_v2([test_session_id]);

-- Test 3: Get flow definition
EXPLAIN ANALYZE
SELECT * FROM api_get_flow_definition('ask-quote');
```

**Performance Expectations:**

- Session queries: < 50ms
- Message fetch: < 100ms (including decryption)
- Flow definition fetch: < 10ms (cached in DB)

---

## Realtime Subscriptions

### Test Realtime Updates

```typescript
// Subscribe to new messages in a session
const subscription = supabase
  .channel('chat_messages_v2_changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages_v2',
      filter: `session_id=eq.${sessionId}`,
    },
    payload => {
      console.log('New message received:', payload);
    }
  )
  .subscribe();
```

**Test Cases:**

- [ ] Customer sends message → Admin sees update
- [ ] Admin replies → Customer sees update
- [ ] Multiple customers chatting simultaneously (no cross-contamination)
- [ ] Subscription cleans up on unmount

---

## Error Handling & Edge Cases

### Test Scenarios

1. **Flow Not Found**
   - [ ] Try to start non-existent flow ID
   - [ ] Verify graceful error message

2. **Missing Context**
   - [ ] Start track-quote without `conversation_id`
   - [ ] Verify appropriate error handling

3. **Unauthorized Access**
   - [ ] Customer tries to access another customer's session
   - [ ] Verify RLS blocks access (403 error)

4. **Network Interruption**
   - [ ] Start flow, disconnect internet mid-message
   - [ ] Verify retry logic or error message

5. **Encryption Failures**
   - [ ] (Admin test) Temporarily remove encryption key
   - [ ] Verify encryption error handling

---

## Regression Testing Checklist

### Features That Should Still Work

- [ ] User authentication (login/logout)
- [ ] Dashboard data loads correctly
- [ ] Orders display without errors
- [ ] Quotes display without errors
- [ ] Inquiries display without errors
- [ ] Admin panels load correctly
- [ ] No console errors on page load

---

## Test Report Template

### Test Session Details

- **Date:** ******\_\_\_******
- **Tester:** ******\_\_\_******
- **Environment:** Development / Staging / Production
- **Browser:** Chrome / Firefox / Safari / Edge

### Results Summary

| Flow                | Status            | Pass Rate | Critical Issues | Notes |
| ------------------- | ----------------- | --------- | --------------- | ----- |
| ask-quote           | ⬜ Pass / ⬜ Fail | **/**     |                 |       |
| issue-ticket        | ⬜ Pass / ⬜ Fail | **/**     |                 |       |
| track-quote         | ⬜ Pass / ⬜ Fail | **/**     |                 |       |
| admin-quote-propose | ⬜ Pass / ⬜ Fail | **/**     |                 |       |

### Issues Found

1. **[Issue Title]**
   - **Severity:** Critical / High / Medium / Low
   - **Flow:** ******\_\_\_******
   - **Steps to Reproduce:** ******\_\_\_******
   - **Expected:** ******\_\_\_******
   - **Actual:** ******\_\_\_******
   - **Screenshot:** ******\_\_\_******

---

## Sign-Off Criteria

✅ **Priority 3 Complete When:**

- [ ] All 4 flows execute end-to-end without errors
- [ ] Database records created correctly for each flow
- [ ] Messages encrypted and decrypted properly
- [ ] FK relationships maintain referential integrity
- [ ] Customer and admin hooks work correctly
- [ ] No TypeScript/console errors
- [ ] Performance benchmarks met
- [ ] Realtime subscriptions function properly
- [ ] RLS policies enforce proper access control
- [ ] Zero critical bugs found

---

## Next Steps After Priority 3

**Priority 4: Optional Enhancements**

- Clean up `@typescript-eslint/no-explicit-any` warnings
- Add comprehensive error boundaries
- Implement retry logic for failed API calls
- Add telemetry/logging for flow execution
- Consider removing legacy `chat_sessions` table entirely

**Production Deployment Checklist:**

- [ ] Run full regression test suite
- [ ] Load test with concurrent users
- [ ] Backup database before migration
- [ ] Deploy SQL migration `052_create_v2_api_functions.sql`
- [ ] Monitor error logs for 24 hours post-deployment
- [ ] Have rollback plan ready

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Owner:** Development Team
