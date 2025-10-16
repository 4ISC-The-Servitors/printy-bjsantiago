import React from 'react';
import { Button } from '@shared/components';

interface TrackTicketButtonProps {
  inquiryId: string;
  subject: string;
}

const TrackTicketButton: React.FC<TrackTicketButtonProps> = ({ inquiryId, subject }) => {
  const onClick = () => {
    const event = new CustomEvent('customer-open-ticket-chat', {
      detail: { inquiryId, subject },
    });
    window.dispatchEvent(event);
  };
  
  return (
    <Button variant="primary" size="sm" threeD onClick={onClick}>
      Track Ticket
    </Button>
  );
};

export default TrackTicketButton;
