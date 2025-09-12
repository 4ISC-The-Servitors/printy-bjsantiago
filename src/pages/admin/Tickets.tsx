import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTickets } from '../../data/tickets';
import TicketsMobileLayout from '../../components/admin/tickets/mobile/TicketsMobileLayout';
import TicketsDesktopLayout from '../../components/admin/tickets/desktop/TicketsDesktopLayout';
import { useToast } from '../../components/shared';

const AdminTickets: React.FC = () => {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
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
    if (selectedTickets.length === 0) return;
    // For mobile only: keep UX feedback and clear selection; desktop handles chat inside its layout
    setSelectedTickets([]);
    toast.success('Added to chat', 'Selected tickets queued for chat');
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

  return isMobile ? (
    <TicketsMobileLayout
      mockTickets={mockTickets}
      selectedTickets={selectedTickets}
      setSelectedTickets={setSelectedTickets}
      setHoveredTicket={setHoveredTicket}
      handleTicketSelect={handleTicketSelect}
      addSelectedToChat={addSelectedToChat}
      getStatusColor={getStatusColor}
    />
  ) : (
    <TicketsDesktopLayout />
  );
};

export default AdminTickets;
