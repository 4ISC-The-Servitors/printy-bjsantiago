import React from 'react';

interface DashboardGridProps {
  // Single card that can toggle between order/ticket/quote
  recentCard?: React.ReactNode;
  chatCards: React.ReactNode;
  // Optional data for each card type
  orderData?: any;
  ticketData?: any;
  quoteData?: any;
}

/**
 * Responsive grid layout for customer dashboard
 *
 * Features:
 * - Single prominent Recent Card that can toggle between Order/Ticket/Quote views
 * - Chat cards positioned below to give breathing room and better UX
 * - Responsive layout that works on all screen sizes
 * - Touch-friendly spacing and interactions
 * - Improved visual hierarchy with proper spacing
 *
 * Layout Structure:
 *
 * **Desktop (lg+):**
 * ```
 * ┌─────────────────────────────┐
 * │  Recent Card (Toggleable)  │
 * │  (Large, Prominent)         │
 * ├─────────────────────────────┤
 * │                              │
 * │  Chat Cards                   │
 * │  (Grid Below Recent)           │
 * └─────────────────────────────┘
 * ```
 *
 * **Tablet (md):**
 * ```
 * ┌─────────────────┐
 * │  Recent Card    │
 * ├─────────────────┤
 * │  Chat Cards     │
 * └─────────────────┘
 * ```
 *
 * **Mobile (sm):**
 * ```
 * ┌─────────────────┐
 * │  Recent Card    │
 * ├─────────────────┤
 * │  Chat Cards     │
 * └─────────────────┘
 * ```
 *
 * Usage:
 * ```tsx
 * <DashboardGrid
 *   recentCard={
 *     <RecentCard
 *       orderData={orderData}
 *       ticketData={ticketData}
 *       quoteData={quoteData}
 *       onTopicSelect={handleTopicSelect}
 *     />
 *   }
 *   chatCards={<ChatCards onSelect={handleTopicSelect} />}
 * />
 * ```
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  recentCard,
  chatCards,
}) => {
  return (
    <div className="w-full">
      {/* Single Column Layout with Proper Spacing */}
      <div className="space-y-6 sm:space-y-8">
        {/* Recent Card Section - Large and Prominent */}
        {recentCard && (
          <div className="device-card-container">{recentCard}</div>
        )}

        {/* Chat Cards Section - Below recent card for breathing room */}
        {chatCards && <div className="device-card-container">{chatCards}</div>}
      </div>
    </div>
  );
};

export default DashboardGrid;
