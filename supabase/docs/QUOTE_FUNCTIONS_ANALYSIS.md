- DENG: already handled, deleted unused/uncalled, backup lang to jic
- DENG: already handled, deleted unused/uncalled, backup lang to jic
- DENG: already handled, deleted unused/uncalled, backup lang to jic
- DENG: already handled, deleted unused/uncalled, backup lang to jic

# Quote-Related Functions Analysis Report

**Generated:** $(date)
**Purpose:** Systematic analysis of all quote-related database functions to identify unused functions, security issues, and dependencies.

## Executive Summary

- **Total Functions:** 16 quote-related functions
- **Unused/Broken:** 7 functions
- **Security Issues:** 10 functions missing `SET search_path`
- **Active Functions:** 6 functions (with 4 trigger functions)
- **Legacy Table References:** 3 functions reference non-existent tables

---

## Detailed Function Analysis

### 1. `create_quote_conversation` ❌ **UNUSED + SECURITY ISSUE**

**Status:** UNUSED
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `chat_sessions_v2`, `quotes` (via sequence)

**Definition:**

```sql
CREATE FUNCTION create_quote_conversation(p_customer_id uuid, p_quote_id uuid DEFAULT NULL)
RETURNS uuid
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere in codebase
- ❌ No RPC calls found
- ❌ Functionality replaced by TypeScript action handler

**Internal RPC Calls:**

- Uses sequence: `quote_display_seq`

**Recommendation:**

- **DELETE** - Completely unused, functionality handled by TypeScript

---

### 2. `add_quote_message` ❌ **UNUSED + SECURITY ISSUE**

**Status:** UNUSED
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `chat_messages_v2`, `chat_sessions_v2`

**Definition:**

```sql
CREATE FUNCTION add_quote_message(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_sender_role text,
  p_message_text text,
  p_message_type text DEFAULT 'chat',
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere in codebase
- ❌ No RPC calls found
- ❌ Replaced by `api_insert_chat_message_v2`

**Internal RPC Calls:**

- Uses encryption: `pgp_sym_encrypt`
- Reads encryption key from `app.encryption_key` setting

**Recommendation:**

- **DELETE** - Unused, replaced by standard message insertion function

---

### 3. `api_get_or_create_quote_session` ✅ **USED (Documented Only)**

**Status:** DOCUMENTED BUT NOT CALLED
**Security:** ✅ Has `SET search_path = public`
**Type:** SECURITY DEFINER
**Tables Used:** `quotes`, `chat_sessions_v2`

**Definition:**

```sql
CREATE FUNCTION api_get_or_create_quote_session(p_quote_id uuid)
RETURNS uuid
SECURITY DEFINER
SET search_path TO 'public'  -- ✅ Security compliant
```

**Usage:**

- ⚠️ Only documented in migration plan
- ❌ No actual RPC calls found in codebase
- ✅ Security compliant

**Internal RPC Calls:**

- None (direct table access)

**Purpose:**

- Creates or retrieves session for a quote
- Links quote to chat session via FK

**Recommendation:**

- **KEEP** - Security compliant, may be used in future
- **OR DELETE** - If not needed, functionality can be handled in TypeScript

---

### 4. `create_quote_chat_session` ❌ **BROKEN + SECURITY ISSUE**

**Status:** BROKEN (References non-existent tables)
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `chat_sessions` (❌ doesn't exist), `chat_session_flow` (❌ doesn't exist)

**Definition:**

```sql
CREATE FUNCTION create_quote_chat_session(
  p_customer_id uuid,
  p_quote_conversation_id uuid,
  p_flow_id text
)
RETURNS uuid
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere
- ❌ References legacy `chat_sessions` table (doesn't exist)
- ❌ References legacy `chat_session_flow` table (doesn't exist)

**Internal RPC Calls:**

- None

**Recommendation:**

- **DELETE** - Broken, references non-existent tables, completely unused

---

### 5. `format_quote_status` ✅ **USED BY TRIGGERS**

**Status:** USED (by trigger functions)
**Security:** ✅ SECURITY INVOKER (no security issue)
**Type:** SECURITY INVOKER (IMMUTABLE)
**Tables Used:** None (pure function)

**Definition:**

```sql
CREATE FUNCTION format_quote_status(status text)
RETURNS text
IMMUTABLE
-- SECURITY INVOKER doesn't need search_path
```

**Usage:**

- ✅ Used by `notify_quote_events` trigger function
- ✅ Called in trigger: `trigger_quote_notifications`

**Internal RPC Calls:**

- None

**Recommendation:**

- **KEEP** - Active, used by triggers, no security issues

---

### 6. `generate_quote_display_id` ❌ **UNUSED TRIGGER FUNCTION**

**Status:** UNUSED (No trigger exists)
**Security:** ✅ SECURITY INVOKER (no security issue)
**Type:** Trigger function
**Tables Used:** Uses sequence `quote_display_seq`

**Definition:**

```sql
CREATE FUNCTION generate_quote_display_id()
RETURNS trigger
-- SECURITY INVOKER doesn't need search_path
```

**Usage:**

- ❌ No trigger exists on `quotes` table
- ❌ Function defined but never used
- ✅ Security compliant (SECURITY INVOKER)

**Internal RPC Calls:**

- Uses sequence: `nextval('quote_display_seq')`

**Recommendation:**

- **DELETE** - No trigger uses it, display_id is generated in TypeScript code

---

### 7. `get_latest_quote_for_order` ❌ **UNUSED + SECURITY ISSUE**

**Status:** UNUSED
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `orders`, `quotes`

**Definition:**

```sql
CREATE FUNCTION get_latest_quote_for_order(target_order_id text)
RETURNS json
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere in codebase
- ❌ No RPC calls found

**Internal RPC Calls:**

- None (direct table access)
- Uses `auth.uid()` for authorization

**Recommendation:**

- **DELETE** - Unused, or FIX security issue if needed in future

---

### 8. `get_quote_conversation_from_session` ❌ **BROKEN + SECURITY ISSUE**

**Status:** BROKEN (References non-existent table)
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `chat_sessions` (❌ doesn't exist)

**Definition:**

```sql
CREATE FUNCTION get_quote_conversation_from_session(p_session_id uuid)
RETURNS uuid
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere
- ❌ References legacy `chat_sessions` table (doesn't exist)
- ❌ Should use `chat_sessions_v2` instead

**Internal RPC Calls:**

- None

**Recommendation:**

- **DELETE** - Broken, references non-existent table

---

### 9. `get_quote_id_from_conversation` ❌ **BROKEN + SECURITY ISSUE**

**Status:** BROKEN (References non-existent table)
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `quote_conversations` (❌ doesn't exist)

**Definition:**

```sql
CREATE FUNCTION get_quote_id_from_conversation(p_conversation_id uuid)
RETURNS uuid
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere
- ❌ References legacy `quote_conversations` table (doesn't exist)
- ❌ Legacy system already deprecated

**Internal RPC Calls:**

- None

**Recommendation:**

- **DELETE** - Broken, references deprecated table

---

### 10. `get_quote_messages_v2` ❌ **UNUSED + SECURITY ISSUE**

**Status:** UNUSED
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `chat_messages_v2`

**Definition:**

```sql
CREATE FUNCTION get_quote_messages_v2(p_session_id uuid)
RETURNS TABLE(...)
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere in codebase
- ❌ No RPC calls found
- ❌ Replaced by `api_fetch_chat_messages_v2`

**Internal RPC Calls:**

- Uses encryption: `pgp_sym_decrypt`
- Reads encryption key from `app.encryption_key` setting

**Recommendation:**

- **DELETE** - Unused, replaced by standard message fetch function

---

### 11. `get_quote_session_by_display_id` ❌ **UNUSED + SECURITY ISSUE**

**Status:** UNUSED
**Security:** ❌ Missing `SET search_path`
**Type:** SECURITY DEFINER
**Tables Used:** `chat_sessions_v2`

**Definition:**

```sql
CREATE FUNCTION get_quote_session_by_display_id(p_display_id text)
RETURNS TABLE(...)
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ❌ Not called anywhere in codebase
- ❌ No RPC calls found

**Internal RPC Calls:**

- None (direct table access)
- Queries metadata JSONB field

**Recommendation:**

- **DELETE** - Unused, can query directly if needed

---

### 12. `save_quote_spec` ✅ **ACTIVE + SECURE**

**Status:** ACTIVE
**Security:** ✅ Has `SET search_path = public`
**Type:** SECURITY DEFINER
**Tables Used:** `quote_specs`, `chat_sessions_v2`

**Definition:**

```sql
CREATE FUNCTION save_quote_spec(p_session_id uuid, p_spec_data jsonb)
RETURNS uuid
SECURITY DEFINER
SET search_path TO 'public'  -- ✅ Security compliant
```

**Usage:**

- ✅ Called from: `src/admin/components/quotes/SpecEditorModal.tsx`
- ✅ Active usage confirmed

**Internal RPC Calls:**

- Calls: `is_admin()` function for authorization

**Recommendation:**

- **KEEP** - Active, secure, in use

---

### 13. `notify_admins_on_quote_created` ✅ **ACTIVE TRIGGER**

**Status:** ACTIVE (Trigger function)
**Security:** ✅ Has `SET search_path = public`
**Type:** SECURITY DEFINER (Trigger)
**Tables Used:** `quotes`, `customer`, `notifications`

**Definition:**

```sql
CREATE FUNCTION notify_admins_on_quote_created()
RETURNS trigger
SECURITY DEFINER
SET search_path TO 'public'  -- ✅ Security compliant
```

**Usage:**

- ✅ Active trigger: `trigger_notify_admins_on_quote_created`
- ✅ Trigger on: `quotes` table (AFTER INSERT)

**Internal RPC Calls:**

- None (direct table access)

**Recommendation:**

- **KEEP** - Active, secure, critical functionality

---

### 14. `notify_quote_accept_reject` ❌ **UNUSED TRIGGER FUNCTION**

**Status:** UNUSED (No trigger exists)
**Security:** ✅ Has `SET search_path = public`
**Type:** SECURITY DEFINER (Trigger)
**Tables Used:** `quotes`, `customer`, `notifications`

**Definition:**

```sql
CREATE FUNCTION notify_quote_accept_reject()
RETURNS trigger
SECURITY DEFINER
SET search_path TO 'public'  -- ✅ Security compliant
```

**Usage:**

- ❌ No trigger exists on `quotes` table
- ❌ Functionality handled by `notify_quote_events` instead
- ✅ Security compliant

**Internal RPC Calls:**

- None (direct table access)

**Recommendation:**

- **DELETE** - No trigger uses it, functionality covered by `notify_quote_events`

---

### 15. `notify_quote_events` ✅ **ACTIVE TRIGGER**

**Status:** ACTIVE (Trigger function)
**Security:** ✅ Has `SET search_path = public`
**Type:** SECURITY DEFINER (Trigger)
**Tables Used:** `quotes`, `customer`, `notifications`

**Definition:**

```sql
CREATE FUNCTION notify_quote_events()
RETURNS trigger
SECURITY DEFINER
SET search_path TO 'public'  -- ✅ Security compliant
```

**Usage:**

- ✅ Active trigger: `trigger_quote_notifications`
- ✅ Trigger on: `quotes` table (AFTER UPDATE)
- ✅ Calls: `format_quote_status()` function

**Internal RPC Calls:**

- Calls: `format_quote_status(NEW.status)`

**Recommendation:**

- **KEEP** - Active, secure, critical functionality

---

### 16. `notify_quote_proposal_accept_reject` ❌ **UNUSED TRIGGER FUNCTION**

**Status:** UNUSED (No trigger exists)
**Security:** ✅ Has `SET search_path = public`
**Type:** SECURITY DEFINER (Trigger)
**Tables Used:** `quote_proposals`, `quotes`, `customer`, `notifications`

**Definition:**

```sql
CREATE FUNCTION notify_quote_proposal_accept_reject()
RETURNS trigger
SECURITY DEFINER
SET search_path TO 'public'  -- ✅ Security compliant
```

**Usage:**

- ❌ No trigger exists on `quote_proposals` table
- ❌ Function defined but never used
- ✅ Security compliant

**Internal RPC Calls:**

- None (direct table access)

**Recommendation:**

- **DELETE** - No trigger uses it

---

## Summary by Category

### ✅ Active Functions (Keep)

1. `save_quote_spec` - Used by admin UI
2. `format_quote_status` - Used by trigger
3. `notify_admins_on_quote_created` - Active trigger
4. `notify_quote_events` - Active trigger

### ⚠️ Needs Decision

1. `api_get_or_create_quote_session` - Documented but not called (keep or delete?)

### ❌ Unused Functions (Delete)

1. `create_quote_conversation` - Unused, security issue
2. `add_quote_message` - Unused, security issue
3. `get_latest_quote_for_order` - Unused, security issue
4. `get_quote_messages_v2` - Unused, security issue
5. `get_quote_session_by_display_id` - Unused, security issue
6. `generate_quote_display_id` - No trigger exists
7. `notify_quote_accept_reject` - No trigger exists
8. `notify_quote_proposal_accept_reject` - No trigger exists

### ❌ Broken Functions (Delete)

1. `create_quote_chat_session` - References non-existent `chat_sessions` table
2. `get_quote_conversation_from_session` - References non-existent `chat_sessions` table
3. `get_quote_id_from_conversation` - References non-existent `quote_conversations` table

---

## Security Issues Summary

### Functions Missing `SET search_path` (SECURITY DEFINER)

1. ❌ `create_quote_conversation`
2. ❌ `add_quote_message`
3. ❌ `create_quote_chat_session` (also broken)
4. ❌ `get_latest_quote_for_order`
5. ❌ `get_quote_conversation_from_session` (also broken)
6. ❌ `get_quote_id_from_conversation` (also broken)
7. ❌ `get_quote_messages_v2`
8. ❌ `get_quote_session_by_display_id`

### Functions with Proper Security

1. ✅ `api_get_or_create_quote_session` - Has `SET search_path`
2. ✅ `save_quote_spec` - Has `SET search_path`
3. ✅ `notify_admins_on_quote_created` - Has `SET search_path`
4. ✅ `notify_quote_accept_reject` - Has `SET search_path`
5. ✅ `notify_quote_events` - Has `SET search_path`
6. ✅ `notify_quote_proposal_accept_reject` - Has `SET search_path`
7. ✅ `format_quote_status` - SECURITY INVOKER (no issue)
8. ✅ `generate_quote_display_id` - SECURITY INVOKER (no issue)

---

## Recommendations

### Immediate Actions

1. **DELETE Broken Functions:**
   - `create_quote_chat_session`
   - `get_quote_conversation_from_session`
   - `get_quote_id_from_conversation`

2. **DELETE Unused Functions:**
   - `create_quote_conversation`
   - `add_quote_message`
   - `get_latest_quote_for_order`
   - `get_quote_messages_v2`
   - `get_quote_session_by_display_id`
   - `generate_quote_display_id` (no trigger exists)
   - `notify_quote_accept_reject` (no trigger exists)
   - `notify_quote_proposal_accept_reject` (no trigger exists)

3. **DECISION NEEDED:**
   - `api_get_or_create_quote_session` - Keep or delete? (Documented but unused)

### Migration Script Structure

```sql
-- Drop broken functions (reference non-existent tables)
DROP FUNCTION IF EXISTS create_quote_chat_session(uuid, uuid, text);
DROP FUNCTION IF EXISTS get_quote_conversation_from_session(uuid);
DROP FUNCTION IF EXISTS get_quote_id_from_conversation(uuid);

-- Drop unused functions
DROP FUNCTION IF EXISTS create_quote_conversation(uuid, uuid);
DROP FUNCTION IF EXISTS add_quote_message(uuid, uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS get_latest_quote_for_order(text);
DROP FUNCTION IF EXISTS get_quote_messages_v2(uuid);
DROP FUNCTION IF EXISTS get_quote_session_by_display_id(text);

-- Drop unused trigger functions (no triggers exist)
DROP FUNCTION IF EXISTS generate_quote_display_id();
DROP FUNCTION IF EXISTS notify_quote_accept_reject();
DROP FUNCTION IF EXISTS notify_quote_proposal_accept_reject();

-- Decision needed: api_get_or_create_quote_session
-- DROP FUNCTION IF EXISTS api_get_or_create_quote_session(uuid);
```

---

## Internal RPC Call Dependencies

### Functions That Call Other Functions

1. `notify_quote_events` → calls `format_quote_status()`
2. `save_quote_spec` → calls `is_admin()`
3. `generate_quote_display_id` → uses `nextval('quote_display_seq')`
4. `create_quote_conversation` → uses `nextval('quote_display_seq')` (via RPC)

### Functions That Use Encryption

1. `add_quote_message` → uses `pgp_sym_encrypt`
2. `get_quote_messages_v2` → uses `pgp_sym_decrypt`
   - Both read from `app.encryption_key` setting

---

## Next Steps

1. ✅ Verified trigger existence - 3 trigger functions have no triggers
2. Create migration to drop unused/broken functions (11 functions total)
3. Document decision on `api_get_or_create_quote_session`
4. Update codebase to remove any references to deleted functions
5. Run security advisor after cleanup to confirm all issues resolved

## Final Summary

### Functions to Delete: 11 total

- **Broken (3):** References non-existent tables
- **Unused (8):** Not called anywhere, no triggers

### Functions to Keep: 5 total

- **Active (4):** `save_quote_spec`, `format_quote_status`, `notify_admins_on_quote_created`, `notify_quote_events`
- **Decision Needed (1):** `api_get_or_create_quote_session`

### Security Issues Fixed: 8 functions

- All unused/broken functions with security issues will be removed
