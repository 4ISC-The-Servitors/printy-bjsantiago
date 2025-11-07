import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Returns the current breakpoint based on window width
 * - mobile: < 640px
 * - tablet: 640px - 1023px
 * - desktop: >= 1024px
 */
export function useBreakpoint(): Breakpoint {
  const getBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop';

    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) return 'desktop';

    const isTablet = window.matchMedia('(min-width: 640px)').matches;
    if (isTablet) return 'tablet';

    return 'mobile';
  };

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqDesktop = window.matchMedia('(min-width: 1024px)');
    const mqTablet = window.matchMedia('(min-width: 640px)');

    const handleChange = () => setBreakpoint(getBreakpoint());

    // Ensure the breakpoint is accurate on mount (especially after SSR)
    handleChange();

    mqDesktop.addEventListener('change', handleChange);
    mqTablet.addEventListener('change', handleChange);

    return () => {
      mqDesktop.removeEventListener('change', handleChange);
      mqTablet.removeEventListener('change', handleChange);
    };
  }, []);

  return breakpoint;
}

export default useBreakpoint;
