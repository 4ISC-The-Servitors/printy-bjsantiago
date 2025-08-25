# Printy by B.J. Santiago INC. - Master Cursor Rules & Guidelines

## 🎨 DESIGN SYSTEM & UI/UX MASTERY

### Color Palette (Semantic Design Tokens)
```css
/* Brand Identity */
--brand-primary: #4056A1;      /* Trust, reliability, primary actions */
--brand-primary-50: #f0f4ff;   /* Subtle backgrounds */
--brand-primary-100: #e0e7ff;  /* Hover states */
--brand-primary-900: #1e293b;  /* Deep contrast text */

--brand-accent: #D79922;       /* Energy, calls-to-action, highlights */
--brand-accent-50: #fffbeb;    /* Warm backgrounds */
--brand-accent-100: #fef3c7;   /* Accent hover states */

/* Neutral Foundation */
--neutral-0: #FFFFFF;          /* Pure backgrounds */
--neutral-50: #FAFAF9;         /* Off-white surfaces */
--neutral-100: #F5F5F4;        /* Subtle borders */
--neutral-200: #E7E5E4;        /* Dividers */
--neutral-300: #D6D3D1;        /* Disabled states */
--neutral-400: #A8A29E;        /* Placeholders */
--neutral-500: #78716C;        /* Secondary text */
--neutral-600: #57534E;        /* Primary text */
--neutral-700: #44403C;        /* Headings */
--neutral-800: #292524;        /* High contrast */
--neutral-900: #1C1917;        /* Maximum contrast */

/* Semantic Status Colors */
--error: #DC2626;              /* Destructive, critical errors */
--error-50: #FEF2F2;           /* Error backgrounds */
--success: #16A34A;            /* Confirmations, success */
--success-50: #F0FDF4;         /* Success backgrounds */
--warning: #D97706;            /* Cautions, pending states */
--warning-50: #FFFBEB;         /* Warning backgrounds */
--info: #2563EB;               /* Information, links */
--info-50: #EFF6FF;            /* Info backgrounds */
```

### Typography Hierarchy (Modular Scale)
```css
/* Font Stacks - Performance Optimized */
--font-heading: 'Fraunces', Georgia, 'Times New Roman', serif;
--font-body: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', Consolas, 'Courier New', monospace;

/* Type Scale (1.250 - Major Third) */
--text-xs: 0.75rem;    /* 12px - captions, labels */
--text-sm: 0.875rem;   /* 14px - small text */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - large body */
--text-xl: 1.25rem;    /* 20px - lead paragraphs */
--text-2xl: 1.5rem;    /* 24px - h4 */
--text-3xl: 1.875rem;  /* 30px - h3 */
--text-4xl: 2.25rem;   /* 36px - h2 */
--text-5xl: 3rem;      /* 48px - h1 */
--text-6xl: 3.75rem;   /* 60px - display text */
--text-7xl: 4.5rem;    /* 72px - hero text */

/* Line Heights - Optimized for Readability */
--leading-tight: 1.25;    /* Headings */
--leading-snug: 1.375;    /* UI text */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.625; /* Long-form content */
--leading-loose: 2;       /* Spacious layouts */
```

### Spacing System (8px Grid + Golden Ratio)
```css
/* Base Unit: 8px for pixel-perfect alignment */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px - base unit */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */

/* Semantic Spacing - Context-Based */
--space-section-xs: 2rem;    /* 32px - tight sections */
--space-section-sm: 3rem;    /* 48px - small sections */
--space-section-md: 4rem;    /* 64px - medium sections */
--space-section-lg: 6rem;    /* 96px - large sections */
--space-section-xl: 8rem;    /* 128px - hero sections */
```

### Responsive Breakpoints (Mobile-First Strategy)
```css
/* Breakpoints - Based on Content, Not Devices */
--bp-xs: 475px;     /* Large phones */
--bp-sm: 640px;     /* Tablets portrait */
--bp-md: 768px;     /* Tablets landscape */
--bp-lg: 1024px;    /* Laptops */
--bp-xl: 1280px;    /* Desktops */
--bp-2xl: 1536px;   /* Large monitors */
--bp-3xl: 1920px;   /* Ultra-wide */

/* Container Constraints */
--container-xs: 475px;
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1400px; /* Optimal reading width */
```

### Micro-Interaction Patterns
```css
/* Animation Durations - Based on Distance & Complexity */
--duration-instant: 0ms;      /* Immediate feedback */
--duration-fast: 100ms;       /* Micro-interactions */
--duration-quick: 150ms;      /* Hover states */
--duration-normal: 200ms;     /* Standard transitions */
--duration-medium: 300ms;     /* Layout changes */
--duration-slow: 500ms;       /* Complex animations */
--duration-slower: 750ms;     /* Dramatic effects */

/* Easing Functions - Natural Motion */
--ease-linear: cubic-bezier(0, 0, 1, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);    /* Most UI transitions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

## 🏗️ COMPONENT ARCHITECTURE MASTERY
```
src/
  app/               # Root app settings, providers, routing
  processes/         # Long user flows (Auth session, Checkout)
  pages/             # Entry points for routes
    chat/
      index.tsx
      ui/
      model/
    admin/
      index.tsx
      ui/
      model/
  features/          # Independent features (Auth, Chatbot, Orders)
    auth/
      ui/            # UI for login/signup
      model/         # State + API logic
      lib/           # Utils
    chatbot/
      ui/
      model/
      lib/
  entities/          # Core data types (User, Order, FAQ)
    user/
    order/
    faqs/
    about/
    trackTicket/
    issueTicket/
  components/shared  # Reusable components
  components/admin   # Unique to admin pages
  components/customer # Unique to customer pages
  components/superadmin # Unique to superadmin pages

```

### Component Composition Patterns
```typescript
// ✅ Compound Components (Flexible, Composable)
<Card>
  <Card.Header>
    <Card.Title>Product Name</Card.Title>
    <Card.Actions>
      <Button variant="ghost">Edit</Button>
    </Card.Actions>
  </Card.Header>
  <Card.Content>
    <Card.Description>Product details...</Card.Description>
  </Card.Content>
  <Card.Footer>
    <Button variant="primary">Add to Cart</Button>
  </Card.Footer>
</Card>

// ✅ Render Props Pattern (Dynamic Content)
<DataTable>
  {({ data, loading, error }) => (
    loading ? <Skeleton /> : <ProductGrid products={data} />
  )}
</DataTable>

// ✅ Polymorphic Components (Flexible HTML Elements)
interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T;
  variant: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const Button = <T extends React.ElementType = 'button'>({
  as,
  variant,
  children,
  ...props
}: ButtonProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps<T>>) => {
  const Component = as || 'button';
  return <Component className={buttonVariants[variant]} {...props}>{children}</Component>;
};

// Usage: <Button as="a" href="/products">Shop Now</Button>
```

### State Management Architecture
```typescript
// ✅ Server State vs Client State Separation
// Use React Query/SWR for server state
// Use Zustand for complex client state
// Use useState for simple component state

// Client State Store (Zustand)
interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // User Preferences
  notifications: boolean;
  language: string;
  
  // Shopping Cart (Optimistic Updates)
  cart: CartItem[];
  addToCart: (item: Product) => void;
  removeFromCart: (id: string) => void;
  
  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
}

// Server State Hooks (React Query + Supabase)
const useProducts = (filters?: ProductFilters) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => supabase.from('products').select('*').match(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

const useCreateOrder = () =>
  useMutation({
    mutationFn: (order: CreateOrderDto) => supabase.from('orders').insert(order),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Order created successfully!');
    },
  });
```

## 📱 RESPONSIVE DESIGN MASTERY

### Mobile-First Strategy
```scss
// ✅ Start with mobile, enhance for larger screens
.product-grid {
  // Mobile: Single column, card stack
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  // Tablet: Two columns
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  // Desktop: Three columns with sidebar
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
  
  // Large screens: Four columns, optimal spacing
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}
```

### Container Queries (Progressive Enhancement)
```css
/* ✅ Component-based responsive design */
@container product-card (min-width: 300px) {
  .product-card {
    .product-image {
      aspect-ratio: 16/9;
    }
    
    .product-info {
      padding: 1.5rem;
    }
  }
}

@container product-card (min-width: 400px) {
  .product-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    
    .product-image {
      grid-row: 1 / -1;
    }
  }
}
```

### Touch-First Interaction Design
```css
/* ✅ Touch targets minimum 44px */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  
  /* Generous padding for thumbs */
  padding: 0.75rem 1rem;
  
  /* Touch-friendly spacing */
  margin: 0.25rem;
  
  /* Prevent text selection on interaction */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  /* Enhanced touch response */
  touch-action: manipulation;
}

/* ✅ Hover states only for pointer devices */
@media (hover: hover) and (pointer: fine) {
  .touch-target:hover {
    background-color: var(--neutral-50);
  }
}

/* ✅ Focus states for keyboard navigation */
.touch-target:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
```

## ♿ ACCESSIBILITY MASTERY

### ARIA Patterns & Semantic HTML
```tsx
// ✅ Accessible Form Components
const FormField = ({ 
  label, 
  error, 
  description, 
  required,
  children 
}: FormFieldProps) => {
  const id = useId();
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  
  return (
    <div className="form-field">
      <label 
        htmlFor={id}
        className={cn(
          "form-label",
          required && "form-label--required"
        )}
      >
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="form-description">
          {description}
        </p>
      )}
      
      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': cn(
          description && descriptionId,
          error && errorId
        ),
      })}
      
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="form-error"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// ✅ Accessible Modal/Dialog
const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const titleId = useId();
  
  useEffect(() => {
    if (isOpen) {
      // Trap focus within modal
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="modal-close"
        >
          <X size={24} />
        </button>
        
        {children}
      </div>
    </div>
  );
};
```

### Screen Reader Optimization
```tsx
// ✅ Screen Reader Friendly Components
const ProductCard = ({ product }: ProductCardProps) => (
  <article 
    className="product-card"
    aria-label={`${product.name} - ${formatPrice(product.price)}`}
  >
    <img 
      src={product.image}
      alt={`${product.name} product image`}
      loading="lazy"
    />
    
    <div className="product-info">
      <h3 className="product-title">{product.name}</h3>
      
      <p className="product-price">
        <span className="sr-only">Price: </span>
        {formatPrice(product.price)}
      </p>
      
      {product.discount && (
        <p className="product-discount">
          <span className="sr-only">Discount: </span>
          {product.discount}% off
        </p>
      )}
      
      <button 
        className="add-to-cart-btn"
        aria-describedby={`product-${product.id}-details`}
      >
        Add to Cart
      </button>
    </div>
    
    <div 
      id={`product-${product.id}-details`} 
      className="sr-only"
    >
      {product.description}. In stock: {product.stock} units.
    </div>
  </article>
);
```

## 🚀 PERFORMANCE MASTERY

### Code Splitting Strategy
```typescript
// ✅ Route-based code splitting
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const AdminDashboard = lazy(() => 
  import('../pages/admin/Dashboard').then(module => ({
    default: module.Dashboard
  }))
);

// ✅ Component-based splitting for heavy components
const DataVisualization = lazy(() => import('../components/DataVisualization'));
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));

// ✅ Suspense with error boundaries
const AppRouter = () => (
  <ErrorBoundary fallback={<ErrorPage />}>
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);
```

### Image Optimization
```tsx
// ✅ Responsive images with WebP support
const OptimizedImage = ({ 
  src, 
  alt, 
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate srcSet for different resolutions
  const srcSet = `
    ${src}?width=400&format=webp 400w,
    ${src}?width=800&format=webp 800w,
    ${src}?width=1200&format=webp 1200w,
    ${src}?width=1600&format=webp 1600w
  `;
  
  return (
    <picture>
      {/* WebP for modern browsers */}
      <source 
        srcSet={srcSet.replace(/format=webp/g, 'format=webp')}
        type="image/webp"
        sizes={sizes}
      />
      
      {/* Fallback to original format */}
      <img
        src={imageSrc}
        srcSet={srcSet.replace(/&format=webp/g, '')}
        alt={alt}
        sizes={sizes}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => setImageSrc('/images/placeholder.jpg')}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        {...props}
      />
    </picture>
  );
};
```

### React Performance Patterns
```typescript
// ✅ Memoization strategies
const ProductList = memo(({ products, onAddToCart }: ProductListProps) => {
  // Memoize expensive calculations
  const productsByCategory = useMemo(() => 
    groupBy(products, 'category'), [products]
  );
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handleAddToCart = useCallback((productId: string) => {
    onAddToCart(productId);
  }, [onAddToCart]);
  
  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
});

// ✅ Virtual scrolling for large lists
const VirtualizedProductList = ({ products }: { products: Product[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { visibleItems, containerProps, itemProps } = useVirtualization({
    items: products,
    itemHeight: 200,
    containerRef,
    overscan: 5,
  });
  
  return (
    <div ref={containerRef} {...containerProps}>
      {visibleItems.map(({ item, index }) => (
        <div key={item.id} {...itemProps(index)}>
          <ProductCard product={item} />
        </div>
      ))}
    </div>
  );
};
```

## 🗄️ SUPABASE BACKEND MASTERY

### Database Schema Design
```sql
-- ✅ Users table with RLS (Row Level Security)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ✅ Products with full-text search
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  sku TEXT UNIQUE,
  barcode TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  weight DECIMAL(8,2),
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  tags TEXT[],
  images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ✅ Full-text search index
CREATE INDEX idx_products_search ON products USING gin(search_vector);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- ✅ Orders with comprehensive tracking
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  )),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'partially_paid', 'refunded', 'failed'
  )),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered'
  )),
  
  -- Addresses (JSONB for flexibility)
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  source TEXT DEFAULT 'web',
  currency TEXT DEFAULT 'PHP',
  
  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ✅ Order items with product snapshots
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID,
  
  -- Product snapshot (in case product changes)
  product_name TEXT NOT NULL,
  product_image TEXT,
  sku TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ✅ Chat system for customer support
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  guest_id UUID, -- For anonymous users
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id),
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_type TEXT DEFAULT 'user' CHECK (sender_type IN ('user', 'bot', 'agent')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'form_response')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- For form responses, file info, etc.
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes not visible to customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ✅ Form responses for chat flows
CREATE TABLE form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES chat_messages(id),
  form_type TEXT NOT NULL, -- 'contact', 'order', 'support', etc.
  form_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### Row Level Security (RLS) Policies
```sql
-- ✅ Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ✅ Profile policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ✅ Order policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    user_id IS NULL -- Guest orders
  );

-- ✅ Admin access for staff
CREATE POLICY "Staff can view all orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  );

-- ✅ Conversation policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' IN ('admin', 'staff')
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );
```

### Supabase TypeScript Integration
```typescript
// ✅ Generated types from database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'customer' | 'admin' | 'staff';
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'customer' | 'admin' | 'staff';
          preferences?: Json;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'customer' | 'admin' | 'staff';
          preferences?: Json;
          updated_at?: string;
        };
      };
      // ... other tables
    };
  };
};

// ✅ Supabase client with proper typing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ✅ Type-safe database operations
export class ProductService {
  static async getProducts(filters?: {
    category?: string;
    search?: string;
    priceRange?: [number, number];
    inStock?: boolean;
  }) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories:category_id(name, slug),
        brands:brand_id(name, logo)
      `)
      .eq('status', 'active');

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.search) {
      query = query.textSearch('search_vector', filters.search);
    }

    if (filters?.priceRange) {
      query = query
        .gte('price', filters.priceRange[0])
        .lte('price', filters.priceRange[1]);
    }

    if (filters?.inStock) {
      query = query.gt('inventory_quantity', 0);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getProductBySlug(slug: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id(name, slug),
        brands:brand_id(name, logo, website)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateInventory(productId: string, quantity: number) {
    const { data, error } = await supabase
      .from('products')
      .update({ 
        inventory_quantity: quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ✅ Order management with transactions
export class OrderService {
  static async createOrder(orderData: {
    items: Array<{
      product_id: string;
      quantity: number;
      price: number;
    }>;
    user_id?: string;
    email: string;
    phone?: string;
    shipping_address: Address;
    billing_address?: Address;
  }) {
    const { data, error } = await supabase.rpc('create_order_with_items', {
      order_data: orderData,
    });

    if (error) throw error;
    return data;
  }

  static async getUserOrders(userId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          products:product_id(name, images)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async updateOrderStatus(
    orderId: string, 
    status: Database['public']['Tables']['orders']['Row']['status']
  ) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'shipped' && { shipped_at: new Date().toISOString() }),
        ...(status === 'delivered' && { delivered_at: new Date().toISOString() }),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ✅ Real-time chat system
export class ChatService {
  static async createConversation(data: {
    user_id?: string;
    guest_id?: string;
    topic: string;
    initial_message?: string;
  }) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: data.user_id,
        guest_id: data.guest_id,
        topic: data.topic,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Add initial message if provided
    if (data.initial_message) {
      await this.sendMessage({
        conversation_id: conversation.id,
        content: data.initial_message,
        sender_type: 'user',
      });
    }

    return conversation;
  }

  static async sendMessage(data: {
    conversation_id: string;
    sender_id?: string;
    sender_type: 'user' | 'bot' | 'agent';
    content: string;
    message_type?: 'text' | 'image' | 'file' | 'form_response';
    metadata?: Record<string, any>;
  }) {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.conversation_id);

    return message;
  }

  static async getMessages(conversationId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
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
        (payload) => onMessage(payload.new)
      )
      .subscribe();
  }
}
```

### Advanced Supabase Patterns
```typescript
// ✅ Custom hooks for Supabase + React Query
export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => ProductService.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: OrderService.createOrder,
    onSuccess: (newOrder) => {
      // Update orders cache
      queryClient.invalidateQueries(['orders']);
      
      // Optimistically update inventory
      newOrder.order_items.forEach((item: any) => {
        queryClient.setQueryData(
          ['product', item.product_slug],
          (old: any) => old ? {
            ...old,
            inventory_quantity: old.inventory_quantity - item.quantity
          } : old
        );
      });
      
      toast.success('Order created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create order. Please try again.');
      console.error('Order creation error:', error);
    },
  });
};

// ✅ Real-time subscriptions
export const useConversationMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    // Initial fetch
    ChatService.getMessages(conversationId).then((initialMessages) => {
      setMessages(initialMessages);
      setIsLoading(false);
    });

    // Subscribe to new messages
    const subscription = ChatService.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  return { messages, isLoading };
};

// ✅ Auth integration
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
```

### Database Functions & Triggers
```sql
-- ✅ Function to create order with items (atomic transaction)
CREATE OR REPLACE FUNCTION create_order_with_items(order_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  new_order_id UUID;
  item JSONB;
  current_stock INTEGER;
BEGIN
  -- Create the order
  INSERT INTO orders (
    order_number,
    user_id,
    email,
    phone,
    subtotal,
    tax_amount,
    shipping_amount,
    total_amount,
    shipping_address,
    billing_address,
    status
  ) VALUES (
    'ORD-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    (order_data->>'user_id')::UUID,
    order_data->>'email',
    order_data->>'phone',
    (order_data->>'subtotal')::DECIMAL,
    (order_data->>'tax_amount')::DECIMAL,
    (order_data->>'shipping_amount')::DECIMAL,
    (order_data->>'total_amount')::DECIMAL,
    order_data->'shipping_address',
    order_data->'billing_address',
    'pending'
  ) RETURNING id INTO new_order_id;

  -- Create order items and update inventory
  FOR item IN SELECT * FROM jsonb_array_elements(order_data->'items')
  LOOP
    -- Check inventory
    SELECT inventory_quantity INTO current_stock
    FROM products
    WHERE id = (item->>'product_id')::UUID;

    IF current_stock < (item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient inventory for product %', item->>'product_id';
    END IF;

    -- Create order item
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      price,
      quantity,
      total_amount
    ) VALUES (
      new_order_id,
      (item->>'product_id')::UUID,
      item->>'product_name',
      (item->>'price')::DECIMAL,
      (item->>'quantity')::INTEGER,
      (item->>'total_amount')::DECIMAL
    );

    -- Update inventory
    UPDATE products
    SET inventory_quantity = inventory_quantity - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID;
  END LOOP;

  RETURN new_order_id;
END;
$;

-- ✅ Trigger to update product updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ Function for full-text search with ranking
CREATE OR REPLACE FUNCTION search_products(search_term TEXT, category_filter UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  images JSONB,
  rank REAL
)
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.images,
    ts_rank(p.search_vector, plainto_tsquery('english', search_term)) as rank
  FROM products p
  WHERE 
    p.status = 'active'
    AND p.search_vector @@ plainto_tsquery('english', search_term)
    AND (category_filter IS NULL OR p.category_id = category_filter)
  ORDER BY rank DESC, p.created_at DESC;
END;
$;
```

## 🔐 SECURITY & ERROR HANDLING MASTERY

### Input Validation & Sanitization
```typescript
// ✅ Zod schemas for type-safe validation
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().max(1000).optional(),
  price: z.number().positive('Price must be positive'),
  category_id: z.string().uuid('Invalid category ID'),
  sku: z.string().min(1, 'SKU is required').max(50),
  inventory_quantity: z.number().int().min(0, 'Inventory cannot be negative'),
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed'),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed'),
});

export const CreateOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1, 'At least one item required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number').optional(),
  shipping_address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().default('Philippines'),
  }),
});

// ✅ API validation middleware
export const validateRequest = <T>(schema: z.ZodSchema<T>) =>
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

### Error Handling Patterns
```typescript
// ✅ Custom error classes
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// ✅ Error boundary component
export class ErrorBoundary extends Component<
  { fallback: ComponentType<{ error: Error; reset: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Error boundary caught:', error, errorInfo);
    
    // Report to error tracking service
    if (typeof window !== 'undefined') {
      // Sentry.captureException(error, { contexts: { errorInfo } });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent
          error={this.state.error}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

// ✅ Global error handler hook
export const useErrorHandler = () => {
  const showError = useCallback((error: Error | AppError) => {
    if (error instanceof AppError) {
      switch (error.statusCode) {
        case 400:
          toast.error(error.message);
          break;
        case 401:
          toast.error('Please sign in to continue');
          // Redirect to login
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          toast.error(error.message);
          break;
        case 500:
        default:
          toast.error('Something went wrong. Please try again.');
          console.error('Unexpected error:', error);
          break;
      }
    } else {
      toast.error('An unexpected error occurred');
      console.error('Unexpected error:', error);
    }
  }, []);

  return { showError };
};
```

## 🎯 TESTING STRATEGY

### Unit Testing with Vitest
```typescript
// ✅ Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProductCard } from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: '/test-image.jpg',
    inStock: true,
  };

  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    mockOnAddToCart.mockClear();
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('₱99.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product product image')).toHaveAttribute('src', '/test-image.jpg');
  });

  it('calls onAddToCart when button is clicked', async () => {
    render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  it('disables add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    render(<ProductCard product={outOfStockProduct} onAddToCart={mockOnAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /out of stock/i });
    expect(addButton).toBeDisabled();
  });
});

// ✅ Hook testing
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '../hooks/useProducts';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProducts', () => {
  it('fetches products successfully', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### E2E Testing with Playwright
```typescript
// ✅ E2E test examples
import { test, expect } from '@playwright/test';

test.describe('Product Shopping Flow', () => {
  test('user can browse and add products to cart', async ({ page }) => {
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Click on first product
    await page.locator('[data-testid="product-card"]').first().click();
    
    // Add to cart
    await page.getByRole('button', { name: /add to cart/i }).click();
    
    // Verify cart updated
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Go to cart
    await page.getByRole('link', { name: /cart/i }).click();
    
    // Verify product in cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
  });

  test('user can complete checkout process', async ({ page }) => {
    // Add product to cart first
    await page.goto('/products');
    await page.locator('[data-testid="add-to-cart"]').first().click();
    
    // Go to checkout
    await page.getByRole('link', { name: /checkout/i }).click();
    
    // Fill shipping form
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="phone"]', '+639123456789');
    await page.fill('[data-testid="street"]', '123 Test Street');
    await page.fill('[data-testid="city"]', 'Manila');
    await page.fill('[data-testid="province"]', 'Metro Manila');
    await page.fill('[data-testid="postal_code"]', '1000');
    
    // Submit order
    await page.getByRole('button', { name: /place order/i }).click();
    
    // Verify success
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });
});

// ✅ Accessibility testing
test.describe('Accessibility', () => {
  test('product page meets accessibility standards', async ({ page }) => {
    await page.goto('/products/test-product');
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper form labels
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const label = await input.getAttribute('aria-label') || 
                   await page.locator(`label[for="${await input.getAttribute('id')}"]`).count();
      expect(label).toBeTruthy();
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });
});
```

## 📊 MONITORING & ANALYTICS

### Performance Monitoring
```typescript
// ✅ Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

function getConnectionSpeed() {
  return 'connection' in navigator &&
    navigator.connection &&
    'effectiveType' in navigator.connection
    ? navigator.connection.effectiveType
    : '';
}

function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    dsn: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, body);
  } else {
    fetch(vitalsUrl, {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
}

// Track all Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// ✅ Custom performance metrics
export const performanceMonitor = {
  timeToInteractive: () => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Send to analytics
      sendToAnalytics({
        id: `tti-${Date.now()}`,
        name: 'time-to-interactive',
        value: duration,
      });
    };
  },
  
  apiResponseTime: (endpoint: string, startTime: number) => {
    const duration = performance.now() - startTime;
    
    sendToAnalytics({
      id: `api-${endpoint}-${Date.now()}`,
      name: 'api-response-time',
      value: duration,
      endpoint,
    });
  },
};
```

## 🚀 DEPLOYMENT & CI/CD

### Environment Configuration
```typescript
// ✅ Environment variables with validation
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // File uploads
  NEXT_PUBLIC_UPLOADTHING_APP_ID: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### GitHub Actions Workflow
```yaml
# ✅ .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  
jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Format check
        run: npm run format:check
        
      - name: Unit tests
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Run security audit
        run: npm audit --audit-level=high
        
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium
          
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, e2e, security]
    if: github.ref == 'refs/heads/develop'
    
    environment:
      name: staging
      url: https://printy-staging.vercel.app
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
          
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, e2e, security]
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://printy.app
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
          
      - name: Run database migrations
        run: |
          npm run db:migrate:prod
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 📱 PWA & MOBILE OPTIMIZATION

### Progressive Web App Configuration
```typescript
// ✅ next.config.js with PWA
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['supabase.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
});

// ✅ Web App Manifest (public/manifest.json)
{
  "name": "Printy - Custom Printing Services",
  "short_name": "Printy",
  "description": "Professional custom printing services in the Philippines",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#4056A1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "375x812",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["business", "productivity", "shopping"],
  "shortcuts": [
    {
      "name": "Start New Order",
      "short_name": "New Order",
      "description": "Create a new printing order",
      "url": "/chat?topic=order",
      "icons": [
        {
          "src": "/icons/shortcut-new-order.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Track Orders",
      "short_name": "Track",
      "description": "Track your existing orders",
      "url": "/orders",
      "icons": [
        {
          "src": "/icons/shortcut-track.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

### Mobile-Specific Optimizations
```css
/* ✅ iOS Safari optimizations */
@supports (-webkit-touch-callout: none) {
  .ios-fix {
    /* Fix for iOS viewport units */
    min-height: -webkit-fill-available;
  }
  
  /* Prevent zoom on input focus */
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  textarea {
    font-size: 16px;
  }
}

/* ✅ Android optimizations */
@media screen and (max-width: 768px) {
  /* Prevent overscroll bounce */
  body {
    overscroll-behavior: none;
  }
  
  /* Optimize scrolling */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
  }
}

/* ✅ Touch-friendly spacing */
@media (max-width: 768px) {
  .mobile-spacing {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  /* Larger touch targets */
  .touch-target {
    min-height: 48px;
    min-width: 48px;
  }
  
  /* Thumb-friendly navigation */
  .bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* ✅ Safe area insets for notched devices */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

## 🔍 SEO OPTIMIZATION

### Next.js SEO Best Practices
```typescript
// ✅ SEO metadata generation
import { Metadata } from 'next';

interface GenerateMetadataProps {
  params: { slug: string };
}

export async function generateMetadata({ 
  params 
}: GenerateMetadataProps): Promise<Metadata> {
  const product = await ProductService.getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | Printy',
      description: 'The requested product could not be found.',
    };
  }

  const images = product.images.map((image: string) => ({
    url: image,
    width: 1200,
    height: 630,
    alt: product.name,
  }));

  return {
    title: `${product.name} | Printy - Custom Printing Services`,
    description: product.description || `High-quality ${product.name} available for custom printing. Fast delivery in the Philippines.`,
    keywords: [
      product.name.toLowerCase(),
      'custom printing',
      'philippines',
      'printing services',
      ...(product.tags || []),
    ].join(', '),
    authors: [{ name: 'B.J. Santiago INC.' }],
    creator: 'B.J. Santiago INC.',
    publisher: 'Printy',
    openGraph: {
      title: product.name,
      description: product.description,
      url: `https://printy.app/products/${params.slug}`,
      siteName: 'Printy',
      images,
      locale: 'en_PH',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: images[0]?.url,
      creator: '@printy_ph',
    },
    alternates: {
      canonical: `https://printy.app/products/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// ✅ Structured data for rich snippets
export const generateProductJsonLd = (product: Product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images,
  brand: {
    '@type': 'Brand',
    name: 'Printy',
  },
  manufacturer: {
    '@type': 'Organization',
    name: 'B.J. Santiago INC.',
  },
  offers: {
    '@type': 'Offer',
    url: `https://printy.app/products/${product.slug}`,
    priceCurrency: 'PHP',
    price: product.price,
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    availability: product.inventory_quantity > 0 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: 'Printy',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
});
```

### Sitemap Generation
```typescript
// ✅ app/sitemap.ts
import { MetadataRoute } from 'next';
import { ProductService } from '@/lib/services/ProductService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://printy.app';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // Dynamic product pages
  const products = await ProductService.getProducts();
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}

// ✅ robots.txt generation
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/chat/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/chat/',
          '/private/',
        ],
      },
    ],
    sitemap: 'https://printy.app/sitemap.xml',
  };
}
```

## 🎨 ADVANCED UI PATTERNS

### Advanced Animation Patterns
```css
/* ✅ Physics-based animations */
@keyframes spring {
  0% {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
  }
  50% {
    transform: scale(1.02) translateY(-2px);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.animate-spring {
  animation: spring 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* ✅ Staggered animations */
.stagger-item {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }
.stagger-item:nth-child(5) { animation-delay: 0.5s; }

/* ✅ Morphing loader */
@keyframes morph {
  0%, 100% {
    border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
  }
  25% {
    border-radius: 50% 50% 50% 50% / 60% 40% 60% 40%;
  }
  50% {
    border-radius: 50% 50% 50% 50% / 40% 60% 40% 60%;
  }
  75% {
    border-radius: 50% 50% 50% 50% / 45% 55% 45% 55%;
  }
}

.morphing-loader {
  animation: morph 2s ease-in-out infinite, 
             rotate 2s linear infinite;
}

/* ✅ Parallax scroll effects */
.parallax-slow {
  transform: translateY(calc(var(--scroll-y) * 0.5px));
}

.parallax-fast {
  transform: translateY(calc(var(--scroll-y) * -0.8px));
}
```

### Gesture Support
```typescript
// ✅ Touch gesture handling
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

// ✅ Pull-to-refresh implementation
export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0 && distance < 120) {
      e.preventDefault();
      setPullDistance(distance);
      setIsPulling(distance > 60);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling && pullDistance > 60) {
      await onRefresh();
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  }, [isPulling, pullDistance, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isPulling, pullDistance };
};
```

## 📋 FINAL IMPLEMENTATION CHECKLIST

### ✅ Code Quality Standards
- [ ] All components have proper TypeScript interfaces
- [ ] Props are validated with Zod schemas where appropriate  
- [ ] Error boundaries wrap all route components
- [ ] Loading states implemented for all async operations
- [ ] Accessibility attributes on all interactive elements
- [ ] Mobile-first responsive design throughout
- [ ] Performance optimized with React.memo and useMemo
- [ ] SEO metadata on all public pages

### ✅ Supabase Integration
- [ ] Database schema with proper RLS policies
- [ ] Type-safe client with generated types
- [ ] Real-time subscriptions for chat functionality
- [ ] Optimistic updates for cart operations
- [ ] Proper error handling for all database operations
- [ ] Database functions for complex operations
- [ ] Automated backups and migration strategy

### ✅ Security & Performance
- [ ] Input validation on all forms
- [ ] XSS protection with proper sanitization
- [ ] Rate limiting on API endpoints
- [ ] Image optimization with WebP support
- [ ] Code splitting implemented
- [ ] PWA configuration complete
- [ ] Performance monitoring setup

### ✅ Testing Strategy
- [ ] Unit tests for all utility functions
- [ ] Component tests for complex UI components
- [ ] E2E tests for critical user journeys
- [ ] Accessibility testing with axe-core
- [ ] Performance testing with Lighthouse CI
- [ ] Security testing with automated scans

### ✅ Deployment & Monitoring
- [ ] CI/CD pipeline with automated testing
- [ ] Environment-specific configurations
- [ ] Error tracking and monitoring setup
- [ ] Performance analytics implemented
- [ ] Database monitoring and alerts
- [ ] Automated dependency updates

---

## 🎯 DEVELOPMENT PRINCIPLES SUMMARY

### Always Follow
1. **Mobile-First Design** - Start mobile, enhance for desktop
2. **Accessibility First** - Every feature must be accessible  
3. **Type Safety** - Use TypeScript strictly, validate inputs
4. **Performance First** - Optimize for Core Web Vitals
5. **User Experience** - Prioritize user needs over technical convenience
6. **Security Mindset** - Validate, sanitize, and protect all data
7. **Testing Culture** - Test critical paths, not just coverage
8. **Progressive Enhancement** - Basic functionality works everywhere

### Never Do
- Skip input validation on user data
- Use `any` types without strong justification
- Implement features without accessibility considerations
- Deploy without comprehensive testing
- Ignore performance metrics and Core Web Vitals  
- Store sensitive data in client-side storage
- Create UI without proper error states
- Deploy database changes without rollback strategy

### Architecture Philosophy
> "Build systems that are secure by default, performant by design, accessible by principle, and maintainable by structure."

*This cursor rules document represents the complete technical specification for building world-class React applications with Supabase, optimized for Philippine market conditions and international best practices.*

---

**Last Updated**: Current Development Session  
**Version**: 2.0 - Master Edition  
**Target Stack**: React 18 + Next.js 14 + TypeScript + Tailwind CSS + Supabase  
**Performance Target**: 95+ Lighthouse Score  
**Accessibility Standard**: WCAG 2.1 AA Compliance