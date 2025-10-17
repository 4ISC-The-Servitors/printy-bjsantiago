import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button, Text } from '@admin/components/shared';
import { MobileSidebarMenu } from '../sidebar';
import { BottomNavbar } from '../navigation';
import type { NavRoute } from '../navigation';

export interface MobileLayoutProps {
  children: React.ReactNode;
  chatOverlay?: React.ReactNode;
  onNavigate: (route: NavRoute) => void;
  onOpenChat: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onViewAllChats?: () => void;
}

/**
 * Mobile layout for admin
 * - Hamburger sidebar overlay (Recent Chats, Settings, Logout)
 * - Bottom navbar (Dashboard, Orders, Tickets, Portfolio, Printy)
 * - Main content area
 * - Chat overlay (full screen)
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  chatOverlay,
  onNavigate,
  onSettings,
  onLogout,
  onViewAllChats,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="h-10 w-10 p-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Text variant="h1" size="xl" weight="bold" className="text-neutral-900">
          Admin
        </Text>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-[88px]">
        {children}
      </main>

      {/* Bottom Navbar */}
      <BottomNavbar onNavigate={onNavigate} />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300">
            <MobileSidebarMenu
              onClose={() => setSidebarOpen(false)}
              onSettings={() => {
                setSidebarOpen(false);
                onSettings();
              }}
              onLogout={() => {
                setSidebarOpen(false);
                onLogout();
              }}
              onViewAllChats={onViewAllChats ? () => {
                setSidebarOpen(false);
                onViewAllChats();
              } : undefined}
            />
          </div>
        </>
      )}

      {/* Chat Overlay */}
      {chatOverlay}
    </div>
  );
};

export default MobileLayout;
