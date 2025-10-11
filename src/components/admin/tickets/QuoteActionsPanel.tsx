import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Text, Modal, Input } from '../../shared';
import { useQuoteActions } from '../../../hooks/api/useQuoteActions';

type Props = {
  inquiryId?: string;
  quoteId?: string;
  valued?: boolean; // determines initial order status on Place Order
  supabaseUrl?: string;
  accessToken?: string;
  onSpecChange?: (spec: Record<string, unknown>) => void;
};

const QuoteActionsPanel: React.FC<Props> = ({
  inquiryId,
  quoteId,
  valued = false,
  supabaseUrl,
  accessToken,
  onSpecChange,
}) => {
  const {
    isLoading,
    error,
    showSpecs,
    editSpecs,
    proposeQuote,
    sendForApproval,
    placeOrder,
  } = useQuoteActions(supabaseUrl, accessToken);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | undefined>(
    quoteId
  );
  const [spec, setSpec] = useState<Record<string, unknown>>({});
  const [price, setPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isEditOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (quoteId) setCurrentQuoteId(quoteId);
  }, [quoteId]);

  const specPretty = useMemo(() => JSON.stringify(spec || {}, null, 2), [spec]);

  const handleShow = async () => {
    const res = await showSpecs({
      inquiry_id: inquiryId,
      quote_id: currentQuoteId,
    });
    setCurrentQuoteId(res.quote_id);
    setSpec(res.spec || {});
    onSpecChange?.(res.spec || {});
  };

  const handleOpenEdit = async () => {
    if (!currentQuoteId && !inquiryId) await handleShow();
    setEditText(JSON.stringify(spec || {}, null, 2));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    let patch: Record<string, unknown> = {};
    try {
      patch = JSON.parse(editText || '{}');
    } catch (e) {
      alert('Invalid JSON');
      return;
    }
    await editSpecs({
      quote_id: currentQuoteId,
      inquiry_id: inquiryId,
      spec_patch: patch,
    });
    await handleShow();
    setEditOpen(false);
  };

  const handlePropose = async () => {
    if (!currentQuoteId && !inquiryId) await handleShow();
    const numeric = Number(price);
    if (!Number.isFinite(numeric)) {
      alert('Enter a valid number for quote');
      return;
    }
    await proposeQuote({
      quote_id: currentQuoteId as string,
      quoted_price: numeric,
      notes: notes || undefined,
    });
    await handleShow();
  };

  const handleSendApproval = async () => {
    if (!currentQuoteId && !inquiryId) await handleShow();
    await sendForApproval({ quote_id: currentQuoteId as string });
  };

  const handlePlaceOrder = async () => {
    if (!currentQuoteId && !inquiryId) await handleShow();
    const res = await placeOrder({
      quote_id: currentQuoteId as string,
      valued: !!valued,
    });
    alert(`Order created: ${res.order_id} (${res.order_status})`);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="h4" size="sm" weight="semibold">
          Quote Actions
        </Text>
        {isLoading && (
          <Text variant="p" size="xs" color="muted">
            Loading…
          </Text>
        )}
      </div>
      {error && (
        <Text variant="p" size="xs" color="error">
          {error}
        </Text>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleShow}>
          Show Product Specs
        </Button>
        <Button size="sm" variant="secondary" onClick={handleOpenEdit}>
          Edit Product Specs
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSendApproval}>
          Send for Approval
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder="Proposed Quote (price)"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={handlePropose}>
          Propose Quote
        </Button>
      </div>
      <Input
        placeholder="Notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <div>
        <Text variant="p" size="xs" color="muted">
          Current Spec
        </Text>
        <pre className="mt-1 text-xs bg-neutral-50 p-2 rounded border border-neutral-200 overflow-x-auto">
          {specPretty}
        </pre>
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="success" onClick={handlePlaceOrder}>
          Place Order
        </Button>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setEditOpen(false)}>
        <div className="p-4 space-y-3">
          <Text variant="h4" size="sm" weight="semibold">
            Edit Product Specs (JSON)
          </Text>
          <textarea
            className="w-full h-64 p-2 text-sm border border-neutral-300 rounded"
            value={editText}
            onChange={e => setEditText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default QuoteActionsPanel;
