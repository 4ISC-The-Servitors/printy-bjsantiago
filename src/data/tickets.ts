// BACKEND_TODO: This mock data will be DELETED once Supabase `tickets` table is wired.
// Replace all imports of `mockTickets` with live queries and realtime subscriptions.
export type Ticket = {
  id: string;
  subject: string;
  status: 'Open' | 'Pending' | 'Closed';
  date: string;
  description?: string;
  lastMessage?: string;
  requester?: string;
};

export const mockTickets: Ticket[] = [
  {
    id: 'TCK-3055',
    subject: 'Printing color mismatch on recent batch',
    description:
      'Colors look dull on batch #8421 compared to proof. Please review and advise next steps.',
    requester: 'Jorrel De Ocampo',
    status: 'Open',
    date: 'May 30',
  },
  {
    id: 'TCK-3052',
    subject: 'Delivery schedule inquiry',
    requester: 'Andrea Salazar',
    status: 'Open',
    date: 'May 25',
  },
  {
    id: 'TCK-2981',
    subject: 'Invoice correction',
    requester: 'Ian De Jesus',
    status: 'Pending',
    date: 'May 14',
  },
  {
    id: 'TCK-2970',
    subject: 'Reprint request',
    requester: 'Liam Vitug',
    status: 'Closed',
    date: 'May 10',
  },
];
