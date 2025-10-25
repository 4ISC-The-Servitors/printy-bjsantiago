import React from 'react';
import { Button } from '@shared/components';
import { MessageSquare } from 'lucide-react';

interface TrackTicketButtonProps {
  inquiryId: string;
  subject: string;
  status: string;
  displayId?: string;
}

const TrackTicketButton: React.FC<TrackTicketButtonProps> = ({
  inquiryId,
  subject,
  status,
  displayId,
}) => {
  // Hide button if ticket is resolved or closed
  if (status === 'resolved' || status === 'closed') {
    return null;
  }

  const onClick = () => {
    const event = new CustomEvent('customer-open-ticket-chat', {
      detail: { inquiryId, subject, displayId },
    });
    window.dispatchEvent(event);
  };

  return (
    <Button
      variant="primary"
      className="device-btn-primary"
      threeD
      onClick={onClick}
    >
      <MessageSquare className="w-4 h-4" />
      Track Ticket
    </Button>
  );
};

export default TrackTicketButton;
