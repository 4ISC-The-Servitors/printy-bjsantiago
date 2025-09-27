export interface RecentOrder {
  id: string;
  title: string;
  status: string;
  updatedAt: number;
  total?: string;
}

export interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  updatedAt: number;
}

export interface RecentActivityProps {
  recentOrder: RecentOrder;
  recentTicket: RecentTicket;
}


// Dashboard action cards and content types (migrated from customer/dashboard/_shared/types.ts)
export interface ActionCardConfig {
  label: string;
  icon: React.ReactNode;
  flowId: string;
  description: string;
}

export interface ActionCardsProps {
  topics: [string, ActionCardConfig][];
  onTopicSelect: (key: string) => void;
}

export interface DashboardContentProps {
  topics: [string, ActionCardConfig][];
  recentOrder: RecentOrder | null;
  recentTicket: RecentTicket | null;
  onTopicSelect: (key: string) => void;
}

