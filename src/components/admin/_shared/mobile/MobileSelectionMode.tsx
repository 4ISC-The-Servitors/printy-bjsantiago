import React from 'react';
import { Button, Text } from '../../../shared';
import { X, Plus } from 'lucide-react';

interface MobileSelectionModeProps {
  isActive: boolean;
  selectedCount: number;
  onExit: () => void;
  onAddToChat: () => void;
  entityType: 'orders' | 'tickets' | 'services';
}

const MobileSelectionMode: React.FC<MobileSelectionModeProps> = ({
  isActive,
  selectedCount,
  onExit,
  onAddToChat,
  entityType,
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-white rounded-full shadow-lg border px-4 py-2">
        <Button
          onClick={onExit}
          variant="ghost"
          size="sm"
          className="min-h-[40px] min-w-[40px] p-0"
        >
          <X className="w-4 h-4" />
        </Button>

        <Text variant="p" size="sm" color="muted">
          {selectedCount} {entityType} selected
        </Text>

        <Button
          onClick={onAddToChat}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 min-h-[40px] text-sm"
        >
          <Plus className="h-4 w-4" />
          Add to Chat
        </Button>
      </div>
    </div>
  );
};

export default MobileSelectionMode;
