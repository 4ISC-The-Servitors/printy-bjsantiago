import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@shared/components';
import { SimpleLoading } from '@shared/components/ui/SimpleLoading';
import { Package, Ticket, FileText } from 'lucide-react';

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
  // Loading states for each type
  loadingOrder?: boolean;
  loadingTicket?: boolean;
  loadingQuote?: boolean;
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
  loadingOrder = false,
  loadingTicket = false,
  loadingQuote = false,
}) => {
  // Compute which types actually have recent data or are loading
  const availableOptions: Array<{
    type: RecentCardType;
    label: string;
    icon: React.ComponentType<any>;
  }> = useMemo(() => {
    const options: Array<{
      type: RecentCardType;
      label: string;
      icon: React.ComponentType<any>;
    }> = [];
    if (orderData || loadingOrder)
      options.push({ type: 'order', label: 'Order', icon: Package });
    if (ticketData || loadingTicket)
      options.push({ type: 'ticket', label: 'Ticket', icon: Ticket });
    if (quoteData || loadingQuote)
      options.push({ type: 'quote', label: 'Quote', icon: FileText });
    return options;
  }, [
    orderData,
    ticketData,
    quoteData,
    loadingOrder,
    loadingTicket,
    loadingQuote,
  ]);

  // Default active type to the first available option
  const [activeType, setActiveType] = useState<RecentCardType>(
    availableOptions[0]?.type ?? 'order'
  );

  // Keep active type in sync when availability changes
  useEffect(() => {
    if (!availableOptions.find(o => o.type === activeType)) {
      if (availableOptions[0]) {
        setActiveType(availableOptions[0].type);
      }
    }
  }, [availableOptions, activeType]);

  const handleToggle = (type: RecentCardType) => {
    setActiveType(type);
  };

  // Render the appropriate recent component based on active type
  const renderRecentComponent = () => {
    switch (activeType) {
      case 'order':
        if (loadingOrder) return <SimpleLoading text="Loading order..." />;
        return <RecentOrder recentOrder={orderData} />;
      case 'ticket':
        if (loadingTicket) return <SimpleLoading text="Loading ticket..." />;
        return <RecentTickets recentTicket={ticketData} />;
      case 'quote':
        if (loadingQuote) return <SimpleLoading text="Loading quote..." />;
        return <RecentQuotes recentQuote={quoteData} />;
      default:
        if (loadingOrder) return <SimpleLoading text="Loading order..." />;
        return <RecentOrder recentOrder={orderData} />;
    }
  };

  // If nothing is available, do not render this card at all
  if (availableOptions.length === 0) return null;

  return (
    <Card className="relative overflow-hidden bg-white border border-neutral-200 device-card-container">
      {/* Toggle Buttons */}
      <div className="flex items-center justify-between mb-4 p-2 bg-neutral-50 border-b border-neutral-200">
        <div className="flex gap-1">
          {availableOptions.map(option => {
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
