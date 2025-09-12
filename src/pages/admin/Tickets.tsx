import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTickets } from '../../data/tickets';
import TicketsMobileLayout from '../../components/admin/tickets/mobile/TicketsMobileLayout';
import TicketsDesktopLayout from '../../components/admin/tickets/desktop/TicketsDesktopLayout';
import { useAdmin } from './AdminContext';
import { useToast } from '../../components/shared';

const AdminTickets: React.FC = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
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

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const addSelectedToChat = () => {
    const hasDifferentEntity = selected.some(
      s => s.type && s.type !== 'ticket'
    );
    if (hasDifferentEntity) {
      toast.error(
        'Cannot mix entities',
        'You have non-Ticket items selected. Clear selection first.'
      );
      return;
    }
    selectedTickets.forEach(ticketId => {
      const ticket = mockTickets.find(t => t.id === ticketId);
      if (ticket) {
        addSelected({
          id: ticket.id,
          label: ticket.id,
          type: 'ticket',
        });
      }
    });
    setSelectedTickets([]);
    openChat();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePortfolioNavigation = () => {
    navigate('/admin/portfolio');
  };

  const commonProps = {
    mockTickets,
    selectedTickets,
    hoveredTicket,
    setSelectedTickets,
    setHoveredTicket,
    handleTicketSelect,
    addSelectedToChat,
    getStatusColor,
    handlePortfolioNavigation,
  };

  return isMobile ? (
    <TicketsMobileLayout {...commonProps} />
  ) : (
    <TicketsDesktopLayout {...commonProps} />
  );
};

export default AdminTickets;
