# Edge Functions Analysis

## Summary

Analysis of all Supabase Edge Functions to determine usage and deletion recommendations.

**Date:** 2025-01-27

## Edge Functions List

### 1. verify-turnstile

- **Status:** ACTIVE
- **Version:** 6
- **Slug:** `verify-turnstile`
- **Usage:** ❌ **UNUSED**
- **Evidence:**
  - Code explicitly uses Netlify functions instead (see `src/lib/turnstile.ts:350`)
  - Comment in code: "Call Netlify Function instead of Supabase Edge Function"
  - Application calls `/api/verify-turnstile` or `/.netlify/functions/verify-turnstile`
  - Netlify function implementation exists at `netlify/functions/verify-turnstile.ts`
  - No references to Supabase edge function endpoint found in codebase
- **Recommendation:** ✅ **DELETE** - Superseded by Netlify function

### 2. orders-create

- **Status:** ACTIVE
- **Version:** 4
- **Slug:** `orders-create`
- **Usage:** ❌ **UNUSED**
- **Evidence:**
  - Orders are created directly via Supabase client in `src/features/chat/actions/admin/createOrder.ts`
  - Uses direct database inserts: `supabase.from('orders').insert(...)`
  - No references to `orders-create` edge function found in codebase
  - No HTTP calls to Supabase functions endpoint for orders
- **Recommendation:** ✅ **DELETE** - Functionality moved to direct database operations

### 3. tickets-create

- **Status:** ACTIVE
- **Version:** 4
- **Slug:** `tickets-create`
- **Usage:** ❌ **UNUSED**
- **Evidence:**
  - Tickets (inquiries) are created directly via Supabase client in `src/features/chat/actions/customer/createInquiry.ts`
  - Uses direct database inserts: `supabase.from('inquiries_v2').insert(...)`
  - No references to `tickets-create` edge function found in codebase
  - No HTTP calls to Supabase functions endpoint for tickets
- **Recommendation:** ✅ **DELETE** - Functionality moved to direct database operations

### 4. chat-quote

- **Status:** ACTIVE
- **Version:** 3
- **Slug:** `chat-quote`
- **Usage:** ❌ **UNUSED**
- **Evidence:**
  - Quotes are created directly via Supabase client in `src/features/chat/actions/customer/createQuoteConversation.ts`
  - Uses direct database inserts: `supabase.from('quotes').insert(...)`
  - No references to `chat-quote` edge function found in codebase
  - No HTTP calls to Supabase functions endpoint for quotes
- **Recommendation:** ✅ **DELETE** - Functionality moved to direct database operations

## Deletion Recommendations

### All Edge Functions Can Be Deleted

All 4 edge functions are unused and can be safely deleted:

1. `verify-turnstile` - Replaced by Netlify function
2. `orders-create` - Replaced by direct database operations
3. `tickets-create` - Replaced by direct database operations
4. `chat-quote` - Replaced by direct database operations

## Current Implementation Patterns

### Verify Turnstile

- **Implementation:** Netlify Function (`netlify/functions/verify-turnstile.ts`)
- **Endpoint:** `/api/verify-turnstile` or `/.netlify/functions/verify-turnstile`
- **Usage:** Called from `src/lib/turnstile.ts:assertHumanTurnstile()`

### Create Order

- **Implementation:** Direct Supabase client call
- **Location:** `src/features/chat/actions/admin/createOrder.ts:createOrder()`
- **Method:** `supabase.from('orders').insert(...)`

### Create Ticket/Inquiry

- **Implementation:** Direct Supabase client call
- **Location:** `src/features/chat/actions/customer/createInquiry.ts:createInquiry()`
- **Method:** `supabase.from('inquiries_v2').insert(...)`

### Create Quote

- **Implementation:** Direct Supabase client call
- **Location:** `src/features/chat/actions/customer/createQuoteConversation.ts:createQuoteConversation()`
- **Method:** `supabase.from('quotes').insert(...)`

## Action Items

1. ✅ Delete `verify-turnstile` edge function from Supabase
2. ✅ Delete `orders-create` edge function from Supabase
3. ✅ Delete `tickets-create` edge function from Supabase
4. ✅ Delete `chat-quote` edge function from Supabase

## Notes

- All edge functions appear to be legacy implementations
- The application has migrated to:
  - Netlify functions for external API integrations (Turnstile)
  - Direct Supabase client calls for database operations
- No breaking changes expected from deletion as none are actively used
