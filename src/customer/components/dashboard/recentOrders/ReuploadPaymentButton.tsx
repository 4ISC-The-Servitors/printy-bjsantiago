import React from 'react';
import { Button } from '@shared/components';
import { Upload } from 'lucide-react';

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
    <Button
      variant="primary"
      className="device-btn-primary"
      threeD
      onClick={onClick}
    >
      <Upload className="w-4 h-4" />
      Reupload Payment
    </Button>
  );
};

export default ReuploadPaymentButton;
