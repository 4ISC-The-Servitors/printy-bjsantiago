import React from 'react';
import { Button } from '../../../shared';
import { User } from 'lucide-react';

interface AccountButtonProps {
  onClick: () => void;
}

const AccountButton: React.FC<AccountButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="secondary"
      className="w-full justify-start"
      threeD
      onClick={onClick}
    >
      <User className="w-4 h-4 mr-2" /> Account
    </Button>
  );
};

export default AccountButton;


