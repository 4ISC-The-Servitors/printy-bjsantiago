import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Text } from '../../shared';

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-3 bg-white sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            threeD
            onClick={onBack}
            className="h-10 w-10 p-0 flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
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
