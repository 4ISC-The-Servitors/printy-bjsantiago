import React from 'react';
import { Text } from '../../../shared';
import type { ActionCardsProps } from '../_shared/types';

export const ActionCards: React.FC<ActionCardsProps> = ({
  topics,
  onTopicSelect,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      {topics.map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onTopicSelect(key as string)}
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1 text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-brand-accent-50 text-brand-accent flex items-center justify-center mb-4 group-hover:bg-brand-accent group-hover:text-white transition-colors">
            <div className="w-6 h-6 flex items-center justify-center">
              {cfg.icon}
            </div>
          </div>
          <Text variant="h3" size="xl" weight="semibold" className="mb-2">
            {cfg.label}
          </Text>
          <Text variant="p" size="sm" color="muted">
            {cfg.description}
          </Text>
        </button>
      ))}
    </div>
  );
};

export default ActionCards;
