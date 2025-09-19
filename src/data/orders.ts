// BACKEND_TODO: This mock data will be DELETED once Supabase `orders` table is wired.
// Replace all imports of `mockOrders` with live queries and realtime subscriptions.
export type Order = {
  id: string;
  customer: string;
  status:
    | 'Needs Quote'
    | 'Pending'
    | 'Processing'
    | 'Awaiting Payment'
    | 'Verifying Payment'
    | 'For Delivery/Pick-up'
    | 'Completed'
    | 'Cancelled';
  priority?: 'Urgent';
  total: string;
  date: string;
  // Prototype-only: proof of payment image (served from /public)
  proofOfPaymentUrl?: string;
  proofUploadedAt?: string;
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-12353',
    customer: 'Gabriel Santos',
    status: 'Processing',
    priority: 'Urgent', // Valued customer
    total: '₱15,000',
    date: 'May 2, 2025',
  },
  {
    id: 'ORD-12351',
    customer: 'Miguel Tan',
    status: 'Needs Quote',
    total: 'Awaiting Quote',
    date: 'May 1, 2025',
  },
  {
    id: 'ORD-12350',
    customer: 'Sophia Cruz',
    status: 'Verifying Payment',
    total: '₱1,200',
    date: 'May 30, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment_2.jpg',
    proofUploadedAt: 'September 20, 2025 11:30 AM',    
  },
  {
    id: 'ORD-12349',
    customer: 'Mark Dela Cruz',
    status: 'Verifying Payment',
    total: '₱7,400',
    date: 'Apr 28, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'September 19, 2025 10:30 AM',
  },
];
