import React from 'react';
import { Button } from '@shared/components';
import { CreditCard } from 'lucide-react';

interface PayNowButtonProps {
  orderId: string;
  displayId?: string;
  total?: string;
}

const PayNowButton: React.FC<PayNowButtonProps> = ({
  orderId,
  displayId,
  total,
}) => {
  const onClick = () => {
    const event = new CustomEvent('customer-open-payment-chat', {
      detail: { orderId, displayId, total },
    });
    window.dispatchEvent(event);
  };
  return (
    <Button
      variant="primary"
      className="device-btn-primary"
      threeD
      onClick={onClick}
    >
      <CreditCard className="w-4 h-4" />
      Pay Now
    </Button>
  );
};

export default PayNowButton;
