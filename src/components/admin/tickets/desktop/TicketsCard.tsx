import React from 'react';
import { Card, Badge, Button } from '../../../shared';
import { mockTickets } from '../../../../data/tickets';
import { useAdmin } from '../../../../pages/admin/AdminContext';
import { useTicketSelection } from '../../../../hooks/admin/SelectionContext';
import { createTicketSelectionItems } from '../../../../utils/admin/selectionUtils';
import { getTicketStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { MessageSquare, Plus } from 'lucide-react';

// variant derived by getTicketStatusBadgeVariant

const TicketsCard: React.FC = () => {
  const { addSelected, openChat } = useAdmin();
  const ticketSelection = useTicketSelection();

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
    ticketSelection.selected.forEach(item => {
      addSelected({ id: item.id, label: item.label, type: 'ticket' });
    });
    ticketSelection.clear();
    openChat();
  };

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-end px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
            <Badge size="sm" variant="secondary">
              {displayTickets.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {displayTickets.map(t => (
            <div
              key={t.id}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
            >
              {/* Hover checkbox on left */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand-primary"
                  checked={ticketSelection.isSelected(t.id)}
                  onChange={() => toggleTicketSelection(t.id)}
                  title="Select ticket"
                />
              </div>

              <div className="flex w-full items-center justify-between gap-3 sm:gap-4">
                {/* Left section: identifiers + subject/status */}
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                      {t.id}
                    </span>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-neutral-900 text-pretty sm:hidden truncate">
                      {t.subject}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 sm:self-start">
                    {t.time}
                  </div>

                  <div className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-neutral-900 text-pretty truncate">
                    {t.subject}
                  </div>

                  <div className="flex justify-start sm:hidden">
                    <Badge
                      size="sm"
                      variant={getTicketStatusBadgeVariant(t.status)}
                      className="text-xs"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <div className="hidden sm:flex sm:items-center sm:gap-3">
                    <Badge
                      size="sm"
                      variant={getTicketStatusBadgeVariant(t.status)}
                      className="text-xs sm:text-sm"
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>

                {/* Right section: action aligned right */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Ask about ${t.id}`}
                    onClick={() => openChat()}
                    className="shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Add to Chat button */}
      {ticketSelection.hasSelections && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="primary"
            size="lg"
            threeD
            onClick={addSelectedToChat}
            className="shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Chat ({ticketSelection.selectionCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketsCard;
