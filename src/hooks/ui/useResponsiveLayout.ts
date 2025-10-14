import { useMemo } from 'react';
import { useResponsiveClasses } from './useResponsiveClasses';
import { useResponsiveButton } from './useResponsiveButton';
import { useResponsiveBadge } from './useResponsiveBadge';

/**
 * Layout type variants
 */
export type LayoutType = 'card' | 'list' | 'grid' | 'sidebar' | 'modal';

/**
 * Card layout variants
 */
export type CardLayoutType = 'order' | 'ticket' | 'quote' | 'service' | 'generic';

/**
 * Hook that provides responsive layout classes for common admin components
 * Based on our successful OrderItem implementation
 */
export function useResponsiveLayout() {
  const { textClasses, spacingClasses } = useResponsiveClasses();
  const { getChatButtonClasses, getButtonIconClasses } = useResponsiveButton();
  const { getStatusBadgeClasses, getPriorityBadgeClasses } = useResponsiveBadge();

  const getCardLayout = useMemo(() => {
    return {
      // Base card container
      container: `${spacingClasses.container} rounded-lg border bg-white/60 hover:bg-white transition-colors`,
      
      // Row layouts with responsive gaps
      row: `flex items-center justify-between ${spacingClasses.gap} mb-2 sm:mb-3`,
      rowCompact: `flex items-center justify-between gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2`,
      rowSpacious: `flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-4`,
      
      // Element gaps within rows
      elementGap: 'gap-1 sm:gap-2 md:gap-3',
      elementGapCompact: 'gap-1 sm:gap-1.5',
      elementGapSpacious: 'gap-2 sm:gap-3 md:gap-4',
      
      // Text elements with responsive sizing
      orderId: `${textClasses.caption} font-semibold text-neutral-900 whitespace-nowrap`,
      productName: `${textClasses.caption} font-medium text-neutral-700 truncate`,
      serviceName: `${textClasses.body} font-medium text-neutral-900 truncate`,
      customerName: `${textClasses.body} font-medium text-neutral-900 truncate`,
      amount: `${textClasses.heading} font-semibold text-neutral-900`,
      price: `${textClasses.heading} font-semibold text-neutral-900`,
      dates: `${textClasses.caption} text-neutral-500`,
      metadata: `${textClasses.caption} text-neutral-500`,
      description: `${textClasses.caption} text-neutral-600 line-clamp-2`,
      
      // Layout sections
      leftSection: 'flex-1 min-w-0',
      rightSection: 'flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0',
      centerSection: 'flex-1 flex items-center justify-center',
      
      // Badge containers
      badgeContainer: 'flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0',
      
      // Action sections
      actionSection: 'flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0',
      chatButtonSection: 'flex justify-end mb-2 sm:mb-3'
    };
  }, [textClasses, spacingClasses]);

  const getOrderCardLayout = useMemo(() => {
    return {
      ...getCardLayout,
      
      // Order-specific elements
      statusBadge: getStatusBadgeClasses('standard'),
      urgentBadge: getPriorityBadgeClasses('standard'),
      // Chat button per device: mobile slightly wider; laptop/desktop scale up
      chatButton: 'h-7 px-3 text-xs sm:h-7 sm:px-2.5 sm:text-xs md:h-8 md:px-3 md:text-sm lg:h-9 lg:px-4 lg:text-base shrink-0',
      // Chat icon per device: small through laptop; slightly larger on desktop
      chatIcon: 'w-3 h-3 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4',
      
      // Order card structure
      structure: {
        row1: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row2: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row3: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6'
      }
    };
  }, [getCardLayout, getStatusBadgeClasses, getPriorityBadgeClasses, getChatButtonClasses, getButtonIconClasses]);

  const getTicketCardLayout = useMemo(() => {
    return {
      ...getCardLayout,
      
      // Ticket-specific elements
      statusBadge: getStatusBadgeClasses('standard'),
      priorityBadge: getPriorityBadgeClasses('compact'),
      chatButton: getChatButtonClasses('sm'),
      chatIcon: getButtonIconClasses('sm'),
      
      // Ticket card structure
      structure: {
        row1: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row2: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row3: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6'
      }
    };
  }, [getCardLayout, getStatusBadgeClasses, getPriorityBadgeClasses, getChatButtonClasses, getButtonIconClasses]);

  const getQuoteCardLayout = useMemo(() => {
    return {
      ...getCardLayout,
      
      // Quote-specific elements
      statusBadge: getStatusBadgeClasses('standard'),
      chatButton: getChatButtonClasses('sm'),
      chatIcon: getButtonIconClasses('sm'),
      
      // Quote card structure
      structure: {
        row1: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row2: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row3: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6'
      }
    };
  }, [getCardLayout, getStatusBadgeClasses, getChatButtonClasses, getButtonIconClasses]);

  const getServiceCardLayout = useMemo(() => {
    return {
      ...getCardLayout,
      
      // Service-specific elements
      categoryBadge: getStatusBadgeClasses('compact'),
      chatButton: getChatButtonClasses('sm'),
      chatIcon: getButtonIconClasses('sm'),
      
      // Service card structure
      structure: {
        row1: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row2: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-2 sm:mb-3',
        row3: 'flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6'
      }
    };
  }, [getCardLayout, getStatusBadgeClasses, getChatButtonClasses, getButtonIconClasses]);

  /**
   * Get layout classes for specific card types
   */
  const getLayoutClasses = (type: CardLayoutType) => {
    switch (type) {
      case 'order':
        return getOrderCardLayout;
      case 'ticket':
        return getTicketCardLayout;
      case 'quote':
        return getQuoteCardLayout;
      case 'service':
        return getServiceCardLayout;
      default:
        return getCardLayout;
    }
  };

  /**
   * Get responsive grid classes
   */
  const getGridClasses = useMemo(() => ({
    // Card grids
    cardGrid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6',
    cardGridCompact: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4',
    cardGridSpacious: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8',
    
    // List grids
    listGrid: 'grid grid-cols-1 gap-2 sm:gap-3',
    listGridCompact: 'grid grid-cols-1 gap-1 sm:gap-2',
    listGridSpacious: 'grid grid-cols-1 gap-3 sm:gap-4'
  }), []);

  /**
   * Get responsive container classes
   */
  const getContainerClasses = useMemo(() => ({
    // Page containers
    pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    contentContainer: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8',
    
    // Section containers
    sectionContainer: 'mb-6 sm:mb-8 md:mb-10 lg:mb-12',
    cardContainer: spacingClasses.container,
    
    // Modal containers
    modalContainer: 'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto',
    modalContainerLarge: 'max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto'
  }), [spacingClasses.container]);

  return {
    getLayoutClasses,
    getGridClasses,
    getContainerClasses,
    getCardLayout,
    getOrderCardLayout,
    getTicketCardLayout,
    getQuoteCardLayout,
    getServiceCardLayout
  };
}

export default useResponsiveLayout;
