import React from 'react';
import { Badge, Button, Text } from '../../shared';
import { MoreVertical, MessageSquare } from 'lucide-react';
import type { ConversationData } from '../../../features/api/quoteApi';
import { formatLongDate } from '../../../utils/shared/dateFormatter';

interface QuoteItemProps {
  quote: ConversationData;
  isSelected: boolean;
  isHovered: boolean;
  showCheckbox: boolean;
  openMenuId: string | null;
  onHover: (id: string | null) => void;
  onToggleSelection: (id: string) => void;
  onViewInChat: (id: string) => void;
  onToggleMenu: (id: string | null) => void;
}

const QuoteItem: React.FC<QuoteItemProps> = ({
  quote,
  isSelected,
  isHovered,
  showCheckbox,
  openMenuId,
  onHover,
  onToggleSelection,
  onViewInChat,
  onToggleMenu,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'spec_proposed':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'ended':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'spec_proposed':
        return 'Quote Sent';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        isHovered ? 'border-brand-primary shadow-sm' : 'border-neutral-200'
      } ${isSelected ? 'bg-brand-primary-50' : 'bg-white'}`}
      onMouseEnter={() => onHover(quote.conversation_id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Text variant="p" size="sm" weight="medium" className="text-neutral-600">
              Quote #{quote.quote_id ? quote.quote_id.slice(0, 8) : quote.conversation_id.slice(0, 8)}
            </Text>
            <Badge variant={getStatusVariant(quote.status)} size="sm">
              {getStatusText(quote.status)}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <Text variant="p" size="sm" className="text-neutral-500">
              Customer: {(quote as any).customer?.first_name ? 
                `${(quote as any).customer.first_name} ${(quote as any).customer.last_name}` : 
                quote.customer_id}
            </Text>
            <Text variant="p" size="sm" className="text-neutral-500">
              Language: {quote.language || 'Not detected'}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewInChat(quote.conversation_id)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleMenu(
              openMenuId === quote.conversation_id ? null : quote.conversation_id
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Text variant="p" size="xs" className="text-neutral-400">
          Updated: {formatLongDate(new Date(quote.updated_at).getTime())}
        </Text>
        
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(quote.conversation_id)}
            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
        )}
      </div>
    </div>
  );
};

export default QuoteItem;