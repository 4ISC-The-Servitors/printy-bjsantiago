import React from 'react';
import { Text } from '../../../shared';
import ActionCards from './ActionCards';
import RecentActivity from './RecentActivity';
import type { DashboardContentProps } from '../_shared/types';

export const DashboardContent: React.FC<DashboardContentProps> = ({
  topics,
  recentOrder,
  recentTicket,
  onTopicSelect,
}) => {
  return (
    <div className="p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center space-y-1 mb-8">
          <Text
            variant="h1"
            size="4xl"
            weight="bold"
            className="text-brand-primary"
          >
            How can I help you today?
          </Text>
          <Text variant="p" size="base" color="muted">
            Check recent activity or start a new chat
          </Text>
        </div>

        <RecentActivity recentOrder={recentOrder} recentTicket={recentTicket} />
        <ActionCards topics={topics} onTopicSelect={onTopicSelect} />
      </div>
    </div>
  );
};

export default DashboardContent;
