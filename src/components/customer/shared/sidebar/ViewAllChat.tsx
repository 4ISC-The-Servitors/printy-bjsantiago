import React from 'react';
import { Button } from '../../../shared';

interface ViewAllChatProps {
  onClick: () => void;
}

const ViewAllChat: React.FC<ViewAllChatProps> = ({ onClick }) => (
  <Button
    variant="ghost"
    size="sm"
    className="text-neutral-500 hover:text-neutral-700 h-7 px-2"
    onClick={onClick}
  >
    View all
  </Button>
);

export default ViewAllChat;


