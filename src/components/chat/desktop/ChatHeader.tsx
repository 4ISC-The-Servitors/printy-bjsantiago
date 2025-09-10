import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, Text } from '../../shared';

interface ChatHeaderProps {
  title: string;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onBack }) => {
  return (
    <div className="px-6 py-4 border-b border-neutral-200 flex items-center gap-4">
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
    </div>
  );
};

export default ChatHeader;
