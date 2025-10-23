import React from 'react';
import { Button } from '@shared/components';
import { useResponsiveButton } from '@shared/hooks/ui';

interface TrackTicketButtonProps {
  inquiryId: string;
  subject: string;
  status: string;
}

const TrackTicketButton: React.FC<TrackTicketButtonProps> = ({ inquiryId, subject, status }) => {
  const { getChatButtonClasses } = useResponsiveButton();
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
    <Button variant="primary" className={getChatButtonClasses('sm')} threeD onClick={onClick}>
      Track Ticket
    </Button>
  );
};

export default TrackTicketButton;
