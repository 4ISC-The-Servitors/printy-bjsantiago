import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockOrders } from '../../data/orders';
import OrdersMobileLayout from '../../components/admin/orders/mobile/OrdersMobileLayout';
import OrdersDesktopLayout from '../../components/admin/orders/desktop/OrdersDesktopLayout';
import { useAdmin } from './AdminContext';
import { useToast } from '../../components/shared';

const AdminOrders: React.FC = () => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { addSelected, openChat, selected } = useAdmin();
  const [, toast] = useToast();

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024); // Using lg breakpoint like existing code
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
    // Entity isolation: prevent mixing different entities in one add action
    const hasDifferentEntity = selected.some(s => s.type && s.type !== 'order');
    if (hasDifferentEntity) {
      toast.error(
        'Cannot mix entities',
        'You have non-Order items selected. Clear selection first.'
      );
      return;
    }
    selectedOrders.forEach(orderId => {
      const order = mockOrders.find(o => o.id === orderId);
      if (order) {
        addSelected({
          id: order.id,
          label: order.id,
          type: 'order',
        });
      }
    });
    setSelectedOrders([]);
    openChat();
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
    navigate('/admin/portfolio');
  };

  const commonProps = {
    mockOrders,
    selectedOrders,
    hoveredOrder,
    setSelectedOrders,
    setHoveredOrder,
    handleOrderSelect,
    addSelectedToChat,
    getStatusColor,
    handlePortfolioNavigation,
  };

  return isMobile ? (
    <OrdersMobileLayout {...commonProps} />
  ) : (
    <OrdersDesktopLayout />
  );
};

export default AdminOrders;
