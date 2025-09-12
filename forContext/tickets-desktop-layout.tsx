'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageCircle,
  Trash2,
  X,
  Minus,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SharedSidebar from './shared-sidebar';

interface TicketItem {
  id: string;
  title: string;
  date: string;
  status: 'Open' | 'Pending' | 'Closed';
}

interface SelectedComponent {
  id: string;
  name: string;
  type: 'order' | 'ticket';
}

interface TicketsDesktopLayoutProps {
  mockTickets: TicketItem[];
  selectedTickets: string[];
  hoveredTicket: string | null;
  isChatOpen: boolean;
  isChatMinimized: boolean;
  selectedComponents: SelectedComponent[];
  setSelectedTickets: (tickets: string[]) => void;
  setHoveredTicket: (id: string | null) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsChatMinimized: (minimized: boolean) => void;
  handleTicketSelect: (ticketId: string) => void;
  addSelectedToChat: () => void;
  removeSelectedComponent: (componentId: string) => void;
  getStatusColor: (status: string) => string;
}

export default function TicketsDesktopLayout({
  mockTickets,
  selectedTickets,
  hoveredTicket,
  isChatOpen,
  isChatMinimized,
  selectedComponents,
  setSelectedTickets,
  setHoveredTicket,
  setIsChatOpen,
  setIsChatMinimized,
  handleTicketSelect,
  addSelectedToChat,
  removeSelectedComponent,
  getStatusColor,
}: TicketsDesktopLayoutProps) {
  const hasSelectedItems = selectedTickets.length > 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <SharedSidebar />

      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Tickets
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="hover:bg-gray-100 min-h-[44px] min-w-[44px]"
              aria-label="Toggle chat"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-serif">
                  All Tickets
                </CardTitle>
                {selectedTickets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedTickets.length}
                    </span>
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
              </CardHeader>
              <CardContent className="space-y-4">
                {mockTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[60px]"
                    onMouseEnter={() => setHoveredTicket(ticket.id)}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={() => handleTicketSelect(ticket.id)}
                        className={cn(
                          'transition-opacity bg-white border-2 border-gray-300 w-4 h-4 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                          hoveredTicket === ticket.id ||
                            selectedTickets.length > 0
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-3 min-w-0 flex-1 pl-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-600 truncate">
                          {ticket.id}
                        </div>
                        <div className="font-medium text-base truncate">
                          {ticket.title}
                        </div>
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
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm text-gray-600">{ticket.date}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 min-h-[44px] min-w-[44px]"
                        title="View in Chat"
                        onClick={() => {
                          setIsChatOpen(true);
                          handleTicketSelect(ticket.id);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>

        {hasSelectedItems && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={addSelectedToChat}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-base"
            >
              <Plus className="h-4 w-4" />
              Add to Chat ({selectedTickets.length})
            </Button>
          </div>
        )}
      </div>

      {isChatOpen && (
        <div
          className={cn(
            'bg-white border-l border-gray-200 flex flex-col transition-all duration-300 z-40',
            'w-80 lg:w-96',
            isChatMinimized && 'h-12'
          )}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">Printy Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="min-h-[44px] min-w-[44px]"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isChatMinimized && (
            <>
              {selectedComponents.length > 0 && (
                <div className="p-4 border-b border-gray-200 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-800">
                        Selected Components
                      </span>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        {selectedComponents.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          selectedComponents.forEach(component =>
                            removeSelectedComponent(component.id)
                          );
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                        title="Remove All"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedComponents.map(component => (
                      <div
                        key={component.id}
                        className="flex items-center gap-1 bg-white border border-green-200 rounded px-2 py-1 text-sm min-h-[32px]"
                      >
                        <span className="truncate max-w-[100px]">
                          {component.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedComponent(component.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 min-h-[32px] min-w-[32px]"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                      <p className="text-sm leading-relaxed">
                        Hello! I'm Printy, your admin assistant. What would you
                        like to do with these tickets?
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="flex flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent min-h-[44px]"
                      >
                        Resolve Tickets
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent min-h-[44px]"
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  />
                  <Button size="sm" className="min-h-[44px] min-w-[44px]">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
