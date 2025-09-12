import React from 'react';
import { Button, Card, Text, Badge, Checkbox } from '../../../shared';
import { MessageCircle, Trash2, Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface TicketItem {
  id: string;
  subject: string;
  time: string;
  status: 'Open' | 'Pending' | 'Closed';
}

// removed unused SelectedComponent

interface TicketsDesktopLayoutProps {
  mockTickets: TicketItem[];
  selectedTickets: string[];
  hoveredTicket: string | null;
  setSelectedTickets: (tickets: string[]) => void;
  setHoveredTicket: (id: string | null) => void;
  handleTicketSelect: (ticketId: string) => void;
  addSelectedToChat: () => void;
  getStatusColor: (status: string) => string;
}

const TicketsDesktopLayout: React.FC<TicketsDesktopLayoutProps> = ({
  mockTickets,
  selectedTickets,
  hoveredTicket,
  setSelectedTickets,
  setHoveredTicket,
  handleTicketSelect,
  addSelectedToChat,
  getStatusColor,
}) => {
  const hasSelectedItems = selectedTickets.length > 0;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <Card className="w-full">
          <div className="flex flex-row items-center justify-between space-y-0 pb-6 p-8">
            <Text
              variant="h3"
              size="xl"
              weight="semibold"
              className="text-gray-900"
            >
              All Tickets
            </Text>
            {selectedTickets.length > 0 && (
              <div className="flex items-center gap-3">
                <Text variant="p" size="base" color="muted">
                  {selectedTickets.length} selected
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTickets([])}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-4 px-8 pb-8">
            {mockTickets.map(ticket => (
              <div
                key={ticket.id}
                className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
                onMouseEnter={() => setHoveredTicket(ticket.id)}
                onMouseLeave={() => setHoveredTicket(null)}
              >
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                  <Checkbox
                    checked={selectedTickets.includes(ticket.id)}
                    onCheckedChange={() => handleTicketSelect(ticket.id)}
                    className={cn(
                      'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                      hoveredTicket === ticket.id || selectedTickets.length > 0
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </div>

                <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
                  <div className="min-w-0 flex-1">
                    <Text
                      variant="p"
                      size="sm"
                      color="muted"
                      className="truncate"
                    >
                      {ticket.id}
                    </Text>
                    <Text
                      variant="p"
                      size="lg"
                      weight="medium"
                      className="truncate"
                    >
                      {ticket.subject}
                    </Text>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={cn(
                          getStatusColor(ticket.status),
                          'text-sm px-3 py-1'
                        )}
                        variant="secondary"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <Text variant="p" size="base" color="muted">
                    {ticket.time}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 min-h-[44px] min-w-[44px]"
                    title="View in Chat"
                    onClick={() => {
                      handleTicketSelect(ticket.id);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {hasSelectedItems && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={addSelectedToChat}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
            >
              <Plus className="h-5 w-5" />
              Add to Chat ({selectedTickets.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsDesktopLayout;
