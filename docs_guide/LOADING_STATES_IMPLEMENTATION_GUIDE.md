# Loading States Implementation Guide

**Last Updated:** 2025-01-19
**Status:** Active Implementation Guide

## Overview

This guide provides a systematic approach to implementing consistent, accurate loading skeletons throughout the application. All loading states should mimic the actual component layout and placement for a seamless user experience.

## Core Principles

1. **Accurate Placement**: Loading skeletons must exactly match the actual component layout
2. **Skeleton Animation**: All skeletons use the built-in shimmer animation from the `Skeleton` component
3. **Centralized Organization**: All loading states live in dedicated `loadingStates` folders
4. **Consistent Structure**: Follow the same structure for creating and organizing loading components

## Implementation Steps

### Step 1: Analyze the Target Component

Before creating a loading skeleton, thoroughly analyze the target component:

1. **Identify the layout structure**
   - Read the component file and identify all major sections
   - Note spacing, padding, and margins
   - Identify responsive breakpoints

2. **Map out visible elements**
   - Headers and titles
   - Cards and containers
   - Forms and inputs
   - Lists and grids
   - Action buttons

3. **Document responsive behavior**
   - Mobile vs desktop layouts
   - Grid column changes
   - Show/hide behavior at breakpoints

### Step 2: Create the Loading Component

#### File Structure

```
src/
  [module]/
    components/
      loadingStates/
        [ComponentName]Loading.tsx
        index.ts
```

#### Naming Convention

- Component: `[ComponentName]Loading.tsx`
- Example: `CustomerDashboardLoading.tsx`, `AdminOrdersLoading.tsx`

#### Component Template

```tsx
import React from 'react';
import { Skeleton, Card } from '@shared/components';

/**
 * [ComponentName]Loading Component
 *
 * Loading skeleton that accurately mimics the [Component Name] layout:
 * - [Section 1 description]
 * - [Section 2 description]
 * - [Section 3 description]
 *
 * Uses the same responsive classes and spacing as the actual components
 * for a seamless loading experience.
 */
const [ComponentName]Loading: React.FC = () => {
  return (
    <div className="w-full">
      {/* Section 1: Header */}
      <div className="[spacing classes]">
        <Skeleton
          variant="text"
          width="[width]"
          height="[height]"
          className="[additional classes]"
        />
      </div>

      {/* Section 2: Main Content */}
      <div className="[spacing classes]">
        {/* Add skeleton elements matching actual layout */}
      </div>

      {/* Additional sections as needed */}
    </div>
  );
};

export default [ComponentName]Loading;
```

### Step 3: Use Existing Components

Leverage existing shared components for consistency:

**Available Components:**

- `<Skeleton />` - Base skeleton with variants: `text`, `circular`, `rectangular`
- `<Card />` - For card-based layouts
- Standard spacing classes: `space-y-*`, `gap-*`, `mb-*`, `mt-*`

**Example:**

```tsx
// For a card header
<Skeleton
  variant="text"
  width="200px"
  height="24px"
  className="mb-4"
/>

// For a circular avatar
<Skeleton
  variant="circular"
  width="40px"
  height="40px"
/>

// For content blocks
<Skeleton
  variant="rectangular"
  width="100%"
  height="120px"
  className="rounded-lg"
/>
```

### Step 4: Match Responsive Behavior

Use the same responsive classes as the actual component:

```tsx
// Example: Grid that changes from 1 to 3 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {[1, 2, 3, 4, 5, 6].map(i => (
    <Skeleton key={i} variant="rectangular" width="100%" height="200px" />
  ))}
</div>
```

### Step 5: Update Component to Use Loading State

#### In the Parent Component

```tsx
import { CustomerDashboardLoading } from '@customer/components/loadingStates';

const CustomerDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <CustomerDashboardLoading />;
  }

  return (
    // Actual component content
  );
};
```

### Step 6: Export from Index

Create/update the index file for easy importing:

```tsx
// src/customer/components/loadingStates/index.ts
export { default as CustomerDashboardLoading } from './CustomerDashboardLoading';
export { default as [OtherComponent]Loading } from './[OtherComponent]Loading';
```

## Implementation Checklist

### Analysis Phase

- [ ] Read target component file completely
- [ ] Document all major sections and their structure
- [ ] Note responsive breakpoints and behavior
- [ ] Identify spacing and layout patterns
- [ ] Map out all visible elements

### Creation Phase

- [ ] Create loading component file in correct location
- [ ] Add JSDoc documentation describing the layout
- [ ] Implement header/title skeletons
- [ ] Implement main content skeletons
- [ ] Implement secondary content skeletons
- [ ] Match responsive classes exactly
- [ ] Test skeleton animation appears

### Integration Phase

- [ ] Export from index file
- [ ] Import in parent component
- [ ] Replace generic `PageLoading` with custom skeleton
- [ ] Test loading state display
- [ ] Test transition from loading to loaded content
- [ ] Verify responsive behavior

### Quality Check

- [ ] Skeleton matches actual layout when loaded
- [ ] Spacing and alignment are accurate
- [ ] Responsive behavior matches actual component
- [ ] Skeleton animation is visible and smooth
- [ ] No visual glitches during transition
- [ ] Loading state duration is appropriate

## Component-Specific Patterns

### Dashboard Pages

```tsx
// Pattern: Header + Stats Cards + Content Grid
<div className="space-y-6">
  {/* Header */}
  <div>
    <Skeleton variant="text" width="300px" height="36px" />
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => (
      <Card key={i}>
        <Skeleton variant="text" width="80px" height="20px" />
        <Skeleton variant="text" width="120px" height="32px" />
      </Card>
    ))}
  </div>

  {/* Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Content skeletons */}
  </div>
</div>
```

### List Pages

```tsx
// Pattern: Header + Filters + List Items
<div className="space-y-4">
  {/* Header */}
  <div className="flex justify-between items-center">
    <Skeleton variant="text" width="200px" height="28px" />
    <Skeleton variant="rectangular" width="120px" height="40px" />
  </div>

  {/* Filters */}
  <div className="flex gap-2">
    <Skeleton variant="rectangular" width="100px" height="36px" />
    <Skeleton variant="rectangular" width="100px" height="36px" />
  </div>

  {/* List Items */}
  {[1, 2, 3, 4, 5].map(i => (
    <Card key={i} className="p-4">
      <div className="flex justify-between">
        <Skeleton variant="text" width="200px" height="20px" />
        <Skeleton variant="text" width="80px" height="20px" />
      </div>
    </Card>
  ))}
</div>
```

### Form Pages

```tsx
// Pattern: Header + Form Sections
<div className="space-y-6">
  {/* Header */}
  <Skeleton variant="text" width="250px" height="32px" />

  {/* Form Section */}
  <Card className="p-6">
    <div className="space-y-4">
      <div>
        <Skeleton variant="text" width="100px" height="20px" className="mb-2" />
        <Skeleton variant="rectangular" width="100%" height="40px" />
      </div>
      {/* Repeat for all form fields */}
    </div>
  </Card>

  {/* Actions */}
  <div className="flex gap-4 justify-end">
    <Skeleton variant="rectangular" width="100px" height="40px" />
    <Skeleton variant="rectangular" width="100px" height="40px" />
  </div>
</div>
```

### Detail/View Pages

```tsx
// Pattern: Header + Content Sections + Actions
<div className="space-y-6">
  {/* Header with back button */}
  <div className="flex items-center gap-4">
    <Skeleton variant="circular" width="32px" height="32px" />
    <Skeleton variant="text" width="200px" height="28px" />
  </div>

  {/* Main Content */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Left Column */}
    <div className="lg:col-span-2 space-y-4">
      <Card>
        <Skeleton variant="rectangular" width="100%" height="300px" />
      </Card>
    </div>

    {/* Right Column */}
    <div className="space-y-4">
      <Card>
        <Skeleton variant="text" width="150px" height="20px" />
      </Card>
    </div>
  </div>
</div>
```

## Best Practices

### DO ✅

- **Match the exact layout** of the actual component
- **Use the same responsive classes** for consistency
- **Match spacing and padding** exactly
- **Include all major visual elements** in the skeleton
- **Use semantic HTML structure** for accessibility
- **Add descriptive comments** in the code
- **Test on multiple screen sizes**
- **Verify animation is visible**

### DON'T ❌

- Don't create generic skeletons that don't match the layout
- Don't use arbitrary spacing or sizes
- Don't forget about responsive behavior
- Don't make skeletons too detailed (avoid text-like skeletons)
- Don't use skeleton animation on disabled backgrounds
- Don't create loading states that are too fast to see
- Don't forget to export from index files
- Don't use `PageLoading` for specific component loading

## Common Mistakes to Avoid

### 1. Incorrect Spacing

```tsx
// ❌ BAD: Using arbitrary spacing
<div className="mt-10 mb-5">
  <Skeleton />

// ✅ GOOD: Matching actual component spacing
<div className="mb-6 sm:mb-8">
  <Skeleton />
```

### 2. Missing Responsive Behavior

```tsx
// ❌ BAD: Not responsive
<div className="grid grid-cols-3 gap-4">

// ✅ GOOD: Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

### 3. Wrong Skeleton Sizes

```tsx
// ❌ BAD: Skeleton doesn't match actual content size
<Skeleton variant="rectangular" width="50px" height="20px" />

// ✅ GOOD: Skeleton matches actual element size
<Skeleton variant="text" width="200px" height="28px" />
```

### 4. Not Matching Actual Layout

```tsx
// ❌ BAD: Simplified skeleton that doesn't match
<div>
  <Skeleton />
  <Skeleton />
</div>

// ✅ GOOD: Matches actual component structure
<div className="space-y-6">
  <div className="text-center space-y-1 mb-6">
    <Skeleton variant="text" width="300px" height="36px" className="mx-auto" />
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* ... */}
  </div>
</div>
```

## Testing the Implementation

### Visual Testing

1. **Load the page with skeleton**
   - Verify skeleton appears immediately
   - Check that animation is visible
   - Confirm spacing and alignment

2. **Wait for content to load**
   - Verify smooth transition from skeleton to content
   - Check that content appears in the same position
   - Confirm no layout shifts

3. **Test responsive behavior**
   - Resize browser to different breakpoints
   - Verify skeleton layout matches actual layout at each breakpoint
   - Test on mobile device if possible

### Code Testing

```tsx
// Test loading state toggle
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 2000);
  return () => clearTimeout(timer);
}, []);

// Simulate loading delay to test skeleton
```

## Maintenance Guidelines

### When to Update Loading States

1. **Component layout changes** - Update skeleton to match new layout
2. **Responsive breakpoints change** - Update skeleton classes
3. **New sections added** - Add corresponding skeleton elements
4. **Spacing changes** - Update skeleton spacing to match

### Keeping Skeleton and Component in Sync

- Always update loading skeleton when modifying component layout
- Include skeleton updates in the same PR as layout changes
- Document skeleton structure in component comments
- Review both together during code review

## Examples and Reference

### Working Examples

- `src/customer/components/loadingStates/CustomerDashboardLoading.tsx` ✅
  - Complete implementation with header, tabs, cards, and grid
  - Responsive classes matching actual component
  - Proper use of Skeleton variants

### Related Files

- `src/shared/components/ui/Skeleton.tsx` - Base skeleton component
- `src/index.css` - Skeleton animation styles
- `src/shared/components/layout/PageLoading.tsx` - Generic loading (not recommended for specific pages)

## Next Steps

1. **Identify high-traffic pages** that need loading states
2. **Prioritize by user impact** (dashboard, orders, quotes)
3. **Implement one component at a time**
4. **Gather user feedback** on loading experience
5. **Iterate and improve** based on feedback

## Future Enhancements

- Consider skeleton generation tools for complex components
- Implement skeleton templates for common patterns
- Add loading state analytics to measure impact
- Create Storybook stories for loading states
- Add automated visual regression testing

---

**Quick Reference:**

```tsx
// Import custom loading component
import { CustomerDashboardLoading } from '@customer/components/loadingStates';

// Use in component
if (isLoading) {
  return <CustomerDashboardLoading />;
}

// Export from index
export { default as [ComponentName]Loading } from './[ComponentName]Loading';
```
