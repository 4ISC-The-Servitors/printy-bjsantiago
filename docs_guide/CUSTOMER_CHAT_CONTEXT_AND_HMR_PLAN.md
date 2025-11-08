# Customer Chat Context & HMR Refetch Plan

## Context

- Error observed: "useCustomerConversationsContext must be used within CustomerConversationsProvider" during initial render of the customer dashboard.
- Customer pages also refetch and show loading states after code edits (HMR), while admin pages often preserve state.

## Current Behavior (Confirmed)

- `CustomerDashboardContent` and `ResponsivePageLayout` call `useCustomerConversationsContext` on render.
- The provider is currently applied inside `CustomerDashboard` (page-level), not at the customer root.
- `SessionCacheProvider` in `CustomerRoot` loads sessions on mount and on `customerId` changes.
- HMR invalidates modules within the customer pages subtree, causing remounts and re-running effects, resulting in visible loading states.

## Why the Error Happens

- Any consumer calling `useCustomerConversationsContext` outside an active `CustomerConversationsProvider` throws.
- Because the provider is mounted at the page level (`CustomerDashboard`), any consumer used by shared layout/components that render prior to or outside that page will trigger the error.
- During HMR, if the provider boundary is re-instantiated after consumers render, a transient mismatch can also throw.

## Why Customer Refetches on HMR

- `SessionCacheProvider` refetches sessions on mount; HMR remounts it (or its consumers) frequently due to live edits.
- Recent data hooks in the dashboard (orders/tickets/quotes) refetch on mount as well.
- Admin has fewer fetch-on-mount hooks/providers and often hits more stable HMR boundaries, so state is preserved more frequently.

---

## Phased Plan

### Phase 1 — Stabilize Provider Hierarchy (Scope: Customer area only)

Goal: Ensure all customer pages and shared layouts that consume chat context are always wrapped by the provider, and reduce HMR-induced mismatches.

- Move `CustomerConversationsProvider` from the `CustomerDashboard` page to `CustomerRoot` (or a stable boundary immediately inside `CustomerRoot`), above any component that might render `ResponsivePageLayout` or other chat consumers.
- Keep `SessionCacheProvider` in `CustomerRoot` (already present) so conversations can be hydrated once and shared reliably across pages.
- Outcome: No consumer renders without the provider; fewer remounts of the provider on page-level HMR.

Acceptance:

- Navigating to `/customer` renders without the context error.
- Switching between customer subpages does not break chat context usage in shared layouts.

### Phase 2 — Tighten Effects & Memoization

Goal: Prevent unnecessary refetches on benign HMR updates and normal navigations.

- `SessionCacheProvider`
  - Guard the loader so it runs only when `customerId` is non-null and has actually changed.
  - Ensure dependency arrays are minimal and stable; memoize derived values.
- `CustomerConversationsProvider`
  - Avoid recomputing context value unless state actually changes (current memoization is good; verify functions are `useCallback`-stable in the composer hook).
- `CustomerDashboardContent` recent-data hooks
  - Ensure they don’t run until `customerId` is known.
  - Avoid setState loops on mount.

Acceptance:

- After a small edit that does not touch provider files, the customer dashboard does not flicker loaders.
- Network tab shows no redundant session fetch when props/deps haven’t changed.

### Phase 3 — Add Cache Layer for Data Hooks

Goal: Visible stability on hot updates and navigation without repeated flashes.

- Introduce a lightweight cache strategy for recent order/ticket/quote hooks.
  - Options: React Query/SWR, or an internal cache keyed by `customerId` with staleness TTL.
  - Ensure cache survives component remounts and returns cached data instantly, then revalidates in background.

Acceptance:

- Hot updates no longer cause loaders to appear when data is fresh in cache.
- Background revalidation updates UI without blocking.

### Phase 4 — Route-Level Lazy Loading & Import Hygiene

Goal: Reduce the HMR impact surface and avoid remounting large subtrees.

- Lazy-load customer subpages that aren’t on screen.
- Avoid importing chat providers and heavy hooks in files that don’t need them.
- Keep shared layout imports minimal; feature-heavy components should be lazily imported inside boundaries that already have providers.

Acceptance:

- Editing unrelated feature files does not cause the main customer dashboard tree to remount.
- Only the edited route/module refreshes with minimal impact.

### Phase 5 — Error Boundaries and UX Polish

Goal: Contain failures and remove disruptive UX during updates.

- Add an error boundary around customer pages to prevent a provider mismatch from crashing the whole view during development.
- Provide a small non-blocking spinner for background refreshes; avoid full-page loaders when cached data exists.

Acceptance:

- In development, transient errors show a localized fallback instead of a full crash.
- In production, cached-first UI prevents disruptive flicker.

---

## Implementation Notes

- Provider Placement
  - Place `CustomerConversationsProvider` directly inside `CustomerRoot` (which already wraps children with `SessionCacheProvider`). This guarantees `ResponsivePageLayout` and any nested pages have context.

- Effect Guards
  - Ensure `SessionCacheProvider` refetch runs only when `customerId` transitions from undefined → defined or actually changes.
  - Memoize mapped `sessions` to avoid re-triggering downstream consumers.

- Cache Strategy (If not adopting React Query yet)
  - Keep a module-level cache per recent hook keyed by `customerId` with timestamps.
  - On mount, return cached data if fresh; fire a revalidation fetch that updates state when completed.

- HMR Considerations
  - Prefer stable provider boundaries that aren’t frequently edited.
  - Avoid editing provider files while iterating on UI; this minimizes provider remounts during HMR.

---

## Risks

- Moving providers can change mount order; audit any code relying on initial render timing.
- Cache introduces data-staleness risk; set reasonable TTLs and always revalidate in background.

---

## Rollout Checklist

- Move the chat provider to `CustomerRoot` and verify all customer routes.
- Validate no duplicate message issues reappear (ensure composer hook duplicate protections remain intact).
- Confirm loaders no longer flash on small edits; verify with DevTools network panel.
- Add an error boundary for customer routes (dev only is fine initially).

---

## Expected Outcomes

- Context error eliminated under normal navigation and during HMR.
- Noticeably fewer user-visible loading flashes on the customer side.
- More resilient customer runtime with clear ownership of data loading and display.
