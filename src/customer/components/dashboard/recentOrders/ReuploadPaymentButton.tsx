import React from 'react';
import { Button } from '@shared/components';
import { useResponsiveButton } from '@shared/hooks/ui';

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
  const { getChatButtonClasses } = useResponsiveButton();
  const onClick = () => {
    const event = new CustomEvent('customer-open-reupload-payment-chat', {
      detail: { orderId, displayId, total },
    });
    window.dispatchEvent(event);
  };
  return (
    <Button variant="primary" className={getChatButtonClasses('sm')} threeD onClick={onClick}>
      Reupload Payment
    </Button>
  );
};

export default ReuploadPaymentButton;
