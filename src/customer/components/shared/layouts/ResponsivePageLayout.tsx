import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPanel from '../sidebar/SidebarPanel';
import LogoutButton from '../sidebar/LogoutButton';
import LogoutModal from '../sidebar/LogoutModal';
import MobileSidebarMenu from '../sidebar/MobileSidebarMenu';
import MobileSidebarTrigger from '../sidebar/MobileSidebarTrigger';
import {
  useRecentChatSessions,
  type ConversationLike,
} from '@customer/hooks/useRecentChatSessions';
import { useLogoutWithToast } from '@auth/hooks/useLogoutWithToast';

interface ResponsivePageLayoutProps {
  showSidebar?: boolean; // Default: true
  sidebarContent?: React.ReactNode; // Custom sidebar content
  children: React.ReactNode;
  headerContent?: React.ReactNode; // Mobile header content (e.g., page title)
  maxWidth?: 'full' | 'xl' | '2xl' | '6xl'; // Default: '6xl'
}

/**
 * Unified responsive page layout for all customer pages
 *
 * Features:
 * - Desktop (>= lg): Persistent sidebar with recent chats (256px)
 * - Mobile/Tablet (< lg): Collapsible overlay sidebar with burger menu
 * - Manages sidebar state and recent chats
 * - Consistent background and spacing
 *
 * Usage:
 * ```tsx
 * <ResponsivePageLayout>
 *   <YourPageContent />
 * </ResponsivePageLayout>
 * ```
 */
const ResponsivePageLayout: React.FC<ResponsivePageLayoutProps> = ({
  showSidebar = true,
  sidebarContent,
  children,
  headerContent,
  maxWidth = '6xl',
}) => {
  const navigate = useNavigate();
  const { logout } = useLogoutWithToast();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [conversations, setConversations] = useState<ConversationLike[]>([]);

  // Load recent chat sessions for sidebar
  useRecentChatSessions(setConversations);

  const handleSwitchConversation = (id: string) => {
    setIsMobileSidebarOpen(false);
    window.dispatchEvent(
      new CustomEvent('customer-open-session', {
        detail: { sessionId: id },
      })
    );
    navigate('/customer');
  };

  const handleNavigateToAccount = () => {
    setIsMobileSidebarOpen(false);
    navigate('/customer/account');
  };

  const handleLogout = () => {
    setIsMobileSidebarOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout('/auth/signin');
  };

  // Default sidebar content with recent chats
  const defaultSidebarContent = (
    <SidebarPanel
      conversations={conversations}
      activeId={null}
      onSwitchConversation={handleSwitchConversation}
      onNavigateToAccount={handleNavigateToAccount}
      bottomActions={<LogoutButton onClick={handleLogout} />}
    />
  );

  const finalSidebarContent = sidebarContent || defaultSidebarContent;

  // Max width classes
  const maxWidthClass = {
    full: 'max-w-full',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '6xl': 'max-w-6xl',
  }[maxWidth];

  return (
    <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
      {/* Desktop Sidebar (>= lg) */}
      {showSidebar && (
        <aside className="hidden lg:flex w-64 xl:w-80 bg-white border-r border-neutral-200 flex-col">
          {finalSidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar Overlay (< lg) */}
      {showSidebar && isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-40 animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar Panel */}
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 animate-slide-in-left">
            <MobileSidebarMenu
              conversations={conversations}
              activeId={null}
              onClose={() => setIsMobileSidebarOpen(false)}
              onSwitchConversation={handleSwitchConversation}
              onAccount={handleNavigateToAccount}
              onLogout={handleLogout}
            />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Burger Menu (< lg) */}
        {showSidebar && (
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-4">
            <MobileSidebarTrigger onOpen={() => setIsMobileSidebarOpen(true)} />
            {headerContent && <div className="flex-1">{headerContent}</div>}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={`p-4 sm:p-6 lg:p-8 mx-auto w-full ${maxWidthClass} device-container space-y-6`}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default ResponsivePageLayout;
