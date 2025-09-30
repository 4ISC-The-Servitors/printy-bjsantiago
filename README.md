# Printy - Modern Print Shop Management System

**🔗 Quick Links**

- [Changelogs](#-changelogs)
- [Current Status](#-current-status)
- [TODO - Backend Integration](#-todo---complete-backend-integration-checklist)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Supabase SQL Migration Guide](#-supabase-sql-migration-guide)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#️-project-structure)
- [Design System](#-design-system)
- [Responsive Design](#-responsive-design)
- [Development Standards](#-development-standards)
- [Scripts](#-scripts)
- [Browser Support & Performance](#-browser-support--performance)
- [Contributing](#-contributing)
- [Backend Integration Guide](./BACKEND_INTEGRATION.md#account-settings-integration-plan)

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

## 🚀 Current Status

**✅ COMPLETED:**

- Modern Design System with comprehensive component library
- Mobile-first responsive design
- Authentication (Sign In, Sign Up, Reset Password)
- Customer Dashboard with chat interface
- Sample chat flow system for About Us, FAQs, and basic interactions
- Component showcase and design system documentation
- Toast notifications and modal systems
- TypeScript types and interfaces

## 📋 TODO - Complete Backend Integration Checklist

### Account Settings Backend Implementation

The UI is complete and instrumented with inline TODO (BACKEND) markers:

**AccountSettingsPage.tsx:**

- Replace local state with data fetched from Supabase (profile, preferences)
- Fetch profile and preferences on mount and hydrate state
- Persist profile changes from PersonalInfoForm on save
- Persist notification preference toggles
- Changed the country field from region instead

**PersonalInfoForm.tsx:**

- Wire onSave to profile update service (optimistic UI + toast)
- Optionally refetch latest profile before editing

**SecuritySettings.tsx:**

- Call password change API and handle errors; fire success toast
- Trigger onPasswordUpdated after successful API
- Implement 2FA setup flow

### Admin Auth & Access Control (start here)

- Wire Supabase Auth for admin sign-in; remove prototype quick-access
- Persist session; implement refresh-token handling; remember-me support
- Fetch user profile/role on sign-in; cache minimal user profile in app state
- Role-based routing/guards: restrict `/admin/**` to `admin|super_admin`
- Route protection for customer-only routes; redirect unauthenticated users
- Centralize error handling and toast messages for auth flows
- Secure logout; clear session and cached profile

### Admin Settings Backend Implementation

- Replace local state with Supabase-backed tables for:
  - admin profile (displayName, department, avatarUrl, lastLogin)
  - system preferences (autoBackup, maintenanceMode, etc.)
  - user management policies (maxLoginAttempts, sessionTimeout, etc.)
  - admin notifications preferences
- Create RPCs or row-level policies as needed
- Hydrate on mount; optimistic UI updates with rollback on error
- Add audit trail for settings changes (optional)

### Orders Module (Admin)

- Replace `mockOrders` with Supabase `orders` table
- Implement data provider/context backed by Supabase queries
- Realtime subscriptions for status and total changes
- Chat flows: remove mock fallbacks; operate purely on context/DB
- Bulk updates: atomic updates with server-side validation
- Quote creation: store quote amount and transition status to Pending
- Indexes/policies: RLS by tenant/user; add status/date indexes

### Tickets Module (Admin)

- Replace `mockTickets` with Supabase `tickets` table
- Ticket replies: insert to `ticket_messages` and update `lastMessage`
- Status transitions with audit history
- Realtime subscriptions for new tickets/replies
- Chat flows: remove mock fallbacks; operate on context/DB

### Portfolio/Services Module (Admin)

- Replace `mockServices` with Supabase `services` table
- Category listing via SQL view or computed query
- Add service creation flow: validate unique `code`, insert service
- Status/name/category edits: persist; optimistic UI
- Realtime subscriptions for service updates
- Remove mock helpers `getPortfolioServices` once live

### Admin Chat Orchestrator

- Ensure flows receive live context from pages/hooks
- Remove all "Update mock data" blocks in flows
- Centralize price parsing/validation; server-side guardrails

### Storage & Avatars

- Supabase Storage bucket for admin avatars; signed URL handling
- Update Admin Settings profile avatar upload; persist URL

### Telemetry & Auditing

- Log admin actions (status changes, quotes, settings edits)
- Error logging to Supabase `logs` table or external service

### Security & Policies

- RLS for all tables; service-role and anon-read as appropriate
- Row ownership by organization/account when multi-tenant
- Least-privilege keys in frontend; server functions for privileged ops

### Cleanup Checklist (when backend live)

- Delete `src/data/orders.ts`, `src/data/tickets.ts`, `src/data/services.ts`
- Remove mock imports from chat flows and hooks
- Remove prototype quick-access in SignIn and any demo-only UI

## 📦 Installation

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd printy
   npm install
   ```

2. **Environment setup (check what Liam sent)**

   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Development**

   ```bash
   npm run dev          # Start development server
   npm run build        # Build for production
   npm run format       # Format code with Prettier
   npm run format:check # Check code formatting
   ```

4. **Dependency management**
   ```bash
   npx npm-check-updates                    # Check for updates
   npx npm-check-updates -u -x tailwindcss  # Update all except Tailwind
   npm install                              # Install updates
   ```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from project settings
3. Update your `.env` file with actual values
4. Set up database schema using SQL migration guide below

## 🧰 Supabase SQL Migration Guide

Run these SQL scripts in order against your Supabase project's Postgres database:

### Migration Files (run in order)

1. `supabase/sql/001_address_schema.sql`
2. `supabase/sql/002_address_policies.sql`
3. `supabase/sql/003_upsert_full_address.sql`
4. `supabase/sql/004_upsert_location_from_meta.sql`

### Option A: Supabase SQL Editor (web)

- Open project in Supabase dashboard → SQL Editor
- Paste contents of each file above, in order, and run

### Option B: psql (PowerShell)

```powershell
# Set database URL (replace placeholders)
$env:DB_URL = "postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres"

# Execute scripts in order from project root
psql $env:DB_URL -f supabase/sql/001_address_schema.sql
psql $env:DB_URL -f supabase/sql/002_address_policies.sql
psql $env:DB_URL -f supabase/sql/003_upsert_full_address.sql
psql $env:DB_URL -f supabase/sql/004_upsert_location_from_meta.sql
```

### Verify Setup

Tables, policies, and functions should be present as defined in scripts. If errors occur due to existing objects, apply only missing changes.

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Development**: ESLint + Prettier

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── chat/           # Chat interface components
│   ├── customer/       # Customer-specific components
│   └── shared/         # Shared UI components
├── chatLogic/          # Chat flow definitions
│   ├── customer/       # Customer chat flows
│   └── guest/          # Guest chat flows
├── lib/                # Utility functions and helpers
│   ├── supabase.ts     # Supabase client configuration
│   └── utils.ts        # Common utility functions
├── types/              # TypeScript type definitions
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── customer/       # Customer dashboard
│   └── admin/          # Admin interfaces
└── main.tsx            # Application entry point
```

## 🎨 Design System

### Color Palette

- **Brand Primary**: `#4056A1` - Trust, reliability, primary actions
- **Brand Accent**: `#D79922` - Energy, calls-to-action, highlights
- **Neutral Foundation**: 11 shades from pure white to maximum contrast
- **Semantic Colors**: Error, success, warning, and info variants

### Typography

- **Headings**: Fraunces (serif) - for titles and display text
- **Body**: Space Grotesk (sans-serif) - for UI and content
- **Monospace**: JetBrains Mono - for code and technical content

### Spacing & Animation

- **Base Unit**: 8px grid system with semantic spacing variables
- **Duration Scale**: From instant (0ms) to slower (750ms)
- **Easing Functions**: Natural motion curves
- **Performance**: Respects `prefers-reduced-motion`

## 📱 Responsive Design

### Breakpoints

- **xs**: 475px - Large phones
- **sm**: 640px - Tablets portrait
- **md**: 768px - Tablets landscape
- **lg**: 1024px - Laptops
- **xl**: 1280px - Desktops
- **2xl**: 1536px - Large monitors
- **3xl**: 1920px - Ultra-wide

### Container Constraints

- **Optimal Reading**: 1400px maximum width
- **Mobile First**: Start with mobile, enhance for larger screens
- **Container Queries**: Component-based responsive design

## 🎯 Development Standards

### Code Quality

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Pre-commit**: Automated quality checks

### Component Architecture

- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Compound Components**: Flexible, composable component patterns
- **Render Props**: Dynamic content rendering
- **Polymorphic Components**: Flexible HTML element rendering

### Performance & Accessibility

- **Performance**: Code splitting, memoization, image optimization
- **Accessibility**: WCAG 2.1 AA compliance, full keyboard support
- **Mobile**: Touch targets 44px+, PWA ready, optimized for mobile networks

## 🚀 Scripts

```json
{
  "dev": "vite", // Start development server
  "build": "tsc -b && vite build", // Type check and build
  "preview": "vite preview", // Preview production build
  "lint": "eslint .", // Run ESLint
  "type-check": "tsc --noEmit", // TypeScript type checking
  "format": "prettier --write .", // Format code with Prettier
  "format:check": "prettier --check ." // Check code formatting
}
```

## 📊 Browser Support & Performance

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Lighthouse Score**: 95+ across all categories
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

## 📝 Contributing

1. Follow established design system and component architecture
2. Ensure all components are accessible and performant
3. Write comprehensive tests for new features
4. Follow TypeScript best practices
5. Maintain mobile-first responsive design

## 📄 License

This project is proprietary software owned by B.J. Santiago INC.

---

**Built with ❤️ by B.J. Santiago INC.**
