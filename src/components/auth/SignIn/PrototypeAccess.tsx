import React from 'react';
import { Button, Text } from '../../shared';

interface Props {
  onNavigateAdmin: () => void;
}

const PrototypeAccess: React.FC<Props> = ({ onNavigateAdmin }) => (
  <div className="mt-6 pt-6 border-t border-neutral-200">
    <Text variant="p" size="sm" color="muted" className="text-center mb-4">
      Prototype Access (Remove before production)
    </Text>
    <Button
      variant="secondary"
      size="sm"
      onClick={onNavigateAdmin}
      className="w-full"
    >
      Quick Admin Access
    </Button>
  </div>
);

export default PrototypeAccess;
