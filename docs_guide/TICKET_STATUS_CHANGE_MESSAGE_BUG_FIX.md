# Ticket Status Change Message Bug Fix

**Date**: 2025-10-26  
**Status**: FIXED  
**Severity**: HIGH - Data Pollution Issue

---

## Problem Statement

When admin changes ticket status (Resolved/Closed), encrypted messages were being **inserted directly into the customer's original session**, polluting the conversation history with backend status change notifications.

### Observed Behavior

From chat UI screenshot:

- Customer creates ticket: "encrypted message test" + "No"
- System responds: "Your support ticket has been created! TCK-200131..."
- **BUG**: After admin resolves/closes ticket, encrypted status change messages appear:
  - `{"0":84,"1":105,"2":99,"3":107,"4":101,"5":116,"6":32,"7":115,"8":116,"9":97,"10":116,"11":117,"12":115,"13":32,"14":99,"15":104,"16":97,"17":110,"18":103,"19":101,"20":100,"21":2,"22":116,"23":111,"24":58,"25":32,"26":82,"27":101,"28":115,"29":111,"30":108,"31":118,"32":101,"33":100]}`
  - `{"0":84,"1":105,"2":99,"3":107,"4":101,"5":116,"6":32,"7":115,"8":116,"9":97,"10":116,"11":117,"12":115,"13":32,"14":99,"15":104,"16":97,"17":110,"18":103,"19":101,"20":100,"21":2,"22":116,"23":111,"24":58,"25":32,"26":67,"27":108,"28":111,"29":115,"30":101,"31":100}`

These messages appear **after** the conversation has already ended, polluting the original conversation.

---

## Root Cause

**File**: `src/features/chat/actions/admin/changeTicketStatus.ts`  
**Lines**: 79-93 (BEFORE FIX)

```typescript
// Insert status change notification in customer's session (if available)
const statusLabel = formatStatusLabel(newStatus);

if (customerSessionId) {
  const notificationText = `Ticket status changed to: ${statusLabel}`;
  const encryptedMessage = new TextEncoder().encode(notificationText);

  await supabase.from('chat_messages_v2').insert({
    session_id: customerSessionId, // ← WRONG: Inserts into original session
    sender_role: 'printy',
    message_text_enc: encryptedMessage,
    metadata: {
      action: 'status_change',
      old_status: context['previous_status'],
      new_status: newStatus,
    },
  });
}
```

**Problem**:

- Status change messages were inserted into the **original ticket session** (`customerSessionId`)
- This pollutes the conversation history with backend status notifications
- Messages appear as encrypted data in the UI (unreadable)

**Why it's wrong**:

- Original sessions should only contain the initial ticket creation flow
- Status changes should use notifications (already handled by database trigger)
- No need to pollute chat history with status updates

---

## Solution

**File**: `src/features/chat/actions/admin/changeTicketStatus.ts`  
**Lines**: 77-87 (AFTER FIX)

```typescript
// Status change notifications are handled by the database trigger (notifications table)
// Do NOT insert messages into the original session - this pollutes the conversation
const statusLabel = formatStatusLabel(newStatus);

messages.push({
  id: crypto.randomUUID(),
  role: 'printy',
  text: `Ticket status updated to: ${statusLabel}`,
  ts: Date.now(),
});
```

**Changes**:

1. **Removed** the code that inserts messages into `customerSessionId`
2. **Removed** unused `customerSessionId` variable
3. **Added** comment explaining that notifications are handled by database trigger
4. **Kept** the admin-facing confirmation message (only admin sees this)

**Result**:

- Status changes no longer pollute customer's original session
- Customer receives notifications via the notifications table (handled by database trigger)
- Clean conversation history preserved

---

## Proper Notification Flow

### Status Change Notifications

**Location**: `supabase/migrations/087_formatted_notif_triggers.sql`

```sql
-- Database trigger automatically creates notifications when inquiry_status changes
CREATE OR REPLACE FUNCTION notify_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.inquiry_status != NEW.inquiry_status THEN
    -- Create notification in notifications table
    INSERT INTO notifications (
      customer_id,
      source_type,
      source_id,
      title,
      message,
      type,
      category
    ) VALUES (
      NEW.customer_id,
      'ticket',
      NEW.inquiry_id,
      'Ticket Update',
      'Your ticket #' || NEW.display_id || ' status changed to "' || formatted_status || '".',
      'info',
      'ticket'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Flow**:

1. Admin changes status via `ticketChangeStatus()` action
2. Updates `inquiries_v2` table with new status
3. Database trigger fires automatically
4. Creates notification in `notifications` table
5. Customer sees notification (not in chat history)

---

## Testing

### Before Fix

- Open customer ticket conversation
- Admin marks as Resolved → Encrypted messages appear in conversation
- Admin marks as Closed → More encrypted messages appear in conversation
- Conversation history polluted with backend status messages

### After Fix

- Open customer ticket conversation
- Admin marks as Resolved → No messages inserted into conversation
- Admin marks as Closed → No messages inserted into conversation
- Customer receives notification (separate from chat)
- Clean conversation history preserved

---

## Impact Assessment

### Affected Scenarios

- ✅ Admin marks ticket as Resolved
- ✅ Admin marks ticket as Closed
- ✅ Admin marks ticket as Under Review

### Not Affected

- Customer replies (already creates separate reply sessions)
- Admin replies (already creates separate reply sessions)
- Customer resolves ticket (already creates separate reply sessions)

---

## Files Modified

1. **src/features/chat/actions/admin/changeTicketStatus.ts**
   - Removed lines 79-93 (message insertion logic)
   - Removed unused `customerSessionId` variable
   - Added documentation comment

---

## Related Documentation

- `docs_guide/TICKET_REPLY_SESSION_LOGIC.md` - How reply sessions work
- `supabase/migrations/087_formatted_notif_triggers.sql` - Notification trigger
- `docs_guide/SESSION_TITLE_CONSISTENCY_FIX.md` - Session title logic

---

## Best Practices

### ✅ DO

- Use database triggers for automatic notifications
- Keep status changes separate from conversation history
- Use notification system for user alerts

### ❌ DON'T

- Insert backend status messages into original sessions
- Pollute conversation history with system notifications
- Mix notification logic with message insertion

---

## Summary

**Bug**: Admin status changes were inserting encrypted messages into customer's original session  
**Fix**: Removed message insertion - notifications handled by database trigger  
**Result**: Clean conversation history, proper notification flow
