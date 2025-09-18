// BACKEND_TODO: This mock data will be DELETED once Supabase `orders` table is wired.
// Replace all imports of `mockOrders` with live queries and realtime subscriptions.
export type Order = {
  id: string;
  customer: string;
  status:
    | 'Pending'
    | 'Processing'
    | 'Awaiting Payment'
    | 'For Delivery/Pick-up'
    | 'Completed'
    | 'Cancelled';
  priority?: 'Urgent';
  total: string;
  date: string;
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-12353',
    customer: 'Gabriel Santos',
    status: 'Processing',
    priority: 'Urgent', // Valued customer
    total: '₱15,000',
    date: 'May 2',
  },
  {
    id: 'ORD-12351',
    customer: 'Miguel Tan',
    status: 'Pending',
    total: 'TBD',
    date: 'May 1',
  },
  {
    id: 'ORD-12350',
    customer: 'Sophia Cruz',
    status: 'Awaiting Payment',
    total: '₱1,200',
    date: 'May 30',
  },
  {
    id: 'ORD-12349',
    customer: 'Mark Dela Cruz',
    status: 'Completed',
    total: '₱7,400',
    date: 'Apr 28',
  },
];
