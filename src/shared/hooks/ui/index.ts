// UI-related hooks (responsive, formatting, interactions)
export { useBreakpoint } from './useBreakpoint';
export { useIsMobile } from './useIsMobile';
export { useResponsiveListItems } from './useResponsiveListItems';
export { useResponsivePageSize } from './useResponsivePageSize';
export { useSidebarCollapse } from './useSidebarCollapse';
export { useNotificationVisibility } from './useNotificationVisibility';
export { useResponsiveClasses, useDeviceUtils } from './useResponsiveClasses';
export { useResponsiveButton } from './useResponsiveButton';
export { useResponsiveLayout } from './useResponsiveLayout';
export { useResponsiveBadge } from './useResponsiveBadge';
export { useGenericSearchFilter } from './useGenericSearchFilter';

// Note: useResponsiveClasses is still available for legacy components but new code
// should prefer device-* CSS utility classes for better performance
