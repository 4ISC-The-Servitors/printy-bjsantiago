// Admin Quotes page - AI-powered quote management with real-time subscriptions
import React from 'react';
import { QuotesCard } from '@components/admin';
import { QuotesProvider } from '../../hooks/admin/QuotesContext';

const AdminQuotes: React.FC = () => {
  return (
    <QuotesProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quote Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage AI-powered quote conversations and proposals
          </p>
        </div>
        <QuotesCard />
      </div>
    </QuotesProvider>
  );
};

export default AdminQuotes;
