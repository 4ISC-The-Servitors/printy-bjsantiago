import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@shared/components';

export interface MobileSidebarTriggerProps {
  onOpen: () => void;
}

const MobileSidebarTrigger: React.FC<MobileSidebarTriggerProps> = ({
  onOpen,
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpen}
      className="h-10 w-10 p-0 rounded-full shadow-sm border bg-white"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
};

export default MobileSidebarTrigger;
