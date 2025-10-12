import React from 'react';
import { Text } from '../../../shared';

interface QuoteIDProps {
  id: string;
}

const QuoteID: React.FC<QuoteIDProps> = ({ id }) => {
  return (
    <div>
      <Text variant="p" size="sm" weight="medium" color="muted" className="mb-1">
        Quote ID:
      </Text>
      <Text variant="p" size="sm" className="font-mono">
        {id}
      </Text>
    </div>
  );
};

export default QuoteID;
