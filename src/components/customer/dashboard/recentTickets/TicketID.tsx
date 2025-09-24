import React from 'react';
import { Text } from '../../../shared';

interface TicketIDProps {
  id: string;
}

const TicketID: React.FC<TicketIDProps> = ({ id }) => (
  <Text variant="p" size="base" color="muted">
    {id}
  </Text>
);

export default TicketID;


