# 🔔 Notification System Implementation TODO

## 📋 Overview

Implement real-time notifications that listen to Supabase table updates for orders, quotes, and tickets. The system will be client-side persistent with no new database tables required.

## 🎯 Core Concept

- **Listen to existing table changes** (orders, quotes, tickets)
- **Client-side state management** for notifications
- **Real-time updates** via Supabase Realtime subscriptions
- **Persistent storage** using localStorage/sessionStorage
- **Role-based filtering** (admin sees all, customer sees only their data)

## 📊 Tables to Monitor

### 1. orders Table

```sql
-- Monitor these fields for changes:
- status (new orders, status updates)
- created_at (new orders)
- updated_at (status changes)
- customer_id (for customer filtering)
```

### 2. Quotes Table

```sql
-- Monitor these fields for changes:
- status (new quotes, status updates)
- created_at (new quotes)
- updated_at (status changes)
- customer_id (for customer filtering)
```

### 3. Inquiries Table

```sql
-- Monitor these fields for changes:
- status (new tickets, status updates)
- created_at (new tickets)
- updated_at (status changes)
- customer_id (for customer filtering)
```

## 🔧 Implementation Steps

### Step 1: Create Notification Service

**File**: `src/services/NotificationService.ts`

```typescript
// Core notification service with Supabase Realtime subscriptions
class NotificationService {
  // Subscribe to table changes
  // Filter by user role and permissions
  // Transform database events to notification objects
  // Manage client-side notification state
}
```

**Features needed:**

- [ ] Supabase Realtime subscription setup
- [ ] Event filtering by user role (admin/customer)
- [ ] Notification deduplication logic
- [ ] Client-side notification storage
- [ ] Auto-cleanup of old notifications

### Step 2: Create Notification Context

**File**: `src/contexts/NotificationContext.tsx`

```typescript
// React context for global notification state
interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}
```

**Features needed:**

- [ ] Global notification state management
- [ ] Persistence with localStorage
- [ ] Real-time updates from NotificationService
- [ ] User session handling

### Step 3: Update Notification Component

**File**: `src/components/shared/Notification.tsx`

**Changes needed:**

- [ ] Replace mock data with real notifications from context
- [ ] Add real-time notification updates
- [ ] Implement proper notification types (order, quote, ticket)
- [ ] Add click handlers to navigate to relevant pages
- [ ] Add notification categories/filtering

### Step 4: Database Permissions Setup

**File**: `supabase/sql/notifications/setup_realtime.sql`

```sql
-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- Set up RLS policies for realtime access
-- Admin can see all changes
-- Customers can only see their own changes
```

**Features needed:**

- [ ] Enable Realtime publication for tables
- [ ] Configure RLS policies for realtime access
- [ ] Test realtime permissions

### Step 5: Notification Types & Mapping

**File**: `src/types/notifications.ts`

```typescript
// Define notification types and mapping logic
type NotificationType =
  | 'order_created'
  | 'order_updated'
  | 'quote_created'
  | 'quote_updated'
  | 'ticket_created'
  | 'ticket_updated';

interface DatabaseEvent {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
}

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  timestamp: string;
  isRead: boolean;
  userId: string;
}
```

**Features needed:**

- [ ] Define all notification types
- [ ] Create mapping functions (DB event → Notification)
- [ ] Handle different user roles
- [ ] Generate human-readable messages

## 🔄 Real-time Flow

```
1. Database Change (Order/Quote/Ticket)
   ↓
2. Supabase Realtime Event
   ↓
3. NotificationService receives event
   ↓
4. Filter by user role & permissions
   ↓
5. Transform to notification object
   ↓
6. Add to NotificationContext state
   ↓
7. Persist to localStorage
   ↓
8. Update Notification component UI
   ↓
9. Show bell badge with unread count
```

## 💾 Persistence Strategy

### localStorage Structure

```typescript
interface StoredNotifications {
  notifications: NotificationItem[];
  lastCleanup: string;
  userId: string;
  userRole: 'admin' | 'customer';
}
```

**Features needed:**

- [ ] Store notifications in localStorage
- [ ] Auto-cleanup old notifications (7 days)
- [ ] Handle user logout/login scenarios
- [ ] Sync with server on app load

## 🎨 UI Enhancements

### Notification Categories

- [ ] **Orders**: Blue badge, order icon
- [ ] **Quotes**: Green badge, quote icon
- [ ] **Tickets**: Orange badge, ticket icon

### Click Actions

- [ ] **Order notifications** → Navigate to Orders page
- [ ] **Quote notifications** → Navigate to Quotes page
- [ ] **Ticket notifications** → Navigate to Tickets page

### Sound & Visual Cues

- [ ] Browser notification permission request
- [ ] Subtle sound for new notifications
- [ ] Toast notifications for important updates

## 🧪 Testing Strategy

### Unit Tests

- [ ] NotificationService subscription logic
- [ ] Event filtering by user role
- [ ] Notification deduplication
- [ ] localStorage persistence

### Integration Tests

- [ ] Real-time subscription setup
- [ ] Cross-tab notification sync
- [ ] User role switching scenarios

### Manual Testing

- [ ] Create order/quote/ticket → Verify notification
- [ ] Update status → Verify notification
- [ ] Test admin vs customer views
- [ ] Test notification persistence across sessions

## 🔒 Security Considerations

### RLS Policies

```sql
-- Ensure customers can only see their own notifications
-- Ensure admins can see all notifications
-- Prevent notification data leakage
```

### Client-side Security

- [ ] Validate notification data before display
- [ ] Sanitize notification messages
- [ ] Handle malformed realtime events

## 📈 Performance Considerations

### Optimization Strategies

- [ ] Debounce rapid status updates
- [ ] Limit notification history (max 100 items)
- [ ] Lazy load notification data
- [ ] Cleanup old subscriptions on unmount

### Memory Management

- [ ] Remove old notifications from memory
- [ ] Clear unused realtime subscriptions
- [ ] Optimize re-renders with proper memoization

## 🚀 Deployment Checklist

### Database Setup

- [ ] Enable Realtime on production
- [ ] Configure RLS policies
- [ ] Test realtime permissions

### Application Setup

- [ ] Deploy NotificationService
- [ ] Deploy NotificationContext
- [ ] Update Notification component
- [ ] Test end-to-end flow

### Monitoring

- [ ] Monitor realtime connection health
- [ ] Track notification delivery rates
- [ ] Monitor client-side performance

## 📝 Implementation Priority

### Phase 1 (Core Functionality)

1. ✅ Create NotificationService with basic subscriptions
2. ✅ Set up NotificationContext
3. ✅ Update Notification component to use real data
4. ✅ Implement basic persistence

### Phase 2 (Enhancements)

1. ✅ Add notification categories and icons
2. ✅ Implement click-to-navigate functionality
3. ✅ Add sound and visual enhancements
4. ✅ Improve notification deduplication

### Phase 3 (Polish)

1. ✅ Add comprehensive testing
2. ✅ Implement advanced filtering
3. ✅ Add notification preferences
4. ✅ Performance optimizations

## 🎯 Success Criteria

- [ ] **Real-time**: Notifications appear within 1-2 seconds of database changes
- [ ] **Accurate**: Only show relevant notifications based on user role
- [ ] **Persistent**: Notifications survive page refreshes and sessions
- [ ] **Performant**: No impact on page load times or memory usage
- [ ] **User-friendly**: Clear, actionable notification messages

---

**Estimated Implementation Time**: 2-3 days for core functionality
**Complexity**: Medium (requires Supabase Realtime knowledge)
**Dependencies**: Supabase Realtime, React Context, localStorage API

---

## 🛠 Debugging Notes — notify_quote_events Trigger Function

- Problem: Creating a quote failed with error 42703: record "NEW" has no field "id".
  - Root cause: The trigger function `public.notify_quote_events()` referenced `NEW.id`, but the `quotes` table primary key is `quote_id`.
  - Fix: Replace `NEW.id` with `NEW.quote_id` everywhere in the function.

- Problem: Error 42P01: relation "users" does not exist.
  - Root cause: The function selected admin recipients from a non-existent `users` table.
  - Fix: Select admin recipients from `public.customer` using `customer_type in ('admin','superadmin')`.

- Problem: Testing an INSERT snippet with `NEW.*` raised “missing FROM-clause entry for table NEW”.
  - Root cause: `NEW` is only available inside a row-level trigger/body.
  - Fix: Test inside the trigger function, or substitute `NEW.*` with concrete values (e.g., a CTE) when running ad-hoc queries.

- Final function body used:

```sql
create or replace function public.notify_quote_events()
returns trigger
language plpgsql
as $function$
begin
  -- Notify customer
  insert into notifications (user_id, source_type, source_id, title, message, type, category)
  values (
    NEW.customer_id,
    'quote',
    NEW.quote_id,
    'Quote Update',
    'Your quote #' || NEW.display_id || ' is now "' || NEW.status || '".',
    'info',
    'quote'
  );

  -- Notify admins from public.customer
  insert into notifications (user_id, source_type, source_id, title, message, type, category)
  select c.customer_id, 'quote', NEW.quote_id,
         'Quote Event',
         'Quote #' || NEW.display_id || ' updated by customer (' || NEW.status || ').',
         'warning', 'quote'
  from public.customer c
  where c.customer_type in ('admin', 'superadmin');

  return NEW;
end;
$function$;
```

These changes resolved the creation errors and ensured notifications are sent to admins.

---

## 🛠 Debugging Notes — notify_order_events Trigger Function

- Problem: Updating orders failed with error 42703: record "new" has no field "id".
  - Root cause: The trigger function `public.notify_order_events()` referenced `NEW.id`, but the `orders` table primary key is `order_id`.
  - Fix: Replace `NEW.id` with `NEW.order_id` everywhere in the function.

- Problem: Error 42P01: relation "users" does not exist.
  - Root cause: The function tried to select admin recipients from a non-existent `users` table with a `role` column.
  - Fix: Select admin recipients from `public.customer` using `customer_type = 'admin'`.

- Problem: Trigger failing when adding new columns (e.g., `denial_reason`) to orders table.
  - Root cause: The trigger was trying to access non-existent admin notification logic.
  - Fix: Simplified trigger to only notify customers (admin notifications handled separately).

- Final function body used:

```sql
create or replace function public.notify_order_events()
returns trigger
language plpgsql
as $function$
begin
  -- Notify customer
  insert into notifications (customer_id, source_type, source_id, title, message, type, category)
  values (
    NEW.customer_id,
    'order',
    NEW.order_id,
    'Order Update',
    'Your order #' || NEW.display_id || ' status changed to "' || NEW.status || '".',
    'info',
    'order'
  );

  -- Notify admins (customers with customer_type = 'admin')
  insert into notifications (customer_id, source_type, source_id, title, message, type, category)
  select customer_id, 'order', NEW.order_id,
         'Order Update',
         'Order #' || NEW.display_id || ' (' || NEW.status || ') updated by customer.',
         'warning', 'order'
  from customer where customer_type = 'admin';

  return NEW;
end;
$function$;
```

### Related Migration: Add denial_reason Column

**Migration:** `057_add_denial_reason_to_orders_v3`

- Added `denial_reason TEXT` column to `orders` table
- Enables storing payment denial reasons directly in orders table
- Allows customers to access denial reasons without violating RLS policies
- Backfilled existing denied orders with denial reasons from admin-verify-payment sessions

### Updated denyPayment Action

- Now populates `orders.denial_reason` when admin denies payment
- Ensures denial reasons are accessible to customers through RLS-compliant queries
- Updated JSDoc to reflect dual storage (orders table + session metadata)

---

## 🛠 Debugging Notes — notify_customer_on_proposal_update Trigger Function

- Problem: Updating quote_proposals failed with error 42703: column qp.conversation_id does not exist.
  - Root cause: The trigger function `notify_customer_on_proposal_update()` was trying to access `qp.conversation_id` from the `quote_proposals` table, but this column doesn't exist.
  - Additional issue: The function was also trying to query a non-existent `quote_conversations` table.

- Problem: Error 2BP01: cannot drop function notify_customer_on_proposal_update() because other objects depend on it.
  - Root cause: The trigger `trg_quote_proposal_updated_notifications` depends on the function.
  - Fix: Use `DROP FUNCTION ... CASCADE` to drop both the function and dependent trigger, then recreate both.

- Root cause analysis:
  - The `quote_proposals` table has a `session_id` column that references `chat_sessions_v2.session_id`
  - The `chat_sessions_v2` table contains both `customer_id` and `quote_id` columns
  - The original function was using an outdated schema that referenced non-existent tables and columns

- Final function body used:

```sql
-- Drop the existing function with CASCADE to handle the trigger dependency
DROP FUNCTION IF EXISTS notify_customer_on_proposal_update() CASCADE;

-- Create the corrected function
CREATE OR REPLACE FUNCTION notify_customer_on_proposal_update()
RETURNS TRIGGER AS $$
declare
  v_customer_id uuid;
  v_quote_id uuid;
begin
  -- Find customer and quote for this proposal using session_id
  select cs.customer_id, cs.quote_id into v_customer_id, v_quote_id
  from chat_sessions_v2 cs
  where cs.session_id = new.session_id;

  if v_customer_id is null then
    return new;
  end if;

  insert into notifications (id, customer_id, title, message, type, category, is_read, created_at)
  values (
    gen_random_uuid(),
    v_customer_id,
    'Quote updated by admin',
    'Your quote has an update from the admin. Please review the latest proposal.',
    'info',
    'quote',
    false,
    now()
  );

  return new;
end;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trg_quote_proposal_updated_notifications
AFTER UPDATE ON quote_proposals
FOR EACH ROW
EXECUTE FUNCTION notify_customer_on_proposal_update();
```

- Key changes made:
  - Removed references to non-existent `conversation_id` column
  - Removed references to non-existent `quote_conversations` table
  - Used `session_id` to join with `chat_sessions_v2` table
  - Simplified the logic to get `customer_id` and `quote_id` directly from `chat_sessions_v2`
  - Used `DROP ... CASCADE` to handle trigger dependencies

This fix resolved the "column qp.conversation_id does not exist" error and ensured quote proposal notifications work correctly.

---

## 🛠 Debugging Notes — Critical Notification Function Errors

### notify_payment_events Function - CRITICAL ISSUES

- Problem: Multiple column reference errors in `notify_payment_events()` function.
  - Root cause: Function references columns that don't exist in the `payments` table:
    - `NEW.id` → should be `NEW.payment_id` (primary key)
    - `NEW.customer_id` → doesn't exist in payments table
    - `NEW.status` → should be `NEW.payment_status`
    - `NEW.order_display_id` → doesn't exist in payments table
    - `NEW.customer_name` → doesn't exist in payments table
  - Additional issue: References non-existent `users` table instead of `customer` table

- Table structure mismatch:
  - `payments` table columns: `payment_id`, `order_id`, `quote_id`, `payment_amount`, `payment_status`, `payment_method`, `paid_datetime`
  - Function was written for a different schema

- Fix required: Complete rewrite of the function to:
  - Use correct primary key (`payment_id`)
  - Join with `orders` table to get customer info
  - Use correct status column (`payment_status`)
  - Reference `customer` table for admin notifications

### notify_ticket_events Function - CRITICAL ISSUES

- Problem: Column reference errors in `notify_ticket_events()` function.
  - Root cause: Function references columns that don't match the `inquiries` table:
    - `NEW.id` → should be `NEW.inquiry_id` (primary key)
    - `NEW.status` → should be `NEW.inquiry_status`
  - Additional issue: References non-existent `users` table instead of `customer` table

- Table structure mismatch:
  - `inquiries` table columns: `inquiry_id`, `customer_id`, `inquiry_status`, `display_id`, `inquiry_type`, `inquiry_message_enc`, `resolution_comments`, `received_at`, `updated_at`, `session_id`
  - Function was written for a different schema

- Fix required: Update function to:
  - Use correct primary key (`inquiry_id`)
  - Use correct status column (`inquiry_status`)
  - Reference `customer` table for admin notifications

### Functions That Are Working Correctly

- `notify_order_events()` - ✓ Uses correct columns (`order_id`, `customer_id`, `display_id`, `status`)
- `notify_quote_events()` - ✓ Uses correct columns (`quote_id`, `customer_id`, `display_id`, `status`)
- `notify_admins_on_quote_created()` - ✓ Uses correct columns and references
- `notify_customer_on_proposal_update()` - ✓ Fixed in previous debugging session

### SQL Fixes Required

```sql
-- Fix notify_payment_events function
DROP FUNCTION IF EXISTS notify_payment_events() CASCADE;

CREATE OR REPLACE FUNCTION notify_payment_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Get order and customer info from related tables
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT
    o.customer_id,
    'payment',
    NEW.payment_id,
    'Payment Update',
    'Payment for order #' || COALESCE(o.display_id, o.order_id::text) || ' is now "' || NEW.payment_status || '".',
    CASE
      WHEN NEW.payment_status = 'approved' THEN 'success'
      WHEN NEW.payment_status = 'rejected' THEN 'error'
      ELSE 'info'
    END,
    'payment'
  FROM orders o
  WHERE o.order_id = NEW.order_id;

  -- Notify admins
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT
    c.customer_id,
    'payment',
    NEW.payment_id,
    'Payment Event',
    'Payment for order #' || COALESCE(o.display_id, o.order_id::text) || ' status changed to "' || NEW.payment_status || '".',
    'warning',
    'payment'
  FROM customer c
  CROSS JOIN orders o
  WHERE c.customer_type = 'admin'
  AND o.order_id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_payment_notifications
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_events();

-- Fix notify_ticket_events function
DROP FUNCTION IF EXISTS notify_ticket_events() CASCADE;

CREATE OR REPLACE FUNCTION notify_ticket_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  VALUES (
    NEW.customer_id,
    'ticket',
    NEW.inquiry_id,
    'Ticket Update',
    'Your support ticket #' || COALESCE(NEW.display_id, NEW.inquiry_id::text) || ' is now "' || NEW.inquiry_status || '".',
    'info',
    'ticket'
  );

  -- Notify admins
  INSERT INTO notifications (customer_id, source_type, source_id, title, message, type, category)
  SELECT
    c.customer_id,
    'ticket',
    NEW.inquiry_id,
    'Ticket Update',
    'Support ticket #' || COALESCE(NEW.display_id, NEW.inquiry_id::text) || ' status changed to "' || NEW.inquiry_status || '".',
    'warning',
    'ticket'
  FROM customer c
  WHERE c.customer_type = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_ticket_notifications
AFTER INSERT OR UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION notify_ticket_events();
```

### Impact Assessment

- **High Priority**: `notify_payment_events` and `notify_ticket_events` functions are completely broken
- **Risk**: These functions will cause database errors whenever payments or tickets are updated
- **Scope**: Affects payment processing and customer support ticket notifications
- **Dependencies**: Both functions have active triggers that need to be recreated

### Prevention Measures

- Always verify table schema before writing trigger functions
- Use `information_schema.columns` to check available columns
- Test trigger functions with sample data before deployment
- Document table relationships and primary key names
