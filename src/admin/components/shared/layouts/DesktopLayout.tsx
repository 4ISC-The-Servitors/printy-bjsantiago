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
  onSettings,
  onLogout,
  onViewAllChats,
}) => {
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Icon Sidebar */}
      <aside className="hidden lg:flex w-14 flex-col bg-white border-r border-neutral-200 sticky top-0 h-screen" style={{ zIndex: 99998 }}>
        <SidebarPanel
          onSettings={onSettings}
          onLogout={onLogout}
          onViewAllChats={onViewAllChats}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-20">
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navbar */}
      <BottomNavbar onNavigate={onNavigate} />

      {/* Chat Dock (right side, optional) */}
      {chatDock}
    </div>
  );
};

export default DesktopLayout;
