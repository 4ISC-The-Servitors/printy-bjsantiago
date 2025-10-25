import React from 'react';
import ChatHistory from '@customer/components/dashboard/chatHistory/ChatHistory';
import { CustomerConversationsProvider } from '@features/chat/hooks/customer/CustomerConversationsProvider';

const CustomerChatHistory: React.FC = () => {
  return (
    <CustomerConversationsProvider>
      <ChatHistory />
    </CustomerConversationsProvider>
  );
};

export default CustomerChatHistory;
