import React from 'react';
import { Notification } from '@shared/components';

export interface CustomerLayoutProps {
  children: React.ReactNode;
}

/**
 * Customer layout wrapper that provides consistent notification bell
 * across all customer pages
 */
export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  return (
    <>
      {/* Notification Bell - Fixed Position for all customer pages */}
      <Notification />
      {children}
    </>
  );
};

export default CustomerLayout;
