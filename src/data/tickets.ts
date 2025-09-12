export type Ticket = {
  id: string;
  subject: string;
  status: 'Open' | 'Pending' | 'Closed';
  time: string;
  description?: string;
  lastMessage?: string;
  requester?: string;
};

export const mockTickets: Ticket[] = [
  {
    id: 'TCK-3055',
    subject: 'Printing color mismatch on recent batch',
    description: 'Colors look dull on batch #8421 compared to proof. Please review and advise next steps.',
    requester: 'Customer',
    status: 'Open',
    time: 'Just now',
  },
  {
    id: 'TCK-3052',
    subject: 'Delivery schedule inquiry',
    status: 'Open',
    time: 'Just now',
  },
  {
    id: 'TCK-2981',
    subject: 'Invoice correction',
    status: 'Pending',
    time: '1h ago',
  },
  {
    id: 'TCK-2970',
    subject: 'Reprint request',
    status: 'Pending',
    time: '2h ago',
  },
  {
    id: 'TCK-2922',
    subject: 'Packaging concern',
    status: 'Closed',
    time: 'Yesterday',
  },
];
