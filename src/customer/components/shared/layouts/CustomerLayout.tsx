import React from 'react';

export interface CustomerLayoutProps {
  children: React.ReactNode;
}

/**
 * Customer layout wrapper that provides consistent notification bell
 * across all customer pages
 */
export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  return (
    <div className="relative" style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
};

export default CustomerLayout;
