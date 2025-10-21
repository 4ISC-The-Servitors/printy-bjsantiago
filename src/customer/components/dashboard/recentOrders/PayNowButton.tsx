import React from 'react';
import { Button } from '@shared/components';

interface PayNowButtonProps {
  orderId: string;
  displayId?: string;
  total?: string;
}

const PayNowButton: React.FC<PayNowButtonProps> = ({ orderId, displayId, total }) => {
  const onClick = () => {
    const event = new CustomEvent('customer-open-payment-chat', {
      detail: { orderId, displayId, total },
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


