import React from 'react';
import { Text } from '../shared';
import ActionCards from './ActionCards';
import RecentActivity from './RecentActivity';

interface TopicConfig {
  label: string;
  icon: React.ReactNode;
  flowId: string;
  description: string;
}

interface DashboardContentProps {
  topics: [string, TopicConfig][];
  recentOrder: {
    id: string;
    title: string;
    status: string;
    updatedAt: number;
  };
  recentTicket: {
    id: string;
    subject: string;
    status: string;
    updatedAt: number;
  };
  onTopicSelect: (key: string) => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  topics,
  recentOrder,
  recentTicket,
  onTopicSelect,
}) => {
  return (
    <div className="p-3 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center space-y-1 mb-4 lg:mb-8">
          <Text
            variant="h1"
            size="2xl"
            weight="bold"
            className="text-brand-primary lg:text-4xl"
          >
            How can I help you today?
          </Text>
          <Text variant="p" size="sm" color="muted" className="lg:text-base">
            Check recent activity or start a new chat
          </Text>
        </div>

        <RecentActivity recentOrder={recentOrder} recentTicket={recentTicket} />
        <ActionCards
          topics={topics}
          onTopicSelect={key => onTopicSelect(key)}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
