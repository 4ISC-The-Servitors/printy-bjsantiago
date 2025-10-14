import { useMemo } from 'react';
import { useResponsiveClasses } from './useResponsiveClasses';

/**
 * Badge size variants
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Badge style variants
 */
export type BadgeStyle = 'compact' | 'standard' | 'spacious';

/**
 * Hook that provides responsive badge classes
 * Based on our successful OrderItem badge implementation
 */
export function useResponsiveBadge() {
  const { textClasses, badgeClasses } = useResponsiveClasses();

  const getBadgeClasses = useMemo(() => {
    return {
      // Compact badges - minimal padding, good for status indicators
      compact: (textSize: 'caption' | 'body' | 'heading' = 'caption') => ({
        text: `${textClasses[textSize]} ${badgeClasses.text}`,
        padding: 'px-1 py-0.5 sm:px-1.5 sm:py-0.5'
      }),
      
      // Standard badges - balanced padding, most common use
      standard: (textSize: 'caption' | 'body' | 'heading' = 'caption') => ({
        text: `${textClasses[textSize]} ${badgeClasses.text}`,
        padding: badgeClasses.padding
      }),
      
      // Spacious badges - generous padding, for prominent badges
      spacious: (textSize: 'caption' | 'body' | 'heading' = 'caption') => ({
        text: `${textClasses[textSize]} ${badgeClasses.text}`,
        padding: 'px-2 py-1 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2'
      })
    };
  }, [textClasses, badgeClasses]);

  /**
   * Get responsive badge classes for different use cases
   */
  const getStatusBadgeClasses = (style: BadgeStyle = 'standard') => {
    const badgeConfig = getBadgeClasses[style]('caption');
    return `${badgeConfig.text} ${badgeConfig.padding}`;
  };

  const getPriorityBadgeClasses = (style: BadgeStyle = 'standard') => {
    const badgeConfig = getBadgeClasses[style]('caption');
    return `${badgeConfig.text} ${badgeConfig.padding}`;
  };

  const getCategoryBadgeClasses = (style: BadgeStyle = 'standard') => {
    const badgeConfig = getBadgeClasses[style]('body');
    return `${badgeConfig.text} ${badgeConfig.padding}`;
  };

  const getNotificationBadgeClasses = (style: BadgeStyle = 'compact') => {
    const badgeConfig = getBadgeClasses[style]('caption');
    return `${badgeConfig.text} ${badgeConfig.padding}`;
  };

  return {
    getStatusBadgeClasses,
    getPriorityBadgeClasses,
    getCategoryBadgeClasses,
    getNotificationBadgeClasses,
    getBadgeClasses
  };
}

export default useResponsiveBadge;
