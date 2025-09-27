import React from 'react';
import { Button } from '../../../shared';

interface PayNowButtonProps {
  orderId: string;
}

const PayNowButton: React.FC<PayNowButtonProps> = ({ orderId }) => {
  const onClick = () => {
    const event = new CustomEvent('customer-open-payment-chat', {
      detail: { orderId },
    });
    window.dispatchEvent(event);
  };
  return (
    <Button variant="primary" size="sm" threeD onClick={onClick}>
      Pay Now
    </Button>
  );
};

export default PayNowButton;


