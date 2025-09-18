import React from 'react';
import { Button, Text } from '../../../shared';
import { X, Settings, LogOut } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  onSettingsClick,
  onLogoutClick,
}) => {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
          onClick={onClose}
          style={{ backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out w-64 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Text
              variant="h2"
              size="lg"
              weight="bold"
              className="text-gray-900"
            >
              Menu
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
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
            onClick={onSettingsClick}
          >
            <Settings className="h-5 w-5" />
            <Text variant="p" size="sm">
              Settings
            </Text>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-[44px] text-left text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogoutClick}
          >
            <LogOut className="h-5 w-5" />
            <Text variant="p" size="sm" className="text-red-600">
              Logout
            </Text>
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
