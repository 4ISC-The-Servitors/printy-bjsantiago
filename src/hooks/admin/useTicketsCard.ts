import { useState } from 'react';
import { useAdmin } from './AdminContext';
import { useAdminTickets } from '../../features/chat/admin/hooks/useAdminTickets';

type InquiryRecord = {
  inquiry_id: string;
  inquiry_type: string | null;
  inquiry_status: string | null;
  inquiry_message?: string | null;
  customer_id?: string | null;
  customer_full_name?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
};

export const useTicketsCard = () => {
  const { openChat, openChatWithTopic } = useAdmin();
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(
    new Set()
  );
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Use the enhanced useAdminTickets with advanced fallbacks and server-side pagination
  const { 
    tickets, 
    loading: isLoading, 
    error, 
    hasMore 
  } = useAdminTickets({ 
    page, 
    pageSize, 
    useAdvancedFallbacks: true 
  });

  const displayInquiries = tickets as unknown as InquiryRecord[];


  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const viewInChat = (ticketId: string) => {
    if (openChatWithTopic) {
      // Pass the actual inquiry records (displayInquiries) instead of mappedTickets
      // This ensures the chat flow has access to the full inquiry data from the database
      openChatWithTopic('tickets', ticketId, undefined, displayInquiries);
    } else {
      openChat();
    }
  };


  return {
    isLoading,
    error,
    displayInquiries,
    page,
    setPage,
    hasMore,
    hoveredTicketId,
    setHoveredTicketId,
    isSelected: (id: string) => selectedTickets.has(id),
    selectionCount: selectedTickets.size,
    toggleTicketSelection,
    viewInChat,
  };
};
