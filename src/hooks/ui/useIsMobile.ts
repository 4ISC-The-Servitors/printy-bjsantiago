import { useDeviceUtils } from './useResponsiveClasses';

/**
 * Backwards-compatible alias using the centralized device utils
 * This avoids maintaining duplicate media query listeners.
 */
export function useIsMobile(): boolean {
  const { isMobileOrTablet } = useDeviceUtils();
  return isMobileOrTablet;
}

export default useIsMobile;
