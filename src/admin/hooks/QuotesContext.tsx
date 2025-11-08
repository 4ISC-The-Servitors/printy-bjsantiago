// Admin quotes context using real Supabase data from quotes table
import React, { createContext, useContext } from 'react';
import { useAdminQuotes } from './useAdminQuotes';
import type { AdminQuoteRow } from './useAdminQuotes';

interface QuotesContextValue {
  quotes: AdminQuoteRow[];
  updateQuote: (
    conversationId: string,
    updates: Partial<AdminQuoteRow>
  ) => void;
  refreshQuotes: () => void;
  loading: boolean;
  error: string | null;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the useAdminQuotes hook to fetch real data with real-time subscriptions
  const { quotes, loading, error, refresh } = useAdminQuotes();

  const updateQuote = (_quoteId: string, _updates: Partial<AdminQuoteRow>) => {
    // Implementation with optimistic updates could go here
    // For now, we'll just refresh to ensure consistency with database
    refresh();
  };

  const refreshQuotes = () => {
    refresh();
  };

  return (
    <QuotesContext.Provider
      value={{
        quotes,
        updateQuote,
        refreshQuotes,
        loading,
        error,
      }}
    >
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};
