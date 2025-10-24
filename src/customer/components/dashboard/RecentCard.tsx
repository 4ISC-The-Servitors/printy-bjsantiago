import React, { useState } from 'react';
import { Card } from '@shared/components';
import { Package, Ticket, DollarSign } from 'lucide-react';

// Import the existing components
import RecentOrder from './recentOrders/RecentOrder';
import RecentTickets from './recentTickets/RecentTickets';
import RecentQuotes from './recentQuotes/RecentQuotes';

// Data types for the recent cards
type RecentCardType = 'order' | 'ticket' | 'quote';

interface RecentCardProps {
  // Data passed from parent
  onTopicSelect?: (topic: string) => void;
  // Optional data for each type
  orderData?: any;
  ticketData?: any;
  quoteData?: any;
}

/**
 * Recent Card Component
 *
 * Displays a single toggleable card that can show order, ticket, or quote information.
 * Features:
 * - Toggle between three card types (order, ticket, quote)
 * - Each card type shows its respective recent component
 * - Active tab is highlighted with brand primary color
 * - Compact toggle buttons to save space
 * - Responsive design that works on all screen sizes
 */
const RecentCard: React.FC<RecentCardProps> = ({
  orderData,
  ticketData,
  quoteData,
}) => {
  const [activeType, setActiveType] = useState<RecentCardType>('order');

  // Toggle button configuration
  const toggleOptions: Array<{
    type: RecentCardType;
    label: string;
    icon: React.ComponentType<any>;
  }> = [
    { type: 'order', label: 'Order', icon: Package },
    { type: 'ticket', label: 'Ticket', icon: Ticket },
    { type: 'quote', label: 'Quote', icon: DollarSign },
  ];

  const handleToggle = (type: RecentCardType) => {
    setActiveType(type);
  };

  // Render the appropriate recent component based on active type
  const renderRecentComponent = () => {
    switch (activeType) {
      case 'order':
        return <RecentOrder recentOrder={orderData} />;
      case 'ticket':
        return <RecentTickets recentTicket={ticketData} />;
      case 'quote':
        return <RecentQuotes recentQuote={quoteData} />;
      default:
        return <RecentOrder recentOrder={orderData} />;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-white border border-neutral-200 device-card-container">
      {/* Toggle Buttons */}
      <div className="flex items-center justify-between mb-4 p-2 bg-neutral-50 border-b border-neutral-200">
        <div className="flex gap-1">
          {toggleOptions.map(option => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => handleToggle(option.type)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${
                    activeType === option.type
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }
                `}
                aria-label={`Show ${option.label} card`}
                title={`Show ${option.label} card`}
              >
                <IconComponent size={16} />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-4">{renderRecentComponent()}</div>
    </Card>
  );
};

export default RecentCard;
