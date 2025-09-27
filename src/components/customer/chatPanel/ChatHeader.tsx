import React from 'react';
import { ArrowLeft, Minus, X } from 'lucide-react';
import { Button, Text } from '../../shared';

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onBack, onMinimize, onClose }) => {
  return (
    <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="ghost"
            size="md"
            threeD
            onClick={onBack}
            className="h-12 px-4"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Text variant="h2" size="xl" weight="semibold" className="truncate">
          {title}
        </Text>
      </div>
      <div className="flex items-center gap-1">
        {onMinimize && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="h-9 w-9 p-0 rounded-md"
            aria-label="Minimize chat"
          >
            <Minus className="w-4 h-4" />
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 rounded-md"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;


