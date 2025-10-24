import React from 'react';
import { Button } from '@shared/components';

interface ViewAllChatProps {
  onClick: () => void;
}

const ViewAllChat: React.FC<ViewAllChatProps> = ({ onClick }) => (
  <Button
    variant="ghost"
    className="device-btn-tertiary text-neutral-500 hover:text-neutral-700"
    onClick={onClick}
  >
    View all
  </Button>
);

export default ViewAllChat;
