'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrdersMobileLayout from '@/components/orders-mobile-layout';
import OrdersDesktopLayout from '@/components/orders-desktop-layout';

interface Order {
  id: string;
  customer: string;
  amount: string;
  date: string;
  status: 'Urgent' | 'Pending' | 'Processing' | 'Completed';
}

interface SelectedComponent {
  id: string;
  name: string;
  type: 'order' | 'ticket';
}

const mockOrders: Order[] = [
  {
    id: 'ORD-12353',
    customer: 'Gabriel Santos',
    amount: '₱15,000',
    date: 'May 2',
    status: 'Urgent',
  },
  {
    id: 'ORD-12351',
    customer: 'Miguel Tan',
    amount: '₱3,800',
    date: 'May 1',
    status: 'Pending',
  },
  {
    id: 'ORD-12350',
    customer: 'Sophia Cruz',
    amount: '₱1,200',
    date: 'May 30',
    status: 'Processing',
  },
  {
    id: 'ORD-12349',
    customer: 'Mark Dela Cruz',
    amount: '₱7,400',
    date: 'Apr 28',
    status: 'Completed',
  },
];

export default function OrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<
    SelectedComponent[]
  >([]);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const addSelectedToChat = () => {
    const newComponents: SelectedComponent[] = [];

    selectedOrders.forEach(orderId => {
      const order = mockOrders.find(o => o.id === orderId);
      if (order) {
        newComponents.push({
          id: order.id,
          name: order.id,
          type: 'order',
        });
      }
    });

    setSelectedComponents(prev => [...prev, ...newComponents]);
    setSelectedOrders([]);
    setIsChatOpen(true);
  };

  const removeSelectedComponent = (componentId: string) => {
    setSelectedComponents(prev => prev.filter(comp => comp.id !== componentId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePortfolioNavigation = () => {
    router.push('/portfolio');
  };

  const commonProps = {
    mockOrders,
    selectedOrders,
    hoveredOrder,
    isChatOpen,
    isChatMinimized,
    selectedComponents,
    setSelectedOrders,
    setHoveredOrder,
    setIsChatOpen,
    setIsChatMinimized,
    handleOrderSelect,
    addSelectedToChat,
    removeSelectedComponent,
    getStatusColor,
    handlePortfolioNavigation,
  };

  return isMobile ? (
    <OrdersMobileLayout {...commonProps} />
  ) : (
    <OrdersDesktopLayout {...commonProps} />
  );
}
