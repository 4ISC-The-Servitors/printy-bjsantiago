import { useMemo } from 'react';
import { useResponsiveClasses } from './useResponsiveClasses';

/**
 * Button size variants
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button style variants
 */
export type ButtonStyle =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'accent';

/**
 * Hook that provides responsive button classes
 * Based on our successful OrderItem button implementation
 */
export function useResponsiveButton() {
  const { buttonClasses, iconClasses } = useResponsiveClasses();

  const getButtonClasses = useMemo(() => {
    return {
      // Primary action buttons - most prominent
      primary: (size: ButtonSize = 'md') => {
        const baseClasses = buttonClasses.primary;
        const sizeClasses = {
          xs: 'h-6 px-2 text-xs sm:h-7 sm:px-2.5 sm:text-xs',
          sm: 'h-7 px-2.5 text-xs sm:h-8 sm:px-3 sm:text-sm',
          md: baseClasses,
          lg: 'h-9 px-4 text-sm sm:h-10 sm:px-5 sm:text-base md:h-11 md:px-6 md:text-lg lg:h-12 lg:px-8 lg:text-xl',
          xl: 'h-10 px-5 text-base sm:h-12 sm:px-6 sm:text-lg md:h-14 md:px-8 md:text-xl lg:h-16 lg:px-10 lg:text-2xl',
        };
        return `${sizeClasses[size]} font-medium`;
      },

      // Secondary action buttons - supporting actions
      secondary: (size: ButtonSize = 'md') => {
        const baseClasses = buttonClasses.secondary;
        const sizeClasses = {
          xs: 'h-5 px-1.5 text-xs sm:h-6 sm:px-2 sm:text-xs',
          sm: 'h-6 px-2 text-xs sm:h-7 sm:px-2.5 sm:text-sm',
          md: baseClasses,
          lg: 'h-8 px-3 text-sm sm:h-9 sm:px-4 sm:text-base md:h-10 md:px-5 md:text-lg lg:h-11 lg:px-6 lg:text-xl',
          xl: 'h-9 px-4 text-base sm:h-11 sm:px-5 sm:text-lg md:h-12 md:px-6 md:text-xl lg:h-14 lg:px-8 lg:text-2xl',
        };
        return `${sizeClasses[size]} font-medium`;
      },

      // Tertiary action buttons - subtle actions
      tertiary: (size: ButtonSize = 'md') => {
        const baseClasses = buttonClasses.tertiary;
        const sizeClasses = {
          xs: 'h-4 px-1 text-xs sm:h-5 sm:px-1.5 sm:text-xs',
          sm: 'h-5 px-1.5 text-xs sm:h-6 sm:px-2 sm:text-sm',
          md: baseClasses,
          lg: 'h-7 px-2.5 text-sm sm:h-8 sm:px-3 sm:text-base md:h-9 md:px-4 md:text-lg lg:h-10 lg:px-5 lg:text-xl',
          xl: 'h-8 px-3 text-base sm:h-10 sm:px-4 sm:text-lg md:h-11 md:px-5 md:text-xl lg:h-12 lg:px-6 lg:text-2xl',
        };
        return `${sizeClasses[size]} font-medium`;
      },

      // Ghost buttons - minimal styling
      ghost: (size: ButtonSize = 'md') => {
        const baseClasses = 'bg-transparent hover:bg-neutral-100';
        const sizeClasses = {
          xs: 'h-5 px-1.5 text-xs sm:h-6 sm:px-2 sm:text-xs',
          sm: 'h-6 px-2 text-xs sm:h-7 sm:px-2.5 sm:text-sm',
          md: 'h-7 px-2.5 text-xs sm:h-8 sm:px-3 sm:text-sm md:h-9 md:px-4 md:text-base lg:h-10 lg:px-5 lg:text-lg',
          lg: 'h-8 px-3 text-sm sm:h-9 sm:px-4 sm:text-base md:h-10 md:px-5 md:text-lg lg:h-11 lg:px-6 lg:text-xl',
          xl: 'h-9 px-4 text-base sm:h-11 sm:px-5 sm:text-lg md:h-12 md:px-6 md:text-xl lg:h-14 lg:px-8 lg:text-2xl',
        };
        return `${sizeClasses[size]} ${baseClasses} font-medium`;
      },

      // Input buttons - form actions
      input: (size: ButtonSize = 'md') => {
        const baseClasses = buttonClasses.input;
        const sizeClasses = {
          xs: 'h-6 px-2 text-xs sm:h-7 sm:px-2.5 sm:text-xs',
          sm: 'h-7 px-2.5 text-xs sm:h-8 sm:px-3 sm:text-sm',
          md: baseClasses,
          lg: 'h-9 px-4 text-sm sm:h-10 sm:px-5 sm:text-base md:h-11 md:px-6 md:text-lg lg:h-12 lg:px-8 lg:text-xl',
          xl: 'h-10 px-5 text-base sm:h-12 sm:px-6 sm:text-lg md:h-14 md:px-8 md:text-xl lg:h-16 lg:px-10 lg:text-2xl',
        };
        return `${sizeClasses[size]} font-medium`;
      },
    };
  }, [buttonClasses]);

  /**
   * Get responsive button classes for different use cases
   */
  const getChatButtonClasses = (size: ButtonSize = 'sm') => {
    return `${getButtonClasses.secondary(size)} shrink-0`;
  };

  const getActionButtonClasses = (size: ButtonSize = 'md') => {
    return `${getButtonClasses.primary(size)}`;
  };

  const getNavigationButtonClasses = (size: ButtonSize = 'md') => {
    return `${getButtonClasses.secondary(size)}`;
  };

  const getFormButtonClasses = (size: ButtonSize = 'md') => {
    return `${getButtonClasses.input(size)}`;
  };

  /**
   * Get responsive icon classes for buttons
   */
  const getButtonIconClasses = (size: ButtonSize = 'md') => {
    const iconSizeMap = {
      xs: iconClasses.small,
      sm: iconClasses.small,
      md: iconClasses.small,
      lg: iconClasses.medium,
      xl: iconClasses.medium,
    };
    return iconSizeMap[size];
  };

  return {
    getChatButtonClasses,
    getActionButtonClasses,
    getNavigationButtonClasses,
    getFormButtonClasses,
    getButtonIconClasses,
    getButtonClasses,
  };
}

export default useResponsiveButton;
