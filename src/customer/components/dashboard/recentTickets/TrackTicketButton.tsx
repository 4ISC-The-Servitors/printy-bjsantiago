import React from 'react';
import { Button } from '@shared/components';

interface TrackTicketButtonProps {
  inquiryId: string;
  subject: string;
  status: string;
}

const TrackTicketButton: React.FC<TrackTicketButtonProps> = ({ inquiryId, subject, status }) => {
  // Hide button if ticket is resolved or closed
  if (status === 'resolved' || status === 'closed') {
    return null;
  }

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
