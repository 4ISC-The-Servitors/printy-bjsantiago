import React from 'react';
import { Modal, Text, Button } from '../../../shared';
import { X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between p-6 pb-4">
          <Text variant="h3" size="lg" weight="semibold">
            Confirm Logout
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 pb-4">
          <Text variant="p">
            Are you sure you want to log out? You'll need to sign in again to
            access your account.
          </Text>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="error" onClick={onConfirm}>
            Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;


