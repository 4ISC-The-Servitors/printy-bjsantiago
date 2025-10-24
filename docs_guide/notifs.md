# Fix Notification System - Role-Specific Notifications

## Problem Summary

Current notification triggers send notifications to BOTH customers and admins for every event, causing confusion. For example, when a customer uploads payment proof, they receive a notification about their own action. Only the OTHER party should be notified.

## Solution Approach

1. Add `updated_by` tracking to orders and tickets
2. Fix database trigger functions to detect WHO initiated the change
3. Only notify the OTHER party (not the initiator)
4. Test in-app notifications thoroughly
5. LATER: Add notification preferences storage and email notifications

## Implementation Steps

### Phase 1: Database Schema Updates

**Migration 1: Add updated_by column to orders table**

- Add `updated_by uuid REFERENCES customer(customer_id)`
- Index on `updated_by` for performance
- Update existing records to set appropriate default values

**Migration 2: Add updated_by column to inquiries_v2 table**

- Add `updated_by uuid REFERENCES customer(customer_id)`
- Index on `updated_by` for performance
- Update existing records to set appropriate default values

### Phase 2: Fix Trigger Functions

**Fix notify_order_events() function**

- Copy logic from `notify_quote_events()` which correctly detects sender role
- Determine `v_sender_role` based on:
- INSERT operations → always customer-initiated → notify admins only
- UPDATE operations → check `updated_by` vs `customer_id`
- If `updated_by` is NULL, use old logic as fallback
- Only notify the OTHER party:
- Customer-initiated → notify admins only
- Admin-initiated → notify customer only

**Fix notify_ticket_events() function**

- Same logic as orders
- Detect sender role from `updated_by` and operation type
- For INSERT: always customer-initiated → notify admins only
- For UPDATE: check `updated_by` to determine sender

### Phase 3: Frontend Updates - Add updated_by tracking

**Update order mutation calls to include updated_by:**

- Payment proof upload (customer action)
- Payment verification (admin action)
- Payment denial (admin action)
- Order status updates (admin action)
- Order cancellation (customer action)

**Update ticket mutation calls to include updated_by:**

- Ticket creation (customer action)
- Ticket status updates (admin action)
- Ticket resolution (admin action)

**Files to check/update:**

- Admin order management components
- Admin ticket management components
- Customer order/ticket related actions

### Phase 4: Testing In-App Notifications

**Test each notification scenario:**

1. Customer uploads payment → Only admin sees notification
2. Admin verifies payment → Only customer sees notification
3. Admin denies payment → Only customer sees notification
4. Customer creates ticket → Only admin sees notification
5. Admin updates ticket status → Only customer sees notification
6. Customer creates quote → Only admin sees notification (already working)
7. Admin sends proposal → Only customer sees notification (already working)

**Verify notification content:**

- Title is clear and descriptive
- Message provides context
- Notification appears in real-time
- Notification badge count updates correctly

### Phase 5: LOW PRIORITY - Email Notifications (EXCLUDED FOR NOW)

This phase will be implemented AFTER in-app notifications are tested and working:

- Create notification_preferences table
- Create send-notification-email Edge Function with Resend
- Update CustomerAccountSettings to save email preferences
- Configure database webhook for email triggers

## Files to Create/Modify

### New Files:

- `supabase/migrations/073_add_updated_by_to_orders.sql`
- `supabase/migrations/074_add_updated_by_to_inquiries_v2.sql`
- `supabase/migrations/075_fix_notify_order_events.sql`
- `supabase/migrations/076_fix_notify_ticket_events.sql`

### Modified Files:

- Admin order management components - Add `updated_by` to mutations
- Admin ticket management components - Add `updated_by` to mutations
- Customer order-related actions - Add `updated_by` where applicable

## Key Notification Logic Rules

| Event                 | Who Changed It | Who Gets Notified | Example Message                                             |
| --------------------- | -------------- | ----------------- | ----------------------------------------------------------- |
| Order created         | Customer       | Admin only        | "New order #ORD-XXX from [Customer Name]"                   |
| Payment uploaded      | Customer       | Admin only        | "Payment proof uploaded for order #ORD-XXX"                 |
| Payment verified      | Admin          | Customer only     | "Your payment for order #ORD-XXX has been verified"         |
| Payment denied        | Admin          | Customer only     | "Payment proof denied for order #ORD-XXX. Reason: [reason]" |
| Order status changed  | Admin          | Customer only     | "Order #ORD-XXX status: [new status]"                       |
| Ticket created        | Customer       | Admin only        | "New support ticket #TCK-XXX from [Customer Name]"          |
| Ticket status changed | Admin          | Customer only     | "Your ticket #TCK-XXX status: [new status]"                 |

## Notes

- `notify_quote_events()` already has correct logic - use as reference
- `updated_by` field allows us to definitively know who made the change
- For backward compatibility, include fallback logic when `updated_by` is NULL
- Email notifications intentionally excluded until in-app notifications are proven working
