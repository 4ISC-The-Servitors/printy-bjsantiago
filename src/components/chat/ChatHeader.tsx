import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Text } from '../shared';

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            threeD
            onClick={onBack}
            className="p-2 sm:h-11 sm:px-3 lg:h-12 lg:px-4"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
        <Text variant="h3" size="lg" weight="semibold" className="truncate">
          {title}
        </Text>
      </div>
    </div>
  );
};

export default ChatHeader;
