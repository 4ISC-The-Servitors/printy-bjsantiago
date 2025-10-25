import React from 'react';
import { Button } from '@shared/components';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onClick: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <Button
      variant="accent"
      className="w-full justify-start"
      threeD
      onClick={handleClick}
    >
      <LogOut className="w-4 h-4 mr-2" /> Logout
    </Button>
  );
};

export default LogoutButton;
