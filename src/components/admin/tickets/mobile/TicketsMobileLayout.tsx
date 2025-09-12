import React, { useState } from 'react';
import { Button, Card, Text, Badge, Checkbox } from '../../../shared';
import { cn } from '../../../../lib/utils';
import { Trash2, X, MessageCircle } from 'lucide-react';
import {
  MobileSidebar,
  MobileHeader,
  MobileCardMenu,
  MobileSelectionMode,
} from '../../_shared/mobile';

interface TicketItem {
  id: string;
  subject: string;
  time: string;
  status: 'Open' | 'Pending' | 'Closed';
}

// removed unused SelectedComponent

interface TicketsMobileLayoutProps {
  mockTickets: TicketItem[];
  selectedTickets: string[];
  setSelectedTickets: (tickets: string[]) => void;
  setHoveredTicket: (id: string | null) => void;
  handleTicketSelect: (ticketId: string) => void;
  addSelectedToChat: () => void;
  getStatusColor: (status: string) => string;
}

const TicketsMobileLayout: React.FC<TicketsMobileLayoutProps> = ({
  mockTickets,
  selectedTickets,
  setSelectedTickets,
  setHoveredTicket,
  handleTicketSelect,
  addSelectedToChat,
  getStatusColor,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);

  const hasSelectedItems = selectedTickets.length > 0;

  const handleViewInChat = () => {
    setActiveCardMenu(null);
  };

  const handleSelectMode = (ticketId: string) => {
    setIsSelectionMode(true);
    handleTicketSelect(ticketId);
    setActiveCardMenu(null);
  };

  const handleAddToChat = () => {
    addSelectedToChat();
    setIsSelectionMode(false);
    setSelectedTickets([]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSettingsClick={() => {
          // TODO: Navigate to settings
          setIsSidebarOpen(false);
        }}
        onLogoutClick={() => {
          // TODO: Handle logout
          setIsSidebarOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <MobileHeader
          title="Tickets"
          onMenuClick={() => setIsSidebarOpen(true)}
          rightContent={
            (selectedTickets.length > 0 || isSelectionMode) && (
              <div className="flex items-center gap-2">
                {selectedTickets.length > 0 && (
                  <Text variant="p" size="sm" color="muted">
                    {selectedTickets.length}
                  </Text>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTickets([]);
                    setIsSelectionMode(false);
                  }}
                  className="min-h-[44px] min-w-[44px]"
                >
                  {isSelectionMode ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          }
        />

        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <Card className="w-full">
                <div className="flex flex-row items-center justify-between space-y-0 pb-4 p-4">
                  <Text
                    variant="h3"
                    size="base"
                    weight="semibold"
                    className="text-gray-900"
                  >
                    All Tickets
                  </Text>
                  {(selectedTickets.length > 0 || isSelectionMode) && (
                    <div className="flex items-center gap-2">
                      {selectedTickets.length > 0 && (
                        <Text variant="p" size="sm" color="muted">
                          {selectedTickets.length}
                        </Text>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTickets([]);
                          setIsSelectionMode(false);
                        }}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        {isSelectionMode ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-3 px-4 pb-4">
                  {mockTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="relative flex items-center justify-between p-3 border border-gray-200 rounded-lg active:bg-gray-100 transition-colors min-h-[60px]"
                      onTouchStart={() => setHoveredTicket(ticket.id)}
                      onTouchEnd={() => setHoveredTicket(null)}
                    >
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                        <Checkbox
                          checked={selectedTickets.includes(ticket.id)}
                          onCheckedChange={() => handleTicketSelect(ticket.id)}
                          className={cn(
                            'transition-opacity bg-white border-2 border-gray-300 w-4 h-4 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                            selectedTickets.length > 0 || isSelectionMode
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-3 min-w-0 flex-1 pl-4">
                        <div className="min-w-0 flex-1">
                          <Text
                            variant="p"
                            size="xs"
                            color="muted"
                            className="truncate"
                          >
                            {ticket.id}
                          </Text>
                          <Text
                            variant="p"
                            size="sm"
                            weight="medium"
                            className="truncate"
                          >
                            {ticket.subject}
                          </Text>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={cn(
                                getStatusColor(ticket.status),
                                'text-xs'
                              )}
                              variant="secondary"
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
                        <div>
                          <Text variant="p" size="xs" color="muted">
                            {ticket.time}
                          </Text>
                        </div>
                        <MobileCardMenu
                          isOpen={activeCardMenu === ticket.id}
                          onToggle={() =>
                            setActiveCardMenu(
                              activeCardMenu === ticket.id ? null : ticket.id
                            )
                          }
                          actions={[
                            {
                              label: 'View in Chat',
                              onClick: () => handleViewInChat(ticket.id),
                              icon: <MessageCircle className="w-4 h-4" />,
                            },
                            {
                              label: 'Select',
                              onClick: () => handleSelectMode(ticket.id),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>

        <MobileSelectionMode
          isActive={hasSelectedItems && isSelectionMode}
          selectedCount={selectedTickets.length}
          onExit={() => {
            setIsSelectionMode(false);
            setSelectedTickets([]);
          }}
          onAddToChat={handleAddToChat}
          entityType="tickets"
        />
      </div>
    </div>
  );
};

export default TicketsMobileLayout;
