# Ticket Reply Session Logic Documentation

**Date**: 2025-10-26  
**Status**: Production Documentation  
**Purpose**: Document the critical ticket reply session system to prevent logic being overwritten

---

## Overview

The ticket reply system uses **special "reply sessions"** that are hidden from normal conversation lists but their messages appear within the Track Ticket conversation. This allows seamless back-and-forth communication while keeping session lists clean.

**CRITICAL:** This is a core architectural pattern. Any changes to session filtering or message aggregation must preserve this logic.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Data Flow](#data-flow)
3. [Message Aggregation](#message-aggregation)
4. [Filtering Logic](#filtering-logic)
5. [Session Title Logic](#session-title-logic)
6. [Important Metadata Fields](#important-metadata-fields)
7. [Data Structure Reference](#data-structure-reference)
8. [Key Files Reference](#key-files-reference)
9. [Best Practices](#best-practices)

---

## Core Concepts

### Two Types of Sessions

#### 1. **Regular Sessions** (Normal Chat Sessions)

- Created when user starts a flow (e.g., "Issue Ticket", "Track Ticket")
- Appear in "Recent Chats" sidebar
- `metadata.ticket_conversation` is `null` or `false`
- Standard session behavior

#### 2. **Ticket Conversation Sessions** (Reply Sessions - HIDDEN)

- Created ONLY for admin/customer replies
- **DO NOT appear** in "Recent Chats" (`status: 'ended'` prevents this)
- Messages from these sessions are fetched and displayed within Track Ticket view
- Special metadata marks them as internal:
  ```json
  {
    "ticket_conversation": true,
    "original_session_id": "<original-session-id>",
    "inquiry_id": "<inquiry-id>",
    "conversation_type": "ticket_reply" | "ticket_resolution",
    "admin_chat": true | undefined,
    "customer_chat": true | undefined
  }
  ```

---

## Data Flow

### Scenario: Customer Creates Ticket → Admin Replies → Customer Replies

1. CUSTOMER creates ticket
   └─> Creates REGULAR session (flow_id: "issue-ticket")
   └─> Session metadata: { title: "Issue Ticket" }
   └─> Creates inquiry in inquiries_v2
   └─> Sends initial message

2. ADMIN reviews ticket
   └─> Opens admin-review-ticket flow
   └─> Creates REGULAR session (flow_id: "admin-review-ticket")
   └─> Session metadata: { title: "Ticket Review: TCK-XXX" }

3. ADMIN sends reply
   └─> Creates REPLY SESSION (flow_id: "track-ticket")
   └─> status: "ended" (HIDDEN from Recent Chats)
   └─> metadata: { ticket_conversation: true, conversation_type: "ticket_reply" }
   └─> Saves admin message to chat_messages_v2
   └─> Updates inquiry status to "pending_customer_reply"

4. CUSTOMER tracks ticket
   └─> Opens track-ticket flow
   └─> Creates REGULAR session (flow_id: "track-ticket")
   └─> Aggregates messages:
   • Original issue-ticket session messages
   • All reply session messages
   • Displays unified conversation

5. CUSTOMER sends reply
   └─> Creates REPLY SESSION (flow_id: "track-ticket")
   └─> status: "ended" (HIDDEN from Recent Chats)
   └─> metadata: { ticket_conversation: true, conversation_type: "ticket_reply" }
   └─> Saves customer message to chat_messages_v2
   └─> Updates inquiry status to "pending_admin_reply"

6. Repeat steps 3-5 as needng_customer_reply`

---

### Customer Reply Flow

**File**: `src/features/chat/actions/customer/trackTicket.ts`  
**Lines**: 306-333

```typescript
// Create a separate ticket conversation session (marked as ended so it doesn't appear in Recent Chats)
const { data: ticketSession, error: sessionError } = await supabase
  .from('chat_sessions_v2')
  .insert({
    flow_id: 'track-ticket',
    customer_id: customerId,
    status: 'ended', // ← HIDDEN from Recent Chats
    metadata: {
      ticket_conversation: true, // ← Marks as reply session
      original_session_id: originalSessionId, // ← Links to original
      inquiry_id: inquiryId, // ← Links to inquiry
      conversation_type: 'ticket_reply', // ← Message category
      customer_chat: true, // ← Indicates customer-initiated
    },
  })
  .select('session_id')
  .single();
```

**What happens:**

1. Creates new session with `flow_id: 'track-ticket'`
2. Sets `status: 'ended'` to **hide from Recent Chats**
3. Marks as `ticket_conversation: true` for filtering
4. Saves customer reply message with `sender_role: 'customer'`
5. Updates inquiry status to `pending_admin_reply`

---

## Message Aggregation

### Track Ticket View - How Messages Are Combined

**File**: `src/features/chat/actions/customer/trackTicket.ts`  
**Lines**: 82-120

```typescript
// 1. Fetch messages from original session
const { data: chatMessages, error: messagesError } = await supabase.rpc(
  'api_fetch_chat_messages_v2',
  { p_session_id: inquiry.session_id }
);

// 2. Find ALL ticket conversation sessions for this inquiry
const { data: ticketConversations, error: ticketError } = await supabase
  .from('chat_sessions_v2')
  .select('session_id')
  .eq('customer_id', params.customerId)
  .eq('metadata->>inquiry_id', inquiryId)
  .eq('metadata->>ticket_conversation', true); // ← Get reply sessions

let ticketMessages: any[] = [];

// 3. Fetch messages from each reply session
if (!ticketError && ticketConversations && ticketConversations.length > 0) {
  for (const ticketSession of ticketConversations) {
    const { data: ticketChatMessages } = await supabase.rpc(
      'api_fetch_chat_messages_v2',
      { p_session_id: ticketSession.session_id }
    );
    if (ticketChatMessages) {
      ticketMessages.push(...ticketChatMessages);
    }
  }
}

// 4. Combine and sort chronologically
const allMessages = [...(chatMessages || []), ...ticketMessages].sort(
  (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
);
```

**Result**: Unified conversation timeline showing:

- Original ticket description
- Admin replies (from reply sessions)
- Customer replies (from reply sessions)
- All sorted chronologically by `sent_at`

---

## Filtering Logic

### How Reply Sessions Are Hidden from Recent Chats

#### Customer Dashboard

**File**: `src/customer/pages/CustomerDashboard.tsx`  
**Lines**: 185-191

```typescript
const { data: sessions, error } = await supabase
  .from('chat_sessions_v2')
  .select(`...`)
  .is('metadata->ticket_conversation', null) // ← EXCLUDE reply sessions
  .order('created_at', { ascending: false })
  .limit(10);
```

**Query Logic:**

- `.is('metadata->ticket_conversation', null)` = only sessions where this field is null
- Reply sessions have `ticket_conversation: true`
- Result: Only regular sessions appear in list

---

#### Database Function - User Sessions RPC

**File**: `supabase/migrations/084_filter_ticket_conversation_sessions.sql`  
**Lines**: 12-27

```sql
create or replace function public.api_get_user_sessions_v2()
returns table (...)
language sql
security definer
as $$
  select
    s.session_id,
    s.flow_id,
    s.status,
    s.created_at,
    (s.metadata->>'current_node_id')::text as current_node_id
  from public.chat_sessions_v2 s
  where s.customer_id = auth.uid()
    and (s.metadata->>'ticket_conversation' is null or s.metadata->>'ticket_conversation' != 'true') -- ← EXCLUDE reply sessions
  order by s.created_at desc;
$$;
```

**Comment in code:**

```sql
comment on function public.api_get_user_sessions_v2() is
'Returns customer chat sessions excluding ticket conversation reply sessions.
Ticket reply sessions are internal and only appear within Track Ticket conversation history.';
```

---

#### Admin "All Chats" View

**File**: `src/admin/hooks/useAdminConversations.tsx`  
**Lines**: 65-80

```typescript
const { data: sessions, error } = await supabase
  .from('chat_sessions_v2')
  .select(`...`)
  .or('metadata->admin_chat.eq.true,flow_id.eq.admin-quote-propose')
  .is('metadata->ticket_conversation', null) // ← EXCLUDE reply sessions
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## Session Title Logic

### Why Reply Sessions Show "track-ticket" as Title

**Location**: `src/features/chat/config/sessionTitleConfig.ts`

**Title priority:**

1. `metadata.title` (explicitly set)
2. `metadata.context.display_id` (context-based)
3. FK display_id (from joins)
4. Flow mapping (`FLOW_TITLES[flowId]`)
5. Fallback to `flow_id` or 'Chat'

**Reply sessions:**

- `display_title` = "track-ticket" (from `flow_id` since no explicit title)
- Title is never updated (session is `status: 'ended'` when created)

**From your data:**

```json
{
  "session_id": "53e1a772-0d27-4648-a722-be9c0031231c",
  "flow_id": "track-ticket",
  "display_title": "track-ticket",
  "metadata": {
    "ticket_conversation": true,
    "admin_chat": true,
    "inquiry_id": "4d5fb4c7-19a9-4581-baec-4854d37b22e3",
    "conversation_type": "ticket_reply"
  }
}
```

**Why "track-ticket"?**

- Session created with `status: 'ended'` immediately
- No title update happens (session is ended)
- Fallback logic uses `flow_id: 'track-ticket'`
- This is **expected behavior** - reply sessions are hidden anyway

---

## Important Metadata Fields

### `ticket_conversation` (Boolean)

- **Purpose**: Flags session as internal reply session
- **Location**: `metadata.ticket_conversation`
- **Values**: `true` (reply session) | `null`/`false` (regular session)
- **Usage**: Filtering out reply sessions from Recent Chats

### `original_session_id` (UUID)

- **Purpose**: Links reply session to original ticket session
- **Location**: `metadata.original_session_id`
- **Usage**: Message correlation and traceability

### `conversation_type` (String)

- **Purpose**: Categorizes the type of conversation
- **Location**: `metadata.conversation_type`
- **Values**: `'ticket_reply'` | `'ticket_resolution'`
- **Usage**: Message categorization

### `admin_chat` / `customer_chat` (Boolean)

- **Purpose**: Indicates who initiated the reply session
- **Location**: `metadata.admin_chat` | `metadata.customer_chat`
- **Usage**: Tracking reply initiator

### `inquiry_id` (UUID)

- **Purpose**: Links reply session to inquiry/ticket
- **Location**: `metadata.inquiry_id`
- **Usage**: Aggregating all messages for a ticket

---

## Data Structure Reference

### Original Ticket Session

```json
{
  "session_id": "dad6dece-aad5-4daf-ad63-1a3bb91acb19",
  "flow_id": "issue-ticket",
  "customer_id": "e90373ef-1efa-4d04-b374-cf6eec48f0e0",
  "status": "ended",
  "created_at": "2025-10-26T06:35:00Z",
  "metadata": {
    "title": "Issue Ticket"
  },
  "display_title": "Issue Ticket"
}
```

### Admin Review Session

```json
{
  "session_id": "bac4763d-5692-4f38-a429-cd06dce669c1",
  "flow_id": "admin-review-ticket",
  "customer_id": "8cdaf581-4801-4e57-a6fa-f46fc9e86bda",
  "status": "ended",
  "created_at": "2025-10-26T06:41:27Z",
  "ended_at": "2025-10-26T06:41:44Z",
  "metadata": {
    "title": "Ticket Review: TCK-200119",
    "admin_chat": true,
    "context": {
      "inquiry_id": "4d5fb4c7-19a9-4581-baec-4854d37b22e3",
      "user_input": "3 admin test",
      "admin_reply": "3 admin test",
      "customer_session_id": "dad6dece-aad5-4daf-ad63-1a3bb91acb19"
    },
    "ended_by": "admin",
    "current_node_id": "reply_sent"
  },
  "display_title": "Ticket Review: TCK-200119"
}
```

### Reply Session (Customer Side)

```json
{
  "session_id": "2fd4d543-593a-481e-844f-651d5da33dd8",
  "flow_id": "track-ticket",
  "customer_id": "e90373ef-1efa-4d04-b374-cf6eec48f0e0",
  "status": "ended",
  "created_at": "2025-10-26T06:40:04Z",
  "metadata": {
    "customer_chat": true,
    "inquiry_id": "4d5fb4c7-19a9-4581-baec-4854d37b22e3",
    "conversation_type": "ticket_reply",
    "original_session_id": "dad6dece-aad5-4daf-ad63-1a3bb91acb19",
    "ticket_conversation": true
  },
  "display_title": "track-ticket"
}
```

---

## Key Files Reference

1. **Admin Reply Action**
   - `src/features/chat/actions/admin/replyToTicket.ts` (lines 82-102)

2. **Customer Reply Action**
   - `src/features/chat/actions/customer/trackTicket.ts` (lines 230-380)

3. **Fetch Ticket Details (Message Aggregation)**
   - `src/features/chat/actions/customer/trackTicket.ts` (lines 22-231)

4. **Fetch Ticket for Admin**
   - `src/features/chat/actions/admin/fetchTicketForAdmin.ts`

5. **Session Title Configuration**
   - `src/features/chat/config/sessionTitleConfig.ts`

6. **Filter Migration (Database Function)**
   - `supabase/migrations/084_filter_ticket_conversation_sessions.sql`

7. **Display Title Migration**
   - `supabase/migrations/061_add_display_title_column.sql`

8. **Customer Dashboard Filtering**
   - `src/customer/pages/CustomerDashboard.tsx` (line 191)

9. **Admin Conversations Filtering**
   - `src/admin/hooks/useAdminConversations.tsx` (line 79)

---

## Best Practices

### ✅ DO

- Always mark reply sessions with `status: 'ended'` and `ticket_conversation: true`
- Always link reply sessions to original via `original_session_id`
- Always include `inquiry_id` in metadata for aggregation
- Always filter out reply sessions with `.is('metadata->ticket_conversation', null)`
- Always aggregate messages from ALL reply sessions when displaying Track Ticket
- Sort aggregated messages chronologically by `sent_at`

### ❌ DON'T

- **DON'T** create reply sessions with `status: 'active'` (they'll appear in Recent Chats)
- **DON'T** forget to include `ticket_conversation: true` in metadata
- **DON'T** show reply sessions in Recent Chats lists
- **DON'T** forget to link via `original_session_id` and `inquiry_id`
- **DON'T** update titles on reply sessions (they're hidden anyway)

---

## Summary

This system allows seamless ticket conversations while keeping session lists clean. The key insight is using **separate reply sessions** that are:

- Hidden from Recent Chats (via filtering)
- Messages aggregated into Track Ticket view
- Linked via `original_session_id` and `inquiry_id`
- Marked with `ticket_conversation: true`

**Preserve this logic** - it's a core architectural pattern that should not be modified without careful consideration.
