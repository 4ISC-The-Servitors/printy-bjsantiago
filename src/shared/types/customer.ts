export interface RecentOrder {
  id: string;
  displayId: string;
  title: string;
  status: string;
  total?: string;
  createdAt: number;
  updatedAt: number;
  paymentVerifiedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
}

export interface RecentTicket {
  id: string;
  displayId: string;
  subject: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

export interface RecentQuote {
  id: string;
  displayId: string;
  status: 'active' | 'spec_proposed' | 'accepted' | 'rejected' | 'ended';
  quotedPrice?: string;
  createdAt: number;
  updatedAt: number;
  endedAt?: number;
  acceptedAt?: number;
  rejectedAt?: number;
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
