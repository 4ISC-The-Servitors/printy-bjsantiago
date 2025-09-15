import React from 'react';
import { Text } from '../../../shared';
import type { ActionCardsProps } from '../_shared/types';

export const ActionCards: React.FC<ActionCardsProps> = ({
  topics,
  onTopicSelect,
}) => {
  return (
    <div className="space-y-3">
      {topics.map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onTopicSelect(key as string)}
          className="w-full bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-200 text-left flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-accent-50 text-brand-accent flex items-center justify-center shrink-0">
            <div className="w-4 h-4 flex items-center justify-center">
              {cfg.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <Text variant="p" size="sm" weight="semibold" className="mb-0.5">
              {cfg.label}
            </Text>
            <Text variant="p" size="xs" color="muted" className="line-clamp-1">
              {cfg.description}
            </Text>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ActionCards;
