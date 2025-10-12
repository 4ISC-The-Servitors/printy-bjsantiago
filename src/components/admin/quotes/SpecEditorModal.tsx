// src/components/admin/quotes/SpecEditorModal.tsx

import React, { useState } from 'react';
import { Modal, Text } from '../../shared';
import SpecEditorForm, { type SpecFormData } from './SpecEditorForm';
import { createProposal, sendProposalToCustomer } from '../../../features/api/quoteApi';
import { useToast } from '../../../lib/useToast';

interface SpecEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  specId: string;
  adminId: string;
  initialData?: SpecFormData;
  onProposalSent?: (proposalId: string) => void;
}

const SpecEditorModal: React.FC<SpecEditorModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  specId,
  adminId,
  initialData,
  onProposalSent
}) => {
  const [loading, setLoading] = useState(false);
  const [, toastMethods] = useToast();

  const handleSubmit = async (data: SpecFormData) => {
    try {
      setLoading(true);

      // Create proposal
      const proposalId = await createProposal({
        conversationId,
        specId,
        adminId,
        specFinal: {
          product_name: data.product_name,
          service_code: data.service_code,
          category: data.category,
          description: data.description,
          size: data.size,
          materials: data.materials,
          color: data.color,
          finishing: data.finishing,
          others: data.others,
          quantity: data.quantity,
          artwork: data.artwork,
          deadline: data.deadline,
          notes: data.notes
        },
        quotedPrice: data.quoted_price,
        notes: data.admin_notes,
        validUntil: data.deadline ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined // 7 days from now
      });

      // Send proposal to customer
      await sendProposalToCustomer(proposalId);

      toastMethods.success(
        'Quote Sent',
        'The quote proposal has been sent to the customer.'
      );

      onProposalSent?.(proposalId);
      onClose();
    } catch (error) {
      console.error('Error creating/sending proposal:', error);
      toastMethods.error(
        'Error',
        'Failed to send quote proposal. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="xl">
      <div className="p-6">
        <div className="mb-6">
          <Text variant="h2" size="2xl" weight="bold" className="mb-2">
            Edit Quote Specifications
          </Text>
          <Text variant="p" size="sm" color="muted">
            Review and edit the AI-generated specifications, then add pricing before sending to customer.
          </Text>
        </div>

        <SpecEditorForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </Modal>
  );
};

export default SpecEditorModal;
