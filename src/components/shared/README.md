# Shared UI Components - Modular Architecture

## 📁 File Structure

```
src/components/shared/
├── index.ts                 # Centralized exports (all components)
├── Button.tsx              # Button component (45 lines)
├── Input.tsx               # Input component (75 lines)
├── Card.tsx                # Card component (85 lines)
├── Text.tsx                # Typography component (95 lines)
├── Badge.tsx               # Badge component (55 lines)
├── Skeleton.tsx            # Loading states (50 lines)
├── Container.tsx           # Layout container (45 lines)
├── ComponentShowcase.tsx   # Main showcase (35 lines)
└── showcase/               # Modular showcase components
    ├── index.ts            # Showcase exports
    ├── ButtonShowcase.tsx  # Button demonstrations (35 lines)
    ├── InputShowcase.tsx   # Input demonstrations (30 lines)
    ├── CardShowcase.tsx    # Card demonstrations (40 lines)
    ├── TypographyShowcase.tsx # Typography examples (35 lines)
    ├── BadgeShowcase.tsx   # Badge examples (35 lines)
    ├── SkeletonShowcase.tsx # Loading examples (30 lines)
    └── ContainerShowcase.tsx # Container examples (35 lines)
```

## 🎯 Modularization Principles

### **File Size Standards**
- **Target**: 50-100 lines per file
- **Maximum**: 100 lines (hard limit)
- **Ideal**: 30-70 lines for optimal maintainability

### **Component Architecture**
- **Single Responsibility**: Each component has one clear purpose
- **Composition Over Inheritance**: Use compound components pattern
- **Extract Sub-components**: Break down complex components into smaller pieces
- **Utility Functions**: Move helper logic to separate functions

### **Code Organization**
```typescript
// ✅ Good: Modular structure
const Component = React.forwardRef<HTMLDivElement, ComponentProps>((props, ref) => {
  // Main component logic (20-30 lines)
  return <ComponentJSX />;
});

// Sub-components (10-20 lines each)
const SubComponent1: React.FC<Props> = ({ children }) => (
  <div>{children}</div>
);

const SubComponent2: React.FC<Props> = ({ children }) => (
  <span>{children}</span>
);

// Utility functions (5-15 lines each)
const getVariantClasses = (variant: string) => ({ /* ... */ }[variant]);
const getSizeClasses = (size: string) => ({ /* ... */ }[size]);

// Attach compound components
Component.Sub1 = SubComponent1;
Component.Sub2 = SubComponent2;
```

## 🚀 Usage Examples

### **Importing Components**
```typescript
// ✅ Single import point
import { Button, Card, Input, Text } from '@/components/shared';

// ✅ Import specific showcase sections
import { ButtonShowcase, CardShowcase } from '@/components/shared/showcase';
```

### **Component Composition**
```typescript
// ✅ Compound component pattern
<Card hoverable>
  <Card.Header>
    <Card.Title>Product Name</Card.Title>
    <Card.Actions>
      <Button variant="ghost">Edit</Button>
    </Card.Actions>
  </Card.Header>
  <Card.Content>
    <Text>Product details...</Text>
  </Card.Content>
  <Card.Footer>
    <Button variant="primary">Save</Button>
  </Card.Footer>
</Card>
```

## 🔧 Development Guidelines

### **When to Split Components**
- **File exceeds 100 lines** → Extract sub-components
- **Multiple responsibilities** → Separate into focused components
- **Repeated patterns** → Create reusable utility components
- **Complex logic** → Extract helper functions

### **Naming Conventions**
- **Components**: PascalCase (e.g., `ButtonShowcase`)
- **Files**: PascalCase (e.g., `ButtonShowcase.tsx`)
- **Functions**: camelCase (e.g., `getVariantClasses`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `BUTTON_VARIANTS`)

### **TypeScript Best Practices**
- **Interface naming**: `ComponentProps` suffix
- **Generic types**: Use `React.ElementType` for polymorphic components
- **Compound components**: Extend component type with sub-component interfaces
- **Forward refs**: Always use `React.forwardRef` for DOM elements

## 📊 Performance Considerations

### **Memoization Strategy**
```typescript
// ✅ Memoize expensive calculations
const getVariantClasses = useMemo(() => 
  variantClassMap[variant], [variant]
);

// ✅ Memoize sub-components
const MemoizedSubComponent = React.memo(SubComponent);
```

### **Bundle Optimization**
- **Tree shaking**: Components export individually
- **Code splitting**: Showcase components load separately
- **Lazy loading**: Heavy components can be lazy-loaded

## 🧪 Testing Strategy

### **Unit Testing**
- **Component isolation**: Test each component independently
- **Props validation**: Test all prop combinations
- **Accessibility**: Test ARIA attributes and keyboard navigation
- **Edge cases**: Test error states and boundary conditions

### **Integration Testing**
- **Compound components**: Test component composition
- **Showcase pages**: Test component interactions
- **Responsive behavior**: Test across breakpoints

## 🔄 Refactoring Workflow

### **Step 1: Identify Large Files**
```bash
# Find files over 100 lines
find src/components/shared -name "*.tsx" -exec wc -l {} + | sort -nr
```

### **Step 2: Extract Sub-components**
- Identify logical sections
- Create separate component files
- Update imports and exports
- Maintain single responsibility

### **Step 3: Extract Utility Functions**
- Move helper logic to separate functions
- Keep functions pure and testable
- Use descriptive naming conventions

### **Step 4: Update Documentation**
- Update component interfaces
- Document new sub-components
- Provide usage examples
- Update showcase components

## 📈 Benefits of Modular Architecture

### **Maintainability**
- **Easier debugging**: Smaller files are easier to navigate
- **Faster development**: Focus on one component at a time
- **Better testing**: Isolated components are easier to test
- **Cleaner git history**: Smaller, focused commits

### **Reusability**
- **Component composition**: Mix and match sub-components
- **Flexible APIs**: Components adapt to different use cases
- **Consistent patterns**: Standardized component structure
- **Easy extension**: Add new variants without complexity

### **Team Collaboration**
- **Parallel development**: Multiple developers can work simultaneously
- **Code ownership**: Clear component responsibilities
- **Review efficiency**: Smaller PRs are easier to review
- **Knowledge sharing**: Focused components are easier to understand

## 🎯 Success Metrics

### **Code Quality**
- [ ] All files under 100 lines
- [ ] Single responsibility principle
- [ ] Consistent naming conventions
- [ ] Proper TypeScript typing

### **Developer Experience**
- [ ] Easy component discovery
- [ ] Clear import patterns
- [ ] Comprehensive documentation
- [ ] Working examples

### **Performance**
- [ ] Fast build times
- [ ] Efficient bundle size
- [ ] Smooth runtime performance
- [ ] Responsive interactions

---

*This modular architecture ensures our shared components are maintainable, scalable, and developer-friendly while following industry best practices.*
