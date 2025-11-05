import React from 'react';
import ServicesOffered from './ServicesOffered';
import PlaceAnOrder from './PlaceAnOrder';
import AskAssistance from './AskAssistance';
import AskQuote from './AskQuote';
import AboutUs from './AboutUs';
import FAQs from './FAQs';
import { useAuth } from '@/auth/hooks/AuthContext';

export interface ChatCardsProps {
  onSelect: (key: string) => void;
}

const ChatCards: React.FC<ChatCardsProps> = ({ onSelect }) => {
  const { role } = useAuth();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-4 lg:gap-5">
      <ServicesOffered onClick={() => onSelect('servicesOffered')} />
      <AskQuote onClick={() => onSelect('askQuote')} />
      {role === 'valued' && (
        <PlaceAnOrder onClick={() => onSelect('placeOrder')} />
      )}
      <AskAssistance onClick={() => onSelect('issueTicket')} />
      <AboutUs onClick={() => onSelect('aboutUs')} />
      <FAQs onClick={() => onSelect('faqs')} />
    </div>
  );
};

export default ChatCards;
