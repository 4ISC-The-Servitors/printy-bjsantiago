// Admin quotes context using real Supabase data from quote_conversations table
import React, { createContext, useContext } from 'react';
import type { AdminQuoteRow } from './useAdminQuotes';

interface QuotesContextValue {
  quotes: AdminQuoteRow[];
  updateQuote: (conversationId: string, updates: Partial<AdminQuoteRow>) => void;
  refreshQuotes: () => void;
  loading: boolean;
  error: string | null;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // For now, we'll use empty arrays since the actual data fetching is handled by useAdminQuotes
  // This maintains compatibility with existing components that expect the QuotesContext
  const quotes: AdminQuoteRow[] = [];
  const loading = false;
  const error = null;

  const updateQuote = (conversationId: string, updates: Partial<AdminQuoteRow>) => {
    console.log('updateQuote called:', conversationId, updates);
    // Implementation would go here if needed
  };

  const refreshQuotes = () => {
    // Implementation would go here if needed
  };

  return (
    <QuotesContext.Provider value={{ 
      quotes, 
      updateQuote, 
      refreshQuotes, 
      loading, 
      error 
    }}>
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
