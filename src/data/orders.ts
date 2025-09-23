// BACKEND_TODO: This mock data will be DELETED once Supabase `orders` table is wired.
// Replace all imports of `mockOrders` with live queries and realtime subscriptions.
export type Order = {
  id: string;
  customer: string;
  status:
    | 'Needs Quote'
    | 'Awaiting Quote Approval'
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
    status: 'Awaiting Quote Approval',
    total: '₱5,000',
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
  {
    id: 'ORD-12348',
    customer: 'John Doe',
    status: 'Processing',
    total: '₱6,400',
    date: 'Apr 29, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'September 29, 2025 10:30 AM',
  },
  {
    id: 'ORD-12347',
    customer: 'Jane Smith',
    status: 'Awaiting Payment',
    total: '₱10,400',
    date: 'Apr 30, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'September 30, 2025 10:30 AM',
  },
  {
    id: 'ORD-12346',
    customer: 'Ethan Lim',
    status: 'For Delivery/Pick-up',
    total: '₱7,400',
    date: 'July 28, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'July 28, 2025 10:30 AM',
  },
  {
    id: 'ORD-12345',
    customer: 'Joulet Casquejo',
    status: 'Awaiting Payment',
    total: '₱7,400',
    date: 'June 28, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'June 28, 2025 10:30 AM',
  },
  {
    id: 'ORD-12344',
    customer: 'Rafael Tan',
    status: 'Completed',
    total: '₱5,500',
    date: 'March 28, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'March 28, 2025 10:30 AM',
  },
  {
    id: 'ORD-12343',
    customer: 'Joanne Joaquin',
    status: 'Cancelled',
    total: '₱7,400',
    date: 'January 30, 2025',
    // Prototype: dummy proof to render in admin verification chat
    proofOfPaymentUrl: '/test_payment.jpg',
    proofUploadedAt: 'January 30, 2025 10:30 AM',
  }
];
