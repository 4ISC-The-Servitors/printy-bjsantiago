import React from 'react';
import { Button } from '@shared/components';
import { MessageSquare } from 'lucide-react';

interface TrackQuoteButtonProps {
  conversationId: string;
  subject: string;
  status: string;
  displayId?: string;
}

const TrackQuoteButton: React.FC<TrackQuoteButtonProps> = ({
  conversationId,
  subject,
  status,
  displayId,
}) => {
  // Hide button if quote is accepted, rejected, or still active (no proposal sent yet)
  if (status === 'accepted' || status === 'rejected' || status === 'active' || status === 'ended') {
    return null;
  }

  const onClick = () => {
    // Create custom event to open quote conversation in chat
    const event = new CustomEvent('customer-open-quote-chat', {
      detail: { conversationId, subject, displayId },
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
      Track Quote
    </Button>
  );
};

export default TrackQuoteButton;
