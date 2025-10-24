# Issue Ticket V2 Implementation Summary

## Overview

This document summarizes the implementation of the Issue Ticket System V2, which migrates from the old `inquiries` table to a new `inquiries_v2` table with a cleaner schema and better conversation tracking through `chat_messages_v2`.

## Implementation Status: COMPLETE (Code Changes)

### What Has Been Implemented

#### 1. Database Migration ✅

**File:** `supabase/migrations/063_create_inquiries_v2.sql`

- Created `inquiries_v2` table with clean schema
- Added `order_id` column for tracking order-related tickets
- Removed deprecated columns: `inquiry_message_enc`, `resolution_comments`
- Created indexes for performance
- Configured RLS policies for customer and admin access
- Reused existing triggers for display_id generation and notifications

#### 2. Action Handlers ✅

**Customer Actions:**

- `src/features/chat/actions/customer/createInquiry.ts` - UPDATED
  - Now uses `inquiries_v2` table
  - Stores `order_id` if provided
  - Saves issue details in `chat_messages_v2` instead of inquiry table
  - Updates session metadata with issue preview

- `src/features/chat/actions/customer/trackTicket.ts` - NEW
  - `fetch_ticket_details`: Loads ticket and full conversation history
  - `send_customer_reply`: Customer responds to admin (updates status to pending_admin_reply)
  - `resolve_ticket`: Customer marks ticket as resolved and ends session

**Admin Actions:**

- `src/features/chat/actions/admin/fetchTicketForAdmin.ts` - NEW
  - `fetch_ticket_for_admin`: Fetches ticket details for admin review (displays inquiry type, description, order ID)

- `src/features/chat/actions/admin/replyToTicket.ts` - NEW
  - `send_admin_reply`: Admin responds to customer (updates status to pending_customer_reply)

- `src/features/chat/actions/admin/changeTicketStatus.ts` - NEW
  - `ticket_change_status`: Admin changes ticket status (Under Review, Resolved, Closed)

#### 3. Action Registration ✅

- Updated `src/features/chat/actions/customer/index.ts` to export new customer actions
- Updated `src/features/chat/actions/admin/index.ts` to export new admin actions
- Actions automatically available to `JsonbFlowProcessor` via merged registry

#### 4. Frontend Updates ✅

**Admin Side:**

- `src/admin/hooks/useAdminTickets.ts` - UPDATED to query `inquiries_v2`
- `src/features/chat/hooks/admin/useAdminTickets.ts` - UPDATED to query `inquiries_v2`

**Customer Side:**

- `src/customer/components/dashboard/ticketHistory/TicketHistory.tsx` - UPDATED to query `inquiries_v2`
- `src/customer/hooks/useRecentTicket.ts` - Uses updated `getCustomerInquiries` function
- `src/features/chat/api/sessionQueries.ts` - UPDATED `getCustomerInquiries` to query `inquiries_v2`

#### 5. Type Definitions ✅

- `src/features/chat/api/sessionQueries.ts` - Updated `InquiryWithSession` interface
  - Added `order_id` field
  - Added `updated_at` field
  - Added camelCase variants for hooks

#### 6. Flow Definitions ✅

Created JSON flow definitions (ready to insert into database):

- `docs_guide/issue-ticket-v2.json` - Updated issue ticket flow with order_id collection
- `docs_guide/track-ticket.json` - New flow for tracking existing tickets
- `docs_guide/admin-review-ticket.json` - NEW admin flow for reviewing tickets

---

## Manual Steps Required (Supabase Studio)

### Step 1: Run Migrations

Execute the migration files in Supabase SQL Editor **in order**:

**Migration 063:** `supabase/migrations/063_create_inquiries_v2.sql`

- Creates the `inquiries_v2` table
- Sets up indexes
- Configures RLS policies
- Attaches triggers

**Migration 064:** `supabase/migrations/064_update_chat_sessions_inquiry_fk.sql`

- Drops old FK constraint from `chat_sessions_v2.inquiry_id` → `inquiries.inquiry_id`
- Creates new FK constraint from `chat_sessions_v2.inquiry_id` → `inquiries_v2.inquiry_id`
- **CRITICAL:** This fixes the foreign key constraint violation error

### Step 2: Update issue-ticket Flow

In Supabase Studio → Table Editor → `chat_flows_v2`:

1. Find the row with `flow_id = 'issue-ticket'`
2. Update the `flow_definition` column with the content from `docs_guide/issue-ticket-v2.json`

**Key changes in the flow:**

- Now collects `order_id` when customer confirms issue is order-related
- Stores order_id in context for `create_inquiry` action
- Flow structure: welcome → collect_details → ask_order_id → [collect_order_id] → create_ticket → end

### Step 3: Insert track-ticket Flow

In Supabase Studio → Table Editor → `chat_flows_v2`:

1. Click "Insert row"
2. Set fields:
   - `flow_id`: `'track-ticket'`
   - `flow_owner`: `'customer'`
   - `active`: `true`
   - `flow_definition`: Copy content from `docs_guide/track-ticket.json`

**Flow structure:**

- welcome (fetch_ticket_details action) → show_conversation → [Reply to Admin | Mark as Resolved | End Chat]

### Step 4: Insert admin-review-ticket Flow

In Supabase Studio → Table Editor → `chat_flows_v2`:

1. Click "Insert row"
2. Set fields:
   - `flow_id`: `'admin-review-ticket'`
   - `flow_owner`: `'admin'`
   - `active`: `true`
   - `flow_definition`: Copy content from `docs_guide/admin-review-ticket.json`

**Flow structure:**

- fetch_ticket_info (fetch_ticket_for_admin action) → show_ticket_details → [Reply to Customer | Mark as Under Review | Mark as Resolved | Close Ticket | End Chat]

### Step 5: Verify Customer Dashboard Config

Check `src/customer/pages/CustomerDashboard.tsx` lines 79-84:

- Ensure `trackTicket` topic exists in `topicConfig`
- Verify `flowId` is `'track-ticket'`

**This is already done in the code.**

---

## How It Works

### Customer Flow: Create Ticket

1. Customer clicks "Ask for Assistance" in dashboard
2. Selects issue type (quality, delivery, billing, other)
3. Describes the issue in free text
4. Optionally provides order ID if issue is order-related
5. System creates:
   - Record in `inquiries_v2` with type, status='new', order_id (if provided)
   - Session in `chat_sessions_v2` linked to inquiry
   - Customer's description stored in `chat_messages_v2` with sender_role='customer'
6. Customer receives ticket ID (e.g., TCK-200001)

### Customer Flow: Track Ticket

1. Customer clicks "Track Ticket" button
2. System fetches:
   - Inquiry details from `inquiries_v2`
   - Full conversation history from `chat_messages_v2`
3. Displays formatted conversation with:
   - Ticket info (ID, type, status, order ID if present)
   - All messages chronologically (customer and admin)
4. Customer can:
   - Reply to admin (stores in chat_messages_v2, updates status to pending_admin_reply)
   - Mark as resolved (updates status to resolved, ends session)

### Admin Flow: Review Ticket (admin-review-ticket)

1. Admin sees ticket in Tickets page (queries `inquiries_v2`)
2. Clicks ticket's chat button → triggers `admin-review-ticket` flow
3. Admin chat handler (`useAdminChat.ts`):
   - Sets topic to `'tickets'`
   - Passes `inquiry_id` in context
   - Initializes flow with `flowId: 'admin-review-ticket'`
4. `fetch_ticket_for_admin` action executes:
   - Fetches ticket from `inquiries_v2` by `inquiry_id`
   - Retrieves customer's initial description from `chat_messages_v2`
   - Fetches order details if `order_id` is present
   - Stores `customer_session_id` in context for subsequent actions
5. System displays:
   - Ticket ID and status
   - Customer name and info
   - Inquiry type (e.g., "Delivery Problem")
   - Customer's initial description
   - Related order ID (if provided) with order details
6. Admin sees options:
   - **Reply to Customer**: Enter free-text reply → stores in customer's `chat_messages_v2` with sender_role='admin', updates status to pending_customer_reply
   - **Mark as Under Review**: Changes status to 'under_review' in `inquiries_v2`
   - **Mark as Resolved**: Changes status to 'resolved' in `inquiries_v2`
   - **Close Ticket**: Changes status to 'closed' in `inquiries_v2`
   - **End Chat**: Exits the review flow

**Key Implementation Details:**

- Admin's review happens in a new admin session, but actions update the customer's original session
- `inquiry_id` is passed via context from the ticket card click
- `customer_session_id` is retrieved by `fetch_ticket_for_admin` and stored in context
- Admin replies and status changes are written to the customer's session so customer can see them

### Data Flow

```
inquiries_v2
├── inquiry_id (PK)
├── display_id (TCK-XXXXX)
├── inquiry_type (quality/delivery/billing/other)
├── inquiry_status (new/under_review/pending_customer_reply/pending_admin_reply/resolved/closed)
├── customer_id (FK → customer)
├── session_id (FK → chat_sessions_v2)
├── order_id (FK → orders) [NEW]
└── timestamps (received_at, updated_at)

chat_sessions_v2
├── session_id (PK)
├── inquiry_id (FK → inquiries_v2)
├── customer_id
└── metadata (contains issue preview, title)

chat_messages_v2
├── message_id (PK)
├── session_id (FK → chat_sessions_v2)
├── sender_role (customer/admin/printy)
├── message_text_enc (encrypted message content)
└── sent_at
```

---

## Conversation Build-Up

All messages are stored in `chat_messages_v2` with `sender_role`:

- `'customer'` - Customer's messages (initial description, replies)
- `'admin'` - Admin's responses
- `'printy'` - System messages (confirmations, status changes)

Example conversation in database:

```
1. sender_role: 'customer' - "My order didn't arrive as expected..."
2. sender_role: 'admin' - "I'm sorry to hear that. Can you provide the tracking number?"
3. sender_role: 'customer' - "Sure, it's TRK-12345"
4. sender_role: 'admin' - "Thank you. I've checked with the courier..."
5. sender_role: 'printy' - "Ticket status changed to: Resolved"
```

Both customer and admin can view the full history by fetching all messages for the session ordered by `sent_at`.

---

## Status Transitions

```
new
  ↓
under_review (admin marks)
  ↓
pending_customer_reply (after admin replies)
  ↓
pending_admin_reply (after customer replies)
  ↓
resolved (admin or customer marks)
  or
closed (admin marks)
```

---

## Testing Checklist

### Before Testing

- [ ] Run migration 063 in Supabase
- [ ] Update issue-ticket flow in chat_flows_v2
- [ ] Insert track-ticket flow in chat_flows_v2
- [ ] Deploy code changes

### Customer Tests

- [ ] Create ticket without order_id
- [ ] Create ticket with order_id
- [ ] View ticket in ticket history
- [ ] Track ticket shows conversation
- [ ] Reply to admin
- [ ] Verify status changes to pending_admin_reply
- [ ] Mark ticket as resolved

### Admin Tests

- [ ] View tickets in admin panel
- [ ] See ticket with order_id
- [ ] Open ticket and view conversation
- [ ] Reply to customer
- [ ] Verify status changes to pending_customer_reply
- [ ] Change status manually
- [ ] View customer replies

### Data Verification

- [ ] Messages appear in chat_messages_v2
- [ ] No data in old inquiries table
- [ ] order_id foreign key works
- [ ] RLS policies prevent unauthorized access
- [ ] Display IDs generate correctly (TCK-XXXXXX)

---

## Backward Compatibility

- Old `inquiries` table remains untouched
- Existing tickets in old table are still accessible via old queries
- New tickets use `inquiries_v2`
- No data migration needed (clean separation)

---

## Future Enhancements

1. **Data Migration Tool**: Script to migrate old inquiries to inquiries_v2 if needed
2. **Unified View**: Create view that unions old and new inquiries for complete history
3. **Email Notifications**: Trigger emails on status changes
4. **SLA Tracking**: Add response time tracking
5. **Admin Assignment**: Allow assigning tickets to specific admins
6. **Priority Levels**: Add priority field (low, medium, high, urgent)

---

## Files Changed

### New Files

- `supabase/migrations/063_create_inquiries_v2.sql`
- `supabase/migrations/064_update_chat_sessions_inquiry_fk.sql` - Fixes FK constraint
- `src/features/chat/actions/customer/trackTicket.ts`
- `src/features/chat/actions/admin/fetchTicketForAdmin.ts`
- `src/features/chat/actions/admin/replyToTicket.ts`
- `src/features/chat/actions/admin/changeTicketStatus.ts`
- `docs_guide/issue-ticket-v2.json`
- `docs_guide/track-ticket.json`
- `docs_guide/admin-review-ticket.json`
- `docs_guide/ISSUE_TICKET_V2_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified Files

- `src/features/chat/actions/customer/createInquiry.ts`
- `src/features/chat/actions/customer/index.ts`
- `src/features/chat/actions/admin/index.ts`
- `src/admin/hooks/useAdminTickets.ts`
- `src/admin/hooks/useAdminChat.ts` - Added inquiry_id context and admin-review-ticket flow initialization
- `src/admin/hooks/useAdminConversations.tsx` - Updated FK join from inquiries to inquiries_v2
- `src/features/chat/hooks/admin/useAdminTickets.ts`
- `src/customer/components/dashboard/ticketHistory/TicketHistory.tsx`
- `src/features/chat/api/sessionQueries.ts` - Updated FK joins from inquiries to inquiries_v2 (4 occurrences)

---

## Support

For questions or issues:

1. Check CHAT_FLOW_STATUS_GUIDE.md for status definitions
2. Review flow JSON files for flow structure
3. Check migration file for database schema
4. Review action handler files for business logic

---

**Implementation Date:** October 21, 2025  
**Status:** Code Complete - Awaiting Database Migration
