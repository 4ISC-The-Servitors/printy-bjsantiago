import React from 'react';
import { Button } from '../../../shared';

interface TrackQuoteButtonProps {
  conversationId: string;
  subject: string;
}

const TrackQuoteButton: React.FC<TrackQuoteButtonProps> = ({ conversationId, subject }) => {
  const onClick = () => {
    // Create custom event to open quote conversation in chat
    const event = new CustomEvent('customer-open-quote-chat', {
      detail: { conversationId, subject },
    });
    window.dispatchEvent(event);
  };
  
  return (
    <Button variant="primary" size="sm" threeD onClick={onClick}>
      Track Quote
    </Button>
  );
};

export default TrackQuoteButton;
