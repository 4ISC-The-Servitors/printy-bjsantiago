# Printy by B.J. Santiago INC. - Development Guidelines

## Design System & UI/UX

### Color Palette

```css
/* Brand Identity */
--brand-primary: #4056a1;
--brand-primary-50: #f0f4ff;
--brand-primary-100: #e0e7ff;
--brand-primary-900: #1e293b;

--brand-accent: #d79922;
--brand-accent-50: #fffbeb;
--brand-accent-100: #fef3c7;

/* Neutral Foundation */
--neutral-0: #ffffff;
--neutral-50: #fafaf9;
--neutral-100: #f5f5f4;
--neutral-600: #57534e;
--neutral-700: #44403c;
--neutral-900: #1c1917;

/* Semantic Status */
--error: #dc2626;
--success: #16a34a;
--warning: #d97706;
--info: #2563eb;
```

### Typography

```css
/* Font Stacks */
--font-heading: 'Fraunces', Georgia, serif;
--font-body: 'Space Grotesk', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', Consolas, monospace;

/* Type Scale */
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-4xl: 2.25rem;
--text-6xl: 3.75rem;
```

### Spacing System

```css
/* Base 8px Grid */
--space-2: 0.5rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-24: 6rem;
```

### Responsive Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

## Component Architecture

### Project Structure

```
src/
  app/               # Root app settings
  processes/         # Long user flows
  pages/             # Route entry points
  features/          # Independent features
  entities/          # Core data types
  components/shared  # Reusable components
  components/admin   # Admin-specific
  components/customer # Customer-specific
```

### Component Patterns

```typescript
// Compound Components
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card>

// Polymorphic Components
interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T;
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button = <T extends React.ElementType = 'button'>({
  as, variant, children, ...props
}: ButtonProps<T>) => {
  const Component = as || 'button';
  return <Component className={variants[variant]} {...props}>{children}</Component>;
};
```

### State Management

```typescript
// Server State (React Query)
const useProducts = (filters?: ProductFilters) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => supabase.from('products').select('*'),
    staleTime: 5 * 60 * 1000,
  });

// Client State (Zustand)
interface AppState {
  cart: CartItem[];
  addToCart: (item: Product) => void;
  theme: 'light' | 'dark';
}
```

## Responsive Design

### Mobile-First Strategy

```scss
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Touch Optimization

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1rem;
  user-select: none;
  touch-action: manipulation;
}

@media (hover: hover) and (pointer: fine) {
  .touch-target:hover {
    background-color: var(--neutral-50);
  }
}
```

## Accessibility

### ARIA Patterns

```tsx
const FormField = ({ label, error, required, children }) => {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>

      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': error && errorId,
      })}

      {error && (
        <p id={errorId} role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
};
```

### Screen Reader Support

```tsx
const ProductCard = ({ product }) => (
  <article aria-label={`${product.name} - ${formatPrice(product.price)}`}>
    <img src={product.image} alt={`${product.name} product image`} />
    <h3>{product.name}</h3>
    <p>
      <span className="sr-only">Price: </span>
      {formatPrice(product.price)}
    </p>
  </article>
);
```

## Performance

### Code Splitting

```typescript
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));

const AppRouter = () => (
  <ErrorBoundary fallback={<ErrorPage />}>
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);
```

### Image Optimization

```tsx
const OptimizedImage = ({ src, alt, sizes }) => {
  const srcSet = `
    ${src}?width=400&format=webp 400w,
    ${src}?width=800&format=webp 800w,
    ${src}?width=1200&format=webp 1200w
  `;

  return (
    <picture>
      <source srcSet={srcSet} type="image/webp" sizes={sizes} />
      <img src={src} alt={alt} loading="lazy" sizes={sizes} />
    </picture>
  );
};
```

## Supabase Integration

### Database Schema

```sql
-- Users with RLS
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products with full-text search
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  inventory_quantity INTEGER DEFAULT 0,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  ) STORED
);

CREATE INDEX idx_products_search ON products USING gin(search_vector);
```

### RLS Policies

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Type-Safe Client

```typescript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'customer' | 'admin' | 'staff';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
        };
      };
    };
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service layer
export class ProductService {
  static async getProducts(filters?: ProductFilters) {
    let query = supabase.from('products').select('*').eq('status', 'active');

    if (filters?.search) {
      query = query.textSearch('search_vector', filters.search);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
```

### Real-time Chat

```typescript
export class ChatService {
  static async sendMessage(data: {
    conversation_id: string;
    content: string;
    sender_type: 'user' | 'bot' | 'agent';
  }) {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return message;
  }

  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: any) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => onMessage(payload.new)
      )
      .subscribe();
  }
}
```

## Security & Error Handling

### Input Validation

```typescript
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  category_id: z.string().uuid(),
  inventory_quantity: z.number().int().min(0),
});

export const validateRequest =
  <T>(schema: z.ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
```

### Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export const useErrorHandler = () => {
  const showError = useCallback((error: Error | AppError) => {
    if (error instanceof AppError) {
      switch (error.statusCode) {
        case 400:
          toast.error(error.message);
          break;
        case 401:
          toast.error('Please sign in to continue');
          break;
        default:
          toast.error('Something went wrong');
          break;
      }
    }
  }, []);

  return { showError };
};
```

## Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ProductCard } from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: '/test.jpg',
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} onAddToCart={vi.fn()} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('₱99.99')).toBeInTheDocument();
  });
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test('user can add product to cart', async ({ page }) => {
  await page.goto('/products');
  await page.locator('[data-testid="add-to-cart"]').first().click();
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
});
```

## SEO & PWA

### Metadata Generation

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await ProductService.getProductBySlug(params.slug);

  return {
    title: `${product.name} | Printy`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images,
    },
  };
}
```

### PWA Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  images: {
    domains: ['supabase.com'],
    formats: ['image/webp', 'image/avif'],
  },
});
```

## Button & Container Sizing

### Responsive Button Scale

```css
/* Touch-first button hierarchy */
xs:  h-8  px-2  text-xs   /* 32px - icons */
sm:  h-9  px-3  text-sm   /* 36px - secondary */
md:  h-11 px-4  text-sm   /* 44px - default (WCAG) */
lg:  h-12 px-6  text-base /* 48px - primary */
xl:  h-14 px-8  text-lg   /* 56px - hero CTAs */
```

### Content Containers

```css
content-xs:   24rem (384px)  /* Auth forms */
content-sm:   28rem (448px)  /* Mobile layouts */
content-md:   32rem (512px)  /* Standard forms */
content-lg:   42rem (672px)  /* Article content */
content-xl:   56rem (896px)  /* Main content */
content-2xl:  72rem (1152px) /* Dashboard sections */
```

## Shared Component System

### MANDATORY Component Usage

**❌ NEVER create custom implementations when shared components exist:**

```tsx
// ❌ BAD - Custom implementations
<h1 className="text-3xl font-bold">Title</h1>
<button className="text-brand-primary underline">Link</button>
<span className="px-2 py-1 bg-green-100 text-green-700">Status</span>
<div className="bg-white rounded-lg border p-4">Content</div>

// ✅ GOOD - Use shared components
<Text variant="h1" size="3xl" weight="bold">Title</Text>
<Button variant="ghost" className="text-brand-primary underline">Link</Button>
<Badge variant="success" size="sm">Status</Badge>
<Card className="p-4">Content</Card>
```

### Required Shared Components

**Text & Typography:**

- Use `<Text>` component for ALL text elements (h1-h6, p, span, div)
- Supports: variant, size, weight, color, align, truncate

**Interactive Elements:**

- Use `<Button>` for ALL interactive elements (buttons, links, CTAs)
- Supports: variant, size, threeD, loading, disabled states

**Data Display:**

- Use `<Badge>` for status indicators, tags, counts
- Use `<Card>` for content containers, sections, panels

**Form Elements:**

- Use `<Input>` for ALL form inputs with built-in validation

**Layout:**

- Use `<Container>` for content width constraints

### Component Import Pattern

```typescript
// ✅ Always import from shared index
import { Text, Button, Badge, Card, Input, Container } from '../shared';
import {
  Text,
  Button,
  Badge,
  Card,
  Input,
  Container,
} from '../../components/shared';
```

### Enforcement Rules

1. **NO custom HTML elements** when shared component exists
2. **NO custom styling** that duplicates component functionality
3. **NO inline styles** for standard UI patterns
4. **ALWAYS check showcase** before creating custom components
5. **MAINTAIN consistency** across entire codebase

### Audit Checklist

Before committing, verify NO instances of:

- `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>` tags
- `<p>` tags (except in shared components)
- `<button>` tags with custom styling
- `<span>` with badge-like styling (`px-`, `py-`, `rounded`, `bg-`)
- `<div>` with card-like styling (`bg-white`, `rounded`, `border`, `shadow`)

## Development Principles

### Always Follow

1. **Mobile-First Design** - Start mobile, enhance for desktop
2. **Accessibility First** - WCAG 2.1 AA compliance
3. **Type Safety** - Strict TypeScript, validate inputs
4. **Performance First** - Optimize for Core Web Vitals
5. **Security Mindset** - Validate and sanitize all data
6. **Shared Components First** - Use design system components exclusively

### Never Do

- Skip input validation on user data
- Use `any` types without justification
- Implement without accessibility considerations
- Deploy without comprehensive testing
- Store sensitive data client-side
- **Create custom UI elements when shared components exist**
- **Use raw HTML tags for styled elements**
- **Duplicate component functionality**

## Linting & Type Safety

### TypeScript Rules We Enforce

1. No `any` types
   - Prefer domain types or utility generics.
   - If uncertain, use `unknown` + narrow with runtime checks.

2. Prefer `const`
   - Use `const` by default; switch to `let` only if reassignment is required.

3. Avoid unused identifiers
   - Remove unused variables and params.
   - For intentionally unused params, prefix with `_` or use `void param`.

4. Accurate event and handler types
   - Use `React.FormEvent<HTMLFormElement>`, `React.ChangeEvent<HTMLInputElement>` etc.

5. Typed media queries (no `any`)
   - Use `matchMedia` with modern listeners, fallback to legacy without `any`:

   ```ts
   const mql = window.matchMedia('(min-width: 1024px)');
   const handleModern = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
   const handleLegacy = function (
     this: MediaQueryList,
     e: MediaQueryListEvent
   ) {
     setIsDesktop(e.matches);
   };
   setIsDesktop(mql.matches);
   if (mql.addEventListener) mql.addEventListener('change', handleModern);
   else (mql as MediaQueryList).addListener(handleLegacy);
   // cleanup mirrors add
   ```

6. React hooks dependencies
   - Wrap callback dependencies using `useCallback` when referenced in `useEffect`.
   - Keep dependency arrays complete; avoid disabling ESLint rules.

7. Utility function generics
   - Replace `(...args: any[]) => any` with constrained generics:

   ```ts
   export function debounce<TArgs extends unknown[]>(
     func: (...args: TArgs) => void,
     wait: number
   ): (...args: TArgs) => void {
     /* ... */
   }
   ```

8. Shared response and API types
   - Use `ApiResponse<T = unknown>` and `Record<string, unknown>` for metadata.

9. Component polymorphism without `any`
   - Cast `as` to `React.ElementType` and type refs precisely; do not use `any` casts.

10. Tailwind plugin typing

- Type plugin params instead of `any`: `{ addUtilities: (utils: Record<string, unknown>) => void }`.

### Workflow

- Fix quick wins first (unused vars, prefer-const, hook deps), then replace `any` types.
- Strengthen shared types/utilities before consumers to minimize churn.
- Run lint after each batch; do not relax rules to “pass”.

### Examples

```ts
// Unused param
export function resolveAdminFlow(topic?: string | null) {
  void topic;
  return null;
}

// Error handling without any
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}

// Metadata typing
const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
```

### Architecture Philosophy

Build systems that are secure by default, performant by design, accessible by principle, maintainable by structure, and consistent by shared component usage.
