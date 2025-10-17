import { useEffect, useMemo, useState } from 'react';

export interface PageSizeBreakpoints {
  phone: number; // < 640px
  tablet: number; // 640px - 1023px
  desktop: number; // >= 1024px
}

export interface DynamicPageSizeConfig {
  /** Item height in pixels (for each card/row) */
  itemHeight?: number;
  /** Additional spacing between items in pixels */
  itemSpacing?: number;
  /** Height reserved for header elements (navbar, filters, etc.) */
  headerOffset?: number;
  /** Height reserved for footer elements (pagination, etc.) */
  footerOffset?: number;
  /** Minimum number of items to display */
  minItems?: number;
  /** Maximum number of items to display */
  maxItems?: number;
  /** Static breakpoint-based page sizes (fallback when dynamic calculation is not possible) */
  breakpoints?: Partial<PageSizeBreakpoints>;
  /** Enable dynamic calculation based on viewport height */
  useDynamicCalculation?: boolean;
}

const defaultBreakpoints: PageSizeBreakpoints = {
  phone: 2,
  tablet: 4,
  desktop: 4,
};

const defaultDynamicConfig: Required<Omit<DynamicPageSizeConfig, 'breakpoints'>> = {
  itemHeight: 140, // Approximate height of an order card
  itemSpacing: 24, // space-y-6 = 24px
  headerOffset: 120, // Navbar + header
  footerOffset: 80, // Pagination height
  minItems: 2,
  maxItems: 20,
  useDynamicCalculation: false,
};

/**
 * Enhanced responsive page size hook that can dynamically calculate
 * the optimal number of items based on available viewport height
 */
export function useResponsivePageSize(
  config?: DynamicPageSizeConfig
) {
  const mergedConfig = useMemo(() => {
    const breakpoints = { ...defaultBreakpoints, ...(config?.breakpoints || {}) };
    return {
      ...defaultDynamicConfig,
      ...(config || {}),
      breakpoints,
    };
  }, [config]);

  const getStaticPageSize = () => {
    if (typeof window === 'undefined') return mergedConfig.breakpoints.phone;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) return mergedConfig.breakpoints.desktop;
    const isTablet = window.matchMedia('(min-width: 640px)').matches;
    if (isTablet) return mergedConfig.breakpoints.tablet;
    return mergedConfig.breakpoints.phone;
  };

  const getDynamicPageSize = () => {
    if (typeof window === 'undefined') return mergedConfig.minItems;

    // Calculate available height for items
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - mergedConfig.headerOffset - mergedConfig.footerOffset;

    // Calculate how many items can fit
    const itemTotalHeight = mergedConfig.itemHeight + mergedConfig.itemSpacing;
    const calculatedItems = Math.floor(availableHeight / itemTotalHeight);

    // Clamp between min and max
    return Math.max(
      mergedConfig.minItems,
      Math.min(mergedConfig.maxItems, calculatedItems)
    );
  };

  const calculatePageSize = () => {
    if (!mergedConfig.useDynamicCalculation) {
      return getStaticPageSize();
    }
    return getDynamicPageSize();
  };

  const [pageSize, setPageSize] = useState<number>(calculatePageSize);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleChange = () => {
      setPageSize(calculatePageSize());
    };

    // Listen to media query changes for static calculation
    const mqDesktop = window.matchMedia('(min-width: 1024px)');
    const mqTablet = window.matchMedia('(min-width: 640px)');

    if (mqDesktop.addEventListener) {
      mqDesktop.addEventListener('change', handleChange);
      mqTablet.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      (mqDesktop as any).addListener(handleChange);
      (mqTablet as any).addListener(handleChange);
    }

    // Listen to window resize for dynamic calculation
    if (mergedConfig.useDynamicCalculation) {
      window.addEventListener('resize', handleChange);

      // Recalculate on mount and after short delays to handle layout settling
      handleChange();
      const t1 = setTimeout(handleChange, 100);
      const t2 = setTimeout(handleChange, 300);

      return () => {
        window.removeEventListener('resize', handleChange);
        clearTimeout(t1);
        clearTimeout(t2);
        if (mqDesktop.removeEventListener) {
          mqDesktop.removeEventListener('change', handleChange);
          mqTablet.removeEventListener('change', handleChange);
        } else {
          (mqDesktop as any).removeListener(handleChange);
          (mqTablet as any).removeListener(handleChange);
        }
      };
    }

    return () => {
      if (mqDesktop.removeEventListener) {
        mqDesktop.removeEventListener('change', handleChange);
        mqTablet.removeEventListener('change', handleChange);
      } else {
        (mqDesktop as any).removeListener(handleChange);
        (mqTablet as any).removeListener(handleChange);
      }
    };
  }, [mergedConfig]);

  return pageSize;
}

export default useResponsivePageSize;
