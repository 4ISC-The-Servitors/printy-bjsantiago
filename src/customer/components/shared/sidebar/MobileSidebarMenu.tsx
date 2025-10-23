import React from 'react';
import { MessageSquare, LogOut, Bot, X, User } from 'lucide-react';
import { Button, Text } from '@shared/components';

export interface CustomerMobileSidebarMenuProps {
  onClose: () => void;
  onViewAllChats?: () => void;
  onAccount: () => void;
  onLogout: () => void;
}

/**
 * Customer mobile sidebar menu overlay
 * - Mirrors admin mobile sidebar with customer actions
 * - Full-height panel with header, primary chat entry, and bottom actions
 */
const CustomerMobileSidebarMenu: React.FC<CustomerMobileSidebarMenuProps> = ({
  onClose,
  onViewAllChats,
  onAccount,
  onLogout,
}) => {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-primary text-white flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <Text
              variant="h3"
              size="lg"
              weight="bold"
              className="text-brand-primary"
            >
              Printy
            </Text>
            <Text variant="p" size="xs" color="muted">
              B.J. Santiago Inc.
            </Text>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 shrink-0"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Chats */}
      <div className="px-3 pt-2 shrink-0">
        {onViewAllChats && (
          <Button
            variant="ghost"
            onClick={onViewAllChats}
            className="w-full justify-start px-3 py-3 h-auto"
          >
            <MessageSquare className="w-5 h-5 mr-3 text-neutral-700" />
            <Text variant="p" size="base" weight="medium">
              Chats
            </Text>
          </Button>
        )}
      </div>

      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="p-3 pb-[72px] space-y-2">
        <Button
          variant="ghost"
          onClick={onAccount}
          className="w-full justify-start px-3 py-3 h-auto"
        >
          <User className="w-5 h-5 mr-3 text-neutral-700" />
          <Text variant="p" size="base" weight="medium">
            Account
          </Text>
        </Button>

        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start px-3 py-3 h-auto"
        >
          <LogOut className="w-5 h-5 mr-3 text-neutral-700" />
          <Text variant="p" size="base" weight="medium">
            Logout
          </Text>
        </Button>
      </div>
    </div>
  );
};

export default CustomerMobileSidebarMenu;
