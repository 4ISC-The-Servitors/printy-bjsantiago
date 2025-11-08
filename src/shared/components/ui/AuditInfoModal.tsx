import React from 'react';
import { Modal, Text, Button } from '@shared/components';
import { X } from 'lucide-react';

interface AuditInfo {
  created_at?: string | null;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

interface AuditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | null;
  auditInfo: AuditInfo;
}

const AuditInfoModal: React.FC<AuditInfoModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  auditInfo,
}) => {
  const { created_at, created_by, updated_at, updated_by } = auditInfo;

  const hasAnyInfo = created_at || created_by || updated_at || updated_by;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
        <div className="device-spacing-component pt-4 pb-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
            <Text
              variant="h3"
              size="xl"
              weight="semibold"
              className="flex-1 min-w-0"
              truncate
            >
              {title}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-neutral-100 flex-shrink-0 touch-target"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          {description && (
            <Text variant="p" size="base" color="muted" className="break-words">
              • {description}
            </Text>
          )}
        </div>

        <div className="device-spacing-component pb-4">
          {hasAnyInfo ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Created Information Container */}
              {(created_at || created_by) && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                  <Text
                    variant="p"
                    size="sm"
                    weight="semibold"
                    color="muted"
                    className="mb-2 sm:mb-3 uppercase tracking-wide"
                  >
                    Created
                  </Text>
                  <div className="space-y-2 sm:space-y-3">
                    {created_at && (
                      <div className="space-y-1">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Date:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {created_at}
                        </Text>
                      </div>
                    )}
                    {created_by && (
                      <div className="space-y-1">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          By:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {created_by}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Updated Information Container */}
              {(updated_at || updated_by) && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                  <Text
                    variant="p"
                    size="sm"
                    weight="semibold"
                    color="muted"
                    className="mb-2 sm:mb-3 uppercase tracking-wide"
                  >
                    Updated
                  </Text>
                  <div className="space-y-2 sm:space-y-3">
                    {updated_at && (
                      <div className="space-y-1">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Date:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {updated_at}
                        </Text>
                      </div>
                    )}
                    {updated_by && (
                      <div className="space-y-1">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          By:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {updated_by}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
              <Text variant="p" size="base" color="muted">
                No audit information available.
              </Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuditInfoModal;
