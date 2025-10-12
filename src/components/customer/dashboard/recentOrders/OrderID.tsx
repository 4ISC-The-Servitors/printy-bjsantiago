import React from 'react';
import { Text } from '../../../shared';

interface OrderIDProps {
  id: string;
  displayId?: string;
}

const OrderID: React.FC<OrderIDProps> = ({ id, displayId }) => (
  <Text variant="p" size="base" color="muted" weight="medium" className="leading-6">
    {displayId || id}
  </Text>
);

export default OrderID;


