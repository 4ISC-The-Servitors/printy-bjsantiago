import React from 'react';
import { Button } from '@shared/components';

interface ReuploadPaymentButtonProps {
  orderId: string;
  displayId?: string;
  total?: string;
}

const ReuploadPaymentButton: React.FC<ReuploadPaymentButtonProps> = ({
  orderId,
  displayId,
  total,
}) => {
  const onClick = () => {
    const event = new CustomEvent('customer-open-reupload-payment-chat', {
      detail: { orderId, displayId, total },
    });
    window.dispatchEvent(event);
  };
  return (
    <Button variant="primary" size="sm" threeD onClick={onClick}>
      Reupload Payment
    </Button>
  );
};

export default ReuploadPaymentButton;
