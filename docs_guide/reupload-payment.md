# Reupload Payment Flow Implementation

## Overview

Create the `reupload-payment` customer chat flow that allows customers to reupload payment proof after admin denial or cancel their order. This flow integrates with the existing admin payment verification system.

## Implementation Phases

### Phase 1: Database Setup (Migration)

**Goal:** Insert the flow definition into the database

**Tasks:**

1. Run the migration file `supabase/migrations/056_insert_reupload_payment_flow.sql`
2. Verify the flow exists in `chat_flows_v2` table
3. Confirm flow structure and nodes are correct

**Validation:**

```sql
SELECT flow_id, flow_owner, active
FROM chat_flows_v2
WHERE flow_id = 'reupload-payment';
```

**Dependencies:** None
**Estimated Time:** 5-10 minutes

---

### Phase 2: Flow Initialization Action

**Goal:** Create the action that fetches the denial reason from admin-verify-payment session

**Tasks:**

1. Create `src/features/chat/actions/customer/fetchDenialReason.ts`
2. Implement Supabase query to fetch denial reason from correct session
3. Store denial reason in current session metadata context
4. Add error handling with `withErrorHandling()` wrapper
5. Export action in `src/features/chat/actions/customer/index.ts`

**Key Implementation Details:**

- Query `chat_sessions_v2` where `flow_id = 'admin-verify-payment'`
- Match by `order_id` in metadata context
- Get most recent ended session
- Extract `denial_reason` and `admin_denial_message`

**Dependencies:** Phase 1
**Estimated Time:** 30-45 minutes

---

### Phase 3: Reupload Payment Action

**Goal:** Handle payment proof file upload and update order

**Tasks:**

1. Create `src/features/chat/actions/customer/reuploadPaymentProof.ts`
   - OR modify existing `uploadPaymentProofImage.ts` to handle reuploads
2. Implement file upload to Supabase Storage
3. Update order record:
   - Set `payment_proof` to new URL
   - Set `payment_proof_uploaded_at` to NOW()
   - Set `status` to 'verifying_payment'
   - Clear `payment_denied_at` and `payment_denied_by`
4. Add error handling with `withErrorHandling()` wrapper
5. Export action in `src/features/chat/actions/customer/index.ts`

**Dependencies:** Phase 2
**Estimated Time:** 45-60 minutes

---

### Phase 4: Cancel Order Action

**Goal:** Allow customers to cancel their order with a reason

**Tasks:**

1. Create `src/features/chat/actions/customer/cancelOrder.ts`
2. Capture cancellation reason from user input
3. Update order:
   - Set `status` to 'cancelled'
   - Store reason in session metadata (not in orders table)
4. Add error handling with `withErrorHandling()` wrapper
5. Export action in `src/features/chat/actions/customer/index.ts`

**Dependencies:** Phase 2
**Estimated Time:** 30-45 minutes

---

### Phase 5: UI Integration

**Goal:** Add "Reupload Payment" button to customer dashboard

**Tasks:**

1. Update `src/customer/components/dashboard/OrderCard.tsx`
2. Implement button display logic:
   - Show "Pay Now" when `order.status === 'awaiting_payment'`
   - Show "Reupload Payment" when `order.status === 'reupload_payment'`
   - Hide buttons for all other statuses
3. Wire buttons to trigger respective chat flows
4. Ensure proper order_id is passed to the flow

**Dependencies:** Phases 1-4
**Estimated Time:** 30-45 minutes

---

### Phase 6: Testing & Validation

**Goal:** Ensure the entire flow works end-to-end

**Tasks:**

1. Test denial reason retrieval from admin-verify-payment session
2. Test reupload functionality with actual file
3. Test order status transitions
4. Test cancellation flow with reason storage
5. Test UI button visibility based on order status
6. Verify error handling for edge cases

**Test Scenarios:**

- Order with `reupload_payment` status shows correct button
- Customer can see admin's denial reason
- Customer can reupload payment proof successfully
- Order status changes to `verifying_payment` after reupload
- Denial fields are cleared after reupload
- Customer can cancel order with reason
- Cancellation reason stored in session metadata
- Order status changes to `cancelled` after cancellation
- End chat option works correctly

**Dependencies:** Phase 5
**Estimated Time:** 60-90 minutes

---

### Total Estimated Time: 3.5 - 5 hours

## Implementation Steps

### 1. Update Button Display Logic

**File:** `src/customer/components/dashboard/OrderCard.tsx` (or relevant order display component)

Update the payment button logic to show:

- "Pay Now" button when `order.status === 'awaiting_payment'`
- "Reupload Payment" button when `order.status === 'reupload_payment'`
- Hide buttons for all other statuses

Both buttons should trigger their respective chat flows.

### 2. Create Flow Initialization Action Handler

**File:** `src/features/chat/actions/customer/fetchDenialReason.ts`

Create new action that runs when the reupload-payment flow starts:

- Receives `order_id` from session metadata or user input
- Queries `chat_sessions_v2` to find the most recent `admin-verify-payment` session for this order
- Extracts `denial_reason` and `admin_denial_message` from session metadata
- Stores denial reason in current session's metadata context
- Uses `withErrorHandling()` wrapper
- Returns success (flow continues to greeting node)

**Query to use:**

```sql
SELECT
  s.metadata->'context'->>'denial_reason' as denial_reason,
  s.metadata->'context'->>'admin_denial_message' as admin_denial_message
FROM chat_sessions_v2 s
WHERE s.flow_id = 'admin-verify-payment'
  AND s.metadata->'context'->>'order_id' = $1
  AND s.status = 'ended'
ORDER BY s.created_at DESC
LIMIT 1;
```

### 3. Create Reupload Payment Action Handler

**File:** `src/features/chat/actions/customer/reuploadPaymentProof.ts`

Create new action that:

- Handles file upload for reuploading payment proof
- Updates order record:
  - `payment_proof` = new image URL
  - `payment_proof_uploaded_at` = NOW()
  - `status` = 'verifying_payment'
  - Clear denial fields: `payment_denied_at` = NULL, `payment_denied_by` = NULL
  - `updated_at` = NOW()
- Uses `withErrorHandling()` wrapper
- Returns success message

**OR** modify existing `uploadPaymentProofImage.ts` to handle both initial upload and reupload scenarios.

### 4. Create Cancel Order Action Handler

**File:** `src/features/chat/actions/customer/cancelOrder.ts`

Create new action that:

- Captures customer's cancellation reason from user input
- Stores `cancellation_reason` in session metadata context
- Updates order status to 'cancelled'
- Uses `withErrorHandling()` wrapper
- Returns confirmation message

### 5. Create Flow Definition in Database

Flow structure:

```
start → greeting → denial_notice → show_denial_reason → ask_action →
  [reupload_path] → request_upload → handle_upload → success_message → end
  [cancel_path] → ask_cancel_reason → handle_cancel → cancel_confirmation → end
  [end_chat] → end
```

**Nodes:**

- `greeting` - Welcome message with order details
- `denial_notice` - "Your payment has been denied"
- `show_denial_reason` - Display admin's denial reason from metadata context
- `ask_action` - Present options with quick replies (Reupload / Cancel / End)
- `request_upload` - Instruct customer to use attachment button
- `handle_upload` - Process file upload (action: reuploadPaymentProof)
- `success_message` - Confirmation that proof is being verified
- `ask_cancel_reason` - Request cancellation reason (text input)
- `handle_cancel` - Process cancellation (action: cancelOrder)
- `cancel_confirmation` - Order cancelled message

### 6. Create Database Migration

**File:** `supabase/migrations/056_insert_reupload_payment_flow.sql`

✅ **SQL migration file has been created** with the complete flow definition.

The migration inserts the reupload-payment flow into `chat_flows_v2` table with:

- `flow_id` = 'reupload-payment'
- `flow_owner` = 'customer'
- `active` = true
- `flow_definition` = Complete JSON structure with all nodes

**Key features:**

- Uses `ON CONFLICT` to allow re-running the migration
- Includes proper message formatting with variable interpolation ({{display_id}}, {{denial_reason}}, etc.)
- Three action paths: Reupload, Cancel, or End Chat

### 7. Register Action Handlers

**File:** `src/features/chat/actions/customer/index.ts`

Export new actions:

- `reuploadPaymentProof` (or use modified `uploadPaymentProofImage`)
- `cancelOrder`

Update action registry to include these handlers.

## Key Technical Details

### Retrieving the Denial Reason - CRITICAL IMPLEMENTATION DETAIL

**The Problem:**

- Orders table has `session_id` that links to the `admin-create-order` flow session
- The `denial_reason` is stored in the `admin-verify-payment` flow session (NOT in admin-create-order)
- We need to query the correct session to retrieve the denial reason

**The Solution:**

When initializing the `reupload-payment` flow, use this query to fetch the denial reason:

```sql
SELECT
  s.metadata->'context'->>'denial_reason' as denial_reason,
  s.metadata->'context'->>'admin_denial_message' as admin_denial_message
FROM chat_sessions_v2 s
WHERE s.flow_id = 'admin-verify-payment'
  AND s.metadata->'context'->>'order_id' = '<order_id>'
  AND s.status = 'ended'
ORDER BY s.created_at DESC
LIMIT 1;
```

This query:

1. Filters for `admin-verify-payment` sessions (where denials are stored)
2. Matches the order_id in the session's metadata context
3. Gets only ended sessions (denial completes the flow)
4. Orders by most recent (in case of multiple denials)
5. Returns the denial_reason/admin_denial_message

**Implementation in Flow Initialization:**

The flow initialization action should:

1. Receive `order_id` as input parameter
2. Query the admin-verify-payment session for this order
3. Extract `denial_reason` from the session metadata
4. Store it in the new reupload-payment session's metadata context
5. Pass it to the flow for display

### Session Metadata Context

```json
{
  "order_id": "uuid",
  "denial_reason": "Admin's denial reason (fetched from admin-verify-payment session)",
  "admin_denial_message": "Admin's denial message (same as denial_reason)",
  "cancellation_reason": "Customer's reason" // if cancelled
}
```

### Order Status Flow

- Admin denies: `verifying_payment` → `reupload_payment`
- Customer reuploads: `reupload_payment` → `verifying_payment`
- Customer cancels: `reupload_payment` → `cancelled`

### Database Updates (Cancel Order)

- Set `orders.status = 'cancelled'`
- `orders.updated_at` auto-updates
- Store reason in session metadata only (no table column)

### Database Updates (Reupload)

- Update `orders.payment_proof` with new URL
- Update `orders.payment_proof_uploaded_at`
- Set `orders.status = 'verifying_payment'`
- Clear `orders.payment_denied_at` and `orders.payment_denied_by`

## Files to Modify/Create

**New Files:**

- `src/features/chat/actions/customer/reuploadPaymentProof.ts` (or modify existing)
- `src/features/chat/actions/customer/cancelOrder.ts`
- `src/features/chat/actions/customer/fetchDenialReason.ts` (flow initialization action)
- `supabase/migrations/056_insert_reupload_payment_flow.sql`

**Modified Files:**

- `src/customer/components/dashboard/OrderCard.tsx` (button logic)
- `src/features/chat/actions/customer/index.ts` (register actions)

## Summary of Solution

### The Challenge

The main technical challenge was that the `denial_reason` is stored in the `admin-verify-payment` session, but the `orders` table's `session_id` field points to the `admin-create-order` session. This means we can't simply follow the foreign key relationship to get the denial reason.

### The Solution

1. **Flow Initialization Action**: Created `fetchDenialReason` action that queries `chat_sessions_v2` to find the correct `admin-verify-payment` session by matching the `order_id` in the session metadata.

2. **SQL Query**: The query filters for:
   - `flow_id = 'admin-verify-payment'` (where denials are stored)
   - Order ID match in metadata context
   - Status = 'ended' (completed denial flows)
   - Most recent session (ORDER BY created_at DESC)

3. **Flow Structure**: The flow starts by fetching the denial reason, then displays it to the customer, and offers three options: reupload, cancel, or end chat.

### Files Created

- ✅ `supabase/migrations/056_insert_reupload_payment_flow.sql` - Complete flow definition ready to insert

### Files Created (Implementation Complete)

- ✅ `src/features/chat/actions/customer/fetchDenialReason.ts`
- ✅ `src/features/chat/actions/customer/reuploadPaymentProof.ts`
- ✅ `src/features/chat/actions/customer/cancelOrder.ts`
- ✅ `src/customer/components/dashboard/recentOrders/ReuploadPaymentButton.tsx`
- ✅ Updated `src/features/chat/actions/customer/index.ts`
- ✅ Updated `src/features/chat/hooks/customer/useDashboardChatEvents.ts`
- ✅ Updated `src/customer/components/dashboard/recentOrders/RecentOrder.tsx`
- ✅ Updated `src/customer/components/dashboard/orderHistory/OrderHistory.tsx`

## Implementation Complete

All phases (1-5) have been completed. Actions now execute logic only - no hardcoded messages. All messaging is handled by the JSONB flow definition.

## Testing Checklist

- [ ] "Reupload Payment" button shows only when status is `reupload_payment`
- [ ] "Pay Now" button shows only when status is `awaiting_payment`
- [ ] Customer can see admin's denial reason
- [ ] Customer can successfully reupload payment proof
- [ ] Order status changes to `verifying_payment` after reupload
- [ ] Denial fields are cleared after reupload
- [ ] Customer can cancel order with reason
- [ ] Cancellation reason stored in session metadata
- [ ] Order status changes to `cancelled`
- [ ] End chat option works correctly
