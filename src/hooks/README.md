# Centralized Hooks Organization

This directory contains all custom React hooks organized by functionality and scope.

## Structure

```
src/hooks/
├── core/           # Core application hooks (chat, state management)
├── ui/             # UI-related hooks (responsive, formatting, interactions)
├── admin/          # Admin-specific hooks and contexts
├── customer/       # Customer-specific hooks
├── api/            # API and data fetching hooks
├── auth/           # Authentication and user-related hooks
└── shared/         # Shared utilities and common hooks
```

## Categories

### Core (`/core/`)
- Chat functionality and conversation management
- Application state management
- Core business logic hooks

### UI (`/ui/`)
- Responsive design hooks (breakpoints, mobile detection)
- UI interaction hooks (sidebar, selections)
- Formatting and display utilities

### Admin (`/admin/`)
- Admin dashboard functionality
- Admin-specific contexts and state
- Admin UI interactions

### Customer (`/customer/`)
- Customer dashboard functionality
- Customer-specific chat interactions
- Customer data management

### API (`/api/`)
- Data fetching and API interactions
- External service integrations
- Request/response handling

### Auth (`/auth/`)
- Authentication state management
- User session handling
- Login/logout functionality

### Shared (`/shared/`)
- Common utilities used across multiple domains
- Generic reusable hooks
- Cross-cutting concerns

## Migration Plan

### Completed Migrations ✅

**From `src/features/chat/core/hooks/` → `src/hooks/core/`:**
- `useChatAttachments.ts`
- `useConversationController.ts` 
- `useConversationState.ts`
- `useConversationSwitcher.ts`

**From `src/features/chat/customer/hooks/` → `src/hooks/customer/`:**
- `useCustomerConversations.ts`
- `useDashboardChatEvents.ts`
- `useRecentChatSessions.ts`
- `useRecentOrder.ts`
- `useRecentTicket.ts`

**From `src/features/chat/admin/hooks/` → `src/hooks/admin/`:**
- `useAdminTickets.ts`

**From `src/features/api/hooks/` → `src/hooks/api/`:**
- `useQuoteActions.ts`

**From `src/features/toast/hooks/` → `src/hooks/auth/`:**
- `useLogoutWithToast.ts`

**From `src/hooks/shared/` → `src/hooks/ui/`:**
- `useBreakpoint.ts`
- `useIsMobile.ts`
- `useResponsiveListItems.ts`
- `useResponsivePageSize.ts`
- `useSidebarCollapse.ts`

**Kept in `src/hooks/shared/`:**
- `usePriceFormatter.ts` (shared utility)

### Next Steps Required

1. **Update Import Statements**: Search and replace import paths in all files
2. **Remove Empty Directories**: Clean up the old feature-based hook directories
3. **Update Build Configuration**: Ensure Vite/build tools recognize new paths
4. **Test Application**: Verify all hooks work correctly after migration

### Import Guidelines

**Recommended import patterns:**
```typescript
// Import from specific category (preferred)
import { useConversationState } from '@/hooks/core';
import { useIsMobile } from '@/hooks/ui';
import { useCustomerConversations } from '@/hooks/customer';

// Import from main index (less preferred, but available)
import { useConversationState, useIsMobile } from '@/hooks';
```

**Benefits of this structure:**
- Clear separation of concerns
- Easy to find hooks by functionality
- Simplified imports with barrel exports
- Better maintainability and scalability
