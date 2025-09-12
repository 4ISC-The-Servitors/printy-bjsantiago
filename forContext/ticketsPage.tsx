'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TicketsMobileLayout from '@/components/tickets-mobile-layout';
import TicketsDesktopLayout from '@/components/tickets-desktop-layout';

interface TicketItem {
  id: string;
  title: string;
  date: string;
  status: 'Open' | 'Pending' | 'Closed';
}

interface SelectedComponent {
  id: string;
  name: string;
  type: 'order' | 'ticket';
}

const mockTickets: TicketItem[] = [
  {
    id: 'TCK-3052',
    title: 'Delivery schedule inquiry',
    date: 'Just now',
    status: 'Open',
  },
  {
    id: 'TCK-2981',
    title: 'Invoice correction',
    date: '1h ago',
    status: 'Pending',
  },
  {
    id: 'TCK-2970',
    title: 'Reprint request',
    date: '2h ago',
    status: 'Pending',
  },
  {
    id: 'TCK-2922',
    title: 'Packaging concern',
    date: 'Yesterday',
    status: 'Closed',
  },
];

export default function TicketsPage() {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
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

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const addSelectedToChat = () => {
    const newComponents: SelectedComponent[] = [];

    selectedTickets.forEach(ticketId => {
      const ticket = mockTickets.find(t => t.id === ticketId);
      if (ticket) {
        newComponents.push({
          id: ticket.id,
          name: ticket.id,
          type: 'ticket',
        });
      }
    });

    setSelectedComponents(prev => [...prev, ...newComponents]);
    setSelectedTickets([]);
    setIsChatOpen(true);
  };

  const removeSelectedComponent = (componentId: string) => {
    setSelectedComponents(prev => prev.filter(comp => comp.id !== componentId));
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
    router.push('/portfolio');
  };

  const commonProps = {
    mockTickets,
    selectedTickets,
    hoveredTicket,
    isChatOpen,
    isChatMinimized,
    selectedComponents,
    setSelectedTickets,
    setHoveredTicket,
    setIsChatOpen,
    setIsChatMinimized,
    handleTicketSelect,
    addSelectedToChat,
    removeSelectedComponent,
    getStatusColor,
    handlePortfolioNavigation,
  };

  return isMobile ? (
    <TicketsMobileLayout {...commonProps} />
  ) : (
    <TicketsDesktopLayout {...commonProps} />
  );
}
