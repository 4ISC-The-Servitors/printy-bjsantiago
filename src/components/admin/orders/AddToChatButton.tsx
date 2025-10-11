import React from 'react';
import { Button } from '../../shared';
import { Plus } from 'lucide-react';

interface AddToChatButtonProps {
  count: number;
  onClick: () => void;
}

export const AddToChatButton: React.FC<AddToChatButtonProps> = ({
  count,
  onClick,
}) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <Button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
      >
        <Plus className="h-5 w-5" />
        Add to Chat ({count})
      </Button>
    </div>
  );
};

export default AddToChatButton;
