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

### 1. orders_duplicate Table
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
  notifications: NotificationItem[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
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
type NotificationType = 'order_created' | 'order_updated' | 'quote_created' | 'quote_updated' | 'ticket_created' | 'ticket_updated'

interface DatabaseEvent {
  table: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
}

interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  data: any
  timestamp: string
  isRead: boolean
  userId: string
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
  notifications: NotificationItem[]
  lastCleanup: string
  userId: string
  userRole: 'admin' | 'customer'
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
