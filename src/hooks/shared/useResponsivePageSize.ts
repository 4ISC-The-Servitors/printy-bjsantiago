import { useEffect, useMemo, useState } from 'react';

export interface PageSizeBreakpoints {
  phone: number; // < 640px
  tablet: number; // 640px - 1023px
  desktop: number; // >= 1024px
}

const defaultBreakpoints: PageSizeBreakpoints = {
  phone: 2,
  tablet: 4,
  desktop: 4,
};

export function useResponsivePageSize(
  overrides?: Partial<PageSizeBreakpoints>
) {
  const config = useMemo(
    () => ({ ...defaultBreakpoints, ...(overrides || {}) }),
    [overrides]
  );

  const getPageSize = () => {
    if (typeof window === 'undefined') return config.phone;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) return config.desktop;
    const isTablet = window.matchMedia('(min-width: 640px)').matches;
    if (isTablet) return config.tablet;
    return config.phone;
  };

  const [pageSize, setPageSize] = useState<number>(getPageSize);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqDesktop = window.matchMedia('(min-width: 1024px)');
    const mqTablet = window.matchMedia('(min-width: 640px)');

    const handleChange = () => setPageSize(getPageSize());

    if (mqDesktop.addEventListener) {
      mqDesktop.addEventListener('change', handleChange);
      mqTablet.addEventListener('change', handleChange);
      return () => {
        mqDesktop.removeEventListener('change', handleChange);
        mqTablet.removeEventListener('change', handleChange);
      };
    } else {
      // Fallback for older browsers
      (mqDesktop as any).addListener(handleChange);
      (mqTablet as any).addListener(handleChange);
      return () => {
        (mqDesktop as any).removeListener(handleChange);
        (mqTablet as any).removeListener(handleChange);
      };
    }
  }, [config.phone, config.tablet, config.desktop]);

  return pageSize;
}

export default useResponsivePageSize;


