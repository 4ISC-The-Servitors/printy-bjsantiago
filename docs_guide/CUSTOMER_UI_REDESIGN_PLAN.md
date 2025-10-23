# Customer Pages UI Redesign Plan

## Document Overview

This document outlines a comprehensive phased approach to redesigning the customer-facing pages with responsive design principles. The redesign will enhance visual hierarchy, improve mobile/tablet experience with collapsible sidebars, and create consistent patterns across all history pages.

**Last Updated:** 2025-10-23
**Status:** Planning Phase
**Target Completion:** TBD

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Design Goals & Principles](#design-goals--principles)
3. [Responsive Breakpoints & Behavior](#responsive-breakpoints--behavior)
4. [Component Architecture](#component-architecture)
5. [Implementation Phases](#implementation-phases)
6. [Page-Specific Designs](#page-specific-designs)
7. [Testing & Validation](#testing--validation)
8. [Migration Strategy](#migration-strategy)

---

## Current State Analysis

### Existing Pages Structure

**Customer Dashboard (`CustomerDashboard.tsx`)**

- Layout: Two-column grid with recent cards (orders, tickets, quotes) on left, chat cards on right
- Current grid: `lg:grid-cols-[720px_1fr] xl:grid-cols-[820px_1fr]`
- Mobile: Full-width stack with mobile menu overlay
- Sidebar: Desktop-only fixed sidebar (256px width)
- Recent cards: Stacked vertically in left column
- Chat cards: Grid layout in right column

**Chat History (`CustomerChatHistory.tsx`)**

- Layout: Full-width page with search/filter at top
- Uses pagination for conversation list
- Mobile: Burger menu with overlay sidebar
- Desktop: No sidebar shown (full content width)

**History Pages (Orders, Tickets, Quotes)**

- Current implementation: `OrderHistory.tsx`, `TicketHistory.tsx`, `QuoteHistory.tsx`
- Use shared `DesktopLayout` and `MobileLayout` components
- Desktop: Sidebar with recent chats (256px) + main content
- Mobile: Header with burger menu, overlay sidebar
- Each page has search/filter functionality
- Item cards with status badges, dates, and action buttons

**Account Settings (`CustomerAccountSettings.tsx`)**

- Layout: Single column with profile overview, personal info, security, notifications
- Mobile: Burger menu header
- Desktop: Full-width centered content (no sidebar)
- Uses Container with max-width

### Current Component Structure

```
src/customer/
├── pages/
│   ├── CustomerDashboard.tsx (main landing)
│   ├── CustomerChatHistory.tsx (all chats)
│   ├── CustomerOrderHistory.tsx (wrapper)
│   ├── CustomerTicketHistory.tsx (wrapper)
│   ├── CustomerQuoteHistory.tsx (wrapper)
│   └── CustomerAccountSettings.tsx (profile/settings)
├── components/
│   ├── shared/
│   │   ├── layouts/
│   │   │   ├── DesktopLayout.tsx
│   │   │   ├── MobileLayout.tsx
│   │   │   └── CustomerLayout.tsx
│   │   └── sidebar/
│   │       ├── SidebarPanel.tsx (desktop sidebar)
│   │       ├── MobileSidebarMenu.tsx (mobile overlay)
│   │       └── MobileSidebarTrigger.tsx (burger button)
│   ├── dashboard/
│   │   ├── chatCards/ (7 chat entry cards)
│   │   ├── recentOrders/ (RecentOrder.tsx)
│   │   ├── recentTickets/ (RecentTickets.tsx)
│   │   ├── recentQuotes/ (RecentQuotes.tsx)
│   │   ├── orderHistory/ (OrderHistory.tsx)
│   │   ├── ticketHistory/ (TicketHistory.tsx)
│   │   └── quoteHistory/ (QuoteHistory.tsx)
│   └── accountSettings/
│       ├── ProfileOverviewCard.tsx
│       ├── PersonalInfoForm.tsx
│       ├── SecuritySettings.tsx
│       └── NotificationPreferences.tsx
```

### Key Observations

1. **Inconsistent Sidebar Behavior:**
   - Dashboard: Desktop only, 256px fixed width
   - Chat History: No sidebar on desktop
   - History Pages: Desktop sidebar present
   - Account Settings: No sidebar

2. **Recent Cards Layout:**
   - Dashboard uses fixed-width grid columns
   - Cards are equal-sized, no visual hierarchy for importance

3. **Mobile Experience:**
   - Consistent burger menu across all pages
   - Overlay sidebar pattern established
   - Good mobile navigation

4. **Responsive Design:**
   - Uses custom responsive hooks (`useResponsiveClasses`, `useResponsiveLayout`)
   - Implements `device-*` CSS classes from RESPONSIVE_DESIGN_SYSTEM.md
   - Breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px), 3xl(1920px)

---

## Design Goals & Principles

### Primary Goals

1. **Visual Hierarchy on Dashboard**
   - Emphasize the 3 recent cards (orders, tickets, quotes) as primary focal points
   - Make chat cards easily accessible but secondary in hierarchy
   - Use grid layout with size variations to create hierarchy

2. **Consistent History Page Patterns**
   - All history pages (chat, order, ticket, quote) follow identical design patterns
   - Unified card layouts, search/filter UI, and pagination
   - Consistent spacing, typography, and color usage

3. **Responsive Sidebar Behavior**
   - Mobile/Tablet (< 1024px): Collapsible sidebar overlay
   - Laptop/Desktop (>= 1024px): Persistent sidebar with recent chats
   - Smooth transitions between states

4. **Accessibility & Usability**
   - WCAG 2.1 AA compliance minimum
   - Touch-friendly targets (44x44px minimum)
   - Keyboard navigation support
   - Screen reader compatibility

5. **Performance Optimization**
   - Minimize layout shifts
   - Lazy load images and heavy components
   - Optimize bundle size with code splitting

### Design Principles

**Mobile-First:**

- Design for smallest screens first, progressively enhance
- Use Tailwind's responsive modifiers (sm:, md:, lg:, xl:, 2xl:)
- Follow RESPONSIVE_DESIGN_SYSTEM.md guidelines

**Component Reusability:**

- Extract common patterns into shared components
- Use composition over duplication
- Maintain single source of truth for layouts

**Semantic HTML:**

- Use appropriate HTML5 elements (header, nav, main, section, article, footer)
- Proper heading hierarchy (h1 > h2 > h3)
- Meaningful aria labels

**Design Token Consistency:**

- Follow existing `device-*` classes for text, buttons, spacing
- Use brand color palette consistently
- Maintain spacing scale from Tailwind

---

## Responsive Breakpoints & Behavior

### Breakpoint Strategy

Following the project's established breakpoints:

| Breakpoint | Width  | Device Type  | Sidebar Behavior | Grid Layout |
| ---------- | ------ | ------------ | ---------------- | ----------- |
| xs         | 475px  | Small Mobile | Hidden (overlay) | 1 column    |
| sm         | 640px  | Mobile       | Hidden (overlay) | 1 column    |
| md         | 768px  | Tablet       | Hidden (overlay) | 2 columns   |
| lg         | 1024px | Laptop       | Visible (256px)  | 3 columns   |
| xl         | 1280px | Desktop      | Visible (256px)  | 4 columns   |
| 2xl        | 1536px | Wide Desktop | Visible (280px)  | 4 columns   |
| 3xl        | 1920px | Ultra-wide   | Visible (320px)  | 4 columns   |

### Sidebar Specifications

**Mobile/Tablet (< lg):**

- Trigger: Burger menu icon in fixed header
- Presentation: Full-height overlay from left
- Width: 320px (max 85% viewport width)
- Backdrop: Semi-transparent black (bg-black/20)
- Animation: Slide-in from left with fade-in backdrop
- Close: Click outside, X button, or navigation action

**Laptop/Desktop (>= lg):**

- Position: Fixed left sidebar
- Width: 256px (lg), 256px (xl), 280px (2xl), 320px (3xl)
- Background: White with subtle border
- Content: Recent chats list, account button, logout button
- Scroll: Independent scroll for chat list

### Layout Containers

**Dashboard Main Content:**

```
Mobile (< sm): Full width, p-4
Tablet (sm-md): Full width, p-6
Laptop (lg-xl): calc(100vw - 256px - sidebar), p-8
Desktop (2xl+): calc(100vw - 280px - sidebar), p-10
```

**History Pages Main Content:**

```
Mobile (< sm): Full width, p-4
Tablet (sm-md): Full width, p-6
Laptop (lg+): calc(100vw - 256px - sidebar), p-8
Max-width: 1400px (centered)
```

---

## Component Architecture

### Layout Component Hierarchy

```
CustomerApp
├── ResponsiveSidebar
│   ├── MobileSidebarTrigger (< lg)
│   ├── MobileSidebarOverlay (< lg)
│   └── DesktopSidebar (>= lg)
│       ├── RecentChatsList
│       ├── AccountButton
│       └── LogoutButton
├── MainContent
│   └── PageContent (Dashboard, History, Settings)
└── GlobalModals
    ├── LogoutModal
    └── ChatOverlay (mobile)
```

### New Shared Components

**1. ResponsivePageLayout Component**

```tsx
interface ResponsivePageLayoutProps {
  showSidebar?: boolean; // Default: true
  sidebarContent?: React.ReactNode;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  maxWidth?: 'full' | 'xl' | '2xl' | '6xl'; // Default: '6xl'
}
```

Purpose: Unified layout wrapper for all customer pages with consistent sidebar behavior.

**2. HistoryPageTemplate Component**

```tsx
interface HistoryPageTemplateProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  filterConfig: FilterConfig;
  items: Array<any>;
  renderItem: (item: any) => React.ReactNode;
  onItemClick?: (item: any) => void;
  emptyMessage?: string;
}
```

Purpose: Standardized template for all history pages (chat, order, ticket, quote).

**3. DashboardGrid Component**

```tsx
interface DashboardGridProps {
  recentCards: {
    order: React.ReactNode;
    ticket: React.ReactNode;
    quote: React.ReactNode;
  };
  chatCards: React.ReactNode;
}
```

Purpose: Responsive grid layout for dashboard with visual hierarchy.

**4. HistoryItemCard Component**

```tsx
interface HistoryItemCardProps {
  type: 'order' | 'ticket' | 'quote' | 'chat';
  displayId: string;
  title: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
  actions?: React.ReactNode;
  onClick?: () => void;
}
```

Purpose: Consistent card component for all history items.

### Component Responsibilities

**ResponsiveSidebar:**

- Manage sidebar visibility state
- Handle mobile overlay transitions
- Render recent chats list
- Provide navigation actions

**HistoryPageTemplate:**

- Render page header with back button
- Implement search/filter UI
- Handle pagination logic
- Display empty states
- Render item list with consistent spacing

**DashboardGrid:**

- Implement responsive grid layout
- Manage card sizing for visual hierarchy
- Handle mobile stacking order
- Ensure touch-friendly spacing

**HistoryItemCard:**

- Display item metadata consistently
- Show status badges with proper colors
- Render action buttons (pay, track, view)
- Handle click interactions

---

## Implementation Phases

### Phase 1: Foundation & Shared Components (Week 1)

**Goal:** Create reusable layout and component infrastructure.

**Tasks:**

1. Create `ResponsivePageLayout` component
   - Implement sidebar visibility logic
   - Add mobile overlay with animations
   - Desktop sidebar with fixed positioning
   - Test across all breakpoints

2. Create `HistoryItemCard` component
   - Design unified card structure
   - Implement status badge system
   - Add action button slots
   - Create hover/focus states

3. Create `HistoryPageTemplate` component
   - Build page header with back button
   - Implement search/filter UI
   - Add pagination controls
   - Handle loading and empty states

4. Update `device-*` CSS classes
   - Add any missing responsive utilities
   - Create grid layout classes
   - Define card size variants

**Deliverables:**

- `src/customer/components/shared/layouts/ResponsivePageLayout.tsx`
- `src/customer/components/shared/cards/HistoryItemCard.tsx`
- `src/customer/components/shared/templates/HistoryPageTemplate.tsx`
- Updated `src/index.css` with new utilities
- Unit tests for new components

**Success Criteria:**

- Components render correctly at all breakpoints
- Sidebar transitions smoothly on mobile
- Keyboard navigation works
- Passes accessibility audit

---

### Phase 2: Dashboard Redesign (Week 2)

**Goal:** Redesign dashboard with improved visual hierarchy and responsive grid.

**Tasks:**

1. Design new dashboard grid layout
   - Recent cards: Larger, prominent cards with enhanced styling
   - Chat cards: Secondary grid, easily accessible
   - Responsive breakpoint adjustments

2. Create `DashboardGrid` component
   - Implement CSS Grid with areas
   - Add mobile stacking order
   - Handle empty states

3. Update recent card components
   - Enhance `RecentOrder.tsx` with new styling
   - Enhance `RecentTickets.tsx` with new styling
   - Enhance `RecentQuotes.tsx` with new styling
   - Add loading skeletons

4. Refactor `CustomerDashboard.tsx`
   - Integrate `ResponsivePageLayout`
   - Use `DashboardGrid` component
   - Update mobile/desktop logic
   - Test chat overlay behavior

**Dashboard Grid Layout:**

**Desktop (lg+):**

```
┌─────────────┬───────────┐
│   Recent    │   Chat    │
│   Order     │   Cards   │
│  (large)    │  (grid)   │
├─────────────┤           │
│   Recent    │           │
│   Ticket    │           │
│  (large)    │           │
├─────────────┤           │
│   Recent    │           │
│   Quote     │           │
│  (large)    │           │
└─────────────┴───────────┘
```

**Tablet (md):**

```
┌─────────────┐
│   Recent    │
│   Order     │
│  (large)    │
├─────────────┤
│   Recent    │
│   Ticket    │
│  (large)    │
├─────────────┤
│   Recent    │
│   Quote     │
│  (large)    │
├─────────────┤
│   Chat      │
│   Cards     │
│  (2-col)    │
└─────────────┘
```

**Mobile (sm):**

```
┌─────────────┐
│   Recent    │
│   Order     │
├─────────────┤
│   Recent    │
│   Ticket    │
├─────────────┤
│   Recent    │
│   Quote     │
├─────────────┤
│   Chat      │
│   Cards     │
│  (1-col)    │
└─────────────┘
```

**Deliverables:**

- `src/customer/components/dashboard/DashboardGrid.tsx`
- Updated `src/customer/pages/CustomerDashboard.tsx`
- Enhanced recent card components
- Dashboard-specific styles
- Visual design mockups/screenshots

**Success Criteria:**

- Visual hierarchy is clear (recent cards prominent)
- Chat cards remain easily accessible
- Grid adapts smoothly across breakpoints
- Loading states work correctly
- No layout shifts during data load

---

### Phase 3: Chat History Page (Week 3)

**Goal:** Standardize chat history page with new layout and patterns.

**Tasks:**

1. Refactor `CustomerChatHistory.tsx`
   - Use `ResponsivePageLayout` with sidebar
   - Implement `HistoryPageTemplate`
   - Use `HistoryItemCard` for conversations

2. Update `ConversationItem.tsx` component
   - Align with `HistoryItemCard` design
   - Add consistent metadata display
   - Implement status indicators

3. Add desktop sidebar to chat history
   - Show recent chats in sidebar
   - Add quick navigation
   - Implement chat switching

4. Enhance search/filter functionality
   - Use shared `Filter` component
   - Add status filter (active/ended)
   - Date range filtering

**Deliverables:**

- Updated `src/customer/pages/CustomerChatHistory.tsx`
- Updated `src/customer/components/chatHistory/ConversationItem.tsx`
- Consistent with new design patterns
- Enhanced filtering capabilities

**Success Criteria:**

- Chat history matches design system
- Sidebar appears on desktop
- Search/filter work correctly
- Pagination adapts to screen size
- Conversation cards are touch-friendly

---

### Phase 4: Order History Page (Week 3)

**Goal:** Redesign order history with consistent patterns.

**Tasks:**

1. Refactor `OrderHistory.tsx`
   - Use `HistoryPageTemplate`
   - Implement `HistoryItemCard` for orders
   - Align with chat history design

2. Update order item card design
   - Display order metadata consistently
   - Show payment status prominently
   - Action buttons (Pay Now, Reupload)

3. Enhance order status filtering
   - All status options available
   - Visual status indicators
   - Clear badge colors

4. Add order details modal (optional)
   - View full order specs
   - Payment history
   - Timeline view

**Deliverables:**

- Updated `src/customer/components/dashboard/orderHistory/OrderHistory.tsx`
- New order card component
- Enhanced filtering
- Optional: Order details modal

**Success Criteria:**

- Order history matches chat history design
- Payment actions are clear
- Status badges use correct colors
- Filtering works smoothly
- Mobile experience is optimized

---

### Phase 5: Ticket History Page (Week 4)

**Goal:** Standardize ticket history page.

**Tasks:**

1. Refactor `TicketHistory.tsx`
   - Use `HistoryPageTemplate`
   - Implement `HistoryItemCard` for tickets
   - Consistent with other history pages

2. Update ticket item card design
   - Display ticket subject/type
   - Show resolution status
   - Action buttons (Track Ticket)

3. Enhance ticket status system
   - Clear status progression
   - Visual indicators for urgency
   - Badge color consistency

4. Add ticket details view (optional)
   - Timeline of ticket updates
   - Conversation thread
   - Resolution details

**Deliverables:**

- Updated `src/customer/components/dashboard/ticketHistory/TicketHistory.tsx`
- New ticket card component
- Enhanced status display
- Optional: Ticket details view

**Success Criteria:**

- Ticket history matches design system
- Status progression is clear
- Action buttons work correctly
- Responsive behavior is consistent
- Empty states are helpful

---

### Phase 6: Quote History Page (Week 4)

**Goal:** Standardize quote history page.

**Tasks:**

1. Refactor `QuoteHistory.tsx`
   - Use `HistoryPageTemplate`
   - Implement `HistoryItemCard` for quotes
   - Consistent with other history pages

2. Update quote item card design
   - Display quote details
   - Show quoted price prominently
   - Status badges (active, accepted, rejected)

3. Enhance quote filtering
   - Status-based filtering
   - Price range filtering (optional)
   - Date range filtering

4. Add quote details modal (optional)
   - Full spec details
   - Price breakdown
   - Timeline/history

**Deliverables:**

- Updated `src/customer/components/dashboard/quoteHistory/QuoteHistory.tsx`
- New quote card component
- Enhanced filtering
- Optional: Quote details modal

**Success Criteria:**

- Quote history matches design system
- Quoted prices are clear
- Status system is consistent
- Filtering works properly
- Mobile layout is optimized

---

### Phase 7: Account Settings Page (Week 5)

**Goal:** Enhance account settings with consistent layout.

**Tasks:**

1. Refactor `CustomerAccountSettings.tsx`
   - Use `ResponsivePageLayout` (optional sidebar)
   - Improve mobile layout
   - Add responsive form controls

2. Enhance form components
   - Use `device-input` classes
   - Add validation feedback
   - Improve button sizing

3. Update profile cards
   - Enhance `ProfileOverviewCard.tsx`
   - Improve `PersonalInfoForm.tsx`
   - Update `SecuritySettings.tsx`
   - Refine `NotificationPreferences.tsx`

4. Add responsive adjustments
   - Single-column on mobile
   - Two-column on tablet (optional)
   - Centered layout on desktop

**Deliverables:**

- Updated `src/customer/pages/CustomerAccountSettings.tsx`
- Enhanced form components
- Improved profile cards
- Responsive form layouts

**Success Criteria:**

- Forms work on all devices
- Input sizes are appropriate
- Validation feedback is clear
- Settings save successfully
- Layout is clean and organized

---

### Phase 8: Testing & Polish (Week 6)

**Goal:** Comprehensive testing, accessibility audit, and final polish.

**Tasks:**

1. Cross-browser testing
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (Safari iOS, Chrome Android)
   - Ensure consistent behavior

2. Responsive testing
   - Test all breakpoints (xs to 3xl)
   - Verify sidebar behavior
   - Check grid layouts
   - Test touch interactions

3. Accessibility audit
   - Run axe DevTools
   - Test keyboard navigation
   - Screen reader testing (NVDA, JAWS, VoiceOver)
   - Color contrast verification
   - Focus indicator visibility

4. Performance optimization
   - Code splitting for routes
   - Lazy load components
   - Optimize images
   - Reduce bundle size
   - Measure Core Web Vitals

5. Visual polish
   - Consistent spacing
   - Smooth animations
   - Loading states
   - Empty states
   - Error states

6. Documentation
   - Update component docs
   - Create usage examples
   - Document design patterns
   - Migration guide for future updates

**Deliverables:**

- Test reports (cross-browser, responsive, accessibility)
- Performance metrics (before/after)
- Updated documentation
- Bug fix list and resolutions
- Final design system documentation

**Success Criteria:**

- All pages work in supported browsers
- WCAG 2.1 AA compliance achieved
- No critical accessibility issues
- Performance metrics meet targets (LCP < 2.5s, CLS < 0.1)
- Code is well-documented

---

## Page-Specific Designs

### Dashboard Design Details

**Visual Hierarchy Strategy:**

1. **Hero Section:**
   - Page title: "How can I help you today?"
   - Subtitle: "Check recent activity or start a new chat"
   - Device classes: `device-text-hero` and `device-text-body`

2. **Recent Cards Section (Emphasized):**
   - Grid area: Larger allocation on desktop
   - Card styling: Enhanced shadows, borders, 3D effects
   - Card size:
     - Mobile: Full width
     - Tablet: Full width, larger padding
     - Desktop: 720px wide (lg), 820px wide (xl)
   - Visual treatment:
     - Subtle background gradient
     - Stronger border colors
     - Larger text sizes
     - More vertical spacing

3. **Chat Cards Section (Accessible, Secondary):**
   - Grid area: Right column on desktop
   - Card styling: Standard cards, clean design
   - Card size:
     - Mobile: Full width, stacked
     - Tablet: 2-column grid
     - Desktop: 2-column grid (lg), 3-column grid (xl)
   - Visual treatment:
     - Standard card styling
     - Consistent icons
     - Clear labels

**Dashboard Grid Implementation:**

```tsx
// Desktop (lg+)
<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[2.5fr_1fr] gap-6 lg:gap-8">
  {/* Recent Cards Column - Emphasized */}
  <div className="space-y-6">
    <RecentOrderCard />
    <RecentTicketCard />
    <RecentQuoteCard />
  </div>

  {/* Chat Cards Column - Accessible */}
  <div>
    <ChatCardsGrid />
  </div>
</div>

// Mobile/Tablet (< lg)
<div className="space-y-6">
  {/* Recent Cards First - Most Important */}
  <RecentOrderCard />
  <RecentTicketCard />
  <RecentQuoteCard />

  {/* Chat Cards Below - Still Accessible */}
  <ChatCardsGrid />
</div>
```

**Recent Card Enhancements:**

```tsx
// Enhanced card styling
<Card
  className="
  relative
  overflow-hidden
  border-2
  border-brand-primary-200
  bg-gradient-to-br from-white to-brand-primary-50
  shadow-lg
  hover:shadow-xl
  transition-all
  device-spacing-component
"
>
  {/* Accent bar on left */}
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary-500" />

  {/* Content with enhanced spacing */}
  <div className="ml-2">
    {/* Title with larger text */}
    <Text variant="h2" className="device-text-heading mb-4">
      Recent Order
    </Text>

    {/* Content... */}
  </div>
</Card>
```

---

### History Pages Design Details

**Common Layout Pattern:**

```
┌──────────────────────────────────────┐
│  Header                              │
│  ├─ Back Button                      │
│  ├─ Page Title                       │
│  └─ Subtitle                         │
├──────────────────────────────────────┤
│  Search & Filter Bar                 │
│  ├─ Search Input                     │
│  └─ Filter Dropdown                  │
├──────────────────────────────────────┤
│  Pagination Controls                 │
├──────────────────────────────────────┤
│  Item List                           │
│  ├─ Item Card 1                      │
│  ├─ Item Card 2                      │
│  ├─ Item Card 3                      │
│  └─ ...                              │
├──────────────────────────────────────┤
│  Pagination Controls                 │
└──────────────────────────────────────┘
```

**History Item Card Structure:**

```tsx
<div
  className="
  bg-white
  rounded-lg
  border border-neutral-200
  p-4 md:p-5 lg:p-6
  hover:border-brand-primary-300
  hover:shadow-md
  transition-all
  cursor-pointer
"
>
  {/* Header: ID + Status */}
  <div className="flex items-center justify-between mb-3">
    <Text variant="h3" className="device-text-heading font-mono">
      {displayId}
    </Text>
    <Badge variant={statusVariant} size="md">
      {status}
    </Badge>
  </div>

  {/* Title/Subject */}
  <Text variant="p" className="device-text-body mb-3">
    {title}
  </Text>

  {/* Metadata Grid */}
  <div className="grid grid-cols-2 gap-2 mb-3">
    <div>
      <Text variant="p" className="device-text-caption text-neutral-500">
        Created:
      </Text>
      <Text variant="p" className="device-text-caption">
        {formatDate(createdAt)}
      </Text>
    </div>
    <div>
      <Text variant="p" className="device-text-caption text-neutral-500">
        Updated:
      </Text>
      <Text variant="p" className="device-text-caption">
        {formatRelativeTime(updatedAt)}
      </Text>
    </div>
  </div>

  {/* Actions */}
  <div className="flex gap-2">{actions}</div>
</div>
```

**Filter Component Specifications:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-6">
  {/* Search Input */}
  <Input
    type="search"
    placeholder="Search..."
    value={search}
    onChange={setSearch}
    className="device-input"
  />

  {/* Filter Dropdown */}
  <Filter
    value={filter}
    onChange={setFilter}
    filterConfig={filterConfig}
    showResultCount
    resultCount={filteredItems.length}
  />
</div>
```

**Pagination Specifications:**

```tsx
<Pagination
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={setPage}
  variant="minimal" // For clean look
  position="center" // Center aligned
/>
```

---

### Account Settings Design Details

**Layout Strategy:**

```
┌──────────────────────────────────────┐
│  Header with Back Button             │
├──────────────────────────────────────┤
│  Profile Overview Card               │
│  ├─ Avatar                           │
│  ├─ Name                             │
│  ├─ Email                            │
│  └─ Membership Badge                 │
├──────────────────────────────────────┤
│  Personal Information Section        │
│  ├─ Form Fields                      │
│  └─ Save Button                      │
├──────────────────────────────────────┤
│  Security Settings Section           │
│  ├─ Change Password                  │
│  └─ Security Options                 │
├──────────────────────────────────────┤
│  Notification Preferences            │
│  ├─ Toggle Switches                  │
│  └─ Preference Options               │
└──────────────────────────────────────┘
```

**Form Spacing:**

```tsx
<div className="space-y-6 md:space-y-8">
  {/* Each section separated by responsive spacing */}
  <Section />
  <Section />
  <Section />
</div>
```

**Section Card Styling:**

```tsx
<Card className="device-spacing-component">
  <Text variant="h2" className="device-text-heading mb-4">
    Section Title
  </Text>

  {/* Section Content */}
  <div className="space-y-4">{/* Form fields or settings */}</div>

  {/* Action Buttons */}
  <div className="mt-6 flex gap-3">
    <Button size="md" threeD>
      Save Changes
    </Button>
    <Button size="md" variant="ghost">
      Cancel
    </Button>
  </div>
</Card>
```

---

## Testing & Validation

### Testing Checklist

**Responsive Behavior:**

- [ ] All pages render correctly at xs (475px)
- [ ] All pages render correctly at sm (640px)
- [ ] All pages render correctly at md (768px)
- [ ] All pages render correctly at lg (1024px)
- [ ] All pages render correctly at xl (1280px)
- [ ] All pages render correctly at 2xl (1536px)
- [ ] All pages render correctly at 3xl (1920px)
- [ ] Sidebar collapses to overlay on mobile/tablet
- [ ] Sidebar persists on desktop
- [ ] Grid layouts adapt appropriately
- [ ] Text scales according to device-\* classes
- [ ] Images/media are responsive

**Interaction Testing:**

- [ ] Sidebar toggle works on mobile
- [ ] Sidebar overlay closes on outside click
- [ ] Sidebar overlay closes on navigation
- [ ] Chat cards open chat correctly
- [ ] History item cards navigate/open details
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Pagination changes pages
- [ ] Form submissions work
- [ ] Buttons trigger expected actions

**Accessibility Testing:**

- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Headings follow proper hierarchy (h1 > h2 > h3)
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Interactive elements have accessible names
- [ ] ARIA labels are meaningful
- [ ] Error messages are announced

**Browser Testing:**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Safari iOS (mobile)
- [ ] Chrome Android (mobile)

**Performance Testing:**

- [ ] Initial page load < 3s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 5s
- [ ] Bundle size is optimized
- [ ] Images are optimized
- [ ] Code is split appropriately

**Visual Testing:**

- [ ] Layouts are consistent across pages
- [ ] Spacing is uniform
- [ ] Typography is consistent
- [ ] Colors match design system
- [ ] Animations are smooth
- [ ] Loading states are clear
- [ ] Empty states are helpful
- [ ] Error states are informative

---

## Migration Strategy

### Gradual Migration Approach

To minimize risk and ensure smooth deployment, we'll migrate pages gradually:

**Stage 1: Foundation (Week 1)**

- Deploy shared components
- No user-facing changes yet
- Internal testing only

**Stage 2: Dashboard (Week 2)**

- Deploy new dashboard design
- Monitor user feedback
- Quick iteration if needed

**Stage 3: History Pages (Weeks 3-4)**

- Deploy chat history first
- Deploy order history
- Deploy ticket history
- Deploy quote history
- Monitor each deployment

**Stage 4: Account Settings (Week 5)**

- Deploy account settings updates
- Monitor form submissions
- Ensure data integrity

**Stage 5: Final Polish (Week 6)**

- Deploy optimizations
- Deploy accessibility fixes
- Final testing and validation

### Rollback Plan

Each phase should have a rollback strategy:

1. **Feature Flags:**
   - Implement feature flags for new layouts
   - Allow easy toggle between old/new designs
   - Gradual rollout to percentage of users

2. **Git Branches:**
   - Keep each phase in separate branches
   - Easy revert if issues arise
   - Tag stable versions

3. **Monitoring:**
   - Track error rates
   - Monitor user engagement
   - Collect user feedback
   - Watch performance metrics

### Communication Plan

**Internal Team:**

- Weekly progress updates
- Demo sessions after each phase
- Code review checkpoints
- Design review meetings

**Stakeholders:**

- Phase completion reports
- User feedback summaries
- Performance improvement metrics
- Accessibility compliance reports

**Users:**

- No communication needed (transparent migration)
- Optional: "New look" badge or announcement for dashboard
- Help documentation updates

---

## Design Patterns & Best Practices

### Component Composition

**Good:**

```tsx
// Compose with shared components
<ResponsivePageLayout showSidebar>
  <HistoryPageTemplate
    title="Order History"
    items={orders}
    renderItem={order => <HistoryItemCard {...order} />}
  />
</ResponsivePageLayout>
```

**Avoid:**

```tsx
// Duplicating layout logic in each page
<div className="h-screen bg-gradient-to-br...">
  <aside className="w-64...">{/* Sidebar content duplicated */}</aside>
  <main>{/* Page content */}</main>
</div>
```

### Responsive Class Usage

**Good:**

```tsx
// Use device-* classes from design system
<Text className="device-text-heading">
  Page Title
</Text>

<Button className="device-btn-primary">
  Save Changes
</Button>
```

**Avoid:**

```tsx
// Manual responsive classes
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Page Title</h1>
```

### Grid Layout Patterns

**Good:**

```tsx
// Mobile-first responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {items.map(item => (
    <ItemCard key={item.id} {...item} />
  ))}
</div>
```

**Avoid:**

```tsx
// Fixed layout that doesn't adapt
<div className="flex flex-wrap">
  {items.map(item => (
    <div className="w-1/3">
      <ItemCard {...item} />
    </div>
  ))}
</div>
```

### State Management

**Good:**

```tsx
// Centralized state with hooks
const { search, setSearch, filteredItems } = useGenericSearchFilter({
  items,
  searchFields: ['title', 'displayId'],
  filterConfig,
});
```

**Avoid:**

```tsx
// Scattered state across multiple useState
const [search, setSearch] = useState('');
const [filter, setFilter] = useState({});
const [filteredItems, setFilteredItems] = useState([]);
// Manual filtering logic duplicated
```

---

## Appendix

### Useful Resources

**Design System:**

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [RESPONSIVE_DESIGN_SYSTEM.md](./RESPONSIVE_DESIGN_SYSTEM.md)
- [Tailwind Config](../tailwind.config.ts)

**Accessibility:**

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

**Performance:**

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://react.dev/learn/render-and-commit)

### Color Reference

**Status Colors:**

```tsx
// Orders
awaiting_payment: 'warning'(yellow);
reupload_payment: 'error'(red);
processing: 'info'(blue);
completed: 'success'(green);
cancelled: 'neutral'(gray);

// Tickets
open: 'info'(blue);
in_progress: 'warning'(yellow);
resolved: 'success'(green);
closed: 'neutral'(gray);

// Quotes
active: 'info'(blue);
spec_proposed: 'warning'(yellow);
accepted: 'success'(green);
rejected: 'error'(red);
ended: 'neutral'(gray);
```

### Typography Scale

```tsx
// From device-* classes
device-text-caption:  xs -> sm -> base -> lg
device-text-body:     sm -> base -> lg -> xl
device-text-heading:  xl -> 2xl -> 3xl -> 4xl
device-text-hero:     3xl -> 4xl -> 5xl -> 6xl
device-text-display:  4xl -> 5xl -> 6xl -> 7xl
```

### Spacing Scale

```tsx
// From Tailwind
gap-2:  0.5rem (8px)
gap-3:  0.75rem (12px)
gap-4:  1rem (16px)
gap-5:  1.25rem (20px)
gap-6:  1.5rem (24px)
gap-8:  2rem (32px)
gap-10: 2.5rem (40px)
```

---

## Conclusion

This phased redesign plan provides a comprehensive roadmap for enhancing the customer pages UI with responsive design principles. By following this plan, we will:

1. **Improve Visual Hierarchy:** Dashboard emphasizes important recent cards while keeping chat cards accessible
2. **Create Consistency:** All history pages follow identical design patterns
3. **Enhance Responsiveness:** Mobile/tablet users get collapsible sidebar, desktop users get persistent sidebar
4. **Maintain Quality:** Comprehensive testing and accessibility compliance throughout
5. **Minimize Risk:** Gradual phase-by-phase implementation with rollback capabilities

Each phase builds upon the previous one, creating a cohesive and polished user experience across all customer-facing pages.

---

**Next Steps:**

1. Review and approve this plan
2. Begin Phase 1: Foundation & Shared Components
3. Set up feature flags for gradual rollout
4. Create monitoring dashboard for tracking metrics
5. Schedule weekly progress reviews

**Questions or Feedback:**
Please provide feedback on this plan before implementation begins. Key areas for review:

- Dashboard grid layout approach
- History page template design
- Responsive breakpoint strategy
- Testing requirements
- Timeline feasibility
