import React from 'react';
import ServicesOffered from './ServicesOffered';
import PlaceAnOrder from './PlaceAnOrder';
import AskAssistance from './AskAssistance';
import TrackATicket from './TrackATicket';
import AboutUs from './AboutUs';
import FAQs from './FAQs';

export interface ChatCardsProps {
  onSelect: (key: string) => void;
}

const ChatCards: React.FC<ChatCardsProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ServicesOffered onClick={() => onSelect('servicesOffered')} />
      <PlaceAnOrder onClick={() => onSelect('placeOrder')} />
      <AskAssistance onClick={() => onSelect('issueTicket')} />
      <TrackATicket onClick={() => onSelect('trackTicket')} />
      <AboutUs onClick={() => onSelect('aboutUs')} />
      <FAQs onClick={() => onSelect('faqs')} />
    </div>
  );
};

export default ChatCards;


