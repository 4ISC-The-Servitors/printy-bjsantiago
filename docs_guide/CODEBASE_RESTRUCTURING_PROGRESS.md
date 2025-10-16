# Codebase Restructuring Progress

**Status:** Phase 6 Complete (6/8)
**Branch:** `ui-improvements`
**Last Updated:** 2025-10-17

---

## 🎯 Quick Summary

Restructuring scattered 301-file codebase into clean role-based architecture.

**Completed:** Phases 1-6 (JSONB stabilization, path aliases, shared components, admin, customer, guest & auth modules)
**Next:** Phase 7 (Migrate shared hooks/utils/types)

---

## ✅ What's Been Done (CRITICAL - DO NOT FORGET)

### Phase 1: JSONB Chat System ✅

**COMPLETED:** All action handlers documented, registry verified

- ✅ Created `src/features/chat/core/services/README.md` - comprehensive architecture doc
- ✅ Added JSDoc to 11 action handlers (7 customer + 4 admin)
- ✅ Verified unified action registry working
- **Files:** 13 modified (12 handlers + 1 README)

**Action Handlers:**
- Customer: `verify_order`, `display_quote_details`, `upload_payment_proof`, `accept_quote_proposal`, `reject_quote_proposal`, `create_quote_conversation`, `create_inquiry`
- Admin: `display_quote_details_admin`, `ai_summarize_specs`, `send_quote_proposal`, `open_spec_editor`

### Phase 2: Path Aliases & Cleanup ✅

**COMPLETED:** Aliases configured, legacy system removed

- ✅ Updated `tsconfig.app.json` with complete path aliases (`@admin/*`, `@customer/*`, `@guest/*`, `@shared/*`, `@features/*`, etc.)
- ✅ Updated `vite.config.ts` with new chunk splitting
- ✅ **DELETED `src/chatLogic/` folder** - 37 scripted flow files removed
- ✅ Fixed `LandingPage.tsx` - added placeholder for guest flows
- **Files:** 3 modified, 37 deleted

**🚨 CRITICAL:** `chatLogic/` is GONE - all flows now JSONB only

### Phase 3: Role Structure & Shared Components ✅

**COMPLETED:** New directories created, shared components migrated

- ✅ Created role-based structure: `admin/`, `customer/`, `guest/`, `shared/`
- ✅ Migrated 17 shared components to categorized structure
- ✅ Created comprehensive barrel exports (5 files)
- ✅ **DELETED Checkbox component** (user requested - tied to selection system)
- ✅ **DELETED `selectionUtils.ts`** (user requested)
- ✅ Fixed all import paths in moved components
- ✅ Maintained backward compatibility via re-exports
- **Files:** 17 migrated, 10 dirs created, 5 exports, 2 deleted

**Component Migration:**
```
UI (11):        Badge, Button, Card, Input, Modal, Pagination, Skeleton, Switch, Text, Tooltip
Layout (2):     Container, PageLoading
Forms (3):      Search, Filter, Turnstile
Feedback (3):   Notification, Toast, ToastContainer
```

**🚨 CRITICAL:** Checkbox and selectionUtils REMOVED - don't reference them

### Phase 4: Admin Module ✅

**COMPLETED:** Admin module fully migrated and restructured

- ✅ Copied all files from legacy locations to new structure:
  - `src/components/admin/*` → `src/admin/components/*` (36 files)
  - `src/hooks/admin/*` → `src/admin/hooks/*` (18 files)
  - `src/pages/admin/*` → `src/admin/pages/*` (8 files)
- ✅ Updated all imports to use `@admin/*` path aliases (62 files)
- ✅ Created comprehensive barrel exports (components, hooks, pages)
- ✅ Updated `App.tsx` to import from new admin module
- ✅ Fixed import paths:
  - `@components/admin` → `@admin/components`
  - `@hooks/admin` → `@admin/hooks`
  - Relative paths → aliases (`@shared/*`, `@lib/*`, `@features/*`, `@hooks/*`)
- ✅ Removed Checkbox usage from ServiceItem (component was deleted in Phase 3)
- **Files:** 62 migrated, 3 barrel exports created, 1 App.tsx updated

**Known Issues (Non-blocking):**
- Legacy admin files in `src/components/admin/`, `src/hooks/admin/`, `src/pages/admin/` still exist (will be deleted in Phase 8)
- Some TypeScript warnings about unused variables (due to commented Checkbox)
- Pre-existing type errors in codebase (not introduced by migration)

### Phase 5: Customer Module ✅

**COMPLETED:** Customer module fully migrated and restructured

- ✅ Copied all files from legacy locations to new structure:
  - `src/components/customer/*` → `src/customer/components/*` (50 files)
  - `src/hooks/customer/*` → `src/customer/hooks/*` (9 files)
  - `src/pages/customer/*` → `src/customer/pages/*` (7 files)
- ✅ Updated all imports to use `@customer/*` path aliases (66 files)
- ✅ Created comprehensive barrel exports (components, hooks, pages, main module)
- ✅ Updated `App.tsx` to import from new customer module
- ✅ Fixed import paths:
  - `@components/customer` → `@customer/components`
  - `@hooks/customer` → `@customer/hooks`
  - `@shared/utils/*` → `@utils/shared/*` (corrected incorrect agent suggestion)
  - `@features/chat/*` → `@components/chat/*` (types and layouts)
  - `@types/customer` → relative path `../../../types/customer`
  - `../core/useConversationState` → `@hooks/core/useConversationState`
- ✅ Enhanced hooks barrel export with missing exports (useRecentQuote, usePaymentProofUpload)
- **Files:** 66 migrated, 4 barrel exports created, 1 App.tsx updated

**Customer Module Structure:**
```
src/customer/
├── components/
│   ├── accountSettings/
│   │   ├── desktop/      # 4 components
│   │   └── mobile/       # 3 empty placeholder files (not exported)
│   ├── chatHistory/      # 4 components
│   ├── dashboard/
│   │   ├── chatCards/    # 8 components
│   │   ├── recentOrders/ # 7 components
│   │   ├── recentTickets/# 7 components
│   │   ├── recentQuotes/ # 5 components
│   │   ├── orderHistory/ # 1 component
│   │   ├── ticketHistory/# 1 component
│   │   └── quoteHistory/ # 1 component
│   └── shared/
│       ├── layouts/      # 2 components
│       └── sidebar/      # 6 components
├── hooks/                # 9 hooks (useCustomerConversations, useRecentOrder, etc.)
├── pages/                # 7 pages (Dashboard, AccountSettings, History pages, Root)
└── index.ts              # Main barrel export
```

**Known Issues (Non-blocking):**
- Legacy customer files in `src/components/customer/`, `src/hooks/customer/`, `src/pages/customer/` still exist (will be deleted in Phase 8)
- 3 mobile settings components are empty placeholder files (commented out in barrel exports)
- Some TypeScript errors in customer hooks (pre-existing, not migration-related)
- Pre-existing type errors in codebase (not introduced by migration)

---

## 📁 New Structure (Current State)

```
src/
├── admin/              # ✅ Phase 4 - MIGRATED
│   ├── components/     # ✅ 36 components
│   │   ├── orders/     # ✅ Card, Item, Skeleton
│   │   ├── portfolio/  # ✅ Card, Item, Skeleton
│   │   ├── quotes/     # ✅ Card, Item, Skeleton, SpecEditor
│   │   ├── tickets/    # ✅ Card, Item, Skeleton
│   │   ├── settings/   # ✅ Desktop + Mobile settings
│   │   └── shared/     # ✅ Layouts, Navigation, Sidebar, RecentChats
│   ├── hooks/          # ✅ 18 hooks
│   │   ├── portfolio/  # ✅ usePortfolio
│   │   └── *.ts        # ✅ Contexts + hooks
│   ├── pages/          # ✅ 8 pages
│   └── index.ts        # ✅ Main barrel export
├── customer/           # ✅ Phase 5 - MIGRATED
│   ├── components/     # ✅ 50 components
│   │   ├── accountSettings/  # ✅ Desktop (4), Mobile (3 empty)
│   │   ├── chatHistory/      # ✅ 4 components
│   │   ├── dashboard/        # ✅ ChatCards (8), Recent widgets (20), History (3)
│   │   └── shared/           # ✅ Layouts (2), Sidebar (6)
│   ├── hooks/          # ✅ 9 hooks
│   ├── pages/          # ✅ 7 pages
│   └── index.ts        # ✅ Main barrel export
├── guest/              # ✅ Phase 6 - MIGRATED
│   ├── components/     # ✅ 1 component (GuestChatPanel)
│   ├── pages/          # ✅ 1 page (LandingPage)
│   └── index.ts        # ✅ Main barrel export
├── auth/               # ✅ Phase 6 - CREATED & MIGRATED
│   ├── components/     # ✅ 10 components
│   │   ├── SignIn/     # ✅ Header, SignInForm, useSignIn
│   │   └── SignUp/     # ✅ Steps, Progress, Navigation, useSignUp
│   ├── pages/          # ✅ 4 pages
│   └── index.ts        # ✅ Main barrel export
├── shared/             # ✅ Created + populated
│   └── components/     # ✅ 17 components migrated
│       ├── ui/         # ✅ 11 components
│       ├── layout/     # ✅ 2 components
│       ├── forms/      # ✅ 3 components
│       └── feedback/   # ✅ 3 components
├── features/
│   └── chat/           # ✅ Documented + stabilized
│       └── services/
│           ├── actions/  # ✅ 11 handlers with JSDoc
│           └── README.md # ✅ Complete architecture doc
├── components/
│   ├── admin/          # ⚠️ Legacy (will delete Phase 8)
│   └── customer/       # ⚠️ Legacy (will delete Phase 8)
├── hooks/
│   ├── admin/          # ⚠️ Legacy (will delete Phase 8)
│   └── customer/       # ⚠️ Legacy (will delete Phase 8)
└── pages/
    ├── admin/          # ⚠️ Legacy (will delete Phase 8)
    └── customer/       # ⚠️ Legacy (will delete Phase 8)
```

---

## 🚨 Breaking Changes Reference

### 1. chatLogic/ DELETED
- **Location:** `src/chatLogic/` (entire folder)
- **What:** All scripted flows (admin, customer, guest)
- **Impact:** Guest flows on landing page now placeholder
- **Action Needed:** Migrate guest flows to JSONB before re-enabling

### 2. Checkbox Component REMOVED
- **Location:** `src/shared/components/ui/Checkbox.tsx` (deleted)
- **Why:** Connected to selection system (user requested removal)
- **Impact:** Any code using `<Checkbox>` will fail
- **Action Needed:** Use alternative or rebuild if required

### 3. selectionUtils REMOVED
- **Location:** `src/utils/admin/selectionUtils.ts` (deleted)
- **Why:** User requested selection code removal
- **Impact:** Selection features unavailable
- **Action Needed:** Re-implement if selection features needed

---

## 🎯 Path Aliases (Use These!)

```typescript
// ✅ Correct - Use aliases
import { Button } from '@shared/components/ui';
import { Container } from '@shared/components/layout';
import { useAdminOrders } from '@admin/hooks';
import { ChatService } from '@features/chat';

// ❌ Wrong - Don't use relative paths
import { Button } from '../../../shared/components/ui/Button';
import { Container } from '../../shared/components/layout/Container';
```

**Configured Aliases:**
- `@admin/*` → `src/admin/*` ✅
- `@customer/*` → `src/customer/*` ✅
- `@guest/*` → `src/guest/*` ✅
- `@auth/*` → `src/auth/*` ✅
- `@shared/*` → `src/shared/*` ✅
- `@features/*` → `src/features/*` ✅
- `@lib/*` → `src/lib/*` ✅
- `@utils/*` → `src/utils/*` (use `@utils/shared/*`, `@utils/admin/*`)
- `@components/*` → `src/components/*` (legacy, for chat components)
- `@hooks/*` → `src/hooks/*` (legacy, for core/auth hooks)

---

## 📋 Remaining Phases

### Phase 4: Admin Module ✅ COMPLETE
- ✅ Moved `src/components/admin/` → `src/admin/components/` (36 files)
- ✅ Moved `src/hooks/admin/` → `src/admin/hooks/` (18 files)
- ✅ Moved `src/pages/admin/` → `src/admin/pages/` (8 files)
- ✅ Updated all imports to use `@admin/*` aliases
- ✅ Created barrel exports for clean API
- **Actual:** 62 files, completed in 1 session

### Phase 5: Customer Module ✅ COMPLETE

### Phase 6: Guest & Auth Modules ✅ COMPLETE
- ✅ Moved `src/components/customer/` → `src/customer/components/` (50 files)
- ✅ Moved `src/hooks/customer/` → `src/customer/hooks/` (9 files)
- ✅ Moved `src/pages/customer/` → `src/customer/pages/` (7 files)
- ✅ Updated all imports to use `@customer/*` aliases
- ✅ Created barrel exports for clean API
- ✅ Fixed import path issues (utils, chat components, types)
- **Actual:** 66 files, completed in 1 session

### Phase 6: Guest & Auth Modules ✅ COMPLETE
- ✅ Moved `src/components/guest/chat/` → `src/guest/components/chat/` (1 file)
- ✅ Guest landing page already in `src/guest/pages/` (1 file)
- ✅ Created new `src/auth/` module for authentication
- ✅ Moved `src/pages/auth/` → `src/auth/pages/` (4 pages)
- ✅ Moved `src/components/auth/` → `src/auth/components/` (10 components)
- ✅ Added `@auth/*` path alias to tsconfig and vite config
- ✅ Updated all imports in auth and guest files to use aliases
- ✅ Created barrel exports for guest and auth modules
- ✅ Updated App.tsx to use `@guest/*` and `@auth/*` imports
- ✅ Build verified - no new errors introduced
- **Actual:** 16 files migrated, completed in 1 session

### Phase 7: Shared Hooks/Utils ⏳
- Migrate guest flows to JSONB
- Move `src/components/guest/` → `src/guest/components/`
- Consolidate auth, quotes, API features
- **Estimate:** ~75 files, 1-2 weeks

### Phase 7: Shared Hooks/Utils ⏳
- Move `src/hooks/` → `src/shared/hooks/`
- Move `src/utils/` → `src/shared/utils/`
- Move `src/types/` → `src/shared/types/`
- **Estimate:** ~55 files, 1 week

### Phase 8: Cleanup ⏳
- Delete old directories (`components/`, `hooks/`, `pages/`)
- Remove backward compatibility exports
- Optimize bundle splitting
- Full testing
- **Estimate:** 1 week

---

## 🏁 Success Criteria

- [ ] Zero `../../../` imports
- [ ] All components use path aliases
- [ ] Build succeeds with no errors
- [ ] No orphaned files
- [ ] Bundle size ≤ current
- [ ] All routes functional
- [ ] Full test coverage

---

## 📊 Progress Metrics

| Phase | Status | Files | Date |
|-------|--------|-------|------|
| 1: JSONB Stabilization | ✅ | 13 | 2025-10-17 |
| 2: Path Aliases | ✅ | 40 | 2025-10-17 |
| 3: Role Structure | ✅ | 34 | 2025-10-17 |
| 4: Admin | ✅ | 62 | 2025-10-17 |
| 5: Customer | ✅ | 66 | 2025-10-17 |
| 6: Guest/Auth | ✅ | 16 | 2025-10-17 |
| 7: Shared | ⏳ | ~55 | - |
| 8: Cleanup | ⏳ | - | - |

**Total Progress:** 231/~450 files (51%)

---

## 💡 Tips for Next Session

1. **Read this doc first** - Critical changes documented
2. **Check branch** - Should be `ui-improvements`
3. **Test build** - `npm run build` (has pre-existing errors, not from migration)
4. **Remember deletions** - chatLogic, Checkbox, selectionUtils are GONE
5. **Use aliases** - Import from `@shared/*`, `@admin/*`, `@customer/*`, etc.
6. **Admin & Customer modules complete** - All imports now use `@admin/*` and `@customer/*`
7. **Import path patterns** - Use `@utils/shared/*` not `@shared/utils/*`

**Build Status:** ⚠️ Has pre-existing TypeScript errors (not from migration)
- Admin & customer modules successfully migrated
- Remaining errors in legacy code and shared components
- Build will be cleaned up in Phase 8

**Key Learnings from Customer Migration:**
- Watch for incorrect import suggestions from automated tools (e.g., `@shared/utils` vs `@utils/shared`)
- Chat components live in `@components/chat/*`, not `@features/chat/*`
- Types should use relative paths when not in shared location
- Empty placeholder files should be excluded from barrel exports

---

## 📚 Related Docs

- `src/features/chat/core/services/README.md` - Chat architecture (✅ complete)
- `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md` - JSONB system overview
- `docs/DB_BACKED_CHAT_FLOW_MIGRATION.md` - Legacy migration notes

---

**Next Step:** Start Phase 7 - Migrate Shared Hooks/Utils/Types

**Phase 6 Completion Notes:**
- Guest module successfully migrated (2 files: 1 component + 1 page)
- New auth module created and populated (14 files: 10 components + 4 pages)
- All imports updated to use `@guest/*` and `@auth/*` aliases
- Barrel exports created for clean API access
- Added `@auth/*` path alias to tsconfig and vite config
- No new build errors introduced
- Legacy auth/guest files remain in `src/pages/auth/` and `src/components/auth/` (will be deleted in Phase 8)

**Phase 5 Completion Notes:**
- Customer module successfully migrated (66 files)
- All imports updated to use `@customer/*` aliases
- Barrel exports created for clean API access
- Import path issues identified and fixed
- No new build errors introduced
- Legacy customer files remain (will be deleted in Phase 8)
