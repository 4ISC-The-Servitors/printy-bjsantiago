// Admin tickets context using real Supabase data from inquiries table
import React, { createContext, useContext } from 'react';
import { useAdminTickets } from '@features/chat/hooks/admin/useAdminTickets';

// Import the AdminTicketRow type from useAdminTickets
import type { AdminTicketRow } from '@features/chat/hooks/admin/useAdminTickets';

interface TicketsContextValue {
  tickets: AdminTicketRow[];
  updateTicket: (ticketId: string, updates: Partial<AdminTicketRow>) => void;
  refreshTickets: () => void;
  loading: boolean;
  error: string | null;
}

const TicketsContext = createContext<TicketsContextValue | undefined>(
  undefined
);

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the useAdminTickets hook to fetch real data with real-time subscriptions
  const { tickets, loading, error, reload } = useAdminTickets({
    page: 1,
    pageSize: 100, // Load more tickets for the context
    useAdvancedFallbacks: true,
  });

  const updateTicket = (ticketId: string, updates: Partial<AdminTicketRow>) => {
    console.log('updateTicket called:', ticketId, updates);

    // Optimistic update would go here if we had access to setTickets
    // For now, we'll rely on the real-time subscription to update the UI
    // The actual database update is handled by the chat flows

    // Then refresh from database to ensure consistency
    reload();
  };

  const refreshTickets = () => {
    reload();
  };

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        updateTicket,
        refreshTickets,
        loading,
        error,
      }}
    >
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketsProvider');
  }
  return context;
};
