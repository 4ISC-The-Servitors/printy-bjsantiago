import React from 'react';
import { Badge, Button, Checkbox } from '../../shared';
import { getTicketStatusBadgeVariant } from '../../../utils/admin/statusColors';
import { formatTicketStatus } from '../../../utils/shared/statusFormatter';
import { MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useIsMobile } from '../../../hooks/ui/useIsMobile';
import { MobileCardMenu } from '../mobile';

interface Ticket {
  inquiry_id: string;
  inquiry_type: string | null;
  inquiry_status: string | null;
  customer_full_name?: string | null;
}

interface TicketItemProps {
  ticket: Ticket;
  isSelected: boolean;
  isHovered: boolean;
  showCheckbox: boolean;
  openMenuId: string | null;
  onHover: (ticketId: string | null) => void;
  onToggleSelection: (ticketId: string) => void;
  onViewInChat: (ticketId: string) => void;
  onToggleMenu: (ticketId: string | null) => void;
}

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  isSelected,
  isHovered,
  showCheckbox,
  openMenuId,
  onHover,
  onToggleSelection,
  onViewInChat,
  onToggleMenu,
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className="group p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
      onMouseEnter={() => onHover(ticket.inquiry_id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Hover checkbox on left */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(ticket.inquiry_id)}
          className={cn(
            'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
            isHovered || showCheckbox ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pl-6">
        {/* Left grid: Ticket ID, Subject, then Status below subject */}
        <div className="min-w-0">
          <div className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
            {ticket.inquiry_id}
          </div>
          <div className="mt-1 text-sm sm:text-base lg:text-lg font-medium text-neutral-900 truncate">
            {ticket.inquiry_type || '—'}
          </div>
          <div className="mt-2">
            <Badge
              size="sm"
              variant={getTicketStatusBadgeVariant(ticket.inquiry_status || '')}
              className="text-xs sm:text-sm"
            >
              {formatTicketStatus(ticket.inquiry_status || '')}
            </Badge>
          </div>
        </div>

        {/* Middle grid spacer on md+ */}
        <div className="hidden md:block" />

        {/* Right grid: Requester and action */}
        <div className="flex items-center justify-between md:justify-end gap-4">
          <div className="min-w-0 text-right">
            <div className="text-sm sm:text-base font-medium text-neutral-900 truncate">
              {ticket.customer_full_name ?? '—'}
            </div>
          </div>

          {/* Desktop: Button, Mobile: Menu */}
          {isMobile ? (
            <MobileCardMenu
              isOpen={openMenuId === ticket.inquiry_id}
              onToggle={() =>
                onToggleMenu(
                  openMenuId === ticket.inquiry_id ? null : ticket.inquiry_id
                )
              }
              actions={[
                {
                  label: 'View in Chat',
                  onClick: () => onViewInChat(ticket.inquiry_id),
                },
                {
                  label: isSelected ? 'Unselect' : 'Select',
                  onClick: () => onToggleSelection(ticket.inquiry_id),
                },
              ]}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              threeD
              aria-label={`Ask about ${ticket.inquiry_id}`}
              onClick={() => onViewInChat(ticket.inquiry_id)}
              className="shrink-0 min-h-[40px] min-w-[40px]"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketItem;
