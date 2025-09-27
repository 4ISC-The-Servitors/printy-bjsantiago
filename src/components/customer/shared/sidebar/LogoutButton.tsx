import React from 'react';
import { Button } from '../../../shared';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onClick: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="accent"
      className="w-full justify-start"
      threeD
      onClick={onClick}
    >
      <LogOut className="w-4 h-4 mr-2" /> Logout
    </Button>
  );
};

export default LogoutButton;


