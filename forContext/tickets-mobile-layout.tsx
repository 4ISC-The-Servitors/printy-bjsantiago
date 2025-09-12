'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Trash2,
  X,
  ChevronRight,
  Plus,
  Settings,
  LogOut,
  Menu,
  MessageCircle,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { useRouter } from 'next/navigation';
import SharedBottomNav from '@/components/shared-bottom-nav';

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

interface TicketsMobileLayoutProps {
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
  handlePortfolioNavigation: () => void;
}

export default function TicketsMobileLayout({
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
  handlePortfolioNavigation,
}: TicketsMobileLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [activeCardMenu, setActiveCardMenu] = React.useState<string | null>(
    null
  );
  const router = useRouter();

  const hasSelectedItems = selectedTickets.length > 0;

  const handleNavigation = (path: string) => {
    if (path === '/portfolio') {
      handlePortfolioNavigation();
    } else {
      router.push(path);
    }
  };

  const handleViewInChat = (ticketId: string) => {
    setIsChatOpen(true);
    setActiveCardMenu(null);
  };

  const handleSelectMode = (ticketId: string) => {
    setIsSelectionMode(true);
    handleTicketSelect(ticketId);
    setActiveCardMenu(null);
  };

  const handleAddToChat = () => {
    addSelectedToChat();
    setIsChatOpen(true);
    setIsSelectionMode(false);
    setSelectedTickets([]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
          style={{ backdropFilter: 'blur(4px)' }}
        />
      )}

      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out w-64 shadow-xl',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-[44px] text-left"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-[44px] text-left text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-serif font-bold text-gray-900">
              Tickets
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-base font-serif">
                    All Tickets
                  </CardTitle>
                  {(selectedTickets.length > 0 || isSelectionMode) && (
                    <div className="flex items-center gap-2">
                      {selectedTickets.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {selectedTickets.length}
                        </span>
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
                </CardHeader>
                <CardContent className="space-y-3">
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
                          <div className="text-xs text-gray-600 truncate">
                            {ticket.id}
                          </div>
                          <div className="font-medium text-sm truncate">
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
                      <div className="text-right flex-shrink-0 ml-2 flex items-center gap-2">
                        <div>
                          <div className="text-xs text-gray-600">
                            {ticket.date}
                          </div>
                        </div>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setActiveCardMenu(
                                activeCardMenu === ticket.id ? null : ticket.id
                              )
                            }
                            className="min-h-[44px] min-w-[44px]"
                            aria-label="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {activeCardMenu === ticket.id && (
                            <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border p-2 space-y-1 min-w-[140px] z-50">
                              <Button
                                onClick={() => handleViewInChat(ticket.id)}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm min-h-[40px]"
                              >
                                View in Chat
                              </Button>
                              <Button
                                onClick={() => handleSelectMode(ticket.id)}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm min-h-[40px]"
                              >
                                Select
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {hasSelectedItems && isSelectionMode && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={handleAddToChat}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
            >
              <Plus className="h-4 w-4" />
              Add to Chat ({selectedTickets.length})
            </Button>
          </div>
        )}
      </div>

      <SharedBottomNav
        onNavigate={handleNavigation}
        onChatToggle={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {isChatOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">Printy Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="min-h-[44px] min-w-[44px]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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
                    Hello! I'm Printy, your admin assistant. What would you like
                    to do with these tickets?
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="flex flex-col gap-2 w-full max-w-xs">
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
        </div>
      )}
    </div>
  );
}
