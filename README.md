## 🚀 Current Status

**✅ COMPLETED:**

- Modern Design System with comprehensive component library
- Mobile-first responsive design
- Authentication UI (Sign In, Sign Up, Reset Password)
- Customer Dashboard with chat interface
- Chat flow system for About Us, FAQs, and basic interactions
- Component showcase and design system documentation
- Toast notifications and modal systems
- TypeScript types and interfaces

**🔗 Quick Links**

- [Account Settings Backend TODOs](#account-settings-backend-todos-summary)
- [Backend Integration Guide](./BACKEND_INTEGRATION.md#account-settings-integration-plan)
- [Backend TODO Summary (from codebase)](./BACKEND_INTEGRATION.md#todobackend-summary-from-codebase)
- [Supabase SQL Migration Guide](#supabase-sql-migration-guide)
- [Changelog](#changelog)

**🔄 IN PROGRESS:**

- Backend integration and API implementation
- Real authentication system
- Database schema and data persistence

**📋 TODO - Backend Integration Checklist:**

### Phase 1: Authentication & User Management

- [ ] Replace hardcoded credentials with real Supabase auth
- [ ] Implement proper JWT token management
- [ ] Add user session persistence
- [ ] Create user profile management
- [ ] Add role-based access control (customer, valued, admin, superadmin)

### Phase 2: Database & Data Models

- [ ] Set up Supabase database schema
- [ ] Create tables: users, profiles, orders, tickets, conversations
- [ ] Implement real-time subscriptions for chat
- [ ] Add data validation and sanitization

### Phase 3: Chat System Enhancement

- [ ] Implement real conversation persistence
- [ ] Add file upload capabilities
- [ ] Create support ticket system
- [ ] Add order tracking integration
- [ ] Implement real-time chat updates

### Phase 4: Order Management

- [ ] Create order creation flow
- [ ] Implement payment processing
- [ ] Add order status tracking
- [ ] Create invoice generation

### Phase 5: Admin & Superadmin Features

- [ ] Admin dashboard for order management
- [ ] User management interface
- [ ] Analytics and reporting
- [ ] System configuration

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Development**: ESLint + Prettier

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd printy
   ```

2. **Install dependencies**

   ```bash
   npm install
   npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
   ```

3. **Set up environment variables**

   ```bash
   # Copy the example environment file
   cp env.example .env

   # Edit .env with your Supabase credentials
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

6. **Prettier check for code format (optional)**

   ```bash
   npm run format:check
   ```

7. **Prettier actual code format (optional)**

   ```bash
   npm run format
   ```

8. **Check for dependency updates**

   ```bash
   npx npm-check-updates
   ```

9. **Update dependencies (except Tailwind)**

   ```bash
   npx npm-check-updates -u -x tailwindcss
   ```

10. **Install new dependency updates**

```bash
npm install
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
VITE_APP_NAME=Printy
VITE_APP_VERSION=0.0.0
VITE_APP_ENV=development

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project URL and anon key** from the project settings
3. **Update your `.env` file** with the actual values
4. **Set up your database schema** (see Database Schema section below)

## 🧰 Supabase SQL Migration Guide

The `supabase/sql` directory contains SQL scripts you can run against your Supabase project's Postgres database. Run them in order.

### Files and order

1. `supabase/sql/001_address_schema.sql`
2. `supabase/sql/002_address_policies.sql`
3. `supabase/sql/003_upsert_full_address.sql`
4. `supabase/sql/004_upsert_location_from_meta.sql`

### Option A: Run in Supabase SQL Editor (web)

- Open your project in the Supabase dashboard → SQL Editor
- Paste the contents of each file above, in order, and run

### Option B: Run via psql (PowerShell)

1. Set your database URL (replace placeholders):

```powershell
$env:DB_URL = "postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres"
```

2. Execute scripts in order from the project root:

```powershell
psql $env:DB_URL -f supabase/sql/001_address_schema.sql
psql $env:DB_URL -f supabase/sql/002_address_policies.sql
psql $env:DB_URL -f supabase/sql/003_upsert_full_address.sql
psql $env:DB_URL -f supabase/sql/004_upsert_location_from_meta.sql
```

### Verify

- Tables, policies, and functions should be present as defined in the scripts
- If a script errors due to existing objects, apply only the missing changes

## 🗄️ Database Schema (TODO)

### Core Tables

```sql
-- Users table (handled by Supabase Auth)
-- profiles table for extended user information
-- orders table for customer orders
-- tickets table for support tickets
-- conversations table for chat history
-- messages table for individual chat messages
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

### Spacing System

- **Base Unit**: 8px grid system
- **Semantic Spacing**: Context-based spacing variables
- **Responsive**: Mobile-first breakpoints

### Animation

- **Duration Scale**: From instant (0ms) to slower (750ms)
- **Easing Functions**: Natural motion curves
- **Performance**: Respects `prefers-reduced-motion`

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

## 🎯 Development Guidelines

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

### Performance

- **Code Splitting**: Route and component-based splitting
- **Memoization**: React.memo, useMemo, useCallback
- **Image Optimization**: WebP support, lazy loading
- **Bundle Analysis**: Regular bundle size monitoring

### Accessibility

- **ARIA Patterns**: Proper semantic HTML and ARIA attributes
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Optimized for assistive technologies
- **Focus Management**: Proper focus trapping and management

### Mobile Optimization

- **Touch Targets**: Minimum 44px for touch interactions
- **Safe Areas**: Support for notched devices
- **Performance**: Optimized for mobile networks
- **PWA Ready**: Progressive Web App capabilities

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

## 🔧 Configuration Files

### Tailwind CSS (`tailwind.config.ts`)

- Custom color palette and design tokens
- Typography scale and font families
- Spacing system and responsive breakpoints
- Animation keyframes and transitions
- Custom utilities and components

### PostCSS (`postcss.config.js`)

- Tailwind CSS processing
- Autoprefixer for cross-browser compatibility

### Prettier (`.prettierrc`)

- Consistent code formatting
- 80 character line width
- Single quotes and semicolons

### ESLint (`eslint.config.js`)

- TypeScript and React rules
- Accessibility guidelines
- Performance best practices

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

## 📊 Performance Targets

- **Lighthouse Score**: 95+ across all categories
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: Optimized for fast loading
- **Image Optimization**: WebP format with fallbacks

## ♿ Accessibility Standards

- **WCAG 2.1 AA**: Full compliance
- **Screen Reader**: Optimized for NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Complete keyboard accessibility
- **Color Contrast**: Meets AA standards for all text

## 🌐 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Progressive Enhancement**: Basic functionality works everywhere

## 📝 Contributing

1. Follow the established design system and component architecture
2. Ensure all components are accessible and performant
3. Write comprehensive tests for new features
4. Follow TypeScript best practices
5. Maintain mobile-first responsive design

## 📄 License

This project is proprietary software owned by B.J. Santiago INC.

## 🤝 Support

For technical support or questions about the project architecture, please refer to the development team or project documentation.

## Changelog

### 2025-08-29

- Added Supabase SQL Migration Guide with PowerShell/psql steps
- Added quick links to Migration Guide and Changelog
- Kept existing setup and status sections unchanged; no breaking changes

---

**Built with ❤️ by B.J. Santiago INC.**

## 🧩 Account Settings Backend TODOs (Summary)

The UI is complete and instrumented with inline TODO(BACKEND) markers. Implement these to wire Supabase while preserving current UX.

### AccountSettingsPage.tsx

- TODO(BACKEND): Replace local state with data fetched from Supabase (profile, preferences)
- TODO(BACKEND): Fetch profile and preferences on mount and hydrate state
- TODO(BACKEND): Persist profile changes from PersonalInfoForm on save
- TODO(BACKEND): Persist notification preference toggles
- TODO(BACKEND): Changed the country field from region instead

### PersonalInfoForm.tsx

- TODO(BACKEND): Wire onSave to profile update service (optimistic UI + toast)
- TODO(BACKEND): Optionally refetch latest profile before editing

### SecuritySettings.tsx

- TODO(BACKEND): Call password change API and handle errors; fire success toast
- TODO(BACKEND): Trigger onPasswordUpdated after successful API
- TODO(BACKEND): Implement 2FA setup flow

See `BACKEND_INTEGRATION.md` for the service layer outline and recommended endpoints.
