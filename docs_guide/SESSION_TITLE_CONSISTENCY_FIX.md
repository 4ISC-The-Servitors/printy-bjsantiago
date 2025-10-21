# Session Title Consistency Fix Guide

**Date**: 2025-10-21
**Status**: 🔴 CRITICAL - Active Bug
**Branch**: `chat-flows-sessions-v2`

---

## Problem Statement

Chat session titles are **inconsistent** between creation and browser refresh, causing user confusion and poor UX.

### Current Behavior

| User Action | Title on Creation | Title After Refresh | ❌ Issue |
|------------|------------------|---------------------|----------|
| Click "Ask Quote" | "Ask Quote" | "ask-quote" | Raw flow_id displayed |
| Track Quote QOT-100001 | "Track Quote: QOT-100001" | "track-quote" | Display ID lost |
| Pay Order ORD-100001 | "Pay Order: ORD-100001" | "upload-payment" | Context lost |
| About Us | "About B.J. Santiago" | "about" | Mapping inconsistent |
| Admin Quote Propose | "Quote: QOT-100001" | "Quote: abc12345..." | Uses session_id substring |

### Expected Behavior

All session titles should **persist** across browser refreshes and display **context-aware** information.

---

## Root Cause Analysis

### 🔴 Critical Issue: No Database Persistence

**Customer sessions** store titles **only in React state**, not in the database.

**Flow:**
```
1. User clicks "Ask Quote"
   → React state: title = "Ask Quote" ✅

2. Browser refreshes
   → React state cleared
   → Query: SELECT metadata FROM chat_sessions_v2
   → metadata.title = NULL ❌

3. Fallback logic
   → Display flow_id: "ask-quote" ❌
```

**Contrast with Admin:**
```typescript
// Admin (WORKS) - Line 609 in useAdminChat.ts
await supabase
  .from('chat_sessions_v2')
  .update({
    metadata: {
      admin_chat: true,
      title,  // ✅ Saved to database
      context: updatedContext,
    }
  })
  .eq('session_id', sessionId);
```

**Customer (BROKEN) - Line 101 in useCustomerConversations.ts**
```typescript
const result = await JsonbFlowProcessor.startFlow({
  flowId: resolvedFlowId,
  customerId,
  flowDefinition,
  initialContext: ctx || {},
});
// ❌ No metadata.title save - title only exists in React state!
```

---

## Secondary Issues

### 🟡 Issue #2: No Centralized Title Logic

**4 different title generation strategies** found across codebase:

1. **Customer Dashboard** (`CustomerDashboard.tsx:198`)
   ```typescript
   metadata?.title || flow_id || 'Chat'
   ```

2. **Customer Chat History** (`CustomerChatHistory.tsx:80-96`)
   ```typescript
   const FLOW_TITLES = {
     'ask-quote': 'Ask Quote',
     'track-quote': 'Track Quote',
     // ... hardcoded mapping
   }
   ```

3. **Admin Conversations** (`useAdminConversations.tsx:92-106`)
   ```typescript
   // Complex conditional with FK joins
   if (quote) return `Quote: ${quote.display_id}`;
   if (inquiry) return `Ticket: ${inquiry.display_id}`;
   ```

4. **Admin Chat Hook** (`useAdminChat.ts:102-120`)
   ```typescript
   function buildConversationTitle(type, displayId) {
     // String matching logic
   }
   ```

**Impact**: No single source of truth → Difficult to maintain, prone to bugs.

---

### 🟡 Issue #3: Performance - Inefficient Queries

**Location**: `CustomerDashboard.tsx:172-224`

**Current Query:**
```typescript
const { data: sessions } = await supabase
  .from('chat_sessions_v2')
  .select(`
    *,
    metadata  // ❌ Fetches entire JSONB (100KB+ for quote sessions)
  `)
  .order('updated_at', { ascending: false })
  .limit(10);
```

**Problems:**
- Fetches full metadata blob (100KB+ for sessions with embedded proposals)
- Runs on every dashboard mount
- No caching mechanism
- Wasteful when only need `title` and `display_id`

**Optimized Query:**
```typescript
const { data: sessions } = await supabase
  .from('chat_sessions_v2')
  .select(`
    session_id,
    flow_id,
    created_at,
    updated_at,
    metadata->title,
    metadata->context->display_id
  `)
  .order('updated_at', { ascending: false })
  .limit(10);
```

---

## Expected Session Titles Reference

### Customer Flows

| Flow ID | Expected Title | Context Required |
|---------|---------------|------------------|
| `ask-quote` | "Ask Quote" | None |
| `track-quote` | "Track Quote: QOT-100001" | `context.display_id` |
| `upload-payment` | "Pay Order: ORD-100001" | `context.display_id` |
| `cancel-order` | "Cancel Order: ORD-100001" | `context.display_id` |
| `ask-assistance` | "Ask Assistance" | None |
| `track-ticket` | "Track Ticket: TCK-100001" | `context.display_id` |
| `about` | "About B.J. Santiago" | None |
| `faqs` | "FAQs" | None |
| `services` | "Services Offered" | None |

### Admin Flows

| Flow Type | Expected Title | Context Required |
|-----------|---------------|------------------|
| Quote Proposal | "Quote Propose: QOT-100001" | `quote.display_id` |
| Create Order | "Create Order: QOT-100001" | `quote.display_id` |
| Verify Payment | "Verify Payment: ORD-100001" | `order.display_id` |
| Review Ticket | "Review Ticket: TCK-100001" | `inquiry.display_id` |

---

## Implementation Plan

### ✅ Phase 1: Fix Customer Title Persistence (LOW RISK)

**Goal**: Save titles to database on session creation.

**File**: `src/features/chat/hooks/customer/useCustomerConversations.ts`

**Change Location**: After `JsonbFlowProcessor.startFlow()` (around line 101)

**Implementation**:
```typescript
const result = await JsonbFlowProcessor.startFlow({
  flowId: resolvedFlowId,
  customerId,
  flowDefinition,
  initialContext: ctx || {},
});

// ✅ NEW: Save title to database
await supabase
  .from('chat_sessions_v2')
  .update({
    metadata: {
      title,  // Save the display title
      context: ctx || {},
    }
  })
  .eq('session_id', result.sessionId);

return {
  sessionId: result.sessionId,
  title,
  flowId: resolvedFlowId,
};
```

**Testing**:
1. Create new session: "Ask Quote"
2. Verify title displays correctly
3. Refresh browser
4. Verify title still shows "Ask Quote" (not "ask-quote")
5. Check database: `SELECT metadata->'title' FROM chat_sessions_v2 WHERE session_id = '...'`

**Risk**: LOW - Follows existing admin pattern, non-destructive change.

---

### ✅ Phase 2: Centralize Title Logic (MEDIUM RISK)

**Goal**: Single source of truth for all title generation.

**New File**: `src/features/chat/config/sessionTitleConfig.ts`

**Implementation**:
```typescript
// Flow ID to Display Title mapping
export const FLOW_TITLES: Record<string, string> = {
  // Customer flows
  'ask-quote': 'Ask Quote',
  'track-quote': 'Track Quote',
  'upload-payment': 'Pay Order',
  'cancel-order': 'Cancel Order',
  'ask-assistance': 'Ask Assistance',
  'track-ticket': 'Track Ticket',
  'about': 'About B.J. Santiago',
  'faqs': 'FAQs',
  'services': 'Services Offered',

  // Admin flows (if needed)
  'quote-proposal': 'Quote Propose',
  'create-order': 'Create Order',
  'verify-payment': 'Verify Payment',
  'review-ticket': 'Review Ticket',
};

interface SessionTitleParams {
  flowId: string;
  metadata?: {
    title?: string;
    context?: {
      display_id?: string;
      [key: string]: any;
    };
  };
  inquiry?: { display_id?: string };
  quote?: { display_id?: string };
  order?: { display_id?: string };
}

/**
 * Centralized title generation logic
 * Priority: metadata.title > context display_id > FK display_id > flow mapping > flow_id
 */
export function getSessionTitle(params: SessionTitleParams): string {
  const { flowId, metadata, inquiry, quote, order } = params;

  // 1. Highest priority: Explicitly set title
  if (metadata?.title) {
    return metadata.title;
  }

  // 2. Context-based title with display_id
  if (metadata?.context?.display_id) {
    const baseTitle = FLOW_TITLES[flowId] || flowId;
    return `${baseTitle}: ${metadata.context.display_id}`;
  }

  // 3. Foreign key relationships (admin flows)
  if (quote?.display_id) {
    return `Quote: ${quote.display_id}`;
  }
  if (order?.display_id) {
    return `Order: ${order.display_id}`;
  }
  if (inquiry?.display_id) {
    return `Ticket: ${inquiry.display_id}`;
  }

  // 4. Flow mapping fallback
  if (FLOW_TITLES[flowId]) {
    return FLOW_TITLES[flowId];
  }

  // 5. Last resort: Use flow_id or generic
  return flowId || 'Chat';
}
```

**Files to Update**:
1. `src/customer/pages/CustomerDashboard.tsx:198`
2. `src/customer/pages/CustomerChatHistory.tsx:80-96`
3. `src/admin/hooks/useAdminConversations.tsx:92-106`
4. `src/admin/hooks/useAdminChat.ts:102-120`

**Testing**:
1. Test all customer flows with and without context
2. Test all admin flows
3. Verify titles match expected values
4. Test edge cases (missing metadata, null display_id)

**Risk**: MEDIUM - Touches multiple files, requires comprehensive testing.

---

### ✅ Phase 3: Database Optimization (COORDINATE WITH sql-performance-optimizer)

**Goal**: Reduce query overhead and improve performance.

#### Option A: Selective JSON Extraction

**Query Before**:
```sql
SELECT * FROM chat_sessions_v2
ORDER BY updated_at DESC LIMIT 10;
-- Transfers 100KB+ per session
```

**Query After**:
```sql
SELECT
  session_id,
  flow_id,
  created_at,
  updated_at,
  metadata->'title' as title,
  metadata->'context'->'display_id' as display_id
FROM chat_sessions_v2
ORDER BY updated_at DESC LIMIT 10;
-- Transfers ~2KB per session (50x reduction!)
```

#### Option B: Generated Column (Recommended)

**Migration**: `20250121_add_display_title_column.sql`

```sql
-- Add generated column for display title
ALTER TABLE chat_sessions_v2
ADD COLUMN display_title TEXT
GENERATED ALWAYS AS (
  COALESCE(
    metadata->>'title',
    flow_id,
    'Chat'
  )
) STORED;

-- Add index for faster queries
CREATE INDEX idx_chat_sessions_display_title
ON chat_sessions_v2(display_title);

-- Add index for recent sessions query
CREATE INDEX idx_chat_sessions_customer_updated
ON chat_sessions_v2(customer_id, updated_at DESC);
```

**Benefits**:
- No need to parse JSONB on every query
- Can use index for sorting/filtering by title
- Automatically updated when metadata changes
- Backward compatible (metadata.title still works)

**Query After**:
```sql
SELECT
  session_id,
  flow_id,
  display_title,
  created_at,
  updated_at
FROM chat_sessions_v2
WHERE customer_id = '...'
ORDER BY updated_at DESC
LIMIT 10;
-- Lightning fast, indexed query!
```

#### Option C: Materialized View (Advanced)

For high-traffic scenarios:

```sql
CREATE MATERIALIZED VIEW recent_customer_sessions AS
SELECT
  customer_id,
  session_id,
  flow_id,
  COALESCE(metadata->>'title', flow_id, 'Chat') as display_title,
  metadata->'context'->'display_id' as display_id,
  created_at,
  updated_at
FROM chat_sessions_v2
WHERE updated_at > NOW() - INTERVAL '30 days';

CREATE INDEX idx_mv_recent_sessions_customer
ON recent_customer_sessions(customer_id, updated_at DESC);

-- Refresh periodically (or use triggers)
REFRESH MATERIALIZED VIEW CONCURRENTLY recent_customer_sessions;
```

**Testing**:
1. Benchmark query performance before/after
2. Verify generated column updates on metadata changes
3. Test with large datasets (1000+ sessions)
4. Monitor index usage with `EXPLAIN ANALYZE`

**Risk**: MEDIUM-HIGH - Requires migration, database changes.

---

## Critical Features to Preserve

During all phases, ensure these features **continue working**:

### 1. Context-Based Titles
- Titles must dynamically include `display_id` from context
- Example: "Track Quote: QOT-100001" requires `metadata.context.display_id`

### 2. Foreign Key Relationships
- Admin flows use `quote_id`, `inquiry_id`, `order_id` columns
- Enable joins to fetch `display_id` for contextual titles
- Example: `LEFT JOIN quotes ON chat_sessions_v2.quote_id = quotes.quote_id`

### 3. Flow-Based Fallback
- If no metadata.title exists, fall back to flow mapping
- Ensures all sessions have readable names (not raw IDs)

### 4. Admin Session Persistence
- `metadata.admin_chat = true` flag identifies admin-initiated chats
- Required for "All Chats" view filtering
- Don't break this when updating metadata

### 5. Session Switching
- Users can switch between conversations
- Load historical messages via `fetchSessionMessagesV2()`
- Maintain session state across switches

---

## Testing Checklist

### Phase 1 Testing
- [ ] Create new customer session
- [ ] Verify title displays correctly initially
- [ ] Refresh browser
- [ ] Verify title persists (not raw flow_id)
- [ ] Check database: `SELECT metadata->'title' FROM chat_sessions_v2`
- [ ] Test with context (e.g., "Track Quote: QOT-100001")
- [ ] Verify context display_id persists on refresh

### Phase 2 Testing
- [ ] Test all customer flows (9 total)
- [ ] Test all admin flows (4+ total)
- [ ] Verify edge cases:
  - [ ] Missing metadata
  - [ ] Null display_id
  - [ ] Empty context
  - [ ] Unknown flow_id
- [ ] Verify backward compatibility with old sessions

### Phase 3 Testing
- [ ] Benchmark query performance (before/after)
- [ ] Run `EXPLAIN ANALYZE` on dashboard query
- [ ] Test with 1000+ sessions
- [ ] Verify generated column updates correctly
- [ ] Check index usage
- [ ] Monitor query execution time

---

## Rollback Plan

### Phase 1 Rollback
```typescript
// Remove the metadata update from useCustomerConversations.ts
// Revert to previous version (no database save)
```

### Phase 2 Rollback
```bash
# Revert all files to use previous title logic
git checkout HEAD -- src/customer/pages/CustomerDashboard.tsx
git checkout HEAD -- src/customer/pages/CustomerChatHistory.tsx
git checkout HEAD -- src/admin/hooks/useAdminConversations.tsx
git checkout HEAD -- src/admin/hooks/useAdminChat.ts

# Remove new config file
rm src/features/chat/config/sessionTitleConfig.ts
```

### Phase 3 Rollback
```sql
-- Drop generated column
ALTER TABLE chat_sessions_v2 DROP COLUMN display_title;

-- Drop indexes
DROP INDEX IF EXISTS idx_chat_sessions_display_title;
DROP INDEX IF EXISTS idx_chat_sessions_customer_updated;

-- Revert queries to previous version
```

---

## Success Criteria

### Phase 1 Success
- ✅ Customer session titles persist across browser refresh
- ✅ No "ask-quote" or raw flow_id displayed
- ✅ Context display_ids preserved (e.g., "QOT-100001")
- ✅ No regressions in existing functionality

### Phase 2 Success
- ✅ All title generation uses single centralized function
- ✅ No hardcoded title mappings outside config file
- ✅ Easy to add new flows (single location to update)
- ✅ Consistent titles across customer/admin interfaces

### Phase 3 Success
- ✅ Dashboard query performance improved by >50%
- ✅ Recent sessions load <100ms (previously >500ms)
- ✅ Database queries use indexes efficiently
- ✅ No increase in storage overhead (generated column is small)

---

## Files Modified (Summary)

### Phase 1
- `src/features/chat/hooks/customer/useCustomerConversations.ts` (Line ~101)

### Phase 2
- `src/features/chat/config/sessionTitleConfig.ts` (NEW)
- `src/customer/pages/CustomerDashboard.tsx` (Line 198)
- `src/customer/pages/CustomerChatHistory.tsx` (Lines 80-96)
- `src/admin/hooks/useAdminConversations.tsx` (Lines 92-106)
- `src/admin/hooks/useAdminChat.ts` (Lines 102-120)

### Phase 3
- `supabase/migrations/20250121_add_display_title_column.sql` (NEW)
- `src/customer/pages/CustomerDashboard.tsx` (Lines 172-224)
- Other files with session queries (update to use new column)

---

## Next Steps

1. **Review this guide** with team/stakeholders
2. **Run Phase 1** (low risk, quick win)
3. **Test Phase 1** thoroughly before proceeding
4. **Plan Phase 2** implementation after Phase 1 success
5. **Coordinate Phase 3** with DBA/backend team (migration required)

---

## References

- **Audit Report**: Output from chat-system-auditor agent (2025-10-21)
- **Related Docs**:
  - `CHAT_SYSTEM_V2_DEV_GUIDE.md`
  - `JSONB_CHAT_FLOW_SYSTEM.md`
  - `DUPLICATE_MESSAGE_BUG_FIX.md`

---

**Last Updated**: 2025-10-21
**Author**: Claude Code (chat-system-auditor agent)
**Status**: 📋 Ready for Implementation
