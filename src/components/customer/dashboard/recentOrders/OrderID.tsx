import React from 'react';
import { Text } from '../../../shared';

interface OrderIDProps {
  id: string;
}

const OrderID: React.FC<OrderIDProps> = ({ id }) => (
  <Text variant="p" size="base" color="muted" weight="medium" className="leading-6">
    {id}
  </Text>
);

export default OrderID;


