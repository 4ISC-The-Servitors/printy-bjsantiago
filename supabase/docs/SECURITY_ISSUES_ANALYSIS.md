# Security Issues Analysis Summary

## Critical Issues

- **`get_next_sequence_value`**
  - Missing `SET search_path`
  - Active in production (called from TypeScript)
  - **Fix:** Add `SET search_path = public`

- **`save_quote_spec`**
  - Uses insecure `public.is_admin()`
  - Calls `is_admin()` which resolves to insecure `public.is_admin()`
  - **Fix:** Change to `priv.is_admin()` (secure version)

## Important Discovery

- `priv.is_admin()` is secure and used throughout the codebase
- `public.is_admin()` is insecure (missing `search_path`) and is used by `save_quote_spec`
- **Fix:** Update `save_quote_spec` to use `priv.is_admin()`

## Other Issues

- 5 additional `SECURITY DEFINER` functions missing `SET search_path` (verify their usage first)
- 1 view with `SECURITY DEFINER` property (**ERROR** level)







# Security Issues Analysis Report

**Generated:** $(date)
**Purpose:** Comprehensive analysis of all security issues identified by Supabase security advisors.

## Executive Summary

- **Total Security Issues:** 34
  - **ERROR Level:** 1 (Security Definer View)
  - **WARN Level:** 33 (Function Search Path Mutable)
- **Functions Needing Fixes:** 7 SECURITY DEFINER functions
- **Functions OK (No Fix Needed):** 24 SECURITY INVOKER functions
- **Views Needing Fixes:** 1 view

---

## Security Issue Types

### 1. Security Definer View (ERROR Level)

**Issue:** Views defined with SECURITY DEFINER property enforce permissions of the view creator rather than the querying user.

**Affected:**

- `service_order_stats` view

**Severity:** ERROR

---

### 2. Function Search Path Mutable (WARN Level)

**Issue:** SECURITY DEFINER functions without `SET search_path` are vulnerable to search_path injection attacks.

**Affected Functions:** 7 SECURITY DEFINER functions need fixes

---

## Detailed Analysis

### ERROR: Security Definer View

#### `service_order_stats` View

**Status:** ❌ **NEEDS FIX**
**Type:** View with SECURITY DEFINER
**Severity:** ERROR

**Definition:**

```sql
CREATE VIEW service_order_stats AS
SELECT s.service_id,
    count(DISTINCT o.order_id) AS total_order_count
FROM (printing_services s
    LEFT JOIN orders o ON (((o.status = 'completed'::text)
    AND ((o.service_id = s.service_id)
    OR ((o.service_id IS NULL)
    AND ((o.order_specs ->> 'service_id'::text) = (s.display_id)::text))))))
GROUP BY s.service_id;
```

**Issue:**

- View uses SECURITY DEFINER property
- Enforces permissions of view creator (postgres) rather than querying user
- Can bypass Row Level Security (RLS) policies

**Usage:**

- Need to verify if view is actively used

**Recommendation:**

- **Option 1:** Remove SECURITY DEFINER property if not needed
- **Option 2:** Convert to regular view and rely on RLS policies
- **Option 3:** Create SECURITY INVOKER view instead

**Remediation:**

```sql
-- Check current view definition
SELECT pg_get_viewdef('public.service_order_stats'::regclass, true);

-- Recreate as SECURITY INVOKER view (if needed)
DROP VIEW IF EXISTS public.service_order_stats;
CREATE VIEW public.service_order_stats
WITH (security_invoker = true) AS
SELECT s.service_id,
    count(DISTINCT o.order_id) AS total_order_count
FROM (printing_services s
    LEFT JOIN orders o ON (((o.status = 'completed'::text)
    AND ((o.service_id = s.service_id)
    OR ((o.service_id IS NULL)
    AND ((o.order_specs ->> 'service_id'::text) = (s.display_id)::text))))))
GROUP BY s.service_id;
```

---

### WARN: Functions Missing SET search_path

#### 1. `append_chat_messages` ❌ **NEEDS FIX**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION append_chat_messages(
  p_session_id uuid,
  p_entries jsonb,
  p_last_message text,
  p_last_message_at timestamp with time zone
)
RETURNS void
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ⚠️ References `chat_sessions` table (legacy, non-v2)
- ⚠️ May be unused (legacy function)

**Tables Used:**

- `chat_sessions` (legacy table)

**Recommendation:**

- **Verify if used** - If unused, delete
- **If used** - Add `SET search_path = public`

**Fix:**

```sql
CREATE OR REPLACE FUNCTION append_chat_messages(
  p_session_id uuid,
  p_entries jsonb,
  p_last_message text,
  p_last_message_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
-- ... function body ...
$$;
```

---

#### 2. `get_next_sequence_value` ✅ **ACTIVE - NEEDS FIX**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION get_next_sequence_value(sequence_name text)
RETURNS bigint
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ✅ **ACTIVE** - Called from TypeScript:
  - `src/features/chat/actions/customer/createQuoteConversation.ts`
  - Used to generate quote display IDs

**Tables Used:**

- Uses `nextval()` function with sequence names

**Recommendation:**

- **FIX REQUIRED** - Add `SET search_path = public`
- Function is actively used, must be fixed

**Fix:**

```sql
CREATE OR REPLACE FUNCTION get_next_sequence_value(sequence_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
BEGIN
  RETURN nextval(sequence_name::regclass);
END;
$$;
```

---

#### 3. `is_admin` ✅ **ACTIVE - NEEDS FIX**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ⚠️ **POTENTIALLY UNUSED** - RLS policies use `priv.is_admin()` (secure)
- ⚠️ `save_quote_spec` function calls `is_admin()` - need to verify which one
- ⚠️ May be duplicate of `priv.is_admin()` function

**Tables Used:**

- `customer` table

**Note:** There's a `priv.is_admin()` function that has proper `SET search_path = public` and is secure.

**IMPORTANT:** `save_quote_spec` function calls `is_admin()` without schema prefix. Since `save_quote_spec` has `SET search_path = public`, it resolves to `public.is_admin()` (insecure version).

**Recommendation:**

- **OPTION 1 (RECOMMENDED):** Fix `save_quote_spec` to use `priv.is_admin()` explicitly
- **OPTION 2:** Fix `public.is_admin()` by adding `SET search_path = public`
- **OPTION 3:** Add `priv` to search_path in functions that need it

**Fix:**

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customer
    WHERE customer_id = auth.uid()
    AND customer_type = 'admin'
  );
END;
$$;
```

---

#### 4. `is_admin_user` ❌ **NEEDS FIX - DUPLICATE?**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION is_admin_user()
RETURNS boolean
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ⚠️ **POTENTIALLY UNUSED** - Duplicate of `is_admin()`
- Same functionality as `is_admin()`

**Tables Used:**

- `customer` table

**Recommendation:**

- **FIX REQUIRED** - Add `SET search_path = public`
- **OR DELETE** - If duplicate and unused

**Fix:**

```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customer
    WHERE customer_id = auth.uid()
    AND customer_type = 'admin'
  );
END;
$$;
```

---

#### 5. `is_superadmin` ❌ **NEEDS FIX**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ⚠️ Need to verify usage

**Tables Used:**

- `customer` table

**Recommendation:**

- **FIX REQUIRED** - Add `SET search_path = public`

**Fix:**

```sql
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customer c
    WHERE c.customer_id = (SELECT auth.uid())
      AND c.customer_type = 'superadmin'
  );
$$;
```

---

#### 6. `update_order_status` ❌ **NEEDS FIX**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION update_order_status(
  p_order_id uuid,
  p_status text,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ⚠️ References `orders_duplicate` table (legacy?)
- ⚠️ May be unused

**Tables Used:**

- `customer` table
- `orders_duplicate` table

**Recommendation:**

- **Verify if used** - If unused, delete
- **If used** - Add `SET search_path = public`

**Fix:**

```sql
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_status text,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
-- ... function body ...
$$;
```

---

#### 7. `user_is_admin` ❌ **NEEDS FIX - DUPLICATE?**

**Status:** ❌ **NEEDS FIX**
**Type:** SECURITY DEFINER
**Security:** Missing `SET search_path`

**Definition:**

```sql
CREATE FUNCTION user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
-- Missing: SET search_path = public
```

**Usage:**

- ⚠️ **POTENTIALLY UNUSED** - Duplicate of `is_admin()`
- Same functionality as `is_admin()`

**Tables Used:**

- `customer` table

**Recommendation:**

- **FIX REQUIRED** - Add `SET search_path = public`
- **OR DELETE** - If duplicate and unused

**Fix:**

```sql
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public  -- ✅ Add this
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
      AND customer_type = 'admin'
  );
$$;
```

---

## Functions That Are OK (No Fix Needed)

These functions are **SECURITY INVOKER** and don't need `SET search_path`:

1. ✅ `check_session_timeouts` - SECURITY INVOKER
2. ✅ `compute_location_id` (2 overloads) - SECURITY INVOKER
3. ✅ `create_timeout_warning` - SECURITY INVOKER
4. ✅ `format_order_status` - SECURITY INVOKER
5. ✅ `format_quote_status` - SECURITY INVOKER
6. ✅ `format_ticket_status` - SECURITY INVOKER
7. ✅ `generate_barangay_id` - SECURITY INVOKER
8. ✅ `generate_building_id` - SECURITY INVOKER
9. ✅ `generate_city_id` - SECURITY INVOKER
10. ✅ `generate_location_id` - SECURITY INVOKER
11. ✅ `generate_order_display_id` - SECURITY INVOKER
12. ✅ `generate_province_id` - SECURITY INVOKER
13. ✅ `generate_region_id` - SECURITY INVOKER
14. ✅ `generate_service_display_id` - SECURITY INVOKER
15. ✅ `generate_street_id` - SECURITY INVOKER
16. ✅ `generate_ticket_display_id` - SECURITY INVOKER
17. ✅ `set_updated_at` - SECURITY INVOKER
18. ✅ `store_file_upload` - SECURITY INVOKER
19. ✅ `sync_chat_session_helpers` - SECURITY INVOKER
20. ✅ `trigger_set_timestamp` - SECURITY INVOKER
21. ✅ `update_inquiries_updated_at_column` - SECURITY INVOKER
22. ✅ `update_orders_updated_at` - SECURITY INVOKER
23. ✅ `update_payment_methods_updated_at` - SECURITY INVOKER
24. ✅ `update_session_timeout` - SECURITY INVOKER
25. ✅ `update_timestamp` - SECURITY INVOKER
26. ✅ `update_updated_at_column` - SECURITY INVOKER

---

## Summary

### Functions Needing Security Fixes: 7

1. ✅ **CRITICAL - FIX IMMEDIATELY:**
   - `get_next_sequence_value` - Active, used in production (TypeScript calls it)
   - `save_quote_spec` - Fix to use `priv.is_admin()` instead of `public.is_admin()`

2. ⚠️ **HIGH PRIORITY - VERIFY THEN FIX:**
   - `is_admin` - Used by `save_quote_spec` (insecure), should use `priv.is_admin()` instead
   - `is_admin_user` - May be duplicate, verify usage
   - `user_is_admin` - May be duplicate, verify usage
   - `is_superadmin` - Verify usage

3. ⚠️ **MEDIUM PRIORITY - VERIFY THEN FIX:**
   - `append_chat_messages` - Legacy function, references `chat_sessions` (non-v2)
   - `update_order_status` - Legacy function, references `orders_duplicate`

### Views Needing Security Fixes: 1

1. ❌ **ERROR LEVEL:**
   - `service_order_stats` - SECURITY DEFINER view

---

## Migration Script

```sql
-- ============================================
-- SECURITY FIXES: Add SET search_path to SECURITY DEFINER functions
-- ============================================

-- 1. Fix get_next_sequence_value (CRITICAL - Active)
CREATE OR REPLACE FUNCTION get_next_sequence_value(sequence_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN nextval(sequence_name::regclass);
END;
$$;

-- 2. Fix save_quote_spec to use priv.is_admin() instead of public.is_admin()
-- CRITICAL: save_quote_spec currently uses insecure public.is_admin()
CREATE OR REPLACE FUNCTION save_quote_spec(p_session_id uuid, p_spec_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spec_id uuid;
  v_session_exists boolean;
BEGIN
  -- Verify the user is an admin (use secure priv.is_admin())
  IF NOT priv.is_admin() THEN  -- ✅ Changed from is_admin() to priv.is_admin()
    RAISE EXCEPTION 'Only admins can save quote specifications';
  END IF;

  -- Verify the session exists
  SELECT EXISTS (
    SELECT 1 FROM chat_sessions_v2
    WHERE session_id = p_session_id
  ) INTO v_session_exists;

  IF NOT v_session_exists THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Insert the spec
  INSERT INTO quote_specs (session_id, spec_data)
  VALUES (p_session_id, p_spec_data)
  RETURNING spec_id INTO v_spec_id;

  RETURN v_spec_id;
END;
$$;

-- 2b. Fix is_admin (OPTIONAL - Only if needed elsewhere, otherwise delete)
-- NOTE: priv.is_admin() exists and is secure. This may be unused duplicate.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customer
    WHERE customer_id = auth.uid()
    AND customer_type = 'admin'
  );
END;
$$;

-- 3. Fix is_admin_user (Verify if duplicate/unused)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM customer
    WHERE customer_id = auth.uid()
    AND customer_type = 'admin'
  );
END;
$$;

-- 4. Fix is_superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customer c
    WHERE c.customer_id = (SELECT auth.uid())
      AND c.customer_type = 'superadmin'
  );
$$;

-- 5. Fix user_is_admin (Verify if duplicate/unused)
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer
    WHERE customer_id = (SELECT auth.uid())
      AND customer_type = 'admin'
  );
$$;

-- 6. Fix append_chat_messages (Verify if used - legacy function)
CREATE OR REPLACE FUNCTION append_chat_messages(
  p_session_id uuid,
  p_entries jsonb,
  p_last_message text,
  p_last_message_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  update public.chat_sessions c
  set session_data = (
        jsonb_set(
          jsonb_set(
            coalesce(c.session_data, '{}'::jsonb),
            '{messages}',
            coalesce(c.session_data->'messages', '[]'::jsonb) || coalesce(p_entries, '[]'::jsonb)
          ),
          '{last_message}', to_jsonb(p_last_message)
        )
      )
    , last_message_at = p_last_message_at
    , updated_at = now()
  where c.id = p_session_id;
end;
$$;

-- 7. Fix update_order_status (Verify if used - legacy function)
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_status text,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM customer
    WHERE customer_id = p_admin_id
    AND customer_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;

  -- Update order status
  UPDATE orders_duplicate
  SET
    status = p_status,
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_status = 'cancelled' THEN now() ELSE cancelled_at END,
    admin_notes = CASE
      WHEN p_admin_notes IS NOT NULL THEN
        COALESCE(admin_notes || E'\n', '') || 'Status updated to ' || p_status || ': ' || p_admin_notes
      ELSE
        admin_notes
      END
  WHERE order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END;
$$;

-- ============================================
-- FIX VIEW: service_order_stats
-- ============================================

-- Option 1: Recreate as SECURITY INVOKER view
DROP VIEW IF EXISTS public.service_order_stats;
CREATE VIEW public.service_order_stats
WITH (security_invoker = true) AS
SELECT s.service_id,
    count(DISTINCT o.order_id) AS total_order_count
FROM (printing_services s
    LEFT JOIN orders o ON (((o.status = 'completed'::text)
    AND ((o.service_id = s.service_id)
    OR ((o.service_id IS NULL)
    AND ((o.order_specs ->> 'service_id'::text) = (s.display_id)::text))))))
GROUP BY s.service_id;

-- Grant permissions
GRANT SELECT ON public.service_order_stats TO authenticated, anon;
```

---

## Important Discovery

**`priv.is_admin()` Function:**

- ✅ **SECURE** - Has `SET search_path = public, extensions`
- ✅ **ACTIVE** - Used extensively throughout codebase:
  - RLS policies on `chat_sessions_v2`, `chat_messages_v2`, `chat_flows_v2`
  - Authorization checks in API functions
  - All references use `priv.is_admin()` (secure version)

**`public.is_admin()` Function:**

- ❌ **INSECURE** - Missing `SET search_path`
- ⚠️ **POTENTIALLY UNUSED** - May be duplicate of `priv.is_admin()`
- Need to verify if `save_quote_spec` uses `public.is_admin()` or `priv.is_admin()`

---

## Next Steps

1. **Immediate Actions:**
   - ✅ Fix `get_next_sequence_value` - Critical, active usage in TypeScript
   - ⚠️ Verify `save_quote_spec` uses `priv.is_admin()` (secure) not `public.is_admin()` (insecure)

2. **Verify Usage:**
   - Check if `public.is_admin()` is used anywhere (may be unused duplicate)
   - Check if `is_admin_user` is used (duplicate of `is_admin`?)
   - Check if `user_is_admin` is used (duplicate of `is_admin`?)
   - Check if `is_superadmin` is used
   - Check if `append_chat_messages` is used (legacy function)
   - Check if `update_order_status` is used (legacy function)

3. **Cleanup (After Verification):**
   - Delete unused duplicate functions
   - Consolidate to use `priv.is_admin()` consistently

4. **Fix View:**
   - Fix `service_order_stats` view security issue

5. **Testing:**
   - Test all functions after fixes
   - Verify RLS policies still work with `is_admin()` fix
   - Verify sequence generation still works with `get_next_sequence_value()` fix

6. **Cleanup:**
   - Consider removing duplicate functions (`is_admin_user`, `user_is_admin`)
   - Consider removing unused legacy functions

---

## Additional Security Recommendations

### Auth Configuration

1. **Leaked Password Protection (WARN):**
   - Currently disabled
   - Recommendation: Enable HaveIBeenPwned.org checking
   - Remediation: Enable in Supabase Auth settings

2. **PostgreSQL Version (WARN):**
   - Current: supabase-postgres-17.4.1.069
   - Security patches available
   - Recommendation: Upgrade to latest version
   - Remediation: Upgrade via Supabase dashboard

---

## References

- Supabase Security Advisor: https://supabase.com/docs/guides/database/database-linter
- Function Search Path Security: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- Security Definer View: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
