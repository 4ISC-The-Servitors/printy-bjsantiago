import React from 'react';
import { Text } from '@shared/components';

interface QuoteIDProps {
  id: string;
  displayId?: string;
}

const QuoteID: React.FC<QuoteIDProps> = ({ id, displayId }) => {
  return (
    <div>
      <Text
        variant="p"
        size="sm"
        weight="medium"
        color="muted"
        className="mb-1"
      >
        Quote ID:
      </Text>
      <Text variant="p" size="sm" className="font-mono">
        {displayId || id}
      </Text>
    </div>
  );
};

export default QuoteID;
