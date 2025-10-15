import React from 'react';
import { Text } from '../../../shared';

interface QuoteSubjectProps {
  subject: string;
}

const QuoteSubject: React.FC<QuoteSubjectProps> = ({ subject }) => {
  return (
    <div>
      <Text variant="p" size="sm" weight="medium" color="muted" className="mb-1">
        Quote Request:
      </Text>
      <Text variant="p" size="base" weight="semibold" className="truncate">
        {subject}
      </Text>
    </div>
  );
};

export default QuoteSubject;
