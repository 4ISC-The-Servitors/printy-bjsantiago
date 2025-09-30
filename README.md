# Printy by B.J. Santiago - made by The Servitors

## 📄 Changelogs

### 2025-09-30-Andeng

- Customer chat refactor
  - Added feature core: adapters, services, actions, and small hooks
  - Composed hook: `useCustomerConversations` replaces page-local chat logic
  - New hooks: `useRecentOrder`, `useRecentTicket`, `useRecentChatSessions`, `useDashboardChatEvents`, `useChatAttachments`
  - Centralized logout with toasts: `useLogoutWithToast` (toast shows before redirect)
  - Sidebar consistency across Dashboard, ChatHistory, AccountSettings (status, date/time)
  - ChatHistory list simplified (title + status + date/time)
  - About Us flow validated end-to-end (DB-backed): start/send/quick-replies/switch/end, closing line + 1.5s redirect
  - Removed migration breadcrumbs and duplicate topics module; topics kept inline in `src/pages/customer/Dashboard.tsx`

- Issue Ticket migration to DB-backed flow
  - Schema changes (no new tables):
    - `chat_flow_nodes`: added `node_action` (text enum) and `action_config` (jsonb)
    - `chat_session_flow`: added `context` (jsonb) and `updated_at` (timestamptz)
    - Migration file: `supabase/sql/013_alter_chat_flow_for_issue_ticket.sql`
  - Seeded flow graph and actions:
    - `supabase/sql/014_seed_flow_issue_ticket.sql` inserts nodes/options for `issue-ticket` and updates per-node `node_action`/`action_config`
  - Shared end node:
    - Introduced `shared` flow with global `end` node and ensured all "End Chat" options reference `to_node_id = 'end'`
    - Migration file: `supabase/sql/019_link_shared_end.sql`
  - Policies:
    - `supabase/sql/015_inquiries_and_orders_policies.sql` enforces RLS for `inquiries` (own rows, admin override) and `orders` (own rows)
  - Rollbacks:
    - Soft: remove `issue-ticket` flow graph and reset node actions (`017_rollback_issue_ticket_soft.sql`)
    - Hard: also drop added columns from `chat_flow_nodes`/`chat_session_flow` (`018_rollback_issue_ticket_hard.sql`)
  - App integration:
    - Treat `issue-ticket` as DB-backed like `about` (sessioning, messages, options, history)
    - `endConversation` prefers current flow end, then `shared` end
    - Commented out scripted `IssueTicket.ts` registry entries to avoid duplication
    - Hooks updated to pass `customerId` to DB-backed flows and to load/switch sessions for `issue-ticket`

- Dashboard cleanup and structure
  - Replaced inline Supabase effects with hooks (recent data, sessions, events)
  - Introduced `useChatAttachments` in core; file uploads send via object URL
  - Kept topics inline per preference; removed `features/chat/customer/config/topics.*`

- Bug fixes / behavior
  - Prevented duplicate messages by replacing DB-backed message list after each send
  - Ensured session end writes closing line and flips DB status to `ended`

### 2025-09-23-Andeng

- added Cancel Order logic for customer, to follow admin
- improved admin mobile UI for orders and all chats page, to follow ticket and portfolio
- added Recent Chats to admin in sidebars
- added All Chats page to view all chat history in admin, to follow customer
- improved message group of overall chat UI
- added pagination to some pages pa lang, will add more to pages soon (src\components\shared\Pagination.tsx)
- added src\hooks\shared\useResponsivePageSize.ts for not having too many data displayed depending on screen size

### 2025-09-19-Andeng

- added Payment chat logic for customer
- chat renders actual images for QRPH codes as sample (gcash, may) and file uploads by user
- added Pay Now button that only shows when order status is AWAITING PAYMENT
- Pay Now button now hides if status changes to Verifying Payment
- added back flow if customer changes mind for payment method
- added Admin verify payment (single & multiple) chat logic

### 2025-09-16-Andeng

- COMPLETE:
- added backend TODOs in start of admin files. search for comments with "BACKEND_TODO" exactly
- admin desktop ui/ux
- base chat logic for dynamically changing status, creating quote, editing service, adding service, replying to ticket

- TO FOLLOW:
- align mobile responsiveness with desktop features
- polish chat logic
- typing animations for chats
- recent chats/conversation like in customer

### 2025-08-29-Andeng

- Updated structure of README file
- Updated dependencies for package.json
- Updated code formats (ran prettier)
- Updated src/lib/supabase.ts
- Added sign in toast message
- Added sign up toast message to confirm email first for access
- Added new page: Reset password (works as intended na)
- Renamed ForgotPassword page
- Removed 74 lint errors
- Improved sign up page to check for duplicate email and phone number registrations

### 2025-08-29-Liam

- Added Supabase SQL Migration Guide with PowerShell/psql steps
- Added quick links to Migration Guide and Changelog
- Kept existing setup and status sections unchanged; no breaking changes