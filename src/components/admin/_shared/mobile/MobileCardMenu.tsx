import React from 'react';
import { Button, Text } from '../../../shared';
import { MoreVertical } from 'lucide-react';

interface MenuAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface MobileCardMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  actions: MenuAction[];
  className?: string;
}

const MobileCardMenu: React.FC<MobileCardMenuProps> = ({
  isOpen,
  onToggle,
  actions,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="min-h-[44px] min-w-[44px]"
        aria-label="More options"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border p-2 space-y-1 min-w-[140px] z-50">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                action.onClick();
                onToggle();
              }}
              variant="ghost"
              size="sm"
              className={`w-full justify-start text-sm min-h-[40px] ${
                action.variant === 'destructive'
                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  : ''
              }`}
            >
              <Text variant="p" size="sm" weight="medium" className="text-neutral-700">
                {action.label}
              </Text>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileCardMenu;
