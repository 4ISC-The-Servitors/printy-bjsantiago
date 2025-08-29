import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      scale: {
        '98': '0.98',
        '99': '0.99',
        '101': '1.01',
        '102': '1.02',
      },
      colors: {
        // Brand Identity
        brand: {
          primary: '#4056A1',
          'primary-50': '#f0f4ff',
          'primary-100': '#e0e7ff',
          'primary-900': '#1e293b',
          accent: '#D79922',
          'accent-50': '#fffbeb',
          'accent-100': '#fef3c7',
        },
        // Neutral Foundation
        neutral: {
          '0': '#FFFFFF',
          '50': '#FAFAF9',
          '100': '#F5F5F4',
          '200': '#E7E5E4',
          '300': '#D6D3D1',
          '400': '#A8A29E',
          '500': '#78716C',
          '600': '#57534E',
          '700': '#44403C',
          '800': '#292524',
          '900': '#1C1917',
        },
        // Semantic Status Colors
        error: {
          DEFAULT: '#DC2626',
          '50': '#FEF2F2',
        },
        success: {
          DEFAULT: '#16A34A',
          '50': '#F0FDF4',
        },
        warning: {
          DEFAULT: '#D97706',
          '50': '#FFFBEB',
        },
        info: {
          DEFAULT: '#2563EB',
          '50': '#EFF6FF',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        body: [
          'Space Grotesk',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.375' }], // 14px
        base: ['1rem', { lineHeight: '1.5' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.5' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.5' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '1.25' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.25' }], // 36px
        '5xl': ['3rem', { lineHeight: '1.25' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1.25' }], // 60px
        '7xl': ['4.5rem', { lineHeight: '1.25' }], // 72px
      },
      spacing: {
        '1': '0.25rem', // 4px
        '2': '0.5rem', // 8px - base unit
        '3': '0.75rem', // 12px
        '4': '1rem', // 16px
        '5': '1.25rem', // 20px
        '6': '1.5rem', // 24px
        '8': '2rem', // 32px
        '10': '2.5rem', // 40px
        '12': '3rem', // 48px
        '16': '4rem', // 64px
        '20': '5rem', // 80px
        '24': '6rem', // 96px
        '32': '8rem', // 128px
        // Semantic spacing
        'section-xs': '2rem', // 32px
        'section-sm': '3rem', // 48px
        'section-md': '4rem', // 64px
        'section-lg': '6rem', // 96px
        'section-xl': '8rem', // 128px
      },
      screens: {
        xs: '475px', // Large phones
        sm: '640px', // Tablets portrait
        md: '768px', // Tablets landscape
        lg: '1024px', // Laptops
        xl: '1280px', // Desktops
        '2xl': '1536px', // Large monitors
        '3xl': '1920px', // Ultra-wide
      },
      maxWidth: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px', // Optimal reading width
        // Content-driven container widths (from sizing guidelines)
        'content-xs': '24rem', // 384px
        'content-sm': '28rem', // 448px
        'content-md': '32rem', // 512px
        'content-lg': '42rem', // 672px
        'content-xl': '56rem', // 896px
        'content-2xl': '72rem', // 1152px
        'content-3xl': '80rem', // 1280px
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        spring: 'spring 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        morph: 'morph 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        spring: {
          '0%': { transform: 'scale(0.95) translateY(10px)', opacity: '0' },
          '50%': { transform: 'scale(1.02) translateY(-2px)', opacity: '0.8' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        morph: {
          '0%, 100%': { borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%' },
          '25%': { borderRadius: '50% 50% 50% 50% / 60% 40% 60% 40%' },
          '50%': { borderRadius: '50% 50% 50% 50% / 40% 60% 40% 60%' },
          '75%': { borderRadius: '50% 50% 50% 50% / 45% 55% 45% 55%' },
        },
      },
      transitionDuration: {
        instant: '0ms',
        fast: '100ms',
        quick: '150ms',
        normal: '200ms',
        medium: '300ms',
        slow: '500ms',
        slower: '750ms',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        elastic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium:
          '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        large:
          '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(64, 86, 161, 0.3)',
        'glow-accent': '0 0 20px rgba(215, 153, 34, 0.3)',
      },
    },
  },
  plugins: [
    // Custom plugin for container queries (progressive enhancement)
    function ({
      addUtilities,
    }: {
      addUtilities: (utils: Record<string, unknown>) => void;
    }) {
      const newUtilities = {
        '.container-query': {
          'container-type': 'inline-size',
        },
        '@container (min-width: 300px)': {
          '.cq\\:grid-cols-2': {
            'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
          },
        },
        '@container (min-width: 400px)': {
          '.cq\\:grid-cols-3': {
            'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
