import React from 'react';
import { Text, Badge } from '../../shared';
import { formatLongDate } from '../../../utils/shared/dateFormatter';
import { formatShortTime } from '../../../utils/shared/timeFormatter';
import type { ChatMessage } from '../../chat/_shared/types';

interface ConversationItemProps {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
  status: 'active' | 'ended';
  onOpen: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ id, title, createdAt, status, onOpen }) => {
  const dateLabel = formatLongDate(createdAt);
  const timeLabel = formatShortTime(createdAt);
  return (
    <button
      onClick={() => onOpen(id)}
      className="w-full text-left rounded-lg border px-3 py-3 transition-colors bg-white border-neutral-200 hover:bg-neutral-50"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Text variant="h4" size="sm" weight="semibold" className="truncate">
              {title}
            </Text>
            <Badge variant={status === 'active' ? 'success' : 'error'} size="sm">
              {status === 'active' ? 'Active' : 'Ended'}
            </Badge>
          </div>
          <Text variant="p" size="xs" color="muted" className="mt-1">
            {dateLabel} • {timeLabel}
          </Text>
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;


