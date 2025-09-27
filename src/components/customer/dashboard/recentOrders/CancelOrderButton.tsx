import React from 'react';
import { Button } from '../../../shared';

interface CancelOrderButtonProps {
  orderId: string;
  orderStatus: string;
}

const CancelOrderButton: React.FC<CancelOrderButtonProps> = ({ orderId, orderStatus }) => {
  const onClick = () => {
    const event = new CustomEvent('customer-open-cancel-chat', {
      detail: {
        orderId,
        orderStatus,
      },
    });
    window.dispatchEvent(event);
  };
  return (
    <Button variant="ghost" size="sm" threeD onClick={onClick}>
      Cancel Order
    </Button>
  );
};

export default CancelOrderButton;


