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


