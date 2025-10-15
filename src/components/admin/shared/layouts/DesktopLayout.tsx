import React from 'react';
import { SidebarPanel } from '../sidebar';
import { BottomNavbar } from '../navigation';
import type { NavRoute } from '../navigation';

export interface DesktopLayoutProps {
  children: React.ReactNode;
  chatDock?: React.ReactNode;
  onNavigate: (route: NavRoute) => void;
  onOpenChat: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onViewAllChats?: () => void;
}

/**
 * Desktop layout for admin
 * - Fixed narrow sidebar with icon navigation (Chats, Settings, Logout)
 * - Bottom navbar (Dashboard, Orders, Tickets, Portfolio, Printy)
 * - Main content area
 * - Optional chat dock on right
 */
export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  chatDock,
  onNavigate,
  onOpenChat,
  onSettings,
  onLogout,
  onViewAllChats,
}) => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Icon Sidebar */}
      <aside className="hidden lg:flex w-14 flex-col bg-white">
        <SidebarPanel
          onSettings={onSettings}
          onLogout={onLogout}
          onViewAllChats={onViewAllChats}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-[72px]">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navbar */}
      <BottomNavbar onNavigate={onNavigate} onOpenChat={onOpenChat} />

      {/* Chat Dock (right side, optional) */}
      {chatDock}
    </div>
  );
};

export default DesktopLayout;
