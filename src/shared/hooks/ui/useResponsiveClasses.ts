import { useMemo } from 'react';
import { useBreakpoint } from './useBreakpoint';

/**
 * Device breakpoint types
 */
export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

/**
 * Text size variants for different UI elements
 */
export type TextVariant = 'caption' | 'body' | 'heading' | 'hero' | 'display';

/**
 * Button size variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'input';

/**
 * Spacing variants for different contexts
 */
export type SpacingVariant = 'gap' | 'padding' | 'margin' | 'container';

/**
 * Responsive text classes based on our successful OrderItem implementation
 */
export interface ResponsiveTextClasses {
  caption: string;   // text-xs → text-lg
  body: string;      // text-sm → text-xl  
  heading: string;   // text-sm → text-xl
  hero: string;      // text-lg → text-2xl
  display: string;   // text-xl → text-4xl
}

/**
 * Responsive button classes
 */
export interface ResponsiveButtonClasses {
  primary: string;   // h-9 → h-12
  secondary: string; // h-8 → h-11
  tertiary: string;  // h-7 → h-10
  input: string;     // h-9 → h-12
}

/**
 * Responsive spacing classes
 */
export interface ResponsiveSpacingClasses {
  gap: string;       // gap-1 → gap-6
  padding: string;   // p-2 → p-8
  margin: string;    // m-2 → m-6
  container: string; // p-3 → p-6
}

/**
 * Icon size classes
 */
export interface ResponsiveIconClasses {
  small: string;     // w-3 h-3 → w-5 h-5
  medium: string;    // w-4 h-4 → w-6 h-6
  large: string;     // w-5 h-5 → w-7 h-7
}

/**
 * Badge responsive classes
 */
export interface ResponsiveBadgeClasses {
  text: string;      // text-xs → text-lg
  padding: string;   // px-1.5 py-0.5 → px-3 py-1
}

/**
 * Hook that provides responsive CSS classes based on device breakpoints
 * Based on our successful OrderItem implementation
 */
export function useResponsiveClasses() {
  const breakpoint = useBreakpoint();

  const textClasses: ResponsiveTextClasses = useMemo(() => ({
    // Caption text: scales from text-xs (mobile) to text-lg (desktop)
    caption: 'text-xs sm:text-sm md:text-base lg:text-lg',
    
    // Body text: scales from text-sm (mobile) to text-xl (desktop)
    body: 'text-sm sm:text-base md:text-lg lg:text-xl',
    
    // Heading text: scales from text-sm (mobile) to text-xl (desktop)
    heading: 'text-sm sm:text-base md:text-lg lg:text-xl',
    
    // Hero text: scales from text-lg (mobile) to text-2xl (desktop)
    hero: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    
    // Display text: scales from text-xl (mobile) to text-4xl (desktop)
    display: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl'
  }), []);

  const buttonClasses: ResponsiveButtonClasses = useMemo(() => ({
    // Primary buttons: h-9 → h-12
    primary: 'h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm md:h-10 md:px-5 md:text-base lg:h-11 lg:px-6 lg:text-lg',
    
    // Secondary buttons: h-8 → h-11
    secondary: 'h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm md:h-9 md:px-4 md:text-base lg:h-10 lg:px-5 lg:text-lg',
    
    // Tertiary buttons: h-7 → h-10
    tertiary: 'h-6 px-2 text-xs sm:h-7 sm:px-3 sm:text-sm md:h-8 md:px-4 md:text-base lg:h-9 lg:px-5 lg:text-lg',
    
    // Input buttons: h-9 → h-12
    input: 'h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm md:h-10 md:px-5 md:text-base lg:h-11 lg:px-6 lg:text-lg'
  }), []);

  const spacingClasses: ResponsiveSpacingClasses = useMemo(() => ({
    // Gap spacing: gap-1 → gap-6
    gap: 'gap-1 sm:gap-2 md:gap-3 lg:gap-6',
    
    // Padding: p-2 → p-8
    padding: 'p-2 sm:p-3 md:p-4 lg:p-8',
    
    // Margin: m-2 → m-6
    margin: 'm-2 sm:m-3 md:m-4 lg:m-6',
    
    // Container padding: p-3 → p-6
    container: 'p-3 sm:p-4 md:p-5 lg:p-6'
  }), []);

  const iconClasses: ResponsiveIconClasses = useMemo(() => ({
    // Small icons: w-3 h-3 → w-5 h-5
    small: 'w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5',
    
    // Medium icons: w-4 h-4 → w-6 h-6
    medium: 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6',
    
    // Large icons: w-5 h-5 → w-7 h-7
    large: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7'
  }), []);

  const badgeClasses: ResponsiveBadgeClasses = useMemo(() => ({
    // Badge text: text-xs → text-lg
    text: 'text-xs sm:text-sm md:text-base lg:text-lg',
    
    // Badge padding: px-1.5 py-0.5 → px-3 py-1
    padding: 'px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 lg:px-3 lg:py-1'
  }), []);

  return {
    textClasses,
    buttonClasses,
    spacingClasses,
    iconClasses,
    badgeClasses,
    breakpoint
  };
}

/**
 * Hook that provides device-specific utilities
 */
export function useDeviceUtils() {
  const breakpoint = useBreakpoint();

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';
  const isMobileOrTablet = isMobile || isTablet;

  const deviceType: DeviceType = useMemo(() => {
    switch (breakpoint) {
      case 'mobile': return 'mobile';
      case 'tablet': return 'tablet';
      case 'desktop': 
        // Further differentiate between laptop and desktop
        if (typeof window !== 'undefined') {
          return window.matchMedia('(min-width: 1280px)').matches ? 'desktop' : 'laptop';
        }
        return 'laptop';
      default: return 'mobile';
    }
  }, [breakpoint]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    deviceType,
    breakpoint
  };
}


export default useResponsiveClasses;
