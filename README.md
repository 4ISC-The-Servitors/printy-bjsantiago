# Printy - Custom Printing Services

A modern, accessible, and performant web application for custom printing services in the Philippines, built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Design System** - Comprehensive design tokens and component library
- **Mobile-First Responsive** - Optimized for all device sizes
- **Accessibility First** - WCAG 2.1 AA compliant
- **Performance Optimized** - Built for Core Web Vitals
- **Type Safe** - Full TypeScript implementation
- **Component Architecture** - Atomic design principles

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
│   ├── atoms/          # Basic building blocks
│   ├── molecules/      # Simple combinations
│   ├── organisms/      # Complex components
│   └── templates/      # Page layouts
├── lib/                # Utility functions and helpers
│   ├── supabase.ts     # Supabase client configuration
│   └── utils.ts        # Common utility functions
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── stores/             # State management
└── pages/              # Page components
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
  "dev": "vite",                    // Start development server
  "build": "tsc -b && vite build",  // Type check and build
  "preview": "vite preview",        // Preview production build
  "lint": "eslint .",               // Run ESLint
  "type-check": "tsc --noEmit",     // TypeScript type checking
  "format": "prettier --write .",   // Format code with Prettier
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

---

**Built with ❤️ by B.J. Santiago INC.**
