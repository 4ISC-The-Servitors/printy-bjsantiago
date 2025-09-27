import React from 'react';
import { Text } from '../../../shared';

interface TicketSubjectProps {
  subject: string;
}

const TicketSubject: React.FC<TicketSubjectProps> = ({ subject }) => (
  <Text variant="p" size="base" className="font-semibold">
    {subject}
  </Text>
);

export default TicketSubject;


