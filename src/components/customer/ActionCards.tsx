import React from 'react';
import { Text } from '../shared';

interface ActionCardConfig {
  label: string;
  icon: React.ReactNode;
  flowId: string;
  description: string;
}

interface ActionCardsProps {
  topics: [string, ActionCardConfig][];
  onTopicSelect: (key: string) => void;
}

export const ActionCards: React.FC<ActionCardsProps> = ({
  topics,
  onTopicSelect,
}) => {
  return (
    <>
      {/* Action Cards for Mobile - Single Column */}
      <div className="space-y-3 lg:hidden">
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
              <Text
                variant="p"
                size="xs"
                color="muted"
                className="line-clamp-1"
              >
                {cfg.description}
              </Text>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop Layout - Preserved */}
      <div className="hidden lg:block">
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
      </div>
    </>
  );
};

export default ActionCards;
