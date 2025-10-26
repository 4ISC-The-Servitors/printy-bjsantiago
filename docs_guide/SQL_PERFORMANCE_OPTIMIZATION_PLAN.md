# SQL Performance Optimization Plan

## Overview
This document outlines the SQL performance optimizations for customer dashboard and history pages to address slow loading states and excessive database queries.

## Performance Issues Identified

### 🚨 Critical N+1 Query Problems
- **QuoteHistory component**: Executing 100+ separate queries on a single page load
- **Session queries**: Each history page making identical redundant queries
- **Dashboard hooks**: Multiple simultaneous queries without optimization

### ⚡ Performance Impact
- Dashboard loading 3-5 separate hooks simultaneously
- Each history page making duplicate session queries
- Missing database indexes for common query patterns
- Inefficient `SELECT *` queries returning unnecessary data

## Optimization Plan

### Phase 1: Fix Critical N+1 Queries (95% query reduction)

#### QuoteHistory Component Optimization
**Current Issue**: Loop-based queries in quote loading
```typescript
// PROBLEM: Loop executing separate queries for each quote
const quoteList: Quote[] = await Promise.all(
  (data || []).map(async quote => {
    // Separate query for each quote's specs
    const { data: specs } = await supabase
      .from('quote_specs')
      .select('spec_data')
      .eq('session_id', quote.session_id)

    // Separate query for each quote's proposal
    const { data: proposal } = await supabase
      .from('quote_proposals')
      .select('quoted_price')
      .eq('proposal_id', quote.proposal_id)
  })
);
```

**Solution**: Single JOIN query to fetch all related data
```sql
-- Optimized query to fetch all data in one call
SELECT
  q.quote_id,
  q.session_id,
  q.display_id,
  q.status,
  q.created_at,
  q.updated_at,
  q.ended_at,
  q.proposal_id,
  qs.spec_data,
  qp.quoted_price
FROM quotes q
LEFT JOIN quote_specs qs ON q.session_id = qs.session_id
LEFT JOIN quote_proposals qp ON q.proposal_id = qp.proposal_id
WHERE q.customer_id = $1
ORDER BY q.updated_at DESC
```

### Phase 2: Smart Session Caching (75% reduction in redundant calls)

#### Shared Session Data Across History Pages
**Current Issue**: Each history page fetches identical session data
```typescript
// OrderHistory, QuoteHistory, TicketHistory all execute:
useRecentChatSessions(setConversations)
```

**Solution**: Implement shared session cache
```typescript
// Create shared session cache provider
const SessionCacheContext = createContext({
  sessions: [],
  loading: false,
  refetch: () => {}
});

// Single query shared across all history pages
export const SessionCacheProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Single useEffect to fetch sessions once
  useEffect(() => {
    // Fetch sessions logic here
  }, []);

  return (
    <SessionCacheContext.Provider value={{ sessions, loading, refetch }}>
      {children}
    </SessionCacheContext.Provider>
  );
};
```

### Phase 3: Database Indexes (60-80% faster queries)

#### Essential Performance Indexes
```sql
-- Customer quote queries optimization
CREATE INDEX idx_quotes_customer_updated ON quotes(customer_id, updated_at DESC);
CREATE INDEX idx_quotes_session_lookup ON quotes(session_id);

-- Session queries optimization
CREATE INDEX idx_chat_sessions_customer_created ON chat_sessions_v2(customer_id, created_at DESC);
CREATE INDEX idx_chat_sessions_status ON chat_sessions_v2(status);

-- Quote specs join optimization
CREATE INDEX idx_quote_specs_session ON quote_specs(session_id);

-- Quote proposals join optimization
CREATE INDEX idx_quote_proposals_id ON quote_proposals(proposal_id);

-- Recent order/ticket/quote optimization
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX idx_tickets_customer_created ON tickets(customer_id, created_at DESC);
```

### Phase 4: Query Column Optimization

#### Replace SELECT * with Specific Columns
```typescript
// BEFORE: Selecting all columns
const { data } = await supabase
  .from('quotes')
  .select('*')
  .eq('customer_id', user.id);

// AFTER: Selecting only needed columns
const { data } = await supabase
  .from('quotes')
  .select(`
    quote_id,
    session_id,
    display_id,
    status,
    created_at,
    updated_at,
    ended_at,
    proposal_id
  `)
  .eq('customer_id', user.id);
```

## Implementation Steps

### Step 1: Create Database Indexes
1. Run the essential index creation scripts
2. Test query performance improvements
3. Monitor database performance metrics

### Step 2: Fix QuoteHistory N+1 Queries
1. Replace loop-based queries with JOIN optimization
2. Update TypeScript types for joined data
3. Test with various quote data scenarios

### Step 3: Implement Session Caching
1. Create SessionCacheProvider component
2. Update history pages to use shared cache
3. Add cache invalidation logic for real-time updates

### Step 4: Optimize Dashboard Hook Queries
1. Review useRecentOrder, useRecentTicket, useRecentQuote hooks
2. Optimize column selection and query patterns
3. Implement loading state coordination

### Step 5: Query Column Refinement
1. Audit all SELECT * queries
2. Replace with specific column selection
3. Update TypeScript interfaces as needed

## Expected Results

### Performance Improvements
- **Dashboard load time**: 60-80% improvement
- **Quote History**: 95% reduction in query count
- **Overall database load**: 70% reduction
- **User experience**: Dramatically faster page transitions

### Query Count Reduction
- **Before**: 100+ queries per page load
- **After**: 5-10 optimized queries per page

### Loading State Improvements
- Faster initial page render
- Reduced skeleton loading time
- Better user experience with accurate loading states

## Files to Modify

### Core Query Files
- `src/features/chat/hooks/customer/useRecentChatSessions.ts`
- `src/customer/hooks/useRecentOrder.ts`
- `src/customer/hooks/useRecentTicket.ts`
- `src/customer/hooks/useRecentQuote.ts`

### History Page Components
- `src/customer/components/dashboard/quoteHistory/QuoteHistory.tsx`
- `src/customer/components/dashboard/orderHistory/OrderHistory.tsx`
- `src/customer/components/dashboard/ticketHistory/TicketHistory.tsx`
- `src/customer/components/dashboard/chatHistory/ChatHistory.tsx`

### New Cache Components
- `src/customer/components/shared/cache/SessionCacheProvider.tsx`
- `src/customer/components/shared/cache/useSessionCache.ts`

### Database Migration
- `supabase/migrations/20240101_performance_indexes.sql`

## Testing Strategy

### Performance Testing
1. Monitor query count before/after optimizations
2. Test with various data volumes (10, 100, 1000+ records)
3. Measure page load times and user experience

### Functional Testing
1. Verify all history pages still display correct data
2. Test real-time updates and cache invalidation
3. Ensure error handling works properly

### Regression Testing
1. Verify existing functionality unchanged
2. Test all chat and history flows
3. Check mobile responsiveness maintained

## Monitoring & Maintenance

### Performance Metrics
- Database query execution times
- Number of queries per page load
- Page load time improvements
- User experience metrics

### Ongoing Optimization
- Regular query performance reviews
- Index usage monitoring
- Cache hit rate optimization
- New feature performance impact assessment

## Notes & Considerations

- **No schema changes**: All optimizations use existing database structure
- **Backward compatible**: All changes maintain existing API contracts
- **Incremental deployment**: Can be implemented phase by phase
- **Zero breaking changes**: Existing functionality preserved
- **Scalable approach**: Optimizations scale with data growth

This optimization plan focuses purely on performance improvements without introducing new database tables, views, or breaking changes to the existing codebase.