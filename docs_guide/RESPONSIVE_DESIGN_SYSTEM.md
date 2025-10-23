# Responsive Design System

## Overview

This document provides a comprehensive guide to the centralized responsive design system in the Printy project. The system uses CSS utility classes (`device-*`) to ensure consistent, responsive behavior across all components and breakpoints.

## Design Philosophy

### Mobile-First Approach

- All `device-*` classes start with mobile styles and scale up
- Breakpoints: `xs` (475px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px), `3xl` (1920px)

### Consistent Scaling

- Text, buttons, spacing, and layout elements scale proportionally
- Touch-friendly sizing on mobile devices
- Desktop-optimized sizing for larger screens

### Single Source of Truth

- All responsive behavior defined in `src/index.css`
- No JavaScript-based responsive logic
- Tailwind-first approach with custom CSS for complex patterns

## Typography System

### Text Scaling Classes

#### `device-text-caption`

- **Mobile**: `text-xs` (12px)
- **Tablet**: `text-sm` (14px)
- **Laptop**: `text-base` (16px)
- **Desktop**: `text-lg` (18px)
- **Use for**: Small labels, metadata, timestamps

#### `device-text-body`

- **Mobile**: `text-sm` (14px)
- **Tablet**: `text-base` (16px)
- **Laptop**: `text-lg` (18px)
- **Desktop**: `text-xl` (20px)
- **Use for**: Body text, descriptions, content

#### `device-text-heading`

- **Mobile**: `text-xl` (20px)
- **Tablet**: `text-2xl` (24px)
- **Laptop**: `text-3xl` (30px)
- **Desktop**: `text-4xl` (36px)
- **Use for**: Section headings, card titles, form labels

#### `device-text-hero`

- **Mobile**: `text-3xl` (30px)
- **Tablet**: `text-4xl` (36px)
- **Laptop**: `text-5xl` (48px)
- **Desktop**: `text-6xl` (60px)
- **Use for**: Page titles, hero sections, major headings

#### `device-text-display`

- **Mobile**: `text-4xl` (36px)
- **Tablet**: `text-5xl` (48px)
- **Laptop**: `text-6xl` (60px)
- **Desktop**: `text-7xl` (72px)
- **Use for**: Display text, large banners, marketing headlines

### Usage Examples

```tsx
// Caption text
<Text size="xs">Last updated 2 hours ago</Text>

// Body text
<Text size="base">This is the main content of the page.</Text>

// Heading
<Text size="xl">Section Title</Text>

// Hero text
<Text size="3xl">Welcome to Printy</Text>
```

## Button System

### Button Scaling Classes

#### `device-btn-primary`

- **Mobile**: `h-9 px-4 text-sm` (36px height)
- **Tablet**: `h-10 px-5 text-base` (40px height)
- **Laptop**: `h-11 px-6 text-base` (44px height)
- **Desktop**: `h-12 px-8 text-lg` (48px height)
- **Use for**: Primary actions, CTAs, main buttons

#### `device-btn-secondary`

- **Mobile**: `h-8 px-3 text-sm` (32px height)
- **Tablet**: `h-9 px-4 text-sm` (36px height)
- **Laptop**: `h-10 px-5 text-base` (40px height)
- **Desktop**: `h-11 px-6 text-lg` (44px height)
- **Use for**: Secondary actions, alternative buttons

#### `device-btn-tertiary`

- **Mobile**: `h-7 px-2 text-xs` (28px height)
- **Tablet**: `h-8 px-3 text-sm` (32px height)
- **Laptop**: `h-9 px-4 text-base` (36px height)
- **Desktop**: `h-10 px-5 text-lg` (40px height)
- **Use for**: Small actions, icon buttons, minimal buttons

#### `device-btn-input`

- **Mobile**: `h-9 px-4 text-sm` (36px height)
- **Tablet**: `h-10 px-5 text-base` (40px height)
- **Laptop**: `h-11 px-6 text-base` (44px height)
- **Desktop**: `h-12 px-7 text-lg` (48px height)
- **Use for**: Form buttons, input actions

### Usage Examples

```tsx
// Primary button
<Button size="md">Save Changes</Button>

// Secondary button
<Button variant="secondary" size="sm">Cancel</Button>

// Small button
<Button variant="ghost" size="xs">Edit</Button>
```

## Input System

### Input Scaling

#### `device-input`

- **Mobile**: `h-9 px-3 text-sm` (36px height)
- **Tablet**: `h-10 px-4 text-base` (40px height)
- **Laptop**: `h-11 px-5 text-base` (44px height)
- **Desktop**: `h-12 px-6 text-lg` (48px height)
- **Use for**: All form inputs, search fields

### Usage Examples

```tsx
// Standard input
<Input placeholder="Enter your email" />

// Input with label
<Input
  label="Email Address"
  type="email"
  required
/>
```

## Badge System

### Badge Scaling Classes

#### `device-badge-sm`

- **Mobile**: `px-1.5 py-0.5 text-xs` (small badge)
- **Tablet**: `px-2 py-0.5 text-sm` (medium badge)
- **Laptop**: `px-2.5 py-1 text-base` (larger badge)
- **Desktop**: `px-3 py-1 text-base` (largest badge)
- **Use for**: Small status indicators, tags

#### `device-badge-md`

- **Mobile**: `px-2 py-0.5 text-sm` (medium badge)
- **Tablet**: `px-2.5 py-1 text-sm` (larger badge)
- **Laptop**: `px-3 py-1 text-base` (large badge)
- **Desktop**: `px-4 py-1.5 text-lg` (largest badge)
- **Use for**: Standard badges, categories

#### `device-badge-lg`

- **Mobile**: `px-2.5 py-1 text-sm` (large badge)
- **Tablet**: `px-3 py-1.5 text-sm` (larger badge)
- **Laptop**: `px-4 py-1.5 text-base` (large badge)
- **Desktop**: `px-5 py-2 text-lg` (largest badge)
- **Use for**: Prominent badges, featured tags

### Usage Examples

```tsx
// Small badge
<Badge size="sm" variant="success">Active</Badge>

// Medium badge
<Badge size="md" variant="primary">Featured</Badge>

// Large badge
<Badge size="lg" variant="accent">New</Badge>
```

## Layout System

### Spacing Classes

#### `device-spacing-section`

- **Mobile**: `py-6` (24px vertical)
- **Tablet**: `py-8` (32px vertical)
- **Laptop**: `py-12` (48px vertical)
- **Desktop**: `py-16` (64px vertical)
- **Use for**: Section spacing, page sections

#### `device-spacing-component`

- **Mobile**: `p-4` (16px all sides)
- **Tablet**: `p-5` (20px all sides)
- **Laptop**: `p-6` (24px all sides)
- **Desktop**: `p-8` (32px all sides)
- **Use for**: Component padding, card content

### Grid Classes

#### `device-grid`

- **Mobile**: `grid-cols-1 gap-3` (1 column)
- **Tablet**: `grid-cols-2 gap-4` (2 columns)
- **Laptop**: `grid-cols-3 gap-5` (3 columns)
- **Desktop**: `grid-cols-4 gap-6` (4 columns)
- **Use for**: Responsive grid layouts

#### `device-container`

- **Mobile**: `max-w-content-sm px-4` (448px max, 16px padding)
- **Tablet**: `max-w-content-md px-6` (512px max, 24px padding)
- **Laptop**: `max-w-content-lg px-8` (672px max, 32px padding)
- **Desktop**: `max-w-content-xl px-10` (896px max, 40px padding)
- **Use for**: Content containers, page layouts

### Usage Examples

```tsx
// Section with responsive spacing
<section className="device-spacing-section">
  <div className="device-container">
    <h2 className="device-text-heading">Our Services</h2>
    <div className="device-grid">
      {/* Grid items */}
    </div>
  </div>
</section>

// Card with responsive padding
<Card>
  <Card.Content>
    <h3 className="device-text-heading">Card Title</h3>
    <p className="device-text-body">Card content...</p>
  </Card.Content>
</Card>
```

## Special Considerations

### Touch Device Optimization

For large touch devices (tablets), the system includes special overrides:

```css
@media (hover: none) and (pointer: coarse) and (min-width: 1024px) {
  .device-text-heading {
    font-size: 1.5rem; /* ~text-2xl */
  }
  .device-btn-primary {
    height: 2.5rem; /* h-10 */
  }
}
```

### 3D Effects

The system preserves 3D effects for buttons and containers:

```tsx
// 3D button
<Button threeD>Click me</Button>

// 3D container
<div className="container-3d">Content</div>
```

## Migration Guide

### From useResponsiveClasses Hook

**Before:**

```tsx
import { useResponsiveClasses } from '@shared/hooks/ui/useResponsiveClasses';

const { textClasses, buttonClasses } = useResponsiveClasses();

<h1 className={textClasses.heading}>Title</h1>
<Button className={buttonClasses.primary}>Click</Button>
```

**After:**

```tsx
<h1 className="device-text-heading">Title</h1>
<Button size="md">Click</Button>
```

### From Custom Responsive Classes

**Before:**

```tsx
<div className="h-8 text-xs sm:h-9 sm:text-sm md:h-10 md:text-base">
  Content
</div>
```

**After:**

```tsx
<div className="device-btn-secondary">Content</div>
```

## Best Practices

### 1. Use Semantic Sizing

- Choose button sizes based on importance, not arbitrary preferences
- Use `device-btn-primary` for main actions, `device-btn-secondary` for alternatives

### 2. Consistent Text Hierarchy

- Use `device-text-heading` for all section titles
- Use `device-text-body` for all content text
- Use `device-text-caption` for metadata

### 3. Layout Patterns

- Use `device-container` for page-level containers
- Use `device-grid` for responsive card layouts
- Use `device-spacing-section` for vertical rhythm

### 4. Component Composition

- Combine device-\* classes with Tailwind utilities when needed
- Keep custom responsive logic minimal
- Prefer device-\* classes over custom breakpoint logic

## Troubleshooting

### Common Issues

1. **Text not scaling**: Ensure you're using `device-text-*` classes instead of static Tailwind text sizes
2. **Buttons too small/large**: Check that you're using the correct `device-btn-*` class for the context
3. **Spacing inconsistent**: Use `device-spacing-*` classes for consistent spacing across breakpoints

### Debugging

Use browser dev tools to inspect the applied classes and verify responsive behavior:

```css
/* Check if device classes are applied */
.device-text-heading {
  /* Should show responsive font sizes */
}
```

## Future Enhancements

- Add more specialized device-\* classes as needed
- Consider container queries for more sophisticated responsive behavior
- Add dark mode variants if needed
- Create component-specific responsive patterns

---

This responsive design system ensures consistent, maintainable, and scalable responsive behavior across the entire Printy application.
