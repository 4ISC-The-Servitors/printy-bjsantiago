import React from 'react';
import { Button, Text } from '../../../shared';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  rightContent,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Text variant="h1" size="xl" weight="bold" className="text-gray-900">
          {title}
        </Text>
      </div>
      {rightContent && (
        <div className="flex items-center gap-2">{rightContent}</div>
      )}
    </header>
  );
};

export default MobileHeader;
