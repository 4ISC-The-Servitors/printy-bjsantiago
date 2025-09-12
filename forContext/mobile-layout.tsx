'use client';

import { Button } from '@/components/ui/button';
import {
  X,
  ChevronRight,
  Menu,
  Settings,
  LogOut,
  MessageCircle,
  ShoppingCart,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { useRouter } from 'next/navigation';
import SharedBottomNav from '@/components/shared-bottom-nav';

interface MobileLayoutProps {
  isChatOpen: boolean;
  isChatMinimized: boolean;
  setIsChatOpen: (open: boolean) => void;
  setIsChatMinimized: (minimized: boolean) => void;
  handlePortfolioNavigation: () => void;
}

export default function MobileLayout({
  isChatOpen,
  isChatMinimized,
  setIsChatOpen,
  setIsChatMinimized,
  handlePortfolioNavigation,
}: MobileLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    if (path === '/portfolio') {
      handlePortfolioNavigation();
    } else {
      router.push(path);
    }
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
              Admin
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-12">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                  Welcome to Admin Dashboard
                </h2>
                <p className="text-gray-600 mb-8">
                  Use the navigation below to access Orders and Tickets
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <Button
                    onClick={() => router.push('/orders')}
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    <span>Orders</span>
                  </Button>
                  <Button
                    onClick={() => router.push('/tickets')}
                    className="flex flex-col items-center gap-2 h-20"
                  >
                    <Ticket className="h-6 w-6" />
                    <span>Tickets</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
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

          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <p className="text-sm leading-relaxed">
                    Hello! I'm Printy, your admin assistant. What would you like
                    to do today?
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
                    Manage Orders
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent min-h-[44px]"
                  >
                    Manage Services
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
