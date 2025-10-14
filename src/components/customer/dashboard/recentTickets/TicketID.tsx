import React from 'react';
import { Text } from '../../../shared';

interface TicketIDProps {
  id: string;
  displayId?: string;
}

const TicketID: React.FC<TicketIDProps> = ({ id, displayId }) => (
  <Text variant="p" size="base" color="muted">
    {displayId || id}
  </Text>
);

export default TicketID;


