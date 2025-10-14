# Printy by B.J. Santiago - made by The Servitors

## 📄 Changelogs

### 2025-10-14-Andeng

- **Cohere AI Integration**  
  - Added Cohere AI API (requires env file updates)

- **Payment Proof System Improvements**  
  - Added comprehensive payment proof upload functionality for customers  
  - Created new payment-proofs (authenticated) and payment-methods (public) buckets in Supabase  
  - Implemented `usePaymentProofUpload` hook for handling customer payment proof uploads  
  - Added `uploadPaymentProof` utility with file validation and secure storage  
  - Created admin utility `getPaymentProofUrl` for viewing customer payment proofs
  - Updated payment flow to automatically change order status to "verifying_payment" after upload  
  - Altered some order status changes  
  - Added proper RLS policies for secure file access (customers see own files, admins see all)

- **Database Schema Enhancements**  
  - Made new quote tables in Supabase  
  - Added payment-proofs, and payment-methods bucket in Supabase
  - Created display_id system for better UI identification across quotes, orders, and tickets  
  - Added API functions for inquiry management with display_id support  
  - Updated all relevant tables and functions to support the new display_id system

- **Quote, Payment, and Order Flow**  
  - Customer and admin quote, payment, and order flow working (needs more UI improvements for real-time status changes)  

- **UI/UX Improvements**  
  - Removed cancel order functionality to streamline order management  
  - Enhanced status badges and formatting across customer dashboard  
  - Improved recent order, ticket, and quote UI for customer side (to follow for admin next)  
  - Updated order display components to use display_id for better user experience  
  - Improved payment verification flow for admin users  
  - Added order, ticket, and quote history pages for customer  
  - Removed admin quick access in sign in page  
  - Added visual widget for Cloudflare

### 2025-10-12-Andeng

- **AI Quote System Implementation**
  - Complete overhaul of quote management system with AI integration
  - Created comprehensive quote flow for customers (`AskQuote.ts`, `TrackQuote.ts`)
  - Implemented admin quote management with AI-powered responses (`Quotes.ts`)
  - Added LLM client integration for intelligent quote generation and responses
  - Created quote-specific database tables and relationships
  - Built quote conversation tracking and management system

- **Quote Management Features**
  - Customer can request quotes through chat interface
  - Admin can create, edit, and manage quotes with AI assistance or manually
  - Quote specification editor with dynamic form handling
  - Quote acceptance flow for customers
  - Real-time quote status tracking and updates
  - Integration with existing order and ticket systems

- **Database Architecture**
  - Created quote tables with proper relationships to orders and customers
  - Added quote-specific migrations and API functions
  - Implemented quote session linking for chat flow integration
  - Updated existing tables to support quote workflows

- **Chat Flow Integration**
  - Integrated quote flows into existing chat system
  - Added quote-specific message handling and quick replies
  - Created quote conversation hooks and API endpoints
  - Seamless integration with customer dashboard and admin panels


### 2025-10-03-Security

- Added column-level encryption for sensitive fields using `supabase_vault` + `pgcrypto`.
  - New migration: `supabase/sql/020_column_encryption.sql` creates encrypted columns, triggers, and decrypted views:
    - `chat_messages_secure` (for reads) and `inquiries_secure` (+ `inquiries_secure_with_customer`).
  - App updates: all SELECTs now read from secure views; INSERT/UPDATE stay on base tables (triggers encrypt).
- Transport hardening recommendations (hosting config):
  - Enforce HTTPS redirects and add HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
  - Keep CSP strict; only allow known script/style origins.
  - Ensure `VITE_SUPABASE_URL` uses `https://`.

### 2025-09-30-Andeng

- npm i -D ts-node typescript
- npm i -D tsx
- $env:Path += ";$env:LOCALAPPDATA\Programs\Ollama"
- ollama pull dolphin3:8b

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
