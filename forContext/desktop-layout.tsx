'use client';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  X,
  Minus,
  ChevronRight,
  ShoppingCart,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SharedSidebar from './shared-sidebar';
import { useRouter } from 'next/navigation';

interface DesktopLayoutProps {
  isChatOpen: boolean;
  isChatMinimized: boolean;
  setIsChatOpen: (open: boolean) => void;
  setIsChatMinimized: (minimized: boolean) => void;
}

export default function DesktopLayout({
  isChatOpen,
  isChatMinimized,
  setIsChatOpen,
  setIsChatMinimized,
}: DesktopLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gray-50">
      <SharedSidebar />

      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-2xl font-serif font-bold text-gray-900">Admin</h1>
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
            <div className="text-center py-16">
              <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                Welcome to Admin Dashboard
              </h2>
              <p className="text-gray-600 mb-12 text-lg">
                Use the sidebar navigation to access Orders and Tickets
              </p>
              <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                <Button
                  onClick={() => router.push('/orders')}
                  className="flex flex-col items-center gap-4 h-32 text-lg"
                  size="lg"
                >
                  <ShoppingCart className="h-8 w-8" />
                  <span>Orders</span>
                </Button>
                <Button
                  onClick={() => router.push('/tickets')}
                  className="flex flex-col items-center gap-4 h-32 text-lg"
                  size="lg"
                >
                  <Ticket className="h-8 w-8" />
                  <span>Tickets</span>
                </Button>
              </div>
            </div>
          </div>
        </main>
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
              <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                      <p className="text-sm leading-relaxed">
                        Hello! I'm Printy, your admin assistant. What would you
                        like to do today?
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
