import React, { useState } from 'react';
import { Modal, Button, Text, Card } from '../index';
import { X } from 'lucide-react';

const ModalShowcase: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [largeModalOpen, setLargeModalOpen] = useState(false);

  const handleConfirmAction = () => {
    setConfirmModalOpen(false);
    // Simulate action
    console.log('Action confirmed!');
  };

  return (
    <div className="space-y-6">
      <div>
        <Text
          variant="h2"
          size="2xl"
          weight="semibold"
          className="text-neutral-900 mb-2"
        >
          Modal Component
        </Text>
        <Text variant="p" color="muted" className="mb-6">
          A flexible modal component using the compound component pattern.
          Perfect for confirmations, forms, and content overlays.
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Modal */}
        <Card className="p-6">
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">
            Basic Modal
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-4">
            Simple modal with header, body, and footer
          </Text>
          <Button onClick={() => setIsOpen(true)} variant="primary" threeD>
            Open Basic Modal
          </Button>
        </Card>

        {/* Confirmation Modal */}
        <Card className="p-6">
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">
            Confirmation Modal
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-4">
            Perfect for confirming critical actions like logout
          </Text>
          <Button
            onClick={() => setConfirmModalOpen(true)}
            variant="error"
            threeD
          >
            Show Confirmation
          </Button>
        </Card>

        {/* Large Modal */}
        <Card className="p-6">
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">
            Large Modal
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-4">
            Modal with larger size for complex content
          </Text>
          <Button
            onClick={() => setLargeModalOpen(true)}
            variant="secondary"
            threeD
          >
            Open Large Modal
          </Button>
        </Card>
      </div>

      {/* Basic Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Card>
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="xl" weight="semibold">
              Basic Modal Example
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p" className="mb-4">
              This is a basic modal that demonstrates the compound component
              pattern. You can use it for various purposes like forms,
              confirmations, or content display.
            </Text>
            <Text variant="p" color="muted">
              The modal automatically handles keyboard navigation (ESC to close)
              and backdrop clicks.
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" threeD onClick={() => setIsOpen(false)}>
              Save Changes
            </Button>
          </div>
        </Card>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        size="sm"
      >
        <Card>
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="lg" weight="semibold">
              Confirm Action
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p">
              Are you sure you want to perform this action? This cannot be
              undone.
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button variant="ghost" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="error" threeD onClick={handleConfirmAction}>
              Confirm Action
            </Button>
          </div>
        </Card>
      </Modal>

      {/* Large Modal */}
      <Modal
        isOpen={largeModalOpen}
        onClose={() => setLargeModalOpen(false)}
        size="lg"
      >
        <Card>
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="xl" weight="semibold">
              Large Modal Example
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLargeModalOpen(false)}
              className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pb-4">
            <div className="space-y-4">
              <Text variant="p">
                This is a larger modal that can accommodate more complex
                content, forms, or detailed information displays.
              </Text>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Text variant="h4" size="lg" weight="semibold">
                    Features
                  </Text>
                  <ul className="space-y-1 text-sm text-neutral-600">
                    <li>• Compound component pattern</li>
                    <li>• Multiple size options</li>
                    <li>• Keyboard navigation</li>
                    <li>• Backdrop click to close</li>
                    <li>• Portal rendering</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Text variant="h4" size="lg" weight="semibold">
                    Usage
                  </Text>
                  <ul className="space-y-1 text-sm text-neutral-600">
                    <li>• Confirmation dialogs</li>
                    <li>• Form overlays</li>
                    <li>• Content previews</li>
                    <li>• Settings panels</li>
                    <li>• Error displays</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button variant="ghost" onClick={() => setLargeModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              threeD
              onClick={() => setLargeModalOpen(false)}
            >
              Apply Changes
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
};

export default ModalShowcase;
