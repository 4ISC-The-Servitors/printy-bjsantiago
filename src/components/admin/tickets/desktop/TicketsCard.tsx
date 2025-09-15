import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Skeleton, Checkbox } from '../../../shared';
import { mockTickets } from '../../../../data/tickets';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { useTicketSelection } from '../../../../hooks/admin/SelectionContext';
import { createTicketSelectionItems } from '../../../../utils/admin/selectionUtils';
import { getTicketStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { MessageSquare, Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';

// variant derived by getTicketStatusBadgeVariant

const TicketsCard: React.FC = () => {
  const { openChatWithTopic, openChat, addSelected } = useAdmin();
  const ticketSelection = useTicketSelection();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Limit to max 5 tickets
  const displayTickets = mockTickets.slice(0, 5);
  const ticketItems = createTicketSelectionItems(displayTickets);

  const toggleTicketSelection = (ticketId: string) => {
    const ticketItem = ticketItems.find(item => item.id === ticketId);
    if (ticketItem) {
      ticketSelection.toggle(ticketItem);
    }
  };

  const addSelectedToChat = () => {
    const selectedIds = ticketSelection.selectedIds;
    if (selectedIds.length === 0) return;
    // Update selected chips bar
    selectedIds.forEach(id => addSelected({ id, label: id, type: 'ticket' }));
    openChatWithTopic?.('multiple-tickets', undefined, undefined, mockTickets, undefined, selectedIds);
    ticketSelection.clear();
    if (!openChatWithTopic) openChat();
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Card className="p-0">
          <div className="flex items-center justify-end px-3 py-2 sm:px-4">
            <Skeleton variant="rectangular" width="40px" height="20px" />
          </div>
          <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60"
              >
                <Skeleton variant="circular" width="16px" height="16px" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="text" width="100px" height="16px" />
                    <Skeleton variant="text" width="120px" height="16px" />
                  </div>
                  <Skeleton variant="text" width="80px" height="14px" />
                  <Skeleton variant="text" width="140px" height="16px" />
                  <Skeleton variant="rectangular" width="60px" height="20px" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" width="32px" height="32px" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-end px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs"></div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {displayTickets.map(t => (
            <div
              key={t.id}
              className="group p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
              onMouseEnter={() => setHoveredTicketId(t.id)}
              onMouseLeave={() => setHoveredTicketId(null)}
            >
              {/* Hover checkbox on left (match PortfolioCard behavior) */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                <Checkbox
                  checked={ticketSelection.isSelected(t.id)}
                  onCheckedChange={() => toggleTicketSelection(t.id)}
                  className={cn(
                    'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                    hoveredTicketId === t.id ||
                      ticketSelection.selectionCount > 0
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pl-6">
                {/* Left grid: Ticket ID, Subject, then Status below subject */}
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                    {t.id}
                  </div>
                  <div className="mt-1 text-sm sm:text-base lg:text-lg font-medium text-neutral-900 truncate">
                    {t.subject}
                  </div>
                  <div className="mt-2">
                    <Badge
                      size="sm"
                      variant={getTicketStatusBadgeVariant(t.status)}
                      className="text-xs sm:text-sm"
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>

                {/* Middle grid is removed per new spec; use spacer on md+ */}
                <div className="hidden md:block" />

                {/* Right grid: Requester and Date beside Chat button */}
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="min-w-0 text-right">
                    <div className="text-sm sm:text-base font-medium text-neutral-900 truncate">
                      {t.requester ?? '—'}
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-500 mt-1">
                      {t.date}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    threeD
                    aria-label={`Ask about ${t.id}`}
                    onClick={() => {
                      addSelected({ id: t.id, label: t.id, type: 'ticket' });
                      openChatWithTopic?.('tickets', t.id, undefined, mockTickets);
                      if (!openChatWithTopic) openChat();
                    }}
                    className="shrink-0 min-h-[40px] min-w-[40px]"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Add to Chat button (match Portfolio style) */}
      {ticketSelection.hasSelections && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
          >
            <Plus className="h-5 w-5" />
            Add to Chat ({ticketSelection.selectionCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketsCard;
